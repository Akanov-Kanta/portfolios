import { chromium } from "playwright";
import fs from "node:fs"; import path from "node:path";
const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results"); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist","--use-angle=metal","--enable-gpu"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/?loop=0`, { waitUntil: "networkidle" }); // static mode = full DOM, easy to scroll to the footer
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(1200);
const cdp = await p.context().newCDPSession(p);
fs.writeFileSync(path.join(OUT, "footer.png"), Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png" })).data, "base64"));
console.log("ok");
await b.close();
