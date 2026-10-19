// Motion check: at a fixed scroll position per shot, 6 screenshots 100 ms apart → screenshots/motion/
// node scripts/motion-check.mjs [base]   (then: ../../tools/.venv/bin/python scripts/motion-diff.py)
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:3106";
const out = "screenshots/motion";
mkdirSync(out, { recursive: true });
const stops = { s1: 30, s2: 250, s3: 560, s4: 880, s4c: 935, s5: 1250, s6: 1600 };
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
for (const [name, vp] of [["d", { width: 1440, height: 900 }], ["m", { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${name} pageerror: ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  await p.goto(base, { waitUntil: "networkidle" });
  await p.waitForTimeout(4200);
  for (const [shot, u] of Object.entries(stops)) {
    await p.evaluate((u) => window.scrollTo(0, (u / 100) * window.innerHeight), u);
    await p.waitForTimeout(1600);
    for (let k = 0; k < 6; k++) {
      await p.screenshot({ path: `${out}/${name}-${shot}-${k}.png` });
      await p.waitForTimeout(100);
    }
  }
  const gl = await p.evaluate(() => [...document.querySelectorAll(".sprite")].map((e) => `${e.closest("[data-shot]")?.dataset.shot}:${e.classList.contains("gl") ? "gl" : "css"}`));
  console.log(name, "sprites", gl.join(" "));
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (sw > 0) errors.push(`${name}: horizontal overflow ${sw}px`);
  await ctx.close();
}
await b.close();
console.log(errors.length ? errors.join("\n") : "no errors");
