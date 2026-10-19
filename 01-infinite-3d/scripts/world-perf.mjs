// Headed-GPU perf probe: fps + p95 frame time idle and during a lap, long tasks, JS heap.
//   node scripts/world-perf.mjs [baseUrl] [q=high|medium|low]
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3111";
const Q = process.argv[3] ?? "";
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
  window.__lt = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: "longtask", buffered: true });
});
const stats = () =>
  page.evaluate(() => {
    const a = [...window.__ft].sort((x, y) => x - y);
    window.__ft = [];
    const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
    return { frames: a.length, fps: +(1000 / (a.reduce((s, x) => s + x, 0) / a.length)).toFixed(1), p95: +q(0.95).toFixed(1), worst: +a.at(-1).toFixed(1), longTasks: window.__lt.filter((d) => d > 200).length, heapMB: mem };
  });
await page.goto(`${BASE}/${Q ? `?q=${Q}` : ""}`, { waitUntil: "load" });
const t0 = performance.now();
await page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 30000 });
const readyMs = Math.round(performance.now() - t0);
const gpu = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  const gl = c?.getContext("webgl2");
  const d = gl?.getExtension("WEBGL_debug_renderer_info");
  return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : "n/a";
});
await page.evaluate(() => (window.__ft = []));
await page.waitForTimeout(3000);
const idle = await stats();
await page.mouse.move(720, 450);
const lap = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let y = 0; y < lap * 1.2; y += 100) {
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(16);
}
await page.waitForTimeout(500);
const scrolling = await stats();
const tier = await page.evaluate(() => sessionStorage.getItem("portfolio.gpu"));
console.log(JSON.stringify({ gpu, tier, readyMs, idle, scrolling }, null, 1));
await browser.close();
