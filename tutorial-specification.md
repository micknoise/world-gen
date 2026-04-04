# JavaScript Tutorial Series Specification

## Purpose

This repository should become a set of small, readable JavaScript tutorials that explain how different map-generation algorithms work and what kinds of game-world layouts they produce.

The tutorials should favor clarity over completeness:

- no framework
- no build step
- browser-based JavaScript only
- one HTML page and one JavaScript file per tutorial
- one shared JSON environment format across all tutorials
- one simple Canvas 2D renderer per tutorial

Each tutorial should answer three questions:

1. What is the algorithm doing?
2. What kind of environment does it generate well?
3. What are its limitations for game-world layouts?

## Review Of Current Algorithm List

Source list: `map-generation-algorithms.txt`

### Strong Tutorial Candidates

These are good fits for beginner-friendly environment generation tutorials.

- Binary Space Partitioning: strong for rooms and corridors in dungeon layouts
- Quadtree: useful when presented as recursive world subdivision rather than as a spatial index
- Voronoi diagram: good for region maps, biomes, kingdoms, and territorial layouts
- Delaunay triangulation: useful as a support algorithm for connecting region centers or room centers
- Minimum Spanning Tree (MST): useful as a support algorithm for selecting clean connections between rooms or regions
- Cellular automata: strong for cave layouts and organic spaces
- Circle packing: good for soft organic room placement and open-area region seeds
- Force-directed layout: useful for node-based overworlds and abstract level graphs

### Weak Or Misleading As Standalone World-Generation Tutorials

These are not wrong algorithms, but they are weak fits if the goal is simple playable world layouts.

- Bin Packing Problem: better framed as rectangle placement, not map generation
- MaxRects algorithm: useful for packing rooms into space, but very close to an optimization problem rather than a world generator
- Shelf packing: mainly a packing strategy, not a world-layout tutorial target
- Skyline packing: mainly a packing strategy, not a world-layout tutorial target
- Guillotine packing: mainly a packing strategy, not a world-layout tutorial target
- Polygon triangulation: useful for rendering or mesh processing, but not a standalone environment generator
- Nesting problem: too far from simple game-world layout generation for this tutorial series

### Algorithms That Are Missing And Should Be Added

These are more directly useful for beginner tutorials and typical game maps.

- Random walk / drunkard's walk: one of the simplest dungeon and cave generators
- Maze generation: use recursive backtracker or randomized Prim's algorithm for clear corridor-based layouts
- Noise-based terrain: use value noise or Perlin-style noise for islands, overworlds, and terrain masks
- Heightmap subdivision: diamond-square is a good simple terrain tutorial if a heightmap-focused example is wanted

### Recommendation

Do not make separate tutorials for every packing algorithm in the current list. They are too similar for the learning goal and do not naturally produce good playable layouts on their own.

Instead:

- keep one packing-based tutorial, preferably MaxRects or a simplified rectangle-packing tutorial
- treat Delaunay triangulation and MST as support algorithms inside a graph-based room or region tutorial
- treat polygon triangulation as optional future rendering material, not a core environment tutorial

## Recommended Tutorial Set

The first version of the series should focus on eight tutorials.

1. Random Walk Dungeon
2. Cellular Automata Cave
3. BSP Dungeon
4. Quadtree Region Split
5. Rectangle Packing Rooms
6. Voronoi Region Map
7. Delaunay Plus MST Room Graph
8. Noise-Based Terrain Map

Optional later tutorials:

1. Circle Packing Biome Seeds
2. Force-Directed Overworld Graph
3. Diamond-Square Heightmap

## Technical Constraints

All tutorials should follow the same constraints.

- Use vanilla JavaScript in the browser.
- Use HTML Canvas 2D only.
- Avoid external libraries in the first version.
- Keep source files short enough to read in one sitting.
- Prefer deterministic output through a seeded random number generator.
- Export the final environment as JSON.
- Render only from the JSON environment object, not from hidden algorithm state.

## Shared Environment JSON Scheme

Each tutorial should produce one environment object with the same top-level shape.

