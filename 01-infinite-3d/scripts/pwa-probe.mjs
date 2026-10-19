// PWA verification (sections A–M of the PWA testing plan). Playwright npm library only; never page.route
// (it conflicts with service-worker interception); never port 3111.
//
//   node scripts/pwa-probe.mjs [--port=3116]                       FULL run. Builds and serves this tree itself:
//        build A (NEXT_DEPLOYMENT_ID=A) → A B C D E F K L → origin down: G → build B, same port: H → I →
//        NEXT_PUBLIC_SW=off build: J → normal build: M (+ the kill-switch loop check). Leaves a NORMAL production
//        build in .next and no server running. Stop any `next start` of this tree first (a build replaces .next).
//   node scripts/pwa-probe.mjs <baseUrl> --no-build                 against a running production server (default
//        http://localhost:3112): A B C D E F K L (+ J-dev). G, H, I, J-kill, J-off and M need --port mode.
// Options: --only=A,E,F   --port=3116 (3116-3119)   --dev=http://localhost:3200 (a `next dev` of this tree, for the
//          "dev unregisters" check; skipped when down)   --out=<dir>   --headed
//          --art=<dir>: M also checks first-load JS for / against <dir>/step0/build-before.json (+3 KB gz budget)
// Output: <out>/report.json + screenshots (default out: test-results/pwa-probe under the working directory); exit 1
// on any failed check.
import { chromium, webkit, devices } from "playwright";
import { PNG } from "pngjs";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const SW_FILE = path.join(ROOT, "public", "sw.js");

