// Smoothness probe: frame-time distribution per lap segment (optionally CPU-throttled) plus
// long-animation-frame attribution (which scripts / style+layout ate the frame).
//   node scripts/smooth-probe.mjs [baseUrl] [cpuThrottle=4] [q=high|medium|low]
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3111";
const THROTTLE = Number(process.argv[3] ?? 4);
const Q = process.argv[4] ?? "";
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--ignore-gpu-blocklist", "--use-angle=metal"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  window.__ft = [];
  let last = 0;
  const loop = (t) => {
    if (last) window.__ft.push(t - last);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__loaf = [];
  try {
    new PerformanceObserver((l) =>
      l.getEntries().forEach((e) =>
        window.__loaf.push({
          d: e.duration,
          render: e.renderStart ? e.startTime + e.duration - e.renderStart : 0,
          styleLayout: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0,
          scripts: e.scripts.map((s) => ({ d: s.duration, fl: s.forcedStyleAndLayoutDuration, src: `${(s.sourceURL || "").split("/").pop()}:${s.sourceFunctionName || s.invoker}` })),
        }),
      ),
    ).observe({ type: "long-animation-frame", buffered: true });
  } catch {}
});
const cdp = await page.context().newCDPSession(page);
const take = () =>
  page.evaluate(() => {
    const a = [...window.__ft].sort((x, y) => x - y);
    window.__ft = [];
    const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
    const over = (ms) => a.filter((x) => x > ms).length;
    return { frames: a.length, fps: +(1000 / (a.reduce((s, x) => s + x, 0) / a.length)).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), worst: +a.at(-1).toFixed(1), jank25: over(25), jank50: over(50) };
  });

await page.goto(`${BASE}/${Q ? `?q=${Q}` : ""}`, { waitUntil: "load" });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
const refreshHz = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => (++n, performance.now() - t0 < 1000 ? requestAnimationFrame(f) : r(n)); requestAnimationFrame(f); }));
if (THROTTLE > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
await page.mouse.move(720, 450);
await page.evaluate(() => { window.__ft = []; window.__loaf = []; });
await page.waitForTimeout(2500);
const out = { refreshHz, throttle: THROTTLE, tier: await page.evaluate(() => document.documentElement.dataset.quality ?? null), idle: await take(), segments: [] };

// one lap as wheel steps, sampled in 8 segments
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const SEG = 8, STEPS = 30;
for (let s = 0; s < SEG; s++) {
  for (let i = 0; i < STEPS; i++) {
    await page.mouse.wheel(0, H / SEG / STEPS);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(400);
  out.segments.push({ seg: s, station: await page.evaluate(() => document.documentElement.dataset.station ?? null), ...(await take()) });
}
// cursor sweep (DOM-only work)
for (let i = 0; i < 60; i++) { await page.mouse.move(200 + ((i * 37) % 1000), 200 + ((i * 53) % 500)); await page.waitForTimeout(16); }
out.cursorSweep = await take();

const loaf = await page.evaluate(() => window.__loaf);
const bySrc = {};
let styleLayout = 0, render = 0;
for (const f of loaf) {
  styleLayout += f.styleLayout; render += f.render;
  for (const s of f.scripts) { const k = s.src; bySrc[k] ??= { n: 0, ms: 0, forced: 0 }; bySrc[k].n++; bySrc[k].ms += s.d; bySrc[k].forced += s.fl || 0; }
}
out.loaf = { frames: loaf.length, totalMs: Math.round(loaf.reduce((s, f) => s + f.d, 0)), renderMs: Math.round(render), styleLayoutMs: Math.round(styleLayout),
  topScripts: Object.entries(bySrc).sort((a, b) => b[1].ms - a[1].ms).slice(0, 12).map(([k, v]) => ({ src: k, n: v.n, ms: Math.round(v.ms), forcedLayoutMs: Math.round(v.forced) })) };
console.log(JSON.stringify(out, null, 1));
await browser.close();
