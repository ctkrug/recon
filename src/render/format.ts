/** Formats milliseconds as `m:ss` for the elapsed-time HUD readout. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface CelebrationStats {
  steps: number;
  elapsedMs: number;
  coverage: number;
}

/** Builds the three stat lines shown on the completion celebration overlay. */
export function formatCelebrationStats(stats: CelebrationStats): {
  steps: string;
  elapsed: string;
  coverage: string;
} {
  return {
    steps: String(stats.steps),
    elapsed: formatElapsed(stats.elapsedMs),
    coverage: `${Math.round(stats.coverage * 100)}%`,
  };
}
