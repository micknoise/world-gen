/**
 * AFrameRenderer — shared A-Frame 3D renderer for world-gen tutorials.
 *
 * Public API (attached to window):
 *   AFrameRenderer.renderGridEnv(env, containerEl, options)
 *     env     — environment JSON from generateEnvironment()
 *     options — { mode: 'indoor' | 'outdoor' }
 *
 *   AFrameRenderer.renderContinuousField(fieldFn, W, H, threshold, containerEl, options)
 *     fieldFn   — function(col, row) → number; values > threshold = floor
 *     threshold — floor/wall boundary value
 *     options   — { mode: 'indoor' | 'outdoor' }
 *
 *   AFrameRenderer.destroyScene(containerEl)
 *
 * Indoor:  InstancedMesh walls + navmesh floor (c-frame aframe-extras movement-controls)
 *          Player-mounted point light as the primary light source.
 * Outdoor: subdivided PlaneGeometry with DataTexture displacement map (GPU bilinear smoothing).
 *          Flat invisible navmesh at y=0 prevents falling off.
 */
(function () {
  'use strict';

  // Each tile is CELL_SCALE world units wide/deep.
  // Increase to slow apparent movement and give rooms more physical presence.
  var CELL_SCALE = 3;
  var WALL_H     = 3;   // ceiling height in world units

  // ── Public API ──────────────────────────────────────────────────────────────

  window.AFrameRenderer = {
    renderGridEnv: renderGridEnv,
    renderContinuousField: renderContinuousField,
    destroyScene: destroyScene
  };

  // ── Grid-based renderer (tutorials 01–08) ────────────────────────────────────

  function renderGridEnv(env, containerEl, options) {
    options = options || {};
    var mode = options.mode || 'indoor';
    destroyScene(containerEl);
    var scene = createScene(containerEl, mode);

    function build() {
      var THREE = AFRAME.THREE;
      if (env.tiles) {
        if (mode === 'indoor') buildGridIndoor(env, scene, THREE);
        else buildGridOutdoor(env, scene, THREE);
      } else if (env.regions) {
        buildRegionScene(env, scene, mode, THREE);
      }
      placePlayer(scene, findSpawnFromEnv(env), mode);
    }

    if (scene.hasLoaded) build();
    else scene.addEventListener('loaded', build, { once: true });
  }

  // ── Continuous-field renderer (tutorials 09–13) ───────────────────────────────

  function renderContinuousField(fieldFn, W, H, threshold, containerEl, options) {
    options = options || {};
    var mode = options.mode || 'indoor';
    destroyScene(containerEl);
    var scene = createScene(containerEl, mode);

    function build() {
      var THREE = AFRAME.THREE;
      if (mode === 'indoor') buildFieldIndoor(fieldFn, W, H, threshold, scene, THREE);
      else buildFieldOutdoor(fieldFn, W, H, scene, THREE);
      placePlayer(scene, findSpawnFromField(fieldFn, W, H, threshold), mode);
    }

    if (scene.hasLoaded) build();
    else scene.addEventListener('loaded', build, { once: true });
  }

  // ── Scene teardown ───────────────────────────────────────────────────────────

  function destroyScene(containerEl) {
    var existing = containerEl.querySelector('a-scene');
    if (!existing) return;
    if (existing.object3D) {
      existing.object3D.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(function (m) {
            if (m.map) m.map.dispose();
            if (m.displacementMap) m.displacementMap.dispose();
            m.dispose();
          });
        }
      });
    }
    existing.parentNode.removeChild(existing);
  }

  // ── Scene creation ───────────────────────────────────────────────────────────

  function createScene(containerEl, mode) {
    var scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('renderer', 'antialias: true; colorManagement: true');
    scene.setAttribute('vr-mode-ui', 'enabled: false');

    if (mode === 'indoor') {
      // Fog scaled to CELL_SCALE: player sees ~10 tiles ahead
      scene.setAttribute('fog', 'type: linear; color: #0f1418; near: ' + (CELL_SCALE * 6) + '; far: ' + (CELL_SCALE * 22));
      // Very dim ambient — the player-mounted torch is the main light
      var ambient = document.createElement('a-entity');
      ambient.setAttribute('light', 'type: ambient; color: #223344; intensity: 0.25');
      scene.appendChild(ambient);
    } else {
      scene.setAttribute('fog', 'type: linear; color: #c8dff0; near: ' + (CELL_SCALE * 40) + '; far: ' + (CELL_SCALE * 120));
      scene.setAttribute('background', 'color: #c8dff0');
      // Outdoor: hemisphere sky/ground + directional sun
      var hemi = document.createElement('a-entity');
      hemi.setAttribute('light', 'type: hemisphere; color: #aaccff; groundColor: #7a8a5a; intensity: 0.7');
      scene.appendChild(hemi);
      var sun = document.createElement('a-entity');
      sun.setAttribute('light', 'type: directional; color: #fff5e0; intensity: 1.1; castShadow: false');
      sun.setAttribute('position', '4 12 6');
      scene.appendChild(sun);
    }

    containerEl.appendChild(scene);
    return scene;
  }

  // ── Grid indoor ──────────────────────────────────────────────────────────────

  function buildGridIndoor(env, scene, THREE) {
    var tiles = env.tiles;
    var W = env.space.width, H = env.space.height;
    var CS = CELL_SCALE;
    var floorVerts = [], floorIdx = [], wallPos = [];
    var fvi = 0;

    for (var z = 0; z < H; z++) {
      for (var x = 0; x < W; x++) {
        var tile = tiles[z] && tiles[z][x];
        if (isWalkable(tile)) {
          // Navmesh quad vertices in world units
          floorVerts.push(x*CS, 0, z*CS,   (x+1)*CS, 0, z*CS,   (x+1)*CS, 0, (z+1)*CS,   x*CS, 0, (z+1)*CS);
          floorIdx.push(fvi, fvi+1, fvi+2,   fvi, fvi+2, fvi+3);
          fvi += 4;
        } else {
          wallPos.push([x, z]); // tile indices, scaled in addWalls
        }
      }
    }

    addNavMesh(floorVerts, floorIdx, scene, THREE);

    // Reuse the tutorial's live 2D canvas as the floor texture
    var canvasEl = document.getElementById('map');
    var floorMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: canvasEl ? new THREE.CanvasTexture(canvasEl) : null
    });
    if (!canvasEl) floorMat.color.set(0x2a2e34);
    addFloor(W * CS, H * CS, floorMat, scene, THREE);

    if (wallPos.length) addWalls(wallPos, WALL_H, CS, 0x2d3840, scene, THREE);
    addCeiling(W * CS, H * CS, WALL_H, scene, THREE);
  }

  // ── Grid outdoor ─────────────────────────────────────────────────────────────

  var OUTDOOR_ELEV = {
    water: 0, sand: 0.07, road: 0.10, marsh: 0.18, floor: 0.15,
    grass: 0.28, desert: 0.12, forest: 0.38, snow: 0.88,
    hill: 0.58, rock: 0.82, wall: 0.75, empty: 0.75
  };

  function buildGridOutdoor(env, scene, THREE) {
    var tiles = env.tiles;
    var W = env.space.width, H = env.space.height;
    var CS = CELL_SCALE;
    var data = new Float32Array(W * H);
    for (var z = 0; z < H; z++) {
      for (var x = 0; x < W; x++) {
        var t = tiles[z] && tiles[z][x];
        data[z * W + x] = OUTDOOR_ELEV[t] !== undefined ? OUTDOOR_ELEV[t] : 0.2;
      }
    }
    buildTerrainMesh(data, W * CS, H * CS, W, H, 12, scene, THREE);
    addFlatNavMesh(W * CS, H * CS, scene, THREE);
  }

  // ── Field indoor ──────────────────────────────────────────────────────────────

  function buildFieldIndoor(fieldFn, W, H, threshold, scene, THREE) {
    var CS = CELL_SCALE;
    var floorVerts = [], floorIdx = [], wallPos = [];
    var fvi = 0;

    for (var z = 0; z < H; z++) {
      for (var x = 0; x < W; x++) {
        if (fieldFn(x, z) > threshold) {
          floorVerts.push(x*CS, 0, z*CS,   (x+1)*CS, 0, z*CS,   (x+1)*CS, 0, (z+1)*CS,   x*CS, 0, (z+1)*CS);
          floorIdx.push(fvi, fvi+1, fvi+2,   fvi, fvi+2, fvi+3);
          fvi += 4;
        } else {
          wallPos.push([x, z]);
        }
      }
    }

    addNavMesh(floorVerts, floorIdx, scene, THREE);

    var canvasEl = document.getElementById('map');
    var floorMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: canvasEl ? new THREE.CanvasTexture(canvasEl) : null
    });
    if (!canvasEl) floorMat.color.set(0x1a1f24);
    addFloor(W * CS, H * CS, floorMat, scene, THREE);

    if (wallPos.length) addWalls(wallPos, WALL_H, CS, 0x2d3840, scene, THREE);
    addCeiling(W * CS, H * CS, WALL_H, scene, THREE);
  }

  // ── Field outdoor ─────────────────────────────────────────────────────────────

  function buildFieldOutdoor(fieldFn, W, H, scene, THREE) {
    var CS = CELL_SCALE;
    var data = new Float32Array(W * H);
    for (var z = 0; z < H; z++) {
      for (var x = 0; x < W; x++) {
        data[z * W + x] = Math.max(0, Math.min(1, fieldFn(x, z)));
      }
    }
    buildTerrainMesh(data, W * CS, H * CS, W, H, 14, scene, THREE);
    addFlatNavMesh(W * CS, H * CS, scene, THREE);
  }

  // ── Region scene (tutorials 04, 05, 07) ──────────────────────────────────────

  var REGION_PALETTE = [0xd57a66, 0x5a8f7b, 0xd0a95f, 0x6b8bc9, 0xb484c4, 0x8f784f, 0x4a9abb, 0xc97474];

  function buildRegionScene(env, scene, mode, THREE) {
    var CS = CELL_SCALE;
    env.regions.forEach(function (region, i) {
      var h = mode === 'outdoor' ? (i % 5 + 1) * CS * 0.6 : 0.2;
      var geo = new THREE.BoxGeometry(region.width * CS, h, region.height * CS);
      var mat = new THREE.MeshLambertMaterial({ color: REGION_PALETTE[i % REGION_PALETTE.length] });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((region.x + region.width / 2) * CS, h / 2, (region.y + region.height / 2) * CS);
      scene.object3D.add(mesh);
    });

    if (env.paths) {
      var pathMat = new THREE.MeshLambertMaterial({ color: 0x9b6b3f });
      env.paths.forEach(function (path) {
        if (!path.points || path.points.length < 2) return;
        var a = path.points[0], b = path.points[path.points.length - 1];
        var dx = (b.x - a.x) * CS, dz = (b.y - a.y) * CS;
        var len = Math.hypot(dx, dz);
        if (len < 0.01) return;
        var geo = new THREE.BoxGeometry(len, 0.15, CS * 0.3);
        var mesh = new THREE.Mesh(geo, pathMat);
        mesh.position.set((a.x + b.x) / 2 * CS, 0.075, (a.y + b.y) / 2 * CS);
        mesh.rotation.y = -Math.atan2(dz, dx);
        scene.object3D.add(mesh);
      });
    }

    if (env.graph && env.graph.edges) {
      var nodes = {};
      (env.graph.nodes || []).forEach(function (n) { nodes[n.id] = n; });
      var edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      env.graph.edges.forEach(function (edge) {
        var a = nodes[edge.source], b = nodes[edge.target];
        if (!a || !b) return;
        var pts = [
          new THREE.Vector3(a.x * CS, 0.2, a.y * CS),
          new THREE.Vector3(b.x * CS, 0.2, b.y * CS)
        ];
        var geo = new THREE.BufferGeometry().setFromPoints(pts);
        scene.object3D.add(new THREE.Line(geo, edgeMat));
      });
    }

    // Flat navmesh so player doesn't fall off in either mode
    if (env.space) {
      addFlatNavMesh(env.space.width * CS, env.space.height * CS, scene, THREE);
    }
  }

  // ── Geometry helpers ─────────────────────────────────────────────────────────

  // Navmesh built from explicitly scaled vertices (floorVerts already in world units)
  function addNavMesh(floorVerts, floorIdx, scene, THREE) {
    if (floorVerts.length === 0) return;
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(floorVerts, 3));
    geo.setIndex(floorIdx);
    geo.computeVertexNormals();
    var navMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
    var navEl = document.createElement('a-entity');
    scene.appendChild(navEl);
    navEl.setObject3D('mesh', navMesh);
    navEl.setAttribute('nav-mesh', '');
  }

  // Simple flat invisible quad covering the whole area — used for outdoor floor collision
  function addFlatNavMesh(worldW, worldH, scene, THREE) {
    var verts = [0, 0, 0,  worldW, 0, 0,  worldW, 0, worldH,  0, 0, worldH];
    var idx   = [0, 1, 2,  0, 2, 3];
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    var navMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ visible: false }));
    var navEl = document.createElement('a-entity');
    scene.appendChild(navEl);
    navEl.setObject3D('mesh', navMesh);
    navEl.setAttribute('nav-mesh', '');
  }

  // cellScale: size of one wall box (= CELL_SCALE). wallPos: array of [tileX, tileZ] indices.
  function addWalls(wallPos, wallH, cellScale, color, scene, THREE) {
    var geo = new THREE.BoxGeometry(cellScale, wallH, cellScale);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var im  = new THREE.InstancedMesh(geo, mat, wallPos.length);
    var mtx = new THREE.Matrix4();
    wallPos.forEach(function (p, i) {
      mtx.makeTranslation(p[0] * cellScale + cellScale / 2, wallH / 2, p[1] * cellScale + cellScale / 2);
      im.setMatrixAt(i, mtx);
    });
    im.instanceMatrix.needsUpdate = true;
    scene.object3D.add(im);
  }

  function addFloor(worldW, worldH, mat, scene, THREE) {
    var geo = new THREE.PlaneGeometry(worldW, worldH);
    geo.rotateX(-Math.PI / 2);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(worldW / 2, -0.01, worldH / 2);
    scene.object3D.add(mesh);
  }

  function addCeiling(worldW, worldH, wallH, scene, THREE) {
    var geo  = new THREE.PlaneGeometry(worldW, worldH);
    geo.rotateX(Math.PI / 2);
    var mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x090c0f }));
    mesh.position.set(worldW / 2, wallH, worldH / 2);
    scene.object3D.add(mesh);
  }

  // Displacement terrain: worldW/H are final world units, tileW/H are sample counts
  function buildTerrainMesh(data, worldW, worldH, tileW, tileH, maxH, scene, THREE) {
    // DataTexture with LinearFilter = GPU bilinear smoothing between sample points
    var tex = new THREE.DataTexture(data, tileW, tileH, THREE.RedFormat, THREE.FloatType);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    // One vertex per data sample; GPU displaces each along +Y
    var geo = new THREE.PlaneGeometry(worldW, worldH, tileW - 1, tileH - 1);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x7cad62,
      displacementMap: tex,
      displacementScale: maxH,
      roughness: 0.85
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(worldW / 2, 0, worldH / 2);
    scene.object3D.add(mesh);
  }

  // ── Player ───────────────────────────────────────────────────────────────────

  function placePlayer(scene, spawn, mode) {
    var CS  = CELL_SCALE;
    // spawn.x/z are in tile units (e.g. 12.5); convert to world units
    var wx  = spawn.x * CS;
    var wz  = spawn.z * CS;

    var rig = document.createElement('a-entity');
    rig.id  = 'wr-player';

    if (mode === 'indoor') {
      rig.setAttribute('movement-controls', 'constrainToNavMesh: true; speed: 0.6');
      rig.setAttribute('position', wx + ' 0 ' + wz);
    } else {
      // Outdoor: walk on the flat navmesh at y=0; no falling
      rig.setAttribute('movement-controls', 'constrainToNavMesh: true; speed: 1.1');
      rig.setAttribute('position', wx + ' 0 ' + wz);
    }

    var cam = document.createElement('a-entity');
    cam.setAttribute('camera', 'fov: 80');
    cam.setAttribute('look-controls', 'pointerLockEnabled: true');
    cam.setAttribute('position', '0 1.6 0');

    if (mode === 'indoor') {
      // Player-mounted torch: warm point light that travels with the camera
      var torch = document.createElement('a-entity');
      torch.setAttribute('light',
        'type: point; color: #d4c090; intensity: 2.0; distance: ' + (CS * 10) + '; decay: 2');
      cam.appendChild(torch);
    }

    rig.appendChild(cam);
    scene.appendChild(rig);
  }

  // ── Spawn detection ──────────────────────────────────────────────────────────

  // Returns tile-centre coordinates in tile space (multiply by CELL_SCALE for world units)
  function findSpawnFromEnv(env) {
    if (env.markers) {
      for (var i = 0; i < env.markers.length; i++) {
        if (env.markers[i].kind === 'start') {
          return { x: env.markers[i].x + 0.5, z: env.markers[i].y + 0.5 };
        }
      }
    }
    if (env.tiles) {
      for (var z = 0; z < env.tiles.length; z++) {
        for (var x = 0; x < (env.tiles[z] || []).length; x++) {
          if (isWalkable(env.tiles[z][x])) return { x: x + 0.5, z: z + 0.5 };
        }
      }
    }
    if (env.regions && env.regions.length > 0) {
      var r = env.regions[0];
      return { x: r.x + r.width / 2, z: r.y + r.height / 2 };
    }
    var W = (env.space && env.space.width)  || 40;
    var H = (env.space && env.space.height) || 30;
    return { x: W / 2, z: H / 2 };
  }

  function findSpawnFromField(fieldFn, W, H, threshold) {
    var cx = Math.floor(W / 2), cz = Math.floor(H / 2);
    if (fieldFn(cx, cz) > threshold) return { x: cx + 0.5, z: cz + 0.5 };
    var maxR = Math.max(W, H);
    for (var r = 1; r <= maxR; r++) {
      for (var dz = -r; dz <= r; dz++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          var nx = cx + dx, nz = cz + dz;
          if (nx >= 0 && nx < W && nz >= 0 && nz < H && fieldFn(nx, nz) > threshold) {
            return { x: nx + 0.5, z: nz + 0.5 };
          }
        }
      }
    }
    return { x: W / 2, z: H / 2 };
  }

  // ── Tile walkability ─────────────────────────────────────────────────────────

  var WALKABLE = {
    floor: true, grass: true, sand: true, road: true,
    marsh: true, forest: true, desert: true, snow: true,
    hill: true, rock: true
  };
  function isWalkable(tile) { return !!WALKABLE[tile]; }

}());
