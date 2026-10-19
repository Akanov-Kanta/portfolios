// The hold at the end: forward scrolling stops at the outro while the details type, backward stays
// free, it releases when typing is done (and the loop then wraps), and a click / tap skips it.
// Desktop: real wheel input through Lenis infinite. Mobile 390x844: real touch drags (native scroll,
// touch-wrap). usage: node scripts/lock-probe.mjs [baseUrl]   (dev or preview server must be running)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:3207/';
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../shots/lock');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal'] });
const failures = [];
const report = {};
const check = (ok, msg) => {
  console.log(`${ok ? 'OK ' : 'BAD'} ${msg}`);
  if (!ok) failures.push(msg);
};
const st = (page) => page.evaluate(() => ({ T: window.__ink.state().T, ...window.__ink.lock(), laps: window.__ink.laps(), handle: window.__ink.garden().handle }));

for (const mode of ['desktop', 'mobile']) {
  const mobile = mode === 'mobile';
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '?fixedq=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ink?.opened?.() === true, null, { timeout: 20000 });
  const cdp = mobile ? await ctx.newCDPSession(page) : null;
  const hold = await page.evaluate(() => window.__ink.lock().hold);
  const forward = async (n) => {
    for (let i = 0; i < n; i++) {
      if (mobile) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 700 }] });
        for (let k = 1; k <= 8; k++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 700 - k * 55 }] });
          await page.waitForTimeout(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(120);
      } else {
        await page.mouse.wheel(0, 160);
        await page.waitForTimeout(16);
      }
    }
  };
  const backward = async (n) => {
    for (let i = 0; i < n; i++) {
      if (mobile) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 250 }] });
        for (let k = 1; k <= 6; k++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: 250 + k * 40 }] });
          await page.waitForTimeout(16);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(120);
      } else {
        await page.mouse.wheel(0, -160);
        await page.waitForTimeout(16);
      }
    }
  };
  const approach = async () => {
    await page.evaluate(() => window.__ink.toUnit(990));
    await page.waitForTimeout(1500);
    await page.mouse.move(mobile ? 195 : 720, mobile ? 420 : 450);
  };

  // 1) forward input during typing doesn't get past the hold
  await approach();
  let maxT = 0;
  let sawLock = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 1800) {
    await forward(mobile ? 1 : 6);
    const s = await st(page);
    maxT = Math.max(maxT, s.T);
    sawLock ||= s.locked;
  }
  const during = await st(page);
  await page.screenshot({ path: path.join(OUT, `${mode}-1-held.png`) });
  check(sawLock && during.locked && maxT <= hold + 1, `${mode}: forward input while typing: locked=${during.locked}, furthest T ${maxT.toFixed(1)} (hold ${hold}), handle ${during.handle?.letters} letters typed`);
  // 2) backward works
  const before = during.T;
  await backward(mobile ? 2 : 8);
  await page.waitForTimeout(600);
  const back = await st(page);
  check(back.T < before - 5, `${mode}: backward input while held: T ${before.toFixed(1)} -> ${back.T.toFixed(1)}`);
  // 3) back to the hold, let it finish, then forward goes on and the loop wraps
  // forward again to the hold (still held: it waits there until the details have typed)
  await forward(mobile ? 3 : 12);
  const relockT = Date.now();
  await page.waitForFunction(() => !window.__ink.lock().locked, null, { timeout: 8000 });
  const heldMs = Date.now() - relockT;
  const done = await st(page);
  await page.screenshot({ path: path.join(OUT, `${mode}-2-released.png`) });
  const laps0 = done.laps;
  const t2 = Date.now();
  let wrapped = false;
  while (Date.now() - t2 < 25000) {
    await forward(mobile ? 2 : 10);
    if (mobile) await page.waitForTimeout(400);
    const s = await st(page);
    if (s.laps > laps0 || (s.T < 300 && Date.now() - t2 > 500)) {
      wrapped = true;
      break;
    }
  }
  const after = await st(page);
  check(done.handle?.state === 'done' && wrapped, `${mode}: released after typing (${heldMs} ms after re-reaching the hold; handle ${done.handle?.state}); forward then wrapped=${wrapped} (laps ${laps0} -> ${after.laps}, T ${after.T.toFixed(0)})`);
  // 4) click / tap skips at once
  await approach();
  const t3 = Date.now();
  while (Date.now() - t3 < 2500 && !(await st(page)).locked) await forward(mobile ? 1 : 4);
  const pre = await st(page);
  if (mobile) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 60, y: 420 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.click(60, 420);
  }
  const tClick = Date.now();
  await page.waitForFunction(() => !window.__ink.lock().locked, null, { timeout: 3000 }).catch(() => {});
  const releaseMs = Date.now() - tClick;
  const sk0 = await st(page);
  // if the click came while the playhead was still easing up to the copy, it is typed instantly the
  // moment the copy starts
  await page.waitForTimeout(500);
  const sk = { ...(await st(page)), locked: sk0.locked };
  await page.screenshot({ path: path.join(OUT, `${mode}-3-skipped.png`) });
  await forward(mobile ? 2 : 10);
  await page.waitForTimeout(800);
  const past = await st(page);
  check(pre.locked && !sk.locked && sk.handle?.state === 'done' && releaseMs < 250 && past.T > hold + 3,
    `${mode}: ${mobile ? 'tap' : 'click'} skip: locked before=${pre.locked} (handle ${pre.handle?.letters} letters), released in ${releaseMs} ms, handle ${sk.handle?.state}, then forward to T ${past.T.toFixed(1)}`);
  report[mode] = { hold, maxT, during, back, heldMs, wrapped, releaseMs, past: past.T };
  if (errors.length) failures.push(`${mode} errors: ${errors.join('; ')}`);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'lock-report.json'), JSON.stringify(report, null, 2));
console.log(failures.length ? `\nFAIL: ${failures.join(' | ')}` : '\nall lock checks passed');
process.exit(failures.length ? 1 : 0);
