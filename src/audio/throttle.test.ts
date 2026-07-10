import { describe, expect, it } from "vitest";
import { shouldThrottle } from "./throttle";

describe("shouldThrottle", () => {
  it("never throttles the first play of a sound", () => {
    expect(shouldThrottle("step", 1000, {})).toBe(false);
  });

  it("throttles a repeat within the sound's minimum interval", () => {
    expect(shouldThrottle("step", 1050, { step: 1000 })).toBe(true);
  });

  it("allows a repeat once the minimum interval has elapsed", () => {
    expect(shouldThrottle("step", 1080, { step: 1000 })).toBe(false);
  });

  it("treats exactly the boundary interval as no longer throttled", () => {
    // step's floor is 80ms
    expect(shouldThrottle("step", 1080, { step: 1000 })).toBe(false);
  });

  it("never throttles a sound with no configured minimum interval", () => {
    expect(shouldThrottle("frontier-lock", 1001, { "frontier-lock": 1000 })).toBe(false);
  });

  it("tracks each sound's last-played time independently", () => {
    const lastPlayedAt = { step: 1000, "sensor-ping": 1000 } as const;
    expect(shouldThrottle("sensor-ping", 1100, { ...lastPlayedAt })).toBe(true);
    expect(shouldThrottle("step", 1100, { ...lastPlayedAt })).toBe(false);
  });
});
