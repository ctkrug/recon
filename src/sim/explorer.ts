import { Cell, OccupancyGrid } from "./grid";
import { floodFillReachable, generateMap } from "./mapgen";
import { clusterFrontiers, findFrontierCells, Point, scoreFrontierRegion, selectBestFrontierTarget } from "./frontier";
import { findPath } from "./pathfind";
import { sweep } from "./sensor";

export type ExplorationStatus = "idle" | "running" | "paused" | "done";

export interface ExplorationState {
  seed: string;
  sensorRange: number;
  groundTruth: OccupancyGrid;
  belief: OccupancyGrid;
  /** Free cells reachable from the start, as `x,y` keys — the coverage denominator. */
  reachableCells: Set<string>;
  robot: Point;
  /** Remaining cells to walk toward the current frontier target, robot-first. */
  path: Point[];
  steps: number;
  status: ExplorationStatus;
}

/** Builds a fresh exploration: a seeded ground-truth map, an empty belief
 * grid except the robot's own start cell, and idle status — nothing moves
 * or reveals fog until `start()` is called. */
export function createExploration(
  seed: string,
  width: number,
  height: number,
  sensorRange: number,
): ExplorationState {
  const { groundTruth, start } = generateMap(width, height, seed);
  const reachableCells = floodFillReachable(groundTruth, start);

  const belief = new OccupancyGrid(width, height);
  belief.set(start.x, start.y, Cell.Free);

  return {
    seed,
    sensorRange,
    groundTruth,
    belief,
    reachableCells,
    robot: start,
    path: [],
    steps: 0,
    status: "idle",
  };
}

function planNextFrontier(
  belief: OccupancyGrid,
  robot: Point,
): { target: Point; path: Point[] } | null {
  const cells = findFrontierCells(belief);
  if (cells.length === 0) return null;

  const clusters = clusterFrontiers(cells);
  const ranked = [...clusters].sort(
    (a, b) => scoreFrontierRegion(b, robot) - scoreFrontierRegion(a, robot),
  );

  for (const cluster of ranked) {
    const target = selectBestFrontierTarget([cluster], robot);
    if (!target) continue;
    if (target.x === robot.x && target.y === robot.y) continue;

    const path = findPath(belief, robot, target);
    if (path && path.length > 1) return { target, path };
  }

  return null;
}

/** Advances the simulation by one tick: sweeps the sensor, then either
 * continues along the current path or (once it runs out) picks a new
 * frontier target and paths to it. Marks the run done once no reachable
 * frontier remains. A no-op unless `status` is "running". */
export function step(state: ExplorationState): ExplorationState {
  if (state.status !== "running") return state;

  sweep(state.groundTruth, state.belief, state.robot, state.sensorRange);

  let path = state.path;
  if (path.length <= 1) {
    const plan = planNextFrontier(state.belief, state.robot);
    if (!plan) {
      return { ...state, path: [], status: "done" };
    }
    path = plan.path;
  }

  const nextPosition = path[1] ?? path[0];
  return {
    ...state,
    robot: nextPosition,
    path: path.slice(1),
    steps: state.steps + 1,
  };
}

/** Coverage as known-reachable-cells / total-reachable-cells, matching the
 * denominator computed once at map generation. */
export function coverage(state: ExplorationState): number {
  if (state.reachableCells.size === 0) return 1;
  let known = 0;
  for (const cellKey of state.reachableCells) {
    const [x, y] = cellKey.split(",").map(Number);
    if (state.belief.get(x, y) === Cell.Free) known++;
  }
  return known / state.reachableCells.size;
}

export function start(state: ExplorationState): ExplorationState {
  if (state.status === "idle" || state.status === "paused") {
    return { ...state, status: "running" };
  }
  return state;
}

export function pause(state: ExplorationState): ExplorationState {
  if (state.status === "running") {
    return { ...state, status: "paused" };
  }
  return state;
}

/** Clears the occupancy grid and robot position but reuses the current seed
 * unless a new one is explicitly passed. */
export function restart(state: ExplorationState, seed?: string): ExplorationState {
  const width = state.groundTruth.width;
  const height = state.groundTruth.height;
  return createExploration(seed ?? state.seed, width, height, state.sensorRange);
}
