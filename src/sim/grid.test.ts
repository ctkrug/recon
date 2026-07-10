import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";

describe("OccupancyGrid", () => {
  it("starts every cell as unknown", () => {
    const grid = new OccupancyGrid(4, 3);
    expect(grid.countByState(Cell.Unknown)).toBe(12);
    expect(grid.countByState(Cell.Free)).toBe(0);
  });

  it("stores and retrieves a cell value", () => {
    const grid = new OccupancyGrid(4, 3);
    grid.set(1, 1, Cell.Free);
    expect(grid.get(1, 1)).toBe(Cell.Free);
    expect(grid.get(0, 0)).toBe(Cell.Unknown);
  });

  it("treats out-of-bounds coordinates as walls", () => {
    const grid = new OccupancyGrid(4, 3);
    expect(grid.get(-1, 0)).toBe(Cell.Wall);
    expect(grid.get(4, 0)).toBe(Cell.Wall);
    expect(grid.get(0, 3)).toBe(Cell.Wall);
  });

  it("ignores writes outside the grid", () => {
    const grid = new OccupancyGrid(2, 2);
    grid.set(5, 5, Cell.Free);
    expect(grid.countByState(Cell.Free)).toBe(0);
  });
});
