// Screenshot + render checks: node scripts/shots.mjs [baseUrl] [--only=desktop|mobile] [--reduced] [--nogl] [--quick]
// Needs the dev server running (npm run dev, port 3207). Uses the real GPU (ANGLE/Metal) so the fps
// figure means something.
// Checks: console errors, horizontal overflow, footage visible (not blank) at the footage stops,
// hero fps with footage + vortex overlay, scrub frame-hit rate (hero + outro), sound toggle.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'shots');
const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const stopFilter = args.find((a) => a.startsWith('--stops='))?.split('=')[1]?.split(',');
const reduced = args.includes('--reduced');
const nogl = args.includes('--nogl');
const quick = args.includes('--quick');

// scroll positions in timeline units (see CUT / OUTRO in src/main.ts); [label, unit, footage expected]
const STOPS = [
  ['01-hero', 0, true],
  ['02-hero-push', 70, true],
  ['03a-burst-over-footage', 150, true],
  ['03b-white-burst', 178, false],
  ['04a-about-student', 228, false],
  ['04b-about-builder', 300, false],
  ['05-ink-flood', 372, false],
  ['06-work-grow', 480, false],
  ['07-work-full', 610, false],
  ['07b-hard-cut-glitch', 642, false],
  ['08-stack-word', 700, false],
  ['08-stack-collage', 845, false],
  ['08a-bleach-25', 890, false],
  ['08b-bleach-50', 920, false],
  ['08c-bleach-75', 950, false],
  ['09-outro-centipede', 990, true],
  ['10-outro-spiral', 1055, true],
  ['11-spiral-into-ink', 1105, true],
  ['12-outro-handle', 1185, false],
  ['13-return-vortex', 1255, false],
  ['14-return-footage', 1295, true],
  ['15-return-wrapped', 1340, true],
];

const VIEWPORTS = [
  ['desktop', { width: 1440, height: 900 }, 1],
  ['mobile', { width: 390, height: 844 }, 2],
].filter(([n]) => !only || n === only);

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'],
});
const report = { errors: [], warnings: [], pageErrors: [], failures: [], shots: [] };
const fail = (m) => {
  report.failures.push(m);
  console.log('BAD ' + m);
};

async function imageStats(page, file) {
  const b64 = (await readFile(file)).toString('base64');
  return page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    const w = img.width, h = img.height;
    c.width = 240; c.height = 160;
    const ctx = c.getContext('2d');
    // middle band (avoids HUD and footer)
    ctx.drawImage(img, w * 0.1, h * 0.15, w * 0.8, h * 0.6, 0, 0, 240, 160);
    const d = ctx.getImageData(0, 0, 240, 160).data;
    let sum = 0, sum2 = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      sum += l; sum2 += l * l; n++;
    }
    const mean = sum / n;
    return { mean: +mean.toFixed(1), std: +Math.sqrt(sum2 / n - mean * mean).toFixed(1) };
  }, `data:image/png;base64,${b64}`);
}

const measureFps = (page, ms = 3000) =>
  page.evaluate(
    (ms) => new Promise((res) => {
      let n = 0;
      let worst = 0;
      let last = performance.now();
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
    }),
    ms,
  );

