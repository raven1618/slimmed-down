/* The site's look, shared by the views drawn like the Blender renders (Walk the site, Designs):
   - the sky Blender rendered from the site, in linear light: background, reflections, and the haze;
   - AgX colour with +0.5 exposure and the sun of the bake, as in render/build.py;
   - Poly Haven photo textures; trees as pictures of the real tree models from eight sides
     (render/impostors.py); live grass blades; a little glow and the site's film grade.
   Data: data/walk/ (render/web_export.py). Loaded once and kept: a view that frees its GPU memory on
   close only drops the uploads, and the next view uploads the same pictures again. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const TONE = { toneMapping: THREE.AgXToneMapping, exposure: Math.SQRT2 };     // Blender: AgX, exposure +0.5
export const GRASS_TINT = [0.52, 0.88, 0.4];                                       // the scanned lawn is beige; greened as in the renders
const B = 'data/walk/';

let assets = null;
export function loadLook(onFile = () => {}) {
  if (assets) return assets;
  const tl = new THREE.TextureLoader();
  const img = (f, srgb) => new Promise((res, rej) => tl.load(B + f, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; onFile(); res(t); }, undefined, () => rej(new Error(f))));
  assets = Promise.all([
    fetch(B + 'world.json').then((r) => { if (!r.ok) throw new Error('world.json: ' + r.status); onFile(); return r.json(); }),
    img('sky.jpg'), img('trees.webp'),
    img('tex/grass.jpg', true), img('tex/soil.jpg', true), img('tex/litter.jpg', true), img('tex/wall.jpg', true), img('tex/plaster.jpg', true), img('tex/planks.jpg', true),
  ]).then(([W, sky, sheet, grass, soil, litter, wall, plaster, planks]) => {
    sky.wrapS = THREE.RepeatWrapping; sky.minFilter = THREE.LinearFilter; sky.generateMipmaps = false;
    sheet.anisotropy = 4;
    const tex = { grass, soil, litter, wall, plaster, planks };
    for (const t of Object.values(tex)) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
    return { W, sky, sheet, tex };
  }).catch((err) => { assets = null; throw err; });
  return assets;
}
export const LOOK_FILES = 9;

/* The uniforms every material of one scene shares. uDim darkens the custom shaders at night. */
export function uniforms(L) {
  const W = L.W;
  return {
    uSky: { value: L.sky }, uSkyK: { value: W.skyScale }, uHaze: { value: 1 / 5500 }, uTime: { value: 0 },
    uSun: { value: new THREE.Vector3(...W.sun).normalize() }, uSunA: { value: new THREE.Vector3(...W.sunLight) }, uAmb: { value: new THREE.Vector3(...W.ambient) },
    uDim: { value: new THREE.Vector3(1, 1, 1) },
  };
}
export const material = (U, o) => new THREE.ShaderMaterial({ ...o, uniforms: { ...U, ...(o.uniforms || {}) } });

export const NOISE = `
float ohHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float ohNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ohHash(i), ohHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(ohHash(i + vec3(0.0, 1.0, 0.0)), ohHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(ohHash(i + vec3(0.0, 0.0, 1.0)), ohHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(ohHash(i + vec3(0.0, 1.0, 1.0)), ohHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}`;
/* The sky texture is (light / skyScale) ^ (1 / 2.2), centre of the image = north (-z), east (+x) to the right. */
export const SKY = `uniform sampler2D uSky; uniform float uSkyK, uHaze; uniform vec3 uDim;
  vec3 skyAt(vec3 d) {
    d = normalize(d);
    vec2 uv = vec2(atan(d.x, -d.z) * 0.1591549 + 0.5, 0.5 + asin(clamp(d.y, -1.0, 1.0)) * 0.3183099);
    return pow(texture2D(uSky, uv).rgb, vec3(2.2)) * uSkyK;
  }
  vec3 hazeCol(vec3 d) { return skyAt(vec3(d.x, max(d.y, 0.0) * 0.3 + 0.04, d.z)); }
  vec3 haze(vec3 c, vec3 wp) { vec3 d = wp - cameraPosition; float l = length(d); return mix(c, hazeCol(d / max(l, 1e-3)), 1.0 - exp(-l * uHaze)) * uDim; }`;
