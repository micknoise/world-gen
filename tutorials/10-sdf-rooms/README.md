# SDF Rooms

This tutorial places circular rooms and capsule-shaped corridors defined entirely as signed distance functions. Every pixel is tested against all shapes simultaneously. A smooth-minimum function merges shapes where they meet, so joints between rooms and corridors are rounded rather than sharp.

## What It Explains

- how a signed distance function describes a shape as a scalar field rather than a list of edges
- how smooth-minimum replaces hard union to blend adjacent shapes together
- why SDF-based layout generation needs no explicit room graph to produce connected spaces

## Good Uses

- architectural dungeons
- laboratory or facility complexes
- floorplans where rounded organic joins are wanted alongside hard-edged rooms

## Limits

- each room connects only to its single nearest neighbour, so isolated clusters can form
- the layout cannot be pre-targeted to a specific configuration
- smoothing too high merges everything into a single blob
