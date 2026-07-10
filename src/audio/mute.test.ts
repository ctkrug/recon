import { describe, expect, it } from "vitest";
import { loadMutePreference, MuteStorage, saveMutePreference } from "./mute";

function fakeStorage(initial: Record<string, string> = {}): MuteStorage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

describe("loadMutePreference", () => {
  it("defaults to unmuted when nothing is stored", () => {
    expect(loadMutePreference(fakeStorage())).toBe(false);
  });

  it("reads a persisted muted=true value", () => {
    expect(loadMutePreference(fakeStorage({ "recon:muted": "true" }))).toBe(true);
  });

  it("treats a malformed stored value as unmuted", () => {
    expect(loadMutePreference(fakeStorage({ "recon:muted": "yes please" }))).toBe(false);
  });
});

describe("saveMutePreference", () => {
  it("round-trips true through the same storage", () => {
    const storage = fakeStorage();
    saveMutePreference(storage, true);
    expect(loadMutePreference(storage)).toBe(true);
  });

  it("round-trips false through the same storage", () => {
    const storage = fakeStorage({ "recon:muted": "true" });
    saveMutePreference(storage, false);
    expect(loadMutePreference(storage)).toBe(false);
  });
});
