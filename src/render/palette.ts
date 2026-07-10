import { Cell } from "../sim/grid";

/** Blueprint HUD palette — see docs/DESIGN.md for the full token table. */
export const tokens = {
  bg: "#0a1628",
  surface1: "#0f2038",
  surface2: "#142a4a",
  text: "#e8f0fa",
  textMuted: "#7f97b8",
  accent: "#4fd1ff",
  accentSupport: "#ffb547",
  success: "#5ee6a0",
  danger: "#ff6b6b",
} as const;

/** Fill color for a cell in its current belief state. Unknown is pure fog
 * (the background), Free is a faint schematic tint, Wall is a solid
 * mid-tone so obstacles read clearly against the grid. */
export function cellFillColor(cell: Cell): string {
  switch (cell) {
    case Cell.Unknown:
      return tokens.bg;
    case Cell.Free:
      return "#12233e";
    case Cell.Wall:
      return "#1c3a63";
    default:
      return tokens.bg;
  }
}

/** Stroke color for the faint ruled grid line over a known cell — unknown
 * (fog) cells get no grid line so the fog reads as solid, not gridded. */
export function cellGridLineColor(cell: Cell): string | null {
  return cell === Cell.Unknown ? null : "rgba(79, 209, 255, 0.12)";
}
