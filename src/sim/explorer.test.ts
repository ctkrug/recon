import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";
import { floodFillReachable } from "./mapgen";
import {
  coverage,
  createExploration,
  ExplorationState,
  pause,
  restart,
  start,
  step,
} from "./explorer";

describe("createExploration", () => {
  it("starts idle with only the robot's start cell known", () => {
    const state = createExploration("fixture-seed", 16, 12, 3);
    expect(state.status).toBe("idle");
    expect(state.steps).toBe(0);
    expect(state.belief.get(state.robot.x, state.robot.y)).toBe(Cell.Free);
    expect(state.belief.countByState(Cell.Free)).toBe(1);
  });

  it("is deterministic for the same seed", () => {
    const a = createExploration("same-seed", 16, 12, 3);
    const b = createExploration("same-seed", 16, 12, 3);
    expect(a.robot).toEqual(b.robot);
    expect(a.reachableCells.size).toBe(b.reachableCells.size);
  });

  it("handles a degenerate 1x1 map without throwing and finishes instantly", () => {
    let state = start(createExploration("degenerate", 1, 1, 3));
    let iterations = 0;
    while (state.status === "running" && iterations < 100) {
      state = step(state);
      iterations++;
    }
    expect(state.status).toBe("done");
    expect(coverage(state)).toBeCloseTo(1);
  });
});

describe("step", () => {
  it("does nothing while status is idle", () => {
    const state = createExploration("idle-check", 16, 12, 3);
    const next = step(state);
    expect(next).toBe(state);
  });

  it("reveals fog and moves the robot once running", () => {
    let state = start(createExploration("movement-check", 16, 12, 3));
    const before = state.belief.countByState(Cell.Unknown);
    state = step(state);
    expect(state.belief.countByState(Cell.Unknown)).toBeLessThan(before);
    expect(state.steps).toBe(1);
  });

  it("explores a small map to completion with full coverage", () => {
    let state = start(createExploration("explorer-fixture", 16, 12, 3));
    let iterations = 0;
    while (state.status === "running" && iterations < 5000) {
      state = step(state);
      iterations++;
    }
    expect(state.status).toBe("done");
    expect(coverage(state)).toBeCloseTo(1);
  });

  it("finishes instantly when the only frontier cell is the robot's own cell", () => {
    // A zero-range sensor reveals nothing beyond the robot's own cell, so
    // after the sweep the robot's cell is Free-bordering-Unknown (a
    // frontier) but is itself the only candidate target — planNextFrontier
    // must reject it (no self-targeting) and report no plan, not loop.
    const groundTruth = new OccupancyGrid(5, 5);
    for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) groundTruth.set(x, y, Cell.Free);
    const robot = { x: 2, y: 2 };
    const belief = new OccupancyGrid(5, 5);

    const state: ExplorationState = {
      seed: "self-frontier",
      sensorRange: 0,
      groundTruth,
      belief,
      reachableCells: floodFillReachable(groundTruth, robot),
      robot,
      path: [],
      steps: 0,
      status: "running",
    };

    const next = step(state);
    expect(next.status).toBe("done");
    expect(next.steps).toBe(0);
  });
});

