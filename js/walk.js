/* Walk the site: the quarry cabins, the lagoon and the forest edge as a place to walk through.
   The light on the ground was path-traced in Blender, trees and cabins included (render/build.py ... bake),
   and is laid over tiled photo textures here. The trees are pictures of the real tree models from eight
   sides (render/impostors.py). Grass, water, haze and the cabins are drawn live. Data: data/walk/
   (render/web_export.py). Loaded by index.html when the tab opens; it draws with the page's renderer
   and gives everything back in dispose(). */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

export async function build(ctx) {
  const { renderer: R, $, clamp, small, reduced, windOf, GLSL_NOISE, GradeShader, disposeScene } = ctx;
  const ac = new AbortController(), sig = { signal: ac.signal };

  const B = 'data/walk/', barEl = $('wk-bar'), msg = $('wk-msg');
  const touch = matchMedia('(pointer: coarse)').matches;
  $('wk-hint').textContent = touch ? 'Left thumb to walk · drag to look around' : 'W A S D or arrow keys to walk · drag to look around · Shift to run';
  let got = 0;
  const step = (p) => p.then((v) => { got++; barEl.style.width = ((100 * got) / 14).toFixed(0) + '%'; return v; });
  const bin = (f) => step(fetch(B + f).then((r) => { if (!r.ok) throw new Error(f + ': ' + r.status); return r.json(); }).then((b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0)).buffer));   // float32, as base64
  const tl = new THREE.TextureLoader();
  const img = (f, srgb) => step(new Promise((res, rej) => tl.load(B + f, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => rej(new Error(f)))));
  const W = await fetch(B + 'world.json').then((r) => { if (!r.ok) throw new Error('world.json: ' + r.status); return r.json(); });
  const [hb, fb, tb, light, splat, sky, sheet, farT, tGrass, tSoil, tLitter, tWall, tPlaster, tPlanks] = await Promise.all([
    bin('heights.json'), bin('far.json'), bin('trees.json'), img('light.jpg'), img('splat.png'), img('sky.jpg'), img('trees.webp'), img('far.jpg', true),
    img('tex/grass.jpg', true), img('tex/soil.jpg', true), img('tex/litter.jpg', true), img('tex/wall.jpg', true), img('tex/plaster.jpg', true), img('tex/planks.jpg', true)]);
  msg.textContent = 'Setting up the site';

  /* ---- the page's renderer, set by the page to AgX with +0.5 exposure, as in Blender */
  const stage = $('wk-stage');
  const aniso = Math.min(8, R.capabilities.getMaxAnisotropy());
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(small ? 68 : 60, innerWidth / innerHeight, 0.08, 6000);
  cam.rotation.order = 'YXZ';
  for (const t of [tGrass, tSoil, tLitter, tWall, tPlaster, tPlanks]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; }
  for (const t of [light, splat]) { t.flipY = false; t.anisotropy = aniso; }       // north on the top row, like the data
  sky.wrapS = THREE.RepeatWrapping; sky.minFilter = THREE.LinearFilter; sky.generateMipmaps = false;
  farT.anisotropy = aniso; sheet.anisotropy = 4;

  const [x0, z0, x1, z1] = W.region, [nx, nz] = W.grid;
  const Hd = new Float32Array(hb), Hc = new Float32Array(fb);
  const hAt = (x, z) => {
    const fx = clamp(x - x0, 0, nx - 1.001), fz = clamp(z - z0, 0, nz - 1.001), i = fx | 0, j = fz | 0, tx = fx - i, tz = fz - j, k = j * nx + i;
    return (Hd[k] * (1 - tx) + Hd[k + 1] * tx) * (1 - tz) + (Hd[k + nx] * (1 - tx) + Hd[k + nx + 1] * tx) * tz;
  };
  const sunDir = new THREE.Vector3(...W.sun).normalize();
  const sunA = new THREE.Vector3(...W.sunLight), amb = new THREE.Vector3(...W.ambient);
  const U = {
    uSky: { value: sky }, uSkyK: { value: W.skyScale }, uHaze: { value: 1 / 5500 }, uTime: { value: 0 }, uSun: { value: sunDir },
    uSunA: { value: sunA }, uAmb: { value: amb }, uLK: { value: W.lightScale },
    uReg: { value: new THREE.Vector4(x0, z0, x1 - x0, z1 - z0) }, uGrid: { value: new THREE.Vector2(nx, nz) },
  };
  const NOISE = GLSL_NOISE.split('vec3 ohBump')[0];
  const SKY = `uniform sampler2D uSky; uniform float uSkyK, uHaze;
    vec3 skyAt(vec3 d) {
      d = normalize(d);
      vec2 uv = vec2(atan(d.x, -d.z) * 0.1591549 + 0.5, 0.5 + asin(clamp(d.y, -1.0, 1.0)) * 0.3183099);
      return pow(texture2D(uSky, uv).rgb, vec3(2.2)) * uSkyK;
    }
    vec3 hazeCol(vec3 d) { return skyAt(vec3(d.x, max(d.y, 0.0) * 0.3 + 0.04, d.z)); }
    vec3 haze(vec3 c, vec3 wp) { vec3 d = wp - cameraPosition; float l = length(d); return mix(c, hazeCol(d / max(l, 1e-3)), 1.0 - exp(-l * uHaze)); }`;
  const OUT = '#include <tonemapping_fragment>\n#include <colorspace_fragment>';
  const mat = (o) => new THREE.ShaderMaterial({ ...o, uniforms: { ...U, ...(o.uniforms || {}) } });

  /* ---- sky: the panorama Blender rendered from the site, in linear light */
  const groundCol = new THREE.Color().setRGB(...W.grassAlbedo.map((v, i) => v * (sunA.getComponent(i) * 0.5 + amb.getComponent(i))));
  const skyMat = (env) => mat({
    uniforms: { uGround: { value: groundCol } }, side: THREE.BackSide, depthWrite: false, defines: env ? { ENV: 1 } : {},
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
  const skyBox = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), skyMat(false));
  skyBox.frustumCulled = false; skyBox.renderOrder = -10; scene.add(skyBox);
  const pm = new THREE.PMREMGenerator(R), envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), skyMat(true)));
  scene.environment = pm.fromScene(envScene, 0, 0.1, 100).texture;
  pm.dispose();

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
  const TA = new Float32Array(tb), nT = TA.length / 5;
  const tgeo = new THREE.InstancedBufferGeometry();
  tgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]), 3));
  tgeo.setIndex([0, 1, 2, 0, 2, 3]);
  const iTree = new Float32Array(nT * 4), iSp = new Float32Array(nT);
  for (let i = 0; i < nT; i++) { iTree[i * 4] = TA[i * 5]; iTree[i * 4 + 1] = TA[i * 5 + 2]; iTree[i * 4 + 2] = TA[i * 5 + 1]; iTree[i * 4 + 3] = TA[i * 5 + 3]; iSp[i] = TA[i * 5 + 4]; }
  tgeo.setAttribute('aTree', new THREE.InstancedBufferAttribute(iTree, 4)); tgeo.setAttribute('aSp', new THREE.InstancedBufferAttribute(iSp, 1));
  tgeo.instanceCount = nT;
  const a2c = !small;
  const trees = new THREE.Mesh(tgeo, mat({
    uniforms: { uSheet: { value: sheet }, uFrame: { value: W.sprites.map((s) => new THREE.Vector4(s.frame, s.base, 0, 0)) }, uK: { value: W.spriteScale } },
    defines: a2c ? { A2C: 1 } : {}, alphaToCoverage: a2c, side: THREE.DoubleSide,
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
  trees.frustumCulled = false; scene.add(trees);

  /* ---- grass: blades in a patch that travels with you, bending in the wind and away from your feet */
  const GR = small ? 13 : 20, GN = small ? 26000 : 80000;
  const bgeo = new THREE.InstancedBufferGeometry(), bp = [], bi = [];
  for (let i = 0; i < 4; i++) bp.push(-0.5, i / 4, 0, 0.5, i / 4, 0);
  bp.push(0, 1, 0);
  for (let i = 0; i < 3; i++) bi.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2);
  bi.push(6, 7, 8);
  bgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bp), 3)); bgeo.setIndex(bi);
  const off = new Float32Array(GN * 4);
  for (let i = 0; i < GN; i++) { off[i * 4] = (Math.random() * 2 - 1) * GR; off[i * 4 + 1] = (Math.random() * 2 - 1) * GR; off[i * 4 + 2] = Math.random(); off[i * 4 + 3] = Math.random(); }
  bgeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); bgeo.instanceCount = GN;
  const hTex = new THREE.DataTexture(Hd, nx, nz, THREE.RedFormat, THREE.FloatType); hTex.needsUpdate = true;
  const grass = new THREE.Mesh(bgeo, mat({
    uniforms: { uH: { value: hTex }, uSplat: { value: splat }, uLight: { value: light }, uR: { value: GR }, uCam: { value: new THREE.Vector3() }, uFeet: { value: new THREE.Vector3() },
      uAlb: { value: new THREE.Vector3(...W.grassAlbedo) } },
    side: THREE.DoubleSide,
    vertexShader: `${NOISE}
      attribute vec4 aOff; uniform sampler2D uH, uSplat, uLight; uniform vec4 uReg; uniform vec2 uGrid; uniform float uR, uTime, uLK; uniform vec3 uCam, uFeet, uAlb, uAmb, uSunA;
      varying vec3 vW, vCol; varying float vT, vLit;
      float hAt(vec2 xz) {
        vec2 g = clamp(xz - uReg.xy, vec2(0.0), uGrid - 1.001); ivec2 i = ivec2(floor(g)); vec2 f = fract(g);
        return mix(mix(texelFetch(uH, i, 0).r, texelFetch(uH, i + ivec2(1, 0), 0).r, f.x), mix(texelFetch(uH, i + ivec2(0, 1), 0).r, texelFetch(uH, i + ivec2(1, 1), 0).r, f.x), f.y);
      }
      void main() {
        vec2 c = uCam.xz, wp = c + mod(aOff.xy - c + uR, 2.0 * uR) - uR;
        float dens = textureLod(uSplat, (wp - uReg.xy + 0.5) / uGrid, 0.0).r;
        float on = step(aOff.z, dens) * (1.0 - smoothstep(uR * 0.55, uR * 0.95, length(wp - c)));
        if (on < 0.03 || wp.x < uReg.x + 1.0 || wp.y < uReg.y + 1.0 || wp.x > uReg.x + uReg.z - 1.0 || wp.y > uReg.y + uReg.w - 1.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
        float t = position.y, hgt = mix(0.07, 0.27, aOff.w * aOff.w) * mix(0.35, 1.0, on);
        float ang = fract(aOff.z * 13.37 + aOff.w * 7.1) * 6.2831853;
        vec2 side = vec2(cos(ang), sin(ang));
        float wdt = mix(0.035, 0.065, fract(aOff.w * 9.7)) * (1.0 - t * 0.9);
        float gust = ohNoise(vec3(wp * 0.12 + uTime * vec2(0.35, 0.18), uTime * 0.2));
        vec2 wind = vec2(0.8, 0.45) * (0.1 + gust * 0.7) + 0.08 * vec2(sin(uTime * 2.3 + wp.x * 1.7), cos(uTime * 1.9 + wp.y * 1.3));
        vec2 pd = wp - uFeet.xz; float pl = length(pd);
        vec2 push = pd / max(pl, 1e-3) * (1.0 - smoothstep(0.2, 1.0, pl)) * 1.6;
        vec2 bend = (wind + push) * t * t * hgt;
        vec3 p = vec3(wp.x, hAt(wp) - 0.03, wp.y) + vec3(side.x * position.x * wdt, t * hgt * (1.0 - 0.35 * min(length(bend) / hgt, 1.0)), side.y * position.x * wdt) + vec3(bend.x, 0.0, bend.y);
        vec3 L = pow(textureLod(uLight, (wp - uReg.xy) / uReg.zw, 0.0).rgb, vec3(2.2)) * uLK;
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
  grass.frustumCulled = false; scene.add(grass);
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
  const sunL = new THREE.DirectionalLight(), sm = Math.max(sunA.x, sunA.y, sunA.z);
  sunL.color.setRGB(sunA.x / sm, sunA.y / sm, sunA.z / sm); sunL.intensity = sm * Math.PI;      // three's sun divides by pi; the bake's does not
  const cc = new THREE.Vector3(); cabins.forEach((c) => cc.add(new THREE.Vector3(c.cx, c.fl, c.cz))); cc.divideScalar(Math.max(1, cabins.length));
  const spread = Math.max(20, ...cabins.map((c) => Math.hypot(c.cx - cc.x, c.cz - cc.z) + c.w));
  sunL.position.copy(cc).addScaledVector(sunDir, 200); sunL.target.position.copy(cc);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.03;
  Object.assign(sunL.shadow.camera, { left: -spread, right: spread, top: spread, bottom: -spread, near: 100, far: 300 });
  scene.add(sunL, sunL.target);
  R.shadowMap.needsUpdate = true;          // the cabins do not move: their shadows are drawn once (the page turns off autoUpdate)

  /* ---- post: a little glow, then the same film grade as the rest of the site */
  let comp = null;
  try {
    const pr = R.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType, samples: small ? 0 : 4 });
    const gl = R.getContext(); R.setRenderTarget(rt);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; R.setRenderTarget(null);
    if (!ok) throw new Error('no half-float target');
    comp = new EffectComposer(R, rt);
    comp.addPass(new RenderPass(scene, cam));
    comp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.28, 0.5, 0.95));
    comp.addPass(new OutputPass());
    comp.grade = new ShaderPass(GradeShader); comp.grade.uniforms.uAmt.value = 1; comp.addPass(comp.grade);
  } catch (err) { console.warn('Walk effects off:', err.message); comp = null; }

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
