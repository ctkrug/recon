import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { Cell, OccupancyGrid } from "./grid";
import {
  clusterFrontiers,
  findFrontierCells,
  isFrontierCell,
  scoreFrontierRegion,
  selectBestFrontierTarget,
} from "./frontier";

describe("isFrontierCell", () => {
  it("is true for a free cell bordering an unknown cell", () => {
    const grid = new OccupancyGrid(3, 3);
    grid.set(1, 1, Cell.Free);
    expect(isFrontierCell(grid, 1, 1)).toBe(true);
  });

  it("is false for a free cell fully surrounded by known cells", () => {
    const grid = new OccupancyGrid(3, 3);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) grid.set(x, y, Cell.Free);
    expect(isFrontierCell(grid, 1, 1)).toBe(false);
  });

  it("is false for an unknown or wall cell", () => {
    const grid = new OccupancyGrid(3, 3);
    grid.set(1, 1, Cell.Wall);
    expect(isFrontierCell(grid, 1, 1)).toBe(false);
    expect(isFrontierCell(grid, 0, 0)).toBe(false); // still Unknown
  });
});

describe("findFrontierCells", () => {
  it("returns an empty list for a fully unknown grid", () => {
    const grid = new OccupancyGrid(4, 4);
    expect(findFrontierCells(grid)).toEqual([]);
  });

  it("finds every frontier cell on a partially explored grid", () => {
    const grid = new OccupancyGrid(3, 1);
    grid.set(0, 0, Cell.Free);
    grid.set(1, 0, Cell.Free); // borders unknown (2,0) -> frontier
    grid.set(2, 0, Cell.Unknown);
    const found = findFrontierCells(grid);
    expect(found).toEqual([{ x: 1, y: 0 }]);
  });
});

describe("clusterFrontiers", () => {
  it("groups adjacent frontier cells into one region", () => {
    const cells = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    const clusters = clusterFrontiers(cells);
    expect(clusters.length).toBe(1);
    expect(clusters[0].length).toBe(3);
  });

  it("keeps disjoint frontier cells as separate regions", () => {
    const cells = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];
    const clusters = clusterFrontiers(cells);
    expect(clusters.length).toBe(2);
  });

  it("returns an empty list for no cells", () => {
    expect(clusterFrontiers([])).toEqual([]);
  });

  it("property: every input cell appears in exactly one output cluster", () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.tuple(fc.integer({ min: 0, max: 15 }), fc.integer({ min: 0, max: 15 })), {
          maxLength: 30,
          selector: ([x, y]) => `${x},${y}`,
        }),
        (coords) => {
          const cells = coords.map(([x, y]) => ({ x, y }));
          const clusters = clusterFrontiers(cells);

          const clusteredKeys = clusters.flat().map((c) => `${c.x},${c.y}`);
          const inputKeys = cells.map((c) => `${c.x},${c.y}`);

          expect(clusteredKeys.length).toBe(inputKeys.length);
          expect(new Set(clusteredKeys)).toEqual(new Set(inputKeys));
        },
      ),
    );
  });
});

describe("scoreFrontierRegion", () => {
  it("prefers a smaller, closer region over a larger, distant one", () => {
    const nearSmall = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]; // size 3, nearest distance 1
    const farLarge = Array.from({ length: 10 }, (_, i) => ({ x: 20 + i, y: 0 })); // size 10, distance 20
    const robot = { x: 0, y: 0 };
    expect(scoreFrontierRegion(nearSmall, robot)).toBeGreaterThan(
      scoreFrontierRegion(farLarge, robot),
    );
  });

  it("prefers a much larger region even when it is farther away", () => {
    const nearTiny = [{ x: 1, y: 0 }]; // size 1, distance 1
    const farHuge = Array.from({ length: 20 }, (_, i) => ({ x: 5 + i, y: 0 })); // size 20, distance 5
    const robot = { x: 0, y: 0 };
    expect(scoreFrontierRegion(farHuge, robot)).toBeGreaterThan(
      scoreFrontierRegion(nearTiny, robot),
    );
  });
});

describe("selectBestFrontierTarget", () => {
  it("returns null when there are no frontier clusters", () => {
    expect(selectBestFrontierTarget([], { x: 0, y: 0 })).toBeNull();
  });

  it("targets the nearest cell of the highest-scoring cluster", () => {
    const nearSmall = [{ x: 2, y: 0 }];
    const farLarge = Array.from({ length: 20 }, (_, i) => ({ x: 10 + i, y: 0 }));
    const robot = { x: 0, y: 0 };
    const target = selectBestFrontierTarget([nearSmall, farLarge], robot);
    // farLarge wins on score; nearest cell of that cluster is (10, 0).
    expect(target).toEqual({ x: 10, y: 0 });
  });
});
