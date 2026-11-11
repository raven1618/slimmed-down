/*
 * Render PNG exports and the PDF manual with headless Chromium (Playwright).
 *
 *   node brand/rcm-holdings/source/render.cjs png [set]  # all PNG exports, or one job set (e.g. higgsfield)
 *   node brand/rcm-holdings/source/render.cjs pdf [en|es]   # RCM-Holdings-Brand-Manual.pdf / RCM-Holdings-Manual-de-Marca.pdf
 *   node brand/rcm-holdings/source/render.cjs pages <outDir> [scale] [en|es]  # page previews
 *   node brand/rcm-holdings/source/render.cjs shot <file.html> <selector> <out.png> [scale]
 *   node brand/rcm-holdings/source/render.cjs htmlpdf <file.html> <out.pdf>
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(__dirname, 'build');

async function renderPngs(browser, only) {
  const jobs = fs.readdirSync(BUILD)
    .filter((f) => f.startsWith('png-jobs-' + (only || '')) && f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(BUILD, f), 'utf8')));
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const job of jobs) {
    const svg = fs.readFileSync(path.join(ROOT, job.svg));
    const src = `data:image/svg+xml;base64,${svg.toString('base64')}`;
    await page.setContent(
      `<html><body style="margin:0;background:transparent">` +
      `<img id="i" style="width:${job.width}px;display:block" src="${src}"></body></html>`
    );
    await page.waitForFunction(() => document.getElementById('i').complete);
    const out = path.join(ROOT, job.png);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await (await page.$('#i')).screenshot({ path: out, omitBackground: true });
  }
  console.log(`rendered ${jobs.length} PNGs`);
}

const MANUAL = {
  en: { html: 'index.html', pdf: 'RCM-Holdings-Brand-Manual.pdf' },
  es: { html: 'index.es.html', pdf: 'RCM-Holdings-Manual-de-Marca.pdf' },
};

async function openManual(browser, scale = 1, lang = 'en') {
  const page = await browser.newPage({ deviceScaleFactor: scale });
  await page.goto('file://' + path.join(ROOT, 'manual', MANUAL[lang].html), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function renderPdf(browser, lang = 'en') {
  const page = await openManual(browser, 1, lang);
  await page.emulateMedia({ media: 'print' });
  const out = path.join(ROOT, MANUAL[lang].pdf);
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  console.log('wrote', out);
}

async function renderPages(browser, outDir, scale, lang = 'en') {
  const page = await openManual(browser, scale, lang);
  await page.emulateMedia({ media: 'print' });
  await page.setViewportSize({ width: 1123, height: 794 });
  const pages = await page.$$('section.page');
  fs.mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: path.join(outDir, `page-${String(i + 1).padStart(2, '0')}.png`) });
  }
  console.log(`rendered ${pages.length} page previews to ${outDir}`);
}

async function shot(browser, file, selector, out, scale) {
  const page = await browser.newPage({ deviceScaleFactor: scale });
  await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await (await page.$(selector)).screenshot({ path: path.resolve(out) });
}

async function htmlPdf(browser, file, out) {
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(file), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: path.resolve(out), preferCSSPageSize: true, printBackground: true });
}

(async () => {
  const [mode, a, b, c, d] = process.argv.slice(2);
  const browser = await chromium.launch();
  try {
    if (mode === 'png') await renderPngs(browser, a);
    else if (mode === 'pdf') await renderPdf(browser, a || 'en');
    else if (mode === 'pages') await renderPages(browser, path.resolve(a), Number(b || 1), c || 'en');
    else if (mode === 'shot') await shot(browser, a, b, c, Number(d || 1));
    else if (mode === 'htmlpdf') await htmlPdf(browser, a, b);
    else throw new Error('usage: render.cjs png|pdf|pages <dir> [scale]');
  } finally {
    await browser.close();
  }
})();
