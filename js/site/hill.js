/* The hill: real terrain, imagery, trees and context; the homestead and other structures; property limits
   as drawn on the map; building the model; the base maps.
   One of the page's scripts in js/site/: they run in order and share one scope (see index.html). */
'use strict';

/* ================================================================ */
/*        THE HILL: real terrain, imagery, trees and context        */
/* ================================================================ */
// WGS84 / UTM zone 21 south (EPSG:32721), Snyder's series (USGS PP 1395).
const UTM = (() => {
  const a = 6378137, f = 1 / 298.257223563, e2 = f * (2 - f), ep2 = e2 / (1 - e2), k0 = 0.9996;
  const lon0 = (-57 * Math.PI) / 180, FE = 500000, FN = 10000000;
  const e4 = e2 * e2, e6 = e4 * e2;
  const M = (p) => a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p) - (35 * e6 / 3072) * Math.sin(6 * p));
  function fwd(lat, lon) {
    const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
    const s = Math.sin(p), c = Math.cos(p), t = Math.tan(p);
    const N = a / Math.sqrt(1 - e2 * s * s), T = t * t, C = ep2 * c * c, A = c * (l - lon0);
    const x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120);
    const y = k0 * (M(p) + N * t * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
    return [x + FE, y + FN];
  }
  function inv(E, Nn) {
    const x = E - FE, mu = (Nn - FN) / k0 / (a * (1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
      + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
    const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1);
    const C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = a * (1 - e2) / Math.pow(1 - e2 * s * s, 1.5), D = x / (N1 * k0);
    const lat = p1 - (N1 * t / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
    const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / c;
    return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
  }
  return { fwd, inv };
})();

const hill = { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 1, 40000), vs: 1, on: { trees: true, buildings: true, roads: true, contours: false, grid: false }, curtains: [] };
let META, HG, HRES, HHALF, HBASE, HE, CTX, OFFICIAL = [];
/* The mesh is finer than the 10 m data: heights in between come from a smooth (Catmull-Rom) fit. */
let HF, HFN, HFRES, HLO, HHI;
function refineTerrain() {
  HFN = small ? 601 : 801; HFRES = (2 * HHALF) / (HFN - 1);
  HF = new Float32Array(HFN * HFN);
  const taps = new Int32Array(HFN * 4), wts = new Float32Array(HFN * 4);
  for (let i = 0; i < HFN; i++) {
    const g = (i * HFRES) / HRES, i0 = Math.min(g | 0, HG - 2), t = g - i0;
    const w = [((-t + 2) * t - 1) * t / 2, ((3 * t - 5) * t * t + 2) / 2, ((-3 * t + 4) * t + 1) * t / 2, (t - 1) * t * t / 2];
    for (let k = 0; k < 4; k++) { taps[i * 4 + k] = clamp(i0 - 1 + k, 0, HG - 1); wts[i * 4 + k] = w[k]; }
  }
  HLO = Infinity; HHI = -Infinity;
  for (let r = 0; r < HFN; r++) for (let c = 0; c < HFN; c++) {
    let h = 0;
    for (let a = 0; a < 4; a++) {
      const row = taps[r * 4 + a] * HG, wr = wts[r * 4 + a];
      for (let b = 0; b < 4; b++) h += wr * wts[c * 4 + b] * HE[row + taps[c * 4 + b]];
    }
    HF[r * HFN + c] = h; if (h < HLO) HLO = h; if (h > HHI) HHI = h;
  }
}
function groundAt(x, z) {
  const gx = clamp((x + HHALF) / HFRES, 0, HFN - 1.001), gz = clamp((z + HHALF) / HFRES, 0, HFN - 1.001);
  const x0 = gx | 0, z0 = gz | 0, fx = gx - x0, fz = gz - z0, i = z0 * HFN + x0;
  const h = HF[i] * (1 - fx) * (1 - fz) + HF[i + 1] * fx * (1 - fz) + HF[i + HFN] * (1 - fx) * fz + HF[i + HFN + 1] * fx * fz;
  return CUTS.length ? h - cutAt(x, z) : h;
}
/* Ground slope in degrees at true scale, from the fine grid. */
function slopeAt(x, z) {
  const d = HFRES, gx = (groundAt(x + d, z) - groundAt(x - d, z)) / (2 * d), gz = (groundAt(x, z + d) - groundAt(x, z - d)) / (2 * d);
  return (Math.atan(Math.hypot(gx, gz)) * 180) / Math.PI;
}
const yAt = (x, z) => (groundAt(x, z) - HBASE) * hill.vs;
const toUTM = (x, z) => [META.origin.easting + x, META.origin.northing - z];
const fromUTM = (E, N) => [E - META.origin.easting, META.origin.northing - N];
const inSquare = (x, z) => Math.abs(x) <= HHALF && Math.abs(z) <= HHALF;

function b64bytes(s) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
async function getJSON(name) { const r = await fetch(name); if (!r.ok) throw new Error(name + ' ' + r.status); return r.json(); }
function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(src)); im.src = src; }); }

let imgPx = null, imgW = 0;
function imageryColor(x, z, out) {
  for (const p of SITES) {
    if (x < p.x0 || x >= p.x1 || z < p.z0 || z >= p.z1) continue;
    const u = Math.floor(((x - p.x0) / (p.x1 - p.x0)) * p.w), v = Math.floor(((z - p.z0) / (p.z1 - p.z0)) * p.h);
    let r = 0, g = 0, b = 0, n = 0;
    for (let dv = -4; dv <= 4; dv += 4) for (let du = -4; du <= 4; du += 4) {   // about 2 m across, like the base imagery
      const k = (clamp(v + dv, 0, p.h - 1) * p.w + clamp(u + du, 0, p.w - 1)) * 4;
      if (p.px[k + 3] > 230) { r += p.px[k]; g += p.px[k + 1]; b += p.px[k + 2]; n++; }
    }
    if (n === 9) return out.setRGB(r / n / 255, g / n / 255, b / n / 255, THREE.SRGBColorSpace);
  }
  const u = clamp(Math.floor(((x + HHALF) / (2 * HHALF)) * imgW), 0, imgW - 1), v = clamp(Math.floor(((z + HHALF) / (2 * HHALF)) * imgW), 0, imgW - 1);
  const k = (v * imgW + u) * 4;
  return out.setRGB(imgPx[k] / 255, imgPx[k + 1] / 255, imgPx[k + 2] / 255, THREE.SRGBColorSpace);
}

/* Terrain: one vertex per 5 m (6.7 m on phones), heights in metres above sea level. */
function terrainGeometry() {
  const n = HFN, pos = new Float32Array(n * n * 3), uv = new Float32Array(n * n * 2);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c;
    pos[i * 3] = -HHALF + c * HFRES; pos[i * 3 + 2] = -HHALF + r * HFRES;
    uv[i * 2] = c / (n - 1); uv[i * 2 + 1] = 1 - r / (n - 1);
  }
  const idx = new Uint32Array((n - 1) * (n - 1) * 6);
  let k = 0;
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
    const a = r * n + c, b = a + 1, d = a + n, e = d + 1;
    idx[k++] = a; idx[k++] = d; idx[k++] = b; idx[k++] = b; idx[k++] = d; idx[k++] = e;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
function setTerrainY(g) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, (HF[i] - HBASE) * hill.vs);
  p.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere();
}
const BLANK = new THREE.DataTexture(new Uint8Array(4), 1, 1); BLANK.needsUpdate = true;
/* Ground up close, where even the sharpest photo turns soft. One seamless tile, 6 m across:
   red = grass tufts and blades, green = red earth with pebbles and cracks, blue = leaf litter,
   alpha = soft patches for the middle distance. The shader picks a channel by the photo's colour. */
function detailTexture() {
  const n = 512, N = n * n, R = rng(31);
  const field = (p) => {
    const L = Float32Array.from({ length: p * p }, () => R()), out = new Float32Array(N), s = p / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const fx = x * s, fy = y * s, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, u = tx * tx * (3 - 2 * tx), v = ty * ty * (3 - 2 * ty);
      const a = L[(iy % p) * p + (ix % p)], b = L[(iy % p) * p + ((ix + 1) % p)], c = L[((iy + 1) % p) * p + (ix % p)], d = L[((iy + 1) % p) * p + ((ix + 1) % p)];
      const top = a + (b - a) * u;
      out[y * n + x] = top + (c + (d - c) * u - top) * v;
    }
    return out;
  };
  const fbm = (ps, ws) => { const out = new Float32Array(N); ps.forEach((p, k) => { const f = field(p); for (let i = 0; i < N; i++) out[i] += f[i] * ws[k]; }); return out; };
  const at = (x, y) => ((((y | 0) % n) + n) % n) * n + ((((x | 0) % n) + n) % n);
  const norm = (a) => {                       // mean 0.5, two standard deviations either side fill the range
    let m = 0, q = 0; for (let i = 0; i < N; i++) m += a[i]; m /= N;
    for (let i = 0; i < N; i++) q += (a[i] - m) ** 2; q = Math.sqrt(q / N) || 1;
    for (let i = 0; i < N; i++) a[i] = clamp(0.5 + (a[i] - m) / (q * 4), 0, 1);
    return a;
  };
  const disc = (a, cx, cy, r, f) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y) / r; if (d <= 1) { const k = at(cx + x, cy + y); a[k] = f(a[k], d); } } };
  const grass = fbm([8, 32], [0.4, 0.25]);
  for (let i = 0; i < 2600; i++) disc(grass, R() * n, R() * n, (6 + R() * 14) | 0, (v, d) => v + (1 - d * d) * 0.35);
  for (let i = 0; i < 60000; i++) {
    let x = R() * n, y = R() * n;
    const a = R() * 6.283, L = 3 + R() * 7, dx = Math.cos(a), dy = Math.sin(a), b = R() < 0.3 ? -0.18 : 0.1 + R() * 0.12;
    for (let k = 0; k < L; k++) { grass[at(x, y)] += b * (0.4 + (0.6 * k) / L); x += dx; y += dy; }
  }
  const soil = fbm([4, 16, 64], [0.35, 0.25, 0.15]);
  for (let i = 0; i < N; i++) soil[i] += (R() - 0.5) * 0.04;
  for (let i = 0; i < 1800; i++) { const b = R() < 0.6 ? 0.25 : -0.2; disc(soil, R() * n, R() * n, (1 + R() * 5) | 0, (v, d) => v + b * (1 - d) - (d > 0.8 ? 0.08 : 0)); }
  for (let i = 0; i < 70; i++) {
    let x = R() * n, y = R() * n, a = R() * 6.283;
    const L = 30 + R() * 90;
    for (let k = 0; k < L; k++) { soil[at(x, y)] -= 0.22; a += (R() - 0.5) * 0.7; x += Math.cos(a); y += Math.sin(a); }
  }
  const litter = fbm([8, 32], [0.3, 0.2]);
  for (let i = 0; i < 9000; i++) {
    const cx = R() * n, cy = R() * n, a = R() * 3.14, len = 3 + R() * 6, wid = 1.5 + R() * 2.5, b = (R() - 0.5) * 0.6, ca = Math.cos(a), sa = Math.sin(a);
    for (let y = -len; y <= len; y++) for (let x = -len; x <= len; x++) {
      const u = (x * ca + y * sa) / len, v = (-x * sa + y * ca) / wid;
      if (u * u + v * v <= 1) litter[at(cx + x, cy + y)] = 0.5 + b + (1 - u * u - v * v) * 0.1;
    }
  }
  for (let i = 0; i < 160; i++) {
    let x = R() * n, y = R() * n;
    const a = R() * 6.283, L = 10 + R() * 40;
    for (let k = 0; k < L; k++) { litter[at(x, y)] -= 0.3; x += Math.cos(a); y += Math.sin(a); }
  }
  const macro = fbm([2, 4, 8], [0.5, 0.3, 0.2]);
  [grass, soil, litter, macro].forEach(norm);
  const data = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) { data[i * 4] = grass[i] * 255; data[i * 4 + 1] = soil[i] * 255; data[i * 4 + 2] = litter[i] * 255; data[i * 4 + 3] = macro[i] * 255; }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = ANISO; t.needsUpdate = true;
  return t;
}
/* Contour lines drawn in the terrain shader: thin every 10 m, stronger every 50 m. The annotation
   canvas (boundaries, grid) is laid on top unlit, like a sheet of tracing paper. */
