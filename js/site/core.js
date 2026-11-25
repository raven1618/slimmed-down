/* The basics every part uses: small helpers, the site data, the renderer, procedural textures and shared
   geometry. Runs first.
   One of the page's scripts in js/site/: they run in order and share one scope (see index.html). */
'use strict';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const LOOK_SPEED = 1.15;          // look-around speed in the tour and free roam: radians per screen height, times the field of view
const TREE_GAIN = 1.7;            // the photographed trees' brightness on the hill, against the satellite ground
const SKY_GAIN = 0.85;            // the Blender sky on the hill (ACES, exposure 1) against the renders (AgX, +0.5)
const $ = (id) => document.getElementById(id);
const loaderText = $('loader-text');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function fail(msg) {
  loaderText.className = 'err';
  loaderText.textContent = msg;
  $('loader-plan').hidden = false;
  window.__ohReady = true;
}

/* ------------------------------------------------------------- noise -- */
function hash2(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s / 0.9375;
}
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function inPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/* -------------------------------------------------------------- data -- */
/* ---------------------------------------------------------- renderer -- */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  fail('This browser cannot show the 3D view. The plan still works.');
  throw err;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.75 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
$('stage').appendChild(renderer.domElement);
const ANISO = renderer.capabilities.getMaxAnisotropy();
const pmrem = new THREE.PMREMGenerator(renderer);
const ENV = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* Daylight: a physically based sky, and the same sky (over a brown-green ground) as the light
   that fills shadows and shows in glass and water. */
function physicalSky(sunDir, scale) {
  const sky = new Sky(), u = sky.material.uniforms;
  sky.scale.setScalar(scale);
  u.turbidity.value = 5; u.rayleigh.value = 2.4; u.mieCoefficient.value = 0.0042; u.mieDirectionalG.value = 0.84;
  u.sunPosition.value.copy(sunDir);
  sky.material.fragmentShader = sky.material.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );', 'gl_FragColor = vec4( min( retColor * 0.62, vec3( 24.0 ) ), 1.0 );');
  return sky;
}
function skyEnvironment(sunDir) {
  const s = new THREE.Scene();
  s.add(physicalSky(sunDir, 900));
  const ground = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16, 0, Math.PI * 2, Math.PI / 2 + 0.02, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4d4a35, side: THREE.BackSide }));
  s.add(ground);
  return pmrem.fromScene(s, 0.02, 1, 2000).texture;
}
/* Value noise and bump mapping for the shaders that dress the ground and the leaves. */
const GLSL_NOISE = LOOK.NOISE + `
vec3 ohBump(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sx = dFdx(surfPos), sy = dFdy(surfPos);
  float lx = length(sx), ly = length(sy);
  if (lx < 1e-6 || ly < 1e-6) return surfNorm;
  sx /= lx; sy /= ly;
  vec3 r1 = cross(sy, surfNorm), r2 = cross(surfNorm, sx);
  float det = dot(sx, r1) * faceDir;
  vec3 n = abs(det) * surfNorm - sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  float ln = length(n);
  return ln > 1e-6 ? n / ln : surfNorm;
}`;
/* Leaves: clumps of light and shade across every crown, light coming through when you look toward
   the sun, and a slow breeze. One set of uniforms drives every tree material. */
const FOL = { uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(0xfff0d0) } };
function foliage(mat, { scale = 1, wind = 0.05, trans = 0.45, instanced = true } = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, FOL);
    const M = instanced ? 'modelMatrix * instanceMatrix' : 'modelMatrix';
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; varying vec3 vOhW;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec3 o = (${M} * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float ph = o.x * 0.11 + o.z * 0.07, up = max(position.y - 0.35, 0.0);
          transformed.x += sin(uTime * 1.3 + ph) * ${wind.toFixed(3)} * up;
          transformed.z += cos(uTime * 1.1 + ph * 1.3) * ${(wind * 0.7).toFixed(3)} * up; }`)
      .replace('#include <project_vertex>', `#include <project_vertex>\nvOhW = (${M} * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSunDir; uniform vec3 uSunCol; varying vec3 vOhW;' + GLSL_NOISE)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float ohD = length(vViewPosition), ohF = 1.0 - smoothstep(${(140 / scale).toFixed(1)}, ${(900 / scale).toFixed(1)}, ohD);
        float ohC = ohNoise(vOhW * ${(0.9 * scale).toFixed(3)}) * 0.62 + ohNoise(vOhW * ${(2.9 * scale).toFixed(3)} + 7.3) * 0.38;
        float ohBig = ohNoise(vOhW * ${(0.07 * scale).toFixed(4)} + 3.1);
        diffuseColor.rgb *= (0.86 + 0.28 * ohBig) * mix(1.0, 0.78 + 0.44 * ohC, ohF);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 1.08, 0.8), smoothstep(0.62, 0.9, ohC) * 0.6 * ohF);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = ohBump(-vViewPosition, normal, vec2(dFdx(ohC), dFdy(ohC)) * 0.9 * ohF, faceDirection);`)
      .replace('#include <opaque_fragment>', `{ vec3 vd = normalize(vOhW - cameraPosition);
          float tr = pow(max(dot(vd, uSunDir), 0.0), 5.0) * ${trans.toFixed(2)};
          outgoingLight += diffuseColor.rgb * uSunCol * tr * (0.4 + 0.6 * ohC); }
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => `fol${scale}:${wind}:${trans}:${instanced}`;
  return mat;
}

