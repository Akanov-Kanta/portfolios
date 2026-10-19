// Drives the home page through one lap and saves screenshots + a seam pixel diff.
// Usage: node scripts/loop-probe.mjs [baseUrl]   (default http://localhost:3111)
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results/loop");
fs.mkdirSync(OUT, { recursive: true });

const launch = async () => {
  try {
    return await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"] });
  } catch {
    return await chromium.launch({ headless: true, args: ["--ignore-gpu-blocklist"] });
  }
};
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
const cdp = await page.context().newCDPSession(page);
const shot = async (name) => {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(data, "base64"));
};

await page.goto(`${BASE}/?freeze=1`, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.documentElement.dataset.loop === "loop");
// wait for the world (if it mounts) to be ready, up to 15 s; otherwise continue DOM-only
await page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1200);
await shot("00-top");

const lap = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await page.mouse.move(720, 450);
const log = [];
let acc = 0, i = 0, prevY = 0, wrapped = false;
while (!wrapped && i < 40) {
  for (let k = 0; k < 8; k++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(25); }
  acc += 960; i++;
  await page.waitForTimeout(Number(process.env.SETTLE ?? 650));
  const s = await page.evaluate(() => ({ y: Math.round(scrollY), hud: [...document.querySelectorAll("p.marker")].map((p) => p.innerText).find((t) => t.startsWith("[")) }));
  wrapped = s.y < prevY - lap * 0.5;
  prevY = s.y;
  log.push({ step: i, wheelPx: acc, ...s, wrapped });
  await shot(`${String(i).padStart(2, "0")}-y${s.y}`);
}
await page.waitForTimeout(1800);
const rest = await page.evaluate(() => Math.round(scrollY));
await shot("99-after-lap-rest");

// seam: scroll 0 vs limit-1 (instant), both after 1.2 s of settling
const seam = async (target, name) => {
  await page.evaluate((t) => window.__lenis?.scrollTo(t, { immediate: true }) ?? window.scrollTo(0, t), target);
  await page.waitForTimeout(1200);
  await shot(name);
  return PNG.sync.read(fs.readFileSync(path.join(OUT, name + ".png")));
};
const a = await seam(0, "seam-a-top");
// The clone's frame is the one at exactly `lap` (clone top at 0), the last frame before the wrap.
// Lenis' immediate scrollTo can land 1px short; 1px of the dot-matrix name reads as ~2% changed
// pixels, so check where it landed and nudge natively until the clone sits at 0.
const b = await (async () => {
  await page.evaluate((t) => window.__lenis?.scrollTo(t, { immediate: true }) ?? window.scrollTo(0, t), lap - 1);
  for (let k = 0; k < 5; k++) {
    const y = await page.evaluate(() => [...document.querySelectorAll("section")].at(-1).getBoundingClientRect().top);
    if (Math.abs(y) < 0.5) break;
    await page.evaluate((dy) => window.scrollBy(0, dy), Math.round(y));
    await page.waitForTimeout(100);
  }
  const top = await page.evaluate(() => [...document.querySelectorAll("section")].at(-1).getBoundingClientRect().top);
  if (Math.abs(top) >= 0.5) errors.push(`seam frame: clone top at ${top}px, expected 0`);
  await page.waitForTimeout(1200);
  await shot("seam-b-bottom");
  return PNG.sync.read(fs.readFileSync(path.join(OUT, "seam-b-bottom.png")));
})();
const diff = new PNG({ width: a.width, height: a.height });
const bad = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
fs.writeFileSync(path.join(OUT, "seam-diff.png"), PNG.sync.write(diff));
const pct = (100 * bad) / (a.width * a.height);

console.log(JSON.stringify({ lap, log, restY: rest, seamDiffPct: +pct.toFixed(3), errors }, null, 1));
await browser.close();
process.exit(pct < 1 && errors.length === 0 ? 0 : 1);
