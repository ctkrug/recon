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

  it("falls back to the background color for an out-of-range cell value", () => {
    // The belief grid is a raw Uint8Array; a corrupted or foreign value
    // outside the Cell enum must render as fog, never throw or draw undefined.
    expect(cellFillColor(99 as Cell)).toBe(cellFillColor(Cell.Unknown));
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
