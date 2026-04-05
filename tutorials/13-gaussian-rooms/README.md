# Gaussian Rooms

This tutorial represents each room as a Gaussian probability density — a smooth bell curve centred on a random point. The density contributions from all rooms are summed at every pixel. Where neighbouring rooms are close enough, their Gaussians overlap and the combined density exceeds the threshold, forming corridors without any explicit connection logic.

## What It Explains

- how a sum of Gaussians produces a continuous density field across the whole map
- why rooms that are close together automatically merge and create passages
- how spread controls the trade-off between isolated distinct rooms and fully merged blobs

## Good Uses

- organic settlements
- alien hives or fungal colonies
- interconnected cavern clusters
- soft biome seeds with natural blending boundaries

## Limits

- rooms that are too far apart remain unconnected with no fallback path
- the density-based floor colouring is gradient rather than binary, which needs threshold tuning
- no explicit graph or path structure is generated
