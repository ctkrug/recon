import { describe, expect, it } from "vitest";
import { formatCelebrationStats, formatElapsed } from "./format";

describe("formatElapsed", () => {
  it("formats sub-minute durations", () => {
    expect(formatElapsed(5000)).toBe("0:05");
  });

  it("pads single-digit seconds", () => {
    expect(formatElapsed(61_000)).toBe("1:01");
  });

  it("formats zero as 0:00", () => {
    expect(formatElapsed(0)).toBe("0:00");
  });

  it("floors partial seconds instead of rounding", () => {
    expect(formatElapsed(1999)).toBe("0:01");
  });

  it("rolls minutes past 59 seconds", () => {
    expect(formatElapsed(125_000)).toBe("2:05");
  });
});

describe("formatCelebrationStats", () => {
  it("formats steps, elapsed time, and coverage percentage", () => {
    const stats = formatCelebrationStats({ steps: 42, elapsedMs: 65_000, coverage: 1 });
    expect(stats).toEqual({ steps: "42", elapsed: "1:05", coverage: "100%" });
  });

  it("rounds fractional coverage to the nearest percent", () => {
    const stats = formatCelebrationStats({ steps: 0, elapsedMs: 0, coverage: 0.876 });
    expect(stats.coverage).toBe("88%");
  });

  it("handles the zero-progress boundary", () => {
    const stats = formatCelebrationStats({ steps: 0, elapsedMs: 0, coverage: 0 });
    expect(stats).toEqual({ steps: "0", elapsed: "0:00", coverage: "0%" });
  });
});
