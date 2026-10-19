// Type Garden words: screenshots mid-growth / fully grown / the cut on the space, and fps while
// they type and at rest. usage: node scripts/garden-probe.mjs [baseUrl]   (dev server running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots/garden');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'] });
const failures = [];
const report = {};

const fps = (page, ms) => page.evaluate((ms) => new Promise((res) => {
  let n = 0, worst = 0, last = performance.now();
  const t0 = last;
  const tick = () => {
    const now = performance.now();
    worst = Math.max(worst, now - last);
    last = now;
    n++;
    if (now - t0 < ms) requestAnimationFrame(tick);
    else res({ fps: Math.round((n * 1000) / (now - t0)), worstFrameMs: Math.round(worst) });
  };
  requestAnimationFrame(tick);
}), ms);

async function shot(page, name, sel) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const r = await page.evaluate((s) => {
    const b = document.querySelector(s).getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    return { x: b.left - fs, y: b.top - fs * 1.5, w: b.width + fs * 2, h: b.height + fs * 2.5 };
  }, sel);
  const vp = page.viewportSize();
  const clip = { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(vp.width - Math.max(0, r.x), r.w), height: Math.min(vp.height - Math.max(0, r.y), r.h) };
  await page.screenshot({ path: path.join(OUT, `${name}-crop.png`), clip });
}
const waitLetters = (page, k, n) => page.waitForFunction(([k, n]) => (window.__ink.garden()[k]?.letters ?? 0) >= n, [k, n], { timeout: 15000, polling: 16 });

for (const [name, viewport, dpr, mobile] of [
  ['desktop', { width: 1440, height: 900 }, 1, false],
  ['mobile', { width: 390, height: 844 }, 2, true],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const r = {};
  const toOutro = async () => {
    for (const u of [300, 600, 990, 1140]) {
      await page.evaluate((x) => window.__ink.toUnit(x), u);
      await page.waitForTimeout(400);
    }
    await page.waitForFunction(() => window.__ink.lock().outroText, null, { timeout: 15000 });
  };
  // pass 1, fps only (no screenshots inside the measured windows: they stall the compositor)
  r.heroTypingFps = await fps(page, 2200);
  await page.waitForFunction(() => window.__ink.garden().hero?.state === 'done', null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  r.heroRestFps = await fps(page, 2500);
  await toOutro();
  r.outroTypingFps = await fps(page, 2500);
  await page.waitForFunction(() => window.__ink.garden().handle?.state === 'done', null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  r.outroRestFps = await fps(page, 2500);
  // pass 2, screenshots: reload, freeze the typing right after the space (slot 7 = "A" of AKANOV)
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  await page.evaluate(() => window.__ink.gardenHold('hero', 7));
  await waitLetters(page, 'hero', 3);
  await shot(page, `${name}-hero-1-mid`, '.hero-name');
  await waitLetters(page, 'hero', 6); // the space has cut R's stem (genEnd + recoil), "A" is in
  await page.waitForTimeout(650);
  await shot(page, `${name}-hero-2-space-cut`, '.hero-name');
  await page.evaluate(() => window.__ink.gardenHold('hero', null));
  await page.waitForFunction(() => window.__ink.garden().hero?.state === 'done', null, { timeout: 15000 });
  await page.waitForTimeout(3200);
  await shot(page, `${name}-hero-3-full`, '.hero-name');
  await toOutro();
  await waitLetters(page, 'handle', 5);
  await shot(page, `${name}-handle-1-mid`, '.handle');
  await page.waitForFunction(() => window.__ink.garden().handle?.state === 'done', null, { timeout: 15000 });
  await page.waitForTimeout(3200);
  await shot(page, `${name}-handle-2-full`, '.handle');
  report[name] = { ...r, errors };
  const ok = [r.heroTypingFps, r.heroRestFps, r.outroTypingFps, r.outroRestFps].every((f) => f.fps >= 55) && !errors.length;
  if (!ok) failures.push(name);
  console.log(`${ok ? 'OK ' : 'BAD'} ${name}: hero fps typing ${r.heroTypingFps.fps} (worst ${r.heroTypingFps.worstFrameMs} ms), at rest ${r.heroRestFps.fps}; outro typing ${r.outroTypingFps.fps} (worst ${r.outroTypingFps.worstFrameMs} ms), at rest ${r.outroRestFps.fps}`, errors);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'garden-report.json'), JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
