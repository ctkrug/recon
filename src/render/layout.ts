/** Picks grid dimensions whose aspect ratio matches the container's, so the
 * generated map fills its stage edge-to-edge with zero letterboxing instead
 * of a centered island surrounded by dead background. Keeps the total cell
 * count near `targetCells` so map size/difficulty stays consistent across
 * devices, clamping each side to `minDim` so a degenerate (zero-size)
 * container still yields a usable grid. */
export function computeGridDimensions(
  containerWidth: number,
  containerHeight: number,
  targetCells = 2200,
  minDim = 16,
): { width: number; height: number } {
  if (containerWidth <= 0 || containerHeight <= 0) {
    const side = Math.max(minDim, Math.round(Math.sqrt(targetCells)));
    return { width: side, height: side };
  }

  const aspect = containerWidth / containerHeight;
  const width = Math.max(minDim, Math.round(Math.sqrt(targetCells * aspect)));
  const height = Math.max(minDim, Math.round(targetCells / width));

  return { width, height };
}
