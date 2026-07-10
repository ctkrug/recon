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

/** Wraps a storage source so a throwing implementation (e.g. `localStorage`
 * blocked by a sandboxed iframe or a strict privacy setting) degrades to an
 * in-memory fallback instead of crashing the app at startup — the mute
 * preference just won't persist across reloads. `source` is a factory
 * rather than a value so a throwing property getter (some browsers throw on
 * `window.localStorage` itself, not just its methods) is caught too. */
export function createSafeMuteStorage(source: () => MuteStorage): MuteStorage {
  const memory = new Map<string, string>();
  const fallback: MuteStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
  };
  try {
    const storage = source();
    storage.getItem(MUTE_STORAGE_KEY);
    return storage;
  } catch {
    return fallback;
  }
}
