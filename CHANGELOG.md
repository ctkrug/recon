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
