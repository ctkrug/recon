import { Cell, OccupancyGrid } from "./grid";

export type Point = { x: number; y: number };

const FOUR_NEIGHBORS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

/** A frontier cell is Free and borders at least one Unknown cell — the
 * boundary between what the robot has mapped and what it hasn't. */
export function isFrontierCell(belief: OccupancyGrid, x: number, y: number): boolean {
  if (belief.get(x, y) !== Cell.Free) return false;
  return FOUR_NEIGHBORS.some(({ dx, dy }) => belief.get(x + dx, y + dy) === Cell.Unknown);
}

/** Scans the entire belief grid for frontier cells. */
export function findFrontierCells(belief: OccupancyGrid): Point[] {
  const cells: Point[] = [];
  for (let y = 0; y < belief.height; y++) {
    for (let x = 0; x < belief.width; x++) {
      if (isFrontierCell(belief, x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

/** Groups frontier cells into contiguous regions (8-connectivity) so a
 * cluster of adjacent frontier cells scores as one target, not many noisy
 * individual ones. */
export function clusterFrontiers(cells: Point[]): Point[][] {
  const cellSet = new Map<string, Point>();
  for (const c of cells) cellSet.set(`${c.x},${c.y}`, c);

  const visited = new Set<string>();
  const clusters: Point[][] = [];

  for (const cell of cells) {
    const key = `${cell.x},${cell.y}`;
    if (visited.has(key)) continue;

    const cluster: Point[] = [];
    const stack: Point[] = [cell];
    visited.add(key);

    while (stack.length > 0) {
      const current = stack.pop()!;
      cluster.push(current);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nKey = `${current.x + dx},${current.y + dy}`;
          const neighbor = cellSet.get(nKey);
          if (neighbor && !visited.has(nKey)) {
            visited.add(nKey);
            stack.push(neighbor);
          }
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function manhattanDistanceToNearest(cluster: Point[], from: Point): number {
  let min = Infinity;
  for (const cell of cluster) {
    const d = Math.abs(cell.x - from.x) + Math.abs(cell.y - from.y);
    if (d < min) min = d;
  }
  return min;
}

const SIZE_WEIGHT = 1;
const DISTANCE_WEIGHT = 0.5;

/** Scores a frontier region: bigger and closer regions score higher. Size
 * dominates for large regions; distance breaks ties between similarly-sized
 * ones so the robot doesn't trek across the map for a marginal gain. */
export function scoreFrontierRegion(cluster: Point[], robot: Point): number {
  const distance = manhattanDistanceToNearest(cluster, robot);
  return cluster.length * SIZE_WEIGHT - distance * DISTANCE_WEIGHT;
}

/** Picks the highest-scoring frontier cluster and returns the cell within it
 * nearest to the robot as the path-planning target. Returns null when there
 * are no frontiers left (exploration is complete). */
export function selectBestFrontierTarget(
  clusters: Point[][],
  robot: Point,
): Point | null {
  if (clusters.length === 0) return null;

  let best = clusters[0];
  let bestScore = scoreFrontierRegion(best, robot);
  for (let i = 1; i < clusters.length; i++) {
    const score = scoreFrontierRegion(clusters[i], robot);
    if (score > bestScore) {
      best = clusters[i];
      bestScore = score;
    }
  }

  let target = best[0];
  let targetDistance = Math.abs(target.x - robot.x) + Math.abs(target.y - robot.y);
  for (const cell of best) {
    const d = Math.abs(cell.x - robot.x) + Math.abs(cell.y - robot.y);
    if (d < targetDistance) {
      target = cell;
      targetDistance = d;
    }
  }
  return target;
}
