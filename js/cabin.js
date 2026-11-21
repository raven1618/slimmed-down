/* The buildings of the Designs tab and Walk the site, from one set of builders, so the cabin you walk up to
   at the quarry is the same one the Designs tab shows: rammed-earth volumes with glass fronts, living-roof
   slabs, decks and furnished interiors, in the walk's photo materials (js/look.js). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function worldUV(geo, s = 4) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (nx > 0.5) uv.setXY(i, z / s, y / s);
    else if (ny > 0.5) uv.setXY(i, x / s, z / s);
    else uv.setXY(i, x / s, y / s);
  }
  uv.needsUpdate = true;
  return geo;
}
function box(w, h, d, x, y, z, mat, parent, opts = {}) {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (opts.uv) worldUV(geo, opts.uv);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast !== false; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

/* Materials: the walk's photo textures with their relief (normal) maps, 2 m tiles on walls and decks. */
export function materials(L) {
  const t = (k, r) => { const c = L.tex[k].clone(); c.repeat.set(r, r); c.needsUpdate = true; return c; };
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    earth: std({ map: t('plaster', 2), normalMap: t('plasterN', 2), roughness: 0.95 }),
    deck: std({ map: t('planks', 1.5), normalMap: t('planksN', 1.5), roughness: 0.8 }),
    timber: std({ map: t('planks', 1), normalMap: t('planksN', 1), roughness: 0.7 }),
    roofGrass: std({ map: t('grass', 2.5), normalMap: t('grassN', 2.5), color: new THREE.Color().setRGB(0.52, 0.88, 0.4), roughness: 0.95 }),
    slab: std({ color: 0x2a2826, roughness: 0.6, metalness: 0.15 }),
    soil: std({ color: 0x4b3b2c, roughness: 1 }),
    glass: std({ color: 0x9fb8bf, roughness: 0.04, metalness: 0.9, transparent: true, opacity: 0.22, envMapIntensity: 1.4 }),
    frame: std({ color: 0x2b2722, roughness: 0.45, metalness: 0.6 }),
    floor: std({ map: t('planks', 0.8), normalMap: t('planksN', 0.8), color: 0xb8a998, roughness: 0.5 }),
    ceiling: std({ color: 0xf2eee6, roughness: 0.9 }),
    linen: std({ color: 0xf1ede4, roughness: 0.95 }),
    dark: std({ color: 0x1e1c1a, roughness: 0.55 }),
    counter: std({ color: 0x3a3836, roughness: 0.35 }),
    sofa: std({ color: 0xc8b9a2, roughness: 0.95 }),
    steel: std({ color: 0x2d2f30, roughness: 0.45, metalness: 0.7 }),
    stone: std({ color: 0x9a8a78, roughness: 0.92 }),
    lamp: std({ color: 0x2a2622, emissive: 0xffc988, emissiveIntensity: 0 }),
    window: std({ color: 0x1b2326, roughness: 0.1, metalness: 0.6, emissive: 0xffbe7a, emissiveIntensity: 0 }),
    pool: std({ color: 0x4aa3ad, roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.9 }),
    coping: std({ map: t('plaster', 1), normalMap: t('plasterN', 1), color: 0xe6dccb, roughness: 0.85 }),
  };
}