```json
{
  "version": "1.0",
  "algorithm": "bsp",
  "seed": 42,
  "space": {
    "mode": "grid",
    "width": 64,
    "height": 48,
    "cellSize": 10
  },
  "tiles": [
    ["wall", "wall", "wall"],
    ["wall", "floor", "wall"],
    ["wall", "floor", "wall"]
  ],
  "regions": [
    {
      "id": "room-1",
      "kind": "room",
      "shape": "rect",
      "x": 8,
      "y": 6,
      "width": 10,
      "height": 7
    }
  ],
  "paths": [
    {
      "id": "corridor-1",
      "kind": "corridor",
      "points": [
        { "x": 12, "y": 9 },
        { "x": 20, "y": 9 },
        { "x": 20, "y": 16 }
      ]
    }
  ],
  "graph": {
    "nodes": [
      { "id": "room-1", "x": 12, "y": 9 }
    ],
    "edges": []
  },
  "markers": [
    { "kind": "start", "x": 12, "y": 9 }
  ],
  "metadata": {
    "notes": "Simple BSP dungeon output"
  }
}
```

### Required Fields

- `version`: schema version
- `algorithm`: short algorithm name
- `seed`: number used to reproduce the output
- `space`: world dimensions and coordinate mode

### Optional Fields

- `tiles`: for tile-based maps such as dungeons, caves, and terrain masks
- `regions`: for rooms, biomes, subdivisions, lakes, islands, or polygons
- `paths`: for corridors, roads, rivers, or corridor polylines
- `graph`: for node-link output such as room connections or region adjacency
- `markers`: for spawn points, exits, treasures, landmarks, or labels
- `metadata`: tutorial-specific values that do not affect rendering

### Coordinate Rules

- Use integer coordinates.
- If `space.mode` is `grid`, coordinates refer to tile positions.
- If `space.mode` is `continuous`, coordinates refer to world units inside the width and height bounds.
- Canvas rendering may scale coordinates, but the JSON should stay resolution-independent.

### Tile Vocabulary

Keep the tile set small and shared where possible.

- `empty`
- `wall`
- `floor`
- `water`
- `grass`
- `sand`
- `rock`
- `road`

Tutorials may add more tile types if needed, but every tutorial should document them.

## Rendering Rules

The environment JSON is the source of truth. The renderer should not depend on generator internals.

### Minimum Canvas Renderer Behavior

Each tutorial should include a Canvas renderer that:

- clears the canvas
- draws the tile layer if `tiles` exists
- overlays `regions` if present
- overlays `paths` if present
- overlays `graph` nodes and edges if present
- overlays `markers` last

### Visual Style

Keep the visuals instructional rather than decorative.

- use flat colors
- use a visible grid only for tile-based tutorials if it helps explanation
- use transparent overlays for region and graph layers
- do not add camera movement, particles, or animation unless the tutorial is specifically about showing generation steps

### Suggested Default Palette

```js
const DEFAULT_COLORS = {
  empty: "#101418",
  wall: "#27313a",
  floor: "#d9d2c3",
  water: "#3a78b9",
  grass: "#7cad62",
  sand: "#d8bf7a",
  rock: "#7f8a91",
  road: "#9b6b3f"
};
```

## Tutorial Page Structure

Each tutorial directory should contain:

```text
tutorials/
  01-random-walk/
    index.html
    README.md
```

### `index.html`

Should contain:

- a title
- a short summary paragraph
- a canvas element
- a small controls panel
- a preformatted JSON preview or download button

For tutorial clarity, each `index.html` should be self-contained and include:

- seeded random number generator
- algorithm generator function
- environment export function
- canvas render function
- minimal UI wiring

### `README.md`

Should explain:

- what the algorithm does
- when it is useful
- parameter meanings
- common failure cases
- how the JSON output maps to the rendered result

## Standard Tutorial Flow

Every tutorial should use the same flow.

1. Define parameters and seed.
2. Run the algorithm.
3. Convert the result into the shared environment JSON object.
4. Render the JSON object on the canvas.
5. Show or export the JSON.
6. Optionally show generation steps for debugging and learning.

## Common UI Requirements

Keep controls consistent across tutorials.

- `seed`
- `width`
- `height`
- one or two algorithm-specific parameters
- `Generate` button
- `Export JSON` button

Avoid large control panels. Each tutorial should emphasize the core idea.

## Tutorial-Specific Notes

### 1. Random Walk Dungeon

- Output type: grid
- Good for: loose cave-like dungeons
- Weakness: poor room structure without post-processing
- JSON emphasis: `tiles`, `markers`

