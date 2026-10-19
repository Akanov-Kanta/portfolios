// Hero text contrast: the pixels behind the kicker, name and subtitle are sampled with the type
// hidden (so glyphs and their glow don't count), and white-on-background contrast is computed from
// the 95th-percentile and the brightest background pixel (WCAG relative luminance).
// Also checks the top HUD on the light scenes. usage: node scripts/contrast.mjs [baseUrl] [--reduced]
// Needs the dev server running (npm run dev, port 3207).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const reduced = args.includes('--reduced');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'] });
const report = [];
let failures = 0;

// stats of the background inside rects of a screenshot buffer
async function bgStats(page, png, rects, dpr) {
  return page.evaluate(
    async ({ src, rects, dpr }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return rects.map((r) => {
        const x = Math.max(0, Math.round(r.x * dpr)), y = Math.max(0, Math.round(r.y * dpr));
        const w = Math.max(1, Math.round(r.w * dpr)), h = Math.max(1, Math.round(r.h * dpr));
        const d = ctx.getImageData(x, y, w, h).data;
        const L = [];
        for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i] / 255) + 0.7152 * lin(d[i + 1] / 255) + 0.0722 * lin(d[i + 2] / 255));
        L.sort((a, b) => a - b);
        const p95 = L[Math.floor(L.length * 0.95)];
        const max = L[L.length - 1];
        const mean = L.reduce((a, b) => a + b, 0) / L.length;
        return { name: r.name, p95, max, mean };
      });
    },
    { src: `data:image/png;base64,${png.toString('base64')}`, rects, dpr },
  );
}
const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

