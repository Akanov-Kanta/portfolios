// Rendering-pipeline breakdown of one throttled scroll lap: time per trace event (style, layout,
// paint, raster, GPU...) on the renderer main thread, plus the heaviest style/layout invalidators.
//   node scripts/render-trace.mjs [baseUrl] [cpuThrottle=4]
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3111";
const THROTTLE = Number(process.argv[3] ?? 4);
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--ignore-gpu-blocklist", "--use-angle=metal"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
await page.mouse.move(720, 450);

const events = [];
cdp.on("Tracing.dataCollected", (e) => events.push(...e.value));
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink", "cc", "gpu"] }, transferMode: "ReportEvents" });
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let i = 0; i < 240; i++) {
  await page.mouse.wheel(0, H / 240);
  await page.waitForTimeout(16);
}
await cdp.send("Tracing.end");
await done;

// renderer main thread = the thread with the most "UpdateLayoutTree"/"Layout" events
const tcount = {};
for (const e of events) if (e.name === "Layout" || e.name === "UpdateLayoutTree" || e.name === "FunctionCall") tcount[`${e.pid}:${e.tid}`] = (tcount[`${e.pid}:${e.tid}`] ?? 0) + 1;
const main = Object.entries(tcount).sort((a, b) => b[1] - a[1])[0]?.[0];
const agg = {}, stacks = {};
let styleEls = 0, layoutObjs = 0;
for (const e of events) {
  if (e.ph !== "X" || `${e.pid}:${e.tid}` !== main || !e.dur) continue;
  agg[e.name] = (agg[e.name] ?? 0) + e.dur;
  if (e.name === "UpdateLayoutTree") styleEls += e.args?.elementCount ?? 0;
  if (e.name === "Layout") {
    layoutObjs += e.args?.beginData?.dirtyObjects ?? 0;
    const root = e.args?.endData?.layoutRoots?.[0]?.nodeName ?? "?";
    stacks[root] = (stacks[root] ?? 0) + e.dur;
  }
}
const ms = (us) => (us / 1000).toFixed(0).padStart(7);
console.log(`throttle ${THROTTLE}x — renderer main thread, top events (ms, inclusive):`);
for (const [k, us] of Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 22)) console.log(`${ms(us)}  ${k}`);
console.log(`style: ${styleEls} elements recalculated in total; layout: ${layoutObjs} dirty objects in total`);
console.log("layout time by layout root:", Object.fromEntries(Object.entries(stacks).map(([k, v]) => [k, Math.round(v / 1000)])));
await browser.close();
