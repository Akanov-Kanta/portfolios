import { createRequire } from "node:module";
const require = createRequire("/Users/nazarakanov/development/dossier/package.json");
const { chromium } = require("playwright");
const out = process.argv[2] || "/Users/nazarakanov/development/dossier/reference/shots/round1";
const url = "http://localhost:3240/";
const stops = [
  ["intro", 0, 2600],
  ["intro-pinned", 0.5, 1500],
  ["title-rising", 1.45, 1500],
  ["title", 1.9, 2600],
  ["title-smear", 2.5, 1500],
  ["drop", 3.6, 1200],
];
const browser = await chromium.launch();
const errors = [];
for (const [vw, vh, tag] of [[1440, 900, "desktop"], [390, 844, "mobile"]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, hasTouch: tag === "mobile", isMobile: tag === "mobile" });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(`[${tag}] ${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle" });
  if (tag === "desktop") await page.mouse.move(vw * 0.8, vh * 0.7);
  for (const [name, f, wait] of stops) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(f * vh));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${tag}-${name}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