const argv = process.argv.slice(2);
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const flag = (name) => argv.includes(`--${name}`);
const NO_BUILD = flag("no-build");
const HEADED = flag("headed");
const PORT = Number(opt("port") ?? 3116);
const DEV = (opt("dev") ?? "http://localhost:3200").replace(/\/$/, "");
const OUT = path.resolve(opt("out") ?? "test-results/pwa-probe");
/** --art=<dir>: M compares first-load JS with <dir>/step0/build-before.json (origin/main) when it exists */
const ART = opt("art") ? path.resolve(opt("art")) : null;
const ONLY = opt("only")?.split(",").map((s) => s.trim().toUpperCase());
const BASE = NO_BUILD ? (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3112").replace(/\/$/, "") : `http://localhost:${PORT}`;
const want = (s) => !ONLY || ONLY.includes(s.toUpperCase());

if (/:3111\b/.test(BASE) || /:3111\b/.test(DEV) || PORT === 3111) {
  console.error("pwa-probe: port 3111 is reserved (the user's own server). Use 3112-3119.");
  process.exit(2);
}
if (!NO_BUILD && (PORT < 3116 || PORT > 3119)) {
  console.error("pwa-probe: --port must be 3116-3119 (the probe builds and serves on it).");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- results
const report = { base: BASE, mode: NO_BUILD ? "no-build" : "full", at: new Date().toISOString(), sections: {}, warnings: [] };
const sec = (id) => (report.sections[id] ??= { pass: true, checks: [], notes: [] });
function check(id, name, ok, got) {
  const s = sec(id);
  s.checks.push({ name, pass: !!ok, ...(got === undefined ? {} : { got }) });
  if (!ok) s.pass = false;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${id} ${name}${ok || got === undefined ? "" : `  → ${JSON.stringify(got).slice(0, 300)}`}`);
  return !!ok;
}
const note = (id, text) => {
  sec(id).notes.push(text);
  console.log(`  ..   ${id} ${text}`);
};
const skip = (id, why) => {
  sec(id).skipped = why;
  console.log(`  --   ${id} skipped: ${why}`);
};
async function section(id, title, fn) {
  if (!want(id)) return;
  console.log(`\n[${id}] ${title}`);
  try {
    await fn();
  } catch (e) {
    check(id, "section ran to completion", false, String(e?.stack ?? e).slice(0, 600));
  }
}

// ---------------------------------------------------------------- helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GPU = ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"];
const PHONE_MQ = (() => {
  const src = fs.readFileSync(path.join(ROOT, "src", "components", "world", "phone.ts"), "utf8");
  return /export const PHONE_MQ = "([^"]+)"/.exec(src)?.[1];
})();
const SPLASH_COUNT = 12;
const VOID = [10, 11, 16];
const OWN_CACHE = /^(core|pages|static|assets)-/;
const KILL_SWITCH_SW = `// pwa-probe: self-destruct worker (the documented kill switch)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => { for (const k of await caches.keys()) await caches.delete(k); await self.registration.unregister(); for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url); })()));
`;
const SW_ORIGINAL = fs.readFileSync(SW_FILE);
/** the worker's cache VERSION (public/sw.js) and the next one, for the bump test (I) */
const V = /const VERSION = "(v\d+)"/.exec(SW_ORIGINAL.toString())?.[1] ?? "v1";
const V_NEXT = `v${Number(V.slice(1)) + 1}`;
let swTouched = false;
function writeSw(text) {
  swTouched = true;
  fs.writeFileSync(SW_FILE, text);
}
function restoreSw() {
  if (!swTouched) return;
  fs.writeFileSync(SW_FILE, SW_ORIGINAL);
  swTouched = false;
}

const waitReady = (page, timeout = 25000) =>
  page
    .waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout })
    .then(() => true)
    .catch(() => false);
const waitControlled = (page, timeout = 25000) =>
  page
    .waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout })
    .then(() => true)
    .catch(() => false);
const registrations = (page) =>
  page.evaluate(async () => ("serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).map((r) => r.active?.scriptURL ?? r.installing?.scriptURL ?? "?") : []));
const cacheDump = (page) =>
  page.evaluate(async () => {
    const o = {};
    if (!("caches" in window)) return o;
    for (const n of await caches.keys()) o[n] = (await (await caches.open(n)).keys()).map((r) => r.url);
    return o;
  });
const ownCaches = (dump) => Object.keys(dump).filter((k) => /^(core|pages|static|assets)-/.test(k));
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
const scrollToId = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const y = Math.round(el.getBoundingClientRect().top + scrollY);
    window.scrollTo({ top: y, behavior: "instant" });
    return y;
  }, sel);
/** the install node inside the viewport (a node below the fold does not count as "at the hero") */
const hintInView = (page, placement) =>
  page.evaluate((p) => {
    const sel = p ? `[data-install-hint="${p}"]` : "[data-install-hint]";
    return [...document.querySelectorAll(sel)].some((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    });
  }, placement);
const hintState = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-install-hint]")].map((el) => ({
      placement: el.getAttribute("data-install-hint"),
      kind: el.getAttribute("data-kind"),
      display: getComputedStyle(el).display,
      text: el.textContent?.trim().slice(0, 80),
    })),
  );
async function shoot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file }).catch(() => {});
  return file;
}
function watchConsole(page, bucket) {
  page.on("pageerror", (e) => bucket.errors.push(String(e).slice(0, 300)));
  page.on("console", (m) => {
    if (m.type() === "error") bucket.console.push(m.text().slice(0, 300));
    if (m.type() === "warning") bucket.warnings.push(m.text().slice(0, 300));
  });
}
/** forced standalone for JS (matchMedia + navigator.standalone). CSS is rewritten separately (section K). */
function forceStandaloneJs() {
  const orig = window.matchMedia.bind(window);
  window.matchMedia = (q) => {
    if (!/display-mode:\s*standalone/.test(q)) return orig(q);
    const r = orig(q.replace(/\(\s*display-mode:\s*standalone\s*\)/g, "(min-width: 0px)"));
    return new Proxy(r, { get: (t, k) => (k === "media" ? q : typeof t[k] === "function" ? t[k].bind(t) : t[k]) });
  };
  Object.defineProperty(Navigator.prototype, "standalone", { get: () => true, configurable: true });
}

// ---------------------------------------------------------------- servers and builds
const children = new Set();
function portOpen(port) {
  return new Promise((resolve) => {
    const s = net.connect(port, "127.0.0.1");
    s.once("connect", () => (s.destroy(), resolve(true)));
    s.once("error", () => resolve(false));
  });
}
function nextBuild(label, env) {
  console.log(`\n>> next build (${label})`);
  const t0 = Date.now();
  const clean = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
  delete clean.NEXT_DEPLOYMENT_ID;
  delete clean.NEXT_PUBLIC_SW;
  const r = spawnSync(process.execPath, [NEXT_BIN, "build"], { cwd: ROOT, env: { ...clean, ...env }, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
  const log = (r.stdout ?? "") + (r.stderr ?? "");
  fs.writeFileSync(path.join(OUT, `build-${label}.txt`), log);
  if (r.status !== 0) throw new Error(`next build (${label}) failed (exit ${r.status}); see ${path.join(OUT, `build-${label}.txt`)}`);
  console.log(`   built in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return log;
}
let server = null;
async function startServer(env = {}) {
  if (await portOpen(PORT)) throw new Error(`port ${PORT} is already in use: stop that server first (this probe never kills servers it didn't start)`);
  const clean = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
  delete clean.NEXT_DEPLOYMENT_ID;
  delete clean.NEXT_PUBLIC_SW;
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT)], { cwd: ROOT, env: { ...clean, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.add(child);
  child.on("exit", () => children.delete(child));
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stderr.on("data", (d) => (out += d));
  for (let i = 0; i < 150; i++) {
    try {
      const r = await fetch(`${BASE}/`);
      if (r.ok) {
        server = child;
        return child;
      }
    } catch {}
    if (child.exitCode !== null) break;
    await sleep(200);
  }
  throw new Error(`next start -p ${PORT} did not come up:\n${out.slice(-2000)}`);
}
async function stopServer() {
  if (!server) return;
  const child = server;
  server = null;
  child.kill("SIGTERM");
  for (let i = 0; i < 50 && (await portOpen(PORT)); i++) await sleep(100);
  if (await portOpen(PORT)) child.kill("SIGKILL");
  for (let i = 0; i < 30 && (await portOpen(PORT)); i++) await sleep(100);
}
function cleanupSync() {
  restoreSw();
  for (const c of children) {
    try {
      c.kill("SIGKILL");
    } catch {}
  }
}
process.on("exit", cleanupSync);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => (cleanupSync(), process.exit(130)));

/** route table of `next build` (ANSI stripped) → { "/manifest.webmanifest": "○", ... } */
function routeSymbols(log) {
  const plain = log.replace(/\x1b\[[0-9;]*m/g, "");
  const out = {};
  for (const m of plain.matchAll(/^[\s│├└┌─]*([○●ƒλ◐])\s+(\/\S*)/gm)) out[m[2]] = m[1];
  return out;
}
/** first-load JS for / from the prerendered HTML (same method as step0/build.mjs) */
function firstLoadJs() {
  const html = fs.readFileSync(path.join(ROOT, ".next", "server", "app", "index.html"), "utf8");
  const srcs = new Set(
    [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g), ...html.matchAll(/<link[^>]*rel="preload"[^>]*as="script"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*as="script"/g)]
      .map((m) => m[1] ?? m[2])
      .filter((s) => s && s.startsWith("/_next/static/")),
  );
  let gz = 0;
  for (const s of srcs) gz += zlib.gzipSync(fs.readFileSync(path.join(ROOT, ".next", s.replace(/^\/_next\//, "").split("?")[0]))).length;
  return { chunks: srcs.size, gz };
}

// ---------------------------------------------------------------- browsers
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "pwa-probe-"));
let android = null; // persistent Chromium, Pixel 7 (installability needs a non-incognito profile)
let androidPage = null;
const androidLog = { errors: [], console: [], warnings: [] };
async function androidCtx() {
  if (android) return android;
  android = await chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless: !HEADED,
    ...devices["Pixel 7"],
    args: ["--bypass-app-banner-engagement-checks", ...GPU],
  });
  androidPage = android.pages()[0] ?? (await android.newPage());
  watchConsole(androidPage, androidLog);
  return android;
}
let chromeBrowser = null;
const chrome = async () => (chromeBrowser ??= await chromium.launch({ channel: "chrome", headless: !HEADED, args: ["--bypass-app-banner-engagement-checks", ...GPU] }));
let webkitBrowser = null;
const wk = async () => (webkitBrowser ??= await webkit.launch({ headless: !HEADED }));

// ================================================================= sections
async function secA() {
  await androidCtx();
  const page = androidPage;
  for (const route of ["/", "/projects/glassbox"]) {
    const bucket = { errors: [], console: [], warnings: [] };
    const listener = (m) => m.type() === "warning" && bucket.warnings.push(m.text());
    page.on("console", listener);
    await page.goto(BASE + route, { waitUntil: "load" });
    await sleep(800);
    page.off("console", listener);
    const h = await page.evaluate(() => {
      const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.getAttribute("content") ?? null;
      return {
        manifest: document.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? null,
        viewport: meta("viewport"),
        theme: meta("theme-color"),
        appleCapable: meta("apple-mobile-web-app-capable"),
        mobileCapable: meta("mobile-web-app-capable"),
        statusBar: meta("apple-mobile-web-app-status-bar-style"),
        title: meta("apple-mobile-web-app-title"),
        format: meta("format-detection"),
        appleIcon: [...document.querySelectorAll('link[rel="apple-touch-icon"]')].map((l) => ({ sizes: l.getAttribute("sizes"), href: l.getAttribute("href") })),
        startup: [...document.querySelectorAll('link[rel="apple-touch-startup-image"]')].map((l) => ({ href: l.getAttribute("href"), media: l.getAttribute("media") })),
        // Next puts its own hidden metadata outlet first; the boot script must precede every app node (the skip link)
        bootFirst: (() => {
          const kids = [...document.body.children].filter((el) => !(el.tagName === "DIV" && el.hidden));
          return kids[0]?.tagName === "SCRIPT" && /beforeinstallprompt/.test(kids[0].textContent ?? "") && kids[1]?.classList.contains("skip-link");
        })(),
      };
    });
    const r = route;
    check("A", `${r}: <link rel=manifest href=/manifest.webmanifest>`, h.manifest?.startsWith("/manifest.webmanifest"), h.manifest);
    check("A", `${r}: viewport has viewport-fit=cover`, /viewport-fit=cover/.test(h.viewport ?? ""), h.viewport);
    check("A", `${r}: viewport has no maximum-scale / user-scalable`, !/maximum-scale|user-scalable/.test(h.viewport ?? ""), h.viewport);
    check("A", `${r}: theme-color #0a0b10`, h.theme === "#0a0b10", h.theme);
    check("A", `${r}: apple-mobile-web-app-capable=yes`, h.appleCapable === "yes", h.appleCapable);
    check("A", `${r}: mobile-web-app-capable=yes`, h.mobileCapable === "yes", h.mobileCapable);
    check("A", `${r}: status-bar-style black`, h.statusBar === "black", h.statusBar);
    check("A", `${r}: apple-mobile-web-app-title Akanov`, h.title === "Akanov", h.title);
    check("A", `${r}: apple-touch-icon 180x180`, h.appleIcon.some((l) => l.sizes === "180x180" && /apple-icon/.test(l.href ?? "")), h.appleIcon);
    check("A", `${r}: ${SPLASH_COUNT} startup images, each with media`, h.startup.length === SPLASH_COUNT && h.startup.every((s) => /device-width/.test(s.media ?? "") && /orientation: portrait/.test(s.media ?? "")), h.startup.length);
    check("A", `${r}: format-detection telephone=no`, /telephone=no/.test(h.format ?? ""), h.format);
    check("A", `${r}: the PWA_BOOT script is <body>'s first app child (before the skip link)`, h.bootFirst);
    check("A", `${r}: no apple-mobile-web-app-capable deprecation warning`, !bucket.warnings.some((w) => /apple-mobile-web-app-capable.*deprecat/i.test(w)), bucket.warnings.filter((w) => /apple/i.test(w)));
  }
}

async function secB() {
  await androidCtx();
  const page = androidPage;
  if (!page.url().startsWith(BASE)) await page.goto(BASE + "/", { waitUntil: "load" });
  const res = await page.request.get(BASE + "/manifest.webmanifest");
  check("B", "GET /manifest.webmanifest → 200", res.status() === 200, res.status());
  check("B", "content-type application/manifest+json", /application\/manifest\+json/.test(res.headers()["content-type"] ?? ""), res.headers()["content-type"]);
  const m = await res.json();
  report.manifest = m;
  check("B", "id / start_url / scope = '/'", m.id === "/" && m.start_url === "/" && m.scope === "/", { id: m.id, start_url: m.start_url, scope: m.scope });
  check("B", "display standalone", m.display === "standalone", m.display);
  check("B", "short_name Akanov, name + description set", m.short_name === "Akanov" && !!m.name && !!m.description, { short_name: m.short_name, name: m.name });
  check("B", "background_color and theme_color #0a0b10", m.background_color === "#0a0b10" && m.theme_color === "#0a0b10", [m.background_color, m.theme_color]);
  check("B", "no shortcuts, no orientation", !m.shortcuts && !m.orientation, { shortcuts: !!m.shortcuts, orientation: m.orientation });
  const icons = m.icons ?? [];
  for (const s of ["192x192", "512x512"])
    for (const p of ["any", "maskable"]) check("B", `icon ${s} ${p}`, icons.some((i) => i.sizes === s && i.purpose === p), icons.map((i) => `${i.sizes}/${i.purpose}`));

  // every image URL: status, type, decoded size
  const html = await (await page.request.get(BASE + "/")).text();
  const appleHref = /<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*rel="apple-touch-icon"/.exec(html);
  const splash = [...html.matchAll(/<link[^>]*rel="apple-touch-startup-image"[^>]*>/g)].map((t) => /href="([^"]+)"/.exec(t[0])?.[1]).filter(Boolean);
  const imgs = [
    ...icons.map((i) => ({ src: i.src, sizes: i.sizes, kind: i.purpose })),
    ...(m.screenshots ?? []).map((s) => ({ src: s.src, sizes: s.sizes, kind: "screenshot", form: s.form_factor })),
    { src: (appleHref?.[1] ?? appleHref?.[2] ?? "/apple-icon.png").replace(/&amp;/g, "&"), sizes: "180x180", kind: "apple" },
    ...splash.map((src) => ({ src, sizes: /(\d+)x(\d+)\.png/.exec(src)?.slice(1).join("x"), kind: "splash" })),
  ];
  for (const img of imgs) {
    const r = await page.request.get(new URL(img.src, BASE).href);
    const type = r.headers()["content-type"] ?? "";
    const okType = r.status() === 200 && /image\/(png|jpeg)/.test(type);
    if (!okType) {
      check("B", `${img.src}: 200 image/png|jpeg`, false, `${r.status()} ${type}`);
      continue;
    }
    const decoded = await page.evaluate(async (u) => {
      try {
        const b = await createImageBitmap(await (await fetch(u)).blob());
        return `${b.width}x${b.height}`;
      } catch (e) {
        return `decode failed: ${e}`;
      }
    }, img.src);
    check("B", `${img.src}: decodes to ${img.sizes}`, decoded === img.sizes, decoded);
    if (/png/.test(type) && img.kind !== "screenshot") {
      const png = PNG.sync.read(await r.body());
      let minA = 255;
      for (let i = 3; i < png.data.length; i += 4) minA = Math.min(minA, png.data[i]);
      if (img.kind === "any") {
        const a = (x, y) => png.data[(y * png.width + x) * 4 + 3];
        check("B", `${img.src}: transparent corners`, [a(0, 0), a(png.width - 1, 0), a(0, png.height - 1), a(png.width - 1, png.height - 1)].every((v) => v === 0));
      } else {
        check("B", `${img.src}: fully opaque`, minA === 255, minA);
      }
      if (img.kind === "maskable") {
        const S = png.width, c = (S - 1) / 2, rr = 0.4 * S;
        let outside = 0;
        for (let y = 0; y < S; y++)
          for (let x = 0; x < S; x++) {
            const i = (y * S + x) * 4;
            const isVoid = Math.abs(png.data[i] - VOID[0]) <= 1 && Math.abs(png.data[i + 1] - VOID[1]) <= 1 && Math.abs(png.data[i + 2] - VOID[2]) <= 1;
            if (!isVoid && Math.hypot(x - c, y - c) > rr) outside++;
          }
        check("B", `${img.src}: every non-void px inside r = 0.4·S`, outside === 0, outside);
      }
    }
  }
  const shots = m.screenshots ?? [];
  check("B", "screenshots: 2 narrow + 1 wide", shots.filter((s) => s.form_factor === "narrow").length === 2 && shots.filter((s) => s.form_factor === "wide").length === 1, shots.map((s) => s.form_factor));
  const ratios = {};
  for (const s of shots) {
    const [w, h] = (s.sizes ?? "0x0").split("x").map(Number);
    check("B", `${s.src}: sides in 320..3840, long/short ≤ 2.3`, Math.min(w, h) >= 320 && Math.max(w, h) <= 3840 && Math.max(w, h) / Math.min(w, h) <= 2.3, s.sizes);
    (ratios[s.form_factor] ??= new Set()).add((w / h).toFixed(4));
  }
  check("B", "one aspect ratio per form_factor", Object.values(ratios).every((r) => r.size === 1), Object.fromEntries(Object.entries(ratios).map(([k, v]) => [k, [...v]])));
}

