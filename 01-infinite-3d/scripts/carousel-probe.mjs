import { chromium } from "playwright";
import fs from "node:fs"; import path from "node:path";
const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = path.resolve("test-results/carousel"); fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist","--use-angle=metal","--enable-gpu"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", e=>errors.push(String(e)));
await p.goto(`${BASE}/?loop=0`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
await p.evaluate(() => document.getElementById("contact").scrollIntoView({ block: "end" }));
await p.waitForTimeout(800);
const grp = p.locator('[aria-label="Social links"]');
await grp.scrollIntoViewIfNeeded();
const cdp = await p.context().newCDPSession(p);
const shot = async (n) => fs.writeFileSync(path.join(OUT, n+".png"), Buffer.from((await cdp.send("Page.captureScreenshot", { format: "png", clip: await elClip(grp) })).data, "base64"));
async function elClip(loc){ const bb = await loc.boundingBox(); return { x: Math.max(0,bb.x-40), y: Math.max(0,bb.y-20), width: bb.width+80, height: bb.height+40, scale: 1 }; }
// the active label is the bracketed OPEN link; its sr-only copy holds the final (unscrambled) text
const label = () => grp.locator('a[data-cursor="open"]').evaluate(a => a.querySelector(".sr-only")?.textContent ?? a.textContent);
// with WebGL the icon is the 3D orb logo; the DOM svg only exists in the no-WebGL fallback
const iconPath = async () => (await grp.locator("svg").count()) ? grp.locator("svg").first().locator("path,rect,circle").first().evaluate(el => el.tagName + (el.getAttribute("d")||"").slice(0,18)) : "webgl";
const seq = [];
for (let k = 0; k < 4; k++) {
  seq.push({ label: String(await label()).replace(/\s+/g," ").trim(), icon: await iconPath() });
  await shot(`s${k}`);
  await p.getByRole("button", { name: "Next link" }).click();
  await p.waitForTimeout(500);
}
console.log(JSON.stringify({ seq, iconsDiffer: new Set(seq.map(s=>s.icon)).size, errors }, null, 1));
await b.close();