function contourMaterial(map, ov, shared = null) {
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
  if (shared) mat.userData.u = { ...shared.userData.u, uUseHole: { value: 0 } };   // same textures and settings, but it fills the holes
  else mat.userData.u = { uVS: { value: 1 }, uBase: { value: HBASE }, uOn: { value: 0 }, uLine: { value: new THREE.Color(1, 0.93, 0.72) }, uLineK: { value: 0.8 }, uOv: { value: ov }, uPatchOn: { value: 0 }, uPhoto: { value: 1 }, uDetail: { value: detailTexture() }, uHole: { value: BLANK }, uHoleR: { value: new THREE.Vector4(-1, -1, -1, -1) }, uUseHole: { value: 1 } };
  if (!shared) { const hole = holeMask(); if (hole) { mat.userData.u.uHole.value = hole.tex; mat.userData.u.uHoleR.value = hole.rect; } }
  // Site photos: sharper images of parts of the site, each laid over its own rectangle of the map.
  let patchDecl = '', patchCode = '';
  SITES.forEach((p, i) => {
    const U = (x) => (x + HHALF) / (2 * HHALF), V = (z) => 1 - (z + HHALF) / (2 * HHALF);
    mat.userData.u['uP' + i] = mat.userData.u['uP' + i] || { value: BLANK };          // kept when shared, so both materials get the photo
    mat.userData.u['uPR' + i] = mat.userData.u['uPR' + i] || { value: new THREE.Vector4(U(p.x0), V(p.z1), U(p.x1), V(p.z0)) };
    patchDecl += ` uniform sampler2D uP${i}; uniform vec4 uPR${i};`;
    patchCode += `{ vec2 pu = (vMapUv - uPR${i}.xy) / (uPR${i}.zw - uPR${i}.xy); vec4 pc = texture2D(uP${i}, clamp(pu, 0.0, 1.0));
      float pa = pc.a * uPatchOn * step(0.0, pu.x) * step(pu.x, 1.0) * step(0.0, pu.y) * step(pu.y, 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, pc.rgb, pa); }\n`;
  });
  if (HILL_SKY.tex && HILL_SKY.W && !mat.userData.u.uSky) Object.assign(mat.userData.u, { uSky: { value: HILL_SKY.tex }, uSkyK: { value: HILL_SKY.W.skyScale * SKY_GAIN }, uHaze: { value: 0 }, uDim: { value: new THREE.Vector3(1, 1, 1) } });
  if (mat.userData.u.uSky) mat.defines = { OH_SKY: 1 };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mat.userData.u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vElev; varying vec3 vOhW; uniform float uVS; uniform float uBase;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvElev = position.y / uVS + uBase;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvOhW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOhW;\n' + (mat.userData.u.uSky ? LOOK.SKY : '') + '\nvarying float vElev; uniform float uOn; uniform vec3 uLine; uniform float uLineK; uniform sampler2D uOv; uniform float uPatchOn; uniform float uPhoto; uniform sampler2D uDetail; uniform sampler2D uHole; uniform vec4 uHoleR; uniform float uUseHole;' + patchDecl + GLSL_NOISE)
      .replace('#include <tonemapping_fragment>', 'vec4 ov = texture2D(uOv, vMapUv);\ngl_FragColor.rgb = gl_FragColor.rgb * (1.0 - ov.a) + ov.rgb;\n#include <tonemapping_fragment>')
      // The outer 9% of the 4 km model melts into the haze, through the same tone mapping as the sky behind it,
      // so no view shows the model's straight edge against the sky (CLAUDE.md).
      .replace('#include <fog_fragment>', `#include <fog_fragment>
        #ifdef USE_FOG
        { vec2 eu = abs(vMapUv - 0.5) * 2.0; float ef = smoothstep(0.82, 0.99, max(eu.x, eu.y));
          #ifdef OH_SKY
          vec3 ed = vOhW - cameraPosition; vec4 ec = vec4(skyAt(vec3(ed.x, length(ed.xz) * 0.012, ed.z)), 1.0);
          #else
          vec4 ec = vec4(fogColor, 1.0);
          #endif
          #if defined( TONE_MAPPING )
          ec.rgb = toneMapping(ec.rgb);
          #endif
          ec = linearToOutputTexel(ec); gl_FragColor.rgb = mix(gl_FragColor.rgb, ec.rgb, ef); }
        #endif`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (ohK > 0.0) normal = ohBump(-vViewPosition, normal, ohDH * 1.1 * ohK, faceDirection);`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { vec2 hu = (vMapUv - uHoleR.xy) / (uHoleR.zw - uHoleR.xy); float hm = texture2D(uHole, clamp(hu, 0.0, 1.0)).r;
          if (uUseHole > 0.5 && hu.x > 0.0 && hu.x < 1.0 && hu.y > 0.0 && hu.y < 1.0 && hm > 0.5) discard; }
        ${patchCode}
        float ohDist = length(vViewPosition), ohK = 1.0 - smoothstep(30.0, 320.0, ohDist); vec2 ohDH = vec2(0.0);
        {
          vec3 c = diffuseColor.rgb;
          if (uPhoto > 0.5) {                    // satellite colours: a little more contrast and colour than the hazy source
            float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
            c = mix(vec3(l), c, 1.08); c = clamp(c, 0.0, 1.0); c = c * c * (3.0 - 2.0 * c) * 0.15 + c * 0.85;
            diffuseColor.rgb = c;
          }
          vec2 wuv = vMapUv * ${(2 * HHALF / 6).toFixed(3)};
          vec4 d = mix(texture2D(uDetail, wuv), texture2D(uDetail, wuv * 0.31 + 0.27), 0.4 + 0.4 * smoothstep(40.0, 200.0, ohDist));
          float macro = texture2D(uDetail, vMapUv * ${(2 * HHALF / 90).toFixed(3)}).a;
          diffuseColor.rgb *= mix(1.0, 0.86 + 0.28 * macro, (1.0 - smoothstep(300.0, 2500.0, ohDist)) * 0.8);
          float det = mix(d.r, d.g, 0.5);
          ohDH = (vec2(dFdx(d.r), dFdy(d.r)) + vec2(dFdx(d.g), dFdy(d.g))) * 0.5;
          if (uPhoto > 0.5) {                    // grass where the photo is green, red earth where it is bare, leaf litter where it is dark
            float l = (c.r + c.g + c.b) / 3.0;
            float wg = clamp((c.g - max(c.r, c.b)) * 14.0 + 0.25, 0.0, 1.0), ws = clamp((c.r - c.g) * 9.0 + (l - 0.35) * 2.0, 0.0, 1.0);
            float wl = clamp((0.16 - l) * 9.0, 0.0, 1.0) * wg;
            wg *= 1.0 - wl;
            float sum = wg + ws + wl + 1e-3;
            det = (d.r * wg + d.g * ws + d.b * wl) / sum;
            // relief from the textures alone, so the edge between grass and earth doesn't read as a ridge
            ohDH = (vec2(dFdx(d.r), dFdy(d.r)) * wg + vec2(dFdx(d.g), dFdy(d.g)) * ws + vec2(dFdx(d.b), dFdy(d.b)) * wl) / sum;
            diffuseColor.rgb *= mix(vec3(1.0), vec3(1.06, 1.0, 0.92), (det - 0.5) * 2.0 * ohK * ws / sum);
          }
          diffuseColor.rgb *= uPhoto > 0.5 ? mix(1.0, 0.72 + 0.56 * det, ohK) : mix(1.0, 0.5 + det, ohK * 0.5);
        }
        if (uOn > 0.5) {
          float w = max(fwidth(vElev), 1e-4);
          float d10 = abs(fract(vElev / 10.0 + 0.5) - 0.5) * 10.0 / w;
          float d50 = abs(fract(vElev / 50.0 + 0.5) - 0.5) * 50.0 / w;
          float l = max(1.0 - smoothstep(0.4, 1.3, d10), (1.0 - smoothstep(0.8, 2.2, d50)) * 1.0);
          l *= smoothstep(0.975, 0.995, diffuseColor.a); // maps knock lines out under their labels
          diffuseColor.rgb = mix(diffuseColor.rgb, uLine, l * uLineK);
        }
        diffuseColor.a = 1.0;`);
  };
  return mat;
}
/* Skirts make the 4 km square read as a model block instead of a floating sheet. */
function skirtGeometry() {
  const n = HFN, pos = [], idx = [];
  const bottom = (HLO - HBASE) * hill.vs - 60;
  const edges = [
    (i) => i, (i) => i * n + (n - 1), (i) => (n - 1) * n + (n - 1 - i), (i) => (n - 1 - i) * n,
  ];
  for (const e of edges) {
    const base = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const v = e(i), r = Math.floor(v / n), c = v % n;
      const x = -HHALF + c * HFRES, z = -HHALF + r * HFRES, y = (HF[v] - HBASE) * hill.vs;
      pos.push(x, y, z, x, bottom, z);
    }
    for (let i = 0; i < n - 1; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* A round crown with lumps that depend only on position (so shared corners stay joined), darker underneath. */
/* Trees: one per canopy top in the 1 m height model. Colour comes from the imagery under it. */
let treeData = null;
function treeGeometry() {
  // A lumpy, smooth-shaded crown that is darker underneath. The lumps depend only on position, so shared corners stay joined.
  const crown = new THREE.IcosahedronGeometry(1, small ? 0 : 1), p = crown.attributes.position, nrm = crown.attributes.normal;
  const col = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    nrm.setXYZ(i, v.x, v.y, v.z);
    const k = 0.89 + 0.22 * hash2(Math.round(v.x * 50) + Math.round(v.z * 50) * 7, Math.round(v.y * 50));
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
    const ao = 0.58 + 0.42 * smooth(-0.9, 0.8, v.y);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
  }
  crown.setAttribute('color', new THREE.BufferAttribute(col, 3)); crown.deleteAttribute('uv');
  crown.scale(1, 0.29, 1); crown.translate(0, 0.71, 0);
  const trunk = new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5, 1, true); trunk.translate(0, 0.25, 0);
  return mergeGeometries([crown, colorize(trunk, 0x7a6450)]);
}
function buildTrees() {
  const raw = treeData, n = small ? Math.min(raw.count, 32000) : raw.count;
  const mesh = new THREE.InstancedMesh(treeGeometry(), foliage(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), { wind: 0.06 }), n);
  const col = new THREE.Color(), leaf = new THREE.Color(), R = rng(3);
  for (let i = 0; i < n; i++) {
    imageryColor(raw.x[i], raw.z[i], col);
    // Where the 10 m pixel under a tree is roof or bare soil, keep the crown green.
    const l = (col.r + col.g + col.b) / 3, notGreen = col.g < Math.max(col.r, col.b) ? 0.6 : 0;
    leaf.setHSL(0.24 + R() * 0.06, 0.38 + R() * 0.15, 0.13 + R() * 0.08, THREE.SRGBColorSpace);
    col.lerp(leaf, clamp(Math.max((l - 0.07) / 0.12, notGreen), 0, 0.9)).multiplyScalar(0.95 + R() * 0.3);
    mesh.setColorAt(i, col);
  }
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.n = n;
  return mesh;
}
function placeTrees(mesh) {
  const raw = treeData, m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), R = rng(5);
  for (let i = 0; i < mesh.userData.n; i++) {
    const x = raw.x[i], z = raw.z[i], k = clearOfStructures(x, z) && Math.max(Math.abs(x), Math.abs(z)) < HHALF * 0.86 ? 1 : 0;   // none where the edge melts into the haze
    q.setFromAxisAngle(UP, R() * 6.283);
    mesh.setMatrixAt(i, m.compose(v.set(x, yAt(x, z), z), q, s.set(raw.r[i] * k, raw.h[i] * k, raw.r[i] * k)));
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/* Buildings: footprints extruded to their height, roofs coloured from the imagery. */
function buildBuildings() {
  const parts = [], wall = new THREE.Color(0xe6ded0), roof = new THREE.Color();
  for (const b of CTX.buildings) {
    const c = b.c, pts = [];
    let cx = 0, cz = 0, base = Infinity;
    for (let i = 0; i < c.length - 2; i += 2) { pts.push(new THREE.Vector2(c[i], -c[i + 1])); cx += c[i]; cz += c[i + 1]; base = Math.min(base, yAt(c[i], c[i + 1])); }
    if (pts.length < 3) continue;
    cx /= pts.length; cz /= pts.length;
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: Math.max(2.8, b.h), bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.translate(0, base - 0.4, 0);
    imageryColor(cx, cz, roof);
    const nrm = g.attributes.normal, cols = new Float32Array(nrm.count * 3);
    for (let i = 0; i < nrm.count; i++) { const k = nrm.getY(i) > 0.5 ? roof : wall; cols[i * 3] = k.r; cols[i * 3 + 1] = k.g; cols[i * 3 + 2] = k.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.deleteAttribute('uv');
    parts.push(g.index ? g.toNonIndexed() : g);
  }
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/* Roads: ribbons laid on the ground, width by class. */
const ROAD_W = { primary: 8, secondary: 7, tertiary: 6, residential: 5, unclassified: 4.5, service: 3.5, track: 3, unknown: 3.5 };
function buildRoads() {
  const pos = [], col = [], idx = [];
  const paved = new THREE.Color(0x6b6862), dirt = new THREE.Color(0xb3754c);
  for (const r of CTX.roads) {
    const c = r.c, pts = [];
    for (let i = 0; i < c.length - 2; i += 2) {
      const [x0, z0, x1, z1] = [c[i], c[i + 1], c[i + 2], c[i + 3]];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 6));
      for (let s = 0; s < n; s++) pts.push([lerp(x0, x1, s / n), lerp(z0, z1, s / n)]);
    }
    pts.push([c[c.length - 2], c[c.length - 1]]);
    if (pts.length < 2) continue;
    const w = (ROAD_W[r.k] || 4) / 2, k = r.k === 'primary' || r.k === 'secondary' ? paved : dirt, base = pos.length / 3;
    for (let i = 0; i < pts.length; i++) {
      const [ax, az] = pts[Math.max(0, i - 1)], [bx, bz] = pts[Math.min(pts.length - 1, i + 1)];
      let dx = bx - ax, dz = bz - az; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      const [x, z] = pts[i];
      for (const sgn of [-1, 1]) {
        const px = x - dz * w * sgn, pz = z + dx * w * sgn;
        pos.push(px, yAt(px, pz) + 0.5 * hill.vs, pz); col.push(k.r, k.g, k.b);
      }
      if (i && !(underPhoto(pts[i - 1][0], pts[i - 1][1]) && underPhoto(x, z))) { const a = base + (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: THREE.DoubleSide }));
  mesh.receiveShadow = true;
  return mesh;
}

/* ---------------------------------------------------------- structures -- */
/* What is built on the site, placed from the owner's drone photos (data/objects.json). Each model
   is built with its front facing +z and turned to its bearing. Heights stay true under Relief ×2. */
let OBJECTS = { objects: [] };
const SITE = {};
function brickTex() {
  const r = rng(17), [c, g] = canvas(512, 512);           // 2 × 2 m of pale handmade brick
  g.fillStyle = '#d6cdbd'; g.fillRect(0, 0, 512, 512);
  const pal = ['#b9aa95', '#c4b6a1', '#ad9f8b', '#cbbfab', '#a8998a', '#bfae97', '#b3a28c'];
  const bh = 16.6, bw = 64;
  for (let row = 0; row * bh < 512; row++) {
    const off = (row % 2) * bw / 2;
    for (let x = -bw; x < 512 + bw; x += bw) {
      g.fillStyle = pal[Math.floor(r() * pal.length)];
      g.fillRect(x + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
      g.fillStyle = `rgba(60,45,30,${r() * 0.12})`; g.fillRect(x + off + 1.5, row * bh + bh - 5, bw - 3, 3.5);
    }
  }
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '70,55,40' : '250,245,235'},${r() * 0.12})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
  return tex(c);
}
function tileTex() {
  const r = rng(23), [c, g] = canvas(256, 256);           // 1 × 1 m of clay roof tile: courses run down the slope
  g.fillStyle = '#b8653a'; g.fillRect(0, 0, 256, 256);
  const cw = 256 / 5, ch = 256 / 3;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) {
    const x = i * cw, y = j * ch, base = ['#d0814f', '#c97646', '#d88c59', '#c06c3f', '#dc9561'][Math.floor(r() * 5)];
    const grd = g.createLinearGradient(x, 0, x + cw, 0);
    grd.addColorStop(0, 'rgba(90,40,20,0.55)'); grd.addColorStop(0.35, base); grd.addColorStop(0.6, base); grd.addColorStop(1, 'rgba(90,40,20,0.5)');
    g.fillStyle = grd; g.fillRect(x, y, cw, ch);
    g.fillStyle = 'rgba(70,30,15,0.35)'; g.fillRect(x, y + ch - 6, cw, 6);
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '80,40,20' : '255,220,190'},${r() * 0.15})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  return tex(c);
}
function gravelTex() {
  const r = rng(29), [c, g] = canvas(256, 256);           // 2 × 2 m of grey gravel
  g.fillStyle = '#9b958a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const v = 110 + r() * 110, s = 1 + r() * 2.6;
    g.fillStyle = `rgba(${v},${v - 4},${v - 12},${0.5 + r() * 0.5})`;
    g.beginPath(); g.ellipse(r() * 256, r() * 256, s, s * (0.6 + r() * 0.4), r() * 3, 0, 6.3); g.fill();
  }
  return tex(c);
}
function siteMaterials() {
  if (SITE.m) return SITE.m;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  return (SITE.m = {
    brick: std({ map: brickTex(), roughness: 0.92 }), tile: std({ map: tileTex(), roughness: 0.7 }),
    trim: std({ color: 0xf1ece2, roughness: 0.6 }), glass: std({ color: 0x1b232c, roughness: 0.2, metalness: 0.5 }),
    concrete: std({ color: 0xc6c0b4, roughness: 0.95 }), floor: std({ color: 0xa9563a, roughness: 0.75 }),
    wood: std({ map: woodTex('#6b4a2e') }), post: std({ map: woodTex('#4f3420') }),
    panel: std({ map: solarTex(), roughness: 0.25, metalness: 0.5 }), alu: std({ color: 0xc7cbcf, roughness: 0.35, metalness: 0.75 }),
    black: std({ color: 0x1c1e20, roughness: 0.55 }), tank: std({ color: 0xe9ece6, roughness: 0.5 }), lid: std({ color: 0x3f8a5a, roughness: 0.5 }),
    canvas: std({ color: 0xf3f0e7, roughness: 0.95, side: THREE.DoubleSide }), mud: std({ color: 0xb06a42, roughness: 1 }),
    blue: std({ color: 0x2f5fa8, roughness: 0.5 }), tub: std({ color: 0xdfeef3, roughness: 0.3 }),
    water: std({ color: 0x1f2a22, roughness: 0.04, metalness: 0, envMapIntensity: 1.4 }),       // dark and glassy: it shows the sky, so it reads as water
    bank: std({ map: gravelTex(), vertexColors: true, roughness: 1, side: THREE.DoubleSide }),
    gravel: std({ map: gravelTex(), color: 0xd9c8b0, roughness: 1, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),   // edges fade into the ground
    mast: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.3 }),
    leaves: foliage(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 }), { instanced: false, scale: 1.3, wind: 0.008 }), granite: std({ color: 0x8e8c86, roughness: 0.9 }),
  });
}
const bearingRot = (deg) => Math.PI - (deg * Math.PI) / 180;    // turns a model's +z front to face that bearing
/* A window with a round top, facing +z, standing on y = 0: white surround and dark glass. */
function archWindow(w, h, M) {
  const g = new THREE.Group();
  const shape = (ww, hh) => {
    const s = new THREE.Shape(), r = ww / 2;
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hh - r); s.absarc(0, hh - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
    return s;
  };
  const trim = new THREE.Mesh(new THREE.ShapeGeometry(shape(w + 0.26, h + 0.13), 12), M.trim); trim.position.set(0, -0.05, 0.02);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(shape(w, h), 12), M.glass); glass.position.z = 0.035;
  g.add(trim, glass);
  return g;
}
function gableRoof(g, W, D, top, pitch, eave, M) {
  // Ridge runs along z; the two slopes fall to ±x. top = wall height; eave = overhang.
  const run = W / 2 + eave, L = run / Math.cos(pitch), apex = top + (W / 2) * Math.tan(pitch);
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(L, 0.14, D + 2 * eave); worldUV(geo, 1);
    const m = new THREE.Mesh(geo, M.tile);
    m.rotation.z = -s * pitch;
    m.position.set((s * run) / 2, apex - (run / 2) * Math.tan(pitch) + 0.08, 0);
    m.castShadow = m.receiveShadow = true; g.add(m);
  }
  box(0.32, 0.18, D + 2 * eave, 0, apex + 0.12, 0, M.tile, g);
  for (const z of [D / 2 - 0.15, -D / 2 + 0.15]) {          // gable triangles
    const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(0, apex - top); s.lineTo(-W / 2, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }); geo.translate(0, top, z - 0.15); worldUV(geo, 2);
    const m = new THREE.Mesh(geo, g.userData.wall || M.brick); m.castShadow = m.receiveShadow = true; g.add(m);
  }
  return apex;
}
function houseModel(o, M) {
  const g = new THREE.Group(), W = o.w || 6.4, D = o.d || 7.6, H = 4.6, F = 0.2, P = 2.7, pw = 2.8, pd = 2.6;
  box(W + 0.3, 2.4, D + 0.3, 0, F - 1.2, 0, M.concrete, g, { uv: 2 });                 // plinth, reaching into the slope
  box(W - pw, H, D, -pw / 2, F + H / 2, 0, M.brick, g, { uv: 2 });
  box(pw, H, D - pd, W / 2 - pw / 2, F + H / 2, -pd / 2, M.brick, g, { uv: 2 });
  box(pw, H - P, pd, W / 2 - pw / 2, F + P + (H - P) / 2, D / 2 - pd / 2, M.brick, g, { uv: 2 });   // upper floor over the porch
  box(0.42, P, 0.42, W / 2 - 0.21, F + P / 2, D / 2 - 0.21, M.brick, g, { uv: 2 });              // corner pillar
  box(pw + 0.5, 0.16, pd + 0.9, W / 2 - pw / 2 + 0.25, F + 0.02, D / 2 - pd / 2 + 0.45, M.floor, g);  // porch floor and step
  box(1.0, 2.1, 0.06, W / 2 - pw + 1.0, F + 1.05, D / 2 - pd + 0.02, M.glass, g);                 // door onto the porch
  const apex = gableRoof(g, W, D, F + H, 0.6, 0.55, M);
  const put = (w, h, x, y, z, ry) => { const a = archWindow(w, h, M); a.position.set(x, F + y, z); a.rotation.y = ry; g.add(a); };
  put(1.55, 1.85, -0.55, 3.0, D / 2, 0);                  // upper window on the gable front
  put(1.25, 1.45, -W / 2 + 1.1, 0.95, D / 2, 0);
  put(1.2, 1.4, -W / 2, 0.95, 1.7, -Math.PI / 2); put(1.2, 1.4, -W / 2, 0.95, -1.5, -Math.PI / 2);
  put(0.9, 1.1, -W / 2, 3.1, 0.2, -Math.PI / 2);
  put(0.9, 1.2, W / 2, 1.0, -2.2, Math.PI / 2); put(1.1, 1.3, 0.6, 1.0, -D / 2, Math.PI);
  box(1.0, 0.7, 0.8, 0, apex + 0.45, D / 2 - 1.1, M.tank, g); box(1.05, 0.08, 0.85, 0, apex + 0.82, D / 2 - 1.1, M.lid, g);  // water tank on the ridge
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), M.black); pipe.position.set(-1.4, apex - 0.4, -D / 2 + 1.3); g.add(pipe);
  for (const z of [-D / 2 + 1.2, -D / 2 + 2.4]) {         // black water tanks against the side wall
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.25, 16), M.black); t.position.set(-W / 2 - 0.75, F + 0.62, z); t.castShadow = true; g.add(t);
  }
  return g;
}
function cabinModel(o, M) {
  const g = new THREE.Group(), W = o.w || 4.6, D = o.d || 5.6, H = 2.5;
  g.userData.wall = M.wood;
  box(D + 0.2, 1.2, W + 0.2, 0, -0.45, 0, M.concrete, g, { uv: 2 });
  box(D, H, W, 0, 0.15 + H / 2, 0, M.wood, g, { uv: 2 });                                              // ridge runs across the front
  const roof = new THREE.Group(); roof.userData.wall = M.wood; roof.rotation.y = Math.PI / 2; g.add(roof);
  gableRoof(roof, W, D, 0.15 + H, 0.55, 0.45, M);
  box(1.0, 2.0, 0.06, 0.8, 0.15 + 1.0, W / 2 + 0.02, M.glass, g); box(1.1, 0.9, 0.06, -1.3, 0.15 + 1.4, W / 2 + 0.02, M.glass, g);
  box(D + 0.4, 0.12, 1.4, 0, 0.2, W / 2 + 0.7, M.wood, g);                                              // deck
  return g;
}
function quinchoModel(o, M) {
  const g = new THREE.Group(), W = o.w || 6.4, D = o.d || 4.2, hf = 2.55, hb = 3.05;
  box(W + 0.4, 0.9, D + 0.4, 0, -0.3, 0, M.concrete, g, { uv: 2 });
  box(W, 0.1, D, 0, 0.18, 0, M.floor, g);
  for (const x of [-W / 2 + 0.15, 0, W / 2 - 0.15]) {
    box(0.16, hf, 0.16, x, 0.2 + hf / 2, D / 2 - 0.15, M.post, g);
    box(0.16, hb, 0.16, x, 0.2 + hb / 2, -D / 2 + 0.15, M.post, g);
  }
  const L = (D + 0.8) / Math.cos(Math.atan((hb - hf) / D));
  const geo = new THREE.BoxGeometry(W + 0.8, 0.12, L); worldUV(geo, 1);
  const roof = new THREE.Mesh(geo, M.tile); roof.rotation.x = Math.atan((hb - hf) / D); roof.position.set(0, 0.2 + (hf + hb) / 2 + 0.1, 0);
  roof.castShadow = roof.receiveShadow = true; g.add(roof);
  box(W - 0.6, 0.95, 0.6, 0, 0.2 + 0.47, -D / 2 + 0.45, M.brick, g, { uv: 2 });                        // counter and sink along the back
  box(1.8, 0.62, 0.9, 1.6, 0.2 + 0.31, 0.7, M.tub, g);                                                 // plunge tub
  return g;
}
function solarModel(o, M) {
  const g = new THREE.Group(), tilt = 0.44, pw = 1.13, pl = 2.28, front = 1.0;
  const tables = o.tables || 3, tw = 3 * pw + 0.06, gap = 0.45, span = tables * tw + (tables - 1) * gap;
  const depth = 2 * pl * Math.cos(tilt), rise = 2 * pl * Math.sin(tilt);
  for (let t = 0; t < tables; t++) {
    const x0 = -span / 2 + t * (tw + gap) + tw / 2;
    for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(pw - 0.03, 0.04, pl - 0.03), [M.alu, M.alu, M.panel, M.alu, M.alu, M.alu]);
      p.rotation.x = tilt;                                  // tipped up at the back, so the panels face +z
      const along = (r - 0.5) * pl;
      p.position.set(x0 + (c - 1) * pw, front + rise / 2 + along * Math.sin(tilt), -along * Math.cos(tilt));
      p.castShadow = p.receiveShadow = true; g.add(p);
    }
    for (const sx of [-1, 1]) {
      box(0.28, front + 0.4, 0.28, x0 + sx * (tw / 2 - 0.4), (front - 0.4) / 2 + 0.1, depth / 2 - 0.25, M.concrete, g);
      box(0.28, front + rise + 0.2, 0.28, x0 + sx * (tw / 2 - 0.4), (front + rise - 0.6) / 2 + 0.1, -depth / 2 + 0.25, M.concrete, g);
    }
  }
  return g;
}
function mastGeometry(h) {
  const parts = [], legs = [0, 1, 2].map((k) => [0.32 * Math.cos((k * 2 * Math.PI) / 3), 0.32 * Math.sin((k * 2 * Math.PI) / 3)]);
  const band = (y) => (Math.floor(y / (h / 7)) % 2 ? 0xf2f0ea : 0xc8322a);
  const rod = (a, b, r) => {
    const v = new THREE.Vector3().subVectors(b, a), L = v.length();
    const geo = new THREE.CylinderGeometry(r, r, L, 4, 1); geo.translate(0, L / 2, 0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, v.normalize())); geo.translate(a.x, a.y, a.z);
    parts.push(colorize(geo, band((a.y + b.y) / 2)));
  };
  const step = 0.6;
  for (let y = 0; y < h - 0.01; y += step) {
    for (let k = 0; k < 3; k++) {
      const [x0, z0] = legs[k], [x1, z1] = legs[(k + 1) % 3];
      rod(new THREE.Vector3(x0, y, z0), new THREE.Vector3(x0, y + step, z0), 0.035);
      rod(new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y + step, z1), 0.014);
    }
  }
  return mergeGeometries(parts);
}
function tentModel(o, M) {
  const g = new THREE.Group(), r = o.r || 2.5;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.75, 24, 1, true), M.canvas); wall.position.y = 0.37;
  const top = new THREE.Mesh(new THREE.ConeGeometry(r + 0.08, 2.3, 24, 1, true), M.canvas); top.position.y = 0.75 + 1.15;
  wall.castShadow = top.castShadow = true; g.add(wall, top);
  return g;
}
function trampolineModel(o, M) {
  const g = new THREE.Group(), r = o.r || 1.8;
  const pad = new THREE.Mesh(new THREE.TorusGeometry(r, 0.13, 8, 32), M.blue); pad.rotation.x = Math.PI / 2; pad.position.y = 0.9;
  const mat = new THREE.Mesh(new THREE.CircleGeometry(r - 0.1, 32), M.black); mat.rotation.x = -Math.PI / 2; mat.position.y = 0.88;
  g.add(pad, mat);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; box(0.06, 0.9, 0.06, Math.cos(a) * r, 0.45, Math.sin(a) * r, M.alu, g); }
  return g;
}
function ovenModel(o, M) {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.mud); dome.scale.y = 0.85; dome.castShadow = true;
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), M.black); mouth.position.set(0, 0.25, 0.82);
  g.add(dome, mouth);
  return g;
}
/* Ground under a footprint: the lowest point, so nothing floats on a slope. */
function baseY(x, z, r) {
  let lo = Infinity;
  for (let a = 0; a < 8; a++) lo = Math.min(lo, yAt(x + Math.cos((a * Math.PI) / 4) * r, z + Math.sin((a * Math.PI) / 4) * r));
  return Math.min(lo, yAt(x, z));
}
/* Ponds: the terrain shader leaves a hole the shape of the water (a fine mask), and the pond brings its own
   cut bank down from the ground to the water, so the shoreline is exact at any terrain resolution. */
