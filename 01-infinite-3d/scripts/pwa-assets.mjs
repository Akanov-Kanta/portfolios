// PWA icons, iOS startup images and manifest screenshots. Outputs are committed; rerun after icon changes.
//
//   node scripts/pwa-assets.mjs                  icons + apple-icon + 12 splash PNGs (no server needed), then asserts
//   node scripts/pwa-assets.mjs --shots <base>   also captures the 3 manifest screenshots from a running
//                                                `next start` (after the mobile redesign; they go stale with it)
//   node scripts/pwa-assets.mjs --check          asserts the committed files only (sizes, alpha, safe zone)
//
// Outputs:
//   src/app/apple-icon.png                  180, opaque void, cyan [NA] (iOS masks it itself; alpha would turn black)
//   public/pwa/icon-{192,512}.png           purpose "any": src/app/icon.svg (rounded tile, transparent corners)
//   public/pwa/maskable-{192,512}.png       purpose "maskable": opaque void, the monogram inside the r = 0.4·S safe zone
//   public/pwa/splash/<W>x<H>.png           12 solid #0a0b10 iPhone portrait startup images (layout.tsx SPLASH)
//   public/pwa/screen-narrow-{hero,projects}.jpg  1170x2532 (390x844 @3)   public/pwa/screen-wide-hero.jpg 1920x1080
// Rasterised with Chrome (playwright) at DPR 1; splash and assertions with pngjs. No new dependencies.
import { chromium, devices } from "playwright";
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PWA = path.join(ROOT, "public", "pwa");
const SPLASH_DIR = path.join(PWA, "splash");
const APPLE = path.join(ROOT, "src", "app", "apple-icon.png");
const ICON_SVG = path.join(ROOT, "src", "app", "icon.svg");

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes("--check");
const shotsAt = argv.indexOf("--shots");
const SHOTS_BASE = shotsAt >= 0 ? (argv[shotsAt + 1] ?? "").replace(/\/$/, "") : null;
if (shotsAt >= 0 && !/^https?:\/\//.test(SHOTS_BASE ?? "")) {
  console.error("usage: node scripts/pwa-assets.mjs --shots http://localhost:3112");
  process.exit(2);
}

/** same strokes as hud/Monogram.tsx and app/opengraph-image.tsx (44x24 box, glyph centre (22,12)) */
const MONOGRAM_D = "M7 3H3V21H7M10.5 20V4L19.5 20V4M23.5 20L28 4L32.5 20M25.1 14.5H30.9M37 3H41V21H37";
const VOID = [10, 11, 16];
const VOID_HEX = "#0a0b10";
const CYAN = "#6cf2ff";
/** [css w, css h, dpr]: must equal SPLASH in src/app/layout.tsx */
const SPLASH = [
  [375, 667, 2], [414, 736, 3], [375, 812, 3], [414, 896, 2], [414, 896, 3], [390, 844, 3],
  [428, 926, 3], [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3], [420, 912, 3],
];
const SHOTS = [
  { file: "screen-narrow-hero.jpg", w: 1170, h: 2532 },
  { file: "screen-narrow-projects.jpg", w: 1170, h: 2532 },
  { file: "screen-wide-hero.jpg", w: 1920, h: 1080 },
];

/** opaque void square, cyan monogram scaled by k around the centre */
const monogramSvg = (S, k) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
  `<rect width="${S}" height="${S}" fill="${VOID_HEX}"/>` +
  `<g transform="translate(${S / 2} ${S / 2}) scale(${k}) translate(-22 -12)">` +
  `<path d="${MONOGRAM_D}" fill="none" stroke="${CYAN}" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"/></g></svg>`;

/** src/app/icon.svg at S x S (its own viewBox, transparent outside the rounded tile) */
const anySvg = (S) => fs.readFileSync(ICON_SVG, "utf8").replace("<svg ", `<svg width="${S}" height="${S}" `);

