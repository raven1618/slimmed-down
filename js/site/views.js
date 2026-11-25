/* The trail route on the hill, the bar and its pills, the Display settings, picking, the views over the hill
   (the photoreal tour, free roam, the trail), the render loop and boot. Runs last.
   One of the page's scripts in js/site/: they run in order and share one scope (see index.html). */
'use strict';

/* -------------------------------------------------------------- the trail -- */
/* The public trail runs through the notes named "Start of the trail", "Checkpoint 1", "Checkpoint 2"… and
   "End of the trail", in that order. Between each pair it takes the easiest way over the ground: a
   least-cost route on the terrain grid that prices steepness, so it winds where a straight line would be steep. */
const trail = { path: [], legs: [], key: '', cache: new Map() };
const isTrailNote = (n) => /^(start of the trail|end of the trail|checkpoint\s*\d+)/i.test(n.name.trim());
function trailStops() {
  const by = (re) => notes.list.find((n) => re.test(n.name.trim()));
  const cps = notes.list.map((n) => ({ n, m: /^checkpoint\s*(\d+)/i.exec(n.name.trim()) })).filter((x) => x.m).sort((a, b) => +a.m[1] - +b.m[1]).map((x) => x.n);
  return [by(/^start of the trail/i), ...cps, by(/^end of the trail/i)].filter(Boolean);
}
function routeLeg(ax, az, bx, bz) {
  const key = [ax, az, bx, bz].map((v) => v.toFixed(1)).join();
  if (trail.cache.has(key)) return trail.cache.get(key);
  const res = HFRES, n = HFN, m = 120;
  const c0 = clamp(Math.floor((Math.min(ax, bx) - m + HHALF) / res), 0, n - 1), c1 = clamp(Math.ceil((Math.max(ax, bx) + m + HHALF) / res), 0, n - 1);
  const r0 = clamp(Math.floor((Math.min(az, bz) - m + HHALF) / res), 0, n - 1), r1 = clamp(Math.ceil((Math.max(az, bz) + m + HHALF) / res), 0, n - 1);
  const W = c1 - c0 + 1, H = r1 - r0 + 1, N = W * H;
  const hAt = (i) => groundAt(-HHALF + (c0 + (i % W)) * res, -HHALF + (r0 + Math.floor(i / W)) * res);
  const h = new Float32Array(N); for (let i = 0; i < N; i++) h[i] = hAt(i);
  const cell = (x, z) => clamp(Math.round((z + HHALF) / res) - r0, 0, H - 1) * W + clamp(Math.round((x + HHALF) / res) - c0, 0, W - 1);
  const s = cell(ax, az), t = cell(bx, bz), tx = t % W, tz = Math.floor(t / W);
  const g = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const heap = [];   // binary heap of [f, i]
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let mi = k; if (l < heap.length && heap[l][0] < heap[mi][0]) mi = l; if (r < heap.length && heap[r][0] < heap[mi][0]) mi = r; if (mi === k) break; [heap[mi], heap[k]] = [heap[k], heap[mi]]; k = mi; } } return top; };
  const hgt = (i) => Math.hypot((i % W) - tx, Math.floor(i / W) - tz) * res;
  g[s] = 0; push(hgt(s), s);
  const steps = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1], [2, 1], [1, 2], [-2, 1], [-1, 2], [2, -1], [1, -2], [-2, -1], [-1, -2]];
  while (heap.length) {
    const [, i] = pop();
    if (done[i]) continue;
    done[i] = 1;
    if (i === t) break;
    const x = i % W, z = Math.floor(i / W);
    for (const [dx, dz] of steps) {
      const X = x + dx, Z = z + dz;
      if (X < 0 || Z < 0 || X >= W || Z >= H) continue;
      const j = Z * W + X, L = Math.hypot(dx, dz) * res, grade = Math.abs(h[j] - h[i]) / L;
      const cost = L * (1 + (grade / 0.12) ** 2) + (grade > 0.4 ? L * 30 : 0);      // a 12% grade costs double; past 40% it is a wall
      if (g[i] + cost < g[j]) { g[j] = g[i] + cost; from[j] = i; push(g[j] + hgt(j), j); }
    }
  }
  const pts = [];
  for (let i = t; i >= 0; i = from[i]) { pts.push([-HHALF + (c0 + (i % W)) * res, -HHALF + (r0 + Math.floor(i / W)) * res]); if (i === s) break; }
  pts.reverse(); pts[0] = [ax, az]; pts[pts.length - 1] = [bx, bz];
  let p = pts;
  for (let k = 0; k < 2 && p.length > 2; k++) {                       // round the corners of the grid route
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) { const [x0, z0] = p[i], [x1, z1] = p[i + 1]; q.push([0.75 * x0 + 0.25 * x1, 0.75 * z0 + 0.25 * z1], [0.25 * x0 + 0.75 * x1, 0.25 * z0 + 0.75 * z1]); }
    q.push(p[p.length - 1]); p = q;
  }
  trail.cache.set(key, p);
  return p;
}
function updateTrail() {
  const stops = trailStops();
  const key = stops.map((n) => `${n.id}:${n.E.toFixed(1)},${n.N.toFixed(1)}`).join('|');
  if (key === trail.key) return false;
  trail.key = key; trail.path = []; trail.legs = [];
  for (let i = 1; i < stops.length; i++) {
    const [ax, az] = fromUTM(stops[i - 1].E, stops[i - 1].N), [bx, bz] = fromUTM(stops[i].E, stops[i].N);
    if (!inSquare(ax, az) || !inSquare(bx, bz)) continue;
    const p = routeLeg(ax, az, bx, bz);
    trail.legs.push({ from: stops[i - 1].name, to: stops[i].name, ...legStats(p) });
    trail.path.push(p);
  }
  return true;
}
function trailSummary() {
  if (!trail.legs.length) return null;
  const t = trail.legs.reduce((a, l) => ({ len: a.len + l.len, up: a.up + l.up, down: a.down + l.down, steep: Math.max(a.steep, l.steep) }), { len: 0, up: 0, down: 0, steep: 0 });
  return t;
}

