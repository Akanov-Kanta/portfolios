// Review captures: node scripts/review-shots.mjs <outDir> [desktop|phone|seq|reduced|all]
// - page walk: a still every 0.6 viewport down the page (header collisions, empty space), desktop + phone
// - 120 ms screencast sequences: cold open → hit, index hover, file open, file close (desktop)
// - reduced motion: hero + files + an opened file
import { chromium, devices } from "playwright";
import fs from "node:fs";

const URL = process.env.URL ?? "http://localhost:3270/";
const OUT = process.argv[2] ?? "shots/casefile-r2/after";
const ONLY = process.argv[3] ?? "all";
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

/** screencast frames sampled every 120 ms while `act` runs, for `ms` */
async function seq(page, name, ms, act) {
  const dir = `${OUT}/seq-${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ t: f.metadata.timestamp, d: f.data });
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId });
    } catch {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, maxWidth: 720, maxHeight: 900 });
  await page.waitForTimeout(150);
  const t0 = Date.now() / 1000;
  await act();
  await page.waitForTimeout(Math.max(0, ms - (Date.now() / 1000 - t0) * 1000));
  await cdp.send("Page.stopScreencast").catch(() => {});
  let next = t0;
  let n = 0;
  for (let i = 0; i < frames.length; i++) {
    const nt = i + 1 < frames.length ? frames[i + 1].t : 1e12;
    while (next < nt && next <= t0 + ms / 1000) {
      if (frames[i].t <= next + 0.001) {
        fs.writeFileSync(`${dir}/${String(n).padStart(2, "0")}_${Math.round((next - t0) * 1000)}ms.jpg`, Buffer.from(frames[i].d, "base64"));
        n++;
      }
      next += 0.12;
    }
  }
  return n;
}

async function walk(kind) {
  const k = kind === "desktop" ? "d" : "m";
  const { ctx, page } = await ctxFor(kind);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/${k}-walk-00.png` });
  const H = kind === "desktop" ? 900 : 844;
  let i = 1;
  let lastY = -1;
  // scroll by wheel so Lenis and the header's direction logic see real input; stop at the bottom
  for (;;) {
    await page.mouse.move(200, 400);
    for (let s = 0; s < 6; s++) {
      await page.mouse.wheel(0, (H * 0.6) / 6);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(900);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    if (y === lastY) break;
    lastY = y;
    await page.screenshot({ path: `${OUT}/${k}-walk-${String(i).padStart(2, "0")}.png` });
    i++;
    if (i > 24) break;
  }
  // and back up a little: the header returns on scroll-up
  for (let s = 0; s < 4; s++) {
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${k}-walk-up.png` });
  await ctx.close();
}

async function sequences() {
  // cold open (fresh context = first visit)
  {
    const { ctx, page } = await ctxFor("desktop");
    await seq(page, "coldopen", 3200, async () => {
      await page.goto(URL, { waitUntil: "commit" });
    });
    await ctx.close();
  }
  const { ctx, page } = await ctxFor("desktop");
  await page.addInitScript(() => localStorage.setItem("casefile:seen", "1"));
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const el = document.querySelector("#files");
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
  });
  await page.waitForTimeout(900);
  await page.mouse.move(100, 880);
  const box = await page.locator('[data-row="glassbox"] .row-name').boundingBox();
  await seq(page, "hover", 1300, async () => {
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 3 });
  });
  await page.waitForTimeout(600);
  await seq(page, "open", 2400, async () => {
    await page.mouse.click(box.x + 60, box.y + box.height / 2);
  });
  await page.waitForTimeout(800);
  await seq(page, "close", 1800, async () => {
    await page.keyboard.press("Escape");
  });
  await ctx.close();
}

async function reduced() {
  const r = await ctxFor("desktop", { reducedMotion: "reduce" });
  await r.page.goto(URL, { waitUntil: "networkidle" });
  await r.page.waitForTimeout(800);
  await r.page.screenshot({ path: `${OUT}/x-reduced-hero.png` });
  await r.page.evaluate(() => window.scrollTo(0, document.querySelector("#files").offsetTop - 40));
  await r.page.waitForTimeout(300);
  await r.page.screenshot({ path: `${OUT}/x-reduced-files.png` });
  await r.page.click('[data-row="bariweb"]');
  await r.page.waitForTimeout(600);
  await r.page.screenshot({ path: `${OUT}/x-reduced-file.png` });
  await r.ctx.close();
}

if (ONLY === "all" || ONLY === "desktop") await walk("desktop");
if (ONLY === "all" || ONLY === "phone") await walk("phone");
if (ONLY === "all" || ONLY === "seq") await sequences();
if (ONLY === "all" || ONLY === "reduced") await reduced();
await browser.close();
console.log(errors.length ? [...new Set(errors)].join("\n") : "no console errors");
