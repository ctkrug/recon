import { describe, expect, it } from "vitest";
import { createRng, randInt } from "./rng";

describe("createRng", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = createRng("recon-42");
    const b = createRng("recon-42");
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces a different sequence for a different seed", () => {
    const a = createRng("recon-42");
    const b = createRng("recon-43");
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("always yields values in [0, 1)", () => {
    const rng = createRng("bounds-check");
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("handles an empty seed without throwing", () => {
    const rng = createRng("");
    expect(() => rng()).not.toThrow();
  });
});

describe("randInt", () => {
  it("stays within [min, max)", () => {
    const rng = createRng("int-bounds");
    for (let i = 0; i < 500; i++) {
      const v = randInt(rng, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("returns min when min and max are equal", () => {
    const rng = createRng("degenerate-range");
    expect(randInt(rng, 3, 3)).toBe(3);
  });
});
