import fc from "fast-check";
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

  it("property: any in-bounds cell round-trips whatever value it was set to", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 40 }),
        fc.integer({ min: 1, max: 40 }),
        fc.constantFrom(Cell.Unknown, Cell.Free, Cell.Wall),
        (width, height, value) => {
          const grid = new OccupancyGrid(width, height);
          const x = Math.floor(width / 2);
          const y = Math.floor(height / 2);
          grid.set(x, y, value);
          expect(grid.get(x, y)).toBe(value);
        },
      ),
    );
  });

  it("property: any out-of-bounds coordinate always reads as Wall, regardless of writes", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: -50, max: 50 }),
        fc.integer({ min: -50, max: 50 }),
        (width, height, x, y) => {
          fc.pre(x < 0 || y < 0 || x >= width || y >= height);
          const grid = new OccupancyGrid(width, height);
          grid.set(x, y, Cell.Free); // no-op outside bounds
          expect(grid.get(x, y)).toBe(Cell.Wall);
        },
      ),
    );
  });
});
