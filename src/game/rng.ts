// The seeded random numbers: every gameplay random call reads rng(), never Math.random. No browser in here.

let seed = 0;

/** Sets the seed the next rng() calls start from. */
export function setSeed(s: number): void { seed = s; }

/** mulberry32: the next number in [0, 1) from the seed. */
export function rng(): number {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
