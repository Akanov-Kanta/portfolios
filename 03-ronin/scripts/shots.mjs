// Visual check: node scripts/shots.mjs [url] — writes screenshots/*.png
// Scrolls through the page so scroll-triggered reveals run, then captures viewports and a full page.
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://localhost:3106";
const out = "screenshots";
const browser = await chromium.launch();

for (const [name, width, height, reduced] of [
  ["desktop", 1440, 900, false],
  ["mobile", 390, 844, false],
  ["reduced", 1440, 900, true],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}/${name}-hero.png` });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(name, "scrollHeight", total, "scrollWidth", sw, "viewport", width);
  let i = 0;
  for (let y = height; y < total; y += Math.round(height * 0.9)) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(900);
    if (name !== "reduced") await page.screenshot({ path: `${out}/${name}-${String(++i).padStart(2, "0")}.png` });
  }
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  if (name === "desktop") {
    await page.evaluate(() => document.getElementById("works")?.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(800);
    await page.locator("#works button.panel").first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/desktop-dialog.png` });
  }
  if (name === "mobile") {
    await page.evaluate(() => document.getElementById("works")?.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(800);
    await page.locator("#works button.panel").nth(3).click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/mobile-dialog.png` });
  }
  await page.close();
}
await browser.close();
