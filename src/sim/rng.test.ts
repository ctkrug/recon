import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

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

  it("property: any string seed (including unicode/emoji) is deterministic and bounded", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (seed) => {
        const a = createRng(seed);
        const b = createRng(seed);
        for (let i = 0; i < 20; i++) {
          const va = a();
          const vb = b();
          expect(va).toBe(vb);
          expect(va).toBeGreaterThanOrEqual(0);
          expect(va).toBeLessThan(1);
        }
      }),
    );
  });
});
