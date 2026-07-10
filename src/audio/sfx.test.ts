import { describe, expect, it, vi } from "vitest";
import { SfxEngine } from "./sfx";

function fakeOscillator() {
  return {
    type: "sine",
    frequency: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function fakeGain() {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
  };
}

function fakeAudioContext() {
  const oscillators: ReturnType<typeof fakeOscillator>[] = [];
  const ctx = {
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => {
      const osc = fakeOscillator();
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => fakeGain()),
  };
  return { ctx: ctx as unknown as AudioContext, oscillators, createOscillator: ctx.createOscillator };
}

describe("SfxEngine", () => {
  it("does not create an AudioContext while muted", () => {
    const factory = vi.fn(() => fakeAudioContext().ctx);
    const engine = new SfxEngine(true, factory);

    engine.play("step", 1000);

    expect(factory).not.toHaveBeenCalled();
  });

  it("creates the AudioContext lazily on first play and reuses it", () => {
    const { ctx } = fakeAudioContext();
    const factory = vi.fn(() => ctx);
    const engine = new SfxEngine(false, factory);

    engine.play("frontier-lock", 1000);
    engine.play("complete", 2000);

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("emits an oscillator with the tone spec for the given sound", () => {
    const { ctx, oscillators } = fakeAudioContext();
    const engine = new SfxEngine(false, () => ctx);

    engine.play("complete", 1000);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0].type).toBe("sawtooth");
    expect(oscillators[0].start).toHaveBeenCalledTimes(1);
    expect(oscillators[0].stop).toHaveBeenCalledTimes(1);
  });

  it("drops a throttled repeat without emitting a second oscillator", () => {
    const { ctx, oscillators } = fakeAudioContext();
    const engine = new SfxEngine(false, () => ctx);

    engine.play("step", 1000);
    engine.play("step", 1010); // within step's 80ms floor

    expect(oscillators).toHaveLength(1);
  });

  it("allows a repeat once the throttle window elapses", () => {
    const { ctx, oscillators } = fakeAudioContext();
    const engine = new SfxEngine(false, () => ctx);

    engine.play("step", 1000);
    engine.play("step", 1100);

    expect(oscillators).toHaveLength(2);
  });

  it("no-ops without throwing when the environment has no AudioContext", () => {
    const engine = new SfxEngine(false, () => null);
    expect(() => engine.play("complete", 1000)).not.toThrow();
  });

  it("unlock() eagerly creates the context without playing a sound", () => {
    const { ctx, oscillators } = fakeAudioContext();
    const factory = vi.fn(() => ctx);
    const engine = new SfxEngine(false, factory);

    engine.unlock();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(oscillators).toHaveLength(0);
  });

  it("unlock() does not create a second context if play() already did", () => {
    const { ctx } = fakeAudioContext();
    const factory = vi.fn(() => ctx);
    const engine = new SfxEngine(false, factory);

    engine.play("step", 1000);
    engine.unlock();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("toggles and reports mute state", () => {
    const engine = new SfxEngine(false, () => fakeAudioContext().ctx);
    expect(engine.isMuted()).toBe(false);
    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
  });
});