const ICONS = [
  { out: path.join(PWA, "icon-192.png"), S: 192, svg: () => anySvg(192), purpose: "any" },
  { out: path.join(PWA, "icon-512.png"), S: 512, svg: () => anySvg(512), purpose: "any" },
  { out: path.join(PWA, "maskable-192.png"), S: 192, svg: () => monogramSvg(192, 192 * 0.01406), purpose: "maskable" },
  { out: path.join(PWA, "maskable-512.png"), S: 512, svg: () => monogramSvg(512, 512 * 0.01406), purpose: "maskable" },
  { out: APPLE, S: 180, svg: () => monogramSvg(180, 180 * 0.0158), purpose: "apple" },
];

const rel = (p) => path.relative(ROOT, p);

async function rasterise(browser) {
  fs.mkdirSync(PWA, { recursive: true });
  for (const icon of ICONS) {
    const ctx = await browser.newContext({ viewport: { width: icon.S, height: icon.S }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${icon.svg()}</body></html>`);
    await page.screenshot({ path: icon.out, omitBackground: icon.purpose === "any", clip: { x: 0, y: 0, width: icon.S, height: icon.S } });
    await ctx.close();
  }
}

function writeSplash() {
  fs.mkdirSync(SPLASH_DIR, { recursive: true });
  for (const [w, h, d] of SPLASH) {
    const W = w * d, H = h * d;
    const png = new PNG({ width: W, height: H });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = VOID[0];
      png.data[i + 1] = VOID[1];
      png.data[i + 2] = VOID[2];
      png.data[i + 3] = 255;
    }
    fs.writeFileSync(path.join(SPLASH_DIR, `${W}x${H}.png`), PNG.sync.write(png, { colorType: 2 }));
  }
}

/** A tap that hits no link or button: on a phone it only counts as intent. */
async function safeTap(page) {
  const pt = await page.evaluate(() => {
    const bad = "a,button,input,select,textarea,label,summary,dialog,[role=button],[role=link],[tabindex],[data-phone-dock]";
    for (const fy of [0.45, 0.35, 0.55, 0.3]) {
      for (const fx of [0.5, 0.35, 0.65]) {
        const x = Math.round(innerWidth * fx), y = Math.round(innerHeight * fy);
        const el = document.elementFromPoint(x, y);
        if (el && !el.closest(bad)) return { x, y };
      }
    }
    return { x: 4, y: Math.round(innerHeight * 0.4) };
  });
  await page.touchscreen.tap(pt.x, pt.y);
}

const waitReady = (page) =>
  page.waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 30000 }).catch(() => {
    console.warn("  (world-ready never fired: the shot shows the fallback)");
  });
const waitIntro = (page) => page.waitForFunction(() => document.documentElement.dataset.intro !== "playing", null, { timeout: 15000 }).catch(() => {});

async function captureShots(base) {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"] });
  try {
    // narrow: iPhone 13 class, 390x844 @3 → 1170x2532
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent });
      const page = await ctx.newPage();
      await page.goto(`${base}/`, { waitUntil: "load" });
      await safeTap(page);
      await waitReady(page);
      await waitIntro(page);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(PWA, "screen-narrow-hero.jpg"), type: "jpeg", quality: 80 });
      const top = await page.evaluate(() => {
        const el = document.querySelector("#projects article") ?? document.getElementById("projects");
        return el ? Math.round(el.getBoundingClientRect().top + scrollY) : null;
      });
      if (top == null) throw new Error("--shots: #projects not found");
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
      await page.waitForTimeout(2500); // camera flight + settle + captions
      await page.screenshot({ path: path.join(PWA, "screen-narrow-projects.jpg"), type: "jpeg", quality: 80 });
      await ctx.close();
    }
    // wide: desktop 1920x1080 @1
    {
      const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      await page.goto(`${base}/`, { waitUntil: "load" });
      await waitReady(page);
      await page.waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(PWA, "screen-wide-hero.jpg"), type: "jpeg", quality: 80 });
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

/** width/height from a baseline or progressive JPEG's SOF marker */
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}

function check() {
  const fails = [];
  const notes = [];
  const read = (p) => PNG.sync.read(fs.readFileSync(p));
  const alphaMin = (png) => {
    let min = 255;
    for (let i = 3; i < png.data.length; i += 4) if (png.data[i] < min) min = png.data[i];
    return min;
  };
  const px = (png, x, y) => png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4);
  const isVoid = (p) => Math.abs(p[0] - VOID[0]) <= 1 && Math.abs(p[1] - VOID[1]) <= 1 && Math.abs(p[2] - VOID[2]) <= 1 && p[3] === 255;

  for (const icon of ICONS) {
    if (!fs.existsSync(icon.out)) {
      fails.push(`${rel(icon.out)}: missing`);
      continue;
    }
    const png = read(icon.out);
    if (png.width !== icon.S || png.height !== icon.S) fails.push(`${rel(icon.out)}: ${png.width}x${png.height}, want ${icon.S}x${icon.S}`);
    if (icon.purpose === "any") {
      const corners = [px(png, 0, 0), px(png, icon.S - 1, 0), px(png, 0, icon.S - 1), px(png, icon.S - 1, icon.S - 1)];
      if (corners.some((c) => c[3] !== 0)) fails.push(`${rel(icon.out)}: corners are not transparent`);
      const mid = px(png, icon.S >> 1, 2);
      if (mid[3] !== 255) fails.push(`${rel(icon.out)}: the tile is not opaque at its top edge`);
    } else {
      const a = alphaMin(png);
      if (a !== 255) fails.push(`${rel(icon.out)}: not fully opaque (min alpha ${a})`);
      if (!isVoid(px(png, 0, 0))) fails.push(`${rel(icon.out)}: background is not #0a0b10`);
    }
    if (icon.purpose === "maskable") {
      const S = icon.S, c = (S - 1) / 2, r = 0.4 * S;
      let outside = 0, ink = 0, far = 0;
      for (let y = 0; y < S; y++) {
        for (let x = 0; x < S; x++) {
          if (isVoid(px(png, x, y))) continue;
          ink++;
          const d = Math.hypot(x - c, y - c);
          far = Math.max(far, d);
          if (d > r) outside++;
        }
      }
      if (!ink) fails.push(`${rel(icon.out)}: no monogram pixels`);
      if (outside) fails.push(`${rel(icon.out)}: ${outside} non-void px outside the r=0.4·S safe zone`);
      notes.push(`${rel(icon.out)}: monogram reaches r=${far.toFixed(1)} of ${r.toFixed(1)}`);
    }
  }
  for (const [w, h, d] of SPLASH) {
    const f = path.join(SPLASH_DIR, `${w * d}x${h * d}.png`);
    if (!fs.existsSync(f)) {
      fails.push(`${rel(f)}: missing`);
      continue;
    }
    const png = read(f);
    if (png.width !== w * d || png.height !== h * d) fails.push(`${rel(f)}: ${png.width}x${png.height}`);
    if (alphaMin(png) !== 255) fails.push(`${rel(f)}: not fully opaque`);
    for (let i = 0; i < png.data.length; i += 4 * 997) {
      if (!isVoid(png.data.subarray(i, i + 4))) {
        fails.push(`${rel(f)}: not solid #0a0b10`);
        break;
      }
    }
  }
  const shots = {};
  for (const s of SHOTS) {
    const f = path.join(PWA, s.file);
    if (!fs.existsSync(f)) {
      shots[s.file] = "missing (run --shots <base> after the redesign)";
      continue;
    }
    const size = jpegSize(fs.readFileSync(f));
    if (!size) fails.push(`${rel(f)}: not a JPEG`);
    else if (size.w !== s.w || size.h !== s.h) fails.push(`${rel(f)}: ${size.w}x${size.h}, want ${s.w}x${s.h}`);
    else shots[s.file] = `${size.w}x${size.h}`;
  }
  return { fails, notes, shots };
}

if (!CHECK_ONLY) {
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--force-color-profile=srgb"] });
  try {
    await rasterise(browser);
  } finally {
    await browser.close();
  }
  writeSplash();
  if (SHOTS_BASE) await captureShots(SHOTS_BASE);
}
const res = check();
const written = [...ICONS.map((i) => rel(i.out)), `${rel(SPLASH_DIR)}/*.png (${SPLASH.length})`];
console.log(JSON.stringify({ mode: CHECK_ONLY ? "check" : SHOTS_BASE ? "assets+shots" : "assets", written: CHECK_ONLY ? [] : written, shots: res.shots, notes: res.notes, fails: res.fails }, null, 1));
process.exit(res.fails.length ? 1 : 0);
