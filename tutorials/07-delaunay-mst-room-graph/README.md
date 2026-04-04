# Delaunay Plus MST Room Graph

This tutorial treats room centers as graph nodes and uses geometric relationships to build clean connections.

## What It Explains

- how triangulation suggests nearby useful neighbors
- how a minimum spanning tree keeps the graph connected with fewer edges
- why connection strategy is often its own stage in map generation

## Good Uses

- room graphs
- settlement networks
- high-level corridor planning

## Limits

- does not rasterize corridors by itself
- triangulation is support logic, not a complete map generator
- extra edges need tuning or the result becomes too dense
