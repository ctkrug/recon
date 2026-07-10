import { Cell, OccupancyGrid } from "./grid";
import type { Point } from "./frontier";

function key(p: Point): string {
  return `${p.x},${p.y}`;
}

function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

const NEIGHBOR_OFFSETS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
];

/** A* over the robot's own belief grid — only cells the robot has already
 * mapped as Free are traversable, so the path never cuts through unknown or
 * wall space. Returns null when no such path exists (goal unreachable from
 * what's currently known). */
export function findPath(belief: OccupancyGrid, start: Point, goal: Point): Point[] | null {
  if (start.x === goal.x && start.y === goal.y) return [{ x: start.x, y: start.y }];
  if (belief.get(goal.x, goal.y) !== Cell.Free) return null;
  if (belief.get(start.x, start.y) !== Cell.Free) return null;

  const open = new Map<string, Point>();
  open.set(key(start), start);

  const cameFrom = new Map<string, Point>();
  const gScore = new Map<string, number>();
  gScore.set(key(start), 0);

  const fScore = new Map<string, number>();
  fScore.set(key(start), manhattan(start, goal));

  while (open.size > 0) {
    let currentKey = "";
    let current: Point | null = null;
    let bestF = Infinity;
    for (const [k, p] of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        currentKey = k;
        current = p;
      }
    }
    if (!current) break;

    if (current.x === goal.x && current.y === goal.y) {
      const path: Point[] = [current];
      let curKey = currentKey;
      while (cameFrom.has(curKey)) {
        const prev = cameFrom.get(curKey)!;
        path.unshift(prev);
        curKey = key(prev);
      }
      return path;
    }

    open.delete(currentKey);
    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const { dx, dy } of NEIGHBOR_OFFSETS) {
      const neighbor = { x: current.x + dx, y: current.y + dy };
      if (belief.get(neighbor.x, neighbor.y) !== Cell.Free) continue;

      const neighborKey = key(neighbor);
      const tentativeG = currentG + 1;
      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + manhattan(neighbor, goal));
        if (!open.has(neighborKey)) open.set(neighborKey, neighbor);
      }
    }
  }

  return null;
}
