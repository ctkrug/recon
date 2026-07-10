# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Project scaffold: Vite + TypeScript + Vitest, ESLint, Prettier, CI.
- `docs/VISION.md`, `docs/DESIGN.md`, and `docs/BACKLOG.md`.
- Initial occupancy grid data structure and canvas bootstrap.
- Core frontier-exploration engine: seeded map generation, line-of-sight
  sensor sweep, frontier detection/clustering/scoring, grid A\* path
  planning, and the exploration orchestrator tying them together.
- Playable app: blueprint-HUD canvas renderer, coverage/steps/elapsed
  readouts, and start/pause/restart/speed/seed controls.
- `docs/ARCHITECTURE.md` documenting the module map and data flow.
- Synth SFX (sensor-ping, frontier-lock, step, complete) generated from
  WebAudio oscillators, with a mute toggle persisted to `localStorage`.
- A completion celebration overlay reporting steps/elapsed/coverage on
  reaching 100%, with an "Explore a new map" CTA.
- Property-based tests (`fast-check`) for the simulation core's key
  invariants: grid bounds, RNG determinism/range, path traversal validity,
  frontier clustering/scoring, reachability, sensor range, and coverage
  bounds.

### Fixed

- The app no longer crashes at startup if `localStorage` throws (blocked
  by a sandboxed embed or a strict privacy setting) — the mute preference
  falls back to an in-memory store for that session instead.
- The HUD status readout now announces state changes (`role="status"`,
  `aria-live="polite"`) instead of updating silently for screen readers.
- The page now has a `<main>` landmark.
