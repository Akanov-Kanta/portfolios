// Round 3 shots: INVERT + OUTRO. PORT env (default 3240).
import { createRequire } from "node:module";
const require = createRequire(new URL("../package.json", import.meta.url));
const { chromium } = require("playwright");
const out = new URL("../reference/shots/round3/", import.meta.url).pathname;
const url = `http://localhost:${process.env.PORT ?? 3240}/`;
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
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const go = async (y, wait, name) => {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(y));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}${tag}-${name}.png` });
    return page.evaluate(() => document.documentElement.dataset.theme ?? "-");
  };
  const inv = await top(page, "invert");
  const outro = await top(page, "outro");
  if (reduce) {
    await go(inv, 400, "invert-0");
    await go(inv + vh, 400, "invert-1");
    await go(outro, 400, "outro");
  } else {
    const t = [];
    t.push(await go(inv - 0.3 * vh, 800, "dossier-end"));
    t.push(await go(inv + 0.15 * vh, 700, "invert-question"));
    t.push(await go(inv + 0.15 * vh + 4, 140, "invert-question-b"));
    t.push(await go(inv + 1.25 * vh, 900, "invert-window"));
    t.push(await go(inv + 2.2 * vh, 900, "invert-late"));
    t.push(await go(inv + 2.75 * vh, 900, "invert-late-2"));
    t.push(await go(outro + 0.05 * vh, 2600, "outro"));
    console.log(tag, "themes:", t.join(" "));
  }
  await ctx.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
