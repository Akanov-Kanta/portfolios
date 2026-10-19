// axe-core scan of the home page in loop mode + Tab-order check (focus must never enter the clone).
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.argv[2] ?? "http://localhost:3111";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const axe = await new AxeBuilder({ page }).analyze();
const violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));

// Tab through everything focusable and record where focus lands
const seen = [];
let inClone = 0;
for (let i = 0; i < 60; i++) {
  await page.keyboard.press("Tab");
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { tag: "BODY" };
    return { tag: el.tagName, text: (el.textContent || "").trim().slice(0, 30), href: el.getAttribute("href"), inClone: !!el.closest('[data-station="hero-clone"]') };
  });
  if (info.inClone) inClone++;
  seen.push(`${info.tag}:${info.text || info.href || ""}`);
  if (i > 5 && info.tag === "BODY") break;
}
const footerReachable = seen.some((s) => s.includes("GitHub")) && seen.some((s) => s.includes("Loop:"));
console.log(JSON.stringify({ violations, tabStops: seen.length, focusInClone: inClone, footerReachable, order: seen }, null, 1));
await browser.close();
process.exit(violations.filter((v) => v.impact === "critical" || v.impact === "serious").length === 0 && inClone === 0 && footerReachable ? 0 : 1);
