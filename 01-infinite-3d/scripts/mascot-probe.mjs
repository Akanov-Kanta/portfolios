// Renders the contact station and checks the particle mascot reacts to cursor movement.
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import fs from "node:fs"; import path from "node:path";
const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results/mascot"); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist","--use-angle=metal","--enable-gpu"] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on("pageerror", e=>errors.push(String(e))); page.on("console", m=>m.type()==="error"&&errors.push("c:"+m.text()));
await page.goto(`${BASE}/?q=high`, { waitUntil: "networkidle" });
await page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 20000 });
// scroll to the contact station
await page.mouse.move(720, 450);
const contactY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight * 1.85); // contact rest: clone.top - 0.85vh
await page.evaluate((y) => window.__lenis?.scrollTo(y, { immediate: true }) ?? scrollTo(0, y), contactY);
await page.waitForTimeout(2500);
const cdp = await page.context().newCDPSession(page);
const grab = async (n) => { const buf = Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png" })).data, "base64"); if(n) fs.writeFileSync(path.join(OUT, n+".png"), buf); return PNG.sync.read(buf); };
// mascot roughly centre of screen; move cursor across it and diff a fixed frame vs one with cursor on it
await page.mouse.move(200, 800);
await page.waitForTimeout(600);
const a = await grab("no-cursor");
await page.mouse.move(720, 430); // onto the mascot
await page.waitForTimeout(120);
const bImg = await grab("cursor-on");
await page.mouse.move(760, 470);
await page.waitForTimeout(120);
await grab("cursor-moved");
const diff = pixelmatch(a.data, bImg.data, null, a.width, a.height, { threshold: 0.12 });
const pct = +(100 * diff / (a.width * a.height)).toFixed(3);
console.log(JSON.stringify({ cursorEffectPct: pct, note: ">0.1% means points visibly moved under the cursor", errors }));
await b.close();
