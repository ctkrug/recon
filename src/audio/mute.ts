const MUTE_STORAGE_KEY = "recon:muted";

export interface MuteStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Reads the persisted mute preference. Defaults to unmuted for a missing
 * or malformed value so a corrupted/foreign localStorage entry never
 * silences the app unexpectedly. */
export function loadMutePreference(storage: MuteStorage): boolean {
  return storage.getItem(MUTE_STORAGE_KEY) === "true";
}

export function saveMutePreference(storage: MuteStorage, muted: boolean): void {
  storage.setItem(MUTE_STORAGE_KEY, muted ? "true" : "false");
}