function openSources() {
  const el = document.createElement('div');
  const m = META.sources;
  el.innerHTML = `<ul class="plain">
    <li><b>Ground shape.</b> ${m.elevation}.</li>
    <li><b>Trees.</b> ${m.canopy}. ${fmt(treeData.count, 0)} tree tops taller than 4 m are drawn at their measured height.</li>
    <li><b>Ground colour.</b> ${m.imagery}. 10 m pixels, sharpened with the 1 m canopy model.</li>
    ${SITES.map((p) => `<li><b>Site photo, ${esc(p.name)}.</b> ${esc(p.source)}. ${esc(p.credit)}. Placed by matching it to the satellite imagery (about ±5 m). Where it shows cleared ground, ${p.trees_removed} model trees are left out; where it shows woods the canopy model missed, ${fmt(p.trees_added || 0, 0)} trees are added at the canopy model's local height.</li>`).join('')}
    ${OBJECTS.objects.length ? `<li><b>Homestead.</b> House, solar array, pond, quincho, cabin and the rest are modelled from the owner's drone photos. ${esc(OBJECTS.source)}</li>` : ''}
    ${CUTS.length ? `<li><b>Quarry wall and mango tree.</b> Placed from the owner's notes and photos. The wall is drawn about 3 m high, an estimate from the photos rather than a survey.</li>` : ''}
    <li><b>Other base maps.</b> Land cover from ${m.landcover}. Vegetation index and infrared from the same Sentinel-2 passes (near-infrared band). Tree height from the canopy model. Topographic, shaded relief and slope are drawn from the elevation model.</li>
    <li><b>Roads, buildings, names.</b> ${m.context}.</li>
    <li><b>Coordinates.</b> WGS84 / UTM zone 21S (EPSG:32721). Model origin ${fmt(META.origin.easting, 0)} E, ${fmt(META.origin.northing, 0)} N; the model covers 4 × 4 km.</li>
  </ul>`;
  openDrawer('About the data', 'What this model is made of', 'Every layer is open satellite or map data. The property boundary will come from the title plans.', null, null, 'var(--gold)', '', el);
}

/* ---------------------------------------------------- bars and chips -- */
function pill(label, pressed, onClick, cls = '') {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'pill ' + cls; b.textContent = label;
  if (pressed !== null) b.setAttribute('aria-pressed', String(pressed));
  b.addEventListener('click', () => onClick(b));
  bar.appendChild(b);
  return b;
}
/* ------------------------------------------------- what the map shows -- */
const DISPLAY_DEFAULT = {
  base: 'satellite',
  propLabels: true, propArea: true, site: true, notes: true, panos: true, summit: false, lodging: false, places: false,
  trees: true, buildings: true, roads: true, contours: false, grid: false, relief: false, sitePhoto: true, trail: true,
  title: true, compass: true, hint: true, legend: true, effects: true,
};
const display = { ...DISPLAY_DEFAULT };
/* Two audiences. The pitch is the default; the owners' planning tools (notes, property limits, base maps,
   data sources) appear when Owner tools is switched on at the foot of Display, or with #tools in the link.
   The choice is remembered on this device. */
let TOOLS = false;
try { TOOLS = localStorage.getItem('oh-tools') === '1' || location.hash === '#tools'; } catch (e) { TOOLS = location.hash === '#tools'; }
// Closer than 60 m the 1 m satellite ground turns soft (CLAUDE.md, Open): the pitch stops there; the owners' tools go to 25 m.
const nearLimit = () => { mc.minDistance = TOOLS ? 25 : 60; };
nearLimit();
function setTools(on) {
  TOOLS = on; nearLimit();
  try { localStorage.setItem('oh-tools', on ? '1' : '0'); } catch (e) {}
  if (!on) { if (limits.editing || limits.drawing) { limits.editing = limits.drawing = null; drawOverlay(); } notes.placing = notes.moving = null; closeDrawer(); }
  applyDisplay(); buildBar(); setHint();
  if (mode === 'cerro') $('lede').textContent = LEDES.cerro;
  if (!displayEl.hidden) renderDisplay();
}
try { Object.assign(display, JSON.parse(localStorage.getItem('oh-display-v1') || '{}')); } catch (e) {}
const DISPLAY_GROUPS = [
  ['Labels', [['propLabels', 'Property names', 'var(--gold)'], ['propArea', 'Areas on property names'], ['site', 'Homestead buildings', 'var(--sand)'], ['notes', 'Notes and planned cabins', '#7fb3e3'], ['panos', '360° photoreal views', 'var(--gold)'], ['summit', 'Summit', 'var(--gold)'], ['lodging', 'Lodging and glamping', 'var(--earth)'], ['places', 'Other places', 'var(--muted)']]],
  ['Map', [['trees', 'Trees'], ['buildings', 'Buildings'], ['roads', 'Roads'], ['contours', 'Contour lines (10 m)'], ['grid', 'UTM grid (500 m)'], ['relief', 'Relief ×2'], ['sitePhoto', 'Site photos (satellite map only)'], ['trail', 'Trail between checkpoints']]],
  ['Screen', [['title', 'Title and description'], ['compass', 'Compass'], ['hint', 'Hints'], ['legend', 'Map legend'], ['effects', 'Cinematic effects (shading, glow, film look)']]],
];
const displayEl = $('display'), legendEl = $('legend'), creditEl = $('credit');
function applyDisplay() {
  try { localStorage.setItem('oh-display-v1', JSON.stringify(display)); } catch (e) {}
  if (!TOOLS && display.base !== 'satellite') { display.base = 'satellite'; display.trees = true; display.contours = false; }   // the pitch shows the satellite map
  document.body.classList.toggle('hide-title', !display.title);
  document.body.classList.toggle('hide-hint', !display.hint);
  compass.hidden = mode !== 'cerro' || !display.compass;
  hill.on.trees = display.trees; hill.on.buildings = display.buildings; hill.on.roads = display.roads; hill.on.contours = display.contours;
  const gridChanged = hill.on.grid !== display.grid || hill.on.trail !== display.trail;
  hill.on.grid = display.grid; hill.on.trail = display.trail;
  if (!BASES[display.base]) display.base = 'satellite';
  if (hill.notes) hill.notes.visible = display.notes && TOOLS;
  renderLegend();
  if (!hill.terrain) { hill.vs = display.relief ? 2 : 1; return; }
  if (display.base !== baseWant) setBase(display.base);
  showSitePhotos();
  applyLayers();
  const vs = display.relief ? 2 : 1;
  if (vs !== hill.vs) { hill.vs = vs; relayout(); } else if (gridChanged) drawOverlay();
  if (mode === 'cerro') buildChips();
}
function chooseBase(id) {
  const b = BASES[id];
  display.base = id; display.trees = !!b.trees; display.contours = !!b.contours;   // each map comes with the layers that suit it
  applyDisplay(); renderDisplay();
  const tile = displayEl.querySelector(`[data-base="${id}"]`);
  if (tile) tile.focus({ preventScroll: true });
}
function renderDisplay() {
  displayEl.innerHTML = '';
  if (TOOLS) {
  const h = document.createElement('h3'); h.textContent = 'Base map'; displayEl.appendChild(h);
  const grid = document.createElement('div'); grid.className = 'bases'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Base map');
  for (const [id, b] of Object.entries(BASES)) {
    const t = document.createElement('button'); t.type = 'button'; t.className = 'base'; t.dataset.base = id;
    t.setAttribute('aria-pressed', String(display.base === id));
    const sw = document.createElement('i'); sw.style.background = b.swatch;
    t.append(sw, document.createTextNode(b.label));
    t.addEventListener('click', () => chooseBase(id));
    grid.appendChild(t);
  }
  displayEl.appendChild(grid);
  }
  for (const [group, items] of DISPLAY_GROUPS) {
    const h = document.createElement('h3'); h.textContent = group; displayEl.appendChild(h);
    for (const [key, label, color] of items) {
      if (key === 'notes' && !TOOLS) continue;
      const row = document.createElement('label'); row.className = 'toggle'; row.htmlFor = 'show-' + key;
      const t = document.createElement('span');
      if (color) { const sw = document.createElement('i'); sw.className = 'sw'; sw.style.background = color; t.appendChild(sw); }
      t.appendChild(document.createTextNode(label));
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'show-' + key; cb.checked = !!display[key];
      cb.addEventListener('change', () => { display[key] = cb.checked; applyDisplay(); });
      row.append(t, cb);
      displayEl.appendChild(row);
    }
  }
  const end = document.createElement('div'); end.className = 'row-end';
  const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'mini'; reset.textContent = 'Back to defaults';
  reset.addEventListener('click', () => { Object.assign(display, DISPLAY_DEFAULT); applyDisplay(); renderDisplay(); });
  const done = document.createElement('button'); done.type = 'button'; done.className = 'mini'; done.textContent = 'Close';
  done.addEventListener('click', () => toggleDisplay(false));
  const tools = document.createElement('button'); tools.type = 'button'; tools.className = 'mini'; tools.setAttribute('aria-pressed', String(TOOLS));
  tools.textContent = TOOLS ? 'Owner tools: on' : 'Owner tools: off';
  tools.title = 'Notes, property limits, base maps and data sources, for planning';
  tools.addEventListener('click', () => setTools(!TOOLS));
  end.append(tools, reset, done);
  displayEl.appendChild(end);
}
function toggleDisplay(on) {
  displayEl.hidden = !on;
  const pb = bar.querySelector('[data-display]');
  if (pb) pb.setAttribute('aria-expanded', String(on));
  if (on) { renderDisplay(); const first = displayEl.querySelector('[aria-pressed="true"]'); if (first) first.focus({ preventScroll: true }); }
}
document.addEventListener('pointerdown', (e) => {
  if (displayEl.hidden || displayEl.contains(e.target) || e.target.closest('[data-display]')) return;
  toggleDisplay(false);
}, true);

/* The key for whichever base map is showing. Satellite needs none. */
function renderLegend() {
  const id = display.base, L = LEGENDS || {};
  legendEl.hidden = mode !== 'cerro' || !display.legend || id === 'satellite';
  if (legendEl.hidden) return;
  legendEl.innerHTML = '';
  const add = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; legendEl.appendChild(e); return e; };
  const ramp = (stops, colors, ticks, unit, ends) => {
    add('div', 'ramp').style.background = gradientCSS(stops, colors);
    const a = stops[0], b = stops[stops.length - 1], tk = add('div', 'ticks');
    ticks.forEach((v, i) => {
      const sp = document.createElement('span'), f = (v - a) / (b - a);
      sp.style.left = (f * 100).toFixed(1) + '%'; sp.style.transform = `translateX(${f < 0.03 ? 0 : f > 0.97 ? -100 : -50}%)`;
      sp.textContent = v + (i === ticks.length - 1 ? unit : ''); tk.appendChild(sp);
    });
    if (ends) { const e = add('div', 'ends'); ends.forEach((t) => { const sp = document.createElement('span'); sp.textContent = t; e.appendChild(sp); }); }
  };
  const list = (rows) => {
    const ul = add('ul');
    for (const [color, name, sub, pct] of rows) {
      const li = document.createElement('li'), sw = document.createElement('i'); sw.className = 'sw'; sw.style.background = color;
      li.append(sw, document.createTextNode(name));
      if (sub) { const em = document.createElement('em'); em.textContent = sub; li.appendChild(em); }
      if (pct != null) { const p = document.createElement('span'); p.className = 'pct'; p.textContent = pct; li.appendChild(p); }
      ul.appendChild(li);
    }
  };
  add('p', 'lg-head', BASES[id].label);
  if (id === 'topo') {
    ramp(TOPO.map((t) => t[0]), TOPO.map((t) => t[1]), [110, 150, 200, 250, 290], ' m');
    add('p', 'lg-note', 'Height above sea level. Contours every 10 m, numbered every 50 m. From the Copernicus 30 m elevation model with the forest canopy taken off.');
  } else if (id === 'relief') {
    add('p', 'lg-note', 'The bare ground, lit from the north-west, without trees or imagery. Copernicus 30 m elevation model with the forest canopy taken off.');
  } else if (id === 'slope') {
    list(SLOPE.map((c) => [c[1], c[2], c[3]]));
    add('p', 'lg-note', 'Ground slope averaged over about 30 m. It shows the lie of the land, not small banks or terraces.');
  } else if (id === 'landcover' && L.landcover) {
    list(L.landcover.map((c) => [c.color, c.name, null, c.share >= 0.005 ? Math.round(c.share * 100) + '%' : '<1%']));
    add('p', 'lg-note', 'ESA WorldCover 2021, 10 m. Shares are of the whole 4 × 4 km model.');
  } else if (id === 'canopy' && L.canopy) {
    ramp(L.canopy.stops, L.canopy.colors, [0, 5, 10, 15, 20], '+ m');
    add('p', 'lg-note', `Tree height above the ground. ${Math.round(L.canopy.over5m * 100)}% of the model has trees taller than 5 m. Meta & WRI 1 m canopy height map (imagery 2009–2020).`);
  } else if (id === 'ndvi' && L.ndvi) {
    ramp(L.ndvi.stops, L.ndvi.colors, [0.2, 0.4, 0.6, 0.8], '', ['bare or dry', 'dense and green']);
    add('p', 'lg-note', `NDVI from Sentinel-2: how much living green there is. Median of the green-season passes, ${META ? META.imagery.dates[0].slice(0, 7) : ''} to ${META ? META.imagery.dates.at(-1).slice(0, 7) : ''}.`);
  } else if (id === 'infrared') {
    list([['#d0204f', 'Forest and healthy plants'], ['#9a5a86', 'Pasture and lawns'], ['#7fd0d4', 'Bare soil, roads, roofs'], ['#1b2a4a', 'Water and deep shade']]);
    add('p', 'lg-note', 'Sentinel-2 false colour: near-infrared shown as red. Plants reflect near-infrared strongly, so living vegetation glows red.');
  }
}

function buildBar() {
  bar.innerHTML = '';
  if (mode === 'cerro') {
    pill('Overview', null, () => { closeDrawer(); flyTo(HOME.pos, HOME.tgt, 1800); });
    if (OBJECTS.view) pill('Homestead', null, () => { closeDrawer(); homesteadView(); });
    if (TOUR.length) pill('Explore the site', null, () => openTour(), 'accent');
    if (TOOLS) {
      pill('Notes', null, () => { toggleDisplay(false); closeDrawer(); renderNotes(); }, 'accent');
      pill('Property limits', null, () => { toggleDisplay(false); openLimits(); }, 'accent');
      pill('Data sources', null, () => openSources());
    }
    const db = pill('Display', null, () => toggleDisplay(displayEl.hidden));
    db.dataset.display = '1'; db.setAttribute('aria-expanded', 'false'); db.setAttribute('aria-controls', 'display');
  }
}
function buildChips() {
  labelsEl.innerHTML = '';
  if (mode === 'cerro') {
    limitLabels = [...OFFICIAL.filter((o) => !o.dash).map((o) => ({ ...o, official: true })), ...limits.list].filter((b) => b.utm.length > 2).map((b) => {
      const bb = bounds(b.utm), a = ringArea(b.utm), k = kindOf(b);
      const l = { name: nameOf(b), sub: `${b.official ? b.measure : k.label}${display.propArea ? ` · ${fmt(a.ha, 2)} ha` : ''}`, c: b.official ? b.color : k.color, anchor: new THREE.Vector3(bb.x, yAt(bb.x, bb.z) + 30, bb.z) };
      l.chip = makeChip(l, '', () => {
        if (!b.official && limits.canEdit) startEditing(b.id);
        else { flyAround(bb.x, bb.z, bb.r * 1.4 + 160); if (b.official) showSurvey(b); }
      });
      return l;
    });
    noteChips();
    panoChips();
    for (const l of hill.labels) l.chip = makeChip(l, '', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.toggle('is-on', c === l.chip));
      if (l.site) { flyAround(l.x, l.z, 70); showStructure(l.site); return; }
      flyAround(l.x, l.z, l.far > 6000 ? 900 : 420);
      showPoint(l.x, l.z, l.name);
    });
  }
}

const tabs = document.querySelectorAll('.tab');
function markTab(id) { tabs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.go === id))); }
tabs.forEach((t) => t.addEventListener('click', () => (t.dataset.go === 'plan' ? openPlan() : t.dataset.go === 'trail' ? openTrailer() : t.dataset.go === 'explore' ? openTour() : setMode('cerro'))));

function openPlan(section) {
  if (!trailerEl.hidden) closeTrailer();
  if (!trailEl.hidden) closeTrail();
  if (!panoEl.hidden) closePano();
  if (!walkEl.hidden) closeWalk();
  planEl.hidden = false;
  markTab('plan');
  try { history.replaceState(null, '', '#plan'); } catch (e) {}
  if (section) { const el = $(section); if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' })); }
  else planEl.scrollTop = 0;
  $('plan-close').focus({ preventScroll: true });
}
function closePlan() {
  planEl.hidden = true;
  markTab(mode);
  try { history.replaceState(null, '', '#' + mode); } catch (e) {}
}
$('plan-close').addEventListener('click', closePlan);
planEl.querySelectorAll('.plan-nav a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const el = $(a.getAttribute('href').slice(1)); el && el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }));

const LEDES = {
  get cerro() {
    return TOOLS ? 'A 4 × 4 km model of the hill built from satellite elevation, imagery and tree-height data. Tap the ground for coordinates. Use Property limits to draw the real boundary.'
      : 'A 4 × 4 km model of Cerro Kavaju built from satellite elevation, imagery and tree-height data. Explore the site to stand where the cabins and homes will be.';
  },
};
const EYEBROWS = { cerro: small ? 'Cerro Kavaju · Cordillera, Paraguay' : 'Cerro Kavaju · Cordillera, Paraguay · UTM 21S' };

let HOME;
function setMode(m) {
  if (!planEl.hidden) closePlan();
  if (!trailEl.hidden) closeTrail();
  if (!panoEl.hidden) closePano();
  if (!walkEl.hidden) closeWalk();
  if (!trailerEl.hidden) closeTrailer();
  if (active) active.controls.enabled = false;
  tween = null;
  mode = m;
  active = hill;
  active.controls.enabled = true;
  renderer.toneMappingExposure = 1;
  closeDrawer();
  markTab(m);
  $('eyebrow').textContent = EYEBROWS[m];
  $('lede').textContent = LEDES[m];
  setHint();
  toggleDisplay(false);
  compass.hidden = m !== 'cerro' || !display.compass;
  renderLegend();
  showSitePhotos();
  // The hill keeps imagery colours true. Its shadows never move.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  buildChips();
  buildBar();
  try { history.replaceState(null, '', '#' + m); } catch (e) {}
}

/* ----------------------------------------------------------- picking -- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: e.timeStamp }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || mode !== 'cerro' || e.button > 0) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = e.timeStamp - down.t < 700;
  down = null;
  if (moved > 6 || !quick || gestureMax > 1) return;
  if (notes.placing || notes.moving) { const p = groundPoint(e.clientX, e.clientY); if (p) placeNoteAt(p.x, p.z); return; }
  if (hill.notes && hill.notes.visible && notes.list.length && !limits.drawing && !limits.editing) {
    hill.camera.updateMatrixWorld();
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, hill.camera);
    const h = ray.intersectObject(hill.notes, true).find((x) => x.object.isMesh);
    if (h && h.object.userData.note) { openNote(h.object.userData.note); return; }
  }
  if (hill.structures && hill.structures.visible && !limits.drawing && !limits.editing) {
    hill.camera.updateMatrixWorld();
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, hill.camera);
    const h = ray.intersectObject(hill.structures, true)[0], o = h && h.object.userData.site;
    if (o && o.name) { showStructure(o); return; }
  }
  const hit = groundPoint(e.clientX, e.clientY);
  if (!hit) return;
  const { x, z } = hit;
  if (limits.drawing) {
    const d = limits.drawing;
    if (d.utm.length >= 3) {
      const [fx, fz] = fromUTM(...d.utm[0]);
      v3.set(fx, yAt(fx, fz), fz).project(hill.camera);
      if (Math.hypot(((v3.x + 1) / 2) * innerWidth - e.clientX, ((1 - v3.y) / 2) * innerHeight - e.clientY) < 24) { finishDrawing(); return; }
    }
    if (!inSquare(x, z)) return;
    d.utm.push(toUTM(x, z)); drawOverlay(); renderLimits();
    return;
  }
  if (limits.editing) { if (limits.selected >= 0) { limits.selected = -1; limitsChanged(); } return; }
  showPoint(x, z);
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!trailerEl.hidden) closeTrailer();
  else if (!walkEl.hidden) backToTour();
  else if (!panoEl.hidden) closePano();
  else if (!trailEl.hidden) closeTrail();
  else if (!displayEl.hidden) toggleDisplay(false);
  else if (!planEl.hidden) closePlan();
  else if (notes.placing || notes.moving) { const back = notes.moving; notes.placing = notes.moving = null; notes.open = back; drawerCollapsed = false; renderNotes(); }
  else if (limits.drawing) { limits.drawing = null; drawerCollapsed = false; drawOverlay(); renderLimits(); }
  else if (limits.editing) { limits.editing = null; limits.selected = -1; drawerCollapsed = false; limitsChanged(); renderLimits(); }
  else if (!drawer.hidden) closeDrawer();
});
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  fitCamera(hill.camera);
});

/* ------------------------------------------------ views over the hill -- */
/* The tour, free roam and the trail draw with the page's one renderer, on the same canvas; their
   controls sit on top of it, so the hill never sees their input, and the hill pauses meanwhile. Each view
   sets the renderer up its own way and the page puts it back as it was when the view closes. One WebGL
   context for the whole site keeps phones within their graphics memory. */
let lent = null;
function lendRenderer(o) {
  if (!lent) lent = { pr: renderer.getPixelRatio(), tm: renderer.toneMapping, te: renderer.toneMappingExposure, se: renderer.shadowMap.enabled, sa: renderer.shadowMap.autoUpdate };
  if (postView) { dropComposer(postView); postView = null; }          // the hill's effects are rebuilt on return
  if (active) active.controls.enabled = false;
  document.body.classList.add('in-view');
  renderer.setPixelRatio(Math.min(devicePixelRatio, o.pixelRatio)); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = o.toneMapping; renderer.toneMappingExposure = o.exposure;
  renderer.shadowMap.enabled = o.shadows; renderer.shadowMap.autoUpdate = o.shadowAuto; renderer.shadowMap.needsUpdate = true;
}
function returnRenderer() {
  if (!lent) return;
  renderer.setPixelRatio(lent.pr); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = lent.tm; renderer.toneMappingExposure = lent.te;
  renderer.shadowMap.enabled = lent.se; renderer.shadowMap.autoUpdate = lent.sa; renderer.shadowMap.needsUpdate = true;
  lent = null;
  document.body.classList.remove('in-view');
  if (active) active.controls.enabled = !tween;
}
/* Free what a closed view put on the GPU: geometry, materials and their textures. */
function disposeScene(root) {
  const tex = new Set(), add = (v) => { if (v && v.isTexture) tex.add(v); else if (Array.isArray(v)) v.forEach(add); };
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    for (const m of [].concat(o.material || [])) {
      Object.values(m).forEach(add);
      if (m.uniforms) Object.values(m.uniforms).forEach((u) => add(u && u.value));
      m.dispose();
    }
  });
  add(root.environment); add(root.background);
  tex.forEach((t) => t.dispose());
}
/* A view whose code lives in js/: loaded on open, built fresh, disposed on close. */
function moduleView(el, src, settings, onFail) {
  const v = { api: null, gen: 0 };
  v.open = (extra = {}) => {                       // extra: what this opening needs (free roam: which site, where to start)
    lendRenderer(settings);
    const g = ++v.gen;
    import(new URL(src, document.baseURI).href)      // from the page's folder (a plain script would resolve it from js/site/)
      .then((m) => m.build({ renderer, $, clamp, ease, rng, small, reduced, windOf, GLSL_NOISE, GradeShader, disposeScene, trailEl, lookSpeed: LOOK_SPEED, ...extra }))
      .then((api) => { if (g !== v.gen || el.hidden) api.dispose(); else v.api = api; })
      .catch((err) => { console.error(err); if (g === v.gen) onFail(err); });
  };
  v.close = () => { v.gen++; if (v.api) { v.api.dispose(); v.api = null; } returnRenderer(); };
  return v;
}

/* ------------------------------------------------------ explore the site -- */
/* The photoreal tour of both parts of the site: 360° views rendered in Blender (render/build.py) from the same
   terrain, trees and buildings as free roam (data/walk/, js/cabin.js), listed in data/tour.json. Each view is one
   finished image on the inside of a sphere. "Free roam from here" opens the walk where you stand. */
let TOUR = [], panoLabels = [];
const tourLast = {};                          // the last view seen on each part of the site
const WALK_SITES = ['quarry', 'private'];       // the parts that free roam covers
const SITE_NAMES = { quarry: 'The quarry cabins', private: 'The private side · Finca 2663', homestead: 'The homestead · already built' };
const SITE_SPECS = {
  quarry: '<b>Cabin</b><span>9 × 6.5 m · 58 m²</span><span>27 m² deck</span><span>1 bedroom</span><span>build budget $60–70k</span>',
  private: '<b>Residence</b><span>≈180 m²</span><span>3 bedrooms</span><span>on ≈1 ha</span><span>homesite from $150k</span><span>build ≈$900–1,100/m²</span>',
  homestead: '<b>On site today</b><span>brick house</span><span>solar array</span><span>pond</span><span>wooden cabin</span><span>quincho</span>',
};
const panoEl = $('pano');
const pano = { built: false, p: null, yaw: 0, pitch: 0, fov: 70, tex: {} };
function panoChips() {                        // on the hill: one marker per part of the site
  panoLabels = Object.keys(SITE_NAMES).map((site) => TOUR.find((p) => p.site === site)).filter(Boolean).map((p) => {
    const l = { name: '360° · ' + SITE_NAMES[p.site].split(' · ')[0], sub: 'Photoreal tour', c: 'var(--gold)', anchor: new THREE.Vector3(p.x, yAt(p.x, p.z) + 8, p.z) };
    l.chip = makeChip(l, '', () => openTour(p.site));
    return l;
  });
}
/* key: 'quarry', 'private' or 'quarry-deck'; nothing for where you were last. */
function openTour(key) {
  const p = TOUR.find((q) => q.site + '-' + q.id === key) || tourLast[key] || TOUR.find((q) => q.site === key) || pano.p || TOUR[0];
  if (!p) return;
  if (!panoEl.hidden) { showPano(p); return; }
  if (!planEl.hidden) closePlan();
  if (!trailEl.hidden) closeTrail();
  if (!walkEl.hidden) closeWalk();
  if (!trailerEl.hidden) closeTrailer();
  closeDrawer();
  panoEl.hidden = false;
  lendRenderer({ pixelRatio: 2, toneMapping: THREE.NoToneMapping, exposure: 1, shadows: false, shadowAuto: false });   // the images are finished pictures
  markTab('explore');
  if (!pano.built) buildPano();
  pano.size();
  showPano(p);
  $('pano-close').focus({ preventScroll: true });
}
function closePano() {
  if (panoEl.hidden) return;
  panoEl.hidden = true;
  Object.values(pano.tex).forEach((t) => t.dispose());     // off the GPU; the pictures stay loaded for next time
  returnRenderer();
  markTab(mode);
  try { history.replaceState(null, '', '#' + mode); } catch (e) {}
}
$('pano-close').addEventListener('click', closePano);
document.querySelectorAll('#pano-sites button').forEach((b) => b.addEventListener('click', () => openTour(b.dataset.site)));
$('pano-roam').addEventListener('click', () => {
  const p = pano.p;
  if (!p) return;
  const [x, z] = p.roam || [p.x, p.z];        // views inside a building start free roam just outside it
  walkStart = { x, z, bearing: p.bearing - (pano.yaw * 180) / Math.PI };
  closePano();
  openWalk(p.site);
});
function buildPano() {
  pano.built = true;
  const R = renderer, el = $('pano-stage');
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(70, 1, 0.1, 1100);
  scene.background = new THREE.Color(0x0d1310);
  cam.rotation.order = 'YXZ';
  const geo = new THREE.SphereGeometry(500, 96, 48); geo.scale(-1, 1, 1);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x0d1310 }));
  mesh.rotation.y = -Math.PI / 2;            // the centre of the panorama straight ahead
  scene.add(mesh);
  Object.assign(pano, { R, scene, cam, mesh });
  pano.draw = () => {
    if (panoEl.hidden) return;
    cam.fov = pano.fov; cam.updateProjectionMatrix();
    cam.rotation.set(pano.pitch, pano.yaw, 0);
    R.render(scene, cam);
    if (pano.p) $('pano-facing').textContent = 'Facing ' + windOf((((pano.p.bearing - (pano.yaw * 180) / Math.PI) % 360) + 360) % 360);
  };
  pano.size = () => { R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; pano.draw(); };
  addEventListener('resize', () => { if (!panoEl.hidden) pano.size(); });
  const zoom = (f) => { pano.fov = clamp(pano.fov * f, 30, 95); };
  const ptrs = new Map();
  let pinch = 0;
  // Drag right to look right, up to look up, as on the hill and in free roam (CLAUDE.md); a flick keeps turning.
  const vel = { x: 0, y: 0, t: 0 };
  let glide = 0;
  el.addEventListener('pointerdown', (e) => { cancelAnimationFrame(glide); Object.assign(vel, { x: 0, y: 0, t: performance.now() }); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { el.setPointerCapture(e.pointerId); } catch (err) {} });
  el.addEventListener('pointermove', (e) => {
    const p0 = ptrs.get(e.pointerId);
    if (!p0) return;
    if (ptrs.size === 1) {
      const k = (LOOK_SPEED * ((cam.fov * Math.PI) / 180)) / innerHeight, dy = -(e.clientX - p0.x) * k, dp = -(e.clientY - p0.y) * k, now = performance.now(), dt = Math.max(8, now - vel.t);
      pano.yaw += dy; pano.pitch = clamp(pano.pitch + dp, -1.45, 1.45);
      vel.x = vel.x * 0.3 + (dy / dt) * 0.7; vel.y = vel.y * 0.3 + (dp / dt) * 0.7; vel.t = now;
    }
    p0.x = e.clientX; p0.y = e.clientY;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoom(pinch / d);
      pinch = d;
    }
    pano.draw();
  });
  const up = (e) => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
    if (ptrs.size || performance.now() - vel.t > 60 || reduced) return;          // let go while moving: glide to a stop
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(50, now - last), f = Math.exp(-dt / 260); last = now;
      pano.yaw += vel.x * dt; pano.pitch = clamp(pano.pitch + vel.y * dt, -1.45, 1.45); vel.x *= f; vel.y *= f; pano.draw();
      if (!panoEl.hidden && Math.hypot(vel.x, vel.y) > 2e-5) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.001)); pano.draw(); }, { passive: false });
  addEventListener('keydown', (e) => {
    if (panoEl.hidden) return;
    const step = { ArrowLeft: [0.08, 0], ArrowRight: [-0.08, 0], ArrowUp: [0, 0.06], ArrowDown: [0, -0.06] }[e.key];
    if (step) { e.preventDefault(); pano.yaw += step[0]; pano.pitch = clamp(pano.pitch + step[1], -1.45, 1.45); pano.draw(); }
  });
}
function showPano(p) {
  pano.p = p; tourLast[p.site] = p; pano.yaw = 0; pano.pitch = 0; pano.fov = innerWidth < innerHeight ? 85 : 70;
  try { history.replaceState(null, '', '#explore-' + p.site + '-' + p.id); } catch (e) {}
  $('pano-eyebrow').textContent = 'Photoreal 360° · ' + SITE_NAMES[p.site];
  $('pano-title').textContent = p.name;
  $('pano-text').textContent = p.text || '';
  $('pano-specs').innerHTML = SITE_SPECS[p.site] || '';
  $('pano-roam').hidden = !WALK_SITES.includes(p.site);                // free roam covers the quarry and the private side
  $('pano-hint').textContent = 'Drag to look around · scroll or pinch to zoom' + (p.site === 'homestead' ? '' : ' · design not final');   // the homestead is built
  document.querySelectorAll('#pano-sites button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.site === p.site)));
  const tabsEl = $('pano-tabs');
  tabsEl.innerHTML = '';
  TOUR.filter((q) => q.site === p.site).forEach((q) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = q.name; b.setAttribute('aria-current', String(q === p));
    b.addEventListener('click', () => showPano(q));
    tabsEl.appendChild(b);
  });
  const key = p.site + '-' + p.id;
  const set = (t) => { pano.mesh.material.dispose(); pano.mesh.material = new THREE.MeshBasicMaterial({ map: t }); $('pano-loading').hidden = true; pano.draw(); };
  if (pano.tex[key]) { set(pano.tex[key]); return; }
  $('pano-loading').hidden = false; $('pano-loading').textContent = 'Loading the view';
  new THREE.TextureLoader().load('data/' + p.file, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    pano.tex[key] = t;
    if (pano.p === p) set(t);
  }, undefined, () => { $('pano-loading').textContent = 'This view did not load. Try again in a moment.'; });
  pano.draw();
}

/* ------------------------------------------------------------ free roam -- */
/* Free roam: the same site drawn live, to walk anywhere (js/walk.js, loaded when it opens). Opened from the tour. */
const walkEl = $('walk');
const walkView = moduleView(walkEl, './js/walk.js',
  { pixelRatio: small ? 1.5 : 2, toneMapping: THREE.AgXToneMapping, exposure: Math.SQRT2, shadows: true, shadowAuto: false },   // full sharpness; the walk steps down on slow devices   // as in Blender: AgX, +0.5
  () => { $('wk-loading').hidden = false; $('wk-msg').textContent = 'This browser could not open the walk. The rest of the site still works.'; });
/* Two walkable parts: the quarry cabins (#walk) and the private side, Finca 2663, with the residence (#walk-private). */
let walkSite = 'quarry', walkStart = null;           // walkStart: where free roam begins ({ x, z, bearing }), else the site's first spot
function openWalk(site) {
  if (site && site !== walkSite) { if (!walkEl.hidden) closeWalk(); walkSite = site; }
  if (!walkEl.hidden) return;
  if (!planEl.hidden) closePlan();
  if (!trailEl.hidden) closeTrail();
  if (!panoEl.hidden) closePano();
  if (!trailerEl.hidden) closeTrailer();
  closeDrawer();
  walkEl.hidden = false;
  $('wk-loading').hidden = false; $('wk-bar').style.width = '0'; $('wk-msg').textContent = 'Loading the site';
  markTab('explore');
  try { history.replaceState(null, '', walkSite === 'quarry' ? '#walk' : '#walk-' + walkSite); } catch (e) {}
  document.querySelectorAll('#wk-sites button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.site === walkSite)));
  walkView.open({ site: walkSite, start: walkStart, homestead: walkSite === 'quarry' ? homesteadModels() : null }); walkStart = null;   // the homestead stands at the quarry's west end
  $('wk-close').focus({ preventScroll: true });
}
function closeWalk() {
  if (walkEl.hidden) return;
  walkEl.hidden = true;
  walkView.close();
  markTab(mode);
  try { history.replaceState(null, '', '#' + mode); } catch (e) {}
}
function backToTour() { const p = tourLast[walkSite]; closeWalk(); openTour(p ? p.site + '-' + p.id : walkSite); }
$('wk-close').addEventListener('click', backToTour);
document.querySelectorAll('#wk-sites button').forEach((b) => b.addEventListener('click', () => openWalk(b.dataset.site)));

/* ------------------------------------------------------------ the trail -- */
/* Mala Visión, the fight at the trail's midpoint: js/trail.js, loaded when the tab opens.
   Each visit starts a fresh fight from the page's original markup. */
const trailEl = $('trail'), TRAIL_HTML = trailEl.innerHTML;
const trailView = moduleView(trailEl, './js/trail.js',
  { pixelRatio: small ? 1.25 : 1.75, toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.25, shadows: !small, shadowAuto: true },
  () => { $('tr-card').innerHTML = '<div class="in"><h3>Mala Visión</h3><p>This browser could not start the fight. The rest of the site still works.</p></div>'; });
const trailerEl = $('trailer');
function openTrailer() {
  if (!trailerEl.hidden) return;
  if (!planEl.hidden) closePlan();
  if (!panoEl.hidden) closePano();
  if (!walkEl.hidden) closeWalk();
  if (!trailEl.hidden) closeTrail();
  closeDrawer();
  trailerEl.hidden = false;
  markTab('trail');
  try { history.replaceState(null, '', '#trail'); } catch (e) {}
  $('tl-close').focus({ preventScroll: true });
}
function closeTrailer() {
  if (trailerEl.hidden) return;
  trailerEl.hidden = true; $('tl-video').pause();
  markTab(mode);
  try { history.replaceState(null, '', '#' + mode); } catch (e) {}
}
$('tl-close').addEventListener('click', closeTrailer);
$('tl-play').addEventListener('click', () => { closeTrailer(); openTrail(); });
function openTrail() {
  if (!trailEl.hidden) return;
  if (!trailerEl.hidden) closeTrailer();
  if (!planEl.hidden) closePlan();
  if (!panoEl.hidden) closePano();
  if (!walkEl.hidden) closeWalk();
  closeDrawer();
  trailEl.innerHTML = TRAIL_HTML;
  $('tr-close').addEventListener('click', closeTrail);
  trailEl.hidden = false;
  markTab('trail');
  try { history.replaceState(null, '', '#trail-play'); } catch (e) {}
  trailView.open();
}
function closeTrail() {
  if (trailEl.hidden) return;
  trailEl.hidden = true;
  trailView.close();
  markTab(mode);
  try { history.replaceState(null, '', '#' + mode); } catch (e) {}
}

/* Sun shadows: the whole model from far away, a tight box around the view up close, so roofs,
   cabins and trees cast crisp shadows. Redrawn only when the view has moved well away from the last fit. */
let shadowFit = null, shadowCheck = 0;
function fitHillShadow(force = false) {
  const sun = hill.sun;
  if (!sun || !mc) return;
  const t = mc.target, d = hill.camera.position.distanceTo(t);
  const ext = d > 1600 ? 2300 : clamp(d * 1.15, 70, 2300), c = ext >= 2300 ? new THREE.Vector3() : t.clone();
  if (!force && shadowFit && Math.abs(ext - shadowFit.ext) < shadowFit.ext * 0.3 && c.distanceTo(shadowFit.c) < shadowFit.ext * 0.25) return;
  shadowFit = { ext, c };
  sun.target.position.copy(c); sun.position.copy(c).addScaledVector(hill.sunDir, 5000);
  sun.target.updateMatrixWorld();
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -ext; sc.right = sc.top = ext; sc.updateProjectionMatrix();
  sun.shadow.normalBias = ((2 * ext) / sun.shadow.mapSize.x) * 0.55;
  renderer.shadowMap.needsUpdate = true;
}

/* The game look: ambient occlusion in creases, under eaves and between trees; a glow on the brightest
   light; then a film grade (warm highlights, cool shadows, contrast, vignette, a little grain).
   Each 3D view gets its own chain, built the first time it is drawn. Phones skip the occlusion. */
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uAmt: { value: 1 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    void main() {
      vec3 c0 = texture2D(tDiffuse, vUv).rgb, c = c0;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c += vec3(-0.03, 0.005, 0.04) * (1.0 - smoothstep(0.0, 0.45, l));    // cool shadows
      c += vec3(0.05, 0.022, -0.04) * smoothstep(0.45, 1.0, l);            // warm highlights
      c = (c - 0.5) * 1.12 + 0.5;
      c = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, 1.2);
      vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.7;
      c += (fract(sin(dot(floor(vUv * uRes) + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.006;
      gl_FragColor = vec4(mix(c0, clamp(c, 0.0, 1.0), uAmt), 1.0);
    }`,
};
const SanitizeShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      if (!(c.r == c.r && c.g == c.g && c.b == c.b)) c.rgb = vec3(0.0);      // NaN
      gl_FragColor = vec4(clamp(c.rgb, 0.0, 32.0), 1.0);                        // and no infinities
    }`,
};
const composers = new Set(), POST_PR = 2;   // the effects at 2× pixels, phones included (they are most of the audience); slow devices step down
let postView = null, postFailed = false;
renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); postFailed = true; });
function makeComposer(scene, camera) {
  const cap = POST_PR, pr = Math.min(renderer.getPixelRatio(), cap), w = innerWidth, h = innerHeight;
  const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: Math.min(4, renderer.capabilities.maxSamples || 0) });   // 4× antialiasing everywhere: without it edges stair-step
  // The GPU has to accept a half-float target, or the chain is skipped and the view draws plainly.
  const gl = renderer.getContext();
  renderer.setRenderTarget(rt);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  renderer.setRenderTarget(null);
  if (!ok) { rt.dispose(); throw new Error('this GPU cannot render to half-float targets'); }
  const c = new EffectComposer(renderer, rt);
  c.addPass(new RenderPass(scene, camera));
  c.addPass(new ShaderPass(SanitizeShader));
  c.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.2, 0.5, 0.95));       // a little glow on the sun's glints, never a wash
  c.addPass(new OutputPass());
  c.grade = new ShaderPass(GradeShader);
  c.addPass(c.grade);
  c.setPixelRatio(pr); c.setSize(w, h); c.prCap = cap;
  composers.add(c);
  return c;
}
function dropComposer(view) {
  const c = view.composer;
  if (!c) return;
  c.passes.forEach((p) => p.dispose && p.dispose()); c.dispose(); composers.delete(c); view.composer = null;
}
function syncComposers() { composers.forEach((c) => { c.setPixelRatio(Math.min(renderer.getPixelRatio(), c.prCap || POST_PR)); c.setSize(innerWidth, innerHeight); }); }
addEventListener('resize', syncComposers);
function renderFrame(view, cam) {
  const want = display.effects && !postFailed;
  if (postView && (postView !== view || !want)) { dropComposer(postView); postView = null; }   // one chain in memory at a time
  if (want && !view.composer) {
    try { view.composer = makeComposer(view.scene, cam); postView = view; }
    catch (err) { console.warn('Effects off:', err.message); postFailed = true; }
  }
  if (!want || !view.composer) { renderer.render(view.scene, cam); return; }
  const g = view.composer.grade.uniforms;
  g.uAmt.value = view === hill && hill.base !== 'satellite' ? 0 : 1;      // data maps stay true to their legends
  g.uTime.value = elapsed; g.uRes.value.set(innerWidth, innerHeight);
  view.composer.render();
}

/* -------------------------------------------------------------- loop -- */
const clock = new THREE.Clock();
const v3 = new THREE.Vector3();
let elapsed = 0, first = true;
function tick() {
  requestAnimationFrame(tick);
  if (!active || (!first && (!planEl.hidden || !trailEl.hidden || !panoEl.hidden || !walkEl.hidden || !trailerEl.hidden || document.hidden))) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  FOL.uTime.value = elapsed;
  const cam = active.camera, ctl = active.controls;
  if (tween) {
    const k = Math.min((performance.now() - tween.t0) / tween.ms, 1), e = ease(k);
    cam.position.lerpVectors(tween.p0, tween.p1, e);
    cam.position.y += Math.sin(Math.PI * e) * tween.lift;
    ctl.target.lerpVectors(tween.q0, tween.q1, e);
    cam.lookAt(ctl.target);
    if (k >= 1) { tween = null; ctl.enabled = true; ctl.update(); }
  } else {
    if (mode === 'cerro') {
      ctl.target.x = clamp(ctl.target.x, -HHALF, HHALF);
      ctl.target.z = clamp(ctl.target.z, -HHALF, HHALF);
    }
    ctl.update(dt);
  }
  if (mode === 'cerro') {
    if (!tween && ++shadowCheck % 20 === 0) fitHillShadow();
    hill.curtains.forEach((c) => (c.material.uniforms.uTime.value = elapsed));
    needle.setAttribute('transform', `rotate(${(ctl.getAzimuthalAngle() * 180) / Math.PI} 15 15)`);
    for (const l of hill.labels) place(l.chip, l.anchor, cam, !display[l.cat] || cam.position.distanceTo(l.anchor) > l.far || !!limits.drawing || !!limits.editing, true);
    for (const l of limitLabels) place(l.chip, l.anchor, cam, !display.propLabels || !!limits.editing || !!limits.drawing, true);
    for (const l of notes.chips) place(l.chip, l.anchor, cam, !TOOLS || !display.notes || !!limits.editing || !!limits.drawing || !!notes.placing || !!notes.moving, true);
    for (const l of panoLabels) place(l.chip, l.anchor, cam, !display.panos || !!limits.editing || !!limits.drawing, true);
    declutter();
    for (const h of handleGroup.children) h.scale.setScalar(Math.max(0.6, cam.position.distanceTo(h.position) * 0.011 * h.userData.s));
  }
  if (!lent) renderFrame(active, cam);
  adaptResolution();
  if (first) {
    first = false;
    window.__ohReady = true;
    $('loader').classList.remove('is-on');
  }
}
/* If frames stay slow for a couple of seconds, render fewer pixels. */
const perf = { last: 0, n: 0, sum: 0, start: performance.now() };
function adaptResolution() {
  const now = performance.now(), dt = now - perf.last;
  perf.last = now;
  if (now - perf.start < 4000 || dt > 250) return;
  perf.sum += dt; perf.n++;
  if (perf.n < 90) return;
  const avg = perf.sum / perf.n, pr = renderer.getPixelRatio();
  perf.sum = 0; perf.n = 0;
  if (avg <= 30) return;
  if (pr > 1) { renderer.setPixelRatio(Math.max(1, pr - 0.25)); syncComposers(); }
}
const crowd = [];
function place(chip, anchor, cam, hide, crowded = false) {
  if (!chip) return;
  v3.copy(anchor).project(cam);
  const off = hide || v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05;
  const was = chip.dataset.hidden === 'false';
  chip.dataset.hidden = off ? 'true' : 'false';
  if (!off) {
    const x = ((v3.x + 1) / 2) * innerWidth, y = ((1 - v3.y) / 2) * innerHeight;
    chip.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, calc(-100% - 18px))`;
    if (crowded) crowd.push({ chip, x, y, d: cam.position.distanceTo(anchor) * (was ? 0.85 : 1) });
  }
}
/* Where labels pile up on screen, the nearest (or the selected one) wins and the rest wait until there is room. */
function declutter() {
  crowd.sort((a, b) => (b.chip.classList.contains('is-on') - a.chip.classList.contains('is-on')) || a.d - b.d);
  const kept = [];
  for (const c of crowd) {
    const t = c.chip.textContent;
    if (c.chip._t !== t) { c.chip._t = t; c.chip._w = c.chip.offsetWidth; c.chip._h = c.chip.offsetHeight; }
    const r = [c.x - c.chip._w / 2 - 4, c.y - c.chip._h - 22, c.x + c.chip._w / 2 + 4, c.y - 14];
    if (kept.some((k) => r[0] < k[2] && r[2] > k[0] && r[1] < k[3] && r[3] > k[1])) c.chip.dataset.hidden = 'true';
    else kept.push(r);
  }
  crowd.length = 0;
}

