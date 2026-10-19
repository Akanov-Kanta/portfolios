import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.text()));
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(process.env.URL ?? "http://localhost:3270/");
await p.waitForTimeout(2500);
// repeat visit: loader skipped
await p.reload();
await p.waitForTimeout(200);
console.log("intro on reload:", await p.evaluate(() => document.documentElement.dataset.intro));
// keyboard: tab to first row
await p.evaluate(() => window.scrollTo(0, document.querySelector("#files").offsetTop - 60));
await p.waitForTimeout(600);
await p.focus('[data-row="glassbox"]');
await p.waitForTimeout(400);
console.log("strip open on focus:", await p.evaluate(() => getComputedStyle(document.querySelector('[data-strip="glassbox"]')).clipPath));
await p.keyboard.press("Enter");
await p.waitForTimeout(1800);
console.log("url:", p.url(), "dialog:", await p.locator('[role="dialog"]').count(), "focused:", await p.evaluate(() => document.activeElement?.className));
console.log("page inert:", await p.evaluate(() => document.getElementById("page").hasAttribute("inert")));
await p.goBack();
await p.waitForTimeout(1800);
console.log("after back url:", p.url(), "dialog:", await p.locator('[role="dialog"]').count(), "focused:", await p.evaluate(() => document.activeElement?.getAttribute("data-row")));
// next file via click, then Esc
await p.click('[data-row="niscourses"]');
await p.waitForTimeout(1800);
await p.click(".file-next");
await p.waitForTimeout(600);
console.log("next url:", p.url(), await p.textContent("#file-name"));
await p.keyboard.press("Escape");
await p.waitForTimeout(1800);
console.log("esc url:", p.url(), "dialog:", await p.locator('[role="dialog"]').count());
// the header hides on scroll-down: keyboard focus inside it shows it, scrolling up brings it back
console.log("header state (scrolled down):", await p.getAttribute(".hdr", "data-state"));
await p.focus(".hdr-sound");
await p.waitForTimeout(400);
console.log("header on focus:", await p.evaluate(() => getComputedStyle(document.querySelector(".hdr")).transform));
await p.evaluate(() => document.activeElement?.blur());
await p.mouse.move(700, 450);
await p.mouse.wheel(0, -120);
await p.waitForTimeout(600);
console.log("header state (scrolled up):", await p.getAttribute(".hdr", "data-state"));
// sound toggle
await p.click(".hdr-sound");
console.log("sound:", await p.getAttribute(".hdr-sound", "aria-pressed"));
console.log(errs.length ? errs : "no console errors");
await b.close();
