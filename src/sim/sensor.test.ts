import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";
import { sweep, traceLine } from "./sensor";

function openGrid(width: number, height: number): OccupancyGrid {
  const grid = new OccupancyGrid(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) grid.set(x, y, Cell.Free);
  return grid;
}

describe("traceLine", () => {
  it("includes both endpoints for a horizontal line", () => {
    const points = traceLine(0, 0, 3, 0);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[points.length - 1]).toEqual({ x: 3, y: 0 });
  });

  it("returns a single point when start equals end", () => {
    expect(traceLine(2, 2, 2, 2)).toEqual([{ x: 2, y: 2 }]);
  });

  it("produces a contiguous diagonal path", () => {
    const points = traceLine(0, 0, 3, 3);
    expect(points).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);
  });
});

describe("sweep", () => {
  it("reveals free cells within range in open space", () => {
    const truth = openGrid(11, 11);
    const belief = new OccupancyGrid(11, 11);
    sweep(truth, belief, { x: 5, y: 5 }, 3);

    expect(belief.get(5, 5)).toBe(Cell.Free);
    expect(belief.get(5, 8)).toBe(Cell.Free); // 3 cells straight down, in range
  });

  it("leaves cells outside range unknown", () => {
    const truth = openGrid(11, 11);
    const belief = new OccupancyGrid(11, 11);
    sweep(truth, belief, { x: 5, y: 5 }, 2);

    expect(belief.get(5, 9)).toBe(Cell.Unknown); // 4 cells away, out of range
  });

  it("occludes cells directly behind a wall from the robot's viewpoint", () => {
    const truth = openGrid(9, 3);
    truth.set(5, 1, Cell.Wall); // wall due east of the robot on row y=1
    const belief = new OccupancyGrid(9, 3);

    sweep(truth, belief, { x: 3, y: 1 }, 5);

    expect(belief.get(5, 1)).toBe(Cell.Wall); // the wall itself is revealed
    expect(belief.get(6, 1)).toBe(Cell.Unknown); // occluded behind it
    expect(belief.get(7, 1)).toBe(Cell.Unknown);
  });

  it("reveals only the robot's own cell at range zero", () => {
    const truth = openGrid(5, 5);
    const belief = new OccupancyGrid(5, 5);
    sweep(truth, belief, { x: 2, y: 2 }, 0);

    expect(belief.get(2, 2)).toBe(Cell.Free);
    expect(belief.get(2, 1)).toBe(Cell.Unknown);
    expect(belief.get(3, 2)).toBe(Cell.Unknown);
  });

  it("never reveals cells outside the grid bounds", () => {
    const truth = openGrid(4, 4);
    const belief = new OccupancyGrid(4, 4);
    expect(() => sweep(truth, belief, { x: 0, y: 0 }, 5)).not.toThrow();
  });
});