async function secC() {
  await androidCtx();
  const page = androidPage;
  await page.goto(BASE + "/", { waitUntil: "load" });
  await sleep(1500);
  const cdp = await android.newCDPSession(page);
  const errors = (await cdp.send("Page.getInstallabilityErrors")).installabilityErrors;
  const manifest = await cdp.send("Page.getAppManifest");
  const appId = await cdp.send("Page.getAppId");
  await cdp.detach();
  check("C", "Page.getInstallabilityErrors → []", errors.length === 0, errors);
  check("C", "Page.getAppManifest errors → []", (manifest.errors ?? []).length === 0, manifest.errors);
  check("C", "Page.getAppId: recommended id '/'", appId.recommendedId === "/" || new URL(appId.appId ?? "x:/").pathname === "/", appId);
}

async function secD() {
  // ---- Android (persistent Chromium, Pixel 7 412x839): prompt captured, offer only at contact + in the sheet
  await androidCtx();
  const page = androidPage;
  await page.evaluate(() => {
    try {
      localStorage.removeItem("pwa.install.dismissed");
    } catch {}
  });
  await page.goto(BASE + "/", { waitUntil: "load" });
  const prompted = await page
    .waitForFunction(() => !!window.__pwaPrompt, null, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  check("D", "android: beforeinstallprompt captured into window.__pwaPrompt", prompted);
  await sleep(600);
  check("D", "android: no install offer in view at the hero", !(await hintInView(page)), await hintState(page));
  await shoot(page, "D-android-hero");
  const contactY = await scrollToId(page, "#contact");
  await sleep(1500);
  check("D", "android: [ Install app ] visible at #contact", contactY != null && (await hintInView(page, "contact")), await hintState(page));
  await shoot(page, "D-android-contact");
  const menu = await page.$("[data-phone-menu]");
  if (menu) {
    await menu.click();
    await sleep(700);
    check("D", "android: the offer is in the Index sheet", await page.evaluate(() => !!document.querySelector('dialog[open] [data-install-hint="sheet"][data-kind="android"]')), await hintState(page));
    check("D", "android: one offer on screen at a time (sheet is modal)", await page.evaluate(() => !!document.querySelector("dialog[open]")));
    await shoot(page, "D-android-sheet");
    await page.keyboard.press("Escape");
    await sleep(500);
  } else note("D", "no [data-phone-menu] (Lane B): sheet placement not checked");
  // install click consumes the prompt (don't await userChoice headless)
  const btn = page.locator('[data-install-hint="contact"][data-kind="android"] button').first();
  if (await btn.count()) {
    await btn.click({ timeout: 5000 }).catch(() => {});
    await sleep(500);
    check("D", "android: clicking Install consumes __pwaPrompt", await page.evaluate(() => window.__pwaPrompt === null));
    check("D", "android: the offer hides once the prompt is used", !(await hintInView(page, "contact")), await hintState(page));
  } else check("D", "android: install button found at contact", false, await hintState(page));

  // ---- Not now (30-day quiet) and reduced motion, with a stand-in prompt: Chrome's own event is not repeatable
  const fakePrompt = () => {
    // dispatched after PWA_BOOT's listener exists (it runs during parse), exactly like Chrome's event
    addEventListener("DOMContentLoaded", () => {
      const e = new Event("beforeinstallprompt");
      e.prompt = async () => {};
      e.userChoice = new Promise(() => {});
      dispatchEvent(e);
    });
  };
  {
    const b = await chrome();
    const ctx = await b.newContext({ ...devices["Pixel 7"] });
    await ctx.addInitScript(fakePrompt);
    const p = await ctx.newPage();
    const open = async () => {
      await p.goto(BASE + "/", { waitUntil: "load" });
      await sleep(1500);
      await scrollToId(p, "#contact");
      await sleep(1200);
    };
    await open();
    const notNow = p.locator('[data-install-hint="contact"] [data-pwa-quiet]').first();
    if (await notNow.count()) {
      await notNow.click({ timeout: 5000 }).catch(() => {});
      await sleep(400);
      const stamp = await p.evaluate(() => Number(localStorage.getItem("pwa.install.dismissed")));
      check("D", "Not now: stores pwa.install.dismissed", Math.abs(Date.now() - stamp) < 60000, stamp);
      check("D", "Not now: the offer hides at once", (await hintState(p)).length === 0, await hintState(p));
      await open();
      check("D", "Not now: no offer after a reload (30-day quiet)", (await hintState(p)).length === 0, await hintState(p));
      await p.evaluate(() => localStorage.setItem("pwa.install.dismissed", String(Date.now() - 31 * 864e5)));
      await open();
      check("D", "Not now: the offer returns after 30 days", (await hintState(p)).some((h) => h.kind === "android"), await hintState(p));
    } else check("D", "Not now button found at contact (stand-in prompt)", false, await hintState(p));
    await ctx.close();
  }

  // ---- reduced motion: the offer never animates
  {
    const b = await chrome();
    const ctx = await b.newContext({ ...devices["Pixel 7"], reducedMotion: "reduce" });
    await ctx.addInitScript(fakePrompt);
    const p = await ctx.newPage();
    await p.goto(BASE + "/", { waitUntil: "load" });
    await sleep(1500);
    await scrollToId(p, "#contact");
    await sleep(1200);
    const anims = await p.evaluate(() => [...document.querySelectorAll("[data-install-hint], [data-install-hint] *")].flatMap((el) => el.getAnimations().map((a) => a.animationName ?? "anim")));
    const shown = (await hintState(p)).length > 0;
    check("D", "reduced motion: the offer renders with no animation", shown && anims.length === 0, { shown, anims });
    await ctx.close();
  }

  // ---- iPhone (WebKit): instructions at contact on 393x852; on the SE only in the sheet
  for (const [label, vp, dpr, contactWanted] of [
    ["iphone-393x852", { width: 393, height: 852 }, 3, true],
    ["iphone-se-375x667", { width: 375, height: 667 }, 2, false],
  ]) {
    const b = await wk();
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent });
    const p = await ctx.newPage();
    await p.goto(BASE + "/", { waitUntil: "load" });
    await sleep(1500);
    const gate = await p.evaluate((q) => matchMedia(q).matches, PHONE_MQ);
    if (!gate) {
      check("D", `${label} (WebKit): PHONE_MQ matches (pointer: coarse) under touch emulation`, false, gate);
      await ctx.close();
      continue;
    }
    check("D", `${label}: no offer in view at the hero`, !(await hintInView(p)), await hintState(p));
    await scrollToId(p, "#contact");
    await sleep(1500);
    const st = await hintState(p);
    const inView = await hintInView(p, "contact");
    if (contactWanted) check("D", `${label}: iOS instructions visible at contact`, inView && st.some((h) => h.placement === "contact" && h.kind === "ios"), st);
    else check("D", `${label}: contact offer hidden (< 700 px tall)`, !inView && st.every((h) => h.placement !== "contact" || h.display === "none"), st);
    await shoot(p, `D-${label}-contact`);
    const m2 = await p.$("[data-phone-menu]");
    if (m2) {
      await m2.click();
      await sleep(800);
      check("D", `${label}: iOS instructions in the Index sheet`, await p.evaluate(() => !!document.querySelector('dialog[open] [data-install-hint="sheet"][data-kind="ios"]')), await hintState(p));
      await shoot(p, `D-${label}-sheet`);
    }
    await ctx.close();
  }

  // ---- forced standalone: Share replaces Install
  {
    const b = await chrome();
    const ctx = await b.newContext({ ...devices["Pixel 7"] });
    await ctx.addInitScript(forceStandaloneJs);
    const p = await ctx.newPage();
    await p.goto(BASE + "/", { waitUntil: "load" });
    await sleep(1500);
    await scrollToId(p, "#contact");
    await sleep(1200);
    const st = await hintState(p);
    const hasShare = await p.evaluate(() => typeof navigator.share === "function");
    check("D", "standalone: no install offer", !st.some((h) => h.kind === "android" || h.kind === "ios"), st);
    if (hasShare) check("D", "standalone: [ Share ] offered", st.some((h) => h.kind === "share"), st);
    else note("D", "standalone: navigator.share missing in this Chromium, so no [ Share ] (correct: it renders null)");
    await ctx.close();
  }

  // ---- desktop 1440 and iPad 820x1180: no install node, no prompt capture
  for (const [label, opts] of [
    ["desktop-1440x900", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ["ipad-820x1180", { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    const b = await chrome();
    const ctx = await b.newContext(opts);
    const p = await ctx.newPage();
    await p.goto(BASE + "/", { waitUntil: "load" });
    await sleep(2500);
    await scrollToId(p, "#contact");
    await sleep(1000);
    const r = await p.evaluate(() => ({ prompt: typeof window.__pwaPrompt, nodes: document.querySelectorAll("[data-install-hint]").length }));
    check("D", `${label}: typeof __pwaPrompt === 'undefined'`, r.prompt === "undefined", r.prompt);
    check("D", `${label}: no install node`, r.nodes === 0, r.nodes);
    await ctx.close();
  }
}

async function secE() {
  await androidCtx();
  const page = androidPage;
  // a fresh origin (A–D may have registered already): the first visit must be uncontrolled, so warm is exercised
  await page.goto(BASE + "/offline.html", { waitUntil: "load" });
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.goto("about:blank");
  await page.goto(BASE + "/", { waitUntil: "load" });
  const firstUncontrolled = await page.evaluate(() => !navigator.serviceWorker.controller);
  if (!firstUncontrolled) note("E", "the first load was already controlled (an old worker lingered): warm is not isolated");
  const controlled = await waitControlled(page, 25000);
  check("E", "first visit: the worker controls the page (clients.claim)", controlled);
  if (!controlled) return;
  const reg = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return { script: r?.active?.scriptURL ?? null, preload: (await r?.navigationPreload?.getState())?.enabled ?? null, scope: r?.scope };
  });
  check("E", "registration: /sw.js at scope /", reg.script?.endsWith("/sw.js") && reg.scope === `${BASE}/`, reg);
  check("E", "navigation preload enabled", reg.preload === true, reg.preload);
  // warm: everything the page loaded before control is in static-<VERSION>
  let warm = null;
  for (let i = 0; i < 20; i++) {
    warm = await page.evaluate(async (v) => {
      const wantUrls = performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((u) => {
          const x = new URL(u);
          return x.origin === location.origin && x.pathname.startsWith("/_next/static/");
        });
      const have = new Set((await (await caches.open(`static-${v}`)).keys()).map((r) => r.url));
      return { want: wantUrls.length, missing: wantUrls.filter((u) => !have.has(u)) };
    }, V);
    if (!warm.missing.length) break;
    await sleep(250);
  }
  check("E", `warm: every same-origin /_next/static URL the page loaded is in static-${V}`, warm.want > 0 && warm.missing.length === 0, warm);
  const dpl = await page.evaluate(() => document.documentElement.dataset.dplId ?? null);
  if (dpl) {
    const dump = await cacheDump(page);
    check("E", `static-${V} keys carry ?dpl=${dpl}`, (dump[`static-${V}`] ?? []).some((u) => u.includes(`dpl=${dpl}`)), (dump[`static-${V}`] ?? []).slice(0, 3));
  }
  // reload through the worker
  const r = await page.reload({ waitUntil: "load" });
  check("E", "reload: response.fromServiceWorker()", r?.fromServiceWorker() === true, r?.fromServiceWorker());
  check("E", "reload: navigation timing workerStart > 0", await page.evaluate(() => performance.getEntriesByType("navigation")[0].workerStart > 0));
  await safeTap(page);
  const ready = await waitReady(page, 30000);
  check("E", "the world mounts (world-ready)", ready);
  await sleep(1500);
  const dump = await cacheDump(page);
  const has = (name, re) => (dump[name] ?? []).some((u) => re.test(u));
  check("E", `core-${V} holds /offline.html`, has(`core-${V}`, /\/offline\.html$/), dump[`core-${V}`]);
  check("E", `pages-${V} holds /`, (dump[`pages-${V}`] ?? []).includes(`${BASE}/`), dump[`pages-${V}`]);
  check("E", `assets-${V} holds kit.glb + devices.glb`, has(`assets-${V}`, /\/models\/kit\.glb$/) && has(`assets-${V}`, /\/models\/devices\.glb$/), dump[`assets-${V}`]);
  check("E", `assets-${V} holds the Draco decoder (wrapper + wasm)`, has(`assets-${V}`, /\/draco\/draco_wasm_wrapper\.js$/) && has(`assets-${V}`, /\/draco\/draco_decoder\.wasm$/), dump[`assets-${V}`]);
  check("E", "only own caches exist", ownCaches(dump).length === Object.keys(dump).length, Object.keys(dump));
  // RSC is never cached
  const rsc = await page.evaluate(async () => {
    const res = await fetch("/projects/glassbox?_rsc=probe", { headers: { rsc: "1" } });
    return res.status;
  });
  await sleep(500);
  const after = await cacheDump(page);
  const rscCached = Object.values(after).flat().filter((u) => /_rsc=/.test(u));
  check("E", "RSC fetch works online", rsc === 200, rsc);
  check("E", "no RSC payload in any cache", rscCached.length === 0, rscCached);
  report.caches = Object.fromEntries(Object.entries(after).map(([k, v]) => [k, v.length]));
  // network-first assets: an unchanged file (a revalidation) is not written into assets-* again on the next load
  const stamps = () =>
    page.evaluate(async (v) => {
      const c = await caches.open(`assets-${v}`);
      const o = {};
      for (const k of await c.keys()) o[new URL(k.url).pathname] = (await c.match(k))?.headers.get("date") ?? null;
      return o;
    }, V);
  const s0 = await stamps();
  await sleep(1200); // a rewrite would carry a later Date
  await page.reload({ waitUntil: "load" });
  await safeTap(page);
  await waitReady(page, 30000);
  await sleep(2500);
  const s1 = await stamps();
  const rewritten = Object.keys(s0).filter((k) => s1[k] !== s0[k]);
  check("E", "reload + world mount: unchanged models / decoder are not rewritten into the cache", Object.keys(s0).length > 0 && rewritten.length === 0, { rewritten, s0, s1 });
}

async function secF() {
  await androidCtx();
  const page = androidPage;
  if (!(await page.evaluate(() => !!navigator.serviceWorker?.controller).catch(() => false))) {
    await page.goto(BASE + "/", { waitUntil: "load" });
    if (!(await waitControlled(page))) return check("F", "precondition: a controlling worker", false);
  }
  await page.goto(BASE + "/projects/glassbox", { waitUntil: "load" });
  await sleep(800);
  await page.goto(BASE + "/", { waitUntil: "load" });
  await waitReady(page, 20000);
  await sleep(800);
  // the installed app's journey: start_url '/', then every project through a <Link> (RSC, never intercepted)
  const LINKED = "/projects/bariweb";
  const linkedOk = await page.evaluate((href) => {
    const a = [...document.querySelectorAll(`a[href="${href}"]`)].find((x) => x.getAttribute("aria-hidden") !== "true");
    a?.click();
    return !!a;
  }, LINKED);
  if (linkedOk) {
    await page.waitForURL((u) => u.pathname === LINKED, { timeout: 10000 }).catch(() => {});
    const t0 = Date.now();
    while (Date.now() - t0 < 10000 && !((await cacheDump(page))[`pages-${V}`] ?? []).includes(BASE + LINKED)) await sleep(250);
    check("F", `a page opened through a <Link> (${LINKED}) is stored in pages-${V}`, ((await cacheDump(page))[`pages-${V}`] ?? []).includes(BASE + LINKED), (await cacheDump(page))[`pages-${V}`]);
    await page.goto(BASE + "/", { waitUntil: "load" });
    await waitReady(page, 20000);
    await sleep(500);
  } else check("F", `a <Link> to ${LINKED} on the home page`, false);
  const pagesBefore = (await cacheDump(page))[`pages-${V}`] ?? [];
  const errs = [];
  const onErr = (e) => errs.push(String(e).slice(0, 200));
  page.on("pageerror", onErr);
  await android.setOffline(true);
  try {
    const home = await page.goto(BASE + "/", { waitUntil: "load" });
    check("F", "offline /: 200 from the worker", home?.status() === 200 && home?.fromServiceWorker(), [home?.status(), home?.fromServiceWorker()]);
    check("F", "offline /: the H1 reads Nazar Akanov", /Nazar\s*Akanov/.test((await page.textContent("h1").catch(() => "")) ?? ""));
    await safeTap(page);
    check("F", "offline: the world mounts from cached chunks + GLBs", await waitReady(page, 25000));
    await shoot(page, "F-offline-home");
    const visited = await page.goto(BASE + "/projects/glassbox", { waitUntil: "load" });
    const h1v = (await page.textContent("h1").catch(() => "")) ?? "";
    check("F", "offline: a visited project page comes from the cache", visited?.status() === 200 && h1v && !/offline/i.test(h1v), h1v);
    if (linkedOk) {
      const linked = await page.goto(BASE + LINKED, { waitUntil: "load" });
      const h1l = (await page.textContent("h1").catch(() => "")) ?? "";
      check("F", "offline: a project opened through a <Link> comes from the cache", linked?.status() === 200 && linked?.fromServiceWorker() && h1l && !/offline/i.test(h1l), h1l);
    }
    const unvisitedPath = ["/projects/niscourses", "/projects/bariweb"].find((p) => !pagesBefore.includes(BASE + p)) ?? "/pwa-probe-unvisited";
    await page.goto(BASE + unvisitedPath, { waitUntil: "load" });
    check("F", `offline: unvisited ${unvisitedPath} gets offline.html`, /You're offline/.test((await page.textContent("h1").catch(() => "")) ?? ""));
    await shoot(page, "F-offline-unvisited");
    // soft navigation: prefetched client cache, or Next's RSC failure → a hard navigation into the worker
    await page.goto(BASE + "/", { waitUntil: "load" });
    await sleep(800);
    const link = await page.$('a[href^="/projects/"]:not([aria-hidden="true"])');
    if (link) {
      await link.evaluate((a) => a.click());
      await sleep(3000);
      const h = (await page.textContent("h1").catch(() => "")) ?? "";
      check("F", "offline soft navigation: a real page or offline.html, never blank", h.trim().length > 0, { url: page.url(), h1: h });
    }
    // back online: offline.html reloads itself into the real page
    await page.goto(BASE + unvisitedPath, { waitUntil: "load" });
  } finally {
    await android.setOffline(false);
  }
  if (!/pwa-probe-unvisited/.test(page.url())) {
    await page.waitForFunction(() => !/You're offline/.test(document.querySelector("h1")?.textContent ?? ""), null, { timeout: 10000 }).catch(() => {});
    check("F", "online again: offline.html's listener reloads into the real page", !/You're offline/.test((await page.textContent("h1").catch(() => "")) ?? ""));
  }
  page.off("pageerror", onErr);
  check("F", "no pageerror while offline", errs.length === 0, errs);
}

// A lazy phone chunk the worker never stored (chunk URLs are per deploy; the assets cache is not): offline, the
// Index sheet's chunk and the world's own chunk are missing, the models are cached. Menu (it carries the offline
// dot) must not take the route down, the world keeps its poster without logging, and 'online' mounts it.
async function secF2() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pwa-probe-f2-"));
  const ctx = await chromium.launchPersistentContext(dir, { channel: "chrome", headless: !HEADED, ...devices["Pixel 7"], args: GPU });
  try {
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    await page.goto(BASE + "/", { waitUntil: "load" });
    if (!(await waitControlled(page))) return check("F", "precondition (lost chunk): a controlling worker", false);
    await safeTap(page);
    await waitReady(page, 20000);
    await sleep(4000);
    const removed = await page.evaluate(async () => {
      const out = [];
      for (const n of await caches.keys()) {
        if (!n.startsWith("static-")) continue;
        const c = await caches.open(n);
        for (const req of await c.keys()) {
          const t = await (await c.match(req)).clone().text();
          if (t.includes("index-sheet-title") || t.includes("WebGLRenderer")) {
            out.push(new URL(req.url).pathname);
            await c.delete(req);
          }
        }
      }
      return { out, models: !!(await caches.match("/models/kit.glb")) };
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.clearBrowserCache");
    await page.close();
    await ctx.setOffline(true);
    const p = await ctx.newPage();
    const errs = [];
    const cons = [];
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    p.on("console", (m) => m.type() === "error" && !/^Failed to load resource/.test(m.text()) && cons.push(m.text().slice(0, 200)));
    await p.goto(BASE + "/", { waitUntil: "load" });
    await sleep(7000);
    const menu = p.locator("[data-phone-dock] [data-phone-menu]").first();
    const hasMenu = (await menu.count()) > 0;
    if (hasMenu) await menu.tap().catch(() => {});
    await sleep(2500);
    const s = await p.evaluate(() => ({
      h1: document.querySelector("h1")?.textContent ?? "",
      errorPage: /couldn.t load|Application error|client-side exception/i.test(document.body.innerText),
      ready: document.documentElement.hasAttribute("data-world-ready"),
    }));
    await shoot(p, "F-lost-chunks-offline-menu");
    check("F", `offline, lost chunks (${removed.out.length} removed, models cached: ${removed.models}): Menu tapped, the H1 stays, no error page`, hasMenu && /Nazar\s*Akanov/.test(s.h1) && !s.errorPage, { hasMenu, ...s });
    check("F", "offline, lost chunks: no pageerror and no non-network console.error", errs.length === 0 && cons.length === 0, { errs, cons });
    check("F", "offline, lost world chunk: the poster stays (no mount)", !s.ready);
    await ctx.setOffline(false);
    check("F", "online again: the world mounts (the mount gate's retry)", await waitReady(p, 20000));
    check("F", "online again: no pageerror", errs.length === 0, errs);
  } finally {
    await ctx.close().catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function secK() {
  const b = await chrome();
  for (const [label, opts] of [
    ["iphone-390x844", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices["iPhone 13"].userAgent }],
    ["pixel-412x915", { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: devices["Pixel 7"].userAgent }],
  ]) {
    const ctx = await b.newContext(opts);
    await ctx.addInitScript(forceStandaloneJs);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const sheets = new Set();
    cdp.on("CSS.styleSheetAdded", (e) => sheets.add(e.header.styleSheetId));
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    await page.goto(BASE + "/", { waitUntil: "load" });
    await sleep(2000);
    let patched = 0;
    for (const id of sheets) {
      const { text } = await cdp.send("CSS.getStyleSheetText", { styleSheetId: id }).catch(() => ({ text: "" }));
      const next = text
        .replace(/\(\s*display-mode\s*:\s*standalone\s*\)/g, "(min-width: 0px)")
        .replace(/env\(\s*safe-area-inset-bottom\s*(,[^()]*(\([^()]*\))?[^()]*)?\)/g, "34px")
        .replace(/env\(\s*safe-area-inset-(top|left|right)\s*(,[^()]*(\([^()]*\))?[^()]*)?\)/g, "0px");
      if (next !== text) {
        await cdp.send("CSS.setStyleSheetText", { styleSheetId: id, text: next });
        patched++;
      }
    }
    check("K", `${label}: stylesheets rewritten to standalone + a 34 px bottom inset`, patched > 0, patched);
    await sleep(600);
    const dock = await page.evaluate(() => {
      const d = document.querySelector("[data-phone-dock]");
      if (!d) return null;
      const r = d.getBoundingClientRect();
      return { gap: +(innerHeight - r.bottom).toFixed(1), h: +r.height.toFixed(1), app: matchMedia("(display-mode: standalone)").matches };
    });
    if (dock) check("K", `${label}: the Dock clears the home indicator (gap 34 + 6 = 40 px)`, Math.abs(dock.gap - 40) <= 1, dock);
    else note("K", `${label}: no [data-phone-dock] yet (Lane B)`);
    await shoot(page, `K-standalone-${label}-hero`);
    await scrollToId(page, "#contact");
    await sleep(1500);
    await shoot(page, `K-standalone-${label}-contact`);
    const st = await hintState(page);
    check("K", `${label}: standalone shows no install offer`, !st.some((h) => h.kind === "android" || h.kind === "ios"), st);
    await ctx.close();
  }
}

async function secL() {
  const b = await chrome();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const bucket = { errors: [], console: [], warnings: [] };
  watchConsole(page, bucket);
  await page.goto(BASE + "/", { waitUntil: "load" });
  await sleep(7000); // past load + idle (5 s timeout): a phone would have registered by now
  const r = await page.evaluate(async () => ({
    regs: "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
    prompt: typeof window.__pwaPrompt,
    gate: document.documentElement.dataset.intro,
    dock: document.querySelectorAll("[data-phone-dock]").length,
    install: document.querySelectorAll("[data-install-hint]").length,
    nav: !!document.querySelector(".nav-pill") && getComputedStyle(document.querySelector(".nav-pill")).display !== "none",
    caches: "caches" in window ? (await caches.keys()).length : 0,
  }));
  check("L", "desktop 1440: no service worker registration", r.regs === 0, r.regs);
  check("L", "desktop 1440: no own caches", r.caches === 0, r.caches);
  check("L", "desktop 1440: typeof __pwaPrompt === 'undefined'", r.prompt === "undefined", r.prompt);
  check("L", "desktop 1440: no [data-phone-dock], no install node", r.dock === 0 && r.install === 0, r);
  check("L", "desktop 1440: NavPill visible", r.nav, r.nav);
  check("L", "desktop 1440: no pageerror / console.error", !bucket.errors.length && !bucket.console.length, [...bucket.errors, ...bucket.console]);
  await shoot(page, "L-desktop-1440");
  await ctx.close();
  note("L", "pixel regression is desktop-baseline --compare's job (npm run desktop:baseline -- <base> --compare), plus modes-probe and a11y-probe");
}

async function secG(wkCtx) {
  // origin down: the only reliable way to take WebKit offline (setOffline + SW navigations crash it)
  await stopServer();
  check("G", "origin is down", !(await portOpen(PORT)));
  const page = androidPage;
  const pages = (await cacheDump(page))[`pages-${V}`] ?? [];
  const unvisited = ["/projects/niscourses", "/projects/bariweb"].find((p) => !pages.includes(BASE + p)) ?? "/pwa-probe-unvisited";
  const home = await page.goto(BASE + "/", { waitUntil: "load" }).catch((e) => ({ err: String(e) }));
  check("G", "chromium: / from the cache", !home.err && /Nazar\s*Akanov/.test((await page.textContent("h1").catch(() => "")) ?? ""), home.err);
  const vis = await page.goto(BASE + "/projects/glassbox", { waitUntil: "load" }).catch((e) => ({ err: String(e) }));
  const h1v = (await page.textContent("h1").catch(() => "")) ?? "";
  check("G", "chromium: visited project page from the cache", !vis.err && h1v && !/offline/i.test(h1v), vis.err ?? h1v);
  await page.goto(BASE + unvisited, { waitUntil: "load" }).catch(() => {});
  check("G", `chromium: unvisited ${unvisited} → offline.html`, /You're offline/.test((await page.textContent("h1").catch(() => "")) ?? ""));
  if (!wkCtx) return note("G", "WebKit context not prepared (no worker there): WebKit offline not checked");
  const p = wkCtx.pages()[0];
  const wh = await p.goto(BASE + "/", { waitUntil: "load" }).catch((e) => ({ err: String(e) }));
  check("G", "webkit: / from the cache", !wh.err && /Nazar\s*Akanov/.test((await p.textContent("h1").catch(() => "")) ?? ""), wh.err);
  const wv = await p.goto(BASE + "/projects/glassbox", { waitUntil: "load" }).catch((e) => ({ err: String(e) }));
  const wh1 = (await p.textContent("h1").catch(() => "")) ?? "";
  check("G", "webkit: visited project page from the cache", !wv.err && wh1 && !/offline/i.test(wh1), wv.err ?? wh1);
  await p.goto(BASE + unvisited, { waitUntil: "load" }).catch(() => {});
  check("G", `webkit: unvisited ${unvisited} → offline.html`, /You're offline/.test((await p.textContent("h1").catch(() => "")) ?? ""));
  await shoot(p, "G-webkit-offline-unvisited");
}

async function prepareWebkitForG() {
  const b = await wk();
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "load" });
  const gate = await p.evaluate((q) => matchMedia(q).matches, PHONE_MQ);
  if (!gate) {
    note("G", "WebKit touch emulation does not match PHONE_MQ: no worker registers there");
    await ctx.close();
    return null;
  }
  const ok = await waitControlled(p, 25000);
  check("G", "webkit (iPhone 13): the worker controls the page", ok);
  if (!ok) {
    await ctx.close();
    return null;
  }
  await p.reload({ waitUntil: "load" });
  await p.goto(BASE + "/projects/glassbox", { waitUntil: "load" });
  await sleep(800);
  return ctx;
}

/** the document's deployment: html[data-dpl-id] when Next writes it (dynamic renders), else the ?dpl= that every
 *  /_next script of a static prerendered page carries (Next 16 omits the attribute there) */
const dplOf = (page) =>
  page.evaluate(
    () =>
      document.documentElement.dataset.dplId ??
      [...document.querySelectorAll('script[src^="/_next/"]')].map((x) => /[?&]dpl=([^&]+)/.exec(x.getAttribute("src") ?? "")?.[1]).find(Boolean) ??
      null,
  );

async function secH(tabA) {
  nextBuild("B", { NEXT_DEPLOYMENT_ID: "B" });
  await startServer({ NEXT_DEPLOYMENT_ID: "B" });
  const page = androidPage;
  await page.goto(BASE + "/", { waitUntil: "load" });
  await page.reload({ waitUntil: "load" });
  const s = await page.evaluate(() => ({
    scripts: [...document.querySelectorAll("script[src]")].map((x) => x.getAttribute("src")).filter((u) => u.startsWith("/_next/")),
    controlled: !!navigator.serviceWorker.controller,
  }));
  s.dpl = await dplOf(page);
  check("H", "reload after deploy B: the document is deploy B", s.dpl === "B", s.dpl);
  check("H", "every /_next script carries ?dpl=B", s.scripts.length > 0 && s.scripts.every((u) => /[?&]dpl=B\b/.test(u)), s.scripts.filter((u) => !/dpl=B/.test(u)).slice(0, 5));
  check("H", "the worker still controls the page (no update churn)", s.controlled);
  if (tabA) {
    const before = await dplOf(tabA);
    const nav = tabA.waitForEvent("load", { timeout: 15000 }).catch(() => null);
    await tabA.evaluate(() => {
      const a = [...document.querySelectorAll('a[href^="/projects/"]')].find((x) => x.getAttribute("aria-hidden") !== "true") ?? document.querySelector('a[href^="/projects/"]');
      a?.click();
    });
    await nav;
    await tabA.waitForLoadState("load").catch(() => {});
    await sleep(1000);
    const after = await dplOf(tabA).catch(() => null);
    check("H", "an A tab left open: a <Link> click hard-navigates into deploy B", before === "A" && after === "B", { before, after, url: tabA.url() });
  }
}

async function secI() {
  const page = androidPage;
  await page.goto(BASE + "/", { waitUntil: "load" });
  if (!(await waitControlled(page))) return check("I", "precondition: a controlling worker", false);
  const before = await cacheDump(page);
  writeSw(SW_ORIGINAL.toString().replace(`const VERSION = "${V}"`, `const VERSION = "${V_NEXT}"`));
  try {
    const r = await page.evaluate(async ([v, vNext]) => {
      const reg = await navigator.serviceWorker.ready;
      let changed = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => (changed = true), { once: true });
      await reg.update();
      const t0 = Date.now();
      let script = "";
      while (Date.now() - t0 < 15000) {
        const a = reg.active;
        if (a && a.state === "activated") {
          script = await (await fetch(a.scriptURL, { cache: "no-store" })).text();
          const keys = await caches.keys();
          if (script.includes(`VERSION = "${vNext}"`) && keys.every((k) => !k.endsWith(`-${v}`))) break;
        }
        await new Promise((res) => setTimeout(res, 150));
      }
      return { state: reg.active?.state, waiting: !!reg.waiting, changed, keys: await caches.keys(), bumped: script.includes(`VERSION = "${vNext}"`) };
    }, [V, V_NEXT]);
    check("I", `the ${V_NEXT} worker is activated`, r.state === "activated" && r.bumped, r);
    check("I", "no waiting worker (skipWaiting)", !r.waiting);
    check("I", "controllerchange fired", r.changed);
    check("I", `only *-${V_NEXT} caches remain`, r.keys.filter((k) => OWN_CACHE.test(k)).every((k) => k.endsWith(`-${V_NEXT}`)), r.keys);
    // static (content-hashed) and asset (network-first) entries stay valid: carried over, so an offline launch
    // after an update still has its chunks and models
    const after = await cacheDump(page);
    const carried = (kind) => (before[`${kind}-${V}`] ?? []).every((u) => (after[`${kind}-${V_NEXT}`] ?? []).includes(u));
    check("I", `static-${V} entries carried into static-${V_NEXT}`, carried("static"), { before: (before[`static-${V}`] ?? []).length, after: (after[`static-${V_NEXT}`] ?? []).length });
    check("I", `assets-${V} entries carried into assets-${V_NEXT}`, carried("assets"), { before: before[`assets-${V}`], after: after[`assets-${V_NEXT}`] });
    check("I", "the page still works without a reload", await page.evaluate(async () => (await fetch("/")).ok && !!document.querySelector("h1")));
  } finally {
    restoreSw();
  }
}

async function secJ() {
  // J-off: build with NEXT_PUBLIC_SW=off; a page that had a worker unregisters it and drops its caches.
  // J-kill: the self-destruct worker, shipped together with SW=off (the kill switch procedure).
  const page = androidPage;
  await page.goto(BASE + "/", { waitUntil: "load" });
  await waitControlled(page);
  // a second client, left idle on the normal build with a live worker, for the self-destruct check
  const b = await chrome();
  const ctx2 = await b.newContext({ ...devices["Pixel 7"] });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + "/", { waitUntil: "load" });
  const c2 = await waitControlled(p2);
  await stopServer();
  nextBuild("sw-off", { NEXT_PUBLIC_SW: "off" });
  await startServer({ NEXT_PUBLIC_SW: "off" });
  await page.goto(BASE + "/", { waitUntil: "load" });
  await sleep(3000);
  const regs = await registrations(page);
  const own0 = ownCaches(await cacheDump(page));
  check("J", "NEXT_PUBLIC_SW=off: the page unregisters every worker", regs.length === 0, regs);
  // an unregistered worker keeps controlling the page it was serving until that page unloads, so the page's
  // later fetches (lazy chunks, the world's models) refill its caches after PwaRegister deleted them; the
  // next navigation is uncontrolled and its PwaRegister deletes them for good
  if (own0.length) note("J", `NEXT_PUBLIC_SW=off: first load, still controlled by the unregistered worker: ${own0.join(", ")} refilled after the delete`);
  await page.goto(BASE + "/", { waitUntil: "load" });
  await sleep(3000);
  const own = ownCaches(await cacheDump(page));
  check("J", "NEXT_PUBLIC_SW=off: own caches deleted by the next navigation", own.length === 0 && !(await page.evaluate(() => !!navigator.serviceWorker.controller)), own);
  if (!c2) return check("J", "precondition (kill switch): a second controlled client", false);
  writeSw(KILL_SWITCH_SW);
  try {
    let loads = 0;
    p2.on("load", () => loads++);
    await p2.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update().catch(() => {});
    });
    await p2.waitForEvent("load", { timeout: 15000 }).catch(() => null);
    await sleep(6000);
    const r2 = await registrations(p2);
    const o2 = ownCaches(await cacheDump(p2));
    check("J", "kill switch: no registrations left", r2.length === 0, r2);
    check("J", "kill switch: no own caches left", o2.length === 0, o2);
    check("J", "kill switch: the client was navigated once, no reload loop", loads >= 1 && loads <= 2, loads);
  } finally {
    restoreSw();
    await ctx2.close();
  }
}

async function secJdev() {
  let up = false;
  try {
    up = (await fetch(DEV + "/", { signal: AbortSignal.timeout(20000) })).status < 500;
  } catch {}
  if (!up) return skip("J-dev", `${DEV} is not answering (or erroring): 'next dev unregisters' not checked`);
  const b = await chrome();
  const ctx = await b.newContext({ ...devices["Pixel 7"] });
  const p = await ctx.newPage();
  await p.goto(DEV + "/", { waitUntil: "load" });
  // plant a leftover worker the way a local production run would have
  const planted = await p.evaluate(async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      await caches.open("static-v1");
      return !!reg;
    } catch (e) {
      return String(e);
    }
  });
  check("J-dev", "a leftover worker was planted on the dev origin", planted === true, planted);
  await p.reload({ waitUntil: "load" });
  await sleep(4000);
  const regs = await registrations(p);
  const own = ownCaches(await cacheDump(p));
  check("J-dev", "next dev: the page unregisters the leftover worker", regs.length === 0, regs);
  check("J-dev", "next dev: own caches deleted", own.length === 0, own);
  await ctx.close();
}

