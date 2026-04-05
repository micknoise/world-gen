# Quadtree Region Split

This tutorial uses recursive four-way subdivision to divide a world rectangle into smaller leaf sectors. Each region either splits into four equal quadrants or is kept whole, controlled by a depth limit and a split probability.

## What It Explains

- how hierarchical subdivision produces nested rectangular regions
- how split probability creates irregular partition patterns from the same seed
- why world partitioning and playable layout generation are related but not identical tasks

## Good Uses

- districts
- parcels
- chunk planning
- biome planning areas

## Limits

- does not create roads or paths on its own
- produces partition structure rather than a playable level
- all sector boundaries are axis-aligned rectangles — no irregular or diagonal edges
