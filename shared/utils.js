// Shared utilities for world-gen tutorials
export function downloadJson(env, filename = 'environment.json') {
  if (!env) return;
  const blob = new Blob([JSON.stringify(env, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildGridFromField(fieldFn, W, H, threshold, options = {}) {
  const tiles = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => (fieldFn(x, y) > threshold ? 'floor' : 'wall'))
  );
  const seed = options.seed !== undefined ? options.seed : null;
  return {
    version: '1.0',
    algorithm: options.algorithm || 'continuous-field',
    seed,
    space: { mode: 'grid', width: W, height: H, cellSize: options.cellSize || 8 },
    tiles,
    metadata: Object.assign({}, options.metadata || {}, { threshold })
  };
}

export function countFloorTiles(env) {
  if (!env || !env.tiles) return 0;
  let c = 0;
  for (const row of env.tiles) for (const t of row) if (t === 'floor') c++;
  return c;
}
