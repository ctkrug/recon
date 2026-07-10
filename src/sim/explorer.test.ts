import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";
import { floodFillReachable } from "./mapgen";
import { coverage, createExploration, ExplorationState, pause, restart, start, step } from "./explorer";

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
});

describe("coverage", () => {
  it("matches a hand-checked value on a small fixture map", () => {
    const groundTruth = new OccupancyGrid(3, 3);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) groundTruth.set(x, y, Cell.Free);

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
});

describe("start/pause/restart", () => {
  it("start transitions idle to running, and is a no-op once running", () => {
    const idle = createExploration("lifecycle", 16, 12, 3);
    const running = start(idle);
    expect(running.status).toBe("running");
    expect(start(running)).toBe(running);
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
