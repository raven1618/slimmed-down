/* The interface: labels, the panel, camera flights, and the hill tools (coordinates, hints, corner handles).
   One of the page's scripts in js/site/: they run in order and share one scope (see index.html). */
'use strict';

/* ================================================================ */
/*                               UI                                 */
/* ================================================================ */
const labelsEl = $('labels'), bar = $('bar'), drawer = $('drawer'), hint = $('hint');
const planEl = $('plan'), compass = $('compass'), needle = $('needle');
let mode = 'cerro', active = null, tween = null, limitLabels = [];

hill.controls = new OrbitControls(hill.camera, renderer.domElement);
const mc = hill.controls;
mc.enableDamping = true; mc.dampingFactor = 0.07;
mc.minDistance = 25; mc.maxDistance = 7500;
mc.maxPolarAngle = 1.45; mc.minPolarAngle = 0.02;
mc.screenSpacePanning = false;
mc.zoomToCursor = true;
mc.enabled = false;

function fitCamera(cam) {
  const aspect = innerWidth / innerHeight;
  cam.aspect = aspect;
  cam.fov = cam === hill.camera ? (aspect < 1 ? 55 : 38) : (aspect < 1 ? 60 : 42);
  cam.updateProjectionMatrix();
}

function makeChip(item, cls, onClick) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip ' + cls; b.dataset.hidden = 'true';
  if (item.c) b.style.setProperty('--c', item.c);
  const dot = document.createElement('span'); dot.className = 'dot';
  const txt = document.createElement('span'); txt.textContent = item.name;
  if (item.sub) { const sm = document.createElement('small'); sm.textContent = item.sub; txt.appendChild(sm); }
  b.append(dot, txt);
  b.addEventListener('click', onClick);
  labelsEl.appendChild(b);
  return b;
}

function openDrawer(kick, title, body, facts, actions, color, note = '', extra = null) {
  drawer.dataset.panel = '';
  $('d-compact').innerHTML = '';
  drawer.style.setProperty('--c', color || 'var(--gold)');
  $('d-kick').textContent = kick;
  $('d-title').textContent = title;
  $('d-body').textContent = body || '';
  $('d-body').hidden = !body;
  $('d-facts').innerHTML = (facts || []).map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('');
  $('d-facts').hidden = !(facts && facts.length);
  const box = $('d-actions'); box.innerHTML = '';
  (actions || []).forEach(([label, go], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (i ? ' ghost' : ''); b.textContent = label;
    b.addEventListener('click', (e) => {
      if (typeof go === 'function') go(e.currentTarget);
      else if (go.startsWith('plan:')) openPlan(go.slice(5)); else setMode(go);
    });
    box.appendChild(b);
  });
  box.hidden = !(actions && actions.length);
  $('d-note').textContent = note;
  $('d-note').hidden = !note;
  const ex = $('d-extra'); ex.innerHTML = '';
  if (extra) ex.appendChild(extra);
  ex.hidden = !extra;
  drawer.hidden = false;
  setCollapsed(drawerCollapsed);
}
let drawerCollapsed = false;
function setCollapsed(on) {
  drawerCollapsed = on;
  drawer.classList.toggle('is-collapsed', on);
  const f = $('drawer-fold');
  f.setAttribute('aria-expanded', String(!on));
  f.setAttribute('aria-label', on ? 'Expand panel' : 'Collapse panel');
  $('d-compact').hidden = !on || !$('d-compact').childElementCount;
}
$('drawer-fold').addEventListener('click', () => setCollapsed(!drawerCollapsed));
$('d-title').addEventListener('click', () => { if (drawerCollapsed) setCollapsed(false); });
/* The slim bar shown when the panel is folded: a live summary and the buttons that matter. */
function fillCompact(summary, buttons) {
  const row = $('d-compact');
  row.innerHTML = '';
  const sp = document.createElement('span'); sp.className = 'sum'; sp.textContent = summary; row.appendChild(sp);
  buttons.filter(Boolean).forEach(([label, fn, disabled], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (i ? ' ghost' : ''); b.textContent = label; b.disabled = !!disabled;
    b.addEventListener('click', fn);
    row.appendChild(b);
  });
  setCollapsed(drawerCollapsed);
}
function closeDrawer() {
  drawer.hidden = true;
  setCollapsed(false);
  drawer.dataset.panel = '';
  if (limits.drawing || limits.editing || limits.textDraft.length) {
    limits.drawing = null; limits.editing = null; limits.selected = -1; limits.textDraft = [];
    if (hill.terrain) limitsChanged();
  }
  if (notes.placing || notes.moving || notes.open) {
    notes.placing = notes.moving = notes.open = null;
    if (hill.terrain) rebuildNoteMeshes();
  }
  setHint();
  if (hill.pin) hill.pin.visible = false;
  document.querySelectorAll('.chip.is-on').forEach((el) => el.classList.remove('is-on'));
}
$('drawer-close').addEventListener('click', closeDrawer);