async function secM(log) {
  const sym = routeSymbols(log);
  check("M", "build lists /manifest.webmanifest as static (○)", sym["/manifest.webmanifest"] === "○", sym["/manifest.webmanifest"] ?? Object.keys(sym));
  check("M", "build lists /apple-icon.png as static (○)", sym["/apple-icon.png"] === "○", sym["/apple-icon.png"] ?? Object.keys(sym));
  const now = firstLoadJs();
  report.firstLoad = now;
  if (!ART) note("M", `first-load JS for /: ${(now.gz / 1024).toFixed(2)} KB gz (no --art=<dir>: not compared with step0/build-before.json)`);
  for (const [label, file] of ART ? [["Step 0 (after contract)", "build-after.json"], ["origin/main (before)", "build-before.json"]] : []) {
    const f = path.join(ART, "step0", file);
    if (!fs.existsSync(f)) continue;
    const base = JSON.parse(fs.readFileSync(f, "utf8"))["/"].js.gz;
    const delta = now.gz - base;
    note("M", `first-load JS for /: ${(now.gz / 1024).toFixed(2)} KB gz, ${delta >= 0 ? "+" : ""}${(delta / 1024).toFixed(2)} KB vs ${label}`);
    if (file === "build-before.json") check("M", "first-load JS for / within +3 KB gz of origin/main (all lanes)", delta <= 3 * 1024, `${(delta / 1024).toFixed(2)} KB`);
  }
}

