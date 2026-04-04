# Quadtree Region Split

This tutorial uses recursive four-way subdivision to create a set of rectangular sectors inside a larger world.

## What It Explains

- how hierarchical subdivision works
- how map sectors can be generated before gameplay features exist
- why world partitioning and playable layout generation are related but not identical tasks

## Good Uses

- districts
- parcels
- chunk planning
- biome planning areas

## Limits

- does not create roads or paths on its own
- produces partition structure rather than a playable level
- visual variety depends on the split depth and split probability
