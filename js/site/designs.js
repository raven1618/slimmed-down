/* Designs: the cabin and the residence scenes (their buildings come from js/cabin.js, their look from
   js/look.js). Loaded the first time the Designs tab opens.
   One of the page's scripts in js/site/: they run in order and share one scope (see index.html). */
'use strict';

/* ================================================================ */
/*                   THE CABIN and THE RESIDENCE                     */
/* ================================================================ */
function sceneMaterials() {
  return {
    earth: new THREE.MeshStandardMaterial({ map: T.earth, bumpMap: T.earth, bumpScale: 1.2, roughness: 0.95 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.6, metalness: 0.15 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x4b3b2c, roughness: 1 }),
    roofGrass: new THREE.MeshStandardMaterial({ map: T.roofGrass, roughness: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9fb8bf, roughness: 0.04, metalness: 0.9, transparent: true, opacity: 0.22, envMapIntensity: 1.4 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b2722, roughness: 0.45, metalness: 0.6 }),
    timber: new THREE.MeshStandardMaterial({ map: T.wood, roughness: 0.7 }),
    deck: new THREE.MeshStandardMaterial({ map: T.deck, roughness: 0.8 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x9a8f82, roughness: 0.5 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.9 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.95 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: 0.55 }),
    counter: new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.35 }),
    sofa: new THREE.MeshStandardMaterial({ color: 0xc8b9a2, roughness: 0.95 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x2d2f30, roughness: 0.45, metalness: 0.7 }),
    panel: new THREE.MeshStandardMaterial({ map: T.solar, roughness: 0.2, metalness: 0.55 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x9a8a78, roughness: 0.92 }),
    tank: new THREE.MeshStandardMaterial({ color: 0x3e4a3c, roughness: 0.6, metalness: 0.3 }),
    pool: new THREE.MeshStandardMaterial({ color: 0x4aa3ad, roughness: 0.04, metalness: 0.15, transparent: true, opacity: 0.9 }),
    coping: new THREE.MeshStandardMaterial({ color: 0xcfc3ae, roughness: 0.85 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0x2a2622, emissive: 0xffc988, emissiveIntensity: 0 }),
    window: new THREE.MeshStandardMaterial({ color: 0x1b2326, roughness: 0.1, metalness: 0.6, emissive: 0xffbe7a, emissiveIntensity: 0 }),
    fire: new THREE.MeshBasicMaterial({ color: 0xff9a4a, transparent: true, opacity: 0 }),
  };
}

function groundMesh(heightFn, w, d, segW, segD, mat) {
  const geo = new THREE.PlaneGeometry(w, d, segW, segD);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, heightFn(x, z));
    uv.setXY(i, x / 6, z / 6);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  return m;
}

