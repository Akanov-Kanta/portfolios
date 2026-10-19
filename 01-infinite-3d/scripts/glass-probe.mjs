// The about -> projects "glass" (monitor dive) under real wheel input, per zone: fps, worst frame, GPU ms
// (timer query spanning each frame) and shader links / texture allocations that happen mid-flight.
// Hooks WebGL2 from outside, so it runs unchanged against any build (A/B two servers).
//   node scripts/glass-probe.mjs [baseUrl] [label]     env: VIEW=1440x900 DPR=2 THROTTLE=1 (CPU slowdown)
// Healthy: "links 0 allocs 0" in every zone and no worst frame > ~17 ms in the glass zone.
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3111";
const LABEL = process.argv[3] ?? BASE;
const [VW, VH] = (process.env.VIEW ?? "1440x900").split("x").map(Number);
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu", "--enable-privileged-webgl-extensions", "--enable-webgl-draft-extensions"] });
const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: Number(process.env.DPR ?? 2) });
await p.addInitScript(() => {
  const W = window;
  W.__ab = { frames: [], links: [], allocs: [], rec: false };
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (type === "webgl2" && ctx && !ctx.__hooked) {
      ctx.__hooked = true;
      W.__ctx = ctx;
      W.__ext = ctx.getExtension("EXT_disjoint_timer_query_webgl2");
      const lp = ctx.linkProgram.bind(ctx);
      ctx.linkProgram = (prog) => (W.__ab.rec && W.__ab.links.push(scrollY), lp(prog));
      for (const fn of ["texStorage2D", "texImage2D"]) {
        const f = ctx[fn].bind(ctx);
        ctx[fn] = (...a) => (W.__ab.rec && W.__ab.allocs.push(scrollY), f(...a));
      }
    }
    return ctx;
  };
  let last = 0, q = null, pending = [];
  const tick = (t) => {
    const ctx = W.__ctx, ext = W.__ext;
    if (ctx && ext) {
      if (q) {
        ctx.endQuery(ext.TIME_ELAPSED_EXT);
        pending.push(q);
      }
      pending = pending.filter((x) => {
        if (!ctx.getQueryParameter(x.q, ctx.QUERY_RESULT_AVAILABLE)) return true;
        if (!ctx.getParameter(ext.GPU_DISJOINT_EXT)) x.f.gpu = ctx.getQueryParameter(x.q, ctx.QUERY_RESULT) / 1e6;
        ctx.deleteQuery(x.q);
        return false;
      });
      const f = { dt: last ? t - last : 0, y: scrollY };
      if (W.__ab.rec) W.__ab.frames.push(f);
      q = { q: ctx.createQuery(), f };
      ctx.beginQuery(ext.TIME_ELAPSED_EXT, q.q);
    }
    last = t;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await p.goto(`${BASE}/?q=high`, { waitUntil: "networkidle" });
await p.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 30000 });
await p.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 30000 }).catch(() => {});
await p.waitForTimeout(4000); // idle compile settles
const geo = await p.evaluate(() => ({ projects: document.getElementById("projects").getBoundingClientRect().top + scrollY, vh: innerHeight }));
await p.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true }), geo.projects - 1.8 * geo.vh);
await p.waitForTimeout(1500);
if (Number(process.env.THROTTLE ?? 1) > 1) await (await p.context().newCDPSession(p)).send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE) });
await p.mouse.move(720, 450);
await p.evaluate(() => (window.__ab.rec = true));
for (let i = 0; i < 400; i++) {
  await p.mouse.wheel(0, 120);
  await p.waitForTimeout(16);
  if (i % 10 === 0 && (await p.evaluate((end) => scrollY > end, geo.projects + 0.5 * geo.vh))) break;
}
await p.waitForTimeout(800);
const ab = await p.evaluate(() => ((window.__ab.rec = false), window.__ab));
await b.close();

const zones = [["about", -1.8, -0.9], ["glass", -0.9, -0.45], ["void", -0.45, 0.05]];
const inZ = (y, lo, hi) => y > geo.projects + lo * geo.vh && y <= geo.projects + hi * geo.vh;
const q = (a, k) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * k))] : NaN);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const parts = zones.map(([name, lo, hi]) => {
  const fr = ab.frames.filter((f) => f.dt && inZ(f.y, lo, hi));
  const g = fr.filter((f) => f.gpu != null).map((f) => f.gpu);
  const dts = fr.map((f) => f.dt);
  const links = ab.links.filter((y) => inZ(y, lo, hi)).length, allocs = ab.allocs.filter((y) => inZ(y, lo, hi)).length;
  return `${name}: ${(1000 / avg(dts)).toFixed(0)}fps worst ${Math.max(...dts).toFixed(0)}ms | gpu ${avg(g).toFixed(1)} p95 ${q(g, 0.95).toFixed(1)}ms | links ${links} allocs ${allocs}`;
});
console.log(LABEL.padEnd(16), parts.join("  ||  "));