/* One rammed-earth volume: earth back and sides, a front of glass, door and earth. */
export function buildVolume(SM, o, lights) {
  const g = new THREE.Group();
  const t = 0.45, h = o.h, W = o.w + t * 2, D = o.d + t * 2;
  box(W, h, t, 0, h / 2, -D / 2 + t / 2, SM.earth, g, { uv: 4 });
  box(t, h, D, -W / 2 + t / 2, h / 2, 0, SM.earth, g, { uv: 4 });
  box(t, h, D, W / 2 - t / 2, h / 2, 0, SM.earth, g, { uv: 4 });
  let x = -W / 2;
  const fz = D / 2 - t / 2;
  for (const seg of o.front) {
    const cx = x + seg.w / 2;
    if (seg.k === 'earth' || seg.k === 'slit') {
      box(seg.w, h, t, cx, h / 2, fz, SM.earth, g, { uv: 4 });
      if (seg.k === 'slit') {
        box(0.62, 2.3, 0.06, cx, 1.35, D / 2 + 0.02, SM.window, g, { cast: false });
        box(0.74, 2.42, 0.04, cx, 1.35, D / 2 + 0.005, SM.frame, g, { cast: false });
      }
    } else if (seg.k === 'glass') {
      box(seg.w, 0.12, 0.16, cx, h - 0.06, fz + 0.1, SM.frame, g);
      box(seg.w, 0.06, 0.16, cx, 0.03, fz + 0.1, SM.frame, g);
      const n = seg.n ?? Math.max(1, Math.round(seg.w / 1.3));
      for (let i = 0; i <= n; i++) box(0.06, h, 0.14, x + (seg.w * i) / n, h / 2, fz + 0.1, SM.frame, g);
      box(seg.w, h - 0.12, 0.03, cx, (h - 0.12) / 2, fz + 0.1, SM.glass, g, { cast: false });
    } else if (seg.k === 'door') {
      box(seg.w, h - 0.4, 0.08, cx, (h - 0.4) / 2, fz + 0.12, SM.timber, g);
      box(seg.w, 0.4, t, cx, h - 0.2, fz, SM.earth, g, { uv: 4 });
      box(0.05, 0.6, 0.05, cx + seg.w * 0.36, 1.1, fz + 0.2, SM.frame, g);
    }
    x += seg.w;
  }
  // Floor, ceiling, plinth.
  box(W, 0.3, D, 0, -0.15, 0, SM.stone, g, { cast: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.d), SM.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; floor.receiveShadow = true; g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.d), SM.ceiling);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = h - 0.02; g.add(ceil);
  // Roof: dark slab, soil, grass, with tufts on top for a living silhouette.
  const of = o.overFront ?? 2.0, ob = o.overBack ?? 0.6, os = o.overSide ?? 1.0;
  const RW = W + os * 2, RD = D + of + ob, rz = (of - ob) / 2;
  box(RW, 0.34, RD, 0, h + 0.17, rz, SM.slab, g);
  box(RW - 0.3, 0.2, RD - 0.3, 0, h + 0.44, rz, SM.soil, g);
  const grass = box(RW - 0.36, 0.04, RD - 0.36, 0, h + 0.56, rz, SM.roofGrass, g, { cast: false });
  grass.geometry = worldUV(new THREE.BoxGeometry(RW - 0.36, 0.04, RD - 0.36), 6);
  if (o.fascia) box(RW + 0.04, 0.36, 0.06, 0, h + 0.17, rz + RD / 2 + 0.03, SM.steel, g);   // steel edge on a cantilevered slab
  o.roofTop = h + 0.58;
  o.roofRect = [RW - 0.6, RD - 0.6, rz];
  // Posts under the front eave, unless the slab is cantilevered.
  if (o.posts !== false) {
    const pz = D / 2 + of - 0.35, n = Math.max(2, Math.round(RW / 3.3));
    for (let i = 0; i <= n; i++) {
      const px = -RW / 2 + 0.45 + ((RW - 0.9) * i) / n;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, h, 10), SM.timber);
      post.position.set(px, h / 2, pz); post.castShadow = true; g.add(post);
    }
  }
  // Deck.
  const dd = o.deckD ?? of + 0.5;
  const deck = box(o.deckW ?? W + 0.6, 0.3, dd, o.deckX ?? 0, 0.15, D / 2 + dd / 2, SM.deck, g);
  deck.geometry = worldUV(new THREE.BoxGeometry(o.deckW ?? W + 0.6, 0.3, dd), 3);
  box(o.deckW ?? W + 0.6, 0.15, 0.35, o.deckX ?? 0, 0.075, D / 2 + dd + 0.15, SM.deck, g);
  // Night lights inside.
  for (const [lx, lz] of o.lights || []) {
    const pl = new THREE.PointLight(0xffc27e, 0, 10, 1.5);
    pl.position.set(lx, h - 0.5, lz); g.add(pl); lights.push(pl);
  }
  g.userData.W = W; g.userData.D = D;
  return g;
}

export function cabinInterior(SM, g) {
  // Bedroom on the left, kitchen in the middle, bathroom behind an earth wall on the right.
  box(2.0, 0.45, 2.15, -2.75, 0.3, -1.6, SM.linen, g);
  box(2.2, 0.12, 2.3, -2.75, 0.1, -1.6, SM.timber, g);
  box(2.3, 1.1, 0.12, -2.75, 0.7, -2.72, SM.timber, g);
  box(0.5, 0.12, 0.35, -2.2, 0.6, -2.2, SM.linen, g); box(0.5, 0.12, 0.35, -3.3, 0.6, -2.2, SM.linen, g);
  box(1.0, 0.03, 1.4, -2.75, 0.525, -0.9, new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 1 }), g);
  box(2.2, 0.92, 1.0, 0.45, 0.46, 0.1, SM.dark, g);
  box(2.35, 0.06, 1.12, 0.45, 0.95, 0.1, SM.counter, g);
  box(2.6, 2.3, 0.6, 0.6, 1.15, -2.5, SM.dark, g);
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.22, 16), SM.lamp);
    p.position.set(-0.2 + i * 0.65, 2.2, 0.1); g.add(p);
    box(0.01, 0.55, 0.01, -0.2 + i * 0.65, 2.6, 0.1, SM.dark, g, { cast: false });
  }
  box(2.1, 0.42, 0.9, -0.9, 0.25, 2.0, SM.sofa, g); box(2.1, 0.45, 0.2, -0.9, 0.6, 1.62, SM.sofa, g);
  box(0.45, 2.95, 3.6, 2.45, 1.48, -1.0, SM.earth, g, { uv: 4 });
  // Tulips on the island, a small nod to the reference kitchen.
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.25, 12), SM.glass);
  vase.position.set(1.0, 1.1, 0.1); g.add(vase);
}
export function livingInterior(SM, g) {
  box(2.8, 0.42, 1.0, -5.0, 0.25, -1.4, SM.sofa, g); box(2.8, 0.45, 0.22, -5.0, 0.62, -1.85, SM.sofa, g);
  box(1.2, 0.35, 0.7, -5.0, 0.2, 0.0, SM.timber, g);
  box(2.6, 0.06, 1.0, 0.5, 0.76, -0.6, SM.timber, g);
  for (const [dx, dz] of [[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.4], [1.2, 0.4]]) box(0.06, 0.74, 0.06, 0.5 + dx, 0.37, -0.6 + dz, SM.dark, g);
  box(3.6, 0.92, 0.9, 4.6, 0.46, -2.9, SM.dark, g); box(3.7, 0.06, 0.95, 4.6, 0.95, -2.9, SM.counter, g);
  box(3.6, 2.2, 0.5, 4.6, 1.1, -3.25, SM.dark, g);
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.22, 16), SM.lamp);
    p.position.set(-0.4 + i * 0.9, 2.3, -0.6); g.add(p);
  }
}

