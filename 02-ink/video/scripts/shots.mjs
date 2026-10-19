// Screenshot + render check. Needs the dev server running (npm run dev).
// usage: node scripts/shots.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3202/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
  { name: 'mobile', width: 390, height: 844, dpr: 2, mobile: true },
];

// [name, section id, progress inside section (0..1 of its scroll range), whether footage must be visible]
const STOPS = [
  ['01-hero-autoplay', 'hero', 0, true],
  ['02-hero-scrub', 'hero', 0.45, true],
  ['03-about-subs', 'about', 0.4, true],
  ['04-about-quote', 'about', 0.9, true],
  ['045-cut-about-work', 'work', 0.004, true],
  ['05-work-head', 'work', 0.08, true],
  ['06-work-card1', 'work', 0.3, true],
  ['07-work-card3', 'work', 0.68, true],
  ['08-stack-mid', 'stack', 0.5, true],
  ['09-stack-end', 'stack', 0.97, true],
  ['10-contact', 'contact', 0.75, false],
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = { base: BASE, runs: [] };
let failures = 0;

async function imageStats(page, file) {
  const b64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    // analyse the middle band (avoids HUD and footer)
    const w = img.width, h = img.height;
    c.width = 240; c.height = 160;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, w * 0.1, h * 0.15, w * 0.8, h * 0.6, 0, 0, 240, 160);
    const d = ctx.getImageData(0, 0, 240, 160).data;
    let sum = 0, sum2 = 0, colored = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += l; sum2 += l * l; n++;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 40 || l > 90) colored++;
    }
    const mean = sum / n;
    return { mean: +mean.toFixed(1), std: +Math.sqrt(sum2 / n - mean * mean).toFixed(1), detail: +(colored / n).toFixed(3) };
  }, `data:image/png;base64,${b64}`);
}

for (const reduced of [false, true]) {
  for (const vp of VIEWPORTS) {
    if (reduced && vp.name === 'mobile') continue;
    if (process.env.VP && process.env.VP !== vp.name) continue;
    if (process.env.REDUCED && String(reduced) !== process.env.REDUCED) continue;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: !!vp.mobile,
      hasTouch: !!vp.mobile,
      reducedMotion: reduced ? 'reduce' : 'no-preference',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.text().includes('GL Driver Message')) return; // driver perf notes caused by screenshotting WebGL
      if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
    });
    page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', (r) => errors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('ready'), null, { timeout: 30000 });
    await page.waitForTimeout(reduced ? 800 : 3200);

    const run = { viewport: vp.name, reduced, stops: [], errors };
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    run.horizontalOverflow = scrollW > vp.width;
    if (run.horizontalOverflow) failures++;
    const secs = await page.evaluate(() => window.__app.sections());

    for (const [name, id, p, needFootage] of STOPS) {
      if (process.env.ONLY && !process.env.ONLY.split(',').some((o) => name.includes(o))) continue;
      if (reduced && !['01-hero-autoplay', '03-about-subs', '06-work-card1', '08-stack-mid', '10-contact'].includes(name)) continue;
      const s = secs.find((x) => x.id === id);
      const y = Math.round(s.start + (s.end - s.start) * p);
      if (y > 0) {
        // scroll in a few steps so scroll-triggered reveals fire in order
        const from = await page.evaluate(() => window.scrollY);
        for (let k = 1; k <= 6; k++) {
          await page.evaluate((v) => window.__app.scrollTo(v), Math.round(from + ((y - from) * k) / 6));
          await page.waitForTimeout(60);
        }
      }
      await page.waitForTimeout(reduced ? 600 : 2200);
      const file = path.join(OUT, `${vp.name}${reduced ? '-reduced' : ''}-${name}.png`);
      await page.screenshot({ path: file });
      const state = await page.evaluate(() => window.__app.state());
      const stats = await imageStats(page, file);
      const ok = !needFootage || (stats.std > 12 && stats.detail > 0.02 && state.hasFrame);
      if (!ok) failures++;
      run.stops.push({ name, y, state, stats, footageOk: ok });
      console.log(`${ok ? 'OK ' : 'BAD'} ${vp.name}${reduced ? ' (reduced)' : ''} ${name} y=${y} t=${state.t?.toFixed(2)} mode=${state.mode} mean=${stats.mean} std=${stats.std} detail=${stats.detail}`);
    }
    if (!reduced && !process.env.ONLY) {
      // 1) real wheel scrolling through the work section: how often is the exact frame decoded in time?
      const w = secs.find((x) => x.id === 'work');
      await page.evaluate((v) => window.__app.scrollTo(v), Math.round(w.start));
      await page.waitForTimeout(1200);
      await page.mouse.move(vp.width / 2, vp.height / 2);
      await page.evaluate(() => window.__app.scrubStats(true));
      const t0 = Date.now();
      while (Date.now() - t0 < 4000) {
        await page.mouse.wheel(0, 40);
        await page.waitForTimeout(16);
      }
      const ss = await page.evaluate(() => window.__app.scrubStats());
      run.scrub = { ...ss, exactRatio: +(ss.exact / Math.max(1, ss.frames)).toFixed(3) };
      console.log(`scrub (${vp.name}): ${ss.exact}/${ss.frames} rendered frames had the exact decoded frame (${(run.scrub.exactRatio * 100).toFixed(1)}%)`);

      // 2) sound toggle
      await page.click('.sound');
      await page.waitForTimeout(1500);
      const a1 = await page.evaluate(() => window.__app.audio());
      const label1 = await page.textContent('.sound__label');
      await page.click('.sound');
      await page.waitForTimeout(700);
      const a2 = await page.evaluate(() => window.__app.audio());
      run.sound = { on: a1, label: label1, off: a2 };
      const soundOk = !a1.paused && a1.time > 0 && a2.paused;
      if (!soundOk) failures++;
      console.log(`${soundOk ? 'OK ' : 'BAD'} sound toggle: on -> playing=${!a1.paused} t=${a1.time.toFixed(2)} label="${label1}", off -> paused=${a2.paused}`);
    }
    if (errors.length) {
      console.log(`console problems (${vp.name}${reduced ? ' reduced' : ''}):\n  ` + errors.join('\n  '));
      if (errors.some((e) => !e.startsWith('[warning]'))) failures++;
    }
    if (run.horizontalOverflow) console.log(`HORIZONTAL OVERFLOW on ${vp.name}: scrollWidth=${scrollW}`);
    report.runs.push(run);
    await ctx.close();
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(failures ? `\n${failures} problem(s) — see shots/report.json` : '\nall checks passed');
process.exit(failures ? 1 : 0);
