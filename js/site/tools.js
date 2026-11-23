/* The owners' planning tools: the property limits editor and the notes on the site, both kept in the
   page's shared database.
   One of the page's scripts in js/site/: they run in order and share one scope (see index.html). */
'use strict';

/* ------------------------------------------------- the limits panel -- */
function kindSelect(id, value) {
  return `<select id="${id}">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}"${k === value ? ' selected' : ''}>${v.label}</option>`).join('')}</select>`;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function storageNote() {
  if (limits.shared) return limits.canEdit ? 'Saved to the shared model: everyone with access to this page sees these limits.' : 'You can view these limits. The owner or an editor can change them.';
  return 'Saved in this browser only. Open the page inside Claude to save limits to the shared model.';
}
function renderLimits() {
  drawer.dataset.panel = 'limits';
  setHint();
  const el = document.createElement('div');
  el.className = 'tool';
  const err = limits.error ? `<p class="note warn">${esc(limits.error)}</p>` : '';
  limits.error = '';

  if (limits.drawing) {
    const d = limits.drawing, a = d.utm.length > 2 ? ringArea(d.utm) : null;
    el.innerHTML = `${err}
      <p class="lead-num">${d.utm.length} corner${d.utm.length === 1 ? '' : 's'}${a ? ` · ${fmt(a.ha, 2)} ha · ${fmt(a.m, 0)} m around` : ''}</p>
      <label for="l-name">Name</label><input id="l-name" type="text" value="${esc(d.name)}" autocomplete="off">
      <label for="l-kind">Type</label>${kindSelect('l-kind', d.kind)}
      <div class="actions"><button class="btn" type="button" id="l-finish"${d.utm.length < 3 ? ' disabled' : ''}>Finish</button><button class="btn ghost" type="button" id="l-undo"${d.utm.length ? '' : ' disabled'}>Undo corner</button><button class="btn ghost" type="button" id="l-cancel">Cancel</button></div>`;
    openDrawer('Property limits', 'Tap each corner', 'Walk the edge of the land and tap every corner in order. Zoom in for accuracy; tap the first corner again, or Finish, to close the shape.', null, null, kindOf(d).color, storageNote(), el);
    drawer.dataset.panel = 'limits';
    const undoCorner = () => { d.utm.pop(); drawOverlay(); renderLimits(); };
    const cancel = () => { limits.drawing = null; setCollapsed(false); drawOverlay(); renderLimits(); };
    $('l-name').addEventListener('input', (e) => { d.name = e.target.value; });
    $('l-kind').addEventListener('change', (e) => { d.kind = e.target.value; drawOverlay(); renderLimits(); });
    $('l-finish').addEventListener('click', finishDrawing);
    $('l-undo').addEventListener('click', undoCorner);
    $('l-cancel').addEventListener('click', cancel);
    fillCompact(`${d.utm.length} corner${d.utm.length === 1 ? '' : 's'}${a ? ` · ${fmt(a.ha, 2)} ha` : ''}`,
      [['Finish', finishDrawing, d.utm.length < 3], ['Undo', undoCorner, !d.utm.length], ['Cancel', cancel]]);
    return;
  }

  const b = limitById(limits.editing);
  if (b) {
    const a = ringArea(b.utm), sel = limits.selected;
    const selTxt = sel >= 0 && b.utm[sel] ? `Corner ${sel + 1}: ${fmt(b.utm[sel][0], 2)} E, ${fmt(b.utm[sel][1], 2)} N` : 'Tap a corner to select it.';
    el.innerHTML = `${err}
      <label for="l-name">Name</label><input id="l-name" type="text" value="${esc(b.name)}" autocomplete="off">
      <label for="l-kind">Type</label>${kindSelect('l-kind', b.kind)}
      <ul class="facts"><li><span>Area</span><span>${fmt(a.ha, 3)} ha</span></li><li><span>Perimeter</span><span>${fmt(a.m, 1)} m</span></li><li><span>Corners</span><span>${b.utm.length}</span></li></ul>
      <p class="note">${esc(selTxt)}</p>
      <div class="actions">
        <button class="btn" type="button" id="l-done">Done</button>
        <button class="btn ghost" type="button" id="l-delcorner"${sel >= 0 && b.utm.length > 3 ? '' : ' disabled'}>Remove corner</button>
        <button class="btn ghost" type="button" id="l-undo"${limits.undo.some((u) => u.id === b.id) ? '' : ' disabled'}>Undo</button>
      </div>
      <div class="rowbtns"><button class="mini" type="button" id="l-copy">Copy GeoJSON</button><button class="mini" type="button" id="l-delete">Delete this boundary</button></div>`;
    openDrawer('Property limits', 'Adjust the corners', 'Drag a white corner to move it. Tap a small dot between two corners to add one there. Every change saves on release.', null, null, kindOf(b).color, storageNote(), el);
    drawer.dataset.panel = 'limits';
    let t = 0;
    $('l-name').addEventListener('input', (e) => { b.name = e.target.value.slice(0, 80) || 'Boundary'; clearTimeout(t); t = setTimeout(() => { persistLimit(b.id); buildChips(); }, 500); });
    $('l-kind').addEventListener('change', (e) => { b.kind = e.target.value; persistLimit(b.id); limitsChanged(); });
    const done = () => { limits.editing = null; limits.selected = -1; setCollapsed(false); limitsChanged(); };
    const delCorner = () => { if (sel < 0 || b.utm.length <= 3) return; pushUndo(b); b.utm.splice(sel, 1); limits.selected = -1; persistLimit(b.id); limitsChanged(); };
    const undo = () => {
      for (let i = limits.undo.length - 1; i >= 0; i--) if (limits.undo[i].id === b.id) { b.utm = limits.undo.splice(i, 1)[0].utm; break; }
      limits.selected = -1; persistLimit(b.id); limitsChanged();
    };
    $('l-done').addEventListener('click', done);
    $('l-delcorner').addEventListener('click', delCorner);
    $('l-undo').addEventListener('click', undo);
    fillCompact(`${fmt(a.ha, 2)} ha · ${b.utm.length} corners`, [
      ['Done', done],
      ['Undo', undo, !limits.undo.some((u) => u.id === b.id)],
      sel >= 0 ? ['Remove corner', delCorner, b.utm.length <= 3] : null,
    ]);
    $('l-copy').addEventListener('click', (e) => copyText(JSON.stringify(geojsonOf(b)), e.currentTarget));
    $('l-delete').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (btn.dataset.armed) deleteLimit(b.id); else { btn.dataset.armed = '1'; btn.textContent = 'Tap again to delete'; }
    });
    return;
  }

  // Overview: the list, a draw button and the paste-from-title-plan form.
  const all = [...OFFICIAL.map((o) => ({ ...o, official: true })), ...limits.list];
  const rows = all.map((x, i) => {
    const a = ringArea(x.utm), k = kindOf(x);
    return `<li data-row="${i}"><span class="nm"><i class="sw" style="background:${x.official ? x.color : k.color}"></i>${x.official ? '<b>Survey</b> · ' : ''}${esc(nameOf(x))}<small> · ${x.official ? esc(x.measure) : k.label}</small></span><span>${fmt(a.ha, x.official ? 4 : 2)} ha</span>
      <div class="rowbtns"><button class="mini" type="button" data-go="${i}">Go</button>${limits.canEdit ? `<button class="mini" type="button" data-rename="${i}">Rename</button>` : ''}${!x.official && limits.canEdit ? `<button class="mini" type="button" data-edit="${x.id}">Edit corners</button>` : ''}<button class="mini" type="button" data-copy="${i}">Copy GeoJSON</button></div></li>`;
  }).join('');
  el.innerHTML = `${err}
    ${limits.canEdit ? '<div class="actions"><button class="btn" type="button" id="l-draw">Draw on the map</button></div>' : ''}
    ${limits.shared && limits.canEdit && limits.local.length ? `<button class="mini" type="button" id="l-import">Add ${limits.local.length} boundar${limits.local.length > 1 ? 'ies' : 'y'} saved earlier in this browser</button>` : ''}
    <h3>On the map</h3>
    <ul class="facts">${rows || '<li><span>No limits yet.</span><span></span></li>'}</ul>
    ${limits.canEdit ? `<details id="l-paste"${limits.textDraft.length ? ' open' : ''}><summary>Paste coordinates from a title plan</summary>
      <div class="tool">
        <label for="b-name">Name</label><input id="b-name" type="text" value="Lote ${limits.list.length + 1}" autocomplete="off">
        <label for="b-kind">Type</label>${kindSelect('b-kind', 'property')}
        <label for="b-text">Corner coordinates, one per line</label>
        <textarea id="b-text" rows="6" spellcheck="false" placeholder="487 520,35   7 200 110,20&#10;487 734,10   7 200 096,55&#10;…"></textarea>
        <p class="note">UTM zone 21S (easting, northing) as printed on the plan, or latitude/longitude. Vertex numbers and distances in the table are ignored.</p>
        <p class="note" id="b-msg" aria-live="polite"></p>
        <div class="actions"><button class="btn" type="button" id="b-draw">Draw from coordinates</button></div>
      </div></details>` : ''}`;
  openDrawer('Property limits', all.length ? 'Your boundaries' : 'Set the property limits', limits.canEdit ? 'Draw the real limits on the map by tapping the corners, or paste the coordinates from a title plan. You can drag corners afterwards.' : '', null, null, 'var(--gold)', storageNote(), el);
  drawer.dataset.panel = 'limits';
  el.querySelectorAll('[data-go]').forEach((btn) => btn.addEventListener('click', () => { const bb = bounds(all[+btn.dataset.go].utm); flyAround(bb.x, bb.z, bb.r * 1.4 + 160); }));
  el.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', () => { const x = all[+btn.dataset.copy]; copyText(JSON.stringify(geojsonOf({ ...x, name: nameOf(x) })), btn); }));
  el.querySelectorAll('[data-rename]').forEach((btn) => btn.addEventListener('click', () => {
    const x = all[+btn.dataset.rename], li = btn.closest('li');
    li.querySelector('.nm').replaceWith(renameField(nameOf(x), (name) => renameBoundary(x, name), () => renderLimits()));
  }));
  el.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => startEditing(btn.dataset.edit)));
  if ($('l-draw')) $('l-draw').addEventListener('click', startDrawing);
  if ($('l-import')) $('l-import').addEventListener('click', async () => {
    const items = limits.local; limits.local = [];
    for (const it of items) { const b = { id: newLimitId(), name: it.name || 'Boundary', kind: KINDS[it.kind] ? it.kind : 'property', utm: it.utm }; limits.list.push(b); await persistLimit(b.id); }
    limitsChanged();
  });
  const ta = $('b-text');
  if (ta) {
    let t = 0;
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(updateTextDraft, 150); });
    $('b-draw').addEventListener('click', () => {
      const r = parseCoords(ta.value);
      if (r.pts.length < 3) { $('b-msg').textContent = 'A boundary needs at least three corners.'; return; }
      const b = { id: newLimitId(), name: ($('b-name').value.trim() || `Lote ${limits.list.length + 1}`).slice(0, 80), kind: $('b-kind').value, utm: r.pts.map(([E, N]) => [+E.toFixed(2), +N.toFixed(2)]) };
      limits.list.push(b); limits.textDraft = [];
      persistLimit(b.id); limitsChanged();
      const bb = bounds(b.utm); flyAround(bb.x, bb.z, bb.r * 1.4 + 160);
    });
  }
}
function updateTextDraft() {
  const ta = $('b-text'); if (!ta) return;
  const r = parseCoords(ta.value);
  limits.textDraft = r.pts;
  const msg = $('b-msg');
  if (msg) {
    const a = r.pts.length > 2 ? ringArea(r.pts) : null;
    const outside = r.pts.filter(([E, N]) => !inSquare(...fromUTM(E, N))).length;
    msg.textContent = !ta.value.trim() ? '' : !r.pts.length ? 'No coordinates recognised yet.'
      : `${r.pts.length} corner${r.pts.length > 1 ? 's' : ''} read as ${r.kind === 'utm' ? 'UTM 21S' : 'latitude/longitude'}` +
        (r.skipped ? `, ${r.skipped} line${r.skipped > 1 ? 's' : ''} skipped` : '') + (a ? ` · ${fmt(a.ha, 2)} ha, perimeter ${fmt(a.m, 0)} m` : '') +
        (outside ? ` · ${outside} outside the 4 km model` : '') + '.';
  }
  drawOverlay();
}
/* An inline name field: Enter or Save keeps the name, Escape or Cancel puts the old one back. */
function renameField(current, onSave, onCancel) {
  const box = document.createElement('div'); box.className = 'rename';
  const inp = document.createElement('input'); inp.type = 'text'; inp.value = current; inp.maxLength = 80; inp.id = 'rename-input'; inp.setAttribute('aria-label', 'New name');
  const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'mini'; ok.textContent = 'Save';
  const no = document.createElement('button'); no.type = 'button'; no.className = 'mini'; no.textContent = 'Cancel';
  const save = () => { const v = inp.value.trim(); inp.blur(); if (v && v !== current) onSave(v); else onCancel(); };
  ok.addEventListener('click', save); no.addEventListener('click', () => { inp.blur(); onCancel(); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); inp.blur(); onCancel(); } });
  box.append(inp, ok, no);
  setTimeout(() => { inp.focus(); inp.select(); }, 0);
  return box;
}
function showSurvey(o) {
  const pr = o.props || {}, a = ringArea(o.utm);
  const title = OFFICIAL.find((x) => x !== o && x.dash && (x.props || {}).finca === pr.finca);
  const facts = [
    ['Area per plan', pr.area_m2_plan ? `${fmt(pr.area_m2_plan / 10000, 4)} ha` : '—'],
    ['Area from corners', `${fmt(a.ha, 4)} ha`],
    ['Perimeter', `${fmt(a.m, 2)} m`],
    ['Corners', String(o.utm.length)],
  ];
  if (title && title.props && title.props.area_m2_plan) facts.push(['Area per title', `${fmt(title.props.area_m2_plan / 10000, 4)} ha`]);
  if (title) {
    const off = o.utm.map(([E, N]) => Math.min(...title.utm.map(([e, n]) => Math.hypot(E - e, N - n))));
    facts.push(['Title vs field, corners', `${fmt(Math.min(...off), 1)}–${fmt(Math.max(...off), 1)} m apart`]);
  }
  for (const [k, label] of [['finca', 'Finca / matrícula'], ['padron', 'Padrón'], ['lugar', 'Place'], ['distrito', 'District']]) if (pr[k]) facts.push([label, esc(pr[k])]);
  const actions = [['Copy GeoJSON', (b) => copyText(JSON.stringify(geojsonOf({ ...o, name: nameOf(o) })), b)]];
  if (limits.canEdit) actions.unshift(['Rename', () => {
    const ex = $('d-extra'); ex.innerHTML = '';
    ex.appendChild(renameField(nameOf(o), async (name) => { await renameBoundary(o, name); showSurvey(o); }, () => showSurvey(o)));
    ex.hidden = false;
  }]);
  openDrawer('Survey', nameOf(o), pr.source || 'Surveyed boundary.', facts, actions, o.color,
    title ? 'Solid line: field measurement. Dashed line: the corners written in the title.' : '');
}
function openLimits() { closeDrawer(); renderLimits(); }
function startDrawing() {
  limits.editing = null; limits.selected = -1; limits.textDraft = [];
  limits.drawing = { name: limits.list.some((b) => b.kind === 'property') ? `Lote ${limits.list.length + 1}` : 'Property', kind: 'property', utm: [] };
  drawerCollapsed = true;
  rebuildHandles(); drawOverlay(); renderLimits();
}
function finishDrawing() {
  const d = limits.drawing;
  if (!d || d.utm.length < 3) return;
  const b = { id: newLimitId(), name: (d.name || 'Property').trim().slice(0, 80) || 'Property', kind: d.kind, utm: d.utm.map(([E, N]) => [+E.toFixed(2), +N.toFixed(2)]) };
  limits.drawing = null;
  limits.list.push(b);
  persistLimit(b.id);
  limits.editing = b.id; limits.selected = -1;
  limitsChanged(); renderLimits();
}
function startEditing(id) {
  limits.drawing = null; limits.editing = id; limits.selected = -1;
  drawerCollapsed = true;
  const b = limitById(id); if (!b) return;
  const bb = bounds(b.utm); flyAround(bb.x, bb.z, bb.r * 1.3 + 140);
  limitsChanged(); renderLimits();
}

/* Dragging corners. Capture-phase listeners run before the orbit controls, so a grab on a
   handle never starts an orbit. Only the finger that grabbed a corner is intercepted: every
   other pointer event reaches the controls untouched, so they never lose track of a finger. */
let drag = null, gestureMax = 0;
const activePointers = new Set();
/* If the controls ever hold on to a finger that has lifted, clear their gesture state. */
function resetOrbit() {
  if (!Array.isArray(mc._pointers) || !mc._pointers.length) return;
  try { mc.disconnect(); } catch (err) {}
  mc._pointers.length = 0;
  mc._pointerPositions = {};
  mc.state = -1;
  try { mc.connect(renderer.domElement); } catch (err) {}
}
{
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    activePointers.add(e.pointerId);
    gestureMax = Math.max(gestureMax, activePointers.size);
    if (drag || activePointers.size > 1) return;
    if (mode !== 'cerro' || !limits.editing || !limits.canEdit || e.button > 0) return;
    const h = pickHandle(e.clientX, e.clientY);
    if (!h) return;
    e.stopImmediatePropagation(); e.preventDefault();
    drag = { h, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    mc.enabled = false; limits.dragging = true;
  }, true);
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopImmediatePropagation();
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 4) return;
    const b = limitById(limits.editing); if (!b) return;
    if (!drag.moved) {
      pushUndo(b);
      if (drag.h.type === 'mid') {
        const i = drag.h.i, [E1, N1] = b.utm[i], [E2, N2] = b.utm[(i + 1) % b.utm.length];
        b.utm.splice(i + 1, 0, [(E1 + E2) / 2, (N1 + N2) / 2]);
        drag.h = { type: 'corner', i: i + 1 };
      }
      drag.moved = true;
    }
    const p = groundPoint(e.clientX, e.clientY);
    if (!p || !inSquare(p.x, p.z)) return;
    b.utm[drag.h.i] = toUTM(p.x, p.z);
    limits.selected = drag.h.i;
    queueRedraw();
  }, true);
  const release = (e) => {
    activePointers.delete(e.pointerId);
    if (!activePointers.size) setTimeout(() => { if (!activePointers.size) { gestureMax = 0; resetOrbit(); } }, 0);
  };
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) { release(e); return; }
    e.stopImmediatePropagation();
    release(e);
    const d = drag, b = limitById(limits.editing);
    drag = null; limits.dragging = false;
    if (!tween) mc.enabled = true;
    try { el.releasePointerCapture(e.pointerId); } catch (err) {}
    if (!b) return;
    if (e.type === 'pointercancel') { limitsChanged(); return; }
    if (!d.moved) {
      if (d.h.type === 'corner') limits.selected = d.h.i;
      else {
        pushUndo(b);
        const i = d.h.i, [E1, N1] = b.utm[i], [E2, N2] = b.utm[(i + 1) % b.utm.length];
        b.utm.splice(i + 1, 0, [(E1 + E2) / 2, (N1 + N2) / 2]);
        limits.selected = i + 1;
        persistLimit(b.id);
      }
    } else persistLimit(b.id);
    limitsChanged();
  };
  el.addEventListener('pointerup', end, true);
  el.addEventListener('pointercancel', end, true);
  el.addEventListener('lostpointercapture', (e) => { if (drag && e.pointerId === drag.id) end(Object.assign(new Event('pointercancel'), { pointerId: e.pointerId })); });
}

/* --------------------------------------------------- notes on the site -- */
/* Marks the owner leaves in the model: planned cabins and other buildings as footprints that can be turned
   and moved, and notes as pins. They live in the artifact's shared database (collection "notes"), where
   Claude can read them; outside the Claude viewer they stay in this browser. Positions are UTM 21S. */
const NOTE_KINDS = {
  cabin: { label: 'Cabin', color: '#93c97c', hex: 0x93c97c, w: 9, d: 6.5, add: 'Add a cabin' },
  building: { label: 'Building', color: '#e9bf5a', hex: 0xe9bf5a, w: 8, d: 6, add: 'Add a building' },
  pond: { label: 'Pond', color: '#5fa9c9', hex: 0x5fa9c9, w: 12, d: 24, add: 'Add a pond' },
  note: { label: 'Note', color: '#7fb3e3', hex: 0x7fb3e3, add: 'Add a note' },
};
const notes = { list: [], local: [], shared: false, db: null, canEdit: true, me: null, placing: null, moving: null, open: null, error: '', writing: {}, dirty: {}, chips: [] };
const NOTES_KEY = 'oh-notes-v1';
const noteById = (id) => notes.list.find((n) => n.id === id);
const TRAIL_KIND = { label: 'Trail', color: '#dd7a4b', hex: 0xdd7a4b };
const kindOfNote = (n) => (n.kind === 'note' && isTrailNote(n) ? TRAIL_KIND : NOTE_KINDS[n.kind] || NOTE_KINDS.note);
const NOTE_MODELS = { 'stone-tower': 'Stone tower lookout (first draft)', plaza: 'Central plaza (first draft)' };
const newNoteId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const WINDS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const windOf = (deg) => WINDS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
function noteFromDoc(id, v) {
  const kind = NOTE_KINDS[v.kind] ? v.kind : 'note', k = NOTE_KINDS[kind];
  return {
    id, kind, name: String(v.name || k.label).slice(0, 80), text: String(v.text || '').slice(0, 4000),
    E: +v.E || 0, N: +v.N || 0, rot: (((+v.rot || 0) % 360) + 360) % 360,
    w: clamp(+v.w || k.w || 2, 2, 60), d: clamp(+v.d || k.d || 2, 2, 60), by: v.by || null, updated: +v.updated || 0,
    model: NOTE_MODELS[v.model] ? v.model : '',
  };
}
const noteDoc = (n) => ({ kind: n.kind, name: n.name, text: n.text, E: +n.E.toFixed(2), N: +n.N.toFixed(2), rot: Math.round(n.rot), w: n.w, d: n.d, by: n.by, model: n.model || '', updated: Date.now() });
async function initNotes() {
  try { notes.list = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]').map((v) => noteFromDoc(v.id, v)); } catch (e) {}
  notesChanged();
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return;
  const [db, user] = await Promise.all([c.use('db').catch(() => null), c.use('user').catch(() => null)]);
  if (!db) return;
  if (user) { try { notes.canEdit = await user.canEdit(); } catch (e) {} try { notes.me = (await user.me()).id || null; } catch (e) {} }
  notes.db = db; notes.shared = true; notes.local = notes.list; notes.list = [];
  db.collection('notes').onSnapshot((snap) => {
    const typing = noteTyping() ? noteById(notes.open) : null;      // keep what is being typed
    notes.list = snap.docs.map((d) => noteFromDoc(d.id, d.data() || {})).map((n) => (typing && n.id === typing.id ? typing : n));
    notesChanged();
  }, () => {});
}
function localSaveNotes() { if (!notes.shared) { try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes.list)); } catch (e) {} } }
async function persistNote(id) {
  if (!notes.shared) { localSaveNotes(); return; }
  if (notes.writing[id]) { notes.dirty[id] = true; return; }
  notes.writing[id] = true;
  try {
    do {
      notes.dirty[id] = false;
      const n = noteById(id); if (!n) break;
      await notes.db.collection('notes').doc(id).set(noteDoc(n));
    } while (notes.dirty[id]);
  } catch (e) {
    if (e && e.code === 'invalid_argument') notes.canEdit = false;
    notes.error = e && e.code === 'quota_exceeded' ? 'The shared model is full; remove a note first.' : 'That change was not saved. Check the connection and try again.';
    notesChanged();
  } finally { notes.writing[id] = false; }
}
async function deleteNote(id) {
  notes.list = notes.list.filter((n) => n.id !== id);
  if (notes.open === id) notes.open = null;
  if (notes.shared) { try { await notes.db.collection('notes').doc(id).delete(); } catch (e) { notes.error = 'That note was not removed. Try again.'; } }
  else localSaveNotes();
  notesChanged();
}
const noteTyping = () => { const a = document.activeElement; return !!(a && drawer.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== 'range'); };
function notesChanged() {
  if (!hill.terrain) return;
  if (updateTrail()) drawOverlay();
  rebuildNoteMeshes();
  if (mode === 'cerro') buildChips();
  if (!drawer.hidden && drawer.dataset.panel === 'notes' && !noteTyping()) renderNotes();
  setHint();
}

/* In the model: footprints for buildings (cabins with a deck on the side they face), pins for notes. */
const NOTE_GEO = { stem: new THREE.CylinderGeometry(0.22, 0.22, 8, 8), head: new THREE.SphereGeometry(1.3, 16, 12) };
const noteMats = {};
function noteMat(hex, sel, extra = {}) {
  const key = hex + ':' + sel + ':' + JSON.stringify(extra);
  return noteMats[key] || (noteMats[key] = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, emissive: sel ? hex : 0x000000, emissiveIntensity: sel ? 0.35 : 0, ...extra }));
}
function cabinMats(sel) {
  const key = 'cabin:' + sel;
  if (noteMats[key]) return noteMats[key];
  if (!T.earth) textures();
  const lit = (hex) => ({ emissive: sel ? hex : 0x000000, emissiveIntensity: sel ? 0.3 : 0 });
  return (noteMats[key] = {
    wall: new THREE.MeshStandardMaterial({ map: T.earth, bumpMap: T.earth, bumpScale: 1.2, roughness: 0.95, ...lit(0xc9a283) }),
    roof: new THREE.MeshStandardMaterial({ map: T.roofGrass, roughness: 1, ...lit(0x6f8a45) }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b2722, roughness: 0.45, metalness: 0.6, ...lit(0x2b2722) }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8fa9b2, roughness: 0.04, metalness: 0.9, envMapIntensity: 1.4, ...lit(0x1c242c) }),
    deck: new THREE.MeshStandardMaterial({ map: T.deck, roughness: 0.8, ...lit(0x8a5f3c) }),
  });
}
function footprintModel(n, sel) {
  const g = new THREE.Group(), k = kindOfNote(n), W = n.w, D = n.d, H = n.kind === 'cabin' ? 3.0 : 3.4;
  if (n.kind === 'cabin') {
    const M = cabinMats(sel);
    box(W, H + 1.2, D, 0, (H - 1.2) / 2, 0, M.wall, g, { uv: 3 });                          // rammed earth, reaching into the slope
    const r = box(W + 0.8, 0.32, D + 0.8, 0, H + 0.2, 0, M.roof, g, { uv: 4 }); r.rotation.x = -0.08;   // living roof
    box(W + 0.84, 0.14, 0.06, 0, H + 0.12, D / 2 + 0.44, M.frame, g);                       // its edge
    box(W - 0.6, H - 0.7, 0.05, 0, (H - 0.7) / 2 + 0.2, D / 2 + 0.03, M.glass, g);          // glass to the view
    for (let i = 0; i <= 3; i++) box(0.08, H - 0.7, 0.1, -(W - 0.6) / 2 + (i * (W - 0.6)) / 3, (H - 0.7) / 2 + 0.2, D / 2 + 0.06, M.frame, g);
    box(W, 0.18, 3, 0, 0.25, D / 2 + 1.5, M.deck, g, { uv: 2 });                            // deck
  } else {
    const wall = noteMat(0xe6ded0, sel), roof = noteMat(0x8d8a84, sel);
    box(W, H + 1.2, D, 0, (H - 1.2) / 2, 0, wall, g);                                       // reaches into the slope
    box(W + 0.8, 0.3, D + 0.8, 0, H + 0.2, 0, roof, g);
  }
  if (sel) {                                                   // the selected one is outlined, through anything in front of it
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => new THREE.Vector3((a * (W + 1)) / 2, 0.15, (b * (D + (n.kind === 'cabin' ? 4 : 1))) / 2 + (n.kind === 'cabin' ? 1.5 : 0)))),
      new THREE.LineBasicMaterial({ color: k.hex, depthTest: false, transparent: true }));
    ring.renderOrder = 5; g.add(ring);
  }
  return g;
}
/* A planned pond: water laid on the ground as an oval, inside a muddy rim. */
function pondNoteModel(n, cx, cz, sel) {
  const b = (n.rot * Math.PI) / 180, fx = Math.sin(b), fz = -Math.cos(b), rx = Math.cos(b), rz = Math.sin(b);
  const seg = 56, rings = 7, pos = [], col = [], idx = [], water = new THREE.Color(0x3f6b66), deep = new THREE.Color(0x2c4f4c), mud = new THREE.Color(0x8a6a48);
  const at = (u, v) => { const x = cx + rx * u + fx * v, z = cz + rz * u + fz * v; return [x, yAt(x, z) + 0.14, z]; };
  pos.push(...at(0, 0)); col.push(deep.r, deep.g, deep.b);
  for (let r = 1; r <= rings + 1; r++) {
    const f = r <= rings ? r / rings : 1.12;
    for (let s = 0; s < seg; s++) {
      const t = (s / seg) * Math.PI * 2, wob = 1 + 0.05 * Math.sin(t * 3 + n.w) + 0.03 * Math.cos(t * 5);
      pos.push(...at(Math.cos(t) * (n.w / 2) * f * wob, Math.sin(t) * (n.d / 2) * f * wob));
      const c = r > rings ? mud : deep.clone().lerp(water, f); col.push(c.r, c.g, c.b);
    }
  }
  for (let s = 0; s < seg; s++) idx.push(0, 1 + ((s + 1) % seg), 1 + s);
  for (let r = 1; r <= rings; r++) for (let s = 0; s < seg; s++) {
    const a = 1 + (r - 1) * seg + s, b2 = 1 + (r - 1) * seg + ((s + 1) % seg), c = a + seg, d = b2 + seg;
    idx.push(a, b2, c, b2, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, noteMat(0xffffff, sel, { vertexColors: true, roughness: 0.12, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  const g = new THREE.Group(); g.add(m);
  return g;
}
/* First drafts of the art on the trail, set on a checkpoint note by its "model". */
function stoneTex() {
  if (SITE.stone) return SITE.stone;
  const r = rng(53), [c, g] = canvas(512, 512);
  g.fillStyle = '#6e675d'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512;) {
    const h = 30 + r() * 26;
    for (let x = -r() * 60; x < 512;) {
      const w = 40 + r() * 70, v = 120 + r() * 70, t = r() * 20;
      g.fillStyle = `rgb(${v + t},${v + t * 0.6 - 4},${v - 10})`;
      g.beginPath(); g.roundRect(x + 2, y + 2, w - 4, h - 4, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 2, y + h - 8, w - 4, 6);
      x += w;
    }
    y += h;
  }
  return (SITE.stone = tex(c));
}
function installationModel(kind, sel) {
  const g = new THREE.Group(), stone = noteMat(0xffffff, sel, { map: stoneTex(), roughness: 0.95 });
  if (kind === 'stone-tower') {                       // a dry-stone lookout that clears the canopy
    const H = 12;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.6, H + 1, 20, 1), stone); tower.position.y = (H - 1) / 2;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.35, 24), stone); deck.position.y = H + 0.15;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 1.05, 24, 1, true), noteMat(0xffffff, sel, { map: stoneTex(), roughness: 0.95, side: THREE.DoubleSide })); wall.position.y = H + 0.85;
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.3), noteMat(0x1a1714, sel)); door.position.set(0, 1.05, 2.45);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.6, w2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.3), noteMat(0x1a1714, sel));
      w2.position.set(Math.sin(a) * 2.25, 3.5 + k * 2.1, Math.cos(a) * 2.25); w2.rotation.y = a; g.add(w2);
    }
    g.add(tower, deck, wall, door);
  } else if (kind === 'plaza') {                      // a round stone floor with a fire circle and benches
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(13, 13.4, 0.8, 48), stone); floor.position.y = -0.2;
    const fire = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.35, 8, 24), stone); fire.rotation.x = Math.PI / 2; fire.position.y = 0.4;
    g.add(floor, fire);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.6), noteMat(0x8a5f3c, sel));
      b.position.set(Math.cos(a) * 9.5, 0.45, Math.sin(a) * 9.5); b.rotation.y = -a + Math.PI / 2; g.add(b);
    }
  }
  return g;
}
function rebuildNoteMeshes() {
  if (hill.notes) { hill.scene.remove(hill.notes); hill.notes.traverse((c) => { if (c.geometry && c.geometry !== NOTE_GEO.stem && c.geometry !== NOTE_GEO.head) c.geometry.dispose(); }); }
  const g = new THREE.Group(), panel = !drawer.hidden && drawer.dataset.panel === 'notes';
  for (const n of notes.list) {
    const [x, z] = fromUTM(n.E, n.N);
    if (!inSquare(x, z)) continue;
    const sel = panel && n.id === notes.open;
    let m;
    if (n.kind === 'pond') {
      m = pondNoteModel(n, x, z, sel);
    } else if (n.kind === 'note' && n.model) {
      m = installationModel(n.model, sel); m.position.set(x, baseY(x, z, n.model === 'plaza' ? 10 : 3), z); m.rotation.y = bearingRot(n.rot);
    } else if (n.kind === 'note') {
      m = new THREE.Group();
      const mat = noteMat(kindOfNote(n).hex, sel);
      const stem = new THREE.Mesh(NOTE_GEO.stem, mat), head = new THREE.Mesh(NOTE_GEO.head, mat);
      stem.position.y = 4; head.position.y = 8.6; m.add(stem, head);
      m.position.set(x, yAt(x, z), z);
    } else {
      m = footprintModel(n, sel);
      m.position.set(x, baseY(x, z, Math.max(n.w, n.d) * 0.45), z); m.rotation.y = bearingRot(n.rot);
    }
    m.traverse((c) => { c.userData.note = n.id; if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    g.add(m);
  }
  g.visible = display.notes;
  hill.notes = g; hill.scene.add(g);
  const sig = notes.list.filter((n) => n.kind !== 'note' || n.model).map((n) => [n.E.toFixed(1), n.N.toFixed(1), n.rot, n.w, n.d, n.model].join()).join('|');
  if (hill.trees && sig !== notes.treeSig) { notes.treeSig = sig; placeTrees(hill.trees); }   // trees step aside for planned buildings
  renderer.shadowMap.needsUpdate = true;
}
function noteChips() {
  notes.chips = notes.list.map((n) => {
    const [x, z] = fromUTM(n.E, n.N), k = kindOfNote(n);
    const sub = n.kind === 'note' ? (n.text.split('\n')[0].slice(0, 42) + (n.text.length > 42 ? '…' : '')) || 'Note' : n.kind === 'pond' ? `Pond · ${fmt((Math.PI / 4) * n.w * n.d, 0)} m²` : `${k.label} · faces ${windOf(n.rot)}`;
    const lift = n.model === 'stone-tower' ? 17 : n.kind === 'note' ? 11 : n.kind === 'pond' ? 4 : 7;
    const l = { name: n.name, sub, c: k.color, anchor: new THREE.Vector3(x, yAt(x, z) + lift, z) };
    l.chip = makeChip(l, '', () => openNote(n.id));
    return l;
  });
}

/* Placing, moving and opening. */
function startPlacing(kind) {
  if (!notes.canEdit) return;
  notes.placing = kind; notes.moving = null; notes.open = null;
  drawerCollapsed = true; renderNotes();
}
function downhillBearing(x, z) {
  const gx = groundAt(x + 5, z) - groundAt(x - 5, z), gz = groundAt(x, z + 5) - groundAt(x, z - 5);
  return Math.round(((((Math.atan2(-gx, gz) * 180) / Math.PI) % 360) + 360) % 360 / 5) * 5;   // the view is usually downhill
}
function placeNoteAt(x, z) {
  if (!inSquare(x, z)) return;
  const [E, N] = toUTM(x, z);
  if (notes.moving) {
    const n = noteById(notes.moving); notes.moving = null;
    if (n) { n.E = E; n.N = N; persistNote(n.id); notes.open = n.id; }
  } else if (notes.placing) {
    const kind = notes.placing, k = NOTE_KINDS[kind]; notes.placing = null;
    const count = notes.list.filter((n) => n.kind === kind).length + 1;
    const n = noteFromDoc(newNoteId(), { kind, name: `${k.label} ${count}`, E, N, rot: downhillBearing(x, z), w: k.w, d: k.d, by: notes.me });
    notes.list.push(n); persistNote(n.id); notes.open = n.id;
  }
  drawerCollapsed = false; notesChanged(); renderNotes();
}
function openNote(id) {
  const n = noteById(id); if (!n) return;
  notes.open = id; notes.placing = null; notes.moving = null;
  drawerCollapsed = false;
  const [x, z] = fromUTM(n.E, n.N);
  flyAround(x, z, n.kind === 'note' ? 90 : 70);
  renderNotes(); rebuildNoteMeshes();
}
function notesAsText() {
  const lines = ['Outer Heaven: notes on the site (UTM 21S)', ''];
  for (const n of notes.list) {
    const k = kindOfNote(n);
    lines.push(`${k.label}: ${n.name}. ${n.E.toFixed(1)} E, ${n.N.toFixed(1)} N${n.kind === 'note' ? '' : `, faces ${windOf(n.rot)} (${Math.round(n.rot)}°), ${n.w} × ${n.d} m`}`);
    if (n.text) lines.push(n.text);
    lines.push('');
  }
  const t = trailSummary();
  if (t) lines.push(`Trail: ${(t.len / 1000).toFixed(2)} km, climbs ${Math.round(t.up)} m, steepest ${Math.round(t.steep * 100)}%.`);
  return lines.join('\n');
}
function notesStorage() {
  if (notes.shared) return notes.canEdit ? 'Saved to the shared model. Everyone with access sees these, and Claude can read them.' : 'You can read these notes. The owner or an editor can add and change them.';
  return 'Saved in this browser only. Open the page inside Claude to share your notes with Claude.';
}

/* The panel. */
function renderNotes() {
  const el = document.createElement('div');
  el.className = 'tool';
  const err = notes.error; notes.error = '';
  if (err) { const p = document.createElement('p'); p.className = 'note warn'; p.textContent = err; el.appendChild(p); }
  const btn = (label, cls, go, disabled) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.disabled = !!disabled; b.addEventListener('click', go); return b; };
  const row = (...kids) => { const d = document.createElement('div'); d.className = 'actions'; d.append(...kids.filter(Boolean)); return d; };

  if (notes.placing || notes.moving) {
    const n = notes.moving && noteById(notes.moving), k = NOTE_KINDS[notes.placing] || (n && kindOfNote(n));
    const what = notes.moving ? `Tap the new spot for ${n ? n.name : 'it'}` : `Tap the map where the ${k.label.toLowerCase()} goes`;
    const cancel = () => { const back = notes.moving; notes.placing = null; notes.moving = null; drawerCollapsed = false; if (back) notes.open = back; renderNotes(); };
    el.appendChild(row(btn('Cancel', 'btn ghost', cancel)));
    openDrawer('Notes', what, 'Zoom in close for accuracy. You can move it afterwards.', null, null, k.color, notesStorage(), el);
    drawer.dataset.panel = 'notes';
    fillCompact(what, [['Cancel', cancel]]);
    setHint();
    return;
  }

  const n = noteById(notes.open);
  if (n) {
    const k = kindOfNote(n), [x, z] = fromUTM(n.E, n.N);
    const facts = [['Ground', `≈ ${groundAt(x, z).toFixed(0)} m`], ['Slope', `≈ ${slopeAt(x, z).toFixed(0)}°`]];
    const house = OBJECTS.objects.find((o) => o.type === 'house');
    if (house) facts.push(['To the house', `≈ ${fmt(Math.hypot(x - house.x, z - house.z), 0)} m`]);
    if (n.kind === 'pond') facts.push(['Water', `${n.w} × ${n.d} m · ≈ ${fmt((Math.PI / 4) * n.w * n.d, 0)} m²`]);
    else if (n.kind !== 'note') facts.push(['Footprint', `${n.w} × ${n.d} m · ${fmt(n.w * n.d, 0)} m²${n.kind === 'cabin' ? ' + deck' : ''}`]);
    if (n.model) facts.push(['In the model', NOTE_MODELS[n.model]]);
    facts.push(['UTM 21S', `${fmt(n.E, 1)} E, ${fmt(n.N, 1)} N`]);
    let t = 0;
    const save = (ms = 600) => { n.updated = Date.now(); clearTimeout(t); t = setTimeout(() => persistNote(n.id), ms); };
    if (notes.canEdit) {
      const lab = (txt, forId) => { const l = document.createElement('label'); l.textContent = txt; if (forId) l.htmlFor = forId; return l; };
      const name = document.createElement('input'); name.id = 'n-name'; name.type = 'text'; name.value = n.name; name.autocomplete = 'off'; name.maxLength = 80;
      name.addEventListener('input', () => { n.name = name.value.trim() || k.label; save(); });
      name.addEventListener('blur', () => buildChips());
      const text = document.createElement('textarea'); text.id = 'n-text'; text.rows = 6; text.value = n.text; text.maxLength = 4000;
      text.placeholder = n.kind === 'cabin' ? 'For Claude: who it is for, what the view should be, trees to keep, how you reach it…' : 'For Claude: what you want here, what to keep, what to avoid…';
      text.addEventListener('input', () => { n.text = text.value; save(); });
      text.addEventListener('blur', () => buildChips());
      el.append(lab('Name', 'n-name'), name, lab('Notes for Claude', 'n-text'), text);
      if (n.kind !== 'note') {
        const turnLabel = n.kind === 'pond' ? 'Long side runs' : 'Faces';
        const rl = lab(`${turnLabel} ${windOf(n.rot)} · ${Math.round(n.rot)}°`, 'n-rot');
        const rot = document.createElement('input'); rot.id = 'n-rot'; rot.type = 'range'; rot.min = 0; rot.max = 355; rot.step = 5; rot.value = n.rot;
        rot.addEventListener('input', () => { n.rot = +rot.value; rl.textContent = `${turnLabel} ${windOf(n.rot)} · ${n.rot}°`; rebuildNoteMeshes(); save(400); });
        rot.addEventListener('change', () => buildChips());
        const size = document.createElement('div'); size.className = 'pair';
        for (const [key, label] of [['w', 'Width (m)'], ['d', 'Depth (m)']]) {
          const wrap = document.createElement('label'); wrap.textContent = label;
          const inp = document.createElement('input'); inp.type = 'number'; inp.min = 2; inp.max = 60; inp.step = 0.5; inp.value = n[key]; inp.inputMode = 'decimal';
          inp.addEventListener('change', () => { n[key] = clamp(+inp.value || n[key], 2, 60); inp.value = n[key]; rebuildNoteMeshes(); save(0); });
          wrap.appendChild(inp); size.appendChild(wrap);
        }
        el.append(rl, rot, size);
      }
    } else if (n.text) {
      const p = document.createElement('p'); p.className = 'notetext'; p.textContent = n.text; el.appendChild(p);
    }
    const ul = document.createElement('ul'); ul.className = 'facts';
    for (const [a, b] of facts) { const li = document.createElement('li'); const s1 = document.createElement('span'), s2 = document.createElement('span'); s1.textContent = a; s2.textContent = b; li.append(s1, s2); ul.appendChild(li); }
    el.appendChild(ul);
    const done = () => { notes.open = null; renderNotes(); rebuildNoteMeshes(); };
    const move = () => { notes.moving = n.id; drawerCollapsed = true; renderNotes(); };
    const turn = () => { n.rot = (n.rot + 15) % 360; rebuildNoteMeshes(); save(400); renderNotes(); };
    const del = btn('Delete', 'btn ghost', (e) => { const b = e.currentTarget; if (b.dataset.armed) deleteNote(n.id); else { b.dataset.armed = '1'; b.textContent = 'Tap again to delete'; } });
    el.appendChild(row(btn('Done', 'btn', done), notes.canEdit && btn('Move', 'btn ghost', move), notes.canEdit && n.kind !== 'note' && btn('Turn 15°', 'btn ghost', turn), notes.canEdit && del));
    openDrawer(k.label, n.name, null, null, null, k.color, notesStorage(), el);
    drawer.dataset.panel = 'notes';
    fillCompact(`${n.name}${n.kind === 'note' ? '' : ` · faces ${windOf(n.rot)}`}`, [['Done', done], notes.canEdit ? ['Move', move] : null, notes.canEdit && n.kind !== 'note' ? ['Turn', turn] : null]);
    setHint();
    return;
  }

  // Overview
  if (notes.canEdit) el.appendChild(row(...Object.entries(NOTE_KINDS).map(([kind, k], i) => btn(k.add, i ? 'btn ghost' : 'btn', () => startPlacing(kind)))));
  if (notes.shared && notes.canEdit && notes.local.length) {
    el.appendChild(btn(`Add ${notes.local.length} note${notes.local.length > 1 ? 's' : ''} saved earlier in this browser`, 'mini', async () => {
      const items = notes.local; notes.local = [];
      for (const it of items) { const m = noteFromDoc(newNoteId(), it); notes.list.push(m); await persistNote(m.id); }
      notesChanged();
    }));
  }
  const h = document.createElement('h3'); h.textContent = notes.list.length ? 'On the map' : 'Nothing marked yet'; el.appendChild(h);
  const ul = document.createElement('ul'); ul.className = 'facts';
  for (const m of notes.list) {
    const k = kindOfNote(m), li = document.createElement('li'), nm = document.createElement('span'), sw = document.createElement('i'), meta = document.createElement('small');
    nm.className = 'nm'; sw.className = 'sw'; sw.style.background = k.color;
    meta.textContent = ` · ${k.label}${m.kind === 'note' ? '' : `, faces ${windOf(m.rot)}`}`;
    nm.append(sw, document.createTextNode(m.name), meta);
    const snippet = document.createElement('span'); snippet.textContent = m.text ? (m.text.slice(0, 60) + (m.text.length > 60 ? '…' : '')) : '';
    const rb = document.createElement('div'); rb.className = 'rowbtns';
    rb.append(btn('Open', 'mini', () => openNote(m.id)));
    li.append(nm, snippet, rb); ul.appendChild(li);
  }
  el.appendChild(ul);
  const tsum = trailSummary();
  if (tsum) {
    const th = document.createElement('h3'); th.textContent = 'The trail'; el.appendChild(th);
    const tp = document.createElement('p'); tp.className = 'note';
    tp.textContent = `${fmt(tsum.len / 1000, 2)} km through ${trail.legs.length + 1} stops · climbs ${fmt(tsum.up, 0)} m, descends ${fmt(tsum.down, 0)} m · steepest stretch ${Math.round(tsum.steep * 100)}%. Routed along the gentlest ground between the checkpoints; it follows them when you move one.`;
    el.appendChild(tp);
    const tl = document.createElement('ul'); tl.className = 'facts';
    for (const l of trail.legs) {
      const li = document.createElement('li'), a = document.createElement('span'), b2 = document.createElement('span');
      a.textContent = `${l.from} → ${l.to}`; b2.textContent = `${fmt(l.len, 0)} m · +${fmt(l.up, 0)} / −${fmt(l.down, 0)} m · ${Math.round(l.steep * 100)}%`;
      li.append(a, b2); tl.appendChild(li);
    }
    el.appendChild(tl);
  }
  if (notes.list.length) el.appendChild(btn('Copy all as text', 'mini', (e) => copyText(notesAsText(), e.currentTarget)));
  openDrawer('Notes', 'Lay out the site', notes.canEdit ? 'Put down cabins and other buildings where you want them, turn them to face the view, and leave notes for Claude anywhere on the map.' : '', null, null, '#7fb3e3', notesStorage(), el);
  drawer.dataset.panel = 'notes';
  setHint();
}