/* The glamping cabin of the quarry row: 9 x 6.5 m of rammed earth, a glass front in four panels, a living-roof
   slab cantilevered 1.5 m over the glass with a steel edge, a 3 m deck with two lounge chairs, and a furnished
   inside. Front (glass) toward +z, floor at y = 0. */
export function quarryCabin(SM, lights = []) {
  const v = buildVolume(SM, {
    w: 8.1, d: 5.6, h: 3.0, overFront: 1.5, overBack: 0.4, overSide: 0.4, posts: false, fascia: true, deckD: 3.0, deckW: 9.0,
    front: [{ k: 'earth', w: 0.35 }, { k: 'glass', w: 8.3, n: 4 }, { k: 'earth', w: 0.35 }],
    lights: [[-2.5, -1.2], [0.5, 0.2], [3.2, -1.0]],
  }, lights);
  cabinInterior(SM, v);
  for (const cx of [-3.2, -1.0]) { box(0.7, 0.35, 1.6, cx, 0.5, 5.1, SM.timber, v); box(0.7, 0.5, 0.12, cx, 0.75, 4.35, SM.timber, v); }
  return v;
}
export const CABIN = { deckTop: 0.3, roofTop: 3.58, front: 3.25, deckEnd: 6.25 };    // for walking on it

/* One mesh per material, instead of dozens of boxes: a row of eight cabins stays cheap to draw. */
export function merge(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), byMat = new Map();
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(g);
  });
  const out = new THREE.Group();
  for (const [mat, gs] of byMat) {
    const m = new THREE.Mesh(mergeGeometries(gs), mat);
    m.castShadow = !mat.transparent; m.receiveShadow = true;
    out.add(m);
    gs.forEach((g) => g.dispose());
  }
  out.userData = { ...group.userData };
  return out;
}

/* The residence for the private side: two earth volumes, the living room and a bedroom wing set back and up
   the slope, living roofs, decks, and a 12 m pool on the valley side. Front toward +z, floor at y = 0. */
export function residence(SM, lights = []) {
  const g = new THREE.Group();
  const main = buildVolume(SM, {
    w: 15, d: 7, h: 3.0, overFront: 2.2, overSide: 1.2,
    front: [{ k: 'earth', w: 1.5 }, { k: 'glass', w: 10.0 }, { k: 'door', w: 1.4 }, { k: 'earth', w: 3.0 }],
    lights: [[-5, -1], [-1, 0], [3, -1]],
  }, lights);
  main.position.set(-4.2, 0, 0);
  livingInterior(SM, main);
  const wing = buildVolume(SM, {
    w: 9, d: 7, h: 3.3, overFront: 1.8, overSide: 0.8,
    front: [{ k: 'glass', w: 6.0 }, { k: 'slit', w: 3.9 }],
    lights: [[-1.5, 0], [2.5, -1]],
  }, lights);
  wing.position.set(8.75, 0, -2.5);
  g.add(main, wing);
  box(13, 0.3, 4.5, -4.2, 0.15, 9.2, SM.coping, g, { cast: false });          // the pool, in a stone surround
  box(12, 0.06, 3.5, -4.2, 0.31, 9.2, SM.pool, g, { cast: false }).receiveShadow = true;
  for (const cx of [-8, -6.4]) box(0.7, 0.35, 1.7, cx, 0.5, 5.2, SM.timber, g);
  return g;
}
/* Where you can walk on and around it, in its own frame (x across, z toward the front): solid rectangles,
   and surfaces you stand on with their height. */
export const RESIDENCE = {
  solid: [[-12.2, -4.0, 3.8, 4.0], [3.8, -6.5, 13.7, 1.5], [-10.2, 7.4, 1.8, 11.0]],          // living room, wing, the water
  floors: [[-12.5, 3.9, 4.1, 6.7, 0.3], [3.5, 1.4, 14.0, 3.8, 0.3], [-10.7, 6.9, 2.3, 11.5, 0.3]],   // decks and the pool surround
  roofs: [[-13.4, -4.6, 5.0, 6.2, 3.58], [3.0, -7.1, 14.5, 3.3, 3.88]],
  extent: [-15, -9, 16, 13],
};
