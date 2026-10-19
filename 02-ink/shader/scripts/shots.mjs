// Screenshot pass: node scripts/shots.mjs [baseUrl] [--only=desktop|mobile] [--reduced] [--nogl]
// Needs the dev server running (npm run dev, port 3201).
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'shots');
const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3201/';
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const reduced = args.includes('--reduced');
const nogl = args.includes('--nogl');

// scroll positions in timeline units (see CUT in src/main.ts)
const STOPS = [
  ['01-hero', 0],
  ['02-hero-push', 70],
  ['03-white-burst', 165],
  ['04-about', 265],
  ['05-ink-flood', 372],
  ['06-work-grow', 480],
  ['07-work-full', 610],
  ['07b-hard-cut-glitch', 642],
  ['08-stack', 768],
  ['09-outro', 860],
];

const VIEWPORTS = [
  ['desktop', { width: 1440, height: 900 }, 1],
  ['mobile', { width: 390, height: 844 }, 2],
].filter(([n]) => !only || n === only);

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'],
});
const report = { errors: [], warnings: [], pageErrors: [], shots: [] };

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
    const entry = `[${name}] ${m.type()}: ${m.text()}`;
    if (m.type() === 'error') report.errors.push(entry);
    else if (m.type() === 'warning') report.warnings.push(entry);
  });
  page.on('pageerror', (e) => report.pageErrors.push(`[${name}] ${e.message}`));

  const url = new URL(base);
  url.searchParams.set('fixedq', '1');
  if (nogl) url.searchParams.set('nogl', '1');
  await page.goto(url.toString(), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ink?.ready === true, null, { timeout: 15000 });
  const webgl = await page.evaluate(() => window.__ink.webgl);
  await page.waitForTimeout(2600);
  // GPU string + rough frame rate on the heaviest scene (hero)
  report[`${name}GPU`] = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a';
  });
  report[`${name}HeroFps`] = await page.evaluate(
    () => new Promise((res) => {
      let n = 0;
      const t0 = performance.now();
      const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round((n * 1000) / (performance.now() - t0))); };
      requestAnimationFrame(tick);
    }),
  );
  await page.mouse.move(viewport.width * 0.62, viewport.height * 0.4);

  for (const [label, unit] of STOPS) {
    await page.evaluate((u) => window.__ink.toUnit(u), unit);
    // the hard-cut stop is caught mid-glitch on purpose
    await page.waitForTimeout(unit === 0 ? 400 : label.includes('glitch') ? 330 : 2400);
    const suffix = (reduced ? '-reduced' : '') + (nogl ? '-nogl' : '');
    const file = path.join(outDir, `${name}-${label}${suffix}.png`);
    await page.screenshot({ path: file });
    report.shots.push(path.relative(root, file));
  }

  // horizontal overflow check
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  report[`${name}Overflow`] = overflow;
  report[`${name}WebGL`] = webgl;
  await ctx.close();
}

await browser.close();
await writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.errors.length || report.pageErrors.length) process.exitCode = 1;
