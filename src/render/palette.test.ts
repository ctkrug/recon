import { describe, expect, it } from "vitest";
import { Cell } from "../sim/grid";
import { cellFillColor, cellGridLineColor } from "./palette";

describe("cellFillColor", () => {
  it("returns a distinct color for each cell state", () => {
    const colors = new Set([
      cellFillColor(Cell.Unknown),
      cellFillColor(Cell.Free),
      cellFillColor(Cell.Wall),
    ]);
    expect(colors.size).toBe(3);
  });
});

describe("cellGridLineColor", () => {
  it("omits the grid line for unknown (fog) cells", () => {
    expect(cellGridLineColor(Cell.Unknown)).toBeNull();
  });

  it("draws a grid line for known cells", () => {
    expect(cellGridLineColor(Cell.Free)).not.toBeNull();
    expect(cellGridLineColor(Cell.Wall)).not.toBeNull();
  });
});
