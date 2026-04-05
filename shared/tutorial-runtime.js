import { downloadJson, buildGridFromField, countFloorTiles } from './utils.js';

export function initTutorial(opts) {
  const {
    name,
    canvas,
    controls,
    aframeEl,
    btn3d,
    selMode,
    output,
    stats,
    message,
    exportButton,
    buildEnvironment,
    draw,
    getFieldFn
  } = opts;

  let currentEnvironment = null;
  let is3d = false;

  function doBuildEnvironment() {
    if (typeof buildEnvironment === 'function') {
      try { return buildEnvironment(); } catch (e) { if (message) message.textContent = e.message; return currentEnvironment; }
    }
    if (typeof getFieldFn === 'function') {
      const W = Math.max(4, +document.getElementById('width').value | 0);
      const H = Math.max(4, +document.getElementById('height').value | 0);
      const thresh = +document.getElementById('threshold').value / 100;
      const seed = +document.getElementById('seed')?.value;
      return buildGridFromField(getFieldFn(), W, H, thresh, { algorithm: name, seed });
    }
    return null;
  }

  function updateUI(env) {
    if (!env) return;
    if (stats) {
      const floors = countFloorTiles(env);
      stats.textContent = `Floor tiles: ${floors} of ${env.space.width * env.space.height}.`;
    }
    if (message) message.textContent = '';
    if (output) output.textContent = JSON.stringify(env, null, 2);
  }

  function update() {
    try {
      if (typeof draw === 'function') draw();
      currentEnvironment = doBuildEnvironment();
      if (currentEnvironment) updateUI(currentEnvironment);
      return currentEnvironment;
    } catch (e) {
      if (message) message.textContent = e.message;
      return currentEnvironment;
    }
  }

  function render3dNow() {
    if (!aframeEl) return;
    const W = Math.max(4, +document.getElementById('width').value | 0);
    const H = Math.max(4, +document.getElementById('height').value | 0);
    const thresh = +document.getElementById('threshold').value / 100;
    if (currentEnvironment && currentEnvironment.tiles) {
      AFrameRenderer.renderGridEnv(currentEnvironment, aframeEl, { mode: selMode?.value || 'indoor' });
    } else if (typeof getFieldFn === 'function') {
      AFrameRenderer.renderContinuousField(getFieldFn(), W, H, thresh, aframeEl, { mode: selMode?.value || 'indoor' });
    }
  }

  if (controls) controls.addEventListener('submit', e => {
    e.preventDefault();
    update();
    if (is3d) render3dNow();
  });

  if (btn3d) btn3d.addEventListener('click', () => {
    is3d = !is3d;
    btn3d.textContent = is3d ? 'View in 2D' : 'View in 3D';
    btn3d.classList.toggle('active', is3d);
    if (aframeEl) aframeEl.style.display = is3d ? 'block' : 'none';
    if (selMode) selMode.style.display = is3d ? 'inline-block' : 'none';
    if (is3d) render3dNow(); else if (aframeEl) AFrameRenderer.destroyScene(aframeEl);
  });

  if (selMode) selMode.addEventListener('change', () => { if (is3d) render3dNow(); });

  if (exportButton) exportButton.addEventListener('click', () => {
    const env = currentEnvironment || doBuildEnvironment();
    if (env) downloadJson(env, `${name}-sample-output.json`);
  });

  // initial run
  update();

  return {
    getCurrentEnvironment: () => currentEnvironment,
    update,
    render3d: render3dNow
  };
}