for (const [name, viewport, dpr] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: dpr,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    hasTouch: name === 'mobile',
    isMobile: name === 'mobile',
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.text().includes('GL Driver Message')) return; // driver perf notes caused by screenshotting WebGL
    const entry = `[${name}] ${m.type()}: ${m.text()}`;
    if (m.type() === 'error') report.errors.push(entry);
    else if (m.type() === 'warning') report.warnings.push(entry);
  });
  page.on('pageerror', (e) => report.pageErrors.push(`[${name}] ${e.message}`));
  page.on('requestfailed', (r) => report.errors.push(`[${name}] requestfailed ${r.url()} ${r.failure()?.errorText}`));

  const url = new URL(base);
  url.searchParams.set('fixedq', '1');
  if (nogl) url.searchParams.set('nogl', '1');
  await page.goto(url.toString(), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const webgl = await page.evaluate(() => window.__ink.webgl);
  await page.waitForTimeout(2600);
  report[`${name}WebGL`] = webgl;

  if (!reduced && !nogl) {
    report[`${name}GPU`] = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a';
    });
    // hero: footage autoplay + vortex overlay + post, cursor stirring the vortex
    const mover = (async () => {
      for (let i = 0; i < 60; i++) {
        await page.mouse.move(viewport.width * (0.3 + 0.4 * Math.sin(i / 6) ** 2), viewport.height * (0.35 + 0.3 * Math.cos(i / 5) ** 2));
        await page.waitForTimeout(45);
      }
    })();
    const heroFps = await measureFps(page, 3000);
    await mover;
    const st = await page.evaluate(() => window.__ink.state());
    report[`${name}HeroFps`] = { ...heroFps, autoplay: st.autoplay, footOn: st.footOn.hero };
    console.log(`${name} hero fps: ${heroFps.fps} (worst frame ${heroFps.worstFrameMs} ms), autoplay=${st.autoplay}, footage on=${st.footOn.hero}`);
    if (heroFps.fps < 55) fail(`${name} hero fps ${heroFps.fps}`);
  }
  await page.mouse.move(viewport.width * 0.62, viewport.height * 0.4);

  const total = await page.evaluate(() => window.__ink.total);
  for (const [label, unit, needFootage] of STOPS) {
    if (unit > total) continue; // reduced motion: a finite page that ends on the handle
    if (stopFilter && !stopFilter.some((f) => label.includes(f))) continue;
    if (quick && !['01', '03a', '04b', '07-', '08a', '08b', '08c', '10', '11', '12', '13', '14'].some((f) => label.startsWith(f))) continue;
    // approach in a few steps so the scrubbed timeline and the reveals pass through in order
    const from = await page.evaluate(() => window.__ink.state().T);
    for (let k = 1; k <= 4; k++) {
      await page.evaluate((u) => window.__ink.toUnit(u), from + ((unit - from) * k) / 4);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(unit === 0 ? 500 : label.includes('glitch') ? 330 : 2400);
    const suffix = (reduced ? '-reduced' : '') + (nogl ? '-nogl' : '');
    const file = path.join(outDir, `${name}-${label}${suffix}.png`);
    await page.screenshot({ path: file });
    report.shots.push(path.relative(root, file));
    if (needFootage && webgl) {
      const st = await page.evaluate(() => window.__ink.state());
      const stats = await imageStats(page, file);
      const clip = st.scene === 0 ? 'hero' : 'outro';
      const ok = st.footOn[clip] > 0.9 && stats.std > 12;
      console.log(`${ok ? 'OK ' : 'BAD'} ${name}${suffix} ${label}: footage ${clip} on=${st.footOn[clip].toFixed(2)} realFrame=${st.hasFrame} mean=${stats.mean} std=${stats.std}`);
      if (!ok) fail(`${name}${suffix} ${label}: footage blank`);
    }
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  report[`${name}Overflow`] = overflow;
  if (overflow > 0) fail(`${name} horizontal overflow ${overflow}px`);

  if (!reduced && !nogl && !quick && !stopFilter) {
    // scrub frame-hit rate: real wheel scrolling through each footage range
    const scrub = {};
    for (const [clip, u0, u1, step] of [['hero', 3, 185, 40], ['outro', 970, 1090, 40], ['hero-fast', 3, 185, 160], ['outro-fast', 970, 1090, 160]]) {
      await page.evaluate((u) => window.__ink.toUnit(u), u0);
      await page.waitForTimeout(1500);
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      await page.evaluate(() => window.__ink.scrubStats(true));
      const t0 = Date.now();
      while (Date.now() - t0 < 6000) {
        const T = await page.evaluate(() => window.__ink.state().T);
        if (T >= u1) break;
        await page.mouse.wheel(0, step);
        await page.waitForTimeout(16);
      }
      const ss = await page.evaluate(() => window.__ink.scrubStats());
      scrub[clip] = { ...ss, hitRate: +(ss.exact / Math.max(1, ss.frames)).toFixed(3) };
      console.log(`${name} scrub ${clip}: ${ss.exact}/${ss.frames} rendered frames had the exact frame decoded (${(scrub[clip].hitRate * 100).toFixed(1)}%)`);
      if (scrub[clip].hitRate < (step > 40 ? 0.8 : 0.9)) fail(`${name} scrub ${clip} hit rate ${scrub[clip].hitRate}`);
    }
    report[`${name}Scrub`] = scrub;

    // sound toggle (off by default)
    const off0 = await page.evaluate(() => window.__ink.audio());
    await page.click('.sound');
    await page.waitForTimeout(1500);
    const on = await page.evaluate(() => window.__ink.audio());
    await page.click('.sound');
    await page.waitForTimeout(800);
    const off = await page.evaluate(() => window.__ink.audio());
    const soundOk = off0.paused && !on.paused && on.time > 0 && off.paused;
    report[`${name}Sound`] = { off0, on, off };
    console.log(`${soundOk ? 'OK ' : 'BAD'} ${name} sound: default paused=${off0.paused}, on playing=${!on.paused} t=${on.time.toFixed(2)}, off paused=${off.paused}`);
    if (!soundOk) fail(`${name} sound toggle`);
  }
  await ctx.close();
}

await browser.close();
const tag = (reduced ? '-reduced' : '') + (nogl ? '-nogl' : '');
await writeFile(path.join(outDir, `report${tag}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ errors: report.errors, warnings: report.warnings, pageErrors: report.pageErrors, failures: report.failures }, null, 2));
if (report.errors.length || report.pageErrors.length || report.failures.length) process.exitCode = 1;
