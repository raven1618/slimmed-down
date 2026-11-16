/* Records the trail fight (js/trail.js) as a video for the pitch: the prototype played by a script on a
   fixed 30 fps clock, one screenshot per frame, then ffmpeg. Chapter titles explain what the player does on
   the real trail, where the phone's camera, motion sensors and flash stand in for the buttons.

   node render/trail_video.mjs SITE_DIR OUT_DIR [THREE_DIR]
     SITE_DIR   this repository (it is served as a static site)
     OUT_DIR    frames/ and trail.mp4 are written here
     THREE_DIR  optional local copy of the three package, if jsDelivr cannot be reached
   Needs playwright-core, Chromium and ffmpeg. Software rendering takes about a second a frame. */
import { chromium } from 'playwright-core';
import { execFileSync } from 'child_process';
import fs from 'fs'; import path from 'path';

const [SITE, OUT, THREE_DIR] = process.argv.slice(2);
const FPS = 30, W = 1280, H = 720, LIMIT = Number(process.env.FRAMES || 1e9), DRY = !!process.env.DRY;   // DRY: play it through without saving frames
const frames = path.join(OUT, 'frames');
fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
if (THREE_DIR) await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**', (r) => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('three@0.180.0/')[1]), contentType: 'application/javascript' }));
await page.route('https://fonts.**/**', (r) => r.abort());
await page.route('http://site/**', (r) => {
  const f = path.join(SITE, decodeURIComponent(new URL(r.request().url()).pathname));
  if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'not found' });
  if (f.endsWith('index.html')) {                              // let the script reach the trail view
    const html = fs.readFileSync(f, 'utf8').replace('function openTrail() {', 'window.__trailView = trailView;\nfunction openTrail() {');
    return r.fulfill({ body: html, contentType: 'text/html' });
  }
  r.fulfill({ path: f, contentType: f.endsWith('.js') ? 'application/javascript' : undefined });
});
await page.goto('http://site/index.html#trail-play', { waitUntil: 'domcontentloaded', timeout: 600000 });
await page.waitForFunction(() => window.__trailView?.api?.director, null, { timeout: 600000 });
await page.addStyleTag({ content: `
  #rec-cap { position: fixed; left: 50%; top: 92px; transform: translateX(-50%); z-index: 99; width: min(760px, 86vw); text-align: center;
    font: 600 21px/1.35 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f1e9db; text-shadow: 0 1px 12px #000, 0 0 3px #000; transition: none; }
  #rec-cap small { display: block; margin-bottom: 6px; font: 600 12px/1 ui-monospace, monospace; letter-spacing: 0.16em; text-transform: uppercase; color: #e9bf5a; }
  .tr-act, .tr-shutter { transition: none !important; }
  #tr-close, #tr-sound { visibility: hidden; }` });
await page.evaluate(() => { const d = document.createElement('div'); d.id = 'rec-cap'; document.body.appendChild(d); window.__trailView.api.director.stop(); });

