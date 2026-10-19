// At rest (no input), consecutive frames must be nearly identical: measures camera/scene jitter.
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const BASE = process.argv[2] ?? "http://localhost:3111";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/${process.env.FREEZE ? "?freeze=1" : ""}`, { waitUntil: "networkidle" });
await page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 20000 });
await page.waitForTimeout(2000);
const cdp = await page.context().newCDPSession(page);
const grab = async () => PNG.sync.read(Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png" })).data, "base64"));
const results = [];
let prev = await grab();
for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(120);
  const cur = await grab();
  const bad = pixelmatch(prev.data, cur.data, null, prev.width, prev.height, { threshold: 0.15 });
  results.push(+((100 * bad) / (prev.width * prev.height)).toFixed(3));
  prev = cur;
}
const clock = await page.evaluate(() => new Promise((r) => setTimeout(() => r(performance.now()), 0)));
console.log(JSON.stringify({ framePairDiffPct: results, note: "expect < 1% at rest (dust + screens only)" }));
await browser.close();
