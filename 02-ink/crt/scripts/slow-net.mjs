// Slow-network check: every .bin frame chunk is held back for 40 s.
// The page must still open (intro gone, scroll unlocked) within ~9 s with the poster on the tube.
// usage: node scripts/slow-net.mjs [baseUrl]   (dev or preview server must be running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:3205/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots');
fs.mkdirSync(OUT, { recursive: true });
const DELAY = 40000;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
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
  await page.route('**/*.bin', async (route) => {
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
  await page.waitForFunction(() => document.documentElement.classList.contains('ready') && !document.querySelector('.intro'), null, { timeout: 20000 });
  const openedMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  const st = await page.evaluate(() => {
    const poster = document.querySelector('.poster');
    const cs = getComputedStyle(poster);
    const img = performance.getEntriesByType('resource').find((e) => e.name.includes('poster.jpg'));
    return {
      posterOpacity: +cs.opacity,
      posterGone: poster.classList.contains('gone'),
      posterLoaded: !!img && img.responseEnd > 0,
      canvasLive: document.querySelector('#stage').classList.contains('live'),
      scrollUnlocked: !document.documentElement.classList.contains('lenis-stopped'),
      timing: window.__app.timing(),
    };
  });
  const file = path.join(OUT, `${vp.name}-slow-1-poster.png`);
  await page.screenshot({ path: file });
  // in-page: ms from navigation start until the intro is gone and scrolling works
  const pageOpenMs = st.timing.open;
  const ok = openedMs < 9500 && pageOpenMs > 0 && pageOpenMs < 9000 && st.posterOpacity > 0.9 && !st.posterGone && st.posterLoaded && st.scrollUnlocked && !errors.length;
  if (!ok) failures++;
  console.log(`${ok ? 'OK ' : 'BAD'} ${vp.name}: opened ${(pageOpenMs / 1000).toFixed(1)} s after navigation start (${(openedMs / 1000).toFixed(1)} s wall clock incl. harness) with .bin delayed ${DELAY / 1000} s`, JSON.stringify(st), errors.length ? errors : '');
  await ctx.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