### 2. Cellular Automata Cave

- Output type: grid
- Good for: caves and natural caverns
- Weakness: may create disconnected pockets
- JSON emphasis: `tiles`, optional `regions`

### 3. BSP Dungeon

- Output type: grid plus regions
- Good for: clean room-and-corridor dungeons
- Weakness: can feel too rectangular
- JSON emphasis: `tiles`, `regions`, `paths`, `graph`

### 4. Quadtree Region Split

- Output type: continuous or grid
- Good for: districts, land parcels, or map sectors
- Weakness: not enough by itself for traversal gameplay
- JSON emphasis: `regions`, optional `graph`

### 5. Rectangle Packing Rooms

- Output type: continuous or grid
- Good for: room placement examples
- Weakness: should be treated as placement, not full map generation
- JSON emphasis: `regions`, `graph`, optional rasterized `tiles`

### 6. Voronoi Region Map

- Output type: continuous
- Good for: biome maps, territory maps, abstract overworld regions
- Weakness: boundaries alone do not create playable paths
- JSON emphasis: `regions`, `graph`, `markers`

### 7. Delaunay Plus MST Room Graph

- Output type: graph plus optional grid overlay
- Good for: connecting rooms or settlements
- Weakness: should be presented as a connection strategy, not the entire level generator
- JSON emphasis: `regions`, `graph`, `paths`

### 8. Noise-Based Terrain Map

- Output type: grid
- Good for: islands, continents, and biome masks
- Weakness: needs threshold tuning and often needs erosion or smoothing later
- JSON emphasis: `tiles`, `regions`

## Helper Code Placement

To keep each tutorial easy to read in one place, helper code should live in the same `index.html` file as the algorithm.

Keep helper functions small and local to the page:

- random helpers
- environment object helpers
- renderer helpers
- simple form wiring

## Minimal Renderer Example

This should be the level of simplicity expected in each tutorial.

```js
function renderEnvironment(ctx, environment, colors) {
  const { width, height, cellSize } = environment.space;

  ctx.clearRect(0, 0, width * cellSize, height * cellSize);

  if (environment.tiles) {
    for (let y = 0; y < environment.tiles.length; y += 1) {
      for (let x = 0; x < environment.tiles[y].length; x += 1) {
        const tile = environment.tiles[y][x];
        ctx.fillStyle = colors[tile] || colors.empty;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  if (environment.paths) {
    ctx.strokeStyle = "#ffcc66";
    ctx.lineWidth = 2;
    for (const path of environment.paths) {
      if (!path.points || path.points.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x * cellSize + cellSize / 2, path.points[0].y * cellSize + cellSize / 2);
      for (let index = 1; index < path.points.length; index += 1) {
        const point = path.points[index];
        ctx.lineTo(point.x * cellSize + cellSize / 2, point.y * cellSize + cellSize / 2);
      }
      ctx.stroke();
    }
  }
}
```

## What Not To Do

- Do not mix rendering-only data into the algorithm logic.
- Do not make every tutorial a full game-ready generator.
- Do not introduce large utility libraries.
- Do not create different output formats per tutorial.
- Do not rely on Canvas-specific state as the only representation of the result.

## Delivery Plan

Build the tutorials in this order:

1. Random Walk Dungeon
2. Cellular Automata Cave
3. BSP Dungeon
4. Voronoi Region Map
5. Delaunay Plus MST Room Graph
6. Noise-Based Terrain Map
7. Quadtree Region Split
8. Rectangle Packing Rooms

This order starts with direct playable maps, then moves into region and graph techniques.

## Acceptance Criteria

The tutorial series is ready when:

- every tutorial runs by opening `index.html` in a browser
- every tutorial generates a valid environment JSON object
- every tutorial renders from that JSON object onto a canvas
- every tutorial explains strengths and weaknesses of the algorithm
- shared helpers are reused without hiding the important algorithm logic
- the same JSON concepts appear across all tutorials

## Final Recommendation

The current list is a reasonable starting point, but it is too heavy on packing and geometry support algorithms. For a tutorial series about simple game-world layouts, the core set should emphasize:

- dungeon carving
- cave generation
- region partitioning
- graph connection
- terrain generation

That combination will give the series broader coverage and produce outputs that are easier to understand, easier to render, and more useful for game-world examples.