export const OUT = '#include <tonemapping_fragment>\n#include <colorspace_fragment>';

/* The sky as the background, and as the light that fills shadows and shows in glass (an environment map). */
export function addSky(scene, renderer, U, L) {
  const W = L.W, sA = U.uSunA.value, am = U.uAmb.value;
  const ground = new THREE.Color().setRGB(...W.grassAlbedo.map((v, i) => v * (sA.getComponent(i) * 0.5 + am.getComponent(i))));
  const skyMat = (env) => material(U, {
    uniforms: { uGround: { value: ground } }, side: THREE.BackSide, depthWrite: false, defines: env ? { ENV: 1 } : {},
    vertexShader: `varying vec3 vDir;
      void main() {
        vDir = position;
        #ifdef ENV
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #else
        vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww;
        #endif
      }`,
    fragmentShader: `${SKY} uniform vec3 uGround; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir), c = skyAt(d);
        #ifdef ENV
        c = mix(c, uGround, smoothstep(0.0, -0.1, d.y));
        #else
        c = mix(c, hazeCol(d), smoothstep(0.02, -0.04, d.y));
        #endif
        gl_FragColor = vec4(c, 1.0);
        ${OUT}
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMat(false));
  dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), envMat = skyMat(true);
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), envMat));
  scene.environment = pm.fromScene(envScene, 0, 0.1, 100).texture;
  pm.dispose(); envMat.dispose();
  return dome;
}
/* The sky just above the horizon, for the fog of ordinary materials. */
export function horizonColor(L) {
  const im = L.sky.image, c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0, 64, 32);
  const px = g.getImageData(0, 15, 64, 1).data, s = [0, 0, 0];
  for (let i = 0; i < 64; i++) for (let k = 0; k < 3; k++) s[k] += Math.pow(px[i * 4 + k] / 255, 2.2) * L.W.skyScale / 64;
  return new THREE.Color().setRGB(...s);
}

/* The sun of the bake. three.js divides a light by pi where Blender's bake does not. */
export function sunLight(U) {
  const a = U.uSunA.value, m = Math.max(a.x, a.y, a.z), s = new THREE.DirectionalLight();
  s.color.setRGB(a.x / m, a.y / m, a.z / m); s.intensity = m * Math.PI;
  return s;
}

/* Trees: each one a card that turns to face you, showing the model from the nearest of eight sides.
   data: Float32Array of x, z, base height, tree height, species (0-3, rows of the sheet). */
export function treeCards(U, L, data, a2c) {
  const W = L.W, nT = data.length / 5;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const iTree = new Float32Array(nT * 4), iSp = new Float32Array(nT);
  for (let i = 0; i < nT; i++) { iTree[i * 4] = data[i * 5]; iTree[i * 4 + 1] = data[i * 5 + 2]; iTree[i * 4 + 2] = data[i * 5 + 1]; iTree[i * 4 + 3] = data[i * 5 + 3]; iSp[i] = data[i * 5 + 4]; }
  geo.setAttribute('aTree', new THREE.InstancedBufferAttribute(iTree, 4)); geo.setAttribute('aSp', new THREE.InstancedBufferAttribute(iSp, 1));
  geo.instanceCount = nT;
  const mesh = new THREE.Mesh(geo, material(U, {
    uniforms: { uSheet: { value: L.sheet }, uFrame: { value: W.sprites.map((s) => new THREE.Vector4(s.frame, s.base, 0, 0)) }, uK: { value: W.spriteScale } },
    defines: a2c ? { A2C: 1 } : {}, alphaToCoverage: !!a2c, side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aTree; attribute float aSp; uniform vec4 uFrame[4]; varying vec2 vA, vB; varying float vM, vTint; varying vec3 vW;
      void main() {
        vec4 F = uFrame[int(aSp + 0.5)];
        float size = aTree.w * F.x;
        vec3 tc = cameraPosition - aTree.xyz;
        vec2 hz = normalize(tc.xz + vec2(1e-4, 0.0));
        vec3 p = aTree.xyz + vec3(hz.y, 0.0, -hz.x) * position.x * size + vec3(0.0, (position.y - F.y) * size, 0.0);
        float k = mod(atan(tc.x, -tc.z) / 0.7853982 + 8.0, 8.0), k0 = floor(k), k1 = mod(k0 + 1.0, 8.0), row = 3.0 - aSp;
        vM = k - k0;
        vA = vec2((k0 + position.x + 0.5) / 8.0, (row + position.y) / 4.0);
        vB = vec2((k1 + position.x + 0.5) / 8.0, (row + position.y) / 4.0);
        vTint = 0.88 + 0.24 * fract(sin(dot(aTree.xz, vec2(12.9898, 78.233))) * 43758.5453);
        vW = p;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `${SKY} uniform sampler2D uSheet; uniform float uK; varying vec2 vA, vB; varying float vM, vTint; varying vec3 vW;
      void main() {
        vec4 a = texture2D(uSheet, vA), b = texture2D(uSheet, vB);
        float al = mix(a.a, b.a, vM);
        vec3 rgb = (a.rgb * a.a * (1.0 - vM) + b.rgb * b.a * vM) / max(al, 1e-3);
        float thr = mix(0.5, 0.3, clamp(length(vW - cameraPosition) / 250.0, 0.0, 1.0));   // far crowns keep their fill
        #ifdef A2C
        al = clamp((al - thr) / max(fwidth(al), 1e-3) + 0.5, 0.0, 1.0);
        if (al < 0.02) discard;
        #else
        if (al < thr) discard;
        al = 1.0;
        #endif
        gl_FragColor = vec4(haze(pow(rgb, vec3(2.2)) * uK * vTint, vW), al);
        ${OUT}
      }`,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

/* Grass: blades in a patch that travels with the view, bending in the wind and away from someone's feet.
   o.heights: Float32Array on a grid (rows run along +z), o.grid [nx, nz], o.origin [x0, z0], o.step metres;
   o.mask: texture on the same grid, red = how much grass (row 0 at z0); o.light: the baked light over the
   same area, or none (then the open-ground light of the bake); o.radius, o.count. */
export function grass(U, L, o) {
  const GR = o.radius, GN = o.count, geo = new THREE.InstancedBufferGeometry(), bp = [], bi = [];
  for (let i = 0; i < 4; i++) bp.push(-0.5, i / 4, 0, 0.5, i / 4, 0);
  bp.push(0, 1, 0);
  for (let i = 0; i < 3; i++) bi.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  bi.push(6, 7, 8);
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bp), 3)); geo.setIndex(bi);
  const off = new Float32Array(GN * 4);
  for (let i = 0; i < GN; i++) { off[i * 4] = (Math.random() * 2 - 1) * GR; off[i * 4 + 1] = (Math.random() * 2 - 1) * GR; off[i * 4 + 2] = Math.random(); off[i * 4 + 3] = Math.random(); }
  geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); geo.instanceCount = GN;
  const [nx, nz] = o.grid, s = o.step || 1;
  const hTex = new THREE.DataTexture(o.heights, nx, nz, THREE.RedFormat, THREE.FloatType); hTex.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, material(U, {
    uniforms: { uH: { value: hTex }, uMask: { value: o.mask }, uLight: { value: o.light || null }, uLK: { value: L.W.lightScale },
      uGo: { value: new THREE.Vector3(o.origin[0], o.origin[1], s) }, uGn: { value: new THREE.Vector2(nx, nz) },
      uR: { value: GR }, uCam: { value: new THREE.Vector3() }, uFeet: { value: new THREE.Vector3(1e5, 0, 1e5) }, uAlb: { value: new THREE.Vector3(...L.W.grassAlbedo) } },
    defines: o.light ? { LIGHTMAP: 1 } : {}, side: THREE.DoubleSide,
    vertexShader: `${NOISE}
      attribute vec4 aOff; uniform sampler2D uH, uMask, uLight; uniform vec3 uGo; uniform vec2 uGn; uniform float uR, uTime, uLK; uniform vec3 uCam, uFeet, uAlb, uAmb, uSunA, uSun;
      varying vec3 vW, vCol; varying float vT, vLit;
      float hAt(vec2 g) {
        g = clamp(g, vec2(0.0), uGn - 1.001); ivec2 i = ivec2(floor(g)); vec2 f = fract(g);
        return mix(mix(texelFetch(uH, i, 0).r, texelFetch(uH, i + ivec2(1, 0), 0).r, f.x), mix(texelFetch(uH, i + ivec2(0, 1), 0).r, texelFetch(uH, i + ivec2(1, 1), 0).r, f.x), f.y);
      }
      void main() {
        vec2 c = uCam.xz, wp = c + mod(aOff.xy - c + uR, 2.0 * uR) - uR, g = (wp - uGo.xy) / uGo.z;
        float dens = textureLod(uMask, (g + 0.5) / uGn, 0.0).r;
        float on = step(aOff.z, dens) * (1.0 - smoothstep(uR * 0.55, uR * 0.95, length(wp - c)));
        if (on < 0.03 || g.x < 1.0 || g.y < 1.0 || g.x > uGn.x - 2.0 || g.y > uGn.y - 2.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
        float t = position.y, hgt = mix(0.07, 0.27, aOff.w * aOff.w) * mix(0.35, 1.0, on);
        float ang = fract(aOff.z * 13.37 + aOff.w * 7.1) * 6.2831853;
        vec2 side = vec2(cos(ang), sin(ang));
        float wdt = mix(0.035, 0.065, fract(aOff.w * 9.7)) * (1.0 - t * 0.9);
        float gust = ohNoise(vec3(wp * 0.12 + uTime * vec2(0.35, 0.18), uTime * 0.2));
        vec2 wind = vec2(0.8, 0.45) * (0.1 + gust * 0.7) + 0.08 * vec2(sin(uTime * 2.3 + wp.x * 1.7), cos(uTime * 1.9 + wp.y * 1.3));
        vec2 pd = wp - uFeet.xz; float pl = length(pd);
        vec2 push = pd / max(pl, 1e-3) * (1.0 - smoothstep(0.2, 1.0, pl)) * 1.6;
        vec2 bend = (wind + push) * t * t * hgt;
        vec3 p = vec3(wp.x, hAt(g) - 0.03, wp.y) + vec3(side.x * position.x * wdt, t * hgt * (1.0 - 0.35 * min(length(bend) / hgt, 1.0)), side.y * position.x * wdt) + vec3(bend.x, 0.0, bend.y);
        #ifdef LIGHTMAP
        vec3 L = pow(textureLod(uLight, g / (uGn - 1.0), 0.0).rgb, vec3(2.2)) * uLK;
        #else
        vec3 L = uSunA * max(uSun.y, 0.0) + uAmb;
        #endif
        vec3 alb = uAlb * vec3(0.72, 1.0, 0.8) * mix(0.7, 1.3, fract(aOff.w * 31.3)) * mix(vec3(1.0), vec3(1.4, 1.15, 0.8), step(0.96, fract(aOff.z * 57.1)));
        vCol = alb * L * mix(0.3, 1.05, t);
        vLit = clamp((dot(L, vec3(0.333)) - dot(uAmb, vec3(0.333))) / (dot(uSunA, vec3(0.333)) * 0.5), 0.0, 1.0);
        vT = t; vW = p;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `${SKY} uniform vec3 uSun, uSunA, uAlb; varying vec3 vW, vCol; varying float vT, vLit;
      void main() {
        float back = pow(max(dot(normalize(vW - cameraPosition), uSun), 0.0), 4.0) * vT * vLit;   // sun through the blades
        gl_FragColor = vec4(haze(vCol + uAlb * uSunA * back * 0.8, vW), 1.0);
        ${OUT}
      }`,
  }));
  mesh.frustumCulled = false;
  mesh.userData.heights = hTex;
  return mesh;
}

/* A little glow, then the site's film grade. Null where the GPU cannot render to half-float targets. */
export function composer(renderer, scene, cam, GradeShader, small) {
  try {
    const pr = renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType, samples: small ? 0 : 4 });
    const gl = renderer.getContext(); renderer.setRenderTarget(rt);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; renderer.setRenderTarget(null);
    if (!ok) { rt.dispose(); throw new Error('no half-float target'); }
    const c = new EffectComposer(renderer, rt);
    c.addPass(new RenderPass(scene, cam));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.28, 0.5, 0.95));
    c.addPass(new OutputPass());
    c.grade = new ShaderPass(GradeShader); c.grade.uniforms.uAmt.value = 1; c.addPass(c.grade);
    return c;
  } catch (err) { console.warn('Effects off:', err.message); return null; }
}
