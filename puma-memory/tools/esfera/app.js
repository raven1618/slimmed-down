// Puma · Esfera LED 2 m · visualizer. Canvas 2688×1296 (equirectangular-like, 2.074:1).
(function () {
  const W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.setSize(W, H);
  document.getElementById('view').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080a);
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 100);

  // floor + human scale reference (1.75 m) for the 2 m sphere hanging with its centre at 3 m
  const CENTRE_Y = 3.0, R = 1.0;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshBasicMaterial({ color: 0x0b1210 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const grid = new THREE.GridHelper(24, 24, 0x1f3a2c, 0x13221b); scene.add(grid);
  const person = new THREE.Group();
  const pm = new THREE.MeshBasicMaterial({ color: 0x2a3a33 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.45, 16), pm); body.position.y = 0.725; person.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), pm); head.position.y = 1.62; person.add(head);
  person.position.set(1.8, 0, 0.6); scene.add(person);

  // sphere with the content texture
  const video = document.getElementById('vid');
  let tex = new THREE.VideoTexture(video);
  tex.colorSpace = THREE.SRGBColorSpace; tex.encoding = THREE.sRGBEncoding;
  const mat = new THREE.MeshBasicMaterial({ map: tex });
  let sphere, sphere_rot;
  const state = { mode: 'stretch', spin: true, gridOn: false, seamOn: false };
  function buildSphere() {
    if (sphere) { scene.remove(sphere); sphere.geometry.dispose(); }
    let geo;
    if (state.mode === 'stretch') geo = new THREE.SphereGeometry(R, 128, 64);
    else {  // true proportion: 2688 px = 360°, so 1296 px = 173.6° of latitude; poles left black
      const latSpan = Math.PI * (1296 / 1344);
      geo = new THREE.SphereGeometry(R, 128, 64, 0, Math.PI * 2, (Math.PI - latSpan) / 2, latSpan);
    }
    sphere = new THREE.Mesh(geo, mat);
    sphere.position.y = CENTRE_Y; sphere.rotation.y = (sphere_rot = sphere_rot ?? -Math.PI / 2); scene.add(sphere);   // canvas centre (x = 1344) faces the audience
    sphere.add(gridMesh); sphere.add(seam);
  }
  // lat/long overlay (every 30°) and the seam line (u = 0 / 1)
  const gridMesh = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(R * 1.002, 12, 6)), new THREE.LineBasicMaterial({ color: 0x7dff5a, transparent: true, opacity: 0.6 }));
  const seamPts = []; for (let i = 0; i <= 64; i++) { const t = i / 64 * Math.PI; seamPts.push(new THREE.Vector3(-Math.sin(t) * R * 1.004, Math.cos(t) * R * 1.004, 0)); }
  const seam = new THREE.Line(new THREE.BufferGeometry().setFromPoints(seamPts), new THREE.LineBasicMaterial({ color: 0xff3355 }));
  gridMesh.visible = false; seam.visible = false;
  // a dark pole cap behind true-proportion mode so the uncovered poles read as "no content"
  const core = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 64, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  core.position.y = CENTRE_Y; scene.add(core);
  buildSphere();

  // orbit controls (drag = orbit, wheel = distance)
  let az = 0.6, el = 0.05, dist = 5.5; const target = new THREE.Vector3(0, CENTRE_Y - 0.4, 0);
  function placeCam() {
    camera.position.set(target.x + dist * Math.cos(el) * Math.sin(az), target.y + dist * Math.sin(el), target.z + dist * Math.cos(el) * Math.cos(az));
    camera.lookAt(target);
  }
  let drag = null;
  renderer.domElement.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('pointerup', () => drag = null);
  window.addEventListener('pointermove', e => {
    if (!drag) return; az -= (e.clientX - drag.x) * 0.006; el = Math.max(-0.5, Math.min(1.45, el + (e.clientY - drag.y) * 0.006)); drag = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('wheel', e => { dist = Math.max(1.6, Math.min(14, dist * (1 + Math.sign(e.deltaY) * 0.08))); e.preventDefault(); }, { passive: false });
  const presets = {
    audience: () => { az = 0.6; el = 0.05; dist = 5.5; target.set(0, CENTRE_Y - 0.4, 0); },
    below: () => { az = 0.3; el = -0.45; dist = 3.2; target.set(0, CENTRE_Y, 0); },
    top: () => { az = 0; el = 1.4; dist = 3.5; target.set(0, CENTRE_Y, 0); },
    close: () => { az = 0.2; el = 0.1; dist = 2.2; target.set(0, CENTRE_Y, 0); },
  };

  // UI
  const $ = id => document.getElementById(id);
  $('spin').onclick = () => { state.spin = !state.spin; $('spin').classList.toggle('on', state.spin); };
  $('grid').onclick = () => { state.gridOn = !state.gridOn; gridMesh.visible = state.gridOn; $('grid').classList.toggle('on', state.gridOn); };
  $('seam').onclick = () => { state.seamOn = !state.seamOn; seam.visible = state.seamOn; $('seam').classList.toggle('on', state.seamOn); };
  $('mode').onchange = e => { state.mode = e.target.value; buildSphere(); };
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => presets[b.dataset.view]());
  function loadFile(f) {
    if (!f) return; const url = URL.createObjectURL(f);
    if (f.type.startsWith('image/')) {
      new THREE.TextureLoader().load(url, t => { t.encoding = THREE.sRGBEncoding; mat.map = t; mat.needsUpdate = true; $('info').textContent = f.name; });
    } else { video.src = url; video.play(); mat.map = tex; mat.needsUpdate = true; $('info').textContent = f.name; }
  }
  $('file').onchange = e => loadFile(e.target.files[0]);
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); });
  video.addEventListener('loadedmetadata', () => {
    const r = (video.videoWidth / video.videoHeight).toFixed(3);
    $('info').textContent = `${video.videoWidth}×${video.videoHeight} · ${r}:1 ${Math.abs(r - 2.074) < 0.02 ? '✓ canvas ratio' : Math.abs(r - 2) < 0.02 ? '· 2:1 equirect' : '⚠ ratio ≠ 2688×1296'}`;
  });

  window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
  let last = performance.now();
  (function loop(now) {
    const dt = (now - last) / 1000; last = now;
    if (state.spin) sphere.rotation.y += dt * 0.12; sphere_rot = sphere.rotation.y;
    placeCam(); renderer.render(scene, camera); requestAnimationFrame(loop);
  })(last);
  video.play().catch(() => { $('info').textContent = 'Click to play'; window.addEventListener('click', () => video.play(), { once: true }); });
})();
