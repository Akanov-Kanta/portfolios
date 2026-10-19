// Stack slams: every tool cuts in, in order, then the collage; fps while cutting; with the music on
// each cut waits for the next 8th note (<= 0.25 s) and lands on it; a project name opens its dossier.
// usage: node scripts/stack-probe.mjs [baseUrl] [--only=desktop|mobile]   (dev server running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots/stack');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal', '--autoplay-policy=no-user-gesture-required'] });
const failures = [];
const report = {};
// P.stack thresholds (src/stack.ts) -> scroll units (stack starts at 640 and runs 205 units)
const UNIT = (p) => 640 + 205 * p;
const WORDS = [0, 1, 2, 3, 4, 5].map((k) => UNIT(0.04 + k * 0.125) + 6);
const COLLAGE = UNIT(0.8) + 6;

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
const st = (page) => page.evaluate(() => window.__ink.stack());
const go = (page, u) => page.evaluate((x) => window.__ink.toUnit(x), u);

for (const [name, viewport, dpr, mobile] of [
  ['desktop', { width: 1440, height: 900 }, 1, false],
  ['mobile', { width: 390, height: 844 }, 2, true],
]) {
  if (only && only !== name) continue;
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const r = { order: [] };
  for (const u of [200, 400, 600, 635]) {
    await go(page, u);
    await page.waitForTimeout(300);
  }
  // pass 1 (no music): each word cuts in right away, in order; fps over the run
  const fpsP = fps(page, 3200);
  for (const u of [...WORDS, COLLAGE]) {
    await go(page, u);
    await page.waitForTimeout(450);
    r.order.push((await st(page)).shown);
  }
  r.cutFps = await fpsP;
  if (r.order.join() !== '0,1,2,3,4,5,6') failures.push(`${name}: cut order ${r.order.join()}`);
  if (r.cutFps.fps < 55) failures.push(`${name}: fps ${r.cutFps.fps} while cutting`);
  // screenshots: a hit frame, a settled word, the collage
  await go(page, WORDS[0] - 12);
  await page.waitForTimeout(500);
  await go(page, WORDS[0]);
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(OUT, `${name}-1-hit.png`) });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: path.join(OUT, `${name}-2-react.png`) });
  await go(page, WORDS[2]);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: path.join(OUT, `${name}-3-typescript.png`) });
  await go(page, COLLAGE);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: path.join(OUT, `${name}-4-collage.png`) });
  // pass 2 (music on): cuts wait for the next 8th note
  await go(page, 600);
  await page.waitForTimeout(500);
  if (mobile) await page.locator('.sound').tap();
  else await page.locator('.sound').click();
  await page.waitForFunction(() => window.__ink.audio().volume > 0.5 && !window.__ink.audio().paused, null, { timeout: 15000 });
  await go(page, 635);
  await page.waitForTimeout(400);
  r.beat = [];
  for (const u of WORDS) {
    await go(page, u);
    await page.waitForFunction((k) => window.__ink.stack().shown >= k, r.beat.length, { timeout: 3000 }).catch(() => {});
    const s = await st(page);
    r.beat.push({ k: s.shown, waited: s.last.waited, gridGap: s.hitGrid == null ? null : +s.hitGrid.toFixed(3) });
    await page.waitForTimeout(220);
  }
  for (const b of r.beat) {
    if (b.waited > 270) failures.push(`${name}: a cut waited ${b.waited} ms for the beat`);
    // just after a grid line the next one is ~0.25 s away (or ~0 if measured right on it)
    if (b.gridGap == null || (b.gridGap < 0.2 && b.gridGap > 0.03)) failures.push(`${name}: cut ${b.k} off the beat (next 8th in ${b.gridGap} s)`);
  }
  if (mobile) await page.locator('.sound').tap();
  else await page.locator('.sound').click();
  // a project name in the stack opens its dossier
  await go(page, WORDS[3]);
  await page.waitForTimeout(900);
  const btn = page.locator('.slam.on .slam-p').first();
  if (mobile) await btn.tap();
  else await btn.click();
  await page.waitForFunction(() => window.__ink.dossier.state().phase === 'open', null, { timeout: 5000 }).catch(() => {});
  r.dossier = await page.evaluate(() => window.__ink.dossier.state());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${name}-5-dossier.png`) });
  if (r.dossier.phase !== 'open' || r.dossier.index !== 1) failures.push(`${name}: CLOUDFLARE -> TAKTA dossier did not open (${JSON.stringify(r.dossier)})`);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__ink.dossier.state().phase === 'closed', null, { timeout: 5000 }).catch(() => {});
  r.overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (r.overflow > 0) failures.push(`${name}: horizontal overflow ${r.overflow}px`);
  r.errors = errors;
  if (errors.length) failures.push(`${name}: ${errors.join(' | ')}`);
  report[name] = r;
  console.log(name, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(failures.length ? `FAIL\n${failures.join('\n')}` : 'all stack checks passed');
process.exit(failures.length ? 1 : 0);
