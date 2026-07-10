import { describe, expect, it } from "vitest";
import { computeGridDimensions } from "./layout";

describe("computeGridDimensions", () => {
  it("matches the container's aspect ratio", () => {
    const { width, height } = computeGridDimensions(1600, 800); // 2:1
    expect(width / height).toBeCloseTo(2, 1);
  });

  it("matches a portrait aspect ratio", () => {
    const { width, height } = computeGridDimensions(390, 780); // 1:2
    expect(width / height).toBeCloseTo(0.5, 1);
  });

  it("keeps the total cell count near the target", () => {
    const { width, height } = computeGridDimensions(1200, 900, 2200);
    expect(width * height).toBeGreaterThan(1800);
    expect(width * height).toBeLessThan(2700);
  });

  it("returns a square grid for a degenerate zero-size container", () => {
    const { width, height } = computeGridDimensions(0, 0);
    expect(width).toBe(height);
    expect(width).toBeGreaterThan(0);
  });

  it("clamps each side to at least minDim", () => {
    const { width, height } = computeGridDimensions(4000, 10, 2200, 16);
    expect(height).toBeGreaterThanOrEqual(16);
    expect(width).toBeGreaterThanOrEqual(16);
  });
});
