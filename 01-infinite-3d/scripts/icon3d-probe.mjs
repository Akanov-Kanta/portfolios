import { chromium } from "playwright";
import { PNG } from "pngjs"; import pixelmatch from "pixelmatch";
import fs from "node:fs"; import path from "node:path";
const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results/icon3d"); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist","--use-angle=metal","--enable-gpu"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", e=>errors.push(String(e)));
await p.goto(`${BASE}/?q=high`, { waitUntil: "networkidle" });
await p.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 20000 });
await p.mouse.move(720, 450);
const y = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight * 1.85); // contact rest: clone.top - 0.85vh
await p.evaluate((yy) => window.__lenis?.scrollTo(yy, { immediate: true }) ?? scrollTo(0,yy), y);
await p.waitForTimeout(3200);
const cdp = await p.context().newCDPSession(p);
const grab = async (n) => { const buf = Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png" })).data, "base64"); if(n) fs.writeFileSync(path.join(OUT, n+".png"), buf); return PNG.sync.read(buf); };
const a = await grab("icon-0");
const key0 = await p.evaluate(() => window.__socialKey?.());
// click Next twice to change platform
await p.locator('button[aria-label="Next link"]').click();
await p.waitForTimeout(700);
const bImg = await grab("icon-1");
await p.locator('button[aria-label="Next link"]').click();
await p.waitForTimeout(700);
await grab("icon-2");
const diff = pixelmatch(a.data, bImg.data, null, a.width, a.height, { threshold: 0.12 });
console.log(JSON.stringify({ iconChangePct: +(100*diff/(a.width*a.height)).toFixed(3), errors }));
await b.close();