/* ------------------------------------------------------------- boot -- */
async function boot() {
  loaderText.textContent = 'Loading terrain, imagery and trees';
  applyDisplay();
  try { await buildHill(); }
  catch (err) { console.error(err); fail('The terrain data did not load. Reload the page, or read the plan.'); return; }
  textures();
  hill.labels = hillLabels();
  applyLayers();
  fitCamera(hill.camera);
  const portrait = innerWidth / innerHeight < 1;
  const tgt = new THREE.Vector3(-250, 0, 60); tgt.y = yAt(tgt.x, tgt.z);
  HOME = { tgt, pos: tgt.clone().add(new THREE.Vector3().setFromSphericalCoords(portrait ? 2700 : 2900, portrait ? 0.95 : 1.08, -1.22)) };   // a phone sees the hill, not the model's edges
  hill.camera.position.copy(HOME.pos); mc.target.copy(HOME.tgt); mc.update();
  fitHillShadow(true);
  const want = (location.hash || '').slice(1);
  setMode('cerro');
  if (want === 'plan') openPlan();
  if (want === 'trail') openTrailer();
  if (want === 'trail-play') openTrail();
  if (want === 'explore' || want.startsWith('explore-')) openTour(want.slice(8));
  if (want === 'walk') openWalk('quarry');
  if (want === 'walk-private') openWalk('private');
  requestAnimationFrame(tick);
  initLimits().catch((err) => console.error(err));
  initNotes().catch((err) => console.error(err));
}
boot().catch((err) => { console.error(err); fail('Something went wrong building the 3D view. The plan still works.'); });
