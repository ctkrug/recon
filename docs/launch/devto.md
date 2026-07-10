---
title: "I built a robot that maps a fog-covered grid it can't see"
published: false
tags: typescript, canvas, algorithms, robotics
---

# I built a robot that maps a fog-covered grid it can't see

Every pathfinding visualizer I have ever opened shows the same thing: a robot
finding the shortest route across a maze it can already see in full. It is a
nice A\* demo, but it skips the part I actually find interesting. Before you can
find the shortest path, something has to map the space. So I built
[Recon](https://apps.charliekrug.com/recon/): a robot dropped into a
fog-covered grid it has never seen, exploring with real frontier-based
exploration while you watch the fog peel back.

Here are the three decisions that shaped it.

## 1. The robot never reads the map

There are two grids, not one. `groundTruth` is the real cave. `belief` is what
the robot has actually seen. The only code allowed to touch `groundTruth` is
the sensor sweep, which casts Bresenham rays out to a fixed range and copies
cells into `belief` until the first wall blocks each ray. Everything downstream
(frontier detection, scoring, A\* pathfinding) reads `belief` only.

That single rule kept the whole thing honest. The renderer draws `belief`
directly, so what you see on screen is exactly what the robot knows, never more.
It also made the render layer trivial to reason about: there is no "reveal"
animation logic, because the fog is not a visual effect. It is the absence of
data.

## 2. Frontiers, clustered and scored

A frontier cell is a free cell that borders an unknown cell. That is the whole
definition, and it is the entire idea behind frontier-based exploration: the
boundary between what you know and what you don't is exactly where new
information lives.

Naively every step produces dozens of frontier cells, so I cluster adjacent
ones (8-connectivity) into regions and score each region as
`size - 0.5 * distance` from the robot. Size dominates, so the robot heads for
big unexplored pockets, but the distance term breaks ties so it does not trek
across the map for a marginal gain. The chosen region's nearest cell becomes the
A\* target. If that target turns out to be unreachable through known-free space,
it falls through to the next-best region instead of stalling.

The nice side effect is that the exploration order looks intelligent without any
scripting. It clears a room, notices the doorway it has been ignoring, and
commits to it.

## 3. Property tests, because the invariants are the spec

The core is pure functions over grids, which made it a good fit for
property-based testing with `fast-check`. Instead of asserting one hand-picked
example, I assert the invariants that must hold for every input:

- every cell A\* returns is Free and 4-connected to the previous one,
- every cell the flood fill marks reachable is actually Free on that grid,
- the sensor never reveals a cell beyond its range,
- coverage always lands in `[0, 1]`.

These caught more real bugs than my example tests did, especially around
off-by-one grid bounds and degenerate tiny maps. The `sim/` module ended at
100% line coverage, and the property tests are the reason I trust it rather than
just the number.

## What I would do differently

Coverage is currently the fraction of reachable free cells the robot has
confirmed, which means a map can hit 100% before the robot has physically
visited every corner (line of sight counts). That is correct for "is it mapped",
but a second "distance travelled vs optimal" metric would make the runs more
fun to compare. I would also add a heatmap of visit frequency; some seeds
produce lovely backtracking patterns you cannot see in a single pass.

Recon is TypeScript and Canvas, no framework, and it is a single static build
you can drop under any path.

- Live: https://apps.charliekrug.com/recon/
- Code: https://github.com/ctkrug/recon

If you build robots or just like watching algorithms think, I would love to know
which seeds you find.
