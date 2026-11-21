/* Walk the site: the quarry cabins, the lagoon and the forest edge as a place to walk through.
   The light on the ground was path-traced in Blender, trees and cabins included (render/build.py ... bake),
   and is laid over tiled photo textures here. The trees are pictures of the real tree models from eight
   sides (render/impostors.py). Grass, water, haze and the cabins are drawn live. Data: data/walk/
   (render/web_export.py). Loaded by index.html when the tab opens; it draws with the page's renderer
   and gives everything back in dispose(). */
import * as THREE from 'three';
import * as LOOK from './look.js';      // the sky, colour, sun, textures, trees, grass and effects, shared with Designs
import { Reflector } from 'three/addons/objects/Reflector.js';

export async function build(ctx) {
  const { renderer: R, $, clamp, small, reduced, windOf, GradeShader, disposeScene } = ctx;
  const ac = new AbortController(), sig = { signal: ac.signal };

  const B = 'data/walk/', barEl = $('wk-bar'), msg = $('wk-msg');
  const touch = matchMedia('(pointer: coarse)').matches;
  $('wk-hint').textContent = touch ? 'Left thumb to walk · drag to look around' : 'W A S D or arrow keys to walk · drag to look around · Shift to run';
  let got = 0;
  const tick = () => { got++; barEl.style.width = ((100 * got) / (6 + LOOK.LOOK_FILES)).toFixed(0) + '%'; };
  const step = (p) => p.then((v) => { tick(); return v; });
  const bin = (f) => step(fetch(B + f).then((r) => { if (!r.ok) throw new Error(f + ': ' + r.status); return r.json(); }).then((b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0)).buffer));   // float32, as base64
  const tl = new THREE.TextureLoader();
  const img = (f, srgb) => step(new Promise((res, rej) => tl.load(B + f, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => rej(new Error(f)))));
  const [L, hb, fb, tb, light, splat, farT] = await Promise.all([
    LOOK.loadLook(tick), bin('heights.json'), bin('far.json'), bin('trees.json'), img('light.jpg'), img('splat.png'), img('far.jpg', true)]);
  const W = L.W, { grass: tGrass, soil: tSoil, litter: tLitter, wall: tWall, plaster: tPlaster, planks: tPlanks } = L.tex;
  msg.textContent = 'Setting up the site';

  /* ---- the page's renderer, set by the page to AgX with +0.5 exposure, as in Blender */
  const stage = $('wk-stage');
  const aniso = Math.min(8, R.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(small ? 68 : 60, innerWidth / innerHeight, 0.08, 6000);
  cam.rotation.order = 'YXZ';
  for (const t of [light, splat]) { t.flipY = false; t.anisotropy = aniso; }       // north on the top row, like the data
  farT.anisotropy = aniso;

  const [x0, z0, x1, z1] = W.region, [nx, nz] = W.grid;
  const Hd = new Float32Array(hb), Hc = new Float32Array(fb);
  const hAt = (x, z) => {
    const fx = clamp(x - x0, 0, nx - 1.001), fz = clamp(z - z0, 0, nz - 1.001), i = fx | 0, j = fz | 0, tx = fx - i, tz = fz - j, k = j * nx + i;
    return (Hd[k] * (1 - tx) + Hd[k + 1] * tx) * (1 - tz) + (Hd[k + nx] * (1 - tx) + Hd[k + nx + 1] * tx) * tz;
  };
  const U = {
    ...LOOK.uniforms(L), uLK: { value: W.lightScale },
    uReg: { value: new THREE.Vector4(x0, z0, x1 - x0, z1 - z0) }, uGrid: { value: new THREE.Vector2(nx, nz) },
  };
  const sunDir = U.uSun.value, sunA = U.uSunA.value;
  const NOISE = LOOK.NOISE, SKY = LOOK.SKY, OUT = LOOK.OUT, mat = (o) => LOOK.material(U, o);

  /* ---- sky: the panorama Blender rendered from the site, in linear light */
  LOOK.addSky(scene, R, U, L);

  /* ---- ground: the baked light times photo textures, mixed as in Blender by the ground-type map */
  function gridGeo(H, gx, gz, ox, oz, s, dip) {
    const pos = new Float32Array(gx * gz * 3);
    for (let j = 0; j < gz; j++) for (let i = 0; i < gx; i++) {
      const k = j * gx + i, x = ox + i * s, z = oz + j * s;
      pos[k * 3] = x; pos[k * 3 + 1] = H[k] - (dip ? dip(x, z) : 0); pos[k * 3 + 2] = z;
    }
    const idx = new Uint32Array((gx - 1) * (gz - 1) * 6);
    let n = 0;
    for (let j = 0; j < gz - 1; j++) for (let i = 0; i < gx - 1; i++) {
      const a = j * gx + i, b = a + 1, c = a + gx, d = c + 1;
      idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    return g;
  }
  const VW = 'varying vec3 vW, vN; void main() { vW = position; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }';
  const ground = new THREE.Mesh(gridGeo(Hd, nx, nz, x0, z0, 1), mat({
    uniforms: { uSplat: { value: splat }, uLight: { value: light }, uTg: { value: tGrass }, uTs: { value: tSoil }, uTl: { value: tLitter }, uTw: { value: tWall } },
    vertexShader: VW,
    fragmentShader: `${NOISE} ${SKY}
      uniform sampler2D uSplat, uLight, uTg, uTs, uTl, uTw; uniform vec4 uReg; uniform vec2 uGrid; uniform float uLK; varying vec3 vW, vN;
      vec3 tile(sampler2D t, vec2 p) {                 // a second, turned and larger copy hides the repeat
        vec3 a = texture2D(t, p).rgb, b = texture2D(t, vec2(p.y, -p.x) * 0.43 + 0.17).rgb;
        return mix(a, b, smoothstep(0.3, 0.7, ohNoise(vec3(p * 0.23, 1.7))) * 0.55);
      }
      float brk(float w, float n, float k) { return clamp((clamp(w + n * k - k * 0.5, 0.0, 1.0) - 0.35) / 0.3, 0.0, 1.0); }
      void main() {
        vec3 n = normalize(vN);
        vec2 uv = (vW.xz - uReg.xy) / uReg.zw;
        vec3 sp = texture2D(uSplat, (vW.xz - uReg.xy + 0.5) / uGrid).rgb;
        float nz = ohNoise(vW * 0.35);
        float ws = brk(sp.g * 0.3, nz, 0.55), wl = brk(sp.b, nz, 0.4), st = clamp((n.y - 0.88) / (0.62 - 0.88), 0.0, 1.0);
        vec2 p = vec2(vW.x, -vW.z);
        vec3 g = tile(uTg, p / 2.4) * vec3(0.52, 0.88, 0.4), s = tile(uTs, p / 3.0), l = tile(uTl, p / 2.4) * vec3(1.0, 0.85, 0.62);    // leaf litter: browner, so the blue shade under the trees does not turn it teal
        vec3 b = pow(abs(n), vec3(4.0)); b /= b.x + b.y + b.z;
        vec3 w = (texture2D(uTw, vec2(-vW.z, vW.y) / 4.0).rgb * b.x + texture2D(uTw, p / 4.0).rgb * b.y + texture2D(uTw, vec2(vW.x, vW.y) / 4.0).rgb * b.z) * vec3(0.8, 0.6, 0.5);
        vec3 alb = mix(mix(mix(g, s, ws), l, wl), w, st);
        vec3 L = pow(texture2D(uLight, uv).rgb, vec3(2.2)) * uLK;
        gl_FragColor = vec4(haze(alb * L, vW), 1.0);
        ${OUT}
      }`,
  }));
  ground.frustumCulled = false; scene.add(ground);

  // The land beyond, from the 10 m model and the site photo, lit like the open ground in the bake.
  const [cx0, cz0, cx1, cz1] = W.far, [fx, fz] = W.farGrid;
  const far = new THREE.Mesh(gridGeo(Hc, fx, fz, cx0, cz0, (cx1 - cx0) / (fx - 1), (x, z) => (x > x0 && x < x1 && z > z0 && z < z1 ? 3 : x >= x0 && x <= x1 && z >= z0 && z <= z1 ? 0.15 : 0)), mat({
    uniforms: { uFar: { value: farT }, uFreg: { value: new THREE.Vector4(cx0, cz0, cx1 - cx0, cz1 - cz0) } },
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 4,
    vertexShader: VW,
    fragmentShader: `${SKY} uniform sampler2D uFar; uniform vec4 uFreg; uniform vec3 uSun, uSunA, uAmb; varying vec3 vW, vN;
      void main() {
        vec3 alb = texture2D(uFar, vec2((vW.x - uFreg.x) / uFreg.z, 1.0 - (vW.z - uFreg.y) / uFreg.w)).rgb;
        vec3 col = alb * vec3(1.05, 0.97, 0.78) * (uSunA * max(dot(normalize(vN), uSun), 0.0) + uAmb);
        gl_FragColor = vec4(haze(col, vW), 1.0);
        ${OUT}
      }`,
  }));
  far.frustumCulled = false; scene.add(far);

  /* ---- trees: each one a card that turns to face you, showing the model from the nearest of eight sides */
  const trees = LOOK.treeCards(U, L, new Float32Array(tb), !small);
  scene.add(trees);

  /* ---- grass: blades in a patch that travels with you, bending in the wind and away from your feet */
  const GR = small ? 13 : 20, GN = small ? 26000 : 80000;
  const grass = LOOK.grass(U, L, { heights: Hd, grid: [nx, nz], origin: [x0, z0], step: 1, mask: splat, light, radius: GR, count: GN });
  const bgeo = grass.geometry, hTex = grass.userData.heights;
  scene.add(grass);
  grass.layers.set(1); cam.layers.enable(1);               // left out of the lagoon's mirror, which renders only layer 0

  /* ---- the lagoon: on bigger screens it mirrors the cabins and trees; on phones, the sky */
  const [lx, lz, lwl, lrot, lw, ld] = W.lagoon, lb = (lrot * Math.PI) / 180, lf = [Math.sin(lb), -Math.cos(lb)];
  const wgeo = new THREE.CircleGeometry(1, 128); wgeo.scale(lw / 2, ld / 2, 1);
  const waterFrag = (refl) => `${refl ? '#define REFL' : ''}
    ${NOISE} ${SKY}
    uniform sampler2D tDiffuse; uniform vec3 color; uniform float uTime; uniform vec3 uSun, uSunA, uDeep; varying vec4 vUv; varying vec3 vW;
    float wv(vec2 p) { return ohNoise(vec3(p, uTime * 0.35)) * 0.6 + ohNoise(vec3(p * 2.7 + 3.1, uTime * 0.6)) * 0.4; }
    void main() {
      vec2 p = vW.xz * 1.3; float h0 = wv(p);
      vec2 g = vec2(wv(p + vec2(0.05, 0.0)) - h0, wv(p + vec2(0.0, 0.05)) - h0) / 0.05;
      vec3 n = normalize(vec3(-g.x * 0.025, 1.0, -g.y * 0.025)), V = normalize(cameraPosition - vW), rd = reflect(-V, n);
      float fr = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
      #ifdef REFL
      vec4 uv = vUv; uv.xy += n.xz * uv.w * 0.25;
      vec3 rc = texture2DProj(tDiffuse, uv).rgb;
      #else
      vec3 rc = skyAt(vec3(rd.x, abs(rd.y), rd.z)) * mix(0.25, 1.0, smoothstep(0.03, 0.3, rd.y));   // low in the mirror: the dark shore and trees
      #endif
      vec3 col = mix(uDeep, rc, fr) + uSunA * pow(max(dot(rd, uSun), 0.0), 500.0) * 12.0;
      gl_FragColor = vec4(haze(col, vW), 1.0);
      ${OUT}
    }`;
  const waterVert = 'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main() { vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  const wU = { uDeep: { value: new THREE.Vector3(0.008, 0.02, 0.018) } };
  let water, reflector = null;
  if (!small) {
    const pr = R.getPixelRatio() * 0.5;
    reflector = new Reflector(wgeo, { textureWidth: innerWidth * pr, textureHeight: innerHeight * pr, clipBias: 0.003, multisample: 0,
      shader: { name: 'lagoon', uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } }, vertexShader: waterVert, fragmentShader: waterFrag(true) } });
    Object.assign(reflector.material.uniforms, U, wU);
    water = reflector;
  } else {
    water = new THREE.Mesh(wgeo, mat({ uniforms: { ...wU, tDiffuse: { value: null }, color: { value: new THREE.Color() }, textureMatrix: { value: new THREE.Matrix4() } }, vertexShader: waterVert, fragmentShader: waterFrag(false) }));
  }
  water.rotation.order = 'YXZ'; water.rotation.set(-Math.PI / 2, -lb, 0); water.position.set(lx, lwl - 0.02, lz);
  scene.add(water);

  /* ---- the cabins: rammed earth set into the quarry wall, glass, steel, a deck and a living roof */
  const Hh = 3.0;
  const boxGeo = (sx, sy, sz, tile) => {
    const g = new THREE.BoxGeometry(sx, sy, sz), uv = g.attributes.uv, dims = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
    return g;
  };
  const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b);
  const mEarth = new THREE.MeshStandardMaterial({ map: tPlaster, roughness: 0.95 });
  const mDeck = new THREE.MeshStandardMaterial({ map: tPlanks, roughness: 0.8 });
  const mSteel = new THREE.MeshStandardMaterial({ color: lin(0.03, 0.03, 0.032), metalness: 0.8, roughness: 0.35 });
  const mSlab = new THREE.MeshStandardMaterial({ color: lin(0.12, 0.11, 0.1), roughness: 0.8 });
  const mRoof = new THREE.MeshStandardMaterial({ map: tGrass, color: lin(0.52, 0.88, 0.4), roughness: 0.95 });
  // Behind each glass front, a lit room drawn by ray-casting a box in the shader ("interior mapping").
  const mRoom = mat({
    uniforms: { uPlaster: { value: tPlaster }, uPlanks: { value: tPlanks } },
    vertexShader: `attribute vec3 aRoom; varying vec3 vP, vC, vRoom, vW, vNw;
      void main() {
        vP = position; vRoom = aRoom; vC = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vNw = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `${SKY} uniform sampler2D uPlaster, uPlanks; varying vec3 vP, vC, vRoom, vW, vNw;
      void main() {
        vec3 r = normalize(vP - vC);
        vec3 lo = vec3(-vRoom.x - 0.25, -vRoom.y - 0.2, -vRoom.z), hi = vec3(vRoom.x + 0.25, vRoom.y + 0.25, 0.5);
        vec3 tf = max((lo - vP) / r, (hi - vP) / r);
        float t = min(min(tf.x, tf.y), tf.z);
        vec3 h = vP + r * t, alb, nr;
        if (t == tf.y && r.y < 0.0) { alb = texture2D(uPlanks, h.xz * 0.5).rgb; nr = vec3(0.0, 1.0, 0.0); }
        else if (t == tf.y) { alb = vec3(0.55, 0.5, 0.45); nr = vec3(0.0, -1.0, 0.0); }
        else if (t == tf.x) { alb = texture2D(uPlaster, h.zy * 0.5).rgb; nr = vec3(-sign(r.x), 0.0, 0.0); }
        else { alb = texture2D(uPlaster, h.xy * 0.5).rgb; nr = vec3(0.0, 0.0, 1.0); }
        vec3 lp = vec3(0.0, vRoom.y - 0.15, -vRoom.z * 0.55), ld = lp - h; float dl = length(ld);
        vec3 col = alb * (vec3(1.0, 0.72, 0.45) * 4.0 * max(dot(nr, ld / dl), 0.0) / (0.5 + dl * dl * 0.3) + vec3(0.22, 0.2, 0.19));
        col += vec3(1.0, 0.75, 0.5) * 3.0 * smoothstep(0.18, 0.05, length((h - lp).xz)) * step(vRoom.y + 0.2, h.y);   // the lamp
        vec3 V = normalize(cameraPosition - vW);
        float fr = 0.04 + 0.96 * pow(1.0 - max(dot(vNw, V), 0.0), 5.0);
        gl_FragColor = vec4(haze(mix(col, skyAt(reflect(-V, vNw)), fr), vW), 1.0);
        ${OUT}
      }`,
  });
  const cab = new THREE.Group(); scene.add(cab);
  const cabins = W.cabins.map(([cx, cz, fl, rot, w, d]) => {
    const th = (rot * Math.PI) / 180, F = [Math.sin(th), -Math.cos(th)], Rv = [Math.cos(th), Math.sin(th)];
    const at = (u, v, y) => new THREE.Vector3(cx + Rv[0] * u + F[0] * v, fl + y, cz + Rv[1] * u + F[1] * v);
    const box = (sx, sd, sh, u, v, y, m, tile = 2) => {
      const o = new THREE.Mesh(boxGeo(sx, sh, sd, tile), m); o.position.copy(at(u, v, y)); o.rotation.y = -th; o.castShadow = o.receiveShadow = true; cab.add(o); return o;
    };
    box(w, d - 0.3, Hh + 1.2, 0, -0.15, (Hh - 1.2) / 2, mEarth);
    const gw = w - 0.7, gh = Hh - 0.45, wg = new THREE.PlaneGeometry(gw, gh), n = wg.attributes.position.count;
    wg.setAttribute('aRoom', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [gw / 2, gh / 2, d - 1.0][i % 3]), 3));
    const win = new THREE.Mesh(wg, mRoom); win.position.copy(at(0, d / 2 - 0.25 + 0.016, gh / 2 + 0.2)); win.rotation.y = -th + Math.PI; cab.add(win);
    for (let k = 0; k < 5; k++) box(0.08, 0.12, Hh - 0.4, -gw / 2 + (k * gw) / 4, d / 2 - 0.25, (Hh - 0.4) / 2 + 0.18, mSteel);
    box(w - 0.6, 0.12, 0.1, 0, d / 2 - 0.25, Hh - 0.22, mSteel);
    box(w + 0.8, d + 1.6, 0.3, 0, 0.4, Hh + 0.15, mSlab);
    box(w + 0.84, 0.06, 0.34, 0, d / 2 + 1.22, Hh + 0.15, mSteel);
    box(w, 3.0, 0.16, 0, d / 2 + 1.5, 0.08, mDeck);
    const rg = new THREE.PlaneGeometry(w - 0.8, d - 0.2); rg.rotateX(-Math.PI / 2);
    const uv = rg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * (w - 0.8)) / 2.4, (uv.getY(i) * (d - 0.2)) / 2.4);
    const roof = new THREE.Mesh(rg, mRoof); roof.position.copy(at(0, 0.4, Hh + 0.31)); roof.rotation.y = -th; roof.receiveShadow = true; cab.add(roof);
    return { cx, cz, fl, w, d, F, R: Rv };
  });
  const sunL = LOOK.sunLight(U);
  const cc = new THREE.Vector3(); cabins.forEach((c) => cc.add(new THREE.Vector3(c.cx, c.fl, c.cz))); cc.divideScalar(Math.max(1, cabins.length));
  const spread = Math.max(20, ...cabins.map((c) => Math.hypot(c.cx - cc.x, c.cz - cc.z) + c.w));
  sunL.position.copy(cc).addScaledVector(sunDir, 200); sunL.target.position.copy(cc);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.03;
  Object.assign(sunL.shadow.camera, { left: -spread, right: spread, top: spread, bottom: -spread, near: 100, far: 300 });
  scene.add(sunL, sunL.target);
  R.shadowMap.needsUpdate = true;          // the cabins do not move: their shadows are drawn once (the page turns off autoUpdate)

  /* ---- post: a little glow, then the same film grade as the rest of the site */
  const comp = LOOK.composer(R, scene, cam, GradeShader, small);

  /* ---- you: where you stand, where you look, and what stops you */
  const cabinAt = (x, z, c) => { const dx = x - c.cx, dz = z - c.cz; return [dx * c.R[0] + dz * c.R[1], dx * c.F[0] + dz * c.F[1]]; };
  function feetAt(x, z, from) {                       // where your feet would be at (x, z); null if you cannot stand there
    if (x < x0 + 3 || x > x1 - 3 || z < z0 + 3 || z > z1 - 3) return null;
    const ux = x - lx, uz = z - lz, u = ux * lf[0] + uz * lf[1], v = -ux * lf[1] + uz * lf[0];
    if ((u / (ld / 2)) ** 2 + (v / (lw / 2)) ** 2 < 1.03) return null;
    let y = hAt(x, z);
    for (const c of cabins) {
      const [cu, cv] = cabinAt(x, z, c);
      if (Math.abs(cu) < c.w / 2 + 0.35 && cv > -c.d / 2 - 0.35 && cv < c.d / 2 - 0.2) { if (from > c.fl + Hh) y = Math.max(y, c.fl + Hh + 0.31); else return null; }
      else if (Math.abs(cu) < c.w / 2 && cv >= c.d / 2 - 0.2 && cv < c.d / 2 + 3) y = Math.max(y, c.fl + 0.16);
    }
    return y;
  }
  const P = { x: 0, z: 0, feet: 0, feetT: 0, yaw: 0, pitch: 0, phase: 0 };
  const lookAt = (x, z, tx, tz, pitch = -0.04) => { P.yaw = Math.atan2(-(tx - x), -(tz - z)); P.pitch = pitch; };
  const deckSpot = () => {
    const c = cabins[Math.min(3, cabins.length - 1)], off = c.d / 2 + 2.2;
    return { x: c.cx + c.F[0] * off, z: c.cz + c.F[1] * off };
  };
  const SPOTS = [
    { name: 'Arrival', at: () => ({ x: 392, z: 834 }), look: [350, 892] },
    { name: 'Lagoon shore', at: () => ({ x: 384.2, z: 860.4 }), bearing: 280 },
    { name: 'Cabin deck', at: deckSpot, look: [lx, lz] },
  ];
  function goTo(s) {
    const p = s.at(), y = feetAt(p.x, p.z, 1e4) ?? hAt(p.x, p.z);
    Object.assign(P, { x: p.x, z: p.z, feet: y, feetT: y });
    if (s.look) lookAt(p.x, p.z, s.look[0], s.look[1]);
    else { P.yaw = (-s.bearing * Math.PI) / 180; P.pitch = -0.04; }
    spotsEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.textContent === s.name)));
  }
  const spotsEl = $('wk-spots');
  spotsEl.innerHTML = '';
  for (const s of SPOTS) { const b = document.createElement('button'); b.type = 'button'; b.textContent = s.name; b.addEventListener('click', () => goTo(s), sig); spotsEl.appendChild(b); }
  goTo(SPOTS[0]);
  function tryStep(x, z) {
    const y = feetAt(x, z, P.feet);
    if (y === null || y - P.feet > 0.3) return false;            // water, walls, or a step up of more than 30 cm
    const h = hAt(x, z), slope = Math.hypot(hAt(x + 0.5, z) - hAt(x - 0.5, z), hAt(x, z + 0.5) - hAt(x, z - 0.5));
    if (slope > 1.1 && y <= h + 0.01 && h > hAt(P.x, P.z)) return false;   // too steep to climb (about 48°)
    P.x = x; P.z = z; P.feetT = y; return true;
  }
  const move = (dx, dz) => tryStep(P.x + dx, P.z + dz) || tryStep(P.x + dx, P.z) || tryStep(P.x, P.z + dz);

  const keys = new Set(), KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
  addEventListener('keydown', (e) => { if (walkEl.hidden || e.target.closest?.('input, textarea')) return; if (KEYS.includes(e.code)) { keys.add(e.code); e.preventDefault(); } }, sig);
  addEventListener('keyup', (e) => keys.delete(e.code), sig);
  addEventListener('blur', () => keys.clear(), sig);
  const stickEl = $('wk-stick'), knob = stickEl.firstElementChild, stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 }, looks = new Map(), cv = stage;
  cv.addEventListener('pointerdown', (e) => {
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    if (e.pointerType !== 'mouse' && stick.id === null && e.clientX < innerWidth * 0.45) {
      Object.assign(stick, { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
      stickEl.hidden = false; stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; knob.style.transform = '';
    } else looks.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }, sig);
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerId === stick.id) {
      let dx = e.clientX - stick.ox, dy = e.clientY - stick.oy; const m = Math.hypot(dx, dy), lim = 48;
      if (m > lim) { dx *= lim / m; dy *= lim / m; }
      stick.x = dx / lim; stick.y = dy / lim; knob.style.transform = `translate(${dx}px, ${dy}px)`;
      return;
    }
    const p = looks.get(e.pointerId);
    if (!p) return;
    const k = ((cam.fov * Math.PI) / 180) / innerHeight;
    P.yaw += (e.clientX - p.x) * k; P.pitch = clamp(P.pitch + (e.clientY - p.y) * k, -1.2, 1.2);
    p.x = e.clientX; p.y = e.clientY;
  }, sig);
  const up = (e) => { if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; stickEl.hidden = true; } looks.delete(e.pointerId); };
  cv.addEventListener('pointerup', up, sig); cv.addEventListener('pointercancel', up, sig);

  /* ---- the loop */
  const clk = new THREE.Clock(), perf = { n: 0, sum: 0, at: performance.now() + 3000 };
  let t = 0;
  function size() {
    R.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    if (comp) { comp.setPixelRatio(R.getPixelRatio()); comp.setSize(innerWidth, innerHeight); }
    if (reflector) { const pr = R.getPixelRatio() * 0.5; reflector.getRenderTarget().setSize(innerWidth * pr, innerHeight * pr); }
  }
  addEventListener('resize', size, sig);
  function frame() {
    const dt = Math.min(clk.getDelta(), 0.05);
    t += dt; U.uTime.value = t;
    let f = 0, s = 0, turn = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
    if (keys.has('KeyA')) s -= 1;
    if (keys.has('KeyD')) s += 1;
    if (keys.has('ArrowLeft')) turn += 1;
    if (keys.has('ArrowRight')) turn -= 1;
    if (stick.id !== null) { f -= stick.y; s += stick.x; }
    P.yaw += turn * dt * 1.7;
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(stick.x, stick.y) > 0.95;
    const m = Math.hypot(f, s);
    if (m > 1) { f /= m; s /= m; }
    if (m > 0.05) {
      const sp = (run ? 5.5 : 2.4) * dt, sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      if (move((-sy * f + cy * s) * sp, (-cy * f - sy * s) * sp)) P.phase += Math.min(m, 1) * dt * (run ? 11 : 7.5);
    }
    P.feet += (P.feetT - P.feet) * Math.min(1, dt * 10);
    const bob = reduced ? 0 : Math.sin(P.phase) * 0.025;
    cam.position.set(P.x, P.feet + 1.65 + bob, P.z);
    cam.rotation.set(P.pitch, P.yaw, 0);
    grass.material.uniforms.uCam.value.copy(cam.position);
    grass.material.uniforms.uFeet.value.set(P.x, P.feet, P.z);
    $('wk-facing').textContent = 'Facing ' + windOf((((Math.atan2(-Math.sin(P.yaw), Math.cos(P.yaw)) * 180) / Math.PI) + 360) % 360);
    if (comp) { comp.grade.uniforms.uTime.value = t; comp.grade.uniforms.uRes.value.set(innerWidth, innerHeight); comp.render(); }
    else R.render(scene, cam);
    // Slow for a few seconds: fewer pixels, then fewer blades.
    const now = performance.now();
    if (now > perf.at) {
      perf.sum += dt; perf.n++;
      if (perf.n >= 90) {
        const avg = perf.sum / perf.n; perf.sum = perf.n = 0;
        if (avg > 0.034) {
          if (R.getPixelRatio() > 0.75) { R.setPixelRatio(Math.max(0.75, R.getPixelRatio() - 0.25)); size(); }
          else if (bgeo.instanceCount > GN / 4) bgeo.instanceCount = Math.floor(bgeo.instanceCount / 2);
        }
      }
    }
  }
  let raf = 0;
  const loop = () => { raf = requestAnimationFrame(loop); frame(); };
  size(); frame();
  $('wk-loading').hidden = true;
  raf = requestAnimationFrame(loop);
  return {
    P, goTo, SPOTS, frame,
    stop() { cancelAnimationFrame(raf); raf = 0; },        // for tests: frames by hand
    dispose() {                                            // everything this view put on the GPU, and its listeners
      cancelAnimationFrame(raf); ac.abort();
      if (comp) { comp.passes.forEach((p) => p.dispose && p.dispose()); comp.dispose(); }
      if (reflector) reflector.dispose();
      sunL.shadow.dispose(); hTex.dispose(); disposeScene(scene);
    },
  };
}
