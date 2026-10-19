// CASE FILE screenshots: node scripts/casefile-shots.mjs [outDir] [only]
// desktop 1440x900 + phone 390x844 across the page, hover strip, file view (+ transition frames), reduced motion.
import { chromium, devices } from "playwright";
import fs from "node:fs";

const URL = "http://localhost:3270/";
const OUT = process.argv[2] ?? "shots/casefile-r1";
const ONLY = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await chromium.launch();

async function ctxFor(kind, extra = {}) {
  const opts =
    kind === "phone"
      ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }
      : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
  const ctx = await browser.newContext({ ...opts, ...extra });
  const page = await ctx.newPage();
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(`[${kind}] ${m.type()}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${kind}] pageerror: ${e.message}`));
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
const scrollToSel = async (page, sel, off = 0) => {
  await page.evaluate(([s, o]) => {
    const el = document.querySelector(s);
    const y = el.getBoundingClientRect().top + window.scrollY + o;
    window.scrollTo(0, y);
  }, [sel, off]);
  await page.waitForTimeout(700);
};

for (const kind of ["desktop", "phone"]) {
  if (ONLY && ONLY !== kind) continue;
  const k = kind === "desktop" ? "d" : "m";
  const { ctx, page } = await ctxFor(kind);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  // cold open frames
  for (const t of [300, 800]) {
    await page.waitForTimeout(t === 300 ? 300 : 500);
    await shot(page, `${k}-00-loader-${t}`);
  }
  await page.waitForTimeout(1600);
  await shot(page, `${k}-01-hero`);
  await page.waitForTimeout(2500);
  await shot(page, `${k}-02-hero-late`);
  await scrollToSel(page, "#files", -60);
  await shot(page, `${k}-03-files`);
  if (kind === "desktop") {
    await page.hover('[data-row="glassbox"] .row-name');
    await page.waitForTimeout(120);
    await shot(page, `${k}-04-hover-mid`);
    await page.waitForTimeout(1200);
    await shot(page, `${k}-04-hover-glassbox`);
    await page.hover('[data-row="niscourses"] .row-name');
    await page.waitForTimeout(900);
    await shot(page, `${k}-04-hover-niscourses`);
    await page.hover('[data-row="bariweb"] .row-name');
    await page.waitForTimeout(900);
    await shot(page, `${k}-04-hover-bariweb`);
    await page.click('[data-row="bariweb"]');
  } else {
    await page.click('[data-row="glassbox"] .row-strip');
  }
  for (const t of [300, 700, 1000, 1250]) {
    await page.waitForTimeout(t === 300 ? 300 : t === 700 ? 400 : t === 1000 ? 300 : 250);
    await shot(page, `${k}-05-open-${t}`);
  }
  await page.waitForTimeout(1200);
  await shot(page, `${k}-06-file`);
  await page.evaluate(() => document.querySelector(".file").scrollTo(0, window.innerHeight * 0.9));
  await page.waitForTimeout(500);
  await shot(page, `${k}-06-file-2`);
  await page.evaluate(() => document.querySelector(".file").scrollTo(0, 1e5));
  await page.waitForTimeout(500);
  await shot(page, `${k}-06-file-3`);
  await page.evaluate(() => document.querySelector(".file").scrollTo(0, 0));
  await page.keyboard.press("Escape");
  for (const t of [300, 800]) {
    await page.waitForTimeout(t === 300 ? 300 : 500);
    await shot(page, `${k}-07-close-${t}`);
  }
  await page.waitForTimeout(800);
  await shot(page, `${k}-07-closed`);
  await scrollToSel(page, "#profile", -60);
  await shot(page, `${k}-08-profile`);
  await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
  await page.waitForTimeout(700);
  await shot(page, `${k}-09-profile-2`);
  await scrollToSel(page, "#contact", -60);
  await shot(page, `${k}-10-contact`);
  await page.evaluate(() => window.scrollTo(0, 1e6));
  await page.waitForTimeout(800);
  await shot(page, `${k}-11-end`);
  await ctx.close();
}

// deep link + reduced motion
if (!ONLY || ONLY === "extra") {
  const { ctx, page } = await ctxFor("desktop");
  await page.goto(URL + "?file=niscourses", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, `x-deeplink-niscourses`);
  await page.goBack().catch(() => {});
  await ctx.close();
  const r = await ctxFor("desktop", { reducedMotion: "reduce" });
  await r.page.goto(URL, { waitUntil: "networkidle" });
  await r.page.waitForTimeout(800);
  await shot(r.page, `x-reduced-hero`);
  await r.page.evaluate(() => window.scrollTo(0, document.querySelector("#files").offsetTop - 40));
  await r.page.waitForTimeout(300);
  await shot(r.page, `x-reduced-files`);
  await r.ctx.close();
}

await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");
