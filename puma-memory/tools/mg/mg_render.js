const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [cfgPath, outDir] = process.argv.slice(2); const cfg = JSON.parse(fs.readFileSync(cfgPath));
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/mg.html'); await p.evaluate(c => init(c), cfg);
  const N = Math.round(cfg.dur * 30);
  for (let i = 0; i < N; i++) {
    const d = await p.evaluate(t => frame(t), i / 30);
    fs.writeFileSync(`${outDir}/f${String(i).padStart(4, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close(); console.log('ok', N);
})();
