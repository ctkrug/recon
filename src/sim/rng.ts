/** Deterministic seeded RNG so a given seed always reproduces the same map
 * and can be replayed or shared. Uses xmur3 to hash an arbitrary string seed
 * into a 32-bit state, then mulberry32 as the generator. */
function xmur3(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(state: number): () => number {
  let a = state;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Creates a deterministic PRNG from a string seed. Returns a function that
 * yields successive floats in [0, 1). */
export function createRng(seed: string): () => number {
  const seedFn = xmur3(seed);
  return mulberry32(seedFn());
}

/** Returns an integer in [min, max), using the given RNG. */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min)) + min;
}
