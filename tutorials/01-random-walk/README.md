# Random Walk Dungeon

This tutorial demonstrates one of the simplest map-generation techniques: place a walker at the center of a grid and turn each visited cell into floor as it moves.

## What It Explains

- how random movement carves space
- why repeated local decisions create cave-like layouts
- why a simple algorithm can still produce usable playable space

## Good Uses

- loose caves
- mine tunnels
- introductory procedural generation examples

## Limits

- does not naturally create distinct rooms
- can leave isolated wall-heavy corners
- often needs post-processing if you want clearer routes
