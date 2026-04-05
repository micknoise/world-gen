# World Generation Tutorials

This repository contains a set of small JavaScript tutorials that demonstrate how common map-generation algorithms produce simple game-world layouts.

Each tutorial:

- uses plain browser JavaScript with no Node requirement
- runs directly in the browser with no build step
- is implemented in a single self-contained `index.html` per tutorial
- generates a world using a seeded algorithm
- exports a shared JSON environment format
- renders from that JSON onto an HTML Canvas

## Tutorials

1. Random Walk Dungeon
2. Cellular Automata Cave
3. BSP Dungeon
4. Quadtree Region Split
5. Rectangle Packing Rooms
6. Voronoi Region Map
7. Delaunay Plus MST Room Graph
8. Noise Terrain Map
9. Ridge Dungeon
10. SDF Rooms
11. Domain Warp Cave
12. Wave Dungeon
13. Gaussian Rooms

Open [index.html](./index.html) in a browser to navigate the tutorials.

## Shared Environment Format

All tutorials generate a JSON object with the same core structure:

- `version`
- `algorithm`
- `seed`
- `space`
- optional `tiles`, `regions`, `paths`, `graph`, `markers`, and `metadata`

The renderer uses that object as the source of truth so the output can be reused by other rendering approaches beyond Canvas.

## Developer notes

- A shared runtime and utilities were added in `shared/tutorial-runtime.js` and `shared/utils.js` to centralise wiring (Generate/Export/3D toggles) and reduce duplication across tutorials.
- Tutorials were migrated to import the runtime as ES modules and now call `initTutorial(...)` from their script blocks.
- Quick smoke check (verifies tutorials import the runtime):

```bash
python3 tools/smoke_check.py
```

Work was done on branch `refactor/simplify-runtime`.
