import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:3111";
const b = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist","--use-angle=metal","--enable-gpu"] });
for (const label of ["fresh", "reload-after-scroll"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", e=>errs.push(String(e)));
  await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);
  const atLoad = await p.evaluate(() => ({ y: Math.round(scrollY), intro: document.documentElement.dataset.intro, restore: history.scrollRestoration }));
  await p.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 20000 }).catch(()=>{});
  await p.waitForTimeout(500);
  const afterIntro = await p.evaluate(() => ({ y: Math.round(scrollY), station: [...document.querySelectorAll("p.marker")].map(x=>x.innerText).find(t=>t.startsWith("[")) }));
  if (label === "reload-after-scroll") {
    // scroll to footer then reload, to test scroll restoration
    await p.evaluate(() => window.__lenis?.scrollTo(document.getElementById("contact").getBoundingClientRect().top + scrollY + 700, { immediate: true }));
    await p.waitForTimeout(600);
    await p.reload({ waitUntil: "domcontentloaded" });
    await p.waitForTimeout(1500);
    const afterReload = await p.evaluate(() => ({ y: Math.round(scrollY), station: [...document.querySelectorAll("p.marker")].map(x=>x.innerText).find(t=>t.startsWith("[")) }));
    console.log(label, JSON.stringify({ atLoad, afterIntro, afterReload, errs: errs.slice(0,2) }));
  } else {
    console.log(label, JSON.stringify({ atLoad, afterIntro, errs: errs.slice(0,2) }));
  }
  await ctx.close();
}
await b.close();
