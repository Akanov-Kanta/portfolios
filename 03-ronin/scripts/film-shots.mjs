// Visual check of the film: node scripts/film-shots.mjs [base] — screenshots into screenshots/film/
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3106";
const out = "screenshots/film";
const stops = [0, 100, 145, 250, 420, 520, 620, 720, 805, 880, 931, 990, 1120, 1300, 1450, 1600, 1700, 1830, 1905, 1990, 2030];
const b = await chromium.launch();
const errors = [];
for (const [name, vp] of [["d", { width: 1440, height: 900 }], ["m", { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${name} pageerror: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${name}-intro.png` });
  await p.waitForTimeout(3600);
  for (const u of stops) {
    await p.evaluate((u) => window.scrollTo(0, (u / 100) * window.innerHeight), u);
    await p.waitForTimeout(u === 931 ? 120 : 700);
    await p.screenshot({ path: `${out}/${name}-${String(u).padStart(4, "0")}.png` });
  }
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (sw > 0) errors.push(`${name}: horizontal overflow ${sw}px`);
  await ctx.close();
}
// the loop: wheel past the end lands back on shot 1
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${out}/loop-start.png` });
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(800);
  const before = await p.evaluate(() => [window.scrollY, document.documentElement.scrollHeight - innerHeight]);
  await p.screenshot({ path: `${out}/loop-end.png` });
  await p.mouse.move(700, 450);
  for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); }
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => window.scrollY);
  await p.screenshot({ path: `${out}/loop-wrapped.png` });
  console.log("loop: scrollY before", before, "after wheel", after);
  await ctx.close();
}
// interactions: nav jump, a project scroll, writing a letter
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`i pageerror: ${e.message}`));
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(3800);
  await p.click("nav a[href='#path']");
  await p.waitForTimeout(2400);
  console.log("nav → path, counter:", await p.textContent(".film-counter-n"), "scrollY", await p.evaluate(() => scrollY));
  await p.screenshot({ path: `${out}/i-nav-path.png` });
  await p.click("nav a[href='#works']");
  await p.waitForTimeout(2400);
  await p.click("[data-f='s3-panel-0'] button");
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/i-dialog.png` });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(400);
  await p.click("nav a[href='#contact']");
  await p.waitForTimeout(2600);
  await p.click(".s6-letter canvas");
  await p.keyboard.type("hello ronin", { delay: 90 });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${out}/i-letter.png` });
  console.log("mailto:", await p.getAttribute(".s6-actions a", "href"));
  await ctx.close();
}
// reduced motion: the static stacked frames
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base, { waitUntil: "networkidle" });
  for (let y = 0, h = await p.evaluate(() => document.documentElement.scrollHeight); y < h; y += 900) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250); }
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/reduced-full.png`, fullPage: true });
  console.log("reduced height", await p.evaluate(() => document.documentElement.scrollHeight));
  await ctx.close();
}
await b.close();
console.log(errors.length ? errors.join("\n") : "no errors");