function pondLevel(o) { return Math.min(...o.ring.map(([x, z]) => groundAt(x, z))) - 0.7; }
/* Ponds are drawn from a few corners; round them off (Chaikin) so the shore curves. */
function roundRing(ring, n = 3) {
  let r = ring;
  for (let k = 0; k < n; k++) r = r.flatMap(([ax, az], i) => { const [bx, bz] = r[(i + 1) % r.length]; return [[0.75 * ax + 0.25 * bx, 0.75 * az + 0.25 * bz], [0.25 * ax + 0.75 * bx, 0.25 * az + 0.75 * bz]]; });
  return r;
}
const shoreOf = (o) => o.shore || (o.shore = roundRing(o.ring));
function holeMask() {
  const rings = [...OBJECTS.objects.filter((o) => o.type === 'pond').map(shoreOf), ...CUTS.map((c) => c.ring)];
  if (!rings.length) return null;
  const xs = rings.flatMap((r) => r.map((p) => p[0])), zs = rings.flatMap((r) => r.map((p) => p[1]));
  const x0 = Math.min(...xs) - 3, x1 = Math.max(...xs) + 3, z0 = Math.min(...zs) - 3, z1 = Math.max(...zs) + 3;
  const k = clamp(2400 / Math.max(x1 - x0, z1 - z0), 2, 10);                        // pixels per metre
  const [c, g] = canvas(Math.ceil((x1 - x0) * k), Math.ceil((z1 - z0) * k));
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#fff';
  for (const r of rings) { g.beginPath(); r.forEach(([x, z], i) => (i ? g.lineTo : g.moveTo).call(g, (x - x0) * k, (z - z0) * k)); g.closePath(); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  const U = (x) => (x + HHALF) / (2 * HHALF), V = (z) => 1 - (z + HHALF) / (2 * HHALF);
  return { tex: t, rect: new THREE.Vector4(U(x0), V(z0 + c.height / k), U(x0 + c.width / k), V(z0)) };
}
function pondModel(o, M) {
  const g = new THREE.Group(), wl = (pondLevel(o) - HBASE) * hill.vs, shore = shoreOf(o), ring = [];
  for (let i = 0; i < shore.length; i++) {
    const [ax, az] = shore[i], [bx, bz] = shore[(i + 1) % shore.length], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
    for (let s = 0; s < n; s++) ring.push([lerp(ax, bx, s / n), lerp(az, bz, s / n)]);
  }
  ring.push(ring[0]);
  const pos = [], uv = [], idx = [], col = [], grass = new THREE.Color(0x5d6a37), earth = new THREE.Color(0x6e4c33), deep = new THREE.Color(0x2f261c), c = new THREE.Color();   // wet, dark banks: bright clay read as a bowl
  const cx = o.ring.reduce((a, p) => a + p[0], 0) / o.ring.length, cz = o.ring.reduce((a, p) => a + p[1], 0) / o.ring.length;
  let acc = 0;
  ring.forEach(([x, z], i) => {
    if (i) acc += Math.hypot(x - ring[i - 1][0], z - ring[i - 1][1]);
    const top = Math.max(yAt(x, z), wl + 0.1) + 0.03, bot = wl - 1.0, d = Math.hypot(cx - x, cz - z) || 1;
    const run = Math.min((top - bot) * 0.75, d * 0.45);                  // banks slope in, steeper where the cut is deep
    pos.push(x, top, z, x + ((cx - x) / d) * run, bot, z + ((cz - z) / d) * run); uv.push(acc / 8, top / 8, acc / 8, bot / 8);
    c.copy(grass).lerp(earth, clamp((top - wl - 0.8) / 1.6, 0, 1)); col.push(c.r, c.g, c.b, deep.r, deep.g, deep.b);   // grassy where low, raw earth where the cut is deep
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const bank = new THREE.BufferGeometry();
  bank.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bank.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  bank.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  bank.setIndex(idx); bank.computeVertexNormals();
  const s = new THREE.Shape(shore.map(([x, z]) => new THREE.Vector2(x, -z)));
  const water = new THREE.ShapeGeometry(s); water.rotateX(-Math.PI / 2); water.translate(0, wl, 0);
  g.add(new THREE.Mesh(bank, M.bank), new THREE.Mesh(water, M.water));
  g.traverse((c) => { if (c.isMesh) c.receiveShadow = false; });     // the terrain over the hole would otherwise shade it
  return g;
}
function ribbon(path, w, mat) {
  const pts = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [x0, z0] = path[i], [x1, z1] = path[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.5));
    for (let s = 0; s < n; s++) pts.push([lerp(x0, x1, s / n), lerp(z0, z1, s / n)]);
  }
  pts.push(path[path.length - 1]);
  const pos = [], uv = [], idx = [], col = [], ACROSS = [[-0.62, 0], [-0.36, 1], [0.36, 1], [0.62, 0]];   // four across: the edges fade out
  let acc = 0;
  pts.forEach(([x, z], i) => {
    const [ax, az] = pts[Math.max(0, i - 1)], [bx, bz] = pts[Math.min(pts.length - 1, i + 1)];
    let dx = bx - ax, dz = bz - az; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    if (i) acc += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    for (const [s, a] of ACROSS) { const px = x - dz * w * s, pz = z + dx * w * s; pos.push(px, yAt(px, pz) + 0.05, pz); uv.push((s * w) / 2, acc / 2); col.push(1, 1, 1, a * 0.9); }
    if (i) { const b = (i - 1) * 4; for (let k = 0; k < 3; k++) idx.push(b + k, b + k + 4, b + k + 1, b + k + 4, b + k + 5, b + k + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return m;
}
/* Earthworks: an old quarry cut, given as a ring with a wall along some of its edges. Inside the ring the ground
   is lowered: by the full depth at the wall, easing out over "reach" metres and towards the other edges. The
   terrain shader leaves a hole there, and a finer mesh of the cut ground takes its place, so the wall is sharp. */
let CUTS = [];
function segDist(x, z, ax, az, bx, bz) {
  const t = clamp(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2 || 1), 0, 1);
  return Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az));
}
function prepCuts() {
  const same = (a, b) => Math.abs(a[0] - b[0]) < 0.05 && Math.abs(a[1] - b[1]) < 0.05;
  CUTS = OBJECTS.objects.filter((o) => o.type === 'cut' && o.ring && o.wall).map((o) => {
    const xs = o.ring.map((p) => p[0]), zs = o.ring.map((p) => p[1]), walls = [], other = [];
    o.ring.forEach((a, i) => {
      const b = o.ring[(i + 1) % o.ring.length];
      const isWall = o.wall.some((w, j) => j < o.wall.length - 1 && ((same(w, a) && same(o.wall[j + 1], b)) || (same(w, b) && same(o.wall[j + 1], a))));
      (isWall ? walls : other).push([a[0], a[1], b[0], b[1]]);
    });
    return { o, ring: o.ring, walls, other, depth: o.depth || 3, reach: o.reach || 30, x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  });
}
function cutAt(x, z) {
  let d = 0;
  for (const c of CUTS) {
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1 || !inPoly(x, z, c.ring)) continue;
    let dw = Infinity, de = Infinity;
    for (const s of c.walls) dw = Math.min(dw, segDist(x, z, ...s));
    for (const s of c.other) de = Math.min(de, segDist(x, z, ...s));
    d += c.depth * clamp(1 - dw / c.reach, 0, 1) * clamp(de / 8, 0, 1);
  }
  return d;
}
function cutModel(c, M) {
  const g = new THREE.Group(), step = small ? 0.75 : 0.5, pad = 2.5;
  const x0 = c.x0 - pad, z0 = c.z0 - pad, nx = Math.ceil((c.x1 - c.x0 + 2 * pad) / step) + 1, nz = Math.ceil((c.z1 - c.z0 + 2 * pad) / step) + 1;
  const pos = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), keep = new Uint8Array(nx * nz);
  const near = (x, z) => inPoly(x, z, c.ring) || [...c.walls, ...c.other].some((s) => segDist(x, z, ...s) < 1.6);
  for (let r = 0; r < nz; r++) for (let q = 0; q < nx; q++) {
    const i = r * nx + q, x = x0 + q * step, z = z0 + r * step, inside = inPoly(x, z, c.ring);
    pos[i * 3] = x; pos[i * 3 + 1] = (groundAt(x, z) - (inside ? 0 : 0.08) - HBASE) * hill.vs; pos[i * 3 + 2] = z;   // outside the ring it tucks under the terrain
    uv[i * 2] = (x + HHALF) / (2 * HHALF); uv[i * 2 + 1] = 1 - (z + HHALF) / (2 * HHALF);
    keep[i] = near(x, z) ? 1 : 0;
  }
  const idx = [];
  for (let r = 0; r < nz - 1; r++) for (let q = 0; q < nx - 1; q++) {
    const a = r * nx + q, b = a + 1, d = a + nx, e = d + 1;
    if (keep[a] | keep[b] | keep[d] | keep[e]) idx.push(a, d, b, b, d, e);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, hill.insertMat); ground.receiveShadow = true; ground.userData.ground = true; g.add(ground);
  // The wall face: raw earth under a lip of grass, just in front of the step.
  const fp = [], fc = [], fi = [], lip = new THREE.Color(0x7d7a3e), earth = new THREE.Color(0xc08a5c), foot = new THREE.Color(0x8f6446);
  let row = 0;
  for (const [ax, az, bx, bz] of c.walls) {
    const L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L;
    let ix = -tz, iz = tx;
    if (!inPoly((ax + bx) / 2 + ix * 2, (az + bz) / 2 + iz * 2, c.ring)) { ix = -ix; iz = -iz; }
    const n = Math.ceil(L / 0.5);
    for (let s = 0; s <= n; s++) {
      const x = ax + tx * (L * s) / n, z = az + tz * (L * s) / n;
      const top = (groundAt(x - ix * 0.4, z - iz * 0.4) - HBASE) * hill.vs + 0.05, bot = (groundAt(x + ix * 0.9, z + iz * 0.9) - HBASE) * hill.vs - 0.15;
      const mid = top - Math.min(0.5, (top - bot) * 0.2), wx = x + ix * 0.12, wz = z + iz * 0.12;
      fp.push(wx, top, wz, wx + ix * 0.1, mid, wz + iz * 0.1, wx + ix * 0.35, bot, wz + iz * 0.35);
      fc.push(lip.r, lip.g, lip.b, earth.r, earth.g, earth.b, foot.r, foot.g, foot.b);
      if (s) { const a = (row + s - 1) * 3, b = (row + s) * 3; fi.push(a, a + 1, b, b, a + 1, b + 1, a + 1, a + 2, b + 1, b + 1, a + 2, b + 2); }
    }
    row += n + 1;
  }
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3)); fgeo.setAttribute('color', new THREE.Float32BufferAttribute(fc, 3));
  const fuv = []; for (let i = 0; i < fp.length / 3; i++) fuv.push(fp[i * 3] / 3 + fp[i * 3 + 2] / 3, fp[i * 3 + 1] / 3);
  fgeo.setAttribute('uv', new THREE.Float32BufferAttribute(fuv, 2));
  fgeo.setIndex(fi); fgeo.computeVertexNormals();
  const face = new THREE.Mesh(fgeo, M.bank); face.receiveShadow = true; g.add(face);
  return g;
}
/* A big old mango: a short split trunk and a broad, dense dome of glossy dark leaves. */
function mangoModel(o, M) {
  const g = new THREE.Group(), H = o.h || 13, R = o.r || 8, Rn = rng(41), parts = [];
  const limb = (x0, y0, z0, x1, y1, z1, r0, r1) => {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), v = b.clone().sub(a), L = v.length();
    const geo = new THREE.CylinderGeometry(r1, r0, L, 9, 1); geo.translate(0, L / 2, 0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, v.normalize())); geo.translate(a.x, a.y, a.z);
    parts.push(colorize(geo, 0x5a4232));
  };
  limb(0, -0.5, 0, 0.2, 2.4, 0.1, 0.75, 0.6);
  limb(0.2, 2.2, 0.1, -1.8, 6.5, 0.8, 0.45, 0.25); limb(0.2, 2.2, 0.1, 1.9, 6.8, -0.6, 0.45, 0.25); limb(0.2, 2.4, 0.1, 0.4, 7.5, 1.9, 0.4, 0.22);
  limb(-1.8, 6.5, 0.8, -4.5, 7.5, 1.8, 0.25, 0.12); limb(1.9, 6.8, -0.6, 4.6, 8, -1.5, 0.25, 0.12);
  const leaf = new THREE.Color(), blobs = 22;
  for (let i = 0; i < blobs; i++) {
    const a = Rn() * Math.PI * 2, rr = Math.sqrt(Rn()) * R * 0.75, y = 6 + Rn() * (H - 8.5) + (1 - rr / R) * 2.5;
    const s = 2.4 + Rn() * 2.4, b = new THREE.IcosahedronGeometry(1, 1);
    b.scale(s * 1.15, s * 0.8, s * 1.15); b.translate(Math.cos(a) * rr, y, Math.sin(a) * rr);
    leaf.setHSL(0.27 + Rn() * 0.05, 0.42 + Rn() * 0.15, 0.13 + Rn() * 0.07, THREE.SRGBColorSpace);
    parts.push(colorize(b, leaf.getHex()));
  }
  const m = new THREE.Mesh(mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p))), M.leaves);
  m.castShadow = m.receiveShadow = true; g.add(m);
  return g;
}
/* A rounded granite boulder, half in the ground. */
function boulderModel(o, M) {
  let geo = new THREE.IcosahedronGeometry(1, 3); geo.deleteAttribute('normal'); geo.deleteAttribute('uv'); geo = mergeVertices(geo);
  const p = geo.attributes.position, v = new THREE.Vector3(), Rn = rng(Math.round(o.x * 7 + o.z * 13));
  const k = [Rn(), Rn(), Rn()];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = 1 + 0.12 * Math.sin(v.x * 3 + k[0] * 6) * Math.cos(v.z * 2.5 + k[1] * 6) + 0.06 * Math.sin(v.y * 5 + k[2] * 6);
    p.setXYZ(i, v.x * n, Math.max(v.y * n, -0.35) , v.z * n);
  }
  geo.computeVertexNormals();
  geo.scale((o.w || 4) / 2, o.h || 2, (o.d || 3) / 2);
  const m = new THREE.Mesh(geo, M.granite); m.position.y = -0.15; m.castShadow = m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  return g;
}