function buildHouseScene(kind) {
  const scene = new THREE.Scene();
  const SM = sceneMaterials();
  // The site's look (js/look.js), as in Walk the site: the Blender sky and sun, AgX colour, photo textures,
  // the same trees, grass and effects. Earth walls, deck and roof take the walk's textures (2 m tiles).
  const L = LOOKA, U = LOOK.uniforms(L), tint = new THREE.Color().setRGB(...LOOK.GRASS_TINT);
  const tex = (t, r) => { const c = t.clone(); c.repeat.set(r, r); c.needsUpdate = true; return c; };
  Object.assign(SM, CAB.materials(L));          // the walk's materials for walls, deck, roof, glass and furniture
  const lights = [], glows = [];
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 3000);

  const isCabin = kind === 'cabin';
  // Ground: flat in front, rising into the hill behind the house, with earth berms at the ends.
  const rearZ = (x) => (isCabin ? -3.3 : (x > 3.6 ? -6.5 : -4.0));
  const halfW = isCabin ? 4.55 : 13.7, roofH = isCabin ? 3.5 : 3.8;
  const hf = (x, z) => {
    const rz = rearZ(x);
    let y = 0;
    const back = rz - z;
    if (back > 0) y = Math.min(back / 1.7, 1) * roofH + Math.max(0, back - 1.7) * 0.3 + (fbm(x * 0.08, z * 0.08) - 0.5) * 1.6 * smooth(4, 20, back);
    const ax = Math.abs(x - (isCabin ? 0 : 0.6)) - halfW;
    if (ax > 0 && z < 1.5) {
      const berm = roofH * smooth(1.5, rz, z) * (1 - smooth(0.2, 4.5, ax));
      y = Math.max(y, berm);
    }
    if (back <= 0 && ax > 0) y += (fbm(x * 0.05 + 9, z * 0.05) - 0.5) * 0.8 * smooth(3, 25, Math.hypot(ax, z));
    if (!isCabin && z > 4 && z < 14 && x > -12 && x < 4) y = Math.min(y, -0.08);
    if (Math.abs(x - (isCabin ? 0 : 0.6)) < halfW + 0.3 && z > rz + 0.1 && z < (isCabin ? 6.6 : 7.0)) y = -0.08;
    return y;
  };
  // The walk's ground: lawn, with patches of leaf litter and a slow light-and-dark variation, as in the bake.
  const gmat = new THREE.MeshStandardMaterial({ map: tex(L.tex.grass, 2.5), normalMap: tex(L.tex.grassN, 2.5), color: tint, roughness: 1 }), litter = tex(L.tex.litter, 2.5);
  gmat.onBeforeCompile = (sh) => {
    sh.uniforms.uLitter = { value: litter };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uLitter; varying vec3 vGW;\n' + LOOK.NOISE)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { float n = ohNoise(vGW * 0.35) * 0.55 + ohNoise(vGW * 0.07) * 0.45;
          vec3 lit = texture2D(uLitter, vMapUv).rgb * vec3(1.0, 0.85, 0.62);
          diffuseColor.rgb = mix(diffuseColor.rgb, lit, smoothstep(0.56, 0.74, n) * 0.75) * mix(0.8, 1.06, ohNoise(vGW * 0.045)); }`);
  };
  const ground = groundMesh(hf, 260, 220, small ? 130 : 200, small ? 110 : 170, gmat);
  scene.add(ground);

  // The house itself.
  const house = new THREE.Group();
  if (isCabin) {
    house.add(CAB.quarryCabin(SM, lights));      // the same cabin as the quarry row in Walk the site (js/cabin.js)
  } else {
    house.add(...CAB.residence(SM, lights).children);     // the residence of the private side (js/cabin.js): living room, wing, pool
  }
  scene.add(house);

  // Grass tufts on the living roof(s), so the roof line reads as meadow.
  {
    const tuft = tuftGeometry(0.55);
    const mat = new THREE.MeshStandardMaterial({ color: 0x7f9347, roughness: 1, vertexColors: true });
    const R = rng(isCabin ? 3 : 4);
    const vols = isCabin ? [house.children[0]] : [house.children[0], house.children[1]];
    const count = isCabin ? 1600 : 3400;
    const tufts = new THREE.InstancedMesh(tuft, mat, count);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const vol = vols[i % vols.length];
      const W = vol.userData.W + (isCabin ? 0.6 : 1.8), D = vol.userData.D + (isCabin ? 1.6 : 2.2), oz = isCabin ? 0.55 : 0.7;
      const top = isCabin ? 3.58 : (vol === vols[1] ? 3.88 : 3.58);
      const edge = R() < 0.55;
      let lx = (R() - 0.5) * W, lz = oz + (R() - 0.5) * D;
      if (edge) { if (R() < 0.5) lz = oz + (R() < 0.5 ? -1 : 1) * (D / 2 - 0.25); else lx = (R() < 0.5 ? -1 : 1) * (W / 2 - 0.25); }
      v3.set(vol.position.x + lx, top, vol.position.z + lz);
      q.setFromAxisAngle(UP, R() * 6.28);
      const s = 0.7 + R() * 0.9; s3.set(s, s * (0.8 + R() * 0.8), s);
      tufts.setMatrixAt(i, m4.compose(v3, q, s3));
    }
    scene.add(tufts);
  }

  // Solar carport and rain tank.
  const cpX = isCabin ? -14 : -22, cpW = isCabin ? 7 : 11;
  {
    const cp = new THREE.Group();
    [[-cpW / 2 + 0.3, -2.4], [cpW / 2 - 0.3, -2.4], [-cpW / 2 + 0.3, 2.4], [cpW / 2 - 0.3, 2.4]].forEach(([px, pz]) => box(0.14, pz < 0 ? 3.1 : 2.6, 0.14, px, (pz < 0 ? 3.1 : 2.6) / 2, pz, SM.steel, cp));
    const top = new THREE.Group();
    box(cpW + 0.4, 0.08, 5.8, 0, 0, 0, SM.panel, top);
    box(cpW + 0.5, 0.18, 0.12, 0, -0.08, 2.92, SM.steel, top); box(cpW + 0.5, 0.18, 0.12, 0, -0.08, -2.92, SM.steel, top);
    top.position.set(0, 2.9, 0); top.rotation.x = 0.09;
    cp.add(top);
    box(cpW - 0.6, 0.06, 5.2, 0, 0.03, 0, new THREE.MeshStandardMaterial({ color: 0x8c8172, roughness: 1 }), cp, { cast: false });
    cp.position.set(cpX, 0, isCabin ? 6 : 7);
    scene.add(cp);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.5, 28), SM.tank);
    tank.position.set(cpX - cpW / 2 - 1.9, 1.25, isCabin ? 2.2 : 3); tank.castShadow = tank.receiveShadow = true;
    scene.add(tank);
  }

  // Stepping stones from the carport to the deck, and path lights.
  {
    const R = rng(isCabin ? 12 : 13);
    const stoneGeo = new THREE.CylinderGeometry(1, 1, 0.12, 7);
    const pts = isCabin ? [[-11, 9.5], [-8.8, 9.2], [-6.6, 8.6], [-4.6, 8.0], [-2.8, 7.4], [-1.4, 6.6]] : [[-17.6, 10.6], [-16.0, 9.4], [-14.6, 8.0], [-13.6, 6.4], [-13.2, 4.6]];
    const stones = new THREE.InstancedMesh(stoneGeo, SM.stone, pts.length);
    const m4 = new THREE.Matrix4();
    pts.forEach(([x, z], i) => {
      m4.compose(new THREE.Vector3(x, 0.05, z), new THREE.Quaternion().setFromAxisAngle(UP, R() * 3), new THREE.Vector3(0.75 + R() * 0.25, 1, 0.55 + R() * 0.2));
      stones.setMatrixAt(i, m4);
    });
    stones.receiveShadow = true; scene.add(stones);
    pts.filter((_, i) => i % 2 === 0).forEach(([x, z]) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 10), SM.lamp);
      b.position.set(x + 0.2, 0.35, z + 1.1); scene.add(b);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc788, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      glow.scale.set(1.6, 1.6, 1); glow.position.set(x + 0.2, 0.68, z + 1.1); scene.add(glow); glows.push(glow);
    });
  }

  // Fire pit with log benches (cabin) on a gravel circle.
  if (isCabin) {
    const pit = new THREE.Group();
    const gravel = new THREE.Mesh(new THREE.CircleGeometry(2.6, 28), new THREE.MeshStandardMaterial({ color: 0x9c8a74, roughness: 1 }));
    gravel.rotation.x = -Math.PI / 2; gravel.position.y = 0.03; gravel.receiveShadow = true; pit.add(gravel);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 8, 20), SM.stone); ring.rotation.x = Math.PI / 2; ring.position.y = 0.15; pit.add(ring);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.6, 10), SM.timber);
      log.rotation.z = Math.PI / 2; log.rotation.y = a + Math.PI / 2; log.position.set(Math.cos(a) * 1.75, 0.22, Math.sin(a) * 1.75); log.castShadow = true;
      pit.add(log);
    }
    const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff9a4a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    fire.scale.set(2.2, 2.2, 1); fire.position.y = 0.6; pit.add(fire); glows.push(fire);
    const fl = new THREE.PointLight(0xff8a3a, 0, 10, 1.5); fl.position.y = 0.8; pit.add(fl); lights.push(fl);
    pit.position.set(9.5, 0, 9.5);
    scene.add(pit);
  }

  // Trees on the slope behind, palms in the field like the ones on site, grass in front.
  let blades = null;
  {
    const R = rng(isCabin ? 41 : 42);
    const trees = [];
    for (let i = 0; i < 260; i++) {
      const x = (R() - 0.5) * 220, z = -12 - R() * 90;
      const near = Math.abs(x) < halfW + 8 && z > (isCabin ? -18 : -22);
      if (near) continue;
      trees.push([x, z]);
    }
    for (let i = 0; i < 40; i++) {
      const s = R() < 0.5 ? -1 : 1, x = s * (halfW + 22 + R() * 70), z = -10 + R() * 40;
      trees.push([x, z]);
    }
    // The walk's trees: pictures of the real tree models, species by height as in the renders.
    const td = [];
    const cams = VIEWS[kind].map((v) => v[1]);
    for (const [x, z] of trees) { if (cams.some((c) => Math.hypot(c[0] - x, c[2] - z) < 10)) continue; const h = 6 + R() * 10, r = R(); td.push(x, z, hf(x, z) - 0.2, h, h >= 14 ? 0 : h >= 9 ? (r < 0.5 ? 0 : 1) : (r < 0.6 ? 2 : 1)); }
    scene.add(LOOK.treeCards(U, L, new Float32Array(td), !small));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();

    const palmSpots = isCabin
      ? [[-9.5, -9, 1.0], [-6, -14, 1.15], [9, -11, 1.1], [14, -7, 1.0], [-24, 3, 1.05], [22, 2, 0.95], [-34, -16, 1.1], [30, -18, 1.0]]
      : [[-16, -12, 1.1], [-10, -16, 1.0], [14, -14, 1.1], [24, -10, 1.0], [-32, 2, 1.05], [30, 4, 0.95], [-40, -18, 1.1]];
    const palms = palmSpots.filter(([x, z]) => !cams.some((c) => Math.hypot(c[0] - x, c[2] - z) < 12));     // none right in front of a view
    const pm = new THREE.InstancedMesh(palmGeometry(15), palmMat, palms.length);
    palms.forEach(([x, z, s], i) => pm.setMatrixAt(i, m4.compose(v3.set(x, hf(x, z) - 0.2, z), q.setFromAxisAngle(UP, R() * 6), s3.set(s, s, s))));
    pm.castShadow = true; scene.add(pm);

    // The walk's grass blades, on a 0.5 m grid, kept off the house, pool, carport and fire pit.
    const G0 = [-70, -50], GS = 0.5, GX = 281, GZ = 221, gh = new Float32Array(GX * GZ), gmask = new Uint8Array(GX * GZ);
    for (let j = 0; j < GZ; j++) for (let i = 0; i < GX; i++) {
      const x = G0[0] + i * GS, z = G0[1] + j * GS, k = j * GX + i;
      gh[k] = hf(x, z);
      const onHouse = Math.abs(x - (isCabin ? 0 : 0.6)) < halfW + 1.2 && z > -7 && z < (isCabin ? 7.2 : 8.2);
      const onPool = !isCabin && x > -11.5 && x < 3 && z > 5.5 && z < 12;
      const onCar = Math.abs(x - cpX) < cpW / 2 + 0.6 && Math.abs(z - (isCabin ? 6 : 7)) < 3.4;
      const onPit = isCabin && Math.hypot(x - 9.5, z - 9.5) < 2.8;
      gmask[k] = onHouse || onPool || onCar || onPit ? 0 : 255;
    }
    const maskTex = new THREE.DataTexture(gmask, GX, GZ, THREE.RedFormat, THREE.UnsignedByteType);
    maskTex.unpackAlignment = 1; maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter; maskTex.needsUpdate = true;
    blades = LOOK.grass(U, L, { heights: gh, grid: [GX, GZ], origin: G0, step: GS, mask: maskTex, radius: small ? 13 : 20, count: small ? 26000 : 80000 });
    scene.add(blades);
  }

  // Sky, sun, night: the site's sky and the sun of the bake, as in Walk the site.
  const sunDir = U.uSun.value;
  const dome = LOOK.addSky(scene, renderer, U, L); scene.environmentIntensity = 0.8;      // the open sky, less what trees and slopes hide (as the bake found)
  const starField = stars(1400, 1200); starField.visible = false; scene.add(starField);
  const hemi = new THREE.HemisphereLight(0x6f86b0, 0x5a4a36, 0); scene.add(hemi);       // moonlight only
  const sun = LOOK.sunLight(U), dayCol = sun.color.clone(), dayI = sun.intensity;
  sun.position.copy(sunDir).multiplyScalar(60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  const sc = sun.shadow.camera; const ext = isCabin ? 26 : 34; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 10; sc.far = 160;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const HAZE = LOOK.horizonColor(L), NIGHT = new THREE.Color(0x111a26);
  scene.fog = new THREE.FogExp2(HAZE.clone(), 1 / 700);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.maxPolarAngle = 1.5; controls.minDistance = 0.4; controls.maxDistance = 80;
  controls.enabled = false;
  const v = VIEWS[kind][0];
  camera.position.set(...v[1]); controls.target.set(...v[2]); controls.update();

  let night = false;
  function setNight(on) {
    night = on;
    dome.visible = !on; scene.background = on ? NIGHT : null;
    starField.visible = on;
    scene.fog.color.copy(on ? NIGHT : HAZE);
    hemi.intensity = on ? 0.18 : 0;
    sun.intensity = on ? 0.35 : dayI;
    sun.color.copy(on ? new THREE.Color(0x9db5e0) : dayCol);
    sun.position.copy(on ? new THREE.Vector3(-0.4, 0.8, 0.5).normalize() : sunDir).multiplyScalar(60);
    scene.environmentIntensity = on ? 0.08 : 0.8;
    U.uDim.value.set(...(on ? [0.05, 0.06, 0.09] : [1, 1, 1]));         // the sky-lit grass and trees, by moonlight
    lights.forEach((l) => (l.intensity = on ? 14 : 0));
    SM.window.emissiveIntensity = on ? 0.8 : 0;
    SM.lamp.emissiveIntensity = on ? 3 : 0;
    SM.glass.color.set(on ? 0xffc890 : 0x9fb8bf);
    SM.glass.opacity = on ? 0.12 : 0.22;
    glows.forEach((gl) => (gl.material.opacity = on ? 0.95 : 0));
  }

  const anchors = SPOTS[kind].map((s) => ({ ...s, anchor: new THREE.Vector3(...s.at) }));
  return { scene, camera, controls, setNight, isNight: () => night, anchors, tick(t) { U.uTime.value = t; if (blades) blades.material.uniforms.uCam.value.copy(controls.target); if (night) glows.forEach((gl, i) => { gl.material.opacity = 0.75 + 0.2 * Math.sin(t * (i === glows.length - 1 && isCabin ? 9 : 2) + i); }); } };
}

let _glow;
function glowTexture() {
  if (_glow) return _glow;
  const [c, g] = canvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,240,210,1)'); grd.addColorStop(0.25, 'rgba(255,200,130,0.5)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  _glow = new THREE.CanvasTexture(c);
  return _glow;
}
