// CPU profile of one scroll lap (CPU-throttled): top self-time functions + GC/style/layout share.
//   node scripts/cpu-profile.mjs [baseUrl] [cpuThrottle=4]
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
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
await cdp.send("Profiler.start");
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let i = 0; i < 240; i++) {
  await page.mouse.wheel(0, H / 240);
  await page.waitForTimeout(16);
}
const { profile } = await cdp.send("Profiler.stop");

const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dts = profile.timeDeltas;
profile.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (dts[i] ?? 0)));
const agg = {};
let total = 0;
for (const [id, us] of self) {
  const n = byId.get(id);
  const cf = n.callFrame;
  const file = (cf.url || "").split("/").pop().split("?")[0];
  const key = cf.url ? `${cf.functionName || "(anon)"} @ ${file}:${cf.lineNumber + 1}` : cf.functionName || "(native)";
  agg[key] = (agg[key] ?? 0) + us;
  total += us;
}
const idle = agg["(idle)"] ?? 0;
const busy = total - idle - (agg["(program)"] ?? 0);
console.log(`throttle ${THROTTLE}x, profiled ${(total / 1e3).toFixed(0)} ms, busy JS ${(busy / 1e3).toFixed(0)} ms (${((100 * busy) / total).toFixed(1)}%), program ${((agg["(program)"] ?? 0) / 1e3).toFixed(0)} ms, gc ${((agg["(garbage collector)"] ?? 0) / 1e3).toFixed(0)} ms`);
for (const [k, us] of Object.entries(agg).filter(([k]) => !["(idle)", "(program)"].includes(k)).sort((a, b) => b[1] - a[1]).slice(0, 35)) {
  console.log(`${(us / 1e3).toFixed(1).padStart(8)} ms  ${((100 * us) / total).toFixed(1).padStart(5)}%  ${k}`);
}
await browser.close();