const BUILDERS = { mango: mangoModel, boulder: boulderModel, house: houseModel, cabin: cabinModel, quincho: quinchoModel, solar: solarModel, tent: tentModel, trampoline: trampolineModel, oven: ovenModel };
const FOOT = { mango: 8, boulder: 2.5, house: 6, cabin: 4, quincho: 4.5, solar: 7, tent: 3, trampoline: 2.4, oven: 1.2, mast: 1.5, palm: 1 };
function buildStructures() {
  const M = siteMaterials(), group = new THREE.Group();
  for (const o of OBJECTS.objects) {
    let m = null;
    if (BUILDERS[o.type]) {
      m = BUILDERS[o.type](o, M);
      m.position.set(o.x, baseY(o.x, o.z, (FOOT[o.type] || 2) * 0.6), o.z);
      m.rotation.y = bearingRot(o.rot || 0);
    } else if (o.type === 'mast') {
      m = new THREE.Mesh(mastGeometry(o.h || 18), M.mast); m.position.set(o.x, yAt(o.x, o.z), o.z);
    } else if (o.type === 'palm') {
      m = new THREE.Mesh(palmGeometry(o.h || 12), palmMat); m.position.set(o.x, yAt(o.x, o.z), o.z);
    } else if (o.type === 'pond') {
      m = pondModel(o, M);
    } else if (o.type === 'gravel') {
      m = ribbon(o.path, o.w || 3, M.gravel);
    } else if (o.type === 'cut') {
      const c = CUTS.find((k) => k.o === o); if (c) m = cutModel(c, M);
    }
    if (!m) continue;
    m.traverse((c) => { if (c.isMesh) { c.castShadow = c.castShadow || (o.type !== 'gravel' && o.type !== 'pond'); if (o.type !== 'pond') c.receiveShadow = true; if (!c.userData.ground) c.userData.site = o; } });
    group.add(m);
  }
  return group;
}
/* Ground the structures stand on is kept free of model trees. */
function clearOfStructures(x, z) {
  for (const o of OBJECTS.objects) {
    if (o.ring) { if (Math.abs(x - o.ring[0][0]) < 40 && Math.abs(z - o.ring[0][1]) < 40 && (inPoly(x, z, o.ring) || o.ring.some(([px, pz]) => Math.hypot(x - px, z - pz) < 4))) return false; continue; }
    if (o.path) {
      for (let i = 0; i < o.path.length - 1; i++) {
        const [ax, az] = o.path[i], [bx, bz] = o.path[i + 1];
        const t = clamp(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2 || 1), 0, 1);
        if (Math.hypot(x - ax - t * (bx - ax), z - az - t * (bz - az)) < (o.w || 3) / 2 + 1.5) return false;
      }
      continue;
    }
    if (FOOT[o.type] && o.type !== 'palm' && Math.hypot(x - o.x, z - o.z) < (o.type === 'mango' ? (o.r || 8) + 6 : FOOT[o.type] + 1.5)) return false;   // the mango's crown was the canopy there
  }
  if (CUTS.length && cutAt(x, z) > 0.4) return false;   // the floor of a cut was cleared
  for (const n of notes.list) {                     // planned buildings too, deck included
    if (n.kind === 'note' && !n.model) continue;
    const [nx, nz] = fromUTM(n.E, n.N), dx = x - nx, dz = z - nz;
    if (n.kind === 'note') { if (Math.hypot(dx, dz) < (n.model === 'plaza' ? 14 : 4)) return false; continue; }
    if (dx * dx + dz * dz > 1600) continue;
    const b = (n.rot * Math.PI) / 180, along = dx * Math.sin(b) - dz * Math.cos(b), across = dx * Math.cos(b) + dz * Math.sin(b);
    if (Math.abs(across) < n.w / 2 + 1 && along > -n.d / 2 - 1 && along < n.d / 2 + (n.kind === 'cabin' ? 3 : 0) + 1) return false;
  }
  return true;
}

