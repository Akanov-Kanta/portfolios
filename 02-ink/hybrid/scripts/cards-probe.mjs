// Work cards' gardens: screenshots of the work scene mid-growth and fully grown (+ a crop per card),
// fps while the four cards grow, and their regrowth after leaving the scene and coming back.
// usage: node scripts/cards-probe.mjs [baseUrl]   (dev server running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots/cards');
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
const cards = (page) => page.evaluate(() => {
  const g = window.__ink.garden();
  return [1, 2, 3, 4].map((i) => g[`card${i}`]);
});
async function crops(page, prefix) {
  const vp = page.viewportSize();
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.card-in')].map((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left - 50, y: b.top - 60, w: b.width + 100, h: b.height + 110 };
  }));
  for (const [i, r] of boxes.entries()) {
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    const clip = { x, y, width: Math.min(vp.width - x, r.w), height: Math.min(vp.height - y, r.h) };
    if (clip.width > 10 && clip.height > 10) await page.screenshot({ path: path.join(OUT, `${prefix}-card${i + 1}.png`), clip });
  }
}

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
  for (const u of [150, 300, 450]) {
    await page.evaluate((x) => window.__ink.toUnit(x), u);
    await page.waitForTimeout(300);
  }
  // land past every card's reach in one step: all four start growing together (worst case)
  await page.evaluate(() => window.__ink.toUnit(610));
  await page.waitForFunction(() => Object.entries(window.__ink.garden()).filter(([k, v]) => k.startsWith('card') && v?.state !== 'idle').length === 4, null, { timeout: 15000 });
  r.growFps = await fps(page, 2200);
  await page.waitForFunction(() => Object.entries(window.__ink.garden()).filter(([k, v]) => k.startsWith('card') && v?.state === 'done').length === 4, null, { timeout: 15000 });
  await page.waitForTimeout(1600);
  r.restFps = await fps(page, 2500);
  await page.screenshot({ path: path.join(OUT, `${name}-2-full.png`) });
  await crops(page, `${name}-2-full`);
  r.full = await cards(page);
  // back before the cards, then forward: they wither and regrow mid-shot
  await page.evaluate(() => window.__ink.toUnit(300));
  await page.waitForTimeout(700);
  r.afterBack = await cards(page);
  await page.evaluate(() => window.__ink.toUnit(610));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${name}-1-mid.png`) });
  r.regrow = await cards(page);
  r.errors = errors;
  report[name] = r;
  console.log(name, JSON.stringify(r));
  if (r.growFps.fps < 55) failures.push(`${name}: fps ${r.growFps.fps} while growing`);
  if (r.restFps.fps < 55) failures.push(`${name}: fps ${r.restFps.fps} at rest`);
  if (r.full.some((c) => !c || c.state !== 'done' || c.letters < 3)) failures.push(`${name}: a card title did not finish typing`);
  if (r.afterBack.some((c) => c?.state !== 'idle')) failures.push(`${name}: cards did not wither going back`);
  if (r.regrow.some((c) => c?.state === 'idle')) failures.push(`${name}: cards did not regrow`);
  if (errors.length) failures.push(`${name}: ${errors.join(' | ')}`);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(failures.length ? `FAIL\n${failures.join('\n')}` : 'all card garden checks passed');
process.exit(failures.length ? 1 : 0);
