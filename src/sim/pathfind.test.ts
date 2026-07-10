import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";
import { findPath } from "./pathfind";

function openBelief(width: number, height: number): OccupancyGrid {
  const grid = new OccupancyGrid(width, height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) grid.set(x, y, Cell.Free);
  return grid;
}

describe("findPath", () => {
  it("finds a straight-line path across open free space", () => {
    const grid = openBelief(5, 1);
    const path = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 });
    expect(path).not.toBeNull();
    expect(path![0]).toEqual({ x: 0, y: 0 });
    expect(path![path!.length - 1]).toEqual({ x: 4, y: 0 });
    expect(path!.length).toBe(5);
  });

  it("routes around a wall obstacle", () => {
    const grid = openBelief(5, 3);
    grid.set(2, 0, Cell.Wall);
    grid.set(2, 1, Cell.Wall);
    // (2,2) left open as the only gap
    const path = findPath(grid, { x: 0, y: 1 }, { x: 4, y: 1 });
    expect(path).not.toBeNull();
    for (const p of path!) {
      expect(grid.get(p.x, p.y)).toBe(Cell.Free);
    }
  });

  it("returns null when the goal is walled off entirely", () => {
    const grid = openBelief(5, 5);
    for (let y = 0; y < 5; y++) {
      grid.set(1, y, Cell.Wall);
    }
    const path = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(path).toBeNull();
  });

  it("returns a single-point path when start equals goal", () => {
    const grid = openBelief(3, 3);
    const path = findPath(grid, { x: 1, y: 1 }, { x: 1, y: 1 });
    expect(path).toEqual([{ x: 1, y: 1 }]);
  });

  it("returns null when the goal cell itself is not known-free", () => {
    const grid = new OccupancyGrid(3, 3); // all Unknown
    grid.set(0, 0, Cell.Free);
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path).toBeNull();
  });

  it("returns null when the start cell itself is not known-free", () => {
    const grid = new OccupancyGrid(3, 3); // all Unknown
    grid.set(2, 2, Cell.Free);
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path).toBeNull();
  });
});