/* Annotations: one transparent canvas laid over the terrain for boundaries and the UTM grid. */
let overlay = null;
function drawOverlay() {
  const { c, g, tex } = overlay, W = c.width, k = W / (2 * HHALF);
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, W);
  g.setTransform(k, 0, 0, k, W / 2, W / 2);
  if (hill.on.grid) {
    const e0 = META.origin.easting, n0 = META.origin.northing;
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,248,230,0.55)';
    g.font = `${Math.round(26 / k * (W / 4096))}px "IBM Plex Mono", monospace`; g.fillStyle = 'rgba(255,248,230,0.9)';
    for (let E = Math.ceil((e0 - HHALF) / 500) * 500; E <= e0 + HHALF; E += 500) {
      const x = E - e0; g.beginPath(); g.moveTo(x, -HHALF); g.lineTo(x, HHALF); g.stroke();
      g.fillText(`${E} E`, x + 6, -HHALF + 40);
    }
    for (let N = Math.ceil((n0 - HHALF) / 500) * 500; N <= n0 + HHALF; N += 500) {
      const z = n0 - N; g.beginPath(); g.moveTo(-HHALF, z); g.lineTo(HHALF, z); g.stroke();
      g.fillText(`${N} N`, -HHALF + 12, z - 8);
    }
  }
  const ring = (utm, color, fill, width, closed, dash) => {
    const pts = utm.map(([E, N]) => fromUTM(E, N));
    if (!pts.length) return;
    g.beginPath(); pts.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z)));
    if (closed && pts.length > 2) { g.closePath(); g.fillStyle = fill; g.fill(); }
    g.setLineDash(dash || []); g.lineWidth = width; g.strokeStyle = color; g.stroke(); g.setLineDash([]);
    g.fillStyle = color; pts.forEach(([x, z]) => { g.beginPath(); g.arc(x, z, width, 0, Math.PI * 2); g.fill(); });
  };
  for (const o of OFFICIAL) ring(o.utm, o.color || '#e9bf5a', o.dash ? 'rgba(0,0,0,0)' : 'rgba(233,191,90,0.12)', o.dash ? 2.2 : 3.6, o.closed !== false, o.dash ? [9, 7] : null);
  for (const b of limits.list) { const k = kindOf(b), ed = b.id === limits.editing; ring(b.utm, k.color, k.fill, ed ? 4 : 3.2, true, ed ? [10, 6] : null); }
  if (limits.drawing && limits.drawing.utm.length) { const k = kindOf(limits.drawing); ring(limits.drawing.utm, k.color, k.fill, 3, limits.drawing.utm.length > 2, [9, 6]); }
  if (limits.textDraft.length) ring(limits.textDraft, '#7fb3e3', 'rgba(127,179,227,0.12)', 2.6, limits.textDraft.length > 2, [9, 6]);
  if (display.trail && trail.path.length) {
    g.lineJoin = g.lineCap = 'round';
    for (const p of trail.path) {
      g.beginPath(); p.forEach(([x, z], i) => (i ? g.lineTo(x, z) : g.moveTo(x, z)));
      g.strokeStyle = 'rgba(40,24,10,0.55)'; g.lineWidth = 4.5; g.stroke();
      g.strokeStyle = '#f2b46a'; g.lineWidth = 2.4; g.setLineDash([8, 5]); g.stroke(); g.setLineDash([]);
    }
  }
  tex.needsUpdate = true;
}