let n = 0; const log = {};
const D = (fn, arg) => page.evaluate(fn, arg);
const caption = (kick, text) => D(([k, t]) => { document.getElementById('rec-cap').innerHTML = t ? `<small>${k}</small>${t}` : ''; }, [kick, text]);
async function run(sec, each) {                                  // advance the fight, one saved frame per step
  for (let i = 0, k = Math.round(sec * FPS); i < k && n < LIMIT; i++) {
    const st = await D(([dt, draw]) => { const d = window.__trailView.api.director; d.step(dt, draw); return { phase: d.phase, aimed: d.aimed, turning: d.turning, rnd: d.rnd, eyes: d.eyes }; }, [1 / FPS, !DRY]);
    if (DRY && st.eyes !== log.eyes && log.eyes !== undefined) console.log('  caught:', JSON.stringify(await D(() => window.__trailView.api.director.view)), 'prev', JSON.stringify(log.view));
    if (DRY) log.view = await D(() => window.__trailView.api.director.view);
    if (st.phase !== log.phase || st.eyes !== log.eyes) { console.log(`${(n / FPS).toFixed(1)}s ${st.phase} round ${st.rnd + 1} eyes ${st.eyes}`); Object.assign(log, st); }
    if (DRY) n++; else await page.screenshot({ path: path.join(frames, `f${String(n++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
    if (each && (await each(st)) === false) return st;
  }
}
const until = async (test, max) => run(max, (st) => !test(st));
const face = async (d = 0.8) => { await D((d) => { const x = window.__trailView.api.director; x.turnTo(x.herYaw(), d); }, d); await run(d + 0.15); };
const t0 = Date.now();

await D(() => window.__trailView.api.director.start());
await caption('Cerro Kavaju · the trail', 'Halfway up the trail: a ring of whitewashed trees around one white tree.');
await run(3);
await caption('The approach', 'You walk in with your phone up. Through the camera, someone is crying in the dark.');
await run(3);
for (let i = 0; i < 3; i++) {
  await caption('Answer her', i === 0 ? 'Answer her cry. On the trail you answer out loud.' : 'Answer again. She comes closer each time.');
  await D(() => { const d = window.__trailView.api.director; if (d.shown.includes('answer')) d.act('answer'); });
  await run(2.2);
}
await caption('Mala Visión', 'Mala Visión. Her gaze burns. She shows herself, then hides among the white trees.');
await until((s) => s.phase === 'hide', 12);
await run(0.8);
await caption('Find her', 'Turn with the phone to find her. When she is in the circle, take her picture: the flash hurts her.');
await face(1.1);
await until((s) => s.aimed, 2);
await D(() => window.__trailView.api.director.shoot());
await run(2.5);
let round = -1, guard = 0;
while (guard++ < 2000 && n < LIMIT) {
  const st = await D(() => { const d = window.__trailView.api.director; return { phase: d.phase, rnd: d.rnd }; });
  if (['final', 'end', 'lost', 'settle', 'break'].includes(st.phase)) break;
  if (st.rnd !== round) { round = st.rnd; await caption(`Round ${round + 1} of 3`, ['She charges with her white gaze. Look away, or lose one of your three eyes.', 'Faster now, and she sends the light from more than one tree.', 'The last round. Decoys in the trees; only one of them is her.'][round] || ''); }
  if (st.phase === 'charge') {                                // keep your back to her while her light builds and lands
    await D(() => { const d = window.__trailView.api.director; d.mirror(false); d.turnTo(d.herYaw() + Math.PI, 0.35); });
    await run(0.25);
  } else if (st.phase === 'idle') {                           // wait until her light is spent, then the mirror
    await caption('Strike through the mirror', 'While she rests, turn your back and catch her in the selfie camera. Then take the picture.');
    await run(1.4);
    await D(() => window.__trailView.api.director.mirror(true));
    await run(0.3); await face(0.7);
    await until((s) => s.aimed || s.phase !== 'idle', 1.5);
    await D(() => { const d = window.__trailView.api.director; if (d.phase === 'idle') d.shoot(); });
    await run(1.2);
  } else await run(0.3);
}
await until((s) => s.phase !== 'charge' && s.phase !== 'idle', 2);
await caption('The end of the fight', 'Her light is spent. Lay the phone down and look at her yourself.');
await face(0.9); await run(1.5);
await D(() => { const d = window.__trailView.api.director; if (d.shown.includes('down')) d.act('down'); });
await run(8);
await caption('', '');
await run(5);
console.log('captured', n, 'frames in', ((Date.now() - t0) / 60000).toFixed(1), 'min');
await browser.close();

if (DRY) process.exit(0);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, 'trail.mp4')]);
console.log('wrote', path.join(OUT, 'trail.mp4'), (fs.statSync(path.join(OUT, 'trail.mp4')).size / 1e6).toFixed(1), 'MB');
