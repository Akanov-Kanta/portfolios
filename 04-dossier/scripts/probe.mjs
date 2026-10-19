import { createRequire } from "node:module";
const require = createRequire("/Users/nazarakanov/development/dossier/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const p = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:3240/", { waitUntil: "networkidle" });
await p.evaluate(() => window.scrollTo(0, 900 * 1.9));
await p.waitForTimeout(1500);
for (let i = 0; i < 6; i++) {
  const r = await p.evaluate(() => [...document.querySelectorAll("[data-streak]")].map((s) => { const b = s.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width), Math.round(b.top), getComputedStyle(s).opacity]; }).filter((a) => a[0] + a[1] > 0 && a[0] < innerWidth));
  console.log(JSON.stringify(r));
  await p.waitForTimeout(120);
}
await p.screenshot({ path: "/tmp/dossier-tools/probe.png" });
await browser.close();
