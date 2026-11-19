const { chromium } = require('playwright');
(async () => {
  const [html, img, out] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
  await p.goto('file://' + html); await p.waitForTimeout(1500);
  await p.setInputFiles('#file', img); await p.waitForTimeout(1500);
  await p.click('#spin'); await p.evaluate(() => document.querySelector('[data-view="close"]').click()); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '_front.png' });
  await p.evaluate(() => document.querySelector('[data-view="audience"]').click()); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '_aud.png' });
  await b.close();
})();