function curtain(pts, height, color, strength) {
  const ring = [];
  for (let i = 0; i < pts.length; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % pts.length];
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 8));
    for (let s = 0; s < n; s++) ring.push([lerp(x0, x1, s / n), lerp(z0, z1, s / n)]);
  }
  ring.push(ring[0]);
  const pos = [], uv = [], idx = [];
  let acc = 0;
  ring.forEach(([x, z], i) => {
    const y = yAt(x, z);
    if (i) acc += Math.hypot(x - ring[i - 1][0], z - ring[i - 1][1]);
    pos.push(x, y + 0.3, z, x, y + height, z); uv.push(acc / 40, 0, acc / 40, 1);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: strength }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uColor; uniform float uK; uniform float uTime; varying vec2 vUv;
      void main(){ float a = pow(1.0 - vUv.y, 1.6) * uK; a *= 0.75 + 0.25 * sin(vUv.x * 6.2831 - uTime * 1.5);
      gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  });
  return new THREE.Mesh(geo, mat);
}
function refreshCurtains() {
  hill.curtains.forEach((m) => { hill.scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  hill.curtains = [];
  const add = (utm, h, glow, k) => { const m = curtain(utm.map(([E, N]) => fromUTM(E, N)), h, glow, k); hill.scene.add(m); hill.curtains.push(m); };
  for (const o of OFFICIAL) if (!o.dash && o.closed !== false && o.utm.length > 2) add(o.utm, 14, new THREE.Color(o.color || '#e9bf5a').getHex(), 0.7);
  for (const b of limits.list) if (b.utm.length > 2) add(b.utm, b.kind === 'property' ? 14 : 9, kindOf(b).glow, b.id === limits.editing ? 0.35 : 0.65);
}

/* ------------------------------------------------- property limits -- */
/* Limits are drawn in the model and stored in UTM 21S. In the Claude viewer they live in the
   artifact's shared database, so everyone with access sees the same lines; elsewhere they
   fall back to this browser. */
const KINDS = {
  property: { label: 'Whole property', color: '#e9bf5a', glow: 0xe9bf5a, fill: 'rgba(233,191,90,0.14)' },
  public: { label: 'Public side', color: '#93c97c', glow: 0x93c97c, fill: 'rgba(147,201,124,0.16)' },
  private: { label: 'Private side', color: '#7fb3e3', glow: 0x7fb3e3, fill: 'rgba(127,179,227,0.16)' },
  homesite: { label: 'Homesite', color: '#cfa8ec', glow: 0xcfa8ec, fill: 'rgba(207,168,236,0.14)' },
  other: { label: 'Other', color: '#f1e9db', glow: 0xf1e9db, fill: 'rgba(241,233,219,0.10)' },
};
const limits = { list: [], local: [], shared: false, canEdit: true, db: null, editing: null, drawing: null, textDraft: [], selected: -1, dragging: false, undo: [], writing: {}, dirty: {}, onChange: () => {} };
const kindOf = (b) => KINDS[b.kind] || KINDS.property;
const flatten = (utm) => utm.flatMap(([E, N]) => [+E.toFixed(2), +N.toFixed(2)]);
function unflatten(a) { const o = []; for (let i = 0; i + 1 < (a || []).length; i += 2) o.push([+a[i], +a[i + 1]]); return o; }
const newLimitId = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const LOCAL_KEY = 'oh-limits-v2';
function localLoad() {
  try {
    const v2 = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    if (Array.isArray(v2)) return v2;
    const v1 = JSON.parse(localStorage.getItem('oh-boundaries-v1') || '[]');
    return v1.map((b) => ({ id: newLimitId(), name: b.name, kind: 'property', utm: b.utm }));
  } catch (e) { return []; }
}
function localSave() { if (!limits.shared) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(limits.list)); } catch (e) {} } }
const limitById = (id) => limits.list.find((b) => b.id === id);

async function initLimits() {
  limits.list = localLoad();
  loadLocalNames();
  limits.onChange();
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return;
  const [db, user] = await Promise.all([c.use('db').catch(() => null), c.use('user').catch(() => null)]);
  if (!db) return;
  if (user) { try { limits.canEdit = await user.canEdit(); } catch (e) {} }
  limits.db = db; limits.shared = true;
  limits.local = limits.list; limits.list = [];
  db.collection('boundaries').onSnapshot((snap) => {
    const held = limits.dragging && limitById(limits.editing);
    limits.list = snap.docs.map((d) => {
      const v = d.data() || {};
      return { id: d.id, name: String(v.name || 'Boundary').slice(0, 80), kind: KINDS[v.kind] ? v.kind : 'property', utm: unflatten(v.pts) };
    }).filter((b) => b.utm.length >= 3).map((b) => (held && b.id === held.id ? held : b));
    limits.onChange();
  }, () => {});
  db.collection('labels').onSnapshot((snap) => {
    for (const k of Object.keys(surveyNames)) delete surveyNames[k];
    for (const d of snap.docs) { const v = d.data() || {}; if (v.name) surveyNames[d.id] = String(v.name).slice(0, 80); }
    limits.onChange();
  }, () => {});
  limits.onChange();
}
/* Survey boundaries keep their plan geometry, but their names can be changed in the model. */
const surveyNames = {};
const nameOf = (b) => (b && b.official ? surveyNames[b.id] || b.name : (b && b.name) || 'Boundary');
function loadLocalNames() { try { Object.assign(surveyNames, JSON.parse(localStorage.getItem('oh-names-v1') || '{}')); } catch (e) {} }
async function renameBoundary(b, name) {
  name = String(name || '').trim().slice(0, 80);
  if (!name || !b) return;
  if (b.official) {
    surveyNames[b.id] = name;
    if (limits.shared) {
      try { await limits.db.collection('labels').doc(b.id).set({ name, updated: Date.now() }); }
      catch (e) { limits.error = 'The new name was not saved. Try again.'; }
    } else { try { localStorage.setItem('oh-names-v1', JSON.stringify(surveyNames)); } catch (e) {} }
  } else {
    const x = limitById(b.id); if (!x) return;
    x.name = name; persistLimit(x.id);
  }
  limits.onChange();
}
async function persistLimit(id) {
  if (!limits.shared) { localSave(); return; }
  if (limits.writing[id]) { limits.dirty[id] = true; return; }
  limits.writing[id] = true;
  try {
    do {
      limits.dirty[id] = false;
      const b = limitById(id); if (!b) break;
      await limits.db.collection('boundaries').doc(id).set({ name: b.name, kind: b.kind, pts: flatten(b.utm), updated: Date.now() });
    } while (limits.dirty[id]);
  } catch (e) {
    if (e && e.code === 'invalid_argument') limits.canEdit = false;
    limits.error = e && e.code === 'quota_exceeded' ? 'The shared model is full; remove a boundary first.' : 'That change was not saved. Check the connection and try again.';
    limits.onChange();
  } finally { limits.writing[id] = false; }
}
async function deleteLimit(id) {
  limits.list = limits.list.filter((b) => b.id !== id);
  if (limits.editing === id) { limits.editing = null; limits.selected = -1; }
  if (limits.shared) { try { await limits.db.collection('boundaries').doc(id).delete(); } catch (e) { limits.error = 'That boundary was not removed. Try again.'; } }
  else localSave();
  limits.onChange();
}

