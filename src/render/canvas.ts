import type { OccupancyGrid } from "../sim/grid";
import { cellFillColor, cellGridLineColor, tokens } from "./palette";

export interface RobotDisplayPosition {
  x: number;
  y: number;
}

/** Resizes a canvas's backing store to match its CSS box at the device
 * pixel ratio, so the map renders crisp on retina and stays correct after
 * the container is resized. Returns the CSS-pixel size used for drawing. */
export function fitCanvasToContainer(canvas: HTMLCanvasElement): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  const targetWidth = Math.max(1, Math.round(cssWidth * dpr));
  const targetHeight = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }
  return { width: cssWidth, height: cssHeight };
}

/** Draws one frame: the occupancy grid's fog/free/wall state, plus the
 * robot at its (tweened) display position. Reads only `belief`, never
 * ground truth, so the render is always a direct visualization of what the
 * robot itself believes. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  cssWidth: number,
  cssHeight: number,
  belief: OccupancyGrid,
  robot: RobotDisplayPosition,
): void {
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = tokens.bg;
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  const cellSize = Math.max(1, Math.floor(Math.min(cssWidth / belief.width, cssHeight / belief.height)));
  const offsetX = Math.floor((cssWidth - cellSize * belief.width) / 2);
  const offsetY = Math.floor((cssHeight - cellSize * belief.height) / 2);

  for (let y = 0; y < belief.height; y++) {
    for (let x = 0; x < belief.width; x++) {
      const cell = belief.get(x, y);
      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;

      ctx.fillStyle = cellFillColor(cell);
      ctx.fillRect(px, py, cellSize, cellSize);

      const gridLine = cellGridLineColor(cell);
      if (gridLine) {
        ctx.strokeStyle = gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
      }
    }
  }

  const robotPx = offsetX + (robot.x + 0.5) * cellSize;
  const robotPy = offsetY + (robot.y + 0.5) * cellSize;
  const robotRadius = Math.max(2, cellSize * 0.35);

  ctx.beginPath();
  ctx.fillStyle = tokens.accentSupport;
  ctx.shadowColor = tokens.accentSupport;
  ctx.shadowBlur = cellSize;
  ctx.arc(robotPx, robotPy, robotRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}
