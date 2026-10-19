// Stack -> outro transition smoothness: mean frame luminance sampled every 2 scroll units
// (2% of a viewport) across the transition; reports the curve and the largest single step, and
// saves screenshots at 25 / 50 / 75 %. usage: node scripts/transition-luma.mjs [baseUrl] [--only=desktop|mobile]
// Runs with ?freeze=1 (no clock: idle glitches, grain and the vortex don't move between samples).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots');
fs.mkdirSync(OUT, { recursive: true });
const MAX_STEP = 0.03; // of full white (0..1 mean sRGB luminance) per 2% of a viewport

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'] });
let failures = 0;
const report = {};
for (const [name, viewport, dpr, mobile] of [
  ['desktop', { width: 1440, height: 900 }, 1, false],
  ['mobile', { width: 390, height: 844 }, 2, true],
].filter(([n]) => !only || n === only)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(BASE + '?freeze=1&fixedq=1', { waitUntil: 'load' });
  await page.addStyleTag({ content: '.no-hud .hud, .no-hud .hud-bar, .no-hud .hud-water { visibility: hidden !important; }' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const { start, end } = await page.evaluate(() => window.__ink.bleach);
  // walk in, so footage / lazy loads are in place
  for (let u = 0; u <= start - 20; u += 60) {
    await page.evaluate((x) => window.__ink.toUnit(x), u);
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(() => window.__ink.state().loaded.outro, null, { timeout: 20000 });
  const curve = [];
  for (let u = start - 10; u <= end + 10; u += 2) {
    await page.evaluate((x) => window.__ink.toUnit(x), u);
    await page.waitForTimeout(420);
    // the picture itself (HUD hidden), and with the HUD (its colour theme flips on light frames,
    // with a 0.25 s CSS transition, so in real scrolling that change is spread over time)
    await page.evaluate(() => document.documentElement.classList.add('no-hud'));
    const png = await page.screenshot({ scale: 'css' });
    await page.evaluate(() => document.documentElement.classList.remove('no-hud'));
    const pngHud = await page.screenshot({ scale: 'css' });
    const meanOf = (buf) => page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 160; c.height = 100;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0, 160, 100);
      const d = g.getImageData(0, 0, 160, 100).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return s / (d.length / 4) / 255;
    }, `data:image/png;base64,${buf.toString('base64')}`);
    const mean = await meanOf(png);
    const meanHud = await meanOf(pngHud);
    curve.push([u, +mean.toFixed(4), +meanHud.toFixed(4)]);
    const pct = Math.round(((u - start) / (end - start)) * 100);
    if ([25, 50, 75].includes(pct)) fs.writeFileSync(path.join(OUT, `${name}-transition-${pct}.png`), pngHud);
  }
  let maxStep = 0, at = 0, maxHud = 0, atHud = 0;
  for (let i = 1; i < curve.length; i++) {
    const d = Math.abs(curve[i][1] - curve[i - 1][1]);
    if (d > maxStep) { maxStep = d; at = curve[i][0]; }
    const dh = Math.abs(curve[i][2] - curve[i - 1][2]);
    if (dh > maxHud) { maxHud = dh; atHud = curve[i][0]; }
  }
  const ok = maxStep <= MAX_STEP;
  if (!ok) failures++;
  report[name] = { maxStep: +maxStep.toFixed(4), at, maxStepWithHud: +maxHud.toFixed(4), atHud, from: curve[0][1], to: curve.at(-1)[1], curve };
  console.log(`${ok ? 'OK ' : 'BAD'} ${name}: luminance ${curve[0][1].toFixed(3)} -> ${curve.at(-1)[1].toFixed(3)} over ${curve.length} samples, largest step ${maxStep.toFixed(4)} at unit ${at} (limit ${MAX_STEP}); with the HUD in the shot ${maxHud.toFixed(4)} at ${atHud}`);
  console.log('  ' + curve.map(([u, m]) => `${u}:${m.toFixed(3)}`).join(' '));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'transition-luma.json'), JSON.stringify(report, null, 2));
process.exit(failures ? 1 : 0);
