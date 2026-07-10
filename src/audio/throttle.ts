export type SfxName = "sensor-ping" | "frontier-lock" | "step" | "complete";

/** Minimum gap between repeats of a sound, in ms. Sounds fired once per
 * meaningful event (frontier-lock, complete) are left unthrottled; sounds
 * fired every simulation tick (sensor-ping, step) need a floor so a fast
 * playback speed doesn't turn them into a solid buzz. */
export const MIN_INTERVAL_MS: Partial<Record<SfxName, number>> = {
  "sensor-ping": 150,
  step: 80,
};

/** Decides whether playback of `name` at time `now` should be dropped
 * because it repeated too soon after `lastPlayedAt[name]`. */
export function shouldThrottle(
  name: SfxName,
  now: number,
  lastPlayedAt: Partial<Record<SfxName, number>>,
): boolean {
  const minInterval = MIN_INTERVAL_MS[name];
  if (minInterval === undefined) return false;

  const last = lastPlayedAt[name];
  if (last === undefined) return false;

  return now - last < minInterval;
}
