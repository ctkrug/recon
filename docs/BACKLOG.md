# Backlog

Stories are grouped into epics. Every story lists concrete, verifiable
acceptance criteria — checks a later run (or reviewer) can confirm true or
false, not vibes. The first story of Epic 1 is the wow moment: it ships
before anything else.

## Epic 1 — Core Exploration Engine (the wow moment)

- [x] **Frontier-based autonomous exploration on a fog-covered map** — the
      core wow moment: the map starts as solid fog and the robot explores it
      live using real frontier detection, not a pre-known path.
  - Starting a run renders the entire map as opaque fog except the robot's
    start cell.
  - Pressing start moves the robot autonomously with no further input,
    until either no frontiers remain or the user pauses.
  - The frontier set (free cells adjacent to unknown cells) is recomputed
    each step from the robot's own occupancy grid, never from ground truth.

- [x] **Simulated sensor sweep reveals fog**
  - Each tick, cells within sensor range along an unobstructed line of
    sight from the robot's position transition from unknown to free/wall
    in the occupancy grid.
  - A wall cell occludes the sweep — cells directly behind it from the
    robot's viewpoint stay unknown that tick.

- [x] **Frontier clustering and scoring**
  - Adjacent frontier cells are grouped into one frontier region rather
    than scored as independent targets.
  - Given two frontier regions of different size and distance, a unit test
    confirms the scoring function picks the intended higher-scored region.

- [x] **Grid-based path planning to the chosen frontier**
  - The robot's computed path to a chosen frontier only traverses cells
    marked free in its own occupancy grid (never unknown or wall cells).
  - If the chosen frontier becomes unreachable mid-path, the robot
    recomputes a new frontier target instead of stalling.

- [x] **Exploration termination and coverage reporting**
  - When no frontier regions remain, autonomous movement stops and a
    "fully explored" state is reported.
  - Coverage % is computed as known cells / total reachable cells and
    matches a hand-checked value on a small fixture map in a unit test.

## Epic 2 — Map & Playback Controls

- [x] **Seeded map generation**
  - Entering the same seed twice produces an identical ground-truth map,
    verified by a unit test comparing two generated grids cell-for-cell.
  - A "randomize seed" control generates a new map and resets all
    exploration state.

- [x] **Playback speed control**
  - A speed control changes simulation ticks-per-second without
    restarting the current exploration run.
  - At the minimum speed setting, the simulation still visibly advances
    within 2 seconds (never effectively paused).

- [x] **Pause, resume, and restart**
  - Pausing mid-run halts robot movement and fog reveal until resumed,
    with all occupancy-grid state preserved across the pause.
  - Restart clears the occupancy grid and robot position but reuses the
    current seed unless the user explicitly requests a new one.

## Epic 3 — HUD, Visualization & Design Polish

- [x] **Fog-of-war rendering driven directly by grid state**
  - Every render frame, each cell's color/opacity is derived directly from
    the occupancy grid's unknown/free/wall value — no separate "revealed"
    flag that could desync from the grid.

- [x] **HUD readouts — coverage, steps, elapsed time**
  - Coverage %, steps taken, and elapsed time update at least once per
    second during an active run.
  - All three readouts freeze at their final values on exploration
    completion.

- [x] **Design polish pass — blueprint HUD direction applied**
  - Page matches `docs/DESIGN.md` tokens (palette, Space Mono/Inter type
    pairing, corner-bracket panel framing) at both 1440px and 390px
    widths with no horizontal scroll at either.
  - Every interactive control (buttons, speed slider, seed input) has
    themed hover, focus-visible, active, and disabled states — no
    unstyled native widgets ship.

- [ ] **Synth SFX and persistent mute toggle**
  - `sensor-ping`, `frontier-lock`, `step`, and `complete` sounds are all
    generated via WebAudio oscillators/noise in code — no audio file
    assets are added to the repo.
  - Toggling mute persists across a page reload via `localStorage`.

- [ ] **Completion celebration overlay**
  - On reaching 100% coverage, an overlay appears reporting steps taken,
    elapsed time, and coverage percentage.
  - The overlay's "Explore a new map" button starts a fresh run with a
    newly randomized seed.

## Epic 4 — Quality & Deployment

- [x] **Unit test coverage for the simulation core**
  - The occupancy grid, sensor sweep, frontier detection, and path
    planner each have passing unit tests.
  - At least one test per module exercises an edge case (sensor
    occlusion, an unreachable frontier, a fully-walled-off region).

- [x] **CI-verified static production build deployable under a subpath**
  - `npm run build` produces a `dist/` directory that serves and runs
    correctly under a non-root base path (e.g. `vite preview --base
/recon/`), matching the `apps.charliekrug.com/recon` deployment
    target.
  - The GitHub Actions CI workflow runs lint, typecheck, tests, and the
    build on every push and pull request, and is green on `main`.