describe("coverage", () => {
  it("matches a hand-checked value on a small fixture map", () => {
    const groundTruth = new OccupancyGrid(3, 3);
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++) groundTruth.set(x, y, Cell.Free);

    const robotStart = { x: 1, y: 1 };
    const reachableCells = floodFillReachable(groundTruth, robotStart); // all 9 cells

    const belief = new OccupancyGrid(3, 3);
    belief.set(1, 1, Cell.Free);
    belief.set(0, 1, Cell.Free);
    belief.set(2, 1, Cell.Free);
    belief.set(1, 0, Cell.Free);
    // remaining 5 cells stay Unknown

    const state: ExplorationState = {
      seed: "fixture",
      sensorRange: 1,
      groundTruth,
      belief,
      reachableCells,
      robot: robotStart,
      path: [],
      steps: 0,
      status: "idle",
    };

    expect(reachableCells.size).toBe(9);
    expect(coverage(state)).toBeCloseTo(4 / 9);
  });

  it("returns 1 when there are no reachable cells at all", () => {
    const groundTruth = new OccupancyGrid(3, 3);
    const belief = new OccupancyGrid(3, 3);
    const state: ExplorationState = {
      seed: "empty",
      sensorRange: 1,
      groundTruth,
      belief,
      reachableCells: new Set(),
      robot: { x: 0, y: 0 },
      path: [],
      steps: 0,
      status: "idle",
    };
    expect(coverage(state)).toBe(1);
  });

  it("property: always stays within [0, 1] regardless of how much of the reachable set is known", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 12 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 144 }),
        (width, height, knownFlags) => {
          const groundTruth = new OccupancyGrid(width, height);
          for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) groundTruth.set(x, y, Cell.Free);
          const reachableCells = floodFillReachable(groundTruth, { x: 0, y: 0 });

          const belief = new OccupancyGrid(width, height);
          const keys = [...reachableCells];
          keys.forEach((key, i) => {
            if (knownFlags[i % knownFlags.length]) {
              const [x, y] = key.split(",").map(Number);
              belief.set(x, y, Cell.Free);
            }
          });

          const state: ExplorationState = {
            seed: "bounds-check",
            sensorRange: 1,
            groundTruth,
            belief,
            reachableCells,
            robot: { x: 0, y: 0 },
            path: [],
            steps: 0,
            status: "idle",
          };

          const c = coverage(state);
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});

describe("start/pause/restart", () => {
  it("start transitions idle to running, and is a no-op once running", () => {
    const idle = createExploration("lifecycle", 16, 12, 3);
    const running = start(idle);
    expect(running.status).toBe("running");
    expect(start(running)).toBe(running);
  });

  it("pause on an idle (never-started) exploration is a no-op", () => {
    const idle = createExploration("idle-pause", 16, 12, 3);
    expect(pause(idle)).toBe(idle);
  });

  it("pause on an already-done exploration is a no-op", () => {
    let state = start(createExploration("done-pause", 16, 12, 3));
    let iterations = 0;
    while (state.status === "running" && iterations < 5000) {
      state = step(state);
      iterations++;
    }
    expect(state.status).toBe("done");
    expect(pause(state)).toBe(state);
  });

  it("pause halts a running exploration and preserves belief state", () => {
    let state = start(createExploration("pause-check", 16, 12, 3));
    state = step(state);
    const beliefKnownBefore = state.belief.countByState(Cell.Free);
    const paused = pause(state);
    expect(paused.status).toBe("paused");
    expect(paused.belief.countByState(Cell.Free)).toBe(beliefKnownBefore);
    // stepping a paused state is a no-op
    expect(step(paused)).toBe(paused);
  });

  it("resume (start on a paused state) continues from where it left off", () => {
    let state = start(createExploration("resume-check", 16, 12, 3));
    state = step(state);
    const stepsBeforePause = state.steps;
    state = pause(state);
    state = start(state);
    expect(state.status).toBe("running");
    state = step(state);
    expect(state.steps).toBe(stepsBeforePause + 1);
  });

  it("restart clears progress but reuses the current seed by default", () => {
    const original = createExploration("restart-check", 16, 12, 3);
    let state = start(original);
    state = step(state);
    state = step(state);
    const restarted = restart(state);
    expect(restarted.seed).toBe("restart-check");
    expect(restarted.status).toBe("idle");
    expect(restarted.steps).toBe(0);
    expect(restarted.robot).toEqual(original.robot); // same seed -> same start cell
  });

  it("restart with an explicit seed produces a different map", () => {
    const state = start(createExploration("original-seed", 16, 12, 3));
    const restarted = restart(state, "brand-new-seed");
    expect(restarted.seed).toBe("brand-new-seed");
    expect(restarted.status).toBe("idle");
  });
});
