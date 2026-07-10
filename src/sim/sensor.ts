import { Cell, OccupancyGrid } from "./grid";

/** Integer points along a line from (x0, y0) to (x1, y1), inclusive of both
 * endpoints, via Bresenham's algorithm. */
export function traceLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

/** Sweeps the robot's sensor from its current position: every cell within
 * `range` (Euclidean) is revealed into `belief` from `groundTruth`, but a
 * wall occludes anything past it along that line of sight — cells directly
 * behind a wall from the robot's viewpoint stay Unknown this tick. Never
 * reads `belief`'s prior state and never reveals anything beyond `range`. */
export function sweep(
  groundTruth: OccupancyGrid,
  belief: OccupancyGrid,
  robot: { x: number; y: number },
  range: number,
): void {
  belief.set(robot.x, robot.y, groundTruth.get(robot.x, robot.y));

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      if (dx * dx + dy * dy > range * range) continue;
      const targetX = robot.x + dx;
      const targetY = robot.y + dy;
      if (!groundTruth.inBounds(targetX, targetY)) continue;

      const line = traceLine(robot.x, robot.y, targetX, targetY);
      for (const point of line) {
        const truth = groundTruth.get(point.x, point.y);
        belief.set(point.x, point.y, truth);
        if (truth === Cell.Wall) break;
      }
    }
  }
}
