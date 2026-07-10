# Recon

[![CI](https://github.com/ctkrug/recon/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/recon/actions/workflows/ci.yml)

Drop a robot into a fog-covered map it cannot see, and watch it map the unknown
using real **frontier-based exploration** — the same family of algorithms that
drives autonomous exploration in real mobile robotics (SLAM frontier planners).
No cheating with a pre-known grid: the robot only knows what its simulated
sensor has actually swept, and it has to reason about where the map _might_
still open up.

## Why

Most "pathfinding visualizer" projects show a robot finding the shortest route
across a map it can already see in full. That's a solved, saturated genre.
Recon is different on purpose: the map starts as solid fog, and the robot's
job is to figure out _where to look next_. Frontiers — the boundary cells
between known-free space and unknown space — are detected live from the
robot's accumulated occupancy grid, clustered, scored, and the nearest/best
one is chosen as the next exploration target. The fog peels back organically
as a result, not on a timer or a scripted reveal.

## The wow moment

The map starts as solid black fog. As the robot creeps forward, its sensor
sweep clears a circle of visibility, frontier cells get detected and
re-clustered every step, and the fog visibly peels away in an organic,
uneven front — like watching a Metroidvania map fill itself in, live, with no
two runs ever revealing the map the same way twice.

## How it works

1. **Occupancy grid** — the robot maintains its own grid of `unknown` /
   `free` / `wall` cells, built up entirely from what its sensor has swept.
2. **Simulated sensor** — a Bresenham line-of-sight sweep from the robot's
   current position each tick reveals cells up to sensor range, occluded by
   the first wall hit along each line.
3. **Frontier detection** — cells that are `free` and adjacent to `unknown`
   are frontier cells; they're clustered into contiguous frontier regions.
4. **Frontier scoring & selection** — each frontier region is scored on size
   and distance from the robot; the robot commits to the best one and paths
   to it (grid A\*) through known-free space, retrying the next-best region
   if the chosen one turns out unreachable.
5. **Repeat** until no frontiers remain — the map is fully explored,
   coverage/steps/elapsed time freeze at their final values, and a
   completion overlay reports the run's stats with a one-click "Explore a
   new map" restart.

Every sensor sweep, frontier lock, step, and completion plays a short
WebAudio-synthesized tone (no audio files); a mute toggle in the HUD
persists across reloads.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map and
data flow.

## Stack

- **TypeScript** for the simulation core (occupancy grid, frontier detection,
  path planning) — deterministic, unit-testable, framework-free.
- **HTML5 Canvas** for rendering the fog, the grid, and the robot, driven by
  `requestAnimationFrame`.
- **Vite** for dev server + static production build (single self-contained
  `dist/` output, relative asset paths — deployable under any subpath).
- **Vitest** for unit tests of the simulation core.

## Status

The core exploration engine (Epic 1) is built and playable end to end: press
Start and the fog peels back live as the robot senses, detects frontiers,
plans, and moves. See [`docs/VISION.md`](docs/VISION.md) for the full design
and [`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # run the unit test suite
npm run build    # production build into dist/
```

## License

MIT — see [`LICENSE`](LICENSE).