function ringArea(utm) {
  let a = 0, p = 0;
  for (let i = 0; i < utm.length; i++) {
    const [x1, y1] = utm[i], [x2, y2] = utm[(i + 1) % utm.length];
    a += x1 * y2 - x2 * y1; p += Math.hypot(x2 - x1, y2 - y1);
  }
  return { ha: Math.abs(a) / 2 / 10000, m: p };
}
/* Numbers as people write them: 487570.25, 487 570,25, 7.200.720,10, 7,200,720.10. */
function numberOptions(tok) {
  const t = tok.replace(/\s/g, '').replace(/[.,]+$/, '');
  const opts = new Set();
  if (t.includes('.') && t.includes(',')) {
    const dec = t.lastIndexOf('.') > t.lastIndexOf(',') ? '.' : ',';
    opts.add(parseFloat(t.split(dec === '.' ? ',' : '.').join('').replace(',', '.')));
  } else if (t.includes(',')) {
    opts.add(parseFloat(t.replace(',', '.'))); if (/^-?\d{1,3}(,\d{3})+$/.test(t)) opts.add(parseFloat(t.replace(/,/g, '')));
  } else if ((t.match(/\./g) || []).length > 1) {
    opts.add(parseFloat(t.replace(/\./g, '')));
  } else {
    opts.add(parseFloat(t)); if (/^-?\d{1,3}\.\d{3}$/.test(t)) opts.add(parseFloat(t.replace('.', '')));
  }
  return [...opts].filter((v) => isFinite(v));
}
const isE = (v) => v > 160000 && v < 840000, isN = (v) => v > 6500000 && v < 8100000;
function parseDMS(s) {
  const out = [];
  const re = /(-?\d+(?:[.,]\d+)?)\s*°\s*(?:(\d+(?:[.,]\d+)?)\s*['′’]\s*)?(?:(\d+(?:[.,]\d+)?)\s*(?:["″”]|'')\s*)?([NSEWOnsewo])?/g;
  let m;
  while ((m = re.exec(s))) {
    let v = Math.abs(parseFloat(m[1].replace(',', '.'))) + (m[2] ? parseFloat(m[2].replace(',', '.')) / 60 : 0) + (m[3] ? parseFloat(m[3].replace(',', '.')) / 3600 : 0);
    if (m[1].startsWith('-') || /[SWOswo]/.test(m[4] || '')) v = -v;
    out.push(v);
  }
  return out;
}
function parseCoords(text) {
  const pts = []; let kind = null, skipped = 0;
  for (const line of text.split(/\n|;/)) {
    if (!line.trim()) continue;
    let got = null;
    if (line.includes('°')) {
      const d = parseDMS(line);
      if (d.length >= 2) { const [a, b] = Math.abs(d[0]) <= 90 && Math.abs(d[1]) > 40 ? d : [d[1], d[0]]; got = UTM.fwd(a, b); kind = kind || 'latlon'; }
    } else {
      const toks = line.match(/-?\d{1,3}(?:[ \u00a0]\d{3})+(?:[.,]\d+)?(?!\d)|-?\d[\d.,]*/g) || [];
      const nums = toks.map(numberOptions);
      for (let i = 0; i < nums.length - 1 && !got; i++) {
        for (const a of nums[i]) for (const b of nums[i + 1]) {
          if (got) break;
          if (isE(a) && isN(b)) { got = [a, b]; kind = kind || 'utm'; }
          else if (isN(a) && isE(b)) { got = [b, a]; kind = kind || 'utm'; }
          else if (a < -15 && a > -35 && b < -45 && b > -70) { got = UTM.fwd(a, b); kind = kind || 'latlon'; }
          else if (b < -15 && b > -35 && a < -45 && a > -70) { got = UTM.fwd(b, a); kind = kind || 'latlon'; }
        }
      }
    }
    if (got) pts.push(got); else skipped++;
  }
  return { pts, kind, skipped };
}
function geojsonOf(b) {
  const ring = b.utm.map(([E, N]) => { const [lat, lon] = UTM.inv(E, N); return [+lon.toFixed(8), +lat.toFixed(8)]; });
  if (ring.length > 2) ring.push(ring[0]);
  const a = ringArea(b.utm);
  return { type: 'Feature', properties: { name: b.name, area_ha: +a.ha.toFixed(4), perimeter_m: +a.m.toFixed(2), utm_21s: b.utm },
    geometry: ring.length > 3 ? { type: 'Polygon', coordinates: [ring] } : { type: 'LineString', coordinates: ring } };
}
function loadOfficial(fc) {
  OFFICIAL = [];
  for (const f of fc.features || []) {
    const g = f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : g.type === 'LineString' ? [[g.coordinates]] : [];
    const pr = f.properties || {};
    for (const poly of polys) {
      // Surveyed corners are kept exactly as printed on the plan when the file carries them.
      const ring = polys.length === 1 && Array.isArray(pr.utm_21s) && pr.utm_21s.length > 2
        ? pr.utm_21s.map(([E, N]) => [+E, +N])
        : poly[0].map(([lon, lat]) => UTM.fwd(lat, lon));
      if (ring.length > 2 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring.pop();
      OFFICIAL.push({ id: String(pr.id || 'survey-' + OFFICIAL.length), name: pr.name || 'Boundary', utm: ring, official: true, closed: g.type !== 'LineString',
        color: pr.color || '#e9bf5a', dash: !!pr.dash, measure: pr.measure || 'Survey', props: pr });
    }
  }
}

/* ------------------------------------------------------------ build -- */
const HILL_SKY = {};
async function buildHill() {
  const [meta, ter, trees, ctx, layers, img, legends, sites, objects] = await Promise.all([
    getJSON('data/meta.json'), getJSON('data/terrain.json'), getJSON('data/trees.json'), getJSON('data/context.json'),
    getJSON('data/layers.geojson').catch(() => ({ features: [] })), loadImage('data/imagery.jpg'),
    getJSON('data/basemaps.json').catch(() => ({})), loadSites(), getJSON('data/objects.json').catch(() => ({ objects: [] })),
    getJSON('data/tour.json').then((p) => (TOUR = p)).catch(() => []),
    new THREE.TextureLoader().loadAsync('data/walk/sky.jpg').then((t) => (HILL_SKY.tex = t)).catch(() => null),      // the sky of the renders
    getJSON('data/walk/world.json').then((w) => (HILL_SKY.W = w)).catch(() => null),
  ]);
  LEGENDS = legends; SITES = sites; OBJECTS = objects;
  prepCuts();
  META = meta; CTX = ctx;
  HG = ter.grid; HRES = ter.res; HHALF = meta.half; HBASE = ter.base;
  const raw = new Uint16Array(b64bytes(ter.data).buffer);
  HE = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) HE[i] = HBASE + raw[i] / ter.scale;
  refineTerrain();
  {
    const u = b64bytes(trees.data), dv = new DataView(u.buffer), n = trees.count;
    treeData = { count: n, x: new Float32Array(n), z: new Float32Array(n), h: new Float32Array(n), r: new Float32Array(n) };
    for (let i = 0; i < n; i++) {
      const o = i * 6;
      treeData.x[i] = dv.getInt16(o, true) / 10; treeData.z[i] = dv.getInt16(o + 2, true) / 10;
      treeData.h[i] = dv.getUint8(o + 4) / 10; treeData.r[i] = dv.getUint8(o + 5) / 10;
    }
    if (small && SITES.length) {
      // Phones draw only the tallest 32k trees: put every tree inside a site photo first so none of those is cut.
      const ins = Uint8Array.from(treeData.x, (x, i) => SITES.some((p) => x >= p.x0 && x < p.x1 && treeData.z[i] >= p.z0 && treeData.z[i] < p.z1));
      const order = Array.from(ins.keys()).sort((a, b) => ins[b] - ins[a]);
      for (const k of ['x', 'z', 'h', 'r']) { const src = treeData[k]; treeData[k] = Float32Array.from(order, (i) => src[i]); }
    }
  }
  {
    const [c, g] = canvas(img.width, img.height);
    g.drawImage(img, 0, 0); imgPx = g.getImageData(0, 0, img.width, img.height).data; imgW = img.width;
  }
  loadOfficial(layers);

  const scene = hill.scene;
  const sunDir = new THREE.Vector3(0.86, 0.3, 0.41).normalize();       // golden hour: early morning, low in the east-south-east
  scene.environment = skyEnvironment(sunDir); scene.environmentIntensity = 0.65;
  if (HILL_SKY.tex && HILL_SKY.W) {
    // The sky Blender rendered from the site, the one in the tour and free roam (js/look.js), so every view has
    // one sky; the haze toward the horizon takes its colour, so the far edge of the model melts into it.
    const t = HILL_SKY.tex; t.wrapS = THREE.RepeatWrapping; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    const U = { uSky: { value: t }, uSkyK: { value: HILL_SKY.W.skyScale * SKY_GAIN }, uHaze: { value: 0 }, uDim: { value: new THREE.Vector3(1, 1, 1) } };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
      uniforms: U, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main() { vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `${LOOK.SKY} varying vec3 vDir; void main() { vec3 d = normalize(vDir); gl_FragColor = vec4(skyAt(vec3(d.x, max(d.y, 0.012), d.z)), 1.0);
${LOOK.OUT}
}`,
    }));
    dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
    const hz = LOOK.horizonColor({ sky: t, W: HILL_SKY.W }).multiplyScalar(SKY_GAIN);
    scene.background = hz; scene.fog = new THREE.FogExp2(hz, 0.00008);
  } else {
    const HAZE = new THREE.Color(0xb9c3c9);
    scene.background = HAZE.clone(); scene.fog = new THREE.FogExp2(HAZE, 0.00007);
    scene.add(physicalSky(sunDir, 30000));
  }
  scene.add(new THREE.HemisphereLight(0x9db4d4, 0x4a3d30, 0.55));
  const sun = new THREE.DirectionalLight(0xffbf80, 3.6);
  hill.sun = sun; hill.sunDir = sunDir;
  FOL.uSunDir.value.copy(sunDir); FOL.uSunCol.value.set(0xffb870);
  sun.position.copy(sunDir).multiplyScalar(5000); sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 2048 : 4096, small ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -2300, right: 2300, top: 2300, bottom: -2300, near: 2000, far: 9000 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);

  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; t.needsUpdate = true;
  baseTex.satellite = t; hill.base = 'satellite';
  const [oc, og] = canvas(small ? 2048 : 4096, small ? 2048 : 4096);
  const otex = new THREE.CanvasTexture(oc); otex.colorSpace = THREE.SRGBColorSpace; otex.anisotropy = ANISO; otex.premultiplyAlpha = true;
  overlay = { c: oc, g: og, tex: otex };
  hill.terrainMat = contourMaterial(t, otex);
  hill.insertMat = contourMaterial(t, otex, hill.terrainMat);
  hill.terrain = new THREE.Mesh(terrainGeometry(), hill.terrainMat);
  hill.terrain.receiveShadow = true;
  scene.add(hill.terrain);
  hill.skirt = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0x4a3b2e, roughness: 1, side: THREE.DoubleSide }));
  scene.add(hill.skirt);

  hill.trees = buildTrees(); scene.add(hill.trees);
  hill.pin = new THREE.Group();
  {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 30, 8), new THREE.MeshBasicMaterial({ color: 0xe9bf5a }));
    stem.position.y = 15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe9bf5a }));
    head.position.y = 31;
    hill.pin.add(stem, head); hill.pin.visible = false; scene.add(hill.pin);
  }
  relayout();
  loadImage('data/landcover.png').then((im) => {
    const [c, g] = canvas(im.width, im.height);
    g.drawImage(im, 0, 0); lcPx = g.getImageData(0, 0, im.width, im.height).data; lcW = im.width;
  }).catch(() => {});
  if (display.base !== 'satellite') setBase(display.base);
  SITES.forEach((p, i) => {
    const t = new THREE.Texture(p.img);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; t.needsUpdate = true;
    hill.terrainMat.userData.u['uP' + i].value = t;
  });
  showSitePhotos();
}
/* Site photos: the owner's own sharper satellite views of parts of the site (data/sites.json). */
async function loadSites() {
  let list = [];
  try { list = ((await getJSON('data/sites.json')).patches || []).slice(0, 4); } catch (e) { return []; }
  const ok = await Promise.all(list.map(async (p) => {
    try {
      p.img = await loadImage('data/' + p.file);
      const [c, g] = canvas(p.img.width, p.img.height);
      g.drawImage(p.img, 0, 0); p.px = g.getImageData(0, 0, c.width, c.height).data; p.w = c.width; p.h = c.height;
      return p;
    } catch (err) { console.error(err); return null; }
  }));
  return ok.filter(Boolean);
}
/* Where a site photo shows, its own roads are the truth: the map's road ribbons step aside. */
function underPhoto(x, z) {
  if (!hill.photosOn) return false;
  for (const p of SITES) {
    if (x < p.x0 || x >= p.x1 || z < p.z0 || z >= p.z1) continue;
    const u = Math.floor(((x - p.x0) / (p.x1 - p.x0)) * p.w), v = Math.floor(((z - p.z0) / (p.z1 - p.z0)) * p.h);
    if (p.px[(v * p.w + u) * 4 + 3] > 150) return true;
  }
  return false;
}
/* Site photos only sit on the satellite base, where their colours belong. */
function showSitePhotos() {
  const on = display.sitePhoto && hill.base === 'satellite' && SITES.length > 0;
  if (hill.terrainMat) hill.terrainMat.userData.u.uPatchOn.value = on ? 1 : 0;
  if (on !== !!hill.photosOn) {
    hill.photosOn = on;
    if (hill.roads) { hill.scene.remove(hill.roads); hill.roads.geometry.dispose(); hill.roads = buildRoads(); hill.roads.visible = hill.on.roads; hill.scene.add(hill.roads); }
  }
  creditEl.hidden = !on || mode !== 'cerro';
  creditEl.textContent = 'Site photo: ' + [...new Set(SITES.map((p) => p.credit))].join(' · ');
}

/* Everything that sits on the ground, recomputed when the relief scale changes. */
function relayout() {
  renderer.shadowMap.needsUpdate = true;
  setTerrainY(hill.terrain.geometry);
  hill.terrainMat.userData.u.uVS.value = hill.vs;
  hill.skirt.geometry.dispose(); hill.skirt.geometry = skirtGeometry();
  placeTrees(hill.trees);
  if (hill.buildings) { hill.scene.remove(hill.buildings); hill.buildings.geometry.dispose(); }
  if (hill.roads) { hill.scene.remove(hill.roads); hill.roads.geometry.dispose(); }
  hill.buildings = buildBuildings(); hill.roads = buildRoads();
  hill.scene.add(hill.buildings, hill.roads);
  if (hill.structures) { hill.scene.remove(hill.structures); hill.structures.traverse((c) => c.geometry && c.geometry.dispose()); }
  hill.structures = buildStructures(); hill.scene.add(hill.structures);
  applyLayers();
  refreshCurtains();
  drawOverlay();
  for (const l of hill.labels || []) l.anchor.y = yAt(l.x, l.z) + l.lift;
  if (hill.notes) rebuildNoteMeshes();
  if (hill.pin.visible) hill.pin.position.y = yAt(hill.pin.position.x, hill.pin.position.z);
}
function applyLayers() {
  renderer.shadowMap.needsUpdate = true;
  hill.trees.visible = hill.on.trees;
  hill.buildings.visible = hill.on.buildings;
  if (hill.structures) hill.structures.visible = hill.on.buildings;
  hill.roads.visible = hill.on.roads;
  hill.terrainMat.userData.u.uOn.value = hill.on.contours ? 1 : 0;
}

/* ------------------------------------------------------- base maps -- */
/* What the ground shows. Image layers are made by data/build/build.py; the ones that come from
   elevation alone (topographic, relief, slope) are drawn here from the terrain grid. */
