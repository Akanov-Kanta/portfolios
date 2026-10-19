// Records short screen captures of the live projects for the CASE FILE index/file views.
// node scripts/record-projects.mjs [slug]  → /tmp/cfrec/<slug>.webm + <slug>.json (trim start, seconds)
import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/tmp/cfrec";
const W = 1280, H = 800;
const smooth = async (page, dy, ms) => {
  const steps = Math.round(ms / 16);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await page.waitForTimeout(16);
  }
};

const jobs = {
  glassbox: {
    url: "https://glassbox-fawn.vercel.app",
    async run(page) {
      const link = page.getByRole("link", { name: /make it write/i }).first();
      await page.mouse.move(300, 300);
      await page.waitForTimeout(600);
      const box = await link.boundingBox().catch(() => null);
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
      await page.waitForTimeout(250);
      await link.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1300);
      const chip = page.getByRole("button", { name: /Қалған/ }).first();
      const cb = await chip.boundingBox().catch(() => null);
      if (cb) await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2, { steps: 15 });
      await chip.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(400);
      await page.getByRole("button", { name: /^generate$/i }).first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(5200);
      await page.mouse.move(640, 500, { steps: 12 });
      await page.waitForTimeout(1600);
    },
  },
  bariweb: {
    url: "https://bariweb.vercel.app",
    async run(page) {
      await page.mouse.move(640, 300);
      await page.waitForTimeout(1500);
      await smooth(page, 800, 2200);
      await page.waitForTimeout(1200);
      await smooth(page, 900, 2400);
      await page.waitForTimeout(1200);
      await smooth(page, 900, 2400);
      await page.waitForTimeout(1200);
    },
  },
};

const only = process.argv[2];
const browser = await chromium.launch();
for (const [slug, job] of Object.entries(jobs)) {
  if (only && only !== slug) continue;
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: `${OUT}/${slug}-raw`, size: { width: W, height: H } },
    colorScheme: "dark",
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto(job.url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const start = (Date.now() - t0) / 1000;
  await job.run(page);
  const end = (Date.now() - t0) / 1000;
  const video = page.video();
  await ctx.close();
  const p = await video.path();
  fs.copyFileSync(p, `${OUT}/${slug}.webm`);
  fs.writeFileSync(`${OUT}/${slug}.json`, JSON.stringify({ start, end }));
  console.log(slug, { start, end, p });
}
await browser.close();