async function killSwitchAloneLoop() {
  // informational: the self-destruct worker WITHOUT NEXT_PUBLIC_SW=off. The phone chunk (PhoneHud → register.ts
  // scheduleRegister) re-registers it at idle on every phone load and the worker navigates its clients on activate,
  // so phones may reload in a loop: ship both together.
  const b = await chrome();
  const ctx = await b.newContext({ ...devices["Pixel 7"] });
  const p = await ctx.newPage();
  await p.goto(BASE + "/", { waitUntil: "load" });
  if (!(await waitControlled(p))) {
    note("J", "kill switch alone: no controlled client, not measured");
    return ctx.close();
  }
  writeSw(KILL_SWITCH_SW);
  try {
    let loads = 0;
    p.on("load", () => loads++);
    await p.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update().catch(() => {}));
    await sleep(12000);
    report.killSwitchAloneLoads = loads;
    if (loads > 2) report.warnings.push(`kill switch WITHOUT NEXT_PUBLIC_SW=off reloaded the page ${loads}x in 12 s: always ship the self-destruct sw.js together with NEXT_PUBLIC_SW=off`);
    note("J", `kill switch alone (normal build): ${loads} navigation(s) in 12 s`);
  } finally {
    restoreSw();
    await ctx.close();
  }
}