let LEGENDS = {}, lcPx = null, lcW = 0, SITES = [];
const CREAM = new THREE.Color(1, 0.93, 0.72), BROWN = new THREE.Color(0x4a3220);
const TOPO = [[110, '#8fb68c'], [140, '#bcd197'], [170, '#e4e2a8'], [200, '#e9cd95'], [230, '#d6a974'], [260, '#b9875c'], [290, '#efe6da']];
const SLOPE = [[5, '#eef0dc', '0–5°', 'flat to gentle'], [10, '#e9d27a', '5–10°', 'moderate'], [20, '#e19a45', '10–20°', 'steep'], [30, '#c45a32', '20–30°', 'very steep'], [91, '#7f2a24', 'over 30°', 'extreme']];
const gradientCSS = (stops, colors) => { const a = stops[0], b = stops[stops.length - 1]; return `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${(((stops[i] - a) / (b - a)) * 100).toFixed(1)}%`).join(', ')})`; };
const BASES = {
  satellite: { label: 'Satellite', file: 'data/imagery.jpg', trees: true, line: CREAM, swatch: 'linear-gradient(135deg, #29432a, #56743f 55%, #a2865f)' },
  topo: { label: 'Topographic', make: topoMap, contours: true, line: BROWN, swatch: gradientCSS(TOPO.map((t) => t[0]), TOPO.map((t) => t[1])) },
  relief: { label: 'Shaded relief', make: reliefMap, line: BROWN, swatch: 'linear-gradient(135deg, #f4f0e8, #b9b2a6 50%, #5d5850)' },
  slope: { label: 'Slope', make: slopeMap, line: BROWN, swatch: `linear-gradient(90deg, ${SLOPE.map((c) => c[1]).join(', ')})` },
  landcover: { label: 'Land cover', file: 'data/landcover.png', line: CREAM, swatch: 'linear-gradient(90deg, #2f6e40 0 62%, #d3dc8f 62% 86%, #c8553d 86%)' },
  canopy: { label: 'Tree height', file: 'data/canopy.jpg', line: BROWN, swatch: 'linear-gradient(90deg, #ece6d4, #bfd886 30%, #4c9a4b 60%, #0b3a31)' },
  ndvi: { label: 'Vegetation index', file: 'data/ndvi.jpg', line: BROWN, swatch: 'linear-gradient(90deg, #7d6a57, #ddd08f 35%, #72ab54 70%, #1a5531)' },
  infrared: { label: 'Infrared', file: 'data/falsecolor.jpg', line: CREAM, swatch: 'linear-gradient(135deg, #c8164a, #8a4f78 55%, #7fd0d4)' },
};
const baseTex = {};
let baseWant = 'satellite';
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function rampRGB(v, stops) {
  if (v <= stops[0][0]) return hexRGB(stops[0][1]);
  for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (v - a) / (b - a), A = hexRGB(ca), B = hexRGB(cb);
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
  }
  return hexRGB(stops[stops.length - 1][1]);
}
/* Light on the bare ground, per fine-grid vertex. lights: [x, y, z, weight], pointing at the light. zf exaggerates relief. */
function hillshade(zf, lights) {
  const n = HFN, d = 2 * HFRES, out = new Float32Array(n * n);
  const L = lights.map(([x, y, z, w]) => { const k = Math.hypot(x, y, z); return [x / k, y / k, z / k, w]; });
  const flat = L.reduce((a, l) => a + l[3] * l[1], 0);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const gx = ((HF[r * n + Math.min(c + 1, n - 1)] - HF[r * n + Math.max(c - 1, 0)]) / d) * zf;
    const gz = ((HF[Math.min(r + 1, n - 1) * n + c] - HF[Math.max(r - 1, 0) * n + c]) / d) * zf;
    const k = 1 / Math.hypot(gx, 1, gz);
    let sum = 0;
    for (const [lx, ly, lz, w] of L) sum += w * Math.max(0, (-gx * lx + ly - gz * lz) * k);
    out[r * n + c] = sum / flat;                    // 1 on flat ground
  }
  return out;
}
function gridCanvas(paint) {
  const n = HFN, [c, g] = canvas(n, n), im = g.createImageData(n, n), px = im.data, rgb = [0, 0, 0];
  for (let i = 0; i < n * n; i++) { paint(i, rgb); px[i * 4] = rgb[0]; px[i * 4 + 1] = rgb[1]; px[i * 4 + 2] = rgb[2]; px[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  return c;
}
const NW = [[-1, 1.4, -1, 1]];
function topoMap() {
  const sh = hillshade(2, NW);
  const small1 = gridCanvas((i, o) => { const c = rampRGB(HF[i], TOPO), k = clamp(0.4 + 0.6 * sh[i], 0.5, 1.15); o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k; });
  const W = small ? 1536 : 2048, [c, g] = canvas(W, W);
  g.imageSmoothingQuality = 'high'; g.drawImage(small1, 0, 0, W, W);
  contourLabels(c, g);
  return c;
}
function reliefMap() {
  const sh = hillshade(2.5, [[-1, 1.2, -1, 0.5], [-1, 1.2, 0.3, 0.25], [0.3, 1.2, -1, 0.25]]);
  const A = hexRGB('#4f4a43'), B = hexRGB('#f7f3eb');
  return gridCanvas((i, o) => { const t = clamp(0.66 * sh[i] + 0.04, 0, 1); for (let k = 0; k < 3; k++) o[k] = A[k] + (B[k] - A[k]) * t; });
}
function slopeMap() {
  const sh = hillshade(1.5, NW), n = HFN, d = 2 * HFRES, cols = SLOPE.map((c) => hexRGB(c[1]));
  return gridCanvas((i, o) => {
    const r = (i / n) | 0, c = i % n;
    const gx = (HF[r * n + Math.min(c + 1, n - 1)] - HF[r * n + Math.max(c - 1, 0)]) / d, gz = (HF[Math.min(r + 1, n - 1) * n + c] - HF[Math.max(r - 1, 0) * n + c]) / d;
    const deg = (Math.atan(Math.hypot(gx, gz)) * 180) / Math.PI, col = cols[SLOPE.findIndex((s) => deg < s[0])], k = clamp(0.8 + 0.2 * sh[i], 0.7, 1.08);
    o[0] = col[0] * k; o[1] = col[1] * k; o[2] = col[2] * k;
  });
}
/* Elevation numbers on the 50 m contours, reading uphill. The map's alpha marks where they sit,
   so the contour shader leaves a gap for them. */
function contourLabels(c, g) {
  const W = c.width, k = W / (2 * HHALF), fs = Math.round(W / 92), cand = [];
  for (let L = Math.ceil(HLO / 50) * 50; L < HHI; L += 50) {
    for (let r = 6; r < HG - 6; r += 10) for (let q = 6; q < HG - 7; q++) {
      const a = HE[r * HG + q] - L, b = HE[r * HG + q + 1] - L, a2 = HE[q * HG + r] - L, b2 = HE[(q + 1) * HG + r] - L;
      if (a * b < 0) cand.push([L, -HHALF + (q + a / (a - b)) * HRES, -HHALF + r * HRES]);
      if (a2 * b2 < 0) cand.push([L, -HHALF + r * HRES, -HHALF + (q + a2 / (a2 - b2)) * HRES]);
    }
  }
  cand.sort((p, q) => hash2(p[1] | 0, p[2] | 0) - hash2(q[1] | 0, q[2] | 0));
  const picks = [];
  for (let [L, x, z] of cand) {
    let gx = 0, gz = 0, m = 0;
    for (let it = 0; it < 3; it++) {                  // settle onto the smooth surface the shader draws
      gx = (groundAt(x + 12, z) - groundAt(x - 12, z)) / 24; gz = (groundAt(x, z + 12) - groundAt(x, z - 12)) / 24; m = gx * gx + gz * gz;
      if (m < 1e-6) break;
      const e = groundAt(x, z) - L; x -= (e * gx) / m; z -= (e * gz) / m;
    }
    if (Math.sqrt(m) < 0.04 || Math.abs(x) > HHALF - 150 || Math.abs(z) > HHALF - 150) continue;
    if (picks.some((p) => Math.hypot(p.x - x, p.z - z) < (p.L === L ? 850 : 260))) continue;
    picks.push({ L, x, z, gx, gz });
  }
  const [mc2, mg] = canvas(W, W);
  g.font = `600 ${fs}px "IBM Plex Mono", ui-monospace, monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#5b3f26';
  for (const p of picks) {
    let ang = Math.atan2(p.gx, -p.gz);
    if (Math.sin(ang) * p.gx - Math.cos(ang) * p.gz < 0) ang += Math.PI;   // the tops of the numbers face uphill
    const w = g.measureText(String(p.L)).width + fs * 0.7, h = fs * 1.25;
    for (const [ctx, draw] of [[g, () => g.fillText(String(p.L), 0, 0)], [mg, () => { mg.fillStyle = '#fff'; mg.fillRect(-w / 2, -h / 2, w, h); }]]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2 + p.x * k, W / 2 + p.z * k); ctx.rotate(ang); draw();
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  const im = g.getImageData(0, 0, W, W), mk = mg.getImageData(0, 0, W, W).data;
  for (let i = 3; i < mk.length; i += 4) if (mk[i] > 40) im.data[i] = 245;
  g.putImageData(im, 0, 0);
}
async function baseTexture(id) {
  if (baseTex[id]) return baseTex[id];
  const b = BASES[id];
  let t;
  if (b.file) { t = new THREE.Texture(await loadImage(b.file)); t.needsUpdate = true; }
  else t = new THREE.CanvasTexture(b.make());
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
  return (baseTex[id] = t);
}
async function setBase(id) {
  if (!BASES[id]) id = 'satellite';
  baseWant = id;
  let t;
  try { t = await baseTexture(id); }
  catch (err) { console.error(err); if (baseWant === id) { display.base = hill.base; applyDisplay(); if (!displayEl.hidden) renderDisplay(); } return; }
  if (baseWant !== id) return;
  const b = BASES[id], u = hill.terrainMat.userData.u;
  hill.terrainMat.map = t; hill.insertMat.map = t;
  u.uLine.value.copy(b.line); u.uLineK.value = b.line === CREAM ? 0.8 : 0.6; u.uPhoto.value = id === 'satellite' ? 1 : 0;
  hill.base = id;
  showSitePhotos();
}
/* ESA WorldCover class under a point, read from the land cover map. */
function landcoverAt(x, z) {
  if (!lcPx || !LEGENDS.landcover) return null;
  const u = clamp(Math.floor(((x + HHALF) / (2 * HHALF)) * lcW), 0, lcW - 1), v = clamp(Math.floor(((z + HHALF) / (2 * HHALF)) * lcW), 0, lcW - 1), k = (v * lcW + u) * 4;
  return LEGENDS.landcover.find((c) => { const [r, g, b] = hexRGB(c.color); return r === lcPx[k] && g === lcPx[k + 1] && b === lcPx[k + 2]; }) || null;
}

/* Named places from Overture. Points stacked on one spot are geocoding guesses, so they are left out. */
const LODGING = new Set(['lodging', 'hotel', 'private_lodging', 'campground', 'resort']);
function hillLabels() {
  const seen = new Map();
  for (const p of CTX.places) { const k = p.x.toFixed(0) + ',' + p.z.toFixed(0); seen.set(k, (seen.get(k) || 0) + 1); }
  const out = [];
  const s = META.summit;
  out.push({ name: 'Cerro Kavaju', sub: `Summit · ${Math.round(s.surface_m)} m`, x: s.x, z: s.z, lift: 45, c: 'var(--gold)', far: 9000, cat: 'summit' });
  const names = new Set(['Cerro Kavaju']);
  for (const p of CTX.places) {
    const k = p.x.toFixed(0) + ',' + p.z.toFixed(0), n = (p.n || '').trim();
    if (!n || names.has(n) || seen.get(k) > 2 || p.k === 'mountain') continue;
    names.add(n);
    const lodging = LODGING.has(p.k);
    out.push({ name: n, sub: lodging ? 'Lodging' : (p.k || '').replace(/_/g, ' '), x: p.x, z: p.z, lift: 22, c: lodging ? 'var(--earth)' : 'var(--muted)', far: lodging ? 5000 : 2600, cat: lodging ? 'lodging' : 'places' });
  }
  for (const o of OBJECTS.objects) {
    if (!['house', 'solar', 'pond', 'quincho', 'cabin'].includes(o.type)) continue;
    const [x, z] = o.ring ? [o.ring.reduce((a, p) => a + p[0], 0) / o.ring.length, o.ring.reduce((a, p) => a + p[1], 0) / o.ring.length] : [o.x, o.z];
    out.push({ name: o.name, x, z, lift: o.type === 'house' ? 12 : 7, c: 'var(--sand)', far: 420, cat: 'site', site: o });
  }
  return out.map((l) => ({ ...l, anchor: new THREE.Vector3(l.x, yAt(l.x, l.z) + l.lift, l.z) }));
}
/* Details of one structure, from the drone photos. */
function showStructure(o) {
  const [x, z] = o.ring ? [o.ring.reduce((a, p) => a + p[0], 0) / o.ring.length, o.ring.reduce((a, p) => a + p[1], 0) / o.ring.length] : o.path ? o.path[Math.floor(o.path.length / 2)] : [o.x, o.z];
  const [E, N] = toUTM(x, z), [lat, lon] = UTM.inv(E, N);
  const facts = [['UTM 21S', `${fmt(E, 0)} E, ${fmt(N, 0)} N`], ['Ground', `≈ ${groundAt(x, z).toFixed(0)} m`]];
  if (o.w && o.d) facts.push(['Footprint', `≈ ${o.w} × ${o.d} m`]);
  if (o.ring) facts.push(['Water', `≈ ${fmt(ringArea(o.ring.map(([px, pz]) => toUTM(px, pz))).ha * 10000, 0)} m²`]);
  if (o.path) facts.push(['Length', `≈ ${fmt(o.path.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - o.path[i][0], p[1] - o.path[i][1]), 0), 0)} m`]);
  const text = `${o.name}: ${lat.toFixed(6)}, ${lon.toFixed(6)}\nUTM 21S: ${E.toFixed(1)} E, ${N.toFixed(1)} N`;
  openDrawer('On the site', o.name, o.note || null, facts, [['Copy coordinates', (b) => copyText(text, b)]], 'var(--sand)', OBJECTS.source);
}
/* The camera of the owner's wide drone photo, so the model can be checked against it. */
function homesteadView() {
  // Framed on the middle of the buildings, from the bearing of the owner's view, about 45° down: an aerial view,
  // far enough that the hand-built props and the 1 m imagery do not read as toys up close.
  const v = OBJECTS.view, b = (v.bearing * Math.PI) / 180, p = -0.8;
  const at = (o) => (o.ring ? o.ring.reduce((a, q) => [a[0] + q[0] / o.ring.length, a[1] + q[1] / o.ring.length], [0, 0]) : [o.x, o.z]);
  const ss = OBJECTS.objects.filter((o) => ['house', 'solar', 'pond', 'quincho', 'cabin', 'tent', 'oven'].includes(o.type)).map(at);
  const cx = ss.reduce((a, q) => a + q[0], 0) / ss.length, cz = ss.reduce((a, q) => a + q[1], 0) / ss.length;
  const dir = new THREE.Vector3(Math.sin(b) * Math.cos(p), Math.sin(p), -Math.cos(b) * Math.cos(p));
  const tgt = new THREE.Vector3(cx, yAt(cx, cz), cz), pos = tgt.clone().addScaledVector(dir, innerWidth / innerHeight < 1 ? -150 : -105);
  flyTo(pos, tgt, 1800);
}
