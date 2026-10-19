// Project dossier: click a work card -> the ink bursts out of it and the dossier types in; Esc /
// the close button / the browser's back close it and the page scrolls again. Screenshots of the
// burst, the open dossier (desktop + mobile, every project) and fps while it opens.
// usage: node scripts/dossier-probe.mjs [baseUrl] [--only=desktop|mobile]   (dev server running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const only = args.find((a) => a.startsWith('--only='))?.slice(7);
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots/dossier');
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
const st = (page) => page.evaluate(() => window.__ink.dossier.state());
const T = (page) => page.evaluate(() => window.__ink.state().T);

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
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const r = { projects: [] };
  for (const u of [150, 300, 450, 610]) {
    await page.evaluate((x) => window.__ink.toUnit(x), u);
    await page.waitForTimeout(350);
  }
  await page.waitForFunction(() => document.querySelectorAll('.card.on').length === 4, null, { timeout: 15000 });
  await page.waitForTimeout(1200);

  for (let i = 0; i < 4; i++) {
    const p = {};
    const t0 = await T(page);
    const card = page.locator('.card-in').nth(i);
    if (mobile) await card.tap();
    else await card.click();
    if (i === 1) {
      // the burst, mid-way (no screenshots inside the fps window: they stall the compositor)
      await page.waitForTimeout(380);
      await page.screenshot({ path: path.join(OUT, `${name}-burst-1.png`) });
      await page.waitForTimeout(260);
      await page.screenshot({ path: path.join(OUT, `${name}-burst-2.png`) });
    } else if (i === 0) {
      p.openFps = await fps(page, 1400);
    }
    await page.waitForFunction(() => window.__ink.dossier.state().phase === 'open', null, { timeout: 5000 });
    await page.waitForTimeout(i === 0 ? 1200 : 900);
    await page.screenshot({ path: path.join(OUT, `${name}-p${i + 1}-typing.png`) });
    await page.waitForTimeout(3600);
    await page.screenshot({ path: path.join(OUT, `${name}-p${i + 1}-open.png`) });
    p.state = await st(page);
    p.focus = await page.evaluate(() => document.activeElement?.className ?? '');
    // the page must not scroll under the dossier
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    if (!mobile) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    p.scrolledUnder = Math.abs((await T(page)) - t0) > 1;
    // close: Esc on desktop, the close button / back on mobile
    if (mobile && i % 2 === 0) await page.locator('.d-close').tap();
    else if (mobile) await page.goBack();
    else if (i === 3) await page.locator('.d-close').click();
    else await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ink.dossier.state().phase === 'closed', null, { timeout: 5000 });
    p.closedOpen = (await st(page)).open;
    p.url = page.url();
    r.projects.push(p);
    if (p.state.phase !== 'open' || p.state.index !== i) failures.push(`${name} p${i + 1}: did not open`);
    if (p.scrolledUnder) failures.push(`${name} p${i + 1}: the page scrolled under the dossier`);
    if (p.closedOpen !== 0) failures.push(`${name} p${i + 1}: ink not gone after close`);
    if (!p.url.startsWith(BASE)) failures.push(`${name} p${i + 1}: left the page (${p.url})`);
    await page.waitForTimeout(500);
  }
  // after closing, scrolling works again
  const before = await T(page);
  if (mobile) await page.evaluate(() => window.scrollBy(0, 300));
  else await page.mouse.wheel(0, 500);
  await page.waitForTimeout(900);
  r.scrollAfter = +((await T(page)) - before).toFixed(1);
  if (r.scrollAfter < 5) failures.push(`${name}: page does not scroll after closing (${r.scrollAfter})`);
  // keyboard: focus a card, Enter opens, Esc closes and focus returns to the card
  if (!mobile) {
    await page.evaluate(() => window.__ink.toUnit(610));
    await page.waitForTimeout(1200);
    await page.locator('.card-in').nth(2).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__ink.dossier.state().phase === 'open', null, { timeout: 5000 });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__ink.dossier.state().phase === 'closed', null, { timeout: 5000 });
    r.focusBack = await page.evaluate(() => document.activeElement?.closest('.card')?.dataset.id ?? null);
    if (r.focusBack !== '03') failures.push(`${name}: focus did not return to the card (${r.focusBack})`);
  }
  r.overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (r.overflow > 0) failures.push(`${name}: horizontal overflow ${r.overflow}px`);
  r.errors = errors;
  if (errors.length) failures.push(`${name}: ${errors.join(' | ')}`);
  const f = r.projects[0]?.openFps;
  if (f && f.fps < 55) failures.push(`${name}: fps ${f.fps} while opening`);
  report[name] = r;
  console.log(name, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(failures.length ? `FAIL\n${failures.join('\n')}` : 'all dossier checks passed');
process.exit(failures.length ? 1 : 0);
