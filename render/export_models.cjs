/* Exports the buildings of the site (js/cabin.js, in the walk's materials from js/look.js) as glTF binary files,
   so the Blender renders show exactly what you walk around on the site, interiors included.

     node render/export_models.cjs OUT_DIR [THREE_DIR]      -> OUT_DIR/cabin.glb, residence.glb, homestead.glb

   homestead.glb: the homestead's buildings as the hill draws them (js/site/hill.js), in place (x east, z south), each
   with extras ox, oz (where it stands) and ground (the hill's ground there), so Blender sets it on its own terrain;
   gravel comes with drape = 1 (laid over the ground). Palms, the pond and the quarry cut are made in Blender.

   Needs Playwright with Chromium. THREE_DIR: a local copy of the three package, if jsDelivr cannot be reached.
   Front of each building toward +z (glTF), floor at y = 0; materials keep their names (earth, glass, pool...). */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), [OUT, THREE_DIR] = process.argv.slice(2);
const TYPES = { '.js': 'application/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.html': 'text/html', '.mp4': 'video/mp4' };
const PAGE = `<!doctype html><meta charset="utf-8">
<script type="importmap">{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/" } }</script>
<script type="module">
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as LOOK from './js/look.js';
import * as CAB from './js/cabin.js';
const L = await LOOK.loadLook();
const SM = CAB.materials(L);
const out = {};
for (const [name, group] of [['cabin', CAB.quarryCabin(SM)], ['residence', CAB.residence(SM)]]) {
  const lamps = []; group.traverse((o) => { if (o.isLight) lamps.push(o); }); lamps.forEach((o) => o.removeFromParent());   // the night lamps: Blender lights its own
  const buf = await new GLTFExporter().parseAsync(group, { binary: true, maxTextureSize: 2048 });
  out[name] = btoa(Array.from(new Uint8Array(buf), (c) => String.fromCharCode(c)).join(''));
}
window.__glb = out;
</script>`;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('page error:', e.message));
  if (THREE_DIR) await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**', (r) => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('three@0.180.0/')[1]), contentType: TYPES['.js'] }));
  await page.route('http://site/**', (r) => {
    const rel = decodeURIComponent(new URL(r.request().url()).pathname);
    if (rel === '/export.html') return r.fulfill({ body: PAGE, contentType: 'text/html' });
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'not found' });
    r.fulfill({ path: f, contentType: TYPES[path.extname(f)] });
  });
  await page.goto('http://site/export.html');
  await page.waitForFunction(() => window.__glb, null, { timeout: 300000 });
  const glb = await page.evaluate(() => window.__glb);
  // The homestead, from the site itself.
  await page.route('https://fonts.**/**', (r) => r.abort());
  await page.goto('http://site/index.html', { timeout: 600000 });
  await page.waitForFunction(() => window.__ohReady === true, null, { timeout: 600000 });
  await page.waitForTimeout(3000);                                   // the photo textures
  glb.homestead = await page.evaluate(async () => {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const root = new THREE.Group();
    homesteadModels().forEach(({ obj, type, x, z, ground, drape }, i) => {          // js/site/hill.js: the one list
      obj.name = `hs_${type}_${i}`; obj.traverse((m) => { m.userData = {}; });
      obj.userData = { ox: x, oz: z, ground, drape: drape ? 1 : 0 };
      root.add(obj);
    });
    const buf = await new GLTFExporter().parseAsync(root, { binary: true, maxTextureSize: 1024 });
    return btoa(Array.from(new Uint8Array(buf), (c) => String.fromCharCode(c)).join(''));
  });
  for (const [name, b64] of Object.entries(glb)) {
    fs.writeFileSync(path.join(OUT, name + '.glb'), Buffer.from(b64, 'base64'));
    console.log(name + '.glb', (fs.statSync(path.join(OUT, name + '.glb')).size / 1e6).toFixed(1), 'MB');
  }
  await browser.close();
})();
