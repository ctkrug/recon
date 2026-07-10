# Design

## 1. Aesthetic direction

**Recon is a blueprint/technical HUD**: a robot-recon readout rendered like
an engineering schematic — deep blueprint-navy canvas, cyan ruled grid
lines, amber for the robot and anything "live," corner-bracket instrument
panels instead of cards. It should feel like you're watching a rover's
telemetry feed, not browsing a web app.

This is deliberately not another dark-gray-cards-plus-accent page: no
rounded glassy panels, no soft drop shadows. Blueprint schematics are flat,
ruled, and precise — sharp corners, dashed grid lines, corner tick marks,
monospace readouts.

## 2. Tokens

| Token              | Value     | Use                                                        |
| ------------------ | --------- | ---------------------------------------------------------- |
| `--bg`             | `#0a1628` | page background — blueprint navy                           |
| `--surface-1`      | `#0f2038` | HUD panel background                                       |
| `--surface-2`      | `#142a4a` | raised panel / active control background                   |
| `--text`           | `#e8f0fa` | primary text                                               |
| `--text-muted`     | `#7f97b8` | labels, secondary readouts                                 |
| `--accent`         | `#4fd1ff` | schematic cyan — grid lines, known/free cells, focus rings |
| `--accent-support` | `#ffb547` | amber — robot, frontier highlight, active sensor sweep     |
| `--success`        | `#5ee6a0` | exploration complete                                       |
| `--danger`         | `#ff6b6b` | blocked / error state                                      |

**Type pairing**

- Display: **Space Mono** (Google Fonts, weight 700) — wordmark, section
  headings, the coverage-% readout. Fallback: `"Courier New", monospace`.
- UI: **Inter** (Google Fonts, weights 400/500/600) — body copy, control
  labels, buttons. Fallback: `system-ui, sans-serif`.

**Spacing** — 8px scale: `4, 8, 16, 24, 32, 48, 64`.

**Corner radius** — `2px` on interactive controls only (buttons, inputs);
panels and the canvas frame are square-cornered, per the blueprint direction.

**Shadow / glow** — no soft drop shadows. Panels get a 1px `--accent` border
at low opacity plus corner tick marks (short cyan strokes at each corner,
like a HUD reticle). Active/live elements (the robot, an armed control) get
a `box-shadow: 0 0 12px var(--accent-support)` glow instead of a shadow.

**Motion** — UI transitions `150ms ease-out`. Robot movement tweens
`100ms ease-out` between grid cells (never teleports). Frontier cell reveal
is a `120ms` fade-in with a brief cyan "scan wipe" across the newly-revealed
cells.

## 3. Layout intent

The hero is **the map canvas** — the fog, the grid, the robot. It is flanked
by a HUD side panel styled as an instrument readout (coverage %, steps
taken, elapsed time, speed control, seed + restart, mute).

- **Desktop (1440×900):** two-column — canvas takes the left ~68% of the
  viewport at full height; the HUD panel is a fixed-width right rail
  (~320px) with corner-bracket framing, stacked readout rows, and controls
  at the bottom.
- **Phone (390×844):** single column — canvas on top, sized to ~60vh, full
  width; HUD panel below as a full-width strip with the same corner-bracket
  framing, controls in a row that wraps.

No dead space: the canvas always fills its container edge-to-edge (resized
via `devicePixelRatio` on every resize/orientation change), and the HUD rail
never floats in empty background — it's framed top-to-bottom.

## 4. Signature detail

The wordmark **RECON** is set in Space Mono, letter-spaced, inside a
blueprint title-block (a bordered box with corner ticks, like the title
block in the corner of an engineering drawing) — not just the name in a
heading font. Behind the idle/empty map (before the user presses start), a
faint radar-style sweep line rotates slowly around the map center, so the
page has motion and personality even before exploration begins.

## 5. The juice plan

Recon is an interactive toy, not a scored game, but every action still gets
a felt response:

- **Movement tween** — the robot glides cell-to-cell over 100ms ease-out;
  it never snaps.
- **Sensor sweep feedback** — each sweep briefly draws an expanding amber
  ring from the robot's position, and newly-revealed fog cells cyan-wipe
  in over 120ms.
- **Frontier feedback** — the frontier region the robot commits to next
  pulses amber once when selected.
- **Completion celebration** — when no frontiers remain, the HUD's
  coverage readout locks at 100%, the panel border flashes `--success`,
  and a summary overlay reports steps taken / time elapsed / coverage, with
  a single "Explore a new map" CTA.
- **Synth SFX (WebAudio, generated in code — no audio files):**
  - `sensor-ping` — short soft triangle-wave blip on each sensor sweep
  - `frontier-lock` — a short two-tone tick when the robot commits to a
    new frontier
  - `step` — a very quiet low click per grid cell moved, rate-throttled
  - `complete` — a short ascending three-note chime on 100% coverage
  - A mute toggle in the HUD persists its state in `localStorage`; the
    `AudioContext` is created lazily on the first user gesture (start
    button) and all calls are guarded for environments where it's
    unavailable.
- Respects `prefers-reduced-motion`: drops the sweep-ring and scan-wipe
  animations but keeps the fog reveal and robot movement functional
  (instant instead of tweened).
