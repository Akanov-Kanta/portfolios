import { createRequire } from "node:module";
const require = createRequire("/Users/nazarakanov/development/dossier/package.json");
const { chromium } = require("playwright");
const out = "/Users/nazarakanov/development/dossier/reference/shots/round2";
const browser = await chromium.launch();
const errors = [];
const top = (page, id) => page.evaluate((id) => {
  const el = document.getElementById(id);
  const sp = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
  return sp.getBoundingClientRect().top + window.scrollY;
}, id);
for (const [vw, vh, tag, reduce] of [[1440, 900, "desktop", false], [390, 844, "mobile", false], [1440, 900, "reduced", true]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: tag === "mobile", hasTouch: tag === "mobile", reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(`[${tag}] ${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`[${tag}] pageerror: ${e.message}`));
  await page.goto(`http://localhost:${process.env.PORT ?? 3240}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const go = async (y, wait, name) => {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(y));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${tag}-${name}.png`, fullPage: false });
  };
  if (reduce) {
    const d = await top(page, "drop");
    await go(d, 500, "drop");
    const s = await top(page, "dossier");
    for (let i = 0; i < 4; i++) await go(s + i * vh, 400, `dossier-${i}`);
  } else {
    const d = await top(page, "drop");
    await go(d - 20 + 0.12 * vh, 1800, "drop-breath");
    await go(d + 0.55 * vh, 90, "drop-hit");
    await go(d + 0.95 * vh, 1300, "drop");
    const s = await top(page, "dossier");
    console.log(tag, "drop", d, "dossier", s);
    for (let k = 0; k < 5; k++) await go(s + (k + 0.55) * vh, 2400, `dossier-${k}`);
    await go(s + 5.6 * vh, 800, "after");
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
