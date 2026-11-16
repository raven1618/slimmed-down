/* The trail: Mala Visión, the fight at the trail's midpoint, playable in the browser. On the trail it runs
   on the phone's camera, motion sensors and flash; here the view is dragged and buttons stand in for them.
   Loaded by index.html when the tab opens; it draws with the page's renderer and gives everything back in
   dispose(). */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export async function build(ctx) {
  const { renderer: R, $, clamp, ease, rng, small, reduced, trailEl, disposeScene } = ctx;
  const ac = new AbortController(), sig = { signal: ac.signal };

  const stage = $('tr-stage');
  const W = () => stage.clientWidth || innerWidth, H = () => stage.clientHeight || innerHeight;
  const canvas = stage;                     // input comes to the stage over the page's canvas
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x070c10, 0.034);
  const cam = new THREE.PerspectiveCamera(62, W() / H(), 0.1, 500);
  const rand = rng(1618), lerp = THREE.MathUtils.lerp;
  const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  /* Shared bits: a soft glow for sprites, and branches that taper. */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(230,238,255,0.6)'); gr.addColorStop(1, 'rgba(200,215,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = (color, opacity, scale) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.scale.setScalar(scale); return s;
  };
  function taper(pts, r0, r1, segs, radial) {
    const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
    const g = new THREE.TubeGeometry(curve, segs, r0, radial, false);
    const p = g.attributes.position, c = new THREE.Vector3();
    for (let i = 0; i <= segs; i++) {
      curve.getPointAt(i / segs, c);
      const k = lerp(r0, r1, i / segs) / r0;
      for (let j = 0; j <= radial; j++) {
        const n = i * (radial + 1) + j;
        p.setXYZ(n, c.x + (p.getX(n) - c.x) * k, c.y + (p.getY(n) - c.y) * k, c.z + (p.getZ(n) - c.z) * k);
      }
    }
    g.computeVertexNormals();
    return g;
  }

  /* Night sky, stars and the moon. */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x0b1729) }, bot: { value: new THREE.Color(0x020305) } },
    vertexShader: 'varying vec3 vP; void main() { vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main() { gl_FragColor = vec4(mix(bot, top, smoothstep(-0.05, 0.55, vP.y)), 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  }));
  scene.add(sky);
  {
    const n = 1200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rand() * Math.PI * 2, y = Math.pow(0.08 + rand() * 0.92, 0.75), r = Math.sqrt(1 - y * y), b = 0.35 + rand() * 0.65;
      pos.set([Math.cos(th) * r * 390, y * 390, Math.sin(th) * r * 390], i * 3);
      col.set([b * 0.9, b * 0.94, b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    sky.add(new THREE.Points(g, new THREE.PointsMaterial({ size: small ? 1.7 : 1.4, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false })));
  }
  const moonDir = new THREE.Vector3(-0.42, 0.6, -0.68).normalize();
  {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const halo = g.createRadialGradient(128, 128, 30, 128, 128, 128);
    halo.addColorStop(0, 'rgba(210,222,255,0.55)'); halo.addColorStop(1, 'rgba(210,222,255,0)');
    g.fillStyle = halo; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#eef2ff'; g.beginPath(); g.arc(128, 128, 34, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(150,160,190,0.35)';
    for (const [x, y, r] of [[118, 120, 9], [140, 136, 6], [126, 144, 5], [137, 114, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
    moon.position.copy(moonDir).multiplyScalar(380); moon.scale.setScalar(70);
    sky.add(moon);
  }
  const moonLight = new THREE.DirectionalLight(0xb4c6ff, 1.8);
  moonLight.position.copy(moonDir).multiplyScalar(60);
  if (!small) {
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    Object.assign(moonLight.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
    moonLight.shadow.bias = -0.0004; moonLight.shadow.normalBias = 0.03;
  }
  scene.add(moonLight, moonLight.target, new THREE.HemisphereLight(0x3d5378, 0x0c100a, 1.05));

  /* The clearing and the woods around it. */
  {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) { const v = 170 + rand() * 85 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rand() * 128, rand() * 128, 1 + rand() * 2, 1 + rand() * 2); }
    const speck = new THREE.CanvasTexture(c); speck.wrapS = speck.wrapT = THREE.RepeatWrapping; speck.repeat.set(70, 70); speck.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.PlaneGeometry(220, 220, 150, 150); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), cc = new THREE.Color();
    const grass = new THREE.Color(0x3b4b2d), floor = new THREE.Color(0x1a2114), earth = new THREE.Color(0x4c4535);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      const n = 0.5 * Math.sin(x * 0.7 + Math.sin(z * 0.5)) + 0.5 * Math.sin(z * 1.3 + x * 0.2);
      cc.copy(grass).lerp(floor, THREE.MathUtils.smoothstep(r, 9, 15));
      if (r < 2.4) cc.lerp(earth, 0.6 * (1 - r / 2.4));
      cc.multiplyScalar(0.85 + 0.15 * n);
      col.set([cc.r, cc.g, cc.b], i * 3);
      p.setY(i, r > 14 ? 0.18 * n : 0.03 * n);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: speck }));
    ground.receiveShadow = true; scene.add(ground);
  }
  {
    const v = [];
    for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12; v.push(-x, 0, -z, x, 0, z, x * 0.2, 1, z * 0.2); }
    const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); blade.computeVertexNormals();
    const n = small ? 900 : 2200, o = new THREE.Object3D();
    const tufts = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: 0x33432b, roughness: 1, side: THREE.DoubleSide }), n);
    for (let i = 0; i < n; i++) {
      const r = 2.6 + Math.sqrt(rand()) * 13, a = rand() * Math.PI * 2, s = 0.18 + rand() * 0.35;
      o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); o.rotation.set(0, rand() * 3, 0); o.scale.set(s * 1.4, s, s * 1.4);
      o.updateMatrix(); tufts.setMatrixAt(i, o.matrix);
    }
    tufts.receiveShadow = true; scene.add(tufts);
  }
  {
    const N = small ? 120 : 190, o = new THREE.Object3D(), cc = new THREE.Color();
    const trunkG = new THREE.CylinderGeometry(0.16, 0.26, 1, 7); trunkG.translate(0, 0.5, 0);
    const trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x2b251f, roughness: 1 }), N);
    const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), N * 2);
    for (let i = 0; i < N; i++) {
      const r = 14 + Math.pow(rand(), 0.8) * 34, a = rand() * Math.PI * 2, h = 7 + rand() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
      o.position.set(x, 0, z); o.rotation.set((rand() - 0.5) * 0.08, rand() * 3, (rand() - 0.5) * 0.08); o.scale.set(1 + rand() * 0.6, h, 1 + rand() * 0.6);
      o.updateMatrix(); trunks.setMatrixAt(i, o.matrix);
      for (let k = 0; k < 2; k++) {
        const s = 2.2 + rand() * 2.4;
        o.position.set(x + (rand() - 0.5) * 2.5, h * (0.78 + 0.18 * k), z + (rand() - 0.5) * 2.5); o.rotation.set(rand(), rand(), rand()); o.scale.set(s, s * (0.55 + rand() * 0.25), s);
        o.updateMatrix(); crowns.setMatrixAt(i * 2 + k, o.matrix);
        crowns.setColorAt(i * 2 + k, cc.setHSL(0.3 + rand() * 0.06, 0.35, 0.08 + rand() * 0.05, THREE.SRGBColorSpace));
      }
    }
    trunks.castShadow = crowns.castShadow = trunks.receiveShadow = crowns.receiveShadow = true;
    scene.add(trunks, crowns);
  }

  /* The ring of whitewashed trees, open on the side you walk in from (+z). */
  const RING_R = 9.5, ring = [];
  {
    const parts = [], crownParts = [], white = new THREE.Color(0xf1efe8), bark = new THREE.Color(0x3a3128), c = new THREE.Color();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (rand() - 0.5) * 0.16;
      if (Math.abs(wrapA(a)) < 0.3) continue;
      const r = RING_R + (rand() - 0.5) * 0.8, x = Math.sin(a) * r, z = Math.cos(a) * r;
      const h = 8 + rand() * 4, r0 = 0.24 + rand() * 0.1, paint = 2.6 + rand() * 0.8;
      const g = new THREE.CylinderGeometry(r0 * 0.55, r0, h, 12, 24); g.translate(0, h / 2, 0);
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) {
        const y = p.getY(k), ang = Math.atan2(p.getZ(k), p.getX(k));
        const painted = y < paint + 0.12 * Math.sin(ang * 5 + i) + 0.06 * Math.sin(ang * 13);
        c.copy(painted ? white : bark);
        if (painted) c.multiplyScalar(0.92 + 0.08 * Math.sin(y * 9 + ang * 3));
        col.set([c.r, c.g, c.b], k * 3);
        const w = 1 + 0.05 * Math.sin(ang * 7 + y * 2.3);
        p.setX(k, p.getX(k) * w); p.setZ(k, p.getZ(k) * w);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler((rand() - 0.5) * 0.06, 0, (rand() - 0.5) * 0.06)));
      g.translate(x, 0, z); g.computeVertexNormals();
      parts.push(g);
      for (let k = 0; k < 3; k++) {
        const s = 1.8 + rand() * 1.6, cg = new THREE.IcosahedronGeometry(1, 1);
        cg.scale(s, s * 0.6, s); cg.translate(x + (rand() - 0.5) * 1.6, h * (0.82 + 0.1 * k), z + (rand() - 0.5) * 1.6);
        crownParts.push(cg);
      }
      ring.push({ x, z });
    }
    const trunks = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
    const crowns = new THREE.Mesh(mergeGeometries(crownParts), new THREE.MeshStandardMaterial({ color: 0x16231a, roughness: 0.95, flatShading: true }));
    trunks.castShadow = trunks.receiveShadow = crowns.castShadow = true;
    scene.add(trunks, crowns);
  }

  /* The centre tree: bare, painted white from root to twig. */
  const treeMat = new THREE.MeshStandardMaterial({ color: 0xf3f1ea, roughness: 0.9, emissive: 0xc8d8ff, emissiveIntensity: 0.05 });
  const treeHalo = glow(0xcfdcff, 0, 10);
  {
    const parts = [taper([[0, -0.3, 0], [0.06, 1.5, 0.02], [-0.05, 3.0, 0], [0, 3.9, 0.02]], 0.62, 0.38, 14, 12)];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + rand() * 0.5, out = 1.6 + rand() * 1.2, top = 6.6 + rand() * 2.2, y0 = 3.4 + rand() * 0.4;
      const s = [Math.sin(a) * 0.15, y0, Math.cos(a) * 0.15], m = [Math.sin(a) * out * 0.45, y0 + (top - y0) * 0.45, Math.cos(a) * out * 0.45], e = [Math.sin(a) * out, top, Math.cos(a) * out];
      parts.push(taper([s, m, e], 0.24, 0.05, 12, 8));
      for (let t = 0; t < 2; t++) {
        const b = a + (t ? 0.6 : -0.6), L = 0.8 + rand() * 0.8;
        parts.push(taper([m, [m[0] + Math.sin(b) * L * 0.5, m[1] + 0.7, m[2] + Math.cos(b) * L * 0.5], [m[0] + Math.sin(b) * L, m[1] + 1.6 + rand(), m[2] + Math.cos(b) * L]], 0.09, 0.02, 8, 6));
      }
    }
    const tree = new THREE.Mesh(mergeGeometries(parts), treeMat);
    tree.castShadow = tree.receiveShadow = true;
    treeHalo.position.set(0, 3.6, 0);
    scene.add(tree, treeHalo);
  }

  /* Mala Visión: a woman of white bark, rooted where she stands. */
  const herMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.82, emissive: 0xd6e2ff, emissiveIntensity: 0.3, flatShading: true, transparent: true });
  const her = new THREE.Group(), body = new THREE.Group();
  body.name = 'body'; her.add(body); her.visible = false; scene.add(her);
  let armL, armR, eyesS, souls, halo, herLight;
  {
    const prof = [[0.001, 0], [0.62, 0], [0.5, 0.07], [0.38, 0.28], [0.3, 0.6], [0.23, 0.95], [0.17, 1.18], [0.2, 1.38], [0.24, 1.52], [0.25, 1.63], [0.2, 1.74], [0.085, 1.82], [0.07, 1.92], [0.001, 1.95]];
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 22);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.06 * Math.sin(Math.atan2(z, x) * 9 + y * 3) + 0.03 * Math.sin(y * 17);
      p.setX(i, x * k); p.setZ(i, z * k * 0.82);
    }
    g.computeVertexNormals();
    const torso = new THREE.Mesh(g, herMat); torso.castShadow = true; body.add(torso);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 2), herMat);
    head.scale.set(0.95, 1.22, 1); head.position.set(0, 2.08, 0.02); head.castShadow = true; body.add(head);
    const hair = [];
    for (let i = 0; i < 14; i++) {
      const a = Math.PI / 2 + (i / 13) * Math.PI + (rand() - 0.5) * 0.2, end = 0.9 + rand() * 0.5, fl = 0.28 + rand() * 0.1;
      hair.push(taper([[Math.sin(a) * 0.12, 2.14, Math.cos(a) * 0.11], [Math.sin(a) * 0.2, 1.7, Math.cos(a) * 0.18], [Math.sin(a) * fl, end, Math.cos(a) * 0.24]], 0.016, 0.004, 10, 4));
    }
    body.add(new THREE.Mesh(mergeGeometries(hair), herMat));
    const arm = (side) => {
      const grp = new THREE.Group(); grp.name = side < 0 ? 'armL' : 'armR'; grp.position.set(side * 0.22, 1.6, 0);
      const pts = [[0, 0, 0], [side * 0.25, 0.28, 0.06], [side * 0.42, 0.7, 0.08], [side * 0.52, 1.15, 0.02]], hand = pts[3];
      const parts = [taper(pts, 0.05, 0.028, 12, 6)];
      for (let f = 0; f < 4; f++) {
        const sp = (f - 1.5) * 0.22;
        parts.push(taper([hand, [hand[0] + side * (0.06 + sp * 0.3), hand[1] + 0.18, hand[2] + sp * 0.4], [hand[0] + side * (0.1 + sp * 0.6), hand[1] + 0.38 + rand() * 0.1, hand[2] + sp * 0.7]], 0.02, 0.004, 6, 4));
      }
      parts.push(taper([pts[2], [pts[2][0] + side * 0.2, pts[2][1] + 0.12, 0.1], [pts[2][0] + side * 0.32, pts[2][1] + 0.3, 0.12]], 0.016, 0.004, 6, 4));
      const m = new THREE.Mesh(mergeGeometries(parts), herMat); m.castShadow = true;
      grp.add(m); body.add(grp); return grp;
    };
    armL = arm(-1); armR = arm(1);
    const roots = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.3, L = 0.9 + rand() * 0.9;
      roots.push(taper([[Math.sin(a) * 0.4, 0.15, Math.cos(a) * 0.4], [Math.sin(a) * (0.4 + L * 0.5), 0.05, Math.cos(a) * (0.4 + L * 0.5)], [Math.sin(a) * (0.4 + L), -0.08, Math.cos(a) * (0.4 + L)]], 0.07, 0.015, 8, 5));
    }
    her.add(new THREE.Mesh(mergeGeometries(roots), herMat));
    eyesS = [-1, 1].map((s) => { const e = glow(0xeef4ff, 1, 0.12); e.position.set(s * 0.045, 2.11, 0.17); body.add(e); return e; });
    souls = Array.from({ length: 7 }, () => { const s = glow(0xffe6b0, 0.7, 0.07); body.add(s); return s; });
    halo = glow(0xcfdcff, 0.3, 4.2); halo.position.set(0, 1.3, -0.15); body.add(halo);
    herLight = new THREE.PointLight(0xdbe6ff, 0, 14, 1.6); herLight.position.set(0, 1.5, 0.5); body.add(herLight);
  }
  /* Decoys for the last round: copies that the mirror does not show. */
  const decoyMat = herMat.clone(); decoyMat.emissiveIntensity = 0.32;
  const decoyGroup = new THREE.Group(), decoys = [];
  decoyGroup.visible = false; scene.add(decoyGroup);
  for (let i = 0; i < 5; i++) {
    const d = her.clone(); d.visible = false;
    d.traverse((o) => { if (o.isMesh) o.material = decoyMat; if (o.isLight) o.visible = false; });
    d.getObjectByName('armL').rotation.z = 2.25; d.getObjectByName('armR').rotation.z = -2.25;
    decoyGroup.add(d); decoys.push(d);
  }

  /* Fireflies in the woods, and the moths she comes apart into. */
  const flies = { seeds: [], pos: new Float32Array(40 * 3) };
  for (let i = 0; i < 40; i++) flies.seeds.push({ a: rand() * 6.28, r: 11 + rand() * 12, y: 0.4 + rand() * 2.2, s: 0.05 + rand() * 0.12, p: rand() * 6.28 });
  const flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(flies.pos, 3));
  const flyPts = new THREE.Points(flyGeo, new THREE.PointsMaterial({ map: glowTex, color: 0xd7ff8c, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
  flyPts.frustumCulled = false; scene.add(flyPts);
  const MOTHS = 240, mPos = new Float32Array(MOTHS * 3).fill(-100), mVel = new Float32Array(MOTHS * 3);
  const mothGeo = new THREE.BufferGeometry(); mothGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  const mothMat = new THREE.PointsMaterial({ map: glowTex, color: 0xf4f6ff, size: 0.12, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const moths = new THREE.Points(mothGeo, mothMat); moths.frustumCulled = false; scene.add(moths);
  let mothLife = 0;
  function burstMoths(c, n) {
    for (let i = 0; i < MOTHS; i++) {
      if (i >= n) { mPos[i * 3 + 1] = -100; mVel.set([0, 0, 0], i * 3); continue; }
      const a = rand() * 6.28, s = 0.6 + rand() * 1.8;
      mPos.set([c.x + (rand() - 0.5) * 0.6, c.y + (rand() - 0.5) * 1.4, c.z + (rand() - 0.5) * 0.6], i * 3);
      mVel.set([Math.cos(a) * s, 0.8 + rand() * 2, Math.sin(a) * s], i * 3);
    }
    mothGeo.attributes.position.needsUpdate = true; mothLife = 3.2;
  }

  /* Glow: bloom where the browser can load it, plain rendering where it can't. */
  let composer = null;
  try {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js')]);
    composer = new EffectComposer(R);
    composer.addPass(new RenderPass(scene, cam));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.6, 0.45, 0.86));
    composer.addPass(new OutputPass());
  } catch (err) { console.warn('Bloom unavailable', err); composer = null; }

  /* Sound: wind, crickets and her voice, all made in the browser. Placed in 3D, so headphones help. */
  let audio = null, muted = false;
  function makeAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC(), now = () => ctx.currentTime;
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
    const bed = ctx.createGain(); bed.connect(out);
    const len = ctx.sampleRate * 2;
    const white = ctx.createBuffer(1, len, ctx.sampleRate), brown = ctx.createBuffer(1, len * 2, ctx.sampleRate);
    { const d = white.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    { const d = brown.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } }
    const ir = ctx.createBuffer(2, ctx.sampleRate * 2.6, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4); }
    const verb = ctx.createConvolver(); verb.buffer = ir;
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.4; verb.connect(verbOut).connect(bed);
    const src = (buf = white) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; };
    const filt = (type, f, q = 1) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    const env = (g, t, a, peak, hold, r) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.linearRampToValueAtTime(0, t + a + hold + r); };
    const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const at = (p) => {
      if (!p) return bed;
      const pn = ctx.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = 2.5; pn.rolloffFactor = 0.7;
      if (pn.positionX) { pn.positionX.value = p.x; pn.positionY.value = 1.5; pn.positionZ.value = p.z; } else pn.setPosition(p.x, 1.5, p.z);
      pn.connect(bed); pn.connect(verb); return pn;
    };
    { // wind that gusts
      const w = src(brown), f = filt('lowpass', 380), g = gain(0.22);
      w.connect(f).connect(g).connect(bed); w.start();
      const l1 = ctx.createOscillator(), g1 = gain(0.12); l1.frequency.value = 0.06; l1.connect(g1).connect(g.gain); l1.start();
      const l2 = ctx.createOscillator(), g2 = gain(160); l2.frequency.value = 0.11; l2.connect(g2).connect(f.frequency); l2.start();
    }
    return {
      ctx,
      whisper(p, secs = 1.2) {
        const t = now(), s = src(), b1 = filt('bandpass', 2600, 1.1), b2 = filt('bandpass', 1100, 2), g = gain();
        s.connect(b1).connect(g); s.connect(b2).connect(g); g.connect(at(p));
        const n = Math.max(2, Math.round(secs / 0.19));
        for (let i = 0; i < n; i++) {
          const st = t + i * 0.19, pk = 0.1 + Math.random() * 0.16;
          g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(pk, st + 0.05); g.gain.linearRampToValueAtTime(0, st + 0.16);
          b1.frequency.setValueAtTime(1800 + Math.random() * 1800, st);
        }
        s.start(t); s.stop(t + n * 0.19 + 0.2);
      },
      cry(p) {
        const t = now(), g = gain(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator(), vg = gain(9), g2 = gain(0.25), bp = filt('bandpass', 1000, 0.7);
        o2.type = 'triangle';
        const f0 = 540 + Math.random() * 60;
        for (const [o, m] of [[o1, 1], [o2, 2.01]]) {
          o.frequency.setValueAtTime(f0 * m * 0.9, t); o.frequency.linearRampToValueAtTime(f0 * m, t + 0.35); o.frequency.exponentialRampToValueAtTime(f0 * m * 0.66, t + 2.1);
        }
        vib.frequency.value = 5.2; vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
        o1.connect(g); o2.connect(g2).connect(g); g.connect(bp).connect(at(p));
        env(g, t, 0.3, 0.3, 1.1, 0.9);
        for (const o of [o1, o2, vib]) { o.start(t); o.stop(t + 2.6); }
      },
      charge(d) {
        const t = now(), s = src(), bp = filt('bandpass', 900, 4), o = ctx.createOscillator(), og = gain(0.16), g = gain();
        bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(7000, t + d);
        o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(1500, t + d);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + d);
        s.connect(bp).connect(g); o.connect(og).connect(g); g.connect(bed);
        s.start(t); o.start(t); s.stop(t + d + 0.05); o.stop(t + d + 0.05);
        return { stop() { const n = now(); g.gain.cancelScheduledValues(n); g.gain.setTargetAtTime(0, n, 0.05); } };
      },
      flash() {
        const t = now(), s = src(), g = gain(), o = ctx.createOscillator(), og = gain();
        s.connect(filt('highpass', 900)).connect(g); g.connect(bed); g.connect(verb);
        env(g, t, 0.01, 0.45, 0.05, 0.9);
        o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.6); o.connect(og).connect(bed); env(og, t, 0.01, 0.5, 0.05, 0.6);
        s.start(t); s.stop(t + 1.2); o.start(t); o.stop(t + 0.8);
      },
      shutter() {
        const t = now();
        for (const d of [0, 0.07]) { const s = src(), g = gain(); s.connect(filt('highpass', 2500)).connect(g).connect(out); env(g, t + d, 0.002, 0.3, 0.01, 0.04); s.start(t + d); s.stop(t + d + 0.1); }
      },
      shriek(p) {
        const t = now(), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator(), vg = gain(40), g = gain();
        o1.type = o2.type = 'sawtooth';
        o1.frequency.setValueAtTime(1100, t); o1.frequency.exponentialRampToValueAtTime(260, t + 1.1);
        o2.frequency.setValueAtTime(1160, t); o2.frequency.exponentialRampToValueAtTime(240, t + 1.1);
        vib.frequency.value = 13; vib.connect(vg); vg.connect(o1.frequency); vg.connect(o2.frequency);
        const bp = filt('bandpass', 1500, 0.9); o1.connect(bp); o2.connect(bp); bp.connect(g).connect(at(p));
        env(g, t, 0.02, 0.14, 0.5, 0.6);
        for (const o of [o1, o2, vib]) { o.start(t); o.stop(t + 1.3); }
      },
      hurt() {
        const t = now(), o = ctx.createOscillator(), g = gain();
        o.frequency.value = 3150; o.connect(g).connect(out); env(g, t + 0.1, 0.05, 0.05, 0.4, 1.6);
        o.start(t); o.stop(t + 2.3);
      },
      moths(secs) {
        const t = now();
        for (let i = 0; i < 40; i++) {
          const st = t + Math.random() * secs, s = src(), g = gain();
          s.connect(filt('bandpass', 500 + Math.random() * 500, 3)).connect(g).connect(bed);
          env(g, st, 0.005, 0.12, 0.01, 0.03); s.start(st); s.stop(st + 0.06);
        }
      },
      chirp() {
        const t = now(), o = ctx.createOscillator(), am = ctx.createOscillator(), ag = gain(0.5), g = gain(), g2 = gain(0.5);
        o.frequency.value = 4200 + Math.random() * 700; am.frequency.value = 28;
        am.connect(ag).connect(g2.gain);
        let dst = bed;
        if (ctx.createStereoPanner) { dst = ctx.createStereoPanner(); dst.pan.value = Math.random() * 2 - 1; dst.connect(bed); }
        o.connect(g2).connect(g).connect(dst);
        env(g, t, 0.01, 0.022, 0.14, 0.04);
        o.start(t); am.start(t); o.stop(t + 0.25); am.stop(t + 0.25);
      },
      duck(on) { bed.gain.setTargetAtTime(on ? 0.12 : 1, now(), 0.4); },
      mute(on) { out.gain.setTargetAtTime(on ? 0 : 0.9, now(), 0.05); },
      listen(p, d) {
        const L = ctx.listener;
        if (L.positionX) {
          L.positionX.value = p.x; L.positionY.value = p.y; L.positionZ.value = p.z;
          L.forwardX.value = d.x; L.forwardY.value = d.y; L.forwardZ.value = d.z; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
        } else { L.setPosition(p.x, p.y, p.z); L.setOrientation(d.x, d.y, d.z, 0, 1, 0); }
      },
    };
  }
  const sfx = new Proxy({}, { get: (_, k) => (...a) => { try { return audio && !muted ? audio[k](...a) : null; } catch (e) { return null; } } });

  /* The fight. */
  const EYE = 1.6, AIM = small ? 0.2 : 0.16;
  const ROUNDS = [
    { tele: 2.4, feints: [], idle: 7, hide: false, decoys: 0 },
    { tele: 1.7, feints: [1], idle: 5.5, hide: true, decoys: 0 },
    { tele: 1.2, feints: [0, 2], idle: 4.5, hide: true, decoys: 5 },
  ];
  const APPROACH = [17, 13.5, 10, 6.2], CENTRE = new THREE.Vector3(0, 0, 0.8);
  const pl = { x: 0, z: APPROACH[0], yaw: 0, pitch: 0.03, mirror: false };
  const hs = { glow: 0.3, glowT: 0.3, slump: 0, slumpT: 0, kneel: 0, kneelT: 0, op: 0, opT: 0, spot: -1, move: null, flick: 0 };
  let phase = 'menu', pt = 0, token = 0, step = 0, rnd = 0, attack = 0, eyes = 3, time = 0;
  let nextCry = 0, nextWhisper = 0, chirpT = 1, idleLeft = 0, shotCool = 0, settleT = 0, settleAt = 0, treeGlow = 0.05, treeGlowT = 0.05;
  let walk = null, turn = null, ch = null, chargeSnd = null, frost = 0, decoysLive = false, raf = 0, needResize = false;
  const later = [], keys = {}, clock = new THREE.Clock();
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), fwd = new THREE.Vector3();
  const go = (p) => { phase = p; pt = 0; token++; hud(); };
  const after = (secs, fn) => later.push({ t: secs, fn, tk: token });
  const soon = (secs, fn) => later.push({ t: secs, fn, tk: -1 });
  const ui = {
    cap: $('tr-caption'), eyes: $('tr-eyes'), round: $('tr-round'), meter: $('tr-meter'), white: $('tr-white'), frost: $('tr-frost'),
    ret: $('tr-reticle'), selfie: $('tr-selfie'), edgeL: $('tr-edge-l'), edgeR: $('tr-edge-r'), acts: $('tr-actions'),
    card: $('tr-card'), dark: $('tr-dark'), darkText: $('tr-dark-text'), darkRing: $('tr-dark-ring'), sound: $('tr-sound'),
  };
  let capLeft = 0;
  function say(html, secs = 4) { ui.cap.innerHTML = html; ui.cap.style.opacity = '1'; capLeft = secs; }
  function white(v, ms) { ui.white.style.transition = `opacity ${ms}ms ease`; ui.white.style.opacity = String(reduced ? Math.min(v, 0.7) : v); }
  const EYE_SVG = '<svg viewBox="0 0 26 16" aria-hidden="true"><path d="M1 8c3-4.5 7-7 12-7s9 2.5 12 7c-3 4.5-7 7-12 7S4 12.5 1 8z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="13" cy="8" r="3.4" fill="currentColor"/></svg>';
  function hud() {
    ui.eyes.innerHTML = [0, 1, 2].map((i) => `<span class="${i < eyes ? '' : 'gone'}">${EYE_SVG}</span>`).join('');
    ui.eyes.setAttribute('aria-label', `${eyes} of 3 eyes left`);
    const label = { menu: '', approach: 'The circle', reveal: 'The circle', hide: 'Find her', final: 'The last picture', settle: '', break: '', end: '', lost: '' }[phase];
    ui.round.textContent = label !== undefined ? label : `Round ${Math.min(rnd + 1, 3)} of 3`;
    ui.meter.hidden = phase !== 'idle';
  }

  const ACT = {
    answer: { label: 'Answer her', key: 'E', run: () => answer() },
    away: { label: 'Look away', key: 'L', run: () => lookAway() },
    mirror: { label: 'Mirror', key: 'M', toggle: true, run: () => setMirror(!pl.mirror) },
    shutter: { label: 'Take a picture', key: 'Space', shutter: true, run: () => shoot() },
    down: { label: 'Lay the phone down', key: 'P', run: () => settle() },
  };
  const KEYMAP = { e: 'answer', l: 'away', m: 'mirror', ' ': 'shutter', p: 'down' };
  let shown = [];
  function actions(list) {
    shown = list; ui.acts.innerHTML = '';
    for (const id of list) {
      const a = ACT[id], b = document.createElement('button');
      b.type = 'button'; b.dataset.act = id;
      if (a.shutter) { b.className = 'tr-shutter'; b.setAttribute('aria-label', small ? a.label : `${a.label} (${a.key})`); }
      else { b.className = 'tr-act'; b.innerHTML = a.label + (small ? '' : `<kbd>${a.key}</kbd>`); }
      if (a.toggle) b.setAttribute('aria-pressed', String(pl.mirror));
      b.addEventListener('click', (e) => { e.stopPropagation(); a.run(); }, sig);
      ui.acts.appendChild(b);
    }
  }
  function setMirror(on) {
    pl.mirror = on;
    R.domElement.style.transform = on ? 'scaleX(-1)' : '';     // the page's canvas shows the selfie camera's mirror image
    ui.selfie.hidden = !on;
    const b = ui.acts.querySelector('[data-act="mirror"]');
    if (b) b.setAttribute('aria-pressed', String(on));
  }

  const spotPos = (i) => {
    const t = ring[i], d = Math.hypot(t.x, t.z), ux = -t.x / d, uz = -t.z / d;
    return new THREE.Vector3(t.x + ux * 0.75 + uz * 0.5, 0, t.z + uz * 0.75 - ux * 0.5);
  };
  const viewYaw = () => pl.yaw + (pl.mirror ? Math.PI : 0);
  const bearing = (p) => Math.atan2(p.x - pl.x, -(p.z - pl.z));
  function spotAway(min, avoid = -1) {
    let best = 0, score = -1;
    ring.forEach((t, i) => {
      if (i === avoid) return;
      const d = Math.abs(wrapA(bearing(spotPos(i)) - viewYaw())), s = d < min ? d * 0.2 : d + rand() * 1.2;
      if (s > score) { score = s; best = i; }
    });
    return best;
  }
  const chest = (out) => out.set(her.position.x, 1.45 - hs.kneel * 0.5, her.position.z);
  function onScreen(p) { tmp.copy(p).project(cam); return tmp.z < 1 && Math.abs(tmp.x) < 0.95 && Math.abs(tmp.y) < 0.95; }
  function inReticle(p) { cam.getWorldDirection(fwd); tmp.copy(p).sub(cam.position).normalize(); return fwd.angleTo(tmp) < AIM; }
  const herVisible = () => her.visible && hs.op > 0.4;
  function moveHer(to, secs) { hs.move = { from: her.position.clone(), to: to.clone(), t: 0, d: secs }; }
  function decoysOn(on, n = 0, avoid = -1) {
    decoysLive = on;
    decoys.forEach((d) => (d.visible = false));
    if (!on) return;
    const spots = ring.map((_, i) => i).filter((i) => i !== avoid).sort(() => rand() - 0.5).slice(0, n);
    spots.forEach((s, i) => { decoys[i].position.copy(spotPos(s)); decoys[i].visible = true; });
  }

  /* Phases. */
  function start() {
    ui.card.hidden = true;
    if (!audio) { try { audio = makeAudio(); } catch (e) { audio = null; } }
    if (audio) audio.ctx.resume().catch(() => {});
    reset(true);
  }
  function reset(fromTop) {
    later.length = 0; eyes = 3; rnd = 0; attack = 0; ch = null; walk = null; turn = null;
    if (chargeSnd) chargeSnd.stop();
    setMirror(false); decoysOn(false);
    Object.assign(hs, { slump: 0, slumpT: 0, kneel: 0, kneelT: 0, op: 0, opT: 0, move: null, glow: 0.3, glowT: 0.3 });
    her.visible = false; her.position.copy(CENTRE); ui.dark.hidden = true; trailEl.classList.remove('is-dark'); ui.ret.hidden = true; white(0, 200);
    if (audio) audio.duck(false);
    pl.x = 0; pl.yaw = 0; pl.pitch = 0.04;
    if (fromTop) {
      pl.z = APPROACH[0]; step = 0; treeGlowT = 0.07; nextCry = 0.8;
      go('approach'); actions(['answer']);
      say('Somewhere in the white trees a woman is crying. <b>Answer her.</b>', 6);
    } else { pl.z = APPROACH[3]; treeGlowT = 0.5; beginHide(); }
  }
  function answer() {
    if (phase !== 'approach' || walk || step >= 3) return;
    step++;
    sfx.whisper(CENTRE, 1.3);
    say(`<i>${['“Who answers me?”', '“Closer. Nobody comes closer.”', '“Then look at me.”'][step - 1]}</i>`, 3.4);
    walk = { from: pl.z, to: APPROACH[step], t: 0, d: 1.7 };
    treeGlowT = 0.07 + step * 0.1; nextCry = 5;
    if (step === 3) { actions([]); after(2.2, reveal); }
  }
  function reveal() {
    go('reveal');
    sfx.flash(); white(1, 450);
    after(0.6, () => {
      her.visible = true; her.position.copy(CENTRE); Object.assign(hs, { op: 1, opT: 1, slump: 0, slumpT: 0, glow: 1.4, glowT: 0.7 });
      pl.yaw = 0; pl.pitch = 0.12; white(0, 1700);
    });
    after(1.5, () => { say('<i>“You came to see the monsters.”</i>', 3.2); sfx.whisper(CENTRE, 1.6); });
    after(4.3, () => { say('<i>“See me first.”</i>', 2.4); hs.glowT = 1.4; sfx.whisper(CENTRE, 0.8); });
    after(6.2, () => { say('<i>“Now find me.”</i>', 3); hs.opT = 0; burstMoths(chest(tmp2), 70); sfx.moths(0.9); });
    after(7.3, beginHide);
  }
  function beginHide() {
    go('hide');
    hs.spot = spotAway(1.7); her.position.copy(spotPos(hs.spot)); her.visible = true;
    Object.assign(hs, { op: 0, opT: 0.85, glowT: 0.45, slumpT: 0.3, kneelT: 0, move: null });
    actions(['shutter']); ui.ret.hidden = false; nextWhisper = 1.2;
    say(`Find her among the white trees and <b>take her picture</b>. ${small ? 'Drag to look around.' : 'Drag to look around, or use the arrow keys.'}`, 7);
  }
  function beginRound(r) {
    rnd = r; attack = 0; hs.slumpT = 0; hs.kneelT = 0; hud();
    actions(['away', 'shutter', 'mirror']); ui.ret.hidden = false;
    say(`<b>Round ${r + 1} of 3.</b> ` + [`When her light builds, <b>look away</b> before it lands${small ? '.' : ' (L).'}`, 'Faster now, and she can fake it.', 'Fastest of all. Trust the silence.'][r], 4.2);
    after(1.8, beginAttack);
  }
  function beginAttack() {
    go('charge');
    const R = ROUNDS[rnd];
    ch = { sub: 'build', p: 0, tele: R.tele, feint: R.feints.includes(attack) };
    hs.slumpT = 0; chargeSnd = sfx.charge(R.tele);
    if (rand() < 0.6) say(`<i>${['“Look at me.”', '“Don’t turn away.”', '“Everyone looks, in the end.”'][(rand() * 3) | 0]}</i>`, 1.6);
  }
  function release() {
    ch.sub = 'after'; ch.t = 1.2; frost = 0;
    sfx.flash(); hs.glow = 2.6; hs.glowT = 0.5;
    cam.updateMatrixWorld();
    if (herVisible() && onScreen(chest(tmp2))) caught('<i>“There you are.”</i> She caught your eye.');
    else { say('You looked away in time.', 1.4); white(0.22, 60); soon(0.1, () => white(0, 500)); }
  }
  function caught(msg) {
    eyes--; hud(); sfx.hurt();
    white(1, 80); soon(1.1, () => white(0, 1400));
    if (eyes <= 0) {
      if (chargeSnd) chargeSnd.stop();
      say('Her light fills everything.', 3); actions([]); ui.ret.hidden = true; go('lost');
      after(2.6, () => endCard('lost'));
      return;
    }
    say(`${msg} <b>${eyes} ${eyes === 1 ? 'eye' : 'eyes'} left.</b>`, 3);
  }
  function beginIdle() {
    go('idle');
    const R = ROUNDS[rnd];
    hs.slumpT = 1; hs.glowT = 0.22; idleLeft = R.idle; nextWhisper = 0.6;
    if (R.hide) { hs.spot = spotAway(0.9); moveHer(spotPos(hs.spot), 1.1); }
    if (R.decoys) after(1.1, () => decoysOn(true, R.decoys, hs.spot));
    say([
      `Her light is spent. Tap <b>Mirror</b> to turn your back, find her over your shoulder, then <b>take the picture</b>.`,
      'She slipped into the trees. Find her in the mirror before she recovers.',
      '<i>“Which one am I?”</i> Only the real one shows in the mirror.',
    ][rnd], rnd === 0 ? 6.5 : 4.5);
  }
  function hitHer(kind) {
    sfx.shriek(her.position); hs.glow = 2.2; hs.glowT = 0.5;
    burstMoths(chest(tmp2), 30); decoysOn(false); moveHer(CENTRE, 0.9); actions([]);
    if (kind === 'open') {
      say('<i>[she shrieks]</i> “Light. You brought light.”', 3); go('stagger'); after(2.4, () => beginRound(0));
      return;
    }
    say(`<i>${['“Behind you. Clever.”', '“You won’t even look at me.”', '“Coward. Clever coward.”'][rnd]}</i>`, 3);
    rnd++; go('stagger');
    if (rnd >= 3) after(2.2, beginFinal); else after(2.4, () => beginRound(rnd));
  }
  function beginFinal() {
    go('final'); setMirror(false);
    Object.assign(hs, { kneelT: 1, slumpT: 1, glowT: 0.2 });
    actions(['shutter', 'down']); ui.ret.hidden = false;
    say('<i>“Go on. Finish what they started.”</i>', 3.6);
    after(4, () => say(`Take the last picture, or <b>lay the phone down</b> and look at her yourself.`, 9));
  }
  const LAST = [[1.5, '“Nobody has looked at me without a machine since the fire.”'], [4.2, '“They made a star of me. The hill kept the rest.”'], [6.9, '“Seven souls in my chest. I carry them because I lit it.”'], [9.4, '“My name is Porâsý. Now I can rest.”']];
  function settle() {
    if (phase !== 'final') return;
    go('settle'); actions([]); ui.ret.hidden = true; ui.dark.hidden = false; trailEl.classList.add('is-dark'); settleT = 0; settleAt = performance.now();
    ui.darkText.innerHTML = 'Keep still for ten seconds. Touching the screen picks the phone back up.';
    if (audio) audio.duck(true);
  }
  function cancelSettle() {
    if (phase !== 'settle' || performance.now() - settleAt < 350) return;
    ui.dark.hidden = true; trailEl.classList.remove('is-dark'); if (audio) audio.duck(false);
    beginFinal(); say('You picked the phone up too soon. She is still waiting.', 4);
  }
  function breakHer() {
    go('break'); actions([]); ui.ret.hidden = true;
    sfx.shriek(her.position); sfx.moths(2.6); burstMoths(chest(tmp2), MOTHS); hs.opT = 0; hs.op = 0.3;
    say('<i>[she comes apart into white moths]</i>', 4);
    after(4, () => endCard('dark'));
  }
  function shoot() {
    if (shotCool > 0 || !['hide', 'idle', 'charge', 'final'].includes(phase)) return;
    shotCool = 0.45; sfx.shutter(); white(0.55, 40); soon(0.09, () => white(0, 420));
    cam.updateMatrixWorld();
    const aimed = herVisible() && inReticle(chest(tmp2));
    if (phase === 'hide') { if (aimed) hitHer('open'); else say('Nothing there. Listen for her.', 2.2); }
    else if (phase === 'charge') say('She is too bright to hurt now. Wait until her light is spent.', 2.6);
    else if (phase === 'final') { if (aimed) breakHer(); else say('Missed. She is at the centre tree.', 2); }
    else if (aimed) { if (pl.mirror) hitHer('mirror'); else caught('You looked straight at her.'); }
    else if (!pl.mirror && decoysLive) {
      const d = decoys.find((x) => x.visible && inReticle(tmp2.set(x.position.x, 1.45, x.position.z)));
      if (d) { d.visible = false; burstMoths(tmp2, 40); sfx.moths(0.6); say('Only a reflection. She isn’t there.', 2.2); }
      else say('Missed.', 1.4);
    } else say('Missed.', 1.4);
  }
  function lookAway() {
    if (turn || !['charge', 'idle', 'hide', 'stagger'].includes(phase)) return;
    const rel = wrapA(bearing(chest(tmp2)) - viewYaw());
    turn = { from: pl.yaw, to: pl.yaw + (rel > 0 ? -1.95 : 1.95), t: 0, d: 0.3 };
  }
  const ENDS = {
    light: ['Light path', 'She rests', '<p>You laid the phone down and looked at her yourself. She gave you her name, <b>Porâsý</b>: the woman who lit the fire that sealed the seven sons.</p><p>On the trail this is the one moment the screen goes dark. Settle most of the sons like this and the guide takes you up the ridge at the plaza.</p>'],
    dark: ['Dark path', 'You broke her', '<p>She came apart into white moths, and you kept her eye. On the dark path it shows you treasure lights other players can’t see.</p><p>Break most of the sons like this and the guide takes you into the forest at the plaza.</p>'],
    lost: ['Blinded', 'She kept her watch', '<p>She caught your eye three times. Look away as her light builds, and once she is awake, only strike through the mirror.</p>'],
  };
  function endCard(kind) {
    go('end'); actions([]); ui.ret.hidden = true; ui.dark.hidden = true; trailEl.classList.remove('is-dark'); setMirror(false); decoysOn(false);
    if (audio) audio.duck(false);
    const [kick, title, body] = ENDS[kind];
    ui.card.innerHTML = `<div class="in"><p class="eyebrow">${kick}</p><h3>${title}</h3>${body}<div class="actions">${kind === 'lost' ? '<button class="btn" type="button" data-do="retry">Try again</button>' : ''}<button class="btn${kind === 'lost' ? ' ghost' : ''}" type="button" data-do="again">Play from the start</button><button class="btn ghost" type="button" data-do="back">Back to the hill</button></div><p class="note">Story draft: Mala Visión as Porâsý. A prototype of the trail’s midpoint, not the final game.</p></div>`;
    ui.card.hidden = false;
    const b = ui.card.querySelector('.btn'); if (b) b.focus({ preventScroll: true });
  }
  ui.card.addEventListener('click', (e) => {
    const d = e.target.closest('[data-do]'); if (!d) return;
    if (d.dataset.do === 'start') start();
    else if (d.dataset.do === 'again') { ui.card.hidden = true; reset(true); }
    else if (d.dataset.do === 'retry') { ui.card.hidden = true; reset(false); }
    else if (d.dataset.do === 'back') closeTrail();
  }, sig);
  ui.sound.addEventListener('click', () => {
    muted = !muted; if (audio) audio.mute(muted);
    ui.sound.setAttribute('aria-pressed', String(!muted)); ui.sound.textContent = muted ? 'Sound off' : 'Sound on';
  }, sig);

  /* Looking around: drag, or the arrow keys. In the mirror the picture is flipped, so the drag is too. */
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} }, sig);
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = ((cam.fov * Math.PI) / 180 / H()) * 1.1, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    pl.yaw -= dx * k * (pl.mirror ? -1 : 1); pl.pitch = clamp(pl.pitch + dy * k, -0.55, 0.7); turn = null;
  }, sig);
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
  canvas.addEventListener('pointerup', endDrag, sig); canvas.addEventListener('pointercancel', endDrag, sig);
  trailEl.addEventListener('pointerdown', () => { if (phase === 'settle') cancelSettle(); }, { capture: true, signal: ac.signal });
  addEventListener('keydown', (e) => {
    if (trailEl.hidden || e.key === 'Escape') return;
    if (phase === 'settle') { cancelSettle(); return; }
    if (!ui.card.hidden || (e.target.closest && e.target.closest('input, textarea'))) return;
    const id = KEYMAP[e.key.toLowerCase()];
    if (id && shown.includes(id)) { e.preventDefault(); if (!e.repeat) ACT[id].run(); }
    if (e.key.startsWith('Arrow')) { keys[e.key] = true; e.preventDefault(); }
  }, sig);
  addEventListener('keyup', (e) => { keys[e.key] = false; }, sig);

  /* Every frame. */
  function update(dt) {
    pt += dt; shotCool -= dt;
    for (let i = later.length - 1; i >= 0; i--) {
      const l = later[i];
      if ((l.t -= dt) > 0) continue;
      later.splice(i, 1);
      if (l.tk === -1 || l.tk === token) l.fn();
    }
    const flip = pl.mirror ? -1 : 1;
    if (keys.ArrowLeft) pl.yaw -= 1.9 * dt * flip;
    if (keys.ArrowRight) pl.yaw += 1.9 * dt * flip;
    if (keys.ArrowUp) pl.pitch = clamp(pl.pitch + 1.2 * dt, -0.55, 0.7);
    if (keys.ArrowDown) pl.pitch = clamp(pl.pitch - 1.2 * dt, -0.55, 0.7);
    if (turn) { turn.t += dt; const k = Math.min(turn.t / turn.d, 1); pl.yaw = lerp(turn.from, turn.to, ease(k)); if (k >= 1) turn = null; }
    if (walk) { walk.t += dt; const k = Math.min(walk.t / walk.d, 1); pl.z = lerp(walk.from, walk.to, ease(k)); if (k >= 1) walk = null; }
    if (capLeft > 0 && (capLeft -= dt) <= 0) ui.cap.style.opacity = '0';

    if (phase === 'approach') {
      if ((nextCry -= dt) <= 0) { nextCry = 6; sfx.cry(CENTRE); if (!walk) say('<i>[a woman cries, somewhere in the white trees]</i>', 3.4); }
    } else if (phase === 'hide' || phase === 'idle') {
      if ((nextWhisper -= dt) <= 0) { nextWhisper = phase === 'hide' ? 2.6 : 3.2; sfx.whisper(her.position, phase === 'hide' ? 1 : 0.7); }
      if (phase === 'idle' && (idleLeft -= dt) <= 0) {
        decoysOn(false); hs.glowT = 0.6; hs.slumpT = 0;
        if (her.position.distanceTo(CENTRE) > 0.5) moveHer(CENTRE, 0.8);
        say('<i>“Again.”</i>', 1.8); go('stagger');
        after(1.4, () => { attack = 0; beginAttack(); });
      }
    } else if (phase === 'charge' && ch) {
      if (ch.sub === 'build' || ch.sub === 'quick') {
        ch.p += dt / ch.tele; hs.glowT = 0.5 + ch.p * 1.6; frost = ch.p;
        if (ch.sub === 'build' && ch.feint && ch.p >= 0.7) { ch.sub = 'feint'; ch.t = 0.75; frost = 0; hs.glowT = 0.35; if (chargeSnd) chargeSnd.stop(); say('<i>[her light falls]</i>', 1.1); }
        else if (ch.p >= 1) release();
      } else if (ch.sub === 'feint') {
        if ((ch.t -= dt) <= 0) { Object.assign(ch, { sub: 'quick', p: 0, tele: 0.55 }); chargeSnd = sfx.charge(0.55); }
      } else if (ch.sub === 'after' && (ch.t -= dt) <= 0) {
        ch = null; attack++;
        if (attack >= 3) beginIdle(); else beginAttack();
      }
    } else if (phase === 'settle') {
      settleT += dt;
      const shownLine = LAST.filter(([t]) => settleT >= t).pop();
      if (shownLine && ui.darkText.dataset.t !== String(shownLine[0])) { ui.darkText.dataset.t = String(shownLine[0]); ui.darkText.innerHTML = `<i>${shownLine[1]}</i>`; sfx.whisper(null, 1.4); }
      ui.darkRing.style.strokeDashoffset = String(176 * (1 - Math.min(settleT / 10.5, 1)));
      if (settleT >= 11) { ui.darkText.dataset.t = ''; endCard('light'); }
    }
    if (phase !== 'charge') frost = Math.max(0, frost - dt * 3);
    if (phase !== 'settle' && phase !== 'menu' && (chirpT -= dt) <= 0) { chirpT = 0.3 + rand() * 1.4; sfx.chirp(); }
  }

  function animate(dt) {
    const k = Math.min(1, dt * 5);
    hs.glow += (hs.glowT - hs.glow) * k; hs.slump += (hs.slumpT - hs.slump) * Math.min(1, dt * 3);
    hs.kneel += (hs.kneelT - hs.kneel) * Math.min(1, dt * 2); hs.op += (hs.opT - hs.op) * Math.min(1, dt * 4);
    if (hs.move) { const m = hs.move; m.t += dt; const e = Math.min(m.t / m.d, 1); her.position.lerpVectors(m.from, m.to, ease(e)); if (e >= 1) hs.move = null; }
    if (her.visible && hs.op < 0.01 && hs.opT === 0) her.visible = false;
    const face = Math.atan2(pl.x - her.position.x, pl.z - her.position.z);
    her.rotation.y += wrapA(face - her.rotation.y) * Math.min(1, dt * 4);
    const sway = Math.sin(time * 0.8) * 0.05;
    armL.rotation.z = hs.slump * 2.25 + sway; armR.rotation.z = -hs.slump * 2.25 - sway;
    body.position.y = -hs.kneel * 0.55; body.rotation.x = hs.kneel * 0.18 + Math.sin(time * 0.6) * 0.015;
    const flick = phase === 'hide' ? 0.85 + 0.15 * Math.sin(time * 7.3) * Math.sin(time * 3.1) : 1, op = hs.op * flick;
    herMat.opacity = op; herMat.emissiveIntensity = 0.1 + hs.glow * 0.36;
    eyesS.forEach((e) => { e.material.opacity = op; e.scale.setScalar(0.08 + hs.glow * 0.16 + Math.random() * 0.01); });
    halo.material.opacity = op * (0.05 + hs.glow * 0.2); halo.scale.setScalar(3 + hs.glow * 1.8);
    herLight.intensity = op * hs.glow * (small ? 4 : 6);
    souls.forEach((s, i) => { const a = time * 0.7 + (i / 7) * Math.PI * 2; s.position.set(Math.cos(a) * 0.075, 1.38 + Math.sin(a * 1.3) * 0.06, 0.2); s.material.opacity = op * 0.8; });
    decoyGroup.visible = decoysLive && !pl.mirror;
    decoys.forEach((d) => { if (d.visible) d.rotation.y = Math.atan2(pl.x - d.position.x, pl.z - d.position.z); });
    treeGlow += (treeGlowT - treeGlow) * Math.min(1, dt * 2);
    treeMat.emissiveIntensity = treeGlow + 0.04 * Math.sin(time * 1.7);
    treeHalo.material.opacity = treeGlow * 0.4;
    for (let i = 0; i < flies.seeds.length; i++) {
      const s = flies.seeds[i], a = s.a + time * s.s;
      flies.pos.set([Math.cos(a) * s.r, s.y + Math.sin(time * 0.9 + s.p) * 0.4 + (Math.sin(time * 2.3 + s.p) > 0.6 ? 0 : -30), Math.sin(a) * s.r], i * 3);
    }
    flyGeo.attributes.position.needsUpdate = true;
    if (mothLife > 0) {
      mothLife -= dt;
      for (let i = 0; i < MOTHS; i++) {
        if (mPos[i * 3 + 1] < -50) continue;
        mPos[i * 3] += (mVel[i * 3] + Math.sin(time * 20 + i) * 0.6) * dt; mPos[i * 3 + 1] += mVel[i * 3 + 1] * dt; mPos[i * 3 + 2] += (mVel[i * 3 + 2] + Math.cos(time * 17 + i) * 0.6) * dt;
        mVel[i * 3 + 1] += 0.3 * dt;
      }
      mothGeo.attributes.position.needsUpdate = true;
    }
    mothMat.opacity = clamp(mothLife / 1.2, 0, 1);
  }

  function placeCamera() {
    const yaw = viewYaw() + Math.sin(time * 0.37) * 0.006, pitch = pl.pitch + Math.sin(time * 0.53) * 0.005, cp = Math.cos(pitch);
    const bob = walk ? Math.sin((walk.t / walk.d) * Math.PI * 4) * 0.035 : 0;
    cam.position.set(pl.x, EYE + bob, pl.z);
    cam.lookAt(pl.x + Math.sin(yaw) * cp, EYE + bob + Math.sin(pitch), pl.z - Math.cos(yaw) * cp);
    cam.updateMatrixWorld();
    sky.position.copy(cam.position);
  }
  function overlays() {
    const show = herVisible();
    const vis = show && onScreen(chest(tmp2));
    ui.frost.style.opacity = String(frost * (vis ? 1 : 0.5));
    let l = 0, r = 0;
    if (show && !vis && (phase === 'hide' || (phase === 'idle' && rnd === 0))) {
      const side = wrapA(bearing(tmp2) - viewYaw()) * (pl.mirror ? -1 : 1);
      const a = 0.35 + 0.25 * Math.sin(time * 3);
      if (side < 0) l = a; else r = a;
    }
    ui.edgeL.style.opacity = String(l); ui.edgeR.style.opacity = String(r);
    ui.ret.classList.toggle('on', show && inReticle(tmp2));
    if (phase === 'idle') ui.meter.firstElementChild.style.transform = `scaleX(${clamp(idleLeft / ROUNDS[rnd].idle, 0, 1)})`;
  }
  function resize() {
    const w = W(), h = H();
    R.setSize(w, h); if (composer) composer.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix(); needResize = false;
  }
  addEventListener('resize', resize, sig);
  function loop() {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05); time += dt;
    update(dt); animate(dt); placeCamera(); overlays();
    if (audio) { cam.getWorldDirection(fwd); if (pl.mirror) fwd.negate(); audio.listen(cam.position, fwd); }
    if (composer) composer.render(); else R.render(scene, cam);
  }

  hud();
  const startBtn = ui.card.querySelector('[data-do="start"]');
  startBtn.disabled = false; startBtn.textContent = 'Enter the circle';
  resize(); raf = requestAnimationFrame(loop); startBtn.focus({ preventScroll: true });
  return {
    /* For recording the walkthrough video (render/trail_video.mjs): the fight on a fixed clock, driven by a script. */
    director: {
      get phase() { return phase; }, get eyes() { return eyes; }, get rnd() { return rnd; }, get shown() { return shown; }, get turning() { return !!turn; },
      get aimed() { return herVisible() && inReticle(chest(tmp2)); },
      get view() { cam.updateMatrixWorld(); return { yaw: +pl.yaw.toFixed(2), mirror: pl.mirror, her: +bearing(chest(tmp2)).toFixed(2), onScreen: onScreen(chest(tmp2)), visible: herVisible(), sub: ch && ch.sub, turn: !!turn }; },
      herYaw: () => bearing(chest(tmp2)) - (pl.mirror ? Math.PI : 0),
      turnTo(yaw, d = 0.7) { turn = { from: pl.yaw, to: pl.yaw + wrapA(yaw - pl.yaw), t: 0, d }; },
      stop() { cancelAnimationFrame(raf); raf = 0; },
      step(dt, draw = true) { time += dt; update(dt); animate(dt); placeCamera(); overlays(); if (draw) { if (composer) composer.render(); else R.render(scene, cam); } },
      start: () => start(), act: (id) => ACT[id].run(), mirror: (on) => setMirror(on), shoot: () => shoot(),
    },
    dispose() {                                            // everything this view put on the GPU, its sound and its listeners
      cancelAnimationFrame(raf); ac.abort(); R.domElement.style.transform = '';
      if (audio) audio.ctx.close().catch(() => {});
      if (composer) { composer.passes.forEach((p) => p.dispose && p.dispose()); composer.dispose(); }
      scene.traverse((o) => { if (o.isLight && o.shadow) o.shadow.dispose(); });
      disposeScene(scene);
    },
  };
}
