/** Clamps `t` into [0, 1]. */
export function clamp01(t: number): number {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

/** Ease-out cubic — fast start, gentle settle. Used for the robot's tween
 * between grid cells and for UI transitions per docs/DESIGN.md. */
export function easeOutCubic(t: number): number {
  const clamped = clamp01(t);
  return 1 - Math.pow(1 - clamped, 3);
}

/** Linear interpolation between `from` and `to` at progress `t` (expected in
 * [0, 1], but not clamped here — callers that need clamping call clamp01
 * first, e.g. via easeOutCubic). */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
