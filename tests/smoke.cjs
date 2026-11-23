/* A check of every view of the site in a real browser: it starts on the hill, then opens each view in turn
   (the photoreal tour of both sites, free roam on both, back to the tour, the trail video and prototype, the
   plan) and fails if a view does not open, a script error shows up, or more than one 3D canvas exists.
   A screenshot of each view goes to tests/shots/.

     npm install && npx playwright install chromium     (once)
     npm test

   The browser draws in software, so it is slow: a few minutes for the whole run. Set THREE_DIR to a local copy
   of the three package (node_modules/three) to work without reaching the CDN. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..'), SHOTS = path.join(__dirname, 'shots'), THREE_DIR = process.env.THREE_DIR;
const TYPES = { '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp4': 'video/mp4', '.json': 'application/json', '.jpg': 'image/jpeg' };
const LIMIT = 600000;

const VIEWS = [
  ['tour-quarry', () => document.querySelector('.tab[data-go="explore"]').click(), () => location.hash.startsWith('#explore-quarry') && document.getElementById('pano-loading').hidden],
  ['tour-private', () => document.querySelector('#pano-sites [data-site="private"]').click(), () => location.hash.startsWith('#explore-private') && document.getElementById('pano-loading').hidden],
  ['roam-private', () => document.getElementById('pano-roam').click(), () => location.hash === '#walk-private' && document.getElementById('wk-loading').hidden],
  ['roam-quarry', () => document.querySelector('#wk-sites [data-site="quarry"]').click(), () => location.hash === '#walk' && document.getElementById('wk-loading').hidden],
  ['back-to-tour', () => document.getElementById('wk-close').click(), () => location.hash.startsWith('#explore-quarry') && document.getElementById('pano-loading').hidden],
  ['trail-video', () => document.querySelector('.tab[data-go="trail"]').click(), () => !document.getElementById('trailer').hidden],
  ['trail-prototype', () => document.getElementById('tl-play').click(), () => { const b = document.querySelector('#tr-card [data-do="start"]'); return !!b && !b.disabled; }],
  ['hill', () => { document.getElementById('tr-close').click(); document.querySelector('.tab[data-go="cerro"]').click(); }, () => location.hash === '#cerro'],
  ['plan', () => document.querySelector('.tab[data-go="plan"]').click(), () => !document.getElementById('plan').hidden],
];

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('script error: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|GPU stall/.test(m.text())) problems.push('console: ' + m.text().slice(0, 300)); });
  if (THREE_DIR) await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**', (r) => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('three@0.180.0/')[1]), contentType: TYPES['.js'] }));
  await page.route('https://fonts.**/**', (r) => r.abort());
  await page.route('http://site/**', (r) => {
    const rel = decodeURIComponent(new URL(r.request().url()).pathname), f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { problems.push('missing file: ' + rel); return r.fulfill({ status: 404, body: 'not found' }); }
    r.fulfill({ path: f, contentType: TYPES[path.extname(f)] });
  });

  const t0 = Date.now(), secs = (t) => ((Date.now() - t) / 1000).toFixed(0) + ' s';
  const check = async (name, t) => {
    await page.waitForTimeout(1500);
    const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
    if (canvases > 1) problems.push(`${name}: ${canvases} canvases, expected one shared renderer`);
    await page.screenshot({ path: path.join(SHOTS, name + '.png'), timeout: LIMIT });
    console.log(`ok   ${name.padEnd(18)} ${secs(t)}`);
  };
  try {
    await page.goto('http://site/index.html', { waitUntil: 'domcontentloaded', timeout: LIMIT });
    await page.waitForFunction(() => window.__ohReady === true, null, { timeout: LIMIT });
    await check('start', t0);
  } catch (e) { problems.push('the hill did not load: ' + e.message.split('\n')[0]); }
  for (const [name, open, ready] of VIEWS) {
    if (problems.some((p) => p.startsWith('the hill'))) break;
    const t = Date.now();
    try { await page.evaluate(open); await page.waitForFunction(ready, null, { timeout: LIMIT }); await check(name, t); }
    catch (e) { problems.push(`${name} did not open: ${e.message.split('\n')[0]}`); console.log(`FAIL ${name}`); }
  }
  await browser.close();
  console.log(`\n${VIEWS.length + 1} views in ${secs(t0)}. Screenshots in tests/shots/.`);
  if (problems.length) { console.log('\nProblems:\n- ' + problems.join('\n- ')); process.exit(1); }
  console.log('No problems.');
})();