/* ---------------------------------------------------------- textures -- */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep);
  return t;
}
function rammedEarth() {
  const r = rng(11), [c, g] = canvas(1024, 1024);
  const pal = ['#c9a283', '#bd9274', '#d4b597', '#b48468', '#c79d80', '#dcc2a6', '#b98d72', '#cfab8d', '#c2967a', '#a97b62'];
  let y = 0;
  while (y < 1024) {
    const h = 10 + r() * 34;
    const top = pal[Math.floor(r() * pal.length)], bot = pal[Math.floor(r() * pal.length)];
    const grd = g.createLinearGradient(0, y, 0, y + h);
    grd.addColorStop(0, top); grd.addColorStop(1, bot);
    g.fillStyle = grd;
    g.fillRect(0, y, 1024, h + 1);
    for (let k = 0; k < 60; k++) {
      g.fillStyle = r() < 0.5 ? `rgba(80,45,25,${r() * 0.08})` : `rgba(255,240,215,${r() * 0.08})`;
      g.fillRect(r() * 1024, y + r() * h, 30 + r() * 200, 1 + r() * 3);
    }
    g.fillStyle = 'rgba(80,45,28,0.08)'; g.fillRect(0, y + h - 1.5, 1024, 1.5);
    y += h;
  }
  for (let i = 0; i < 4000; i++) {
    const d = r() < 0.7;
    g.fillStyle = d ? `rgba(70,40,25,${0.1 + r() * 0.22})` : `rgba(250,235,215,${0.06 + r() * 0.14})`;
    const s = 0.8 + r() * 2.4;
    g.fillRect(r() * 1024, r() * 1024, s, s * (0.6 + r() * 0.6));
  }
  return tex(c);
}
function woodTex(base = '#7a5233') {
  const r = rng(5), [c, g] = canvas(512, 512);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    const y = i * 32;
    g.fillStyle = `rgba(${r() < 0.5 ? '40,22,10' : '255,220,170'},${0.05 + r() * 0.1})`;
    g.fillRect(0, y, 512, 32);
    g.fillStyle = 'rgba(25,14,6,0.55)'; g.fillRect(0, y + 31, 512, 1.5);
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(30,16,6,${r() * 0.12})`; g.fillRect(r() * 512, y + r() * 30, 40 + r() * 160, 1); }
  }
  return tex(c);
}
function grassTex(seed = 3, dry = 0.4) {
  const r = rng(seed), [c, g] = canvas(512, 512);
  g.fillStyle = '#6f7a40'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 60;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() < dry ? '160,140,85' : (r() < 0.5 ? '78,104,46' : '96,118,54');
    grd.addColorStop(0, `rgba(${col},0.35)`); grd.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 16000; i++) {
    const x = r() * 512, y = r() * 512, l = 2 + r() * 6;
    g.strokeStyle = r() < dry * 0.6 ? `rgba(200,180,120,${0.25 + r() * 0.3})` : `rgba(${40 + r() * 50},${70 + r() * 60},${20 + r() * 30},${0.3 + r() * 0.4})`;
    g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2, y - l); g.stroke();
  }
  return tex(c);
}
function solarTex() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#121a2a'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) {
    const grd = g.createLinearGradient(0, j * 25.6, 0, j * 25.6 + 25);
    grd.addColorStop(0, '#22324f'); grd.addColorStop(1, '#16223a');
    g.fillStyle = grd; g.fillRect(i * 42.6 + 1.5, j * 25.6 + 1.5, 39.6, 22.6);
  }
  return tex(c);
}
function courtTex() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#b8603b'; g.fillRect(0, 0, 512, 256);
  const r = rng(9);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,40,20' : '230,150,110'},${r() * 0.12})`; g.fillRect(r() * 512, r() * 256, 2, 2); }
  const k = 512 / 36.6, ox = (36.6 - 23.77) / 2 * k, oy = (18.3 - 10.97) / 2 * k;
  g.strokeStyle = 'rgba(250,245,235,0.95)'; g.lineWidth = 1.6;
  g.strokeRect(ox, oy, 23.77 * k, 10.97 * k);
  const sy = oy + 1.37 * k, sh = 8.23 * k;
  g.beginPath();
  g.moveTo(ox, sy); g.lineTo(ox + 23.77 * k, sy);
  g.moveTo(ox, sy + sh); g.lineTo(ox + 23.77 * k, sy + sh);
  g.moveTo(ox + (23.77 / 2 - 6.4) * k, sy); g.lineTo(ox + (23.77 / 2 - 6.4) * k, sy + sh);
  g.moveTo(ox + (23.77 / 2 + 6.4) * k, sy); g.lineTo(ox + (23.77 / 2 + 6.4) * k, sy + sh);
  g.moveTo(ox + (23.77 / 2 - 6.4) * k, 128); g.lineTo(ox + (23.77 / 2 + 6.4) * k, 128);
  g.stroke();
  g.strokeStyle = 'rgba(30,30,30,0.8)'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(256, oy - 4); g.lineTo(256, oy + 10.97 * k + 4); g.stroke();
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

