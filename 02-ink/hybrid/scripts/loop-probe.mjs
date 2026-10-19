// Infinite-loop probe (adapted from the 3D portfolio's scripts/loop-probe.mjs).
//   desktop 1440x900 (Lenis infinite): seam pixel diff (T = 0 vs the last scroll pixel before the
//     wrap), 2 laps forward + 1 backward with the wheel, fps while crossing the seam, .bin requests.
//   touch 390x844 (touch-wrap): native touch scrolls to the end, the jump at rest, and a pixel diff
//     of the frame before vs after the jump.
// Pixel diffs run with ?freeze=1 (no clock), the fps pass without it.
// usage: node scripts/loop-probe.mjs [baseUrl]   (dev or preview server must be running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots/loop');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'] });
const report = {};
const failures = [];

// share of pixels whose largest channel differs by more than 10% (pixelmatch-style threshold 0.1)
async function diff(page, a, b, name) {
  const r = await page.evaluate(async ([sa, sb]) => {
    const load = async (s) => {
      const i = new Image();
      i.src = s;
      await i.decode();
      return i;
    };
    const [ia, ib] = await Promise.all([load(sa), load(sb)]);
    const w = ia.width, h = ia.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(ia, 0, 0);
    const da = g.getImageData(0, 0, w, h).data;
    g.drawImage(ib, 0, 0);
    const db = g.getImageData(0, 0, w, h).data;
    const out = g.createImageData(w, h);
    let bad = 0, sum = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      sum += d;
      if (d > 25.5) { bad++; out.data[i] = 255; out.data[i + 3] = 255; } else { out.data[i] = out.data[i + 1] = out.data[i + 2] = da[i] * 0.3; out.data[i + 3] = 255; }
    }
    g.putImageData(out, 0, 0);
    return { pct: (100 * bad) / (w * h), meanAbs: sum / (w * h), png: c.toDataURL('image/png') };
  }, [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`]);
  fs.writeFileSync(path.join(OUT, `${name}-diff.png`), Buffer.from(r.png.split(',')[1], 'base64'));
  return { pct: +r.pct.toFixed(4), meanAbs: +r.meanAbs.toFixed(3) };
}

const fps = (page, ms) =>
  page.evaluate((ms) => new Promise((res) => {
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

// ------------------------------------------------------------------ desktop: Lenis infinite
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  let bins = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + '?freeze=1&fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const mode = await page.evaluate(() => window.__ink.mode);
  if (mode !== 'loop') failures.push(`desktop mode ${mode}`);
  await page.waitForTimeout(1500);

  // seam: T = 0 vs the last pixel before the wrap
  await page.evaluate(() => window.__ink.toUnit(0));
  await page.waitForTimeout(1500);
  const a = await page.screenshot();
  fs.writeFileSync(path.join(OUT, 'desktop-seam-a-top.png'), a);
  const info = await page.evaluate(() => window.__ink.scrollInfo());
  await page.evaluate((y) => window.__ink.toUnit(y / window.__ink.scrollInfo().unitPx), info.limit - 1);
  await page.waitForTimeout(1500);
  const stB = await page.evaluate(() => ({ ...window.__ink.state(), scroll: window.__ink.scrollInfo().scroll }));
  const b = await page.screenshot();
  fs.writeFileSync(path.join(OUT, 'desktop-seam-b-end.png'), b);
  const seam = await diff(page, a, b, 'desktop-seam');
  report.desktopSeam = { ...seam, endT: +stB.T.toFixed(2), endScroll: Math.round(stB.scroll), limit: Math.round(info.limit) };
  console.log(`${seam.pct < 0.5 ? 'OK ' : 'BAD'} desktop seam diff: ${seam.pct}% of pixels differ (> 10%), mean |delta| ${seam.meanAbs}/255 — T ${stB.T.toFixed(2)} vs 0`);
  if (seam.pct >= 0.5) failures.push('desktop seam diff');

  // 2 laps forward, 1 back, with the wheel
  await page.evaluate(() => window.__ink.toUnit(0));
  await page.waitForTimeout(800);
  await page.mouse.move(720, 450);
  const lap0 = await page.evaluate(() => window.__ink.laps());
  const runLaps = async (dir, want) => {
    const log = [];
    const start = await page.evaluate(() => window.__ink.laps());
    let startT = await page.evaluate(() => window.__ink.state().T);
    if (startT > (await page.evaluate(() => window.__ink.lap)) - 5) startT = 0.01; // the end frame is the start frame
    const t0 = Date.now();
    let lastLabel = '';
    while (Date.now() - t0 < 90000) {
      for (let k = 0; k < 6; k++) {
        await page.mouse.wheel(0, dir * 140);
        await page.waitForTimeout(16);
      }
      const s = await page.evaluate(() => ({ T: window.__ink.state().T, scene: window.__ink.state().scene, laps: window.__ink.laps(), label: document.querySelector('.hud-scene').textContent }));
      if (s.label !== lastLabel) {
        log.push(`${s.label} @T${Math.round(s.T)}`);
        lastLabel = s.label;
      }
      // a full lap: `want` wraps, and back past where it started
      if (Math.abs(s.laps - start) >= want && (dir > 0 ? s.T >= startT : s.T <= startT)) {
        break;
      }
    }
    // stop here: let Lenis settle on the wheel input already given before reading the end state
    const end = await page.evaluate(() => ({ laps: window.__ink.laps(), T: window.__ink.state().T }));
    await page.waitForTimeout(1500);
    return { from: start, startT: +startT.toFixed(1), to: end.laps, endT: +end.T.toFixed(1), labels: log, seconds: +((Date.now() - t0) / 1000).toFixed(1) };
  };
  const fwd = await runLaps(1, 2);
  await page.screenshot({ path: path.join(OUT, 'desktop-after-2-laps.png') });
  const back = await runLaps(-1, 1);
  await page.screenshot({ path: path.join(OUT, 'desktop-after-1-lap-back.png') });
  report.laps = { start: lap0, forward: fwd, backward: back };
  const lapsOk = fwd.to - fwd.from === 2 && back.from - back.to === 1;
  console.log(`${lapsOk ? 'OK ' : 'BAD'} laps: forward ${fwd.from} -> ${fwd.to} (T ${fwd.startT} -> ${fwd.endT}) in ${fwd.seconds}s, backward ${back.from} -> ${back.to} (T ${back.startT} -> ${back.endT}) in ${back.seconds}s`);
  console.log('  forward labels: ' + fwd.labels.join(' | '));
  console.log('  backward labels: ' + back.labels.join(' | '));
  if (!lapsOk) failures.push('laps');
  const st = await page.evaluate(() => window.__ink.state());
  // what the browser actually fetched (resource timing), not Playwright's request events
  bins = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.name.endsWith('.bin')).map((e) => `${e.name.split('/').pop()}@${Math.round(e.startTime)}ms`));
  report.cache = { bins, loaded: st.loaded };
  const binsOk = bins.filter((x) => x.startsWith('hero.bin')).length === 1 && bins.filter((x) => x.startsWith('outro.bin')).length === 1;
  console.log(`${binsOk ? 'OK ' : 'BAD'} footage requests over 3 laps: ${bins.join(', ')} (loaded ${JSON.stringify(st.loaded)})`);
  if (!binsOk) failures.push('footage refetched');
  if (errors.length) failures.push('desktop errors: ' + errors.join('; '));
  await ctx.close();
}

// ------------------------------------------------------------------ desktop fps across the seam (live clock)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const lap = await page.evaluate(() => window.__ink.lap);
  // park on the way back, then wheel through the wrap while measuring
  for (let u = 0; u <= lap - 120; u += 80) { await page.evaluate((x) => window.__ink.toUnit(x), u); await page.waitForTimeout(60); }
  await page.waitForTimeout(1500);
  await page.mouse.move(720, 450);
  const meas = fps(page, 4000);
  const t0 = Date.now();
  while (Date.now() - t0 < 3900) { await page.mouse.wheel(0, 60); await page.waitForTimeout(16); }
  const r = await meas;
  const s = await page.evaluate(() => ({ laps: window.__ink.laps(), T: window.__ink.state().T }));
  report.seamFps = { ...r, crossed: s.laps >= 1, endT: +s.T.toFixed(1) };
  console.log(`${r.fps >= 55 && s.laps >= 1 ? 'OK ' : 'BAD'} fps while scrolling across the seam: ${r.fps} (worst frame ${r.worstFrameMs} ms), wrapped=${s.laps >= 1}, now at T ${s.T.toFixed(0)}`);
  if (r.fps < 55 || s.laps < 1) failures.push('seam fps');
  await ctx.close();
}

// ------------------------------------------------------------------ touch-wrap at 390x844
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '?freeze=1&fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const mode = await page.evaluate(() => window.__ink.mode);
  await page.waitForTimeout(1500);
  const top = await page.screenshot();
  fs.writeFileSync(path.join(OUT, 'touch-a-top.png'), top);
  const cdp = await ctx.newCDPSession(page);
  // jump most of the way natively, then real touch flings to the end
  const limit = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), limit - 1400);
  await page.waitForTimeout(600);
  let before = null;
  for (let i = 0; i < 12; i++) {
    const y = await page.evaluate(() => scrollY);
    if (y > limit - 600 && !before) {
      // the frame just before the end (at rest, 3 px short of the wrap threshold)
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), limit - 3);
      await page.waitForTimeout(1200);
      before = { shot: await page.screenshot(), T: await page.evaluate(() => window.__ink.state().T) };
      fs.writeFileSync(path.join(OUT, 'touch-b-end.png'), before.shot);
    }
    // a real finger drag (DOM touch events + native scrolling), released at speed
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
    for (let k = 1; k <= 10; k++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - k * 50 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(900);
    const l = await page.evaluate(() => window.__ink.laps());
    if (l >= 1) break;
  }
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ y: scrollY, laps: window.__ink.laps(), T: window.__ink.state().T }));
  const afterShot = await page.screenshot();
  fs.writeFileSync(path.join(OUT, 'touch-c-after-jump.png'), afterShot);
  const dEnd = before ? await diff(page, top, before.shot, 'touch-end-vs-top') : null;
  const dJump = await diff(page, top, afterShot, 'touch-after-jump-vs-top');
  report.touch = { mode, after, endT: before?.T, endVsTop: dEnd, afterJumpVsTop: dJump };
  const ok = mode === 'touch-wrap' && after.laps >= 1 && after.y < 2 && dEnd && dEnd.pct < 0.5 && dJump.pct < 0.5 && !errors.length;
  console.log(`${ok ? 'OK ' : 'BAD'} touch-wrap (${mode}): jumped=${after.laps >= 1} scrollY after rest ${after.y}; frame at the end (T ${before?.T?.toFixed(1)}) vs top: ${dEnd?.pct}% differ; after the jump vs top: ${dJump.pct}% differ`, errors);
  if (!ok) failures.push('touch-wrap');
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'loop-report.json'), JSON.stringify(report, null, 2));
console.log(failures.length ? `\nFAIL: ${failures.join(', ')}` : '\nall loop checks passed');
process.exit(failures.length ? 1 : 0);
