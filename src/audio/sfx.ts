import { shouldThrottle, SfxName } from "./throttle";

export type { SfxName } from "./throttle";

interface ToneSpec {
  type: OscillatorType;
  freqStart: number;
  freqEnd?: number;
  durationMs: number;
  gain: number;
}

const TONES: Record<SfxName, ToneSpec> = {
  "sensor-ping": {
    type: "sine",
    freqStart: 1800,
    freqEnd: 2200,
    durationMs: 60,
    gain: 0.05,
  },
  step: { type: "square", freqStart: 220, durationMs: 30, gain: 0.03 },
  "frontier-lock": {
    type: "triangle",
    freqStart: 440,
    freqEnd: 660,
    durationMs: 120,
    gain: 0.06,
  },
  complete: {
    type: "sawtooth",
    freqStart: 523.25,
    freqEnd: 1046.5,
    durationMs: 500,
    gain: 0.08,
  },
};

/** Resolves a browser AudioContext, including Safari's prefixed name, or
 * null in environments without WebAudio support (e.g. the node test
 * runner, or a browser with the API disabled). */
export function createBrowserAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/** Plays short WebAudio-synthesized SFX for exploration events. The
 * AudioContext is created lazily via `contextFactory`, on the first
 * `play()` call, so creation happens inside a user gesture as the
 * autoplay policy requires; a factory that returns null (unsupported
 * environment) makes every `play()` a silent no-op. */
export class SfxEngine {
  private muted: boolean;
  private ctx: AudioContext | null = null;
  private readonly contextFactory: () => AudioContext | null;
  private lastPlayedAt: Partial<Record<SfxName, number>> = {};

  constructor(
    muted = false,
    contextFactory: () => AudioContext | null = createBrowserAudioContext,
  ) {
    this.muted = muted;
    this.contextFactory = contextFactory;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Eagerly creates the AudioContext if it doesn't exist yet. Call this
   * directly inside a user-gesture event handler (e.g. a button click) so
   * context creation satisfies the browser's autoplay policy, even before
   * the first sound actually needs to play. */
  unlock(): void {
    this.ensureContext();
  }

  /** Plays `name` at simulation time `now` (any monotonic ms clock), unless
   * muted or throttled by that sound's minimum repeat interval. */
  play(name: SfxName, now: number): void {
    if (this.muted) return;
    if (shouldThrottle(name, now, this.lastPlayedAt)) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    this.lastPlayedAt[name] = now;
    emitTone(ctx, TONES[name]);
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      this.ctx = this.contextFactory();
    }
    return this.ctx;
  }
}

function emitTone(ctx: AudioContext, spec: ToneSpec): void {
  const durationSec = spec.durationMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.freqStart, ctx.currentTime);
  if (spec.freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(spec.freqEnd, ctx.currentTime + durationSec);
  }

  gain.gain.setValueAtTime(spec.gain, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationSec);
}
