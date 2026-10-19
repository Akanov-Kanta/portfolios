// Checks the non-default modes: reduced motion (static), touch-wrap (iPhone), no WebGL, inner route.
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results/modes");
fs.mkdirSync(OUT, { recursive: true });
const results = {};
const errorsOf = (page, key) => {
  results[key] ??= {};
  results[key].errors = [];
  page.on("pageerror", (e) => results[key].errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && results[key].errors.push("console: " + m.text()));
};
const shot = async (page, name) => {
  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(data, "base64"));
  await cdp.detach();
};

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"] });

// 1. reduced motion → static: no lenis class, no clone, page scrolls natively and is finite
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  errorsOf(page, "reduced");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  Object.assign(results.reduced, await page.evaluate(() => ({
    loop: document.documentElement.dataset.loop,
    lenis: document.documentElement.classList.contains("lenis"),
    clones: document.querySelectorAll('[data-station="hero-clone"]').length,
    canvas: document.querySelectorAll("canvas").length,
  })));
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  results.reduced.bottomY = await page.evaluate(() => Math.round(scrollY));
  results.reduced.hud = await page.evaluate(() => [...document.querySelectorAll("p.marker, p.label")].map((p) => p.innerText).find((t) => /^\/\/ \d/.test(t)));
  await shot(page, "reduced-bottom");
  await ctx.close();
}

// 2. touch-wrap on iPhone: native scroll, clone present, resting at the bottom jumps to 0
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  errorsOf(page, "touch");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500); // coarse pointer: canvas mounts only on first intent (no timer), so canvas is 0 here
  Object.assign(results.touch, await page.evaluate(() => ({
    loop: document.documentElement.dataset.loop,
    clones: document.querySelectorAll('[data-station="hero-clone"]').length,
    canvas: document.querySelectorAll("canvas").length,
    tier: sessionStorage.getItem("portfolio.gpu"),
  })));
  await page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 15000 }).catch(() => {});
  await shot(page, "touch-top");
  const limit = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.evaluate((l) => window.scrollTo({ top: l, behavior: "instant" }), limit);
  await page.waitForTimeout(600);
  results.touch.afterBottomY = await page.evaluate(() => Math.round(scrollY));
  await page.evaluate((l) => window.scrollTo({ top: Math.round(l * 0.4), behavior: "instant" }), limit);
  await page.waitForTimeout(2500);
  results.touch.hud = await page.evaluate(() => [...document.querySelectorAll("p.marker, p.label")].map((p) => p.innerText).find((t) => /^\/\/ \d/.test(t)));
  await shot(page, "touch-mid");
  await ctx.close();
}

// 3. no WebGL: fallback stays, content readable, no errors
{
  const b2 = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-3d-apis"] });
  const ctx = await b2.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  errorsOf(page, "nogl");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  Object.assign(results.nogl, await page.evaluate(() => ({
    loop: document.documentElement.dataset.loop,
    canvas: document.querySelectorAll("canvas").length,
    tier: sessionStorage.getItem("portfolio.gpu"),
    h1: document.querySelector("h1")?.innerText,
  })));
  await shot(page, "nogl-top");
  await ctx.close();
  await b2.close();
}

// 4. inner route: canvas persists across client navigation, loop mode is finite there and back
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  errorsOf(page, "route");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => (document.querySelector("canvas").dataset.probe = "1"));
  // :visible: the phone-only device-slot duplicate of the link (display:none here) comes first in the DOM
  await page.click('a[href="/projects/glassbox"]:visible');
  await page.waitForURL("**/projects/glassbox");
  await page.waitForTimeout(2200);
  Object.assign(results.route, await page.evaluate(() => ({
    loop: document.documentElement.dataset.loop,
    canvasPersisted: document.querySelectorAll("canvas").length === 1 && document.querySelector("canvas").dataset.probe === "1",
    clones: document.querySelectorAll('[data-station="hero-clone"]').length,
    h1: document.querySelector("h1")?.innerText,
    hud: [...document.querySelectorAll("p.marker, p.label")].map((p) => p.innerText).find((t) => /^\/\/ \d/.test(t)),
  })));
  await shot(page, "route-project");
  await page.click('a[href="/#projects"]');
  await page.waitForURL("**/#projects");
  await page.waitForTimeout(2500);
  results.route.back = await page.evaluate(() => ({ loop: document.documentElement.dataset.loop, y: Math.round(scrollY), canvasPersisted: document.querySelector("canvas")?.dataset.probe === "1" }));
  await shot(page, "route-back");
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 1));
