# Vision

## The problem

The pathfinding-visualizer genre is saturated, and every entry in it cheats
the same way: the "unknown" map is actually fully known to the algorithm the
whole time — Dijkstra/A\*/BFS just aren't allowed to look at cells outside a
radius yet, but the maze itself never changes shape based on what's been
seen. That's a search problem, not an exploration problem, and it's been
built a hundred times.

Real exploration — the kind an actual robot (or a Mars rover, or a SLAM
stack) has to do — is a different, harder problem: you don't know the map
exists beyond what your sensor has swept, and you have to *decide where to
look next* using only that partial knowledge. That decision problem (frontier
detection + selection) is the interesting part, and almost nobody visualizes
it.

## Who it's for

People who enjoy watching algorithms run — the same audience that shares
pathfinding-visualizer GIFs — but who've seen that genre before and want to
see something they haven't: a map that reveals itself, unpredictably, driven
by a robot that's genuinely guessing where to look next.

## The core idea

Drop a robot into a map that is, from the robot's point of view, **solid
fog**. Every tick:

1. The robot's simulated sensor sweeps a radius (or field of view) around its
   current position and reveals whatever's really there (free space or
   walls) into the robot's own occupancy grid — a grid *only the robot
   maintains*, never the ground truth.
2. **Frontier cells** — free cells adjacent to at least one unknown cell —
   are detected from that occupancy grid and clustered into contiguous
   frontier regions.
3. Each frontier region is scored (a mix of region size and distance from
   the robot — bigger, closer frontiers are more attractive) and the
   robot commits to the best one.
4. The robot paths to that frontier through *known* free space (grid A\*)
   and repeats.
5. Exploration ends when no frontier regions remain — every reachable cell
   has been swept.

The fog rendering is a direct visualization of the occupancy grid's
`unknown` cells, so the "organic peeling" the wow moment promises isn't a
scripted animation — it's literally the algorithm's belief state, redrawn
every frame.

## Key design decisions

- **No cheating.** The renderer is only ever allowed to read the robot's
  occupancy grid, never the ground-truth map, except to compute what the
  sensor sweep should reveal. This is enforced by keeping ground truth and
  belief as two separate data structures with no shared reference.
- **Deterministic core, replaceable shell.** The simulation (grid, sensor,
  frontier detection, path planning) is plain TypeScript with no DOM or
  Canvas dependency, so it's unit-testable in isolation and the rendering
  layer is a thin, swappable consumer of its state.
- **Frontier clustering, not single-cell targeting.** Individual frontier
  *cells* are noisy; clustering them into regions before scoring is what
  makes the robot's choices look purposeful instead of jittery.
- **Deterministic seeding.** Maps are generated from a seed so a run can be
  replayed or shared, and so tests can assert exact outcomes.
- **Static, self-contained deployment.** Vite build with relative asset
  paths — the whole app is one `dist/` directory, deployable under any
  subpath with no server-side component.

## What "v1 done" looks like

- A user can load the page, pick or generate a seeded map, and press
  start — no configuration required to see the wow moment.
- The robot autonomously explores end-to-end using real frontier detection
  and selection, with the fog peeling back live as it goes.
- Exploration terminates cleanly when the map is fully mapped, with a clear
  "done" state (coverage %, steps taken, time elapsed).
- The user can control playback speed, and restart with a new seed.
- The core simulation (grid, sensor, frontier detection, path planning) has
  unit test coverage for its core invariants.
- The page meets the project's design standard (see `docs/DESIGN.md`) on
  both desktop and phone widths.
