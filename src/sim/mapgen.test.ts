import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";
import { floodFillReachable, generateMap, smooth } from "./mapgen";

describe("generateMap", () => {
  it("produces an identical grid for the same seed and dimensions", () => {
    const a = generateMap(48, 32, "recon-seed");
    const b = generateMap(48, 32, "recon-seed");
    expect(a.start).toEqual(b.start);
    expect(a.reachableCount).toBe(b.reachableCount);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 48; x++) {
        expect(a.groundTruth.get(x, y)).toBe(b.groundTruth.get(x, y));
      }
    }
  });

  it("produces a different grid for a different seed", () => {
    const a = generateMap(48, 32, "seed-one");
    const b = generateMap(48, 32, "seed-two");
    let differences = 0;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 48; x++) {
        if (a.groundTruth.get(x, y) !== b.groundTruth.get(x, y)) differences++;
      }
    }
    expect(differences).toBeGreaterThan(0);
  });

  it("always places the start on a Free cell", () => {
    const { groundTruth, start } = generateMap(48, 32, "start-check");
    expect(groundTruth.get(start.x, start.y)).toBe(Cell.Free);
  });

  it("surrounds the map with a solid wall border", () => {
    const { groundTruth } = generateMap(20, 16, "border-check");
    for (let x = 0; x < 20; x++) {
      expect(groundTruth.get(x, 0)).toBe(Cell.Wall);
      expect(groundTruth.get(x, 15)).toBe(Cell.Wall);
    }
    for (let y = 0; y < 16; y++) {
      expect(groundTruth.get(0, y)).toBe(Cell.Wall);
      expect(groundTruth.get(19, y)).toBe(Cell.Wall);
    }
  });

  it("reports a positive reachable count for a normally-sized map", () => {
    const { reachableCount } = generateMap(48, 32, "reachable-check");
    expect(reachableCount).toBeGreaterThan(0);
  });

  it("degrades gracefully instead of throwing for degenerate tiny dimensions", () => {
    // 1x1 and 2x2 grids are all border, so every cell is Wall and no Free
    // cell exists anywhere — nearestFreeCell's spiral search exhausts the
    // grid and falls back to the unclamped center point.
    for (const [w, h] of [
      [0, 0],
      [1, 1],
      [2, 2],
    ]) {
      expect(() => generateMap(w, h, "tiny-map")).not.toThrow();
      const { start, reachableCount } = generateMap(w, h, "tiny-map");
      expect(reachableCount).toBe(0);
      expect(start).toEqual({ x: Math.floor(w / 2), y: Math.floor(h / 2) });
    }
  });
});

describe("smooth", () => {
  it("births a wall when a cell has exactly the birth threshold of wall neighbors", () => {
    const grid = new OccupancyGrid(5, 5);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) grid.set(x, y, Cell.Free);
    // (2,2) gets exactly 5 of its 8 neighbors as Wall — the birth threshold.
    for (const n of [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ]) {
      grid.set(n.x, n.y, Cell.Wall);
    }
    expect(smooth(grid).get(2, 2)).toBe(Cell.Wall);
  });

  it("keeps a cell free with one fewer than the birth threshold", () => {
    const grid = new OccupancyGrid(5, 5);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) grid.set(x, y, Cell.Free);
    for (const n of [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 2 },
    ]) {
      grid.set(n.x, n.y, Cell.Wall);
    }
    expect(smooth(grid).get(2, 2)).toBe(Cell.Free);
  });

  it("always forces border cells to Wall regardless of neighbor state", () => {
    const grid = new OccupancyGrid(4, 4);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) grid.set(x, y, Cell.Free);
    const next = smooth(grid);
    for (let x = 0; x < 4; x++) {
      expect(next.get(x, 0)).toBe(Cell.Wall);
      expect(next.get(x, 3)).toBe(Cell.Wall);
    }
  });
});

describe("floodFillReachable", () => {
  it("returns only the start cell when it is isolated", () => {
    const grid = new OccupancyGrid(3, 3);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) grid.set(x, y, Cell.Wall);
    grid.set(1, 1, Cell.Free);
    const reachable = floodFillReachable(grid, { x: 1, y: 1 });
    expect(reachable.size).toBe(1);
    expect(reachable.has("1,1")).toBe(true);
  });

  it("excludes free cells that are walled off from the start", () => {
    // 5x1 strip: free, free, WALL, free, free — the last two are unreachable.
    const grid = new OccupancyGrid(5, 1);
    grid.set(0, 0, Cell.Free);
    grid.set(1, 0, Cell.Free);
    grid.set(2, 0, Cell.Wall);
    grid.set(3, 0, Cell.Free);
    grid.set(4, 0, Cell.Free);

    const reachable = floodFillReachable(grid, { x: 0, y: 0 });
    expect(reachable.size).toBe(2);
    expect(reachable.has("3,0")).toBe(false);
    expect(reachable.has("4,0")).toBe(false);
  });

  it("returns an empty set when the start cell itself is not free", () => {
    const grid = new OccupancyGrid(3, 3);
    const reachable = floodFillReachable(grid, { x: 1, y: 1 });
    expect(reachable.size).toBe(0);
  });
});