function flyTo(pos, tgt, ms = 1700, lift = 0) {
  const ctl = active.controls;
  if (reduced) { active.camera.position.copy(pos); ctl.target.copy(tgt); ctl.update(); return; }
  tween = { t0: performance.now(), ms, p0: active.camera.position.clone(), q0: ctl.target.clone(), p1: pos.clone(), q1: tgt.clone(), lift };
  ctl.enabled = false;
}
function flyAround(x, z, radius) {
  const tgt = new THREE.Vector3(x, yAt(x, z), z);
  const az = mc.getAzimuthalAngle();
  const pos = tgt.clone().add(new THREE.Vector3().setFromSphericalCoords(radius, 0.95, az));
  flyTo(pos, tgt, 1600, radius * 0.1);
}

/* ------------------------------------------------------- hill tools -- */
const fmt = (n, d) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
function copyText(text, btn) {
  const done = () => { const t = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = t), 1500); };
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.className = 'copybox'; ta.value = text; ta.readOnly = true; ta.id = 'copy-fallback';
    const ex = $('d-extra'); ex.hidden = false; ex.prepend(ta); ta.focus(); ta.select();
    btn.textContent = 'Selected: press Ctrl+C or ⌘C';
  };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}
function showPoint(x, z, title) {
  const [E, N] = toUTM(x, z), [lat, lon] = UTM.inv(E, N), g = groundAt(x, z);
  hill.pin.position.set(x, yAt(x, z), z); hill.pin.visible = true;
  const s = META.summit, dist = Math.hypot(x - s.x, z - s.z);
  const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}\nUTM 21S: ${E.toFixed(1)} E, ${N.toFixed(1)} N\nGround ≈ ${g.toFixed(0)} m`;
  const lc = landcoverAt(x, z);
  openDrawer('Point', title || `${lat.toFixed(5)}, ${lon.toFixed(5)}`, null, [
    ['Latitude', lat.toFixed(6)], ['Longitude', lon.toFixed(6)],
    ['UTM 21S easting', fmt(E, 1) + ' m'], ['UTM 21S northing', fmt(N, 1) + ' m'],
    ['Ground elevation', `≈ ${g.toFixed(0)} m`], ['Slope', `≈ ${slopeAt(x, z).toFixed(0)}°`],
    ...(lc ? [['Land cover', lc.name]] : []), ['To the summit', `${fmt(dist, 0)} m`],
  ], [['Copy coordinates', (b) => copyText(text, b)]], 'var(--gold)', 'Ground elevation under forest is estimated from radar data minus canopy height; expect a few metres of error. Slope is averaged over about 30 m.');
}

function bounds(utm) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [E, N] of utm) { const [x, z] = fromUTM(E, N); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, r: Math.max(x1 - x0, z1 - z0) };
}
const DEFAULT_HINT = () => (small ? 'Drag to orbit · Tap for coordinates' : 'Drag to orbit · Right-drag to pan · Tap the ground for coordinates');
function setHint() {
  hint.textContent = notes.placing ? 'Tap the map where it goes · Zoom in close for accuracy'
    : notes.moving ? 'Tap the new spot'
    : limits.drawing ? 'Tap each corner in order · Tap the first corner to close'
    : limits.editing ? 'Drag a corner to move it · Tap a small dot to add a corner'
    : DEFAULT_HINT();
}

/* Corner handles: drawn in 3D, picked in screen space so they are easy to grab on a phone. */
const handleGroup = new THREE.Group();
const handleMat = { corner: new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }), mid: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthTest: false }), sel: new THREE.MeshBasicMaterial({ color: 0xdd7a4b, depthTest: false }) };
const handleGeo = new THREE.SphereGeometry(1, 14, 10);
function rebuildHandles() {
  if (!handleGroup.parent) hill.scene.add(handleGroup);
  handleGroup.clear();
  const b = limitById(limits.editing);
  if (!b) return;
  const n = b.utm.length;
  b.utm.forEach(([E, N], i) => {
    const [x, z] = fromUTM(E, N);
    const m = new THREE.Mesh(handleGeo, i === limits.selected ? handleMat.sel : handleMat.corner);
    m.position.set(x, yAt(x, z) + 1.5, z); m.renderOrder = 10; m.userData = { type: 'corner', i, s: 1 };
    handleGroup.add(m);
    const [E2, N2] = b.utm[(i + 1) % n], [x2, z2] = fromUTM(E2, N2);
    const mx = (x + x2) / 2, mz = (z + z2) / 2;
    const h = new THREE.Mesh(handleGeo, handleMat.mid);
    h.position.set(mx, yAt(mx, mz) + 1.5, mz); h.renderOrder = 10; h.userData = { type: 'mid', i, s: 0.6 };
    handleGroup.add(h);
  });
}
function pickHandle(cx, cy) {
  hill.camera.updateMatrixWorld();
  let best = null, bestD = 26;
  for (const m of handleGroup.children) {
    v3.copy(m.position).project(hill.camera);
    if (v3.z > 1) continue;
    const d = Math.hypot(((v3.x + 1) / 2) * innerWidth - cx, ((1 - v3.y) / 2) * innerHeight - cy) - (m.userData.type === 'corner' ? 6 : 0);
    if (d < bestD) { bestD = d; best = m.userData; }
  }
  return best;
}
function groundPoint(cx, cy) {
  hill.camera.updateMatrixWorld();
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, hill.camera);
  return rayGround(ray.ray.origin, ray.ray.direction);
}
/* First point where a ray meets the ground: clip it to the terrain's box, step 2.5 m at a time, then bisect. */
function rayGround(o, d) {
  let t0 = 0, t1 = 1e5;
  for (const [oc, dc, lo, hi] of [[o.x, d.x, -HHALF, HHALF], [o.z, d.z, -HHALF, HHALF], [o.y, d.y, (HLO - HBASE) * hill.vs - 1, (HHI - HBASE) * hill.vs + 1]]) {
    if (Math.abs(dc) < 1e-9) { if (oc < lo || oc > hi) return null; continue; }
    const a = (lo - oc) / dc, b = (hi - oc) / dc;
    t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
  }
  if (t0 > t1) return null;
  const above = (t) => o.y + d.y * t - yAt(o.x + d.x * t, o.z + d.z * t);
  let a = t0;
  if (above(a) <= 0) return null;
  for (let t = t0 + HFRES / 2; a < t1; t += HFRES / 2) {
    const b = Math.min(t, t1);
    if (above(b) <= 0) {
      let lo = a, hi = b;
      for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (above(m) > 0) lo = m; else hi = m; }
      return new THREE.Vector3(o.x + d.x * hi, o.y + d.y * hi, o.z + d.z * hi);
    }
    a = b;
  }
  return null;
}
function pushUndo(b) { limits.undo.push({ id: b.id, utm: b.utm.map((p) => p.slice()) }); if (limits.undo.length > 60) limits.undo.shift(); }
let redrawQueued = false;
function queueRedraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => { redrawQueued = false; drawOverlay(); rebuildHandles(); });
}
function limitsChanged() {
  if (!hill.terrain) return;
  drawOverlay(); refreshCurtains(); rebuildHandles();
  if (mode === 'cerro') buildChips();
  const typing = document.activeElement && drawer.contains(document.activeElement) && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if (!drawer.hidden && drawer.dataset.panel === 'limits' && !typing) renderLimits();
}
limits.onChange = limitsChanged;
