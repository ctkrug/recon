import { Cell, OccupancyGrid } from "./grid";
import { createRng } from "./rng";

export interface GeneratedMap {
  /** Ground truth — only the sensor sweep is allowed to read this. */
  groundTruth: OccupancyGrid;
  start: { x: number; y: number };
  /** Count of Free cells reachable from `start`; the denominator for coverage. */
  reachableCount: number;
}

const WALL_PROBABILITY = 0.42;
const SMOOTHING_PASSES = 4;
const BIRTH_THRESHOLD = 5;

function countWallNeighbors(grid: OccupancyGrid, x: number, y: number): number {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (grid.get(x + dx, y + dy) !== Cell.Free) count++;
    }
  }
  return count;
}

/** One cellular-automaton pass: a cell becomes Wall when at least
 * `BIRTH_THRESHOLD` of its 8 neighbors are non-Free (including out-of-bounds,
 * which `OccupancyGrid.get` reports as Wall), otherwise Free. Border cells
 * are always Wall regardless of neighbor count. Exported for direct
 * boundary testing — the exact threshold shapes the generated caves. */
export function smooth(grid: OccupancyGrid): OccupancyGrid {
  const next = new OccupancyGrid(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const isBorder =
        x === 0 || y === 0 || x === grid.width - 1 || y === grid.height - 1;
      if (isBorder) {
        next.set(x, y, Cell.Wall);
        continue;
      }
      const walls = countWallNeighbors(grid, x, y);
      next.set(x, y, walls >= BIRTH_THRESHOLD ? Cell.Wall : Cell.Free);
    }
  }
  return next;
}

/** Finds the nearest Free cell to (x, y), spiraling outward. Returns null if
 * every cell in the grid is a wall. */
function nearestFreeCell(
  grid: OccupancyGrid,
  x: number,
  y: number,
): { x: number; y: number } | null {
  const maxRadius = Math.max(grid.width, grid.height);
  for (let r = 0; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const cx = x + dx;
        const cy = y + dy;
        if (grid.get(cx, cy) === Cell.Free) return { x: cx, y: cy };
      }
    }
  }
  return null;
}

/** Flood-fills from `start` over Free cells (4-connectivity) and returns the
 * set of reachable cells, keyed as `x,y`. */
export function floodFillReachable(
  grid: OccupancyGrid,
  start: { x: number; y: number },
): Set<string> {
  const reachable = new Set<string>();
  if (grid.get(start.x, start.y) !== Cell.Free) return reachable;

  const stack: Array<{ x: number; y: number }> = [start];
  reachable.add(`${start.x},${start.y}`);

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const neighbors = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (reachable.has(key)) continue;
      if (grid.get(n.x, n.y) !== Cell.Free) continue;
      reachable.add(key);
      stack.push(n);
    }
  }

  return reachable;
}

/** Generates a deterministic ground-truth map from a seed via a cellular
 * automaton: seed a wall/free noise field, then smooth it into cave-like
 * open regions. The same seed + dimensions always produce the same map. */
export function generateMap(width: number, height: number, seed: string): GeneratedMap {
  const rng = createRng(seed);

  let grid = new OccupancyGrid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      grid.set(x, y, isBorder || rng() < WALL_PROBABILITY ? Cell.Wall : Cell.Free);
    }
  }

  for (let i = 0; i < SMOOTHING_PASSES; i++) {
    grid = smooth(grid);
  }

  const center = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
  const start = nearestFreeCell(grid, center.x, center.y) ?? center;

  const reachable = floodFillReachable(grid, start);

  return { groundTruth: grid, start, reachableCount: reachable.size };
}