for (const [vpName, viewport, dpr, mobile] of [
  ['desktop', { width: 1440, height: 900 }, 1, false],
  ['mobile', { width: 390, height: 844 }, 2, true],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  await page.waitForTimeout(3500); // typing finished
  await page.addStyleTag({ content: '.hide-type .hero-inner .typed-line, .hide-type .hero-inner .nm, .hide-type .caret { visibility: hidden !important; transition: none !important; }' });

  // ---------------------------------------------------------------- hero type
  for (const unit of [0, 45, 70, 92]) {
    if (unit > 0 && !reduced) {
      // back to the top and leave when the loop nears the face (t ~0.9 s), so the scrubbed
      // positions land on the brightest part of the clip: the white face
      await page.evaluate(() => window.__ink.toUnit(0));
      await page.waitForFunction(() => { const t = window.__ink.state().heroT; return t > 0.86 && t < 0.95; }, null, { timeout: 8000, polling: 16 });
    }
    for (let k = 1; k <= 4; k++) {
      await page.evaluate((u) => window.__ink.toUnit(u), (unit * k) / 4);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1200);
    const samples = unit === 0 && !reduced ? 10 : 2; // autoplay: sample across the 1.42 s loop
    const worst = {};
    for (let s = 0; s < samples; s++) {
      const rects = await page.evaluate(() => {
        const box = (name, els) => {
          const rs = els.flatMap((e) => Array.from(e.getClientRects())).filter((r) => r.width > 0);
          const x0 = Math.min(...rs.map((r) => r.left)), x1 = Math.max(...rs.map((r) => r.right));
          const y0 = Math.min(...rs.map((r) => r.top)), y1 = Math.max(...rs.map((r) => r.bottom));
          return { name, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        };
        const q = (s) => Array.from(document.querySelectorAll(s));
        return [box('kicker', q('.hero-kicker .ch')), box('name', q('.hero-name .nm')), box('subtitle', q('.hero-sub .ch'))];
      });
      // hide the type (DOM and the Type Garden canvas letters); the garden itself stays, it is
      // part of what the name has to read against
      await page.evaluate(() => { document.documentElement.classList.add('hide-type'); window.__ink.gardenText?.(false); });
      await page.waitForTimeout(40);
      const png = await page.screenshot();
      await page.evaluate(() => { document.documentElement.classList.remove('hide-type'); window.__ink.gardenText?.(true); });
      if (s === 0) {
        fs.writeFileSync(path.join(OUT, `${vpName}-contrast-notype-${unit}${reduced ? '-reduced' : ''}.png`), png);
        await page.screenshot({ path: path.join(OUT, `${vpName}-contrast-type-${unit}${reduced ? '-reduced' : ''}.png`) });
      }
      const heroT = await page.evaluate(() => window.__ink.state().heroT);
      for (const st of await bgStats(page, png, rects, dpr)) {
        const w = worst[st.name];
        if (!w || st.p95 > w.p95) worst[st.name] = { ...st, heroT, maxOverSamples: Math.max(st.max, w?.maxOverSamples ?? 0) };
        else w.maxOverSamples = Math.max(w.maxOverSamples, st.max);
      }
      await page.waitForTimeout(170);
    }
    for (const [name, st] of Object.entries(worst)) {
      const c95 = cr(1, st.p95);
      const cMax = cr(1, st.maxOverSamples);
      const need = name === 'name' ? 3 : 4.5; // the name is large type (WCAG 3:1), kicker + subtitle are small
      const ok = c95 >= need;
      if (!ok) failures++;
      report.push({ viewport: vpName, unit, heroT: +st.heroT.toFixed(2), line: name, contrastP95: +c95.toFixed(2), contrastBrightestPixel: +cMax.toFixed(2), meanBgLum: +st.mean.toFixed(3), need, ok });
      console.log(`${ok ? 'OK ' : 'BAD'} ${vpName}${reduced ? ' reduced' : ''} hero@${unit} (worst at t=${st.heroT.toFixed(2)}s) ${name}: ${c95.toFixed(2)}:1 vs 95th-pct background (brightest pixel ${cMax.toFixed(2)}:1, need ${need}:1)`);
    }
  }

  // ---------------------------------------------------------------- HUD on light scenes
  for (const [label, unit] of [['about', 300], ['outro-spiral', 1055], ['about-flood', 380], ['hero-burst', 175], ['outro-eat', 1105]]) {
    const from = await page.evaluate(() => window.__ink.state().T);
    for (let k = 1; k <= 4; k++) {
      await page.evaluate(([a, b, k]) => window.__ink.toUnit(a + ((b - a) * k) / 4), [from, unit, k]);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const el = document.querySelector('.hud-scene');
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { r: { name: 'hud-scene', x: r.left, y: r.top, w: r.width, h: r.height }, color: cs.color, paper: document.documentElement.classList.contains('light-tr') };
    });
    await page.screenshot({ path: path.join(OUT, `${vpName}-contrast-hud-${label}${reduced ? '-reduced' : ''}.png`), clip: { x: 0, y: 0, width: viewport.width, height: 80 } });
    await page.evaluate(() => document.documentElement.classList.add('hide-hud'));
    await page.addStyleTag({ content: '.hide-hud .hud, .hide-hud .hud * { color: transparent !important; text-shadow: none !important; transition: none !important; }' });
    await page.waitForTimeout(40);
    const png = await page.screenshot();
    await page.evaluate(() => document.documentElement.classList.remove('hide-hud'));
    const [st] = await bgStats(page, png, [info.r], dpr);
    const m = info.color.match(/[\d.]+/g).map(Number);
    const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const a = m[3] ?? 1;
    // text colour composited over the mean background
    const bgS = st.mean ** (1 / 2.2);
    const comp = [0, 1, 2].map((i) => lin((m[i] / 255) * a + bgS * (1 - a)));
    const Lt = 0.2126 * comp[0] + 0.7152 * comp[1] + 0.0722 * comp[2];
    const c = cr(Lt, st.mean);
    const ok = c >= 4.5;
    if (!ok) failures++;
    report.push({ viewport: vpName, hud: label, paper: info.paper, color: info.color, contrastMeanBg: +c.toFixed(2), ok });
    console.log(`${ok ? 'OK ' : 'BAD'} ${vpName}${reduced ? ' reduced' : ''} HUD over ${label}: ${info.paper ? 'dark ink' : 'light'} ${c.toFixed(2)}:1 vs mean background under the label`);
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, `contrast${reduced ? '-reduced' : ''}.json`), JSON.stringify(report, null, 2));
process.exit(failures ? 1 : 0);
