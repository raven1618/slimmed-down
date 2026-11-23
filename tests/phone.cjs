/* The quality bar of CLAUDE.md, checked on a phone-sized screen (iPhone 13), where the owner and most investors
   look at the site. Fails when:
   - the hill's opening view is washed out (too much near-white) or murky (too dark);
   - the 3D is drawn without antialiasing, or below 1.5× pixels;
   - dragging in the tour turns the wrong way (drag right must look right, drag up must look up).
   Screenshots go to tests/shots/phone-*.png: look at them before saying a change is done.

     npm run phone        (THREE_DIR=node_modules/three to work without reaching the CDN) */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..'), SHOTS = path.join(__dirname, 'shots'), THREE_DIR = process.env.THREE_DIR, LIMIT = 600000;
const TYPES = { '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp4': 'video/mp4', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 2 })).newPage();
  const problems = [], fail = (m) => { problems.push(m); console.log('FAIL ' + m); };
  page.on('pageerror', (e) => fail('script error: ' + e.message));
  if (THREE_DIR) await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**', (r) => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('three@0.180.0/')[1]), contentType: TYPES['.js'] }));
  await page.route('https://fonts.**/**', (r) => r.abort());
  await page.route('http://site/**', (r) => {
    const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: 'not found' });
    r.fulfill({ path: f, contentType: TYPES[path.extname(f)] });
  });
  /* Brightness of a screenshot's middle band (the 3D, between the title and the bar): mean, and the share of
     near-white pixels. */
  const exposure = (png) => page.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const y0 = Math.round(im.height * 0.25), d = g.getImageData(0, y0, im.width, Math.round(im.height * 0.5)).data;
    let sum = 0, white = 0;
    for (let i = 0; i < d.length; i += 4) { const l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255; sum += l; if (l > 0.9) white++; }
    return { mean: sum / (d.length / 4), white: white / (d.length / 4) };
  }, png.toString('base64'));

  try {
    await page.goto('http://site/index.html', { waitUntil: 'domcontentloaded', timeout: LIMIT });
    await page.waitForFunction(() => window.__ohReady === true, null, { timeout: LIMIT });
    await page.waitForTimeout(3000);
    const shot = await page.screenshot({ path: path.join(SHOTS, 'phone-hill.png') });
    const e = await exposure(shot);
    console.log(`hill: mean brightness ${e.mean.toFixed(2)}, near-white ${(e.white * 100).toFixed(1)}%`);
    if (e.white > 0.04) fail(`the hill is washed out: ${(e.white * 100).toFixed(1)}% near-white (at most 4%)`);
    if (e.mean < 0.12 || e.mean > 0.7) fail(`the hill's brightness is off: ${e.mean.toFixed(2)} (0.12 to 0.70)`);
    const fx = await page.evaluate(() => { const c = hill.composer; return c ? { samples: c.renderTarget1.samples, max: renderer.capabilities.maxSamples, pr: c._pixelRatio } : null; });
    console.log('hill effects:', JSON.stringify(fx));
    if (fx && fx.max >= 4 && fx.samples < 4) fail(`the hill draws without antialiasing (${fx.samples} samples)`);
    if (fx && fx.pr < 1.5) fail(`the hill draws at ${fx.pr}× pixels on a phone (at least 1.5×)`);
    await page.evaluate(() => homesteadView());
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(SHOTS, 'phone-homestead.png') });

    await page.evaluate(() => openTour('quarry-deck'));
    await page.waitForFunction(() => !document.getElementById('pano').hidden && document.getElementById('pano-loading').hidden, null, { timeout: LIMIT });
    await page.screenshot({ path: path.join(SHOTS, 'phone-tour.png') });
    const drag = async (dx, dy) => {
      const before = await page.evaluate(() => ({ yaw: pano.yaw, pitch: pano.pitch }));
      await page.evaluate(([dx, dy]) => {
        const el = document.getElementById('pano-stage'), o = { pointerId: 7, pointerType: 'touch', bubbles: true };
        el.dispatchEvent(new PointerEvent('pointerdown', { ...o, clientX: 200, clientY: 400 }));
        for (let i = 1; i <= 10; i++) el.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: 200 + (dx * i) / 10, clientY: 400 + (dy * i) / 10 }));
        el.dispatchEvent(new PointerEvent('pointerup', { ...o, clientX: 200 + dx, clientY: 400 + dy }));
      }, [dx, dy]);
      const after = await page.evaluate(() => ({ yaw: pano.yaw, pitch: pano.pitch }));
      return { yaw: after.yaw - before.yaw, pitch: after.pitch - before.pitch };
    };
    const right = await drag(120, 0), upward = await drag(0, -120);
    if (!(right.yaw < 0)) fail('in the tour, dragging right does not look right');          // yaw grows to the left
    if (!(upward.pitch > 0)) fail('in the tour, dragging up does not look up');
    console.log(`tour drag: right turns ${(-right.yaw * 57.3).toFixed(0)}° right, up tilts ${(upward.pitch * 57.3).toFixed(0)}° up`);
  } catch (err) { fail('did not finish: ' + err.message.split('\n')[0]); }
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s). Screenshots in tests/shots/.` : '\nNo problems. Screenshots in tests/shots/phone-*.png: look at them.');
  process.exit(problems.length ? 1 : 0);
})();