// ================================================================= run
const t0 = Date.now();
try {
  if (NO_BUILD) {
    console.log(`pwa-probe (no-build) against ${BASE}`);
    await section("A", "head tags on / and /projects/glassbox", secA);
    await section("B", "manifest + assets", secB);
    await section("C", "installability (CDP, persistent profile)", secC);
    await section("D", "install UX", secD);
    await section("E", "service worker control + warm + RSC never cached", secE);
    await section("F", "offline (Chromium setOffline)", secF);
    await section("F", "offline with lazy chunks the worker never stored", secF2);
    await section("K", "standalone CSS (CDP stylesheet rewrite, 34 px inset)", secK);
    await section("L", "desktop no-regression (PWA side)", secL);
    await section("J-dev", "next dev unregisters", secJdev);
    for (const s of ["G", "H", "I", "J", "M"]) if (want(s)) skip(s, "needs the probe's own builds (run without --no-build)");
  } else {
    console.log(`pwa-probe (full): builds this tree and serves it on :${PORT}. Any server running from this tree's .next breaks while it builds.`);
    nextBuild("A", { NEXT_DEPLOYMENT_ID: "A" });
    await startServer({ NEXT_DEPLOYMENT_ID: "A" });
    await section("A", "head tags on / and /projects/glassbox", secA);
    await section("B", "manifest + assets", secB);
    await section("C", "installability (CDP, persistent profile)", secC);
    await section("D", "install UX", secD);
    await section("E", "service worker control + warm + RSC never cached", secE);
    await section("F", "offline (Chromium setOffline)", secF);
    await section("F", "offline with lazy chunks the worker never stored", secF2);
    await section("K", "standalone CSS (CDP stylesheet rewrite, 34 px inset)", secK);
    await section("L", "desktop no-regression (PWA side)", secL);
    let tabA = null;
    let wkCtx = null;
    if (want("G") || want("H")) {
      await androidCtx();
      if (!(await androidPage.evaluate(() => !!navigator.serviceWorker?.controller).catch(() => false))) {
        await androidPage.goto(BASE + "/", { waitUntil: "load" });
        await waitControlled(androidPage);
      }
      await androidPage.goto(BASE + "/projects/glassbox", { waitUntil: "load" });
      await androidPage.goto(BASE + "/", { waitUntil: "load" });
      tabA = await android.newPage();
      await tabA.goto(BASE + "/", { waitUntil: "load" });
      await sleep(1000);
      if (want("G")) wkCtx = await prepareWebkitForG().catch((e) => (note("G", `webkit setup failed: ${e}`), null));
    }
    if (want("G")) await section("G", "offline with the origin down (Chromium + WebKit)", () => secG(wkCtx));
    else await stopServer();
    if (wkCtx) await wkCtx.close();
    if (want("H") || want("I") || want("J")) {
      await stopServer();
      await section("H", "a new deploy (A → B) is never masked", () => secH(tabA));
      if (!server) {
        nextBuild("B", { NEXT_DEPLOYMENT_ID: "B" });
        await startServer({ NEXT_DEPLOYMENT_ID: "B" });
      }
      await section("I", `VERSION bump: ${V_NEXT} activates, only ${V_NEXT} caches`, secI);
      await section("J", "kill switch + NEXT_PUBLIC_SW=off", secJ);
    }
    await section("J-dev", "next dev unregisters", secJdev);
    // leave a NORMAL production build behind
    await stopServer();
    const finalLog = nextBuild("final", {});
    await section("M", "build check", () => secM(finalLog));
    if (want("J")) {
      await startServer({});
      await killSwitchAloneLoop().catch((e) => note("J", `kill switch alone: ${e}`));
      await stopServer();
    }
    report.finalBuild = "normal production build left in .next (no deployment id, SW on); no server running";
  }
} catch (e) {
  report.fatal = String(e?.stack ?? e).slice(0, 2000);
  console.error(`\nFATAL: ${report.fatal}`);
  if (!NO_BUILD) report.finalBuild = "UNKNOWN: the run aborted. Rebuild before serving: npx next build";
} finally {
  restoreSw();
  await stopServer().catch(() => {});
  await android?.close().catch(() => {});
  await chromeBrowser?.close().catch(() => {});
  await webkitBrowser?.close().catch(() => {});
  fs.rmSync(profileDir, { recursive: true, force: true });
}
report.androidConsole = androidLog;
report.seconds = Math.round((Date.now() - t0) / 1000);
const failed = Object.entries(report.sections).filter(([, s]) => !s.pass).map(([k]) => k);
report.pass = !failed.length && !report.fatal;
report.failed = failed;
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log(`\npwa-probe: ${report.pass ? "PASS" : `FAIL (${failed.join(", ") || "fatal"})`} in ${report.seconds} s → ${path.join(OUT, "report.json")}`);
if (report.finalBuild) console.log(report.finalBuild);
if (report.warnings.length) console.log(`warnings:\n  ${report.warnings.join("\n  ")}`);
process.exit(report.pass ? 0 : 1);
