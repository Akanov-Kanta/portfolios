// Slow-network check: every .bin footage chunk is held back for 40 s.
// The page must still open (intro gone, scroll unlocked) within ~9 s, with the hero poster (or at
// least the shader vortex) on screen, and no errors.
// usage: node scripts/slow-net.mjs [baseUrl]   (dev or preview server must be running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3207/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots');
fs.mkdirSync(OUT, { recursive: true });
const DELAY = 40000;

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'] });
let failures = 0;
{
  // warm-up load so browser start-up and dev-server transforms are not counted
  const p = await browser.newPage();
  await p.goto(BASE, { waitUntil: 'load' });
  await p.close();
}
for (const vp of [
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
  { name: 'mobile', width: 390, height: 844, dpr: 2, mobile: true },
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.text().includes('GL Driver Message')) return;
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  let held = 0;
  await page.route('**/*.bin', async (route) => {
    held++;
    await new Promise((r) => setTimeout(r, DELAY));
    try {
      await route.continue();
    } catch {
      /* page closed */
    }
  });

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${vp.name}-slow-0-intro.png`) });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const openedMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => ({
    ...window.__ink.state(),
    timing: window.__ink.timing(),
    scrollUnlocked: !document.documentElement.classList.contains('lenis-stopped'),
    bootHidden: getComputedStyle(document.querySelector('.boot')).visibility === 'hidden',
  }));
  await page.screenshot({ path: path.join(OUT, `${vp.name}-slow-1-open.png`) });
  // scroll a little: the shader scenes must keep working while the footage is still in flight
  await page.evaluate(() => window.__ink.toUnit(300));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, `${vp.name}-slow-2-about.png`) });
  const pageOpenMs = st.timing.open;
  const posterOn = st.footOn.hero > 0.9 && !st.hasFrame; // poster texture, no real frame yet
  const ok = pageOpenMs > 0 && pageOpenMs < 9000 && openedMs < 9500 && st.scrollUnlocked && st.bootHidden && posterOn && !errors.length;
  if (!ok) failures++;
  console.log(
    `${ok ? 'OK ' : 'BAD'} ${vp.name}: opened ${(pageOpenMs / 1000).toFixed(1)} s after navigation start (${(openedMs / 1000).toFixed(1)} s wall clock incl. harness), ` +
      `${held} .bin request(s) held ${DELAY / 1000} s, poster on=${posterOn}, real frame=${st.hasFrame}, scroll unlocked=${st.scrollUnlocked}`,
    errors.length ? errors : '',
  );
  await ctx.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
