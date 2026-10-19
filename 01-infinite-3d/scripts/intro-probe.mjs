// Intro: loader → assembly → landed; scroll locked while playing, unlocked after.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results/intro");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
const cdp = await page.context().newCDPSession(page);
const shot = async (n) => fs.writeFileSync(path.join(OUT, n + ".png"), Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png" })).data, "base64"));
const state = () => page.evaluate(() => ({ intro: document.documentElement.dataset.intro, y: Math.round(scrollY), overflow: getComputedStyle(document.documentElement).overflow, rootOpacity: getComputedStyle(document.getElementById("loop-root")).opacity }));
await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
await shot("0-loader");
const log = [await state()];
await page.waitForFunction(() => document.documentElement.dataset.intro === "playing", null, { timeout: 20000 });
log.push({ t: "playing-start", ...(await state()) });
await shot("1-playing-start");
await page.mouse.move(720, 450);
for (let k = 0; k < 10; k++) { await page.mouse.wheel(0, 200); await page.waitForTimeout(30); }
await page.waitForTimeout(800);
log.push({ t: "mid+wheel", ...(await state()) });
await shot("2-mid");
await page.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 20000 });
await page.waitForTimeout(1200);
log.push({ t: "done", ...(await state()) });
await shot("3-done");
for (let k = 0; k < 10; k++) { await page.mouse.wheel(0, 200); await page.waitForTimeout(30); }
await page.waitForTimeout(1500);
log.push({ t: "after-wheel", ...(await state()) });
await shot("4-scrolled");
const labels = await page.evaluate(() => [...document.querySelectorAll(".label3d")].map((l) => ({ op: l.style.opacity, text: l.querySelector("[data-text]")?.textContent?.slice(0, 40) })));
console.log(JSON.stringify({ log, labels, errors }, null, 1));
await browser.close();