const T = {};
function textures() {
  T.earth = rammedEarth();
  T.wood = woodTex();
  T.deck = woodTex('#8a5f3c');
  T.grass = grassTex(3, 0.45);
  T.roofGrass = grassTex(8, 0.2);
  T.solar = solarTex();
  T.court = courtTex();
}

/* Box UVs in world metres, so one material tiles evenly on any wall size. */

/* ---------------------------------------------------- shared helpers -- */
const { box, worldUV } = CAB;          // the same helpers the cabin and residence builders use (js/cabin.js)
const UP = new THREE.Vector3(0, 1, 0);
function stars(r, n) {
  const pts = [], R = rng(21);
  for (let i = 0; i < n; i++) {
    const th = R() * Math.PI * 2, ph = Math.acos(0.15 + R() * 0.85);
    pts.push(new THREE.Vector3().setFromSphericalCoords(r, ph, th));
  }
  return new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: 0xcfd8ea, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false }));
}

/* A palm: grey trunk and a drooping crown, vertex-coloured so one draw call holds them all. */
function palmGeometry(H = 14) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.2, 0.3, H, 6, 1);
  trunk.translate(0, H / 2, 0);
  parts.push(colorize(trunk, 0x8d877b));
  const fronds = [];
  for (let f = 0; f < 10; f++) {
    const a = (f / 10) * Math.PI * 2 + (f % 2) * 0.2;
    const dx = Math.cos(a), dz = Math.sin(a), sx = -dz, sz = dx;
    const pos = [], seg = 6, L = 4.6;
    for (let s = 0; s <= seg; s++) {
      const t = s / seg, r = L * t, y = 1.3 * t - 3.1 * t * t, w = 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.15));
      pos.push([dx * r, H + y, dz * r, sx * w, sz * w]);
    }
    const v = [];
    for (let s = 0; s < seg; s++) {
      const [x0, y0, z0, ax0, az0] = pos[s], [x1, y1, z1, ax1, az1] = pos[s + 1];
      const L0 = [x0 + ax0, y0 - 0.12, z0 + az0], R0 = [x0 - ax0, y0 - 0.12, z0 - az0], C0 = [x0, y0, z0];
      const L1 = [x1 + ax1, y1 - 0.12, z1 + az1], R1 = [x1 - ax1, y1 - 0.12, z1 - az1], C1 = [x1, y1, z1];
      v.push(...C0, ...L0, ...C1, ...L0, ...L1, ...C1, ...C0, ...C1, ...R0, ...R0, ...C1, ...R1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    fronds.push(g);
  }
  const crown = mergeGeometries(fronds);
  parts.push(colorize(crown, 0x55703a));
  const merged = mergeGeometries(parts.map((p) => p.index ? p.toNonIndexed() : p));
  return merged;
}
function colorize(geo, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(hex), n = g.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (!g.attributes.normal) g.computeVertexNormals();
  g.deleteAttribute('uv');
  return g;
}
const palmMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });

/* A clump of five thin blades leaning outward; flat normals keep it reading as grass. */
function tuftGeometry(h = 0.5) {
  const pos = [], nrm = [], col = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3, dx = Math.cos(a), dz = Math.sin(a);
    const px = -dz * 0.025, pz = dx * 0.025, lean = 0.16 + (k % 2) * 0.08, hh = h * (0.7 + 0.3 * ((k * 3) % 5) / 4);
    // Each blade twice, once per winding, so both sides face front and keep the upward normal:
    // lit like the ground they grow from, dark at the root and sunlit at the tip.
    pos.push(-px, 0, -pz, px, 0, pz, dx * lean, hh, dz * lean, px, 0, pz, -px, 0, -pz, dx * lean, hh, dz * lean);
    for (let j = 0; j < 6; j++) nrm.push(0, 1, 0);
    col.push(0.5, 0.5, 0.42, 0.5, 0.5, 0.42, 1.08, 1.06, 0.9, 0.5, 0.5, 0.42, 0.5, 0.5, 0.42, 1.08, 1.06, 0.9);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
