# Architecture

A map of the codebase for anyone (including a future build session) picking
this up cold. See [`docs/VISION.md`](VISION.md) for why it's built this way
and [`docs/DESIGN.md`](DESIGN.md) for the visual direction.

## Layout

```
src/
  sim/            deterministic simulation core — no DOM, no Canvas, fully unit-tested
    grid.ts        OccupancyGrid: the robot's belief grid (Unknown/Free/Wall cells)
    rng.ts         seeded PRNG (xmur3 + mulberry32) — same seed, same map, always
    mapgen.ts      ground-truth map generation (cellular automaton) + flood-fill reachability
    sensor.ts      line-of-sight sweep: reveals belief cells from ground truth, wall-occluded
    frontier.ts    frontier-cell detection, region clustering, size/distance scoring
    pathfind.ts    grid A* over the belief grid (only through known-Free cells)
    explorer.ts    orchestrator: ties the above into step()/coverage()/start()/pause()/restart()
  render/         rendering — pure helpers are unit-tested; canvas.ts touches the DOM and isn't
    palette.ts     design-token colors + cell -> color mapping
    easing.ts      easeOutCubic/lerp for the robot's cell-to-cell tween
    layout.ts      computeGridDimensions() — matches map aspect ratio to the stage container
    canvas.ts      the actual canvas draw calls (fog/grid/robot) + backing-store resize
  main.ts         entrypoint: builds the DOM (stage + HUD), owns the simulation loop and
                  all UI event wiring (start/pause/restart/speed/seed)
  style.css       design tokens (docs/DESIGN.md) + all component styling
```

## Data flow

```
seed ──> mapgen.generateMap ──> { groundTruth, start }
                                      │
                    explorer.createExploration
                                      │
                                      ▼
                          ExplorationState (belief starts
                          all-Unknown except robot's cell)
                                      │
                    ┌─────────────────┴─────────────────┐
                    │         explorer.step() (per tick) │
                    │  1. sensor.sweep(groundTruth,       │
                    │     belief, robot, sensorRange)     │
                    │  2. if path exhausted:               │
                    │     frontier.findFrontierCells       │
                    │     frontier.clusterFrontiers        │
                    │     frontier.scoreFrontierRegion      │
                    │       (best-first, skip unreachable) │
                    │     pathfind.findPath(belief, ...)   │
                    │  3. advance robot one cell along path │
                    └─────────────────┬─────────────────┘
                                      ▼
                        main.ts render loop reads belief +
                        robot position, draws via render/canvas.ts
```

Ground truth and belief are always two separate `OccupancyGrid` instances
with no shared reference — `sensor.sweep` is the only function allowed to
read both. Everything downstream (frontier detection, pathing, rendering)
only ever sees `belief`, so the fog on screen is always a direct
visualization of the robot's actual knowledge, never a scripted reveal.

## Simulation loop (main.ts)

`main.ts` runs a single `requestAnimationFrame` loop that:

1. Accumulates elapsed time and, while `status === "running"`, calls
   `explorer.step()` at a rate controlled by the speed slider (1–15
   ticks/second), decoupled from render framerate.
2. Tweens the robot's on-screen position between its previous and current
   logical cell over 100ms (`render/easing.ts`) so movement never teleports.
3. Redraws every animation frame regardless of tick rate, and updates the
   HUD readouts (coverage/steps/elapsed) from the current `ExplorationState`.

The map's grid dimensions are computed once at startup from the stage
container's own aspect ratio (`render/layout.ts`), so the generated map
always fills the canvas edge-to-edge with the whole map visible — no
letterboxing, no cropped-off regions.

## Coverage

`explorer.coverage()` divides known-Free cells (in `belief`, intersected
with the reachable set) by the total reachable-Free cell count computed
once at map generation via `mapgen.floodFillReachable`. Exploration is
"done" when no frontier region remains reachable from the robot.

## Running it

```sh
npm install
npm run dev        # dev server
npm test           # unit tests (vitest)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build into dist/ (base-relative, subpath-deployable)
npm run check        # lint + typecheck + test, combined
```
