import { describe, expect, it } from "vitest";
import { clamp01, easeOutCubic, lerp } from "./easing";

describe("clamp01", () => {
  it("passes values already in range through unchanged", () => {
    expect(clamp01(0.5)).toBe(0.5);
  });

  it("clamps below zero to zero", () => {
    expect(clamp01(-3)).toBe(0);
  });

  it("clamps above one to one", () => {
    expect(clamp01(5)).toBe(1);
  });
});

describe("easeOutCubic", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it("is monotonically increasing across the range", () => {
    const samples = [0, 0.25, 0.5, 0.75, 1].map(easeOutCubic);
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
    }
  });

  it("clamps out-of-range input instead of extrapolating", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
});

describe("lerp", () => {
  it("returns the start value at t=0 and end value at t=1", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("interpolates linearly at the midpoint", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("handles a negative range", () => {
    expect(lerp(5, -5, 0.5)).toBe(0);
  });
});
