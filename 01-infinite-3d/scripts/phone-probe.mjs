// Phone verification: checks P1–P21 of the mobile verification plan against a running production server.
//
//   node scripts/phone-probe.mjs <baseUrl> [--engine chromium|webkit|both] [--only P1,P7] [--devices key,key]
//                                          [--out <dir>] [--headed]
//   baseUrl defaults to http://localhost:3112 (3111 is refused: the user's own server).
//
// Devices (portrait unless noted): android-360x800 @3, iphone-375x667 @2, iphone-390x844 @3, iphone-393x852 @3,
// iphone-402x874 @3, pixel-412x915 @2.625, iphone-430x932 @3, landscape iphone-852x393 @3 and iphone-667x375 @2;
// plus in-browser viewports (toolbars showing), layout checks only: iphone-375x548 @2, landscape iphone-852x343 @3
// with 59/21 px notch and home-indicator insets (Chromium), landscape iphone-667x325 @2, and landscape Android with
// Chrome's toolbar (Chromium): android-800x304 @2.625 and the narrow android-640x300 @3 (a 360x640-class phone).
// Chromium runs every device (Android UA); WebKit runs the iPhone sizes (iOS UA). Controls: desktop 1440x900
// (fine pointer) and iPad 820x1180 (touch). Every device gets P1 P2 P10 P18 P20; the deep checks (P3–P9, P11–P17,
// P21) run on pixel-412x915 (Chromium) and iphone-393x852 (WebKit), P11 also on the SE and the landscape phone.
//
// Instrumentation (addInitScript, before any page script): WebGL draw calls (drawArrays / drawElements /
// drawArraysInstanced / drawElementsInstanced / drawRangeElements) counted per rAF, linkProgram calls, touch
// down/up times, scroll times, long tasks, LCP and CLS (Chromium), the Dock's first visible frame, and an optional
// blackout sampler (#loop-root opacity, html overflow, data-intro, full-screen overlays).
// Touch: CDP Input.dispatchTouchEvent / Input.synthesizeScrollGesture in Chromium; WebKit uses a scripted scroll
// and page.touchscreen.tap. Hooks the probe reads when present: window.__cam (?probe=1, Lane E).
//
// Output: <out>/<engine>-<device>/result.json + screenshots, <out>/report.json (default out: test-results/phone-probe
// under the working directory). Exit 1 on any failed check.
import { chromium, webkit, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return undefined;
  return argv[i].includes("=") ? argv[i].split("=").slice(1).join("=") : argv[i + 1];
};
const BASE = (argv.find((a, i) => !a.startsWith("--") && !(i > 0 && /^--(engine|only|devices|out)$/.test(argv[i - 1]))) ?? "http://localhost:3112").replace(/\/$/, "");
if (/:3111\b/.test(BASE)) {
  console.error("phone-probe: port 3111 is the user's own server. Use a production server on 3112-3119.");
  process.exit(2);
}
const ENGINE = opt("engine") ?? "both";
const ONLY = opt("only")?.split(",").map((s) => s.trim().toUpperCase());
const DEV_FILTER = opt("devices")?.split(",").map((s) => s.trim());
const OUT = path.resolve(opt("out") ?? "test-results/phone-probe");
const HEADED = argv.includes("--headed");
const want = (p) => !ONLY || ONLY.includes(p);
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- source-of-truth constants (parsed, never copied)
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const PHONE_MQ = /export const PHONE_MQ = "([^"]+)"/.exec(read("src/components/world/phone.ts"))[1];
const PHONE_LAND_MQ = /export const PHONE_LAND_MQ = "([^"]+)"/.exec(read("src/components/world/phone.ts"))[1];
const SITE = read("src/content/site.ts");
const siteStr = (key) => new RegExp(`${key}:\\s*"([^"]+)"`).exec(SITE)?.[1];
const NAME = siteStr("name") ?? "Nazar Akanov";
const MANIFESTO = /manifesto:\s*"([^"]+)"/.exec(SITE)?.[1] ?? "";
const DOCK = { hero: "Home", about: "About", projects: "Work", contact: "Contact", ...Object.fromEntries([...(/dock:\s*\{([^}]+)\}/.exec(SITE)?.[1] ?? "").matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]])) };
const LOAD_WORLD = /loadWorld:\s*"([^"]+)"/.exec(SITE)?.[1] ?? "Load 3D world";
const SLUGS = [...SITE.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const WINDOW_VH = Number(/export const WINDOW_VH = ([\d.]+)/.exec(read("src/components/world/scroll/anchors.ts"))?.[1] ?? 0.85);
const LAYOUT = read("src/components/world/scenes/layout.ts");
const SPACING = Number(/DEVICE_SPACING = ([\d.]+)/.exec(LAYOUT)?.[1] ?? 6);
const VOIDP = (() => {
  const m = /VOID = \{ x: (-?[\d.]+), y: (-?[\d.]+), z: (-?[\d.]+) \}/.exec(LAYOUT);
  return m ? m.slice(1).map(Number) : [0, -40, -20];
})();
const SERVER = (() => {
  const m = /SERVER = \{ x: (-?[\d.]+), y: STACK_BOTTOM - ([\d.]+), z: (-?[\d.]+) \}/.exec(LAYOUT);
  const bottom = VOIDP[1] - (SLUGS.length - 1) * SPACING;
  return m ? [Number(m[1]), bottom - Number(m[2]), Number(m[3])] : [0, bottom - 12, -37];
})();
const ORB_POS = (() => {
  const m = /ORB_POS[^=]*= \[(-?[\d.]+), (-?[\d.]+), (-?[\d.]+)\]/.exec(read("src/components/world/scenes/ServerRoom.tsx"));
  return m ? m.slice(1).map(Number) : [0, 2.2, 0];
})();

// ---------------------------------------------------------------- devices
const IOS_UA = (devices["iPhone 15 Pro"] ?? devices["iPhone 13"]).userAgent;
const ANDROID_UA = devices["Pixel 7"].userAgent;
const IPAD_UA = (devices["iPad Pro 11"] ?? devices["iPad (gen 7)"]).userAgent;
const PHONES = [
  { key: "android-360x800", w: 360, h: 800, dpr: 3, engines: ["chromium"] },
  { key: "iphone-375x667", w: 375, h: 667, dpr: 2, engines: ["chromium", "webkit"], framing: true },
  { key: "iphone-390x844", w: 390, h: 844, dpr: 3, engines: ["chromium", "webkit"] },
  { key: "iphone-393x852", w: 393, h: 852, dpr: 3, engines: ["chromium", "webkit"], deep: ["webkit"], framing: true },
  { key: "iphone-402x874", w: 402, h: 874, dpr: 3, engines: ["chromium", "webkit"] },
  { key: "pixel-412x915", w: 412, h: 915, dpr: 2.625, engines: ["chromium"], deep: ["chromium"], framing: true },
  { key: "iphone-430x932", w: 430, h: 932, dpr: 3, engines: ["chromium", "webkit"] },
  { key: "iphone-852x393", w: 852, h: 393, dpr: 3, engines: ["chromium", "webkit"], land: true, framing: true },
  { key: "iphone-667x375", w: 667, h: 375, dpr: 2, engines: ["chromium", "webkit"], land: true },
  // in-browser viewports (toolbars showing), layout only (P10 / P18 / P20): the SE in Safari, the 15 Pro in
  // landscape Safari with its notch and home-indicator insets (Chromium: env() rewritten in the stylesheets),
  // the SE in landscape Safari
  { key: "iphone-375x548", w: 375, h: 548, dpr: 2, engines: ["chromium", "webkit"], layoutOnly: true },
  { key: "iphone-852x343", w: 852, h: 343, dpr: 3, engines: ["chromium"], land: true, layoutOnly: true, insets: { top: 0, right: 59, bottom: 21, left: 59 } },
  { key: "iphone-667x325", w: 667, h: 325, dpr: 2, engines: ["chromium", "webkit"], land: true, layoutOnly: true },
  // Android landscape with Chrome's toolbar showing: the shortest landscape the project captions must clear the top zone on
  { key: "android-800x304", w: 800, h: 304, dpr: 2.625, engines: ["chromium"], land: true, layoutOnly: true },
  // the same on a 360x640-class phone: a ~296 px text column (the contact email row must stay one line)
  { key: "android-640x300", w: 640, h: 300, dpr: 3, engines: ["chromium"], land: true, layoutOnly: true },
];
const CONTROLS = [
  { key: "desktop-1440x900", w: 1440, h: 900, dpr: 1, control: true, fine: true, engines: ["chromium"] },
  { key: "ipad-820x1180", w: 820, h: 1180, dpr: 2, control: true, engines: ["chromium", "webkit"] },
];
const engines = ENGINE === "both" ? ["chromium", "webkit"] : [ENGINE];

function ctxOptions(engine, dev, extra = {}) {
  const o = { viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: dev.dpr, reducedMotion: "no-preference", ...extra };
  if (!dev.fine) Object.assign(o, { isMobile: true, hasTouch: true, userAgent: dev.control ? IPAD_UA : engine === "webkit" ? IOS_UA : ANDROID_UA });
  return o;
}

// ---------------------------------------------------------------- in-page instrumentation
function instrument() {
  const F = window.__ppFlags ?? {};
  const S = (window.__pp = { draws: 0, links: 0, frames: [], touches: [], touchDown: 0, lastTouchEnd: -1, lastScroll: -1, scrollPx: 0, longtasks: [], lcp: [], cls: 0, dockAt: null, blackout: [], blackoutSamples: 0, drawWatch: null, track: null });
  const wrap = (C) => {
    if (!C) return;
    for (const fn of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced", "drawRangeElements"]) {
      const orig = C.prototype[fn];
      if (typeof orig !== "function") continue;
      C.prototype[fn] = function (...a) {
        S.draws++;
        if (S.drawWatch && S.drawWatch.first === null) S.drawWatch.first = performance.now();
        return orig.apply(this, a);
      };
    }
    const lp = C.prototype.linkProgram;
    if (typeof lp === "function")
      C.prototype.linkProgram = function (p) {
        S.links++;
        return lp.call(this, p);
      };
  };
  wrap(window.WebGL2RenderingContext);
  wrap(window.WebGLRenderingContext);
  if (F.noWebGL) {
    const gc = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      return /webgl/i.test(String(type)) ? null : gc.call(this, type, ...a);
    };
  }
  if (F.saveData) {
    const conn = { saveData: true, effectiveType: "4g", downlink: 10, rtt: 50, addEventListener() {}, removeEventListener() {} };
    try {
      Object.defineProperty(Navigator.prototype, "connection", { get: () => conn, configurable: true });
    } catch {}
  }
  let last = 0;
  const loop = (t) => {
    const d = S.draws - last;
    last = S.draws;
    S.frames.push(t, d);
    if (S.frames.length > 60000) S.frames.splice(0, 30000);
    if (S.track) S.track.push([t, Math.round(scrollY)]);
    if (S.dockAt === null) {
      const dock = document.querySelector("[data-phone-dock]");
      if (dock) {
        const cs = getComputedStyle(dock);
        const r = dock.getBoundingClientRect();
        if (cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.5 && r.width > 0 && r.bottom <= innerHeight + 1) S.dockAt = t;
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const opts = { capture: true, passive: true };
  addEventListener("touchstart", (e) => (S.touchDown = e.touches.length, S.touches.push(["s", performance.now()])), opts);
  const end = (e) => {
    S.touchDown = e.touches.length;
    S.touches.push(["e", performance.now()]);
    if (!e.touches.length) S.lastTouchEnd = performance.now();
  };
  addEventListener("touchend", end, opts);
  addEventListener("touchcancel", end, opts);
  let lastY = null;
  addEventListener(
    "scroll",
    () => {
      S.lastScroll = performance.now();
      if (lastY !== null) S.scrollPx += Math.abs(scrollY - lastY);
      lastY = scrollY;
    },
    opts,
  );
  const po = (type, fn) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true });
    } catch {}
  };
  po("longtask", (e) => S.longtasks.push([e.startTime, e.duration]));
  // attribution for P4 failures: the scripts in each long animation frame over 50 ms (Chromium)
  S.loaf = [];
  po("long-animation-frame", (e) => e.duration > 50 && S.loaf.push([e.startTime, e.duration, e.scripts.map((x) => `${x.invoker}|${(x.sourceURL || "").split("/").pop()}:${x.sourceFunctionName}@${x.sourceCharPosition} ${Math.round(x.duration)}ms`).slice(0, 4)]));
  po("largest-contentful-paint", (e) => S.lcp.push({ t: e.startTime, tag: e.element?.tagName ?? null, inH1: !!e.element?.closest?.("h1"), text: (e.element?.textContent ?? "").trim().slice(0, 40) }));
  po("layout-shift", (e) => {
    if (!e.hadRecentInput) S.cls += e.value;
  });
  if (F.blackout) {
    const sample = () => {
      const html = document.documentElement;
      if (!document.body) return;
      S.blackoutSamples++;
      const bad = [];
      if (html.dataset.intro === "playing") bad.push("html[data-intro=playing]");
      if (!html.dataset.sheet && getComputedStyle(html).overflowY === "hidden") bad.push("html overflow hidden");
      if (!html.dataset.sheet && getComputedStyle(document.body).overflowY === "hidden") bad.push("body overflow hidden");
      const root = document.getElementById("loop-root");
      if (root && getComputedStyle(root).opacity !== "1") bad.push(`#loop-root opacity ${getComputedStyle(root).opacity}`);
      for (const el of document.querySelectorAll("body > *, body > * > *, body > * > * > *")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < 0.5 || !(+cs.zIndex >= 10)) continue;
        if (el.matches("[data-jump-veil], dialog, canvas") || el.querySelector("canvas")) continue;
        const r = el.getBoundingClientRect();
        if (r.width * r.height < innerWidth * innerHeight * 0.9) continue;
        const a = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor)?.[1].split(",").map(Number);
        if (a && (a.length > 3 ? a[3] : 1) >= 0.5) bad.push(`overlay <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}">`);
      }
      for (const b of bad) if (!S.blackout.some((x) => x[1] === b)) S.blackout.push([Math.round(performance.now()), b]);
    };
    setInterval(sample, 120);
  }
}

// ---------------------------------------------------------------- node-side helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GPU = ["--ignore-gpu-blocklist", "--use-angle=metal", "--enable-gpu"];
let chromeB = null;
let webkitB = null;
async function browser(engine) {
  if (engine === "chromium") return (chromeB ??= await chromium.launch({ channel: "chrome", headless: !HEADED, args: GPU }));
  return (webkitB ??= await webkit.launch({ headless: !HEADED }));
}

class Result {
  constructor(engine, dev) {
    this.engine = engine;
    this.dev = dev.key;
    this.dir = path.join(OUT, `${engine}-${dev.key}`);
    fs.mkdirSync(this.dir, { recursive: true });
    this.checks = {};
    this.errors = [];
  }
  check(p, name, ok, got) {
    (this.checks[p] ??= []).push({ name, pass: !!ok, ...(got === undefined ? {} : { got }) });
    console.log(`${ok ? "  ok  " : "  FAIL"} ${p} ${this.engine}/${this.dev}: ${name}${ok || got === undefined ? "" : `  → ${JSON.stringify(got).slice(0, 260)}`}`);
    return !!ok;
  }
  note(p, text) {
    (this.checks[p] ??= []).push({ name: text, note: true, pass: true });
    console.log(`  ..   ${p} ${this.engine}/${this.dev}: ${text}`);
  }
  async shot(page, name) {
    await page.screenshot({ path: path.join(this.dir, `${name}.png`) }).catch(() => {});
  }
  get pass() {
    return Object.values(this.checks).every((cs) => cs.every((c) => c.pass));
  }
  save() {
    fs.writeFileSync(path.join(this.dir, "result.json"), JSON.stringify({ engine: this.engine, device: this.dev, pass: this.pass, checks: this.checks, errors: this.errors }, null, 1));
  }
}

async function newPage(engine, dev, R, { flags = {}, ctx: extra = {}, label = "" } = {}) {
  const b = await browser(engine);
  const ctx = await b.newContext(ctxOptions(engine, dev, extra));
  await ctx.addInitScript((f) => (window.__ppFlags = f), flags);
  await ctx.addInitScript(instrument);
  const page = await ctx.newPage();
  const tag = label ? `[${label}] ` : "";
  page.on("pageerror", (e) => R.errors.push(`${tag}pageerror: ${String(e).slice(0, 300)}`));
  page.on("console", (m) => m.type() === "error" && R.errors.push(`${tag}console.error: ${m.text().slice(0, 300)}`));
  const cdp = engine === "chromium" ? await ctx.newCDPSession(page) : null;
  return { ctx, page, cdp };
}
const home = async (page, qs = "") => {
  await page.goto(`${BASE}/${qs}`, { waitUntil: "load" });
  await page.waitForFunction(() => !!document.documentElement.dataset.loop, null, { timeout: 15000 }).catch(() => {});
};
const readyAt = (page) => page.evaluate(() => performance.getEntriesByName("world-ready")[0]?.startTime ?? null);
const waitReady = (page, timeout = 15000) =>
  page
    .waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout })
    .then(() => true)
    .catch(() => false);
/** until scrollY has not changed for `quiet` ms (settles, smooth scrolls, wraps) */
const settle = (page, quiet = 450, max = 6000) =>
  page.evaluate(
    ({ quiet, max }) =>
      new Promise((res) => {
        const t0 = performance.now();
        let last = t0;
        let y = scrollY;
        const tick = () => {
          const now = performance.now();
          if (scrollY !== y) {
            y = scrollY;
            last = now;
          }
          if (now - last >= quiet || now - t0 >= max) res(Math.round(scrollY));
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { quiet, max },
  );
const scrollTo = (page, y) => page.evaluate((t) => window.scrollTo({ top: t, behavior: "instant" }), Math.round(y));
const svh = (page) =>
  page.evaluate(() => {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100svh;visibility:hidden;pointer-events:none";
    document.body.appendChild(d);
    const h = d.getBoundingClientRect().height;
    d.remove();
    return h;
  });
/** document tops of the stations, the project articles, the loop limit */
const anchors = (page) =>
  page.evaluate(() => {
    const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
    return {
      hero: 0,
      about: top(document.getElementById("about")),
      projects: top(document.getElementById("projects")),
      articles: [...document.querySelectorAll("#projects article")].map(top),
      contact: top(document.getElementById("contact")),
      clone: top(document.querySelector('[data-station="hero-clone"]')),
      limit: document.documentElement.scrollHeight - innerHeight,
      stations: [...document.querySelectorAll("#loop-root [data-station]")].map((el) => ({ id: el.dataset.station, top: top(el), stops: Number(el.dataset.stops ?? 1) || 1 })),
    };
  });
const drawsOver = (page, ms) => page.evaluate((ms) => new Promise((res) => {
  const a = window.__pp.draws;
  setTimeout(() => res(window.__pp.draws - a), ms);
}), ms);
/** [t, drawsInFrame] pairs from the rAF log within [t0, t1] (page time) */
const framesBetween = (page, t0, t1) =>
  page.evaluate(({ t0, t1 }) => {
    const f = window.__pp.frames;
    const out = [];
    for (let i = 0; i < f.length; i += 2) if (f[i] >= t0 && f[i] <= t1) out.push([f[i], f[i + 1]]);
    return out;
  }, { t0, t1 });
const now = (page) => page.evaluate(() => performance.now());
function frameStats(frames) {
  const dts = [];
  for (let i = 1; i < frames.length; i++) dts.push(frames[i][0] - frames[i - 1][0]);
  if (!dts.length) return { frames: 0 };
  const s = [...dts].sort((a, b) => a - b);
  const total = dts.reduce((a, b) => a + b, 0);
  return { frames: dts.length, fps: +((1000 * dts.length) / total).toFixed(1), p95: +s[Math.min(s.length - 1, Math.floor(0.95 * s.length))].toFixed(1), worst: +s.at(-1).toFixed(1), over50: dts.filter((d) => d > 50).length };
}
async function safePoint(page) {
  return page.evaluate(() => {
    const bad = "a,button,input,select,textarea,label,summary,dialog,[role=button],[role=link],[tabindex],[data-phone-dock],[data-frame-slot]";
    for (const fy of [0.5, 0.4, 0.6, 0.3, 0.7]) {
      for (const fx of [0.5, 0.3, 0.7]) {
        const x = Math.round(innerWidth * fx), y = Math.round(innerHeight * fy);
        const el = document.elementFromPoint(x, y);
        if (el && !el.closest(bad)) return { x, y };
      }
    }
    return { x: 6, y: Math.round(innerHeight * 0.5) };
  });
}
/** one finger drag (Chromium CDP), y0 → y1 in `ms` */
async function drag(cdp, x, y0, y1, ms) {
  const steps = Math.max(2, Math.round(ms / 16));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / steps }] });
    await sleep(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
/** swipes (the page moves down) for `ms`: CDP touch drags in Chromium, a scripted scroll in WebKit */
async function swipeFor(page, cdp, dev, ms, { pause = 150 } = {}) {
  const t0 = Date.now();
  const pt = await safePoint(page);
  while (Date.now() - t0 < ms) {
    if (cdp) await drag(cdp, pt.x, Math.round(dev.h * 0.72), Math.round(dev.h * 0.38), 240);
    else await page.evaluate((d) => new Promise((res) => {
      const y0 = scrollY, t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 240);
        window.scrollTo(0, y0 + d * k);
        k < 1 ? requestAnimationFrame(step) : res();
      };
      requestAnimationFrame(step);
    }), Math.round(dev.h * 0.34));
    await sleep(pause);
  }
}
async function tap(page, x, y) {
  await page.touchscreen.tap(Math.round(x), Math.round(y));
}
async function tapEl(page, el) {
  const r = await el.boundingBox();
  if (!r) return false;
  await tap(page, r.x + r.width / 2, r.y + r.height / 2);
  return true;
}
const dockTab = async (page, label) => {
  const tabs = await page.$$("[data-phone-dock] a, [data-phone-dock] button");
  for (const t of tabs) {
    const txt = ((await t.textContent()) ?? "").trim();
    if (txt.toLowerCase().includes(label.toLowerCase())) return t;
  }
  return null;
};
async function openSheet(page) {
  const m = await page.$("[data-phone-menu]");
  if (!m) return false;
  await tapEl(page, m);
  await page.waitForSelector("dialog[data-index-sheet][open]", { timeout: 3000 }).catch(() => {});
  await sleep(450);
  return page.evaluate(() => !!document.querySelector("dialog[data-index-sheet][open]"));
}
async function closeSheet(page) {
  await page.keyboard.press("Escape");
  await sleep(450);
}
/** the switch row whose visible label contains `text` (inside the open sheet) */
const switchFor = (page, text) =>
  page.evaluateHandle((t) => {
    const d = document.querySelector("dialog[open]");
    if (!d) return null;
    for (const inp of d.querySelectorAll('input[type="checkbox"], [role="switch"]')) {
      const lab = inp.closest("label") ?? (inp.id ? d.querySelector(`label[for="${inp.id}"]`) : null) ?? inp.parentElement;
      if ((lab?.textContent ?? "").toLowerCase().includes(t.toLowerCase())) return inp;
    }
    return null;
  }, text);
const visible = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0.05 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
  }, sel);

/** layout audit of the current viewport: Dock ∩ content, text < 12 px, targets < 44 (Dock < 48; the landscape rail 44), overflow */
function layoutAudit(landMq) {
  const W = innerWidth, H = innerHeight;
  const dockMin = matchMedia(landMq).matches ? 43.5 : 47.5;
  const vis = (el) => {
    if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true });
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > 0;
  };
  const inView = (r) => r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H;
  const hiddenTree = (el) => !!el.closest('[aria-hidden="true"], [inert]');
  const srOnly = (el) => {
    for (let a = el, i = 0; a && i < 5; a = a.parentElement, i++) {
      const cs = getComputedStyle(a);
      if (/^rect\(0/.test(cs.clip) || cs.clipPath === "inset(50%)" || (parseFloat(cs.width) <= 1 && cs.overflow === "hidden")) return true;
    }
    return false;
  };
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const dialog = document.querySelector("dialog[open]");
  const dockEl = document.querySelector("[data-phone-dock]");
  const dock = !dialog && dockEl && vis(dockEl) ? dockEl.getBoundingClientRect() : null;
  const monoEl = document.querySelector("[data-hud] .monogram");
  const mono = !dialog && monoEl ? monoEl.getBoundingClientRect() : null;
  const monoHits = [];
  const scope = dialog ?? document.body;
  const content = (el) => !!el.closest("#loop-root, main") && !el.closest("[data-phone-dock], [data-first-run-hint], [data-jump-veil]") && !hiddenTree(el);
  const small = [];
  const hits = [];
  const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName) || !vis(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter(inView);
    if (!rects.length || srOnly(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.color === "rgba(0, 0, 0, 0)" || cs.color === "transparent") continue;
    const fs = parseFloat(cs.fontSize);
    if (fs < 11.5) small.push({ text: n.nodeValue.trim().slice(0, 30), fs });
    if (dock && content(el)) {
      const a = rects.reduce((s, r) => s + inter(r, dock), 0);
      if (a > 0) hits.push({ what: `text "${n.nodeValue.trim().slice(0, 24)}"`, area: Math.round(a) });
    }
    if (mono && content(el)) {
      const a = rects.reduce((s, r) => s + inter(r, mono), 0);
      if (a > 0) monoHits.push({ what: `text "${n.nodeValue.trim().slice(0, 24)}"`, area: Math.round(a) });
    }
  }
  const SEL = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="switch"], [role="link"], [role="tab"], [tabindex]:not([tabindex="-1"])';
  const tiny = [];
  for (const el of scope.querySelectorAll(SEL)) {
    if (el.classList.contains("skip-link") || !vis(el) || hiddenTree(el)) continue;
    let r = el.getBoundingClientRect();
    if (el.tagName === "INPUT") {
      const lab = el.closest("label") ?? (el.id ? document.querySelector(`label[for="${el.id}"]`) : null);
      if (lab) r = lab.getBoundingClientRect();
    }
    if (!inView(r)) continue;
    const inDock = !!el.closest("[data-phone-dock]");
    const minH = inDock ? dockMin : 43.5;
    if (r.width < 43.5 || r.height < minH) tiny.push({ el: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24)}"`, w: Math.round(r.width), h: Math.round(r.height), dock: inDock });
    if (dock && !inDock && content(el)) {
      const a = inter(r, dock);
      if (a > 0) hits.push({ what: `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 24)}"`, area: Math.round(a) });
    }
  }
  const total = hits.reduce((s, h) => s + h.area, 0);
  return { dock: dock ? [dock.left, dock.top, dock.width, dock.height].map(Math.round) : null, dockHit: total, hits: hits.slice(0, 6), monoHit: monoHits.reduce((s, h) => s + h.area, 0), monoHits: monoHits.slice(0, 6), small: small.slice(0, 8), tiny: tiny.slice(0, 8), overflowX: document.documentElement.scrollWidth - W, sheet: !!dialog };
}
async function audit(R, page, where, { dockHit = true, topZone = false } = {}) {
  const a = await page.evaluate(layoutAudit, PHONE_LAND_MQ);
  // a scrolling page (detail top) passes content under the floating Dock by design; resting stops must not
  if (dockHit) R.check("P10", `${where}: Dock ∩ content ≤ 100 px²`, a.sheet || a.dockHit <= 100, a.sheet ? undefined : { dockHit: a.dockHit, hits: a.hits });
  // a resting station: the top zone is the monogram's alone (scrolling text passes under its halo by design)
  if (topZone) R.check("P10", `${where}: no content text under the monogram`, a.sheet || a.monoHit === 0, a.monoHits);
  R.check("P10", `${where}: no visible text under 12 px`, a.small.length === 0, a.small);
  R.check("P10", `${where}: targets ≥ 44×44 (Dock ≥ 48)`, a.tiny.length === 0, a.tiny);
  R.check("P10", `${where}: scrollWidth == innerWidth`, a.overflowX <= 0, a.overflowX);
  return a;
}

// ================================================================= check groups
/** P2 first paint without JS (the SSR paint): H1, GlowPoster, desktop HUD hidden, no Dock yet */
async function groupSSR(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { ctx: { javaScriptEnabled: false }, label: "ssr" });
  try {
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    const s = await page.evaluate((name) => {
      const shown = (el) => {
        if (!el) return false;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      const h1 = document.querySelector("#hero h1") ?? document.querySelector("h1");
      const hr = h1?.getBoundingClientRect();
      const desk = [...document.querySelectorAll("[data-hud] .nav-pill, [data-hud] aside > *")].filter((el) => !el.closest("[data-phone-dock], dialog, [data-first-run-hint], [data-jump-veil]") && shown(el));
      return {
        // the name's words are separate block spans, so compare without whitespace
        h1: !!h1 && (h1.textContent ?? "").replace(/\s+/g, "").includes(name.replace(/\s+/g, "")) && hr.height > 0 && hr.top >= 0 && hr.bottom <= innerHeight,
        poster: shown(document.querySelector("[data-glow-poster]")),
        desktopHud: desk.map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`),
      };
    }, NAME);
    R.check("P2", "first paint: the H1 is real, visible text in the viewport", s.h1);
    R.check("P2", "first paint: GlowPoster visible", s.poster);
    R.check("P2", "first paint: desktop HUD is display:none", s.desktopHud.length === 0, s.desktopHud);
    await R.shot(page, "00-first-paint-nojs");
  } finally {
    await ctx.close();
  }
}

/** P2 (Chromium): the LCP element is the H1 (a span inside it), at ≤ 600 ms with the CPU throttled 4x */
async function groupLcp(engine, dev, R) {
  const { ctx, page, cdp } = await newPage(engine, dev, R, { label: "lcp" });
  try {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await sleep(3000);
    await safePoint(page).then((pt) => tap(page, pt.x, pt.y)); // input finalises LCP
    await sleep(300);
    const lcp = await page.evaluate(() => window.__pp.lcp.at(-1) ?? null);
    R.check("P2", "LCP element is the H1 (4x CPU)", !!lcp && lcp.inH1, lcp);
    R.check("P2", "LCP ≤ 600 ms (4x CPU)", !!lcp && lcp.t <= 600, lcp && Math.round(lcp.t));
  } finally {
    await ctx.close();
  }
}

/** every device: gate, hydrated first paint, layout at every stop, the sheet, detail top/bottom, landscape */
async function groupLayout(engine, dev, R) {
  const { ctx, page, cdp } = await newPage(engine, dev, R, { label: "layout" });
  try {
    const insets = await emulateInsets(cdp, dev);
    await home(page);
    await insets();
    const t0 = await page.evaluate(() => ({ poster: (() => {
      const el = document.querySelector("[data-glow-poster]");
      return !!el && getComputedStyle(el).display !== "none";
    })(), ready: performance.getEntriesByName("world-ready").length > 0 }));
    const gate = await page.evaluate((q) => matchMedia(q).matches, PHONE_MQ);
    if (want("P1")) R.check("P1", "PHONE_MQ matches", gate === true, gate);
    if (!gate) return R.note("P10", "not a phone here (gate false): layout checks skipped");
    await sleep(1600);
    if (want("P2")) {
      const s = await page.evaluate(() => ({ dockAt: window.__pp.dockAt, cls: window.__pp.cls, h1: (() => {
        const h = document.querySelector("#hero h1");
        const r = h?.getBoundingClientRect();
        return !!h && r.height > 0 && r.bottom <= innerHeight;
      })() }));
      R.check("P2", "the H1 is visible after hydration", s.h1);
      R.check("P2", "GlowPoster rendered before the world mounts", t0.ready || t0.poster, t0);
      R.check("P2", "the Dock is visible within 1.5 s", s.dockAt !== null && s.dockAt <= 1500, s.dockAt === null ? null : Math.round(s.dockAt));
      if (engine === "chromium") R.check("P2", "CLS < 0.02 (the Dock rise is transform-only)", s.cls < 0.02, +s.cls.toFixed(4));
    }
    await waitReady(page, 12000);
    await sleep(800);
    const A = await anchors(page);
    const stops = [["hero", 0], ["about", A.about], ...A.articles.map((y, i) => [`project-${i + 1}`, y]), ["contact", A.contact]];
    let i = 0;
    for (const [name, y] of stops) {
      if (y == null) {
        R.check("P10", `${name}: anchor found`, false);
        continue;
      }
      await scrollTo(page, y);
      await settle(page);
      await sleep(900);
      // About is a free-reading hold (no settle inside it): when its text is taller than the screen (the SE,
      // the short phones) it scrolls under the floating Dock by design, like the detail page; there the
      // resting check is its END, where the bottom padding R must clear the Dock ('Based in', experience §4)
      const aboutH = name === "about" ? await page.evaluate(() => document.getElementById("about")?.getBoundingClientRect().height ?? 0) : 0;
      const aboutScrolls = name === "about" && aboutH > dev.h + 2;
      if (want("P10")) await audit(R, page, name, { dockHit: !aboutScrolls, topZone: !aboutScrolls });
      if (aboutScrolls) {
        R.note("P10", `about is ${Math.round(aboutH)} px tall on a ${dev.h} px screen: a scrolling read; Dock ∩ content checked at its end`);
        await R.shot(page, `${String(i + 1).padStart(2, "0")}-${name}-top`);
        await scrollTo(page, Math.round(y + aboutH - dev.h));
        await settle(page);
        await sleep(900);
        if (want("P10")) await audit(R, page, "about end");
      }
      if (want("P18") && dev.land) await landscapeChecks(R, page, name, dev);
      await R.shot(page, `${String(++i).padStart(2, "0")}-${name}`);
    }
    // the sheet
    await scrollTo(page, 0);
    await settle(page);
    if (await openSheet(page)) {
      if (want("P10")) await audit(R, page, "sheet open");
      await R.shot(page, "12-sheet");
      await closeSheet(page);
    } else R.check("P10", "the Index sheet opens from [data-phone-menu]", false);
    // detail page top and bottom
    await page.goto(`${BASE}/projects/${SLUGS[0] ?? "glassbox"}`, { waitUntil: "load" });
    await insets();
    await sleep(1800);
    if (want("P10")) await audit(R, page, "detail top", { dockHit: false });
    await R.shot(page, "13-detail-top");
    await scrollTo(page, 1e6);
    await settle(page);
    await sleep(700);
    if (want("P10")) await audit(R, page, "detail bottom");
    await R.shot(page, "14-detail-bottom");
    void cdp;
  } finally {
    await ctx.close();
  }
}

/**
 * Safe-area insets for a device that declares them (Chromium only: headless has no notch). Every loaded
 * stylesheet's env(safe-area-inset-*) is rewritten to the device's px value through CDP. Returns the
 * function that applies it to the current document (call it after each navigation); a no-op elsewhere.
 */
async function emulateInsets(cdp, dev) {
  if (!dev.insets || !cdp) return async () => {};
  const sheets = new Set();
  cdp.on("CSS.styleSheetAdded", (e) => sheets.add(e.header.styleSheetId));
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  return async () => {
    await sleep(300);
    for (const id of [...sheets]) {
      const { text } = await cdp.send("CSS.getStyleSheetText", { styleSheetId: id }).catch(() => ({ text: "" }));
      let next = text;
      for (const [side, px] of Object.entries(dev.insets))
        next = next.replace(new RegExp(`env\\(\\s*safe-area-inset-${side}\\s*(,[^()]*(\\([^()]*\\))?[^()]*)?\\)`, "g"), `${px}px`);
      if (next !== text) await cdp.send("CSS.setStyleSheetText", { styleSheetId: id, text: next }).catch(() => {});
      sheets.delete(id);
    }
  };
}

async function landscapeChecks(R, page, where, dev) {
  const s = await page.evaluate(() => {
    const d = document.querySelector("[data-phone-dock]");
    const r = d?.getBoundingClientRect();
    const h1 = document.querySelector("#hero h1");
    let lines = null;
    if (h1) {
      // line boxes from the text nodes only, clustered by top (nested spans add boxes, not lines)
      const fs = parseFloat(getComputedStyle(h1).fontSize);
      const tops = [];
      const tw = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        const rg = document.createRange();
        rg.selectNodeContents(n);
        for (const q of rg.getClientRects()) if (q.width > 1) tops.push(q.top);
      }
      tops.sort((a, b) => a - b);
      lines = tops.reduce((acc, t) => (acc.length && t - acc.at(-1) < fs * 0.5 ? acc : [...acc, t]), []).length;
    }
    const grid = document.querySelector("[data-social-grid]");
    const g = grid?.getBoundingClientRect();
    // visible chip labels that wrap (a hidden label, the one-row glyph grid, is the link's name only)
    const wrapped = [...(grid?.querySelectorAll("[data-social-label]") ?? [])]
      .filter((l) => l.getBoundingClientRect().width > 2 && l.getBoundingClientRect().height > parseFloat(getComputedStyle(l).lineHeight) * 1.5)
      .map((l) => l.textContent);
    return {
      rail: r ? { left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) } : null,
      W: innerWidth,
      H: innerHeight,
      lines,
      grid: g ? { top: Math.round(g.top), bottom: Math.round(g.bottom) } : null,
      wrapped,
    };
  });
  if (where === "hero") {
    R.check("P18", "the Dock is a right rail", !!s.rail && s.rail.h > s.rail.w && s.rail.left > s.W / 2 && s.W - s.rail.right <= 60, s.rail);
    R.check("P18", "hero name ≤ 2 lines", s.lines !== null && s.lines <= 2, s.lines);
  }
  if (where === "contact") R.check("P18", "the social grid is fully visible inside the pinned stage, above the home-indicator inset", !!s.grid && s.grid.top >= 0 && s.grid.bottom <= s.H - (dev.insets?.bottom ?? 0), s.grid);
  if (where === "contact") R.check("P18", "every visible social chip label is one line", s.wrapped.length === 0, s.wrapped);
}

/** P3 + P4: no blackout across load, the mount and swipes; the mount waits for rest */
async function groupBoot(engine, dev, R) {
  const { ctx, page, cdp } = await newPage(engine, dev, R, { flags: { blackout: true }, label: "boot" });
  try {
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await sleep(300);
    // continuous swipes (pauses shorter than the 250 ms rest window) for 6 s: the world must not mount meanwhile
    await swipeFor(page, cdp, dev, 5000, { pause: 150 });
    const px5 = await page.evaluate(() => window.__pp.scrollPx);
    await swipeFor(page, cdp, dev, 1000, { pause: 150 });
    const mid = await page.evaluate(() => ({ ready: performance.getEntriesByName("world-ready")[0]?.startTime ?? null, lastEnd: window.__pp.lastTouchEnd, lastScroll: window.__pp.lastScroll, px: window.__pp.scrollPx }));
    await waitReady(page, 12000);
    await sleep(1000);
    await swipeFor(page, cdp, dev, 4000, { pause: 400 });
    await sleep(800);
    const s = await page.evaluate(() => ({ ready: performance.getEntriesByName("world-ready")[0]?.startTime ?? null, blackout: window.__pp.blackout, samples: window.__pp.blackoutSamples, touches: window.__pp.touches, longtasks: window.__pp.longtasks, loaf: window.__pp.loaf }));
    if (want("P3")) {
      R.check("P3", "no blackout: #loop-root opacity 1, no overflow lock, no data-intro=playing, no overlay", s.samples > 20 && s.blackout.length === 0, { samples: s.samples, bad: s.blackout.slice(0, 5) });
    }
    if (want("P4")) {
      const quietEnd = Math.max(mid.lastEnd, mid.lastScroll);
      R.check("P4", "the world did not mount during continuous swipes", mid.ready === null || mid.ready > quietEnd, { ready: mid.ready && Math.round(mid.ready), lastInput: Math.round(quietEnd) });
      R.check("P4", "world-ready comes ≥ 250 ms after the last touchend / scroll", s.ready !== null && s.ready >= quietEnd + 250, { ready: s.ready && Math.round(s.ready), lastInput: Math.round(quietEnd) });
      if (engine === "chromium") {
        const spans = [];
        let open = null;
        for (const [k, t] of s.touches) {
          if (k === "s" && open === null) open = t;
          if (k === "e" && open !== null) spans.push([open, t]), (open = null);
        }
        const during = s.longtasks.filter(([st, d]) => d > 50 && spans.some(([a, b]) => st >= a && st <= b));
        R.check("P4", "no long task > 50 ms starts while a finger is down", during.length === 0, {
          tasks: during.slice(0, 5).map(([a, d]) => [Math.round(a), Math.round(d)]),
          loaf: (s.loaf ?? []).filter(([a, d]) => during.some(([t]) => t >= a - 5 && t <= a + d)).map(([a, d, sc]) => [Math.round(a), Math.round(d), sc]),
        });
        // no-WebGL control: the same swipes must move the page at least as far (within 10 %)
        const c = await newPage(engine, dev, R, { flags: { noWebGL: true }, label: "boot-control" });
        try {
          await c.page.goto(`${BASE}/`, { waitUntil: "load" });
          await sleep(300);
          await swipeFor(c.page, c.cdp, dev, 5000, { pause: 150 });
          const ctrlPx = await c.page.evaluate(() => window.__pp.scrollPx);
          R.check("P4", "swipes in the first 5 s move ≥ 90 % of a no-WebGL control run", px5 >= 0.9 * ctrlPx, { px5s: Math.round(px5), control5s: Math.round(ctrlPx) });
        } finally {
          await c.ctx.close();
        }
      } else R.note("P4", "WebKit: scripted scroll (no touch events, no longtask API): only the rest-gate timing is checked");
    }
    await R.shot(page, "03-after-swipes");
  } finally {
    await ctx.close();
  }
}

/** P5: idle mount window; Save-Data defers until 'Load 3D world' */
async function groupIdle(engine, dev, R) {
  {
    const { ctx, page } = await newPage(engine, dev, R, { label: "idle" });
    try {
      await page.goto(`${BASE}/`, { waitUntil: "load" });
      const ok = await waitReady(page, 10000);
      const t = await page.evaluate(() => ({ ready: performance.getEntriesByName("world-ready")[0]?.startTime ?? null, load: performance.getEntriesByType("navigation")[0]?.loadEventEnd ?? 0 }));
      const d = t.ready === null ? null : Math.round(t.ready - t.load);
      R.check("P5", "no input: world-ready 1.2–4 s after load", ok && d >= 1150 && d <= 4000, { afterLoadMs: d, loadMs: Math.round(t.load) });
      await R.shot(page, "01-develop-idle");
    } finally {
      await ctx.close();
    }
  }
  {
    const { ctx, page } = await newPage(engine, dev, R, { flags: { saveData: true }, label: "save-data" });
    try {
      await page.goto(`${BASE}/`, { waitUntil: "load" });
      await sleep(6000);
      const s = await page.evaluate(() => ({ ready: performance.getEntriesByName("world-ready").length, canvas: [...document.querySelectorAll("canvas")].filter((c) => !c.closest("#loop-root, main")).length, sd: navigator.connection?.saveData }));
      R.check("P5", "Save-Data: nothing auto-mounts", s.ready === 0 && s.canvas === 0, s);
      if (await openSheet(page)) {
        const btn = await page.evaluateHandle((t) => [...document.querySelectorAll("dialog[open] button, dialog[open] [role=switch], dialog[open] input")].find((el) => (el.closest("label")?.textContent ?? el.textContent ?? "").includes(t)) ?? null, LOAD_WORLD);
        const el = btn.asElement();
        R.check("P5", `Save-Data: the sheet offers '${LOAD_WORLD}'`, !!el);
        if (el) {
          await el.evaluate((n) => n.click());
          await closeSheet(page).catch(() => {});
          R.check("P5", `'${LOAD_WORLD}' mounts the world`, await waitReady(page, 15000));
        }
      } else R.check("P5", "Save-Data: the sheet opens", false);
    } finally {
      await ctx.close();
    }
  }
}

/** P6: a lap of touch drags at 1800 px/s (Chromium 4x and 6x CPU; WebKit scripted) */
async function groupPerf(engine, dev, R) {
  const { ctx, page, cdp } = await newPage(engine, dev, R, { label: "perf" });
  try {
    await home(page);
    await waitReady(page, 12000);
    await sleep(2500);
    const A = await anchors(page);
    const lap = A.limit;
    const runs = engine === "chromium" ? [[4, 58, 20], [6, 55, null]] : [[1, 58, 20]];
    let peak = 0;
    for (const [rate, minFps, maxP95] of runs) {
      await scrollTo(page, 0);
      await settle(page);
      await sleep(600);
      if (cdp) {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate });
        await cdp.send("Performance.enable");
      }
      const m0 = cdp ? Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value])) : null;
      const t0 = await now(page);
      const dist = Math.round(dev.h * 0.6);
      const reps = Math.max(4, Math.ceil(lap / dist));
      if (cdp) {
        await cdp.send("Input.synthesizeScrollGesture", { x: Math.round(dev.w / 2), y: Math.round(dev.h * 0.8), yDistance: -dist, speed: 1800, gestureSourceType: "touch", repeatCount: reps, repeatDelayMs: 60 });
      } else {
        await page.evaluate(({ lap }) => new Promise((res) => {
          const t0 = performance.now();
          const dur = (lap / 1800) * 1000;
          const step = (t) => {
            const k = Math.min(1, (t - t0) / dur);
            window.scrollTo(0, lap * k);
            k < 1 ? requestAnimationFrame(step) : res();
          };
          requestAnimationFrame(step);
        }), { lap: lap - 4 });
      }
      const t1 = await now(page);
      const m1 = cdp ? Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value])) : null;
      if (cdp) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      const fr = await framesBetween(page, t0, t1);
      const st = frameStats(fr);
      peak = Math.max(peak, ...fr.map((f) => f[1]));
      const label = engine === "chromium" ? `${rate}x CPU` : "WebKit";
      R.check("P6", `${label}: ≥ ${minFps} fps over the lap`, st.fps >= minFps, st);
      if (maxP95) R.check("P6", `${label}: p95 frame ≤ ${maxP95} ms`, st.p95 <= maxP95, st.p95);
      R.check("P6", `${label}: 0 frames over 50 ms`, st.over50 === 0, st.over50);
      if (m0 && m1 && st.frames) {
        const per = (m1.RecalcStyleCount - m0.RecalcStyleCount) / st.frames;
        R.check("P6", `${label}: style recalcs per scrolling frame ≤ 1.2`, per <= 1.2, +per.toFixed(2));
      }
    }
    return peak;
  } finally {
    await ctx.close();
  }
}

/** P7 idle cost, P9 draw calls, P8 wake/freeze (same page: the render policy's life at rest) */
async function groupRender(engine, dev, R) {
  const { ctx, page, cdp } = await newPage(engine, dev, R, { label: "render" });
  try {
    await home(page);
    if (!(await waitReady(page, 12000))) return R.check("P7", "the world mounted", false);
    if (cdp) await cdp.send("Performance.enable");
    await sleep(3000);
    const links0 = await page.evaluate(() => window.__pp.links);
    const A = await anchors(page);
    const stations = [["hero", 0], ["about", A.about], ["projects", A.articles[0] ?? A.projects], ["contact", A.contact]];
    for (const [name, y] of stations) {
      await scrollTo(page, y);
      await settle(page);
      // P9: draws per rendered frame during the ambient phase (right after the scroll)
      await sleep(400);
      const ta = await now(page);
      await sleep(1200);
      const fr = (await framesBetween(page, ta, await now(page))).filter((f) => f[1] > 0);
      const perFrame = fr.length ? Math.max(...fr.map((f) => f[1])) : 0;
      if (want("P9")) {
        const cap = name === "hero" ? 64 : 50;
        R.check("P9", `${name}: draw calls per frame at rest ≤ ${cap}`, fr.length > 0 && perFrame <= cap, { perFrame, frames: fr.length });
      }
      // P7: 4.5 s after the last input: nothing is drawn
      await sleep(4500 - 1600);
      const m0 = cdp ? Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value])) : null;
      const d = await drawsOver(page, 1000);
      if (want("P7")) R.check("P7", `${name}: 0 draw calls per second 4.5 s after the last input`, d === 0, d);
      if (cdp && want("P7")) {
        await sleep(1000);
        const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
        const msPerS = ((m1.TaskDuration - m0.TaskDuration) * 1000) / ((m1.Timestamp - m0.Timestamp) || 2);
        R.check("P7", `${name}: main-thread task time ≤ 25 ms/s at rest`, msPerS <= 25, +msPerS.toFixed(1));
      }
      await R.shot(page, `render-${name}`);
    }
    // P8 at contact: an orb tap renders within 50 ms and for ≥ 1 s
    if (want("P8")) {
      const orb = await page.$('[data-frame-slot="orb"]');
      if (orb) {
        await page.evaluate(() => (window.__pp.drawWatch = { first: null }));
        const box = await orb.boundingBox();
        await tap(page, box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1400);
        const w = await page.evaluate(() => {
          const t = window.__pp.touches.filter((x) => x[0] === "s").at(-1)?.[1] ?? null;
          const first = window.__pp.drawWatch.first;
          window.__pp.drawWatch = null;
          const f = window.__pp.frames;
          let lastDraw = null;
          for (let i = 0; i < f.length; i += 2) if (f[i] >= t && f[i + 1] > 0) lastDraw = f[i];
          return { tap: t, first, lastDraw };
        });
        R.check("P8", "an orb tap renders within 50 ms", w.first !== null && w.first - w.tap <= 50, w.first === null ? null : Math.round(w.first - w.tap));
        R.check("P8", "…and keeps rendering for ≥ 1 s", w.lastDraw !== null && w.lastDraw - w.tap >= 950, w.lastDraw === null ? null : Math.round(w.lastDraw - w.tap));
      } else R.check("P8", "[data-frame-slot=orb] exists at contact", false);
      if (await openSheet(page)) {
        await sleep(300);
        const d = await drawsOver(page, 1000);
        R.check("P8", "sheet open: 0 draws", d === 0, d);
        await closeSheet(page);
        const d2 = await drawsOver(page, 1500);
        R.check("P8", "after closing: rendering resumes", d2 > 0, d2);
      } else R.check("P8", "the sheet opens", false);
      // a hidden tab draws nothing, even when woken
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await sleep(200);
      if (orb) {
        const box = await orb.boundingBox();
        await tap(page, box.x + box.width / 2, box.y + box.height / 2);
      }
      const dh = await drawsOver(page, 1000);
      R.check("P8", "hidden tab: 0 draws", dh === 0, dh);
      await page.evaluate(() => {
        delete document.hidden;
        delete document.visibilityState;
        document.dispatchEvent(new Event("visibilitychange"));
      });
    }
    // P9: lap peak and shader links over two laps
    if (want("P9")) {
      await scrollTo(page, 0);
      await settle(page);
      const t0 = await now(page);
      for (let lap = 0; lap < 2; lap++) {
        const L = (await anchors(page)).limit;
        await page.evaluate(({ L }) => new Promise((res) => {
          const t0 = performance.now();
          const dur = (L / 1200) * 1000;
          const step = (t) => {
            const k = Math.min(1, (t - t0) / dur);
            window.scrollTo(0, L * k);
            k < 1 ? requestAnimationFrame(step) : res();
          };
          requestAnimationFrame(step);
        }), { L });
        await settle(page, 600, 4000);
        if ((await page.evaluate(() => scrollY)) > 10) await scrollTo(page, 0);
        await settle(page);
      }
      const fr = await framesBetween(page, t0, await now(page));
      const peak = fr.length ? Math.max(...fr.map((f) => f[1])) : 0;
      const links1 = await page.evaluate(() => window.__pp.links);
      R.check("P9", "lap peak ≤ 80 draw calls per frame", peak > 0 && peak <= 80, peak);
      R.check("P9", "linkProgram count constant over 2 laps (from world-ready + 3 s)", links1 === links0, { atReadyPlus3s: links0, after2Laps: links1 });
    }
  } finally {
    await ctx.close();
  }
}

/** P11: device and orb centres project into their DOM slots (?probe=1 → window.__cam) */
async function groupFraming(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { label: "framing" });
  try {
    await home(page, "?probe=1&freeze=1");
    if (!(await waitReady(page, 12000))) return R.check("P11", "the world mounted", false);
    await sleep(2500);
    if (!(await page.evaluate(() => !!window.__cam))) return R.check("P11", "window.__cam exposed under ?probe=1 (Lane E)", false);
    const project = (world, slot) =>
      page.evaluate(({ world, slot }) => {
        const c = window.__cam;
        c.updateMatrixWorld?.();
        const V = c.matrixWorldInverse.elements, P = c.projectionMatrix.elements;
        const mul = (m, v) => [0, 1, 2, 3].map((r) => m[r] * v[0] + m[4 + r] * v[1] + m[8 + r] * v[2] + m[12 + r] * v[3]);
        const clip = mul(P, mul(V, [...world, 1]));
        const cv = [...document.querySelectorAll("canvas")].find((x) => !x.closest("#loop-root, main")).getBoundingClientRect();
        const sx = cv.left + ((clip[0] / clip[3] + 1) / 2) * cv.width, sy = cv.top + ((1 - clip[1] / clip[3]) / 2) * cv.height;
        const el = slot === null ? null : slot === "orb" ? document.querySelector('[data-frame-slot="orb"]') : document.querySelectorAll("#projects article")[slot]?.querySelector('[data-frame-slot="device"]');
        const q = el?.getBoundingClientRect();
        return { sx, sy, slot: q ? { cx: q.left + q.width / 2, cy: q.top + q.height / 2, w: q.width, h: q.height } : null, view: c.view?.enabled ?? false, zoom: c.zoom };
      }, { world, slot });
    const heroP = await project([0, 0, 0], null);
    R.check("P11", "hero: no view offset", heroP.view === false, heroP);
    const A = await anchors(page);
    for (let i = 0; i < A.articles.length; i++) {
      await scrollTo(page, A.articles[i]);
      await settle(page);
      await sleep(2200);
      const p = await project([VOIDP[0], VOIDP[1] - i * SPACING, VOIDP[2]], i);
      if (!p.slot) {
        R.check("P11", `project ${i + 1}: device slot present`, false);
        continue;
      }
      const dx = p.sx - p.slot.cx, dy = p.sy - p.slot.cy;
      R.check("P11", `project ${i + 1}: device centre within its slot ±8 px`, Math.abs(dx) <= 8 && Math.abs(dy) <= 8, { dx: +dx.toFixed(1), dy: +dy.toFixed(1), zoom: p.zoom });
      await R.shot(page, `P11-project-${i + 1}`);
    }
    await scrollTo(page, A.contact);
    await settle(page);
    await sleep(2200);
    const o = await project([SERVER[0] + ORB_POS[0], SERVER[1] + ORB_POS[1], SERVER[2] + ORB_POS[2]], "orb");
    if (o.slot) R.check("P11", "contact: orb centre within its slot ±8 px", Math.abs(o.sx - o.slot.cx) <= 8 && Math.abs(o.sy - o.slot.cy) <= 8, { dx: +(o.sx - o.slot.cx).toFixed(1), dy: +(o.sy - o.slot.cy).toFixed(1) });
    else R.check("P11", "contact: orb slot present", false);
    await R.shot(page, "P11-contact");
  } finally {
    await ctx.close();
  }
}

/** P12: the settle after a release (programmatic scroll + scrollend stands in for the release) */
async function groupSettle(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { label: "settle" });
  try {
    await home(page);
    await waitReady(page, 12000);
    await sleep(1500);
    const vh = await svh(page);
    const A = await anchors(page);
    const limit = A.limit;
    const st = A.stations;
    const segs = st.slice(0, -1).map((a, i) => {
      const b = st[i + 1];
      const end = Math.min(b.top, limit);
      return { from: a.id, to: b.id, start: a.top, end, holdEnd: Math.max(a.top, end - WINDOW_VH * vh) };
    });
    const seg = (id) => segs.find((s) => s.from === id);
    const release = async (y) => {
      await scrollTo(page, y);
      await sleep(80);
      await settle(page, 700, 5000);
      return page.evaluate(() => Math.round(scrollY));
    };
    const ap = seg("about");
    if (ap) {
      const y3 = ap.holdEnd + 0.3 * (ap.end - ap.holdEnd);
      const r3 = await release(y3);
      R.check("P12", "about→projects released at local 0.3 → holdEnd ±4", Math.abs(r3 - ap.holdEnd) <= 4, { from: Math.round(y3), to: r3, holdEnd: Math.round(ap.holdEnd) });
      const y7 = ap.holdEnd + 0.7 * (ap.end - ap.holdEnd);
      const r7 = await release(y7);
      R.check("P12", "about→projects released at local 0.7 → the flight end ±4", Math.abs(r7 - ap.end) <= 4, { from: Math.round(y7), to: r7, end: ap.end });
      const yh = ap.start + 0.3 * (ap.holdEnd - ap.start);
      const rh = await release(yh);
      R.check("P12", "the About hold does not move", Math.abs(rh - Math.round(yh)) <= 1, { from: Math.round(yh), to: rh });
    } else R.check("P12", "about segment found", false);
    if (A.articles.length >= 2) {
      const [a0, a1] = A.articles;
      const rs = await release(a0 + 0.4 * (a1 - a0));
      R.check("P12", "0.4 of the way between stops → the nearest stop", Math.abs(rs - a0) <= 4, { to: rs, stop: a0 });
    }
    if (A.contact != null) {
      const rc = await release(A.contact + 0.6 * vh);
      R.check("P12", "contact at +0.6·svh → +0.5·svh", Math.abs(rc - (A.contact + 0.5 * vh)) <= 4, { to: rc, want: Math.round(A.contact + 0.5 * vh) });
    }
    await page.evaluate(() => {
      window.__ppWrapped = 0;
      new MutationObserver(() => document.documentElement.hasAttribute("data-wrapped") && window.__ppWrapped++).observe(document.documentElement, { attributes: true, attributeFilter: ["data-wrapped"] });
    });
    const rw = await release(0.975 * limit);
    await sleep(600);
    const wr = await page.evaluate(() => ({ y: Math.round(scrollY), wrapped: window.__ppWrapped }));
    R.check("P12", "> 97 % into the clone → wraps to 0 (laps + 1: html[data-wrapped])", wr.y <= 4 && wr.wrapped > 0, { settledAt: rw, ...wr });
  } finally {
    await ctx.close();
  }
  // static (reduced motion) never settles
  const { ctx: c2, page: p2 } = await newPage(engine, dev, R, { ctx: { reducedMotion: "reduce" }, label: "settle-static" });
  try {
    await home(p2);
    await sleep(2000);
    const A = await anchors(p2);
    const y = Math.round(A.about + 0.5 * ((A.articles[0] ?? A.projects) - A.about) + 0.3 * 0.85 * dev.h);
    await scrollTo(p2, y);
    await sleep(1500);
    const r = await p2.evaluate(() => ({ y: Math.round(scrollY), mode: document.documentElement.dataset.loop }));
    R.check("P12", "static mode never settles", r.mode === "static" && Math.abs(r.y - y) <= 1, { ...r, from: y });
  } finally {
    await c2.close();
  }
}

/** P13: the clone frame vs the hero frame (?freeze=1), manifesto lines, no scramble after a wrap */
async function groupSeam(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { label: "seam" });
  try {
    await home(page, "?freeze=1");
    await waitReady(page, 12000);
    await sleep(2000);
    const lines = (sel) =>
      page.evaluate(({ sel, text }) => {
        const root = document.querySelector(sel);
        if (!root) return null;
        const norm = (s) => s.replace(/\s+/g, " ").trim();
        const el = [...root.querySelectorAll("p, span, div")].find((n) => norm(n.textContent ?? "") === norm(text) && n.children.length >= 0);
        if (!el) return null;
        const out = new Map();
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          for (let i = 0; i < n.nodeValue.length; i++) {
            const r = document.createRange();
            r.setStart(n, i);
            r.setEnd(n, i + 1);
            const q = r.getClientRects()[0];
            if (!q) continue;
            const k = Math.round((q.top - root.getBoundingClientRect().top) / 3);
            out.set(k, (out.get(k) ?? "") + n.nodeValue[i]);
          }
        }
        return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v.replace(/\s+/g, " ").trim()).filter(Boolean);
      }, { sel, text: MANIFESTO });
    const limit = (await anchors(page)).limit;
    // the clone first (the first-run cue is gone for good after 24 px), with the wrap held off for the capture
    await page.evaluate(() => {
      window.__ppHoldWrap = (e) => e.stopImmediatePropagation();
      window.addEventListener("scrollend", window.__ppHoldWrap, { capture: true });
    });
    await scrollTo(page, limit);
    await sleep(1800);
    const cloneLines = await lines('[data-station="hero-clone"]');
    const at = await page.evaluate(() => ({ y: scrollY, cloneTop: +document.querySelector('[data-station="hero-clone"]').getBoundingClientRect().top.toFixed(2) }));
    const bPath = path.join(R.dir, "10-clone.png");
    await page.screenshot({ path: bPath });
    await page.evaluate(() => window.removeEventListener("scrollend", window.__ppHoldWrap, { capture: true }));
    await scrollTo(page, 0);
    await settle(page);
    await sleep(2200);
    const heroLines = await lines("#hero");
    const aPath = path.join(R.dir, "11-hero.png");
    await page.screenshot({ path: aPath });
    R.check("P13", "hero and clone manifesto lines are identical", !!heroLines && JSON.stringify(heroLines) === JSON.stringify(cloneLines), { hero: heroLines, clone: cloneLines });
    const a = PNG.sync.read(fs.readFileSync(aPath));
    const b = PNG.sync.read(fs.readFileSync(bPath));
    const diff = new PNG({ width: a.width, height: a.height });
    const bad = a.width === b.width && a.height === b.height ? pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 }) : a.width * a.height;
    fs.writeFileSync(path.join(R.dir, "seam-diff.png"), PNG.sync.write(diff));
    const pct = (100 * bad) / (a.width * a.height);
    R.check("P13", "seam pixel diff < 1 %", pct < 1, { pct: +pct.toFixed(3), limit, ...at });
    // a real wrap: no scramble glyphs in the hero for 1.2 s
    await page.evaluate(() => {
      window.__ppG = 0;
      window.__ppWrapAt = null;
      new MutationObserver((ms) => {
        for (const m of ms) if (m.type === "attributes" && m.attributeName === "data-g" && m.target.hasAttribute("data-g") && window.__ppWrapAt && performance.now() - window.__ppWrapAt < 1200) window.__ppG++;
      }).observe(document.getElementById("hero"), { attributes: true, subtree: true, attributeFilter: ["data-g"] });
      new MutationObserver(() => document.documentElement.hasAttribute("data-wrapped") && (window.__ppWrapAt = performance.now())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-wrapped"] });
    });
    await scrollTo(page, limit);
    await sleep(2000);
    const w = await page.evaluate(() => ({ y: Math.round(scrollY), wrapAt: window.__ppWrapAt, g: window.__ppG }));
    R.check("P13", "after a wrap: no [data-g] in the hero within 1.2 s", w.wrapAt !== null && w.g === 0, w);
  } finally {
    await ctx.close();
  }
}

/** P14: Dock jumps, reduced-motion jumps, Back to the project stop, the monogram */
async function groupNav(engine, dev, R) {
  const trackJump = async (page, tab) => {
    await page.evaluate(() => {
      window.__pp.track = [];
      window.__ppVeil = [];
      const v = document.querySelector("[data-jump-veil]");
      if (v) new MutationObserver(() => window.__ppVeil.push([performance.now(), v.hasAttribute("data-on")])).observe(v, { attributes: true, attributeFilter: ["data-on"] });
    });
    await tapEl(page, tab);
    await sleep(2200);
    await settle(page);
    return page.evaluate(() => {
      const t = window.__pp.track;
      window.__pp.track = null;
      const ys = [...new Set(t.map((x) => x[1]))];
      const on = window.__ppVeil.find((x) => x[1])?.[0] ?? null;
      const off = window.__ppVeil.filter((x) => !x[1]).at(-1)?.[0] ?? null;
      return { y: Math.round(scrollY), distinct: ys.length, veil: on === null ? null : Math.round((off ?? performance.now()) - on) };
    });
  };
  {
    const { ctx, page } = await newPage(engine, dev, R, { label: "nav" });
    try {
      await home(page);
      await waitReady(page, 12000);
      await sleep(1500);
      const A = await anchors(page);
      const about = await dockTab(page, DOCK.about);
      if (about) {
        const j = await trackJump(page, about);
        R.check("P14", "adjacent tab (Home → About): a smooth scroll, no veil", j.distinct >= 4 && j.veil === null, j);
        R.check("P14", "adjacent tab ends at the station top ±4", Math.abs(j.y - A.about) <= 4, { y: j.y, top: A.about });
      } else R.check("P14", `Dock tab '${DOCK.about}' found`, false);
      const contact = await dockTab(page, DOCK.contact);
      if (contact) {
        const j = await trackJump(page, contact);
        R.check("P14", "far tab (About → Contact): the veil shows ≤ 400 ms", j.veil !== null && j.veil <= 400, j);
        R.check("P14", "far tab: an instant cut (no intermediate scroll positions)", j.distinct <= 3, j.distinct);
        R.check("P14", "far tab ends at the station top ±4", Math.abs(j.y - A.contact) <= 4 || Math.abs(j.y - (A.contact + 0.5 * dev.h)) <= 4, { y: j.y, top: A.contact });
      } else R.check("P14", `Dock tab '${DOCK.contact}' found`, false);
      // Back from each project page lands on its stop
      for (let i = 0; i < SLUGS.length; i++) {
        const slug = SLUGS[i];
        await scrollTo(page, 0);
        await settle(page);
        const top = (await anchors(page)).articles[i];
        await scrollTo(page, top);
        await settle(page);
        await sleep(900);
        const link = await page.$(`#project-${slug} a[href="/projects/${slug}"]:not([aria-hidden="true"])`);
        if (!link) {
          R.check("P14", `${slug}: 'Open project' link found`, false);
          continue;
        }
        await tapEl(page, link);
        await page.waitForURL(`**/projects/${slug}`, { timeout: 8000 }).catch(() => {});
        await sleep(1500);
        await page.goBack();
        await sleep(150);
        const early = await page.evaluate(() => Math.round(scrollY));
        await sleep(1500);
        const y = await page.evaluate(() => Math.round(scrollY));
        const A2 = await anchors(page);
        R.check("P14", `Back from /projects/${slug} lands on #project-${slug} ±2 (no flight)`, Math.abs(y - A2.articles[i]) <= 2 && Math.abs(early - A2.articles[i]) <= 2, { y, at150ms: early, want: A2.articles[i] });
        if (i === 0) await R.shot(page, "15-back-restored");
      }
      // the monogram on a project page goes to the hero
      await page.goto(`${BASE}/projects/${SLUGS[0]}`, { waitUntil: "load" });
      await sleep(1200);
      const mono = await page.$('[data-hud] a[href="/"]');
      if (mono) {
        await tapEl(page, mono);
        await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 8000 }).catch(() => {});
        await sleep(1500);
        R.check("P14", "the monogram goes to the hero", await page.evaluate(() => location.pathname === "/" && scrollY < 4));
      } else R.check("P14", "monogram link found", false);
    } finally {
      await ctx.close();
    }
  }
  // the camera across route changes (?probe=1 → window.__cam): opening a project from its stop never leaves the
  // device stack and parks at that project's own device; from a project page every Dock tab and '← Back to
  // projects' cut to the target station, with no excursion past the start or the end pose (no route flight)
  {
    const { ctx, page } = await newPage(engine, dev, R, { label: "nav-cam" });
    try {
      const camStart = () =>
        page.evaluate(() => {
          window.__ppCam = [];
          const t0 = performance.now();
          const tick = () => {
            if (window.__cam) window.__ppCam.push(+window.__cam.position.y.toFixed(2));
            if (performance.now() - t0 < 2600) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      const camRead = () => page.evaluate(() => window.__ppCam);
      await home(page, "?probe=1");
      if (!(await waitReady(page, 15000)) || !(await page.evaluate(() => !!window.__cam))) {
        R.note("P14", "world not ready or window.__cam missing: camera checks skipped");
        return;
      }
      await sleep(1200);
      const A = await anchors(page);
      const targets = [
        { name: "'← Back to projects'", sel: ".st-back", station: "projects" },
        { name: `Dock '${DOCK.hero}'`, tab: DOCK.hero, station: "hero" },
        { name: `Dock '${DOCK.about}'`, tab: DOCK.about, station: "about" },
        { name: `Dock '${DOCK.projects}'`, tab: DOCK.projects, station: "projects" },
        { name: `Dock '${DOCK.contact}'`, tab: DOCK.contact, station: "contact" },
      ];
      for (let k = 0; k < targets.length; k++) {
        const i = k % SLUGS.length;
        const slug = SLUGS[i];
        await scrollTo(page, A.articles[i]);
        await settle(page);
        await sleep(1500);
        const link = await page.$(`#project-${slug} a[href="/projects/${slug}"]:not([aria-hidden="true"])`);
        if (!link) {
          R.check("P14", `${slug}: 'Open project' link found`, false);
          continue;
        }
        await camStart();
        await tapEl(page, link);
        await page.waitForURL(`**/projects/${slug}`, { timeout: 8000 }).catch(() => {});
        await sleep(2700);
        const open = await camRead();
        const want = VOIDP[1] - i * SPACING;
        if (k < SLUGS.length)
          R.check("P14", `open ${slug} from its stop: the camera stays in the device stack (y < -30) and parks at device ${i}`, open.length > 10 && Math.max(...open) < -30 && Math.abs(open.at(-1) - want) < 1, { max: Math.max(...open), end: open.at(-1), want, frames: open.length });
        const t = targets[k];
        const el = t.sel ? await page.$(t.sel) : await dockTab(page, t.tab);
        if (!el) {
          R.check("P14", `${t.name} found on /projects/${slug}`, false);
          continue;
        }
        await camStart();
        await tapEl(page, el);
        await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 8000 }).catch(() => {});
        await sleep(2700);
        const ys = await camRead();
        const land = await page.evaluate(() => ({ y: Math.round(scrollY), current: document.querySelector("[data-phone-dock] [aria-current]")?.textContent ?? "" }));
        const top = t.station === "hero" ? 0 : A[t.station];
        const y0 = ys[0], y1 = ys.at(-1);
        const hi = Math.max(y0, y1) + 0.5, lo = Math.min(y0, y1) - 0.5;
        R.check(
          "P14",
          `${t.name} from /projects/${slug}: lands on ${t.station} with a camera cut (no excursion past either pose)`,
          ys.length > 10 && Math.abs(land.y - top) <= 4 && land.current.includes(DOCK[t.station]) && Math.max(...ys) <= hi && Math.min(...ys) >= lo,
          { scrollY: land.y, want: top, current: land.current, camFrom: y0, camTo: y1, camMax: Math.max(...ys), camMin: Math.min(...ys) },
        );
      }
    } finally {
      await ctx.close();
    }
  }
  {
    const { ctx, page } = await newPage(engine, dev, R, { ctx: { reducedMotion: "reduce" }, label: "nav-reduced" });
    try {
      await home(page);
      await sleep(2000);
      const contact = await dockTab(page, DOCK.contact);
      if (contact) {
        const j = await trackJump(page, contact);
        R.check("P14", "reduced motion: jumps are instant, no veil", j.distinct <= 2 && j.veil === null, j);
      }
    } finally {
      await ctx.close();
    }
  }
}

/** P15: the Index sheet */
async function groupSheet(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { label: "sheet" });
  try {
    await home(page);
    await sleep(2500);
    const closedHasStatus = await page.evaluate(() => /SYS OK/.test(document.body.textContent ?? ""));
    R.check("P15", "closed: StatusLine not mounted", !closedHasStatus);
    if (!(await openSheet(page))) return R.check("P15", "the sheet opens as a modal dialog", false);
    const s = await page.evaluate(() => {
      const d = document.querySelector("dialog[data-index-sheet][open]");
      return { focusInside: d.contains(document.activeElement), status: /SYS OK/.test(d.textContent ?? ""), modal: d.matches(":modal") };
    });
    R.check("P15", "opens modal with focus inside", s.modal && s.focusInside, s);
    R.check("P15", "open: StatusLine + Clock mounted", s.status);
    const escaped = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      // past the last control, a modal dialog hands focus to the browser UI (activeElement = body): not an escape
      const where = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body || a === document.documentElement) return "browser";
        return document.querySelector("dialog[open]")?.contains(a) ? "sheet" : `${a.tagName.toLowerCase()} "${(a.textContent ?? "").trim().slice(0, 20)}"`;
      });
      if (where !== "sheet" && where !== "browser") escaped.push(where);
    }
    R.check("P15", "focus never reaches the page behind the sheet (40 Tabs)", escaped.length === 0, escaped.slice(0, 4));
    try {
      const axe = await new AxeBuilder({ page }).analyze();
      const v = axe.violations.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.length }));
      R.check("P15", "axe: 0 violations with the sheet open", v.length === 0, v);
    } catch (e) {
      R.note("P15", `axe failed to run: ${String(e).slice(0, 120)}`);
    }
    // Still toggles static; Sound flips; Haptics only where vibrate exists
    const still = (await switchFor(page, "Still")).asElement();
    if (still) {
      await still.evaluate((n) => n.click());
      await sleep(400);
      const m1 = await page.evaluate(() => document.documentElement.dataset.loop);
      await still.evaluate((n) => n.click());
      await sleep(400);
      const m2 = await page.evaluate(() => document.documentElement.dataset.loop);
      R.check("P15", "Still toggles html[data-loop] static ⇄ touch-wrap", m1 === "static" && m2 === "touch-wrap", [m1, m2]);
    } else R.check("P15", "Still switch found", false);
    const sound = (await switchFor(page, "Sound")).asElement();
    if (sound) {
      const checked = () => sound.evaluate((n) => (n.matches("input") ? n.checked : n.getAttribute("aria-checked") === "true"));
      const a = await checked();
      await sound.evaluate((n) => n.click());
      await sleep(200);
      const b = await checked();
      await sound.evaluate((n) => n.click());
      R.check("P15", "Sound switch toggles", a !== b, [a, b]);
    } else R.check("P15", "Sound switch found", false);
    const hasVibrate = await page.evaluate(() => typeof navigator.vibrate === "function");
    const haptics = !!(await switchFor(page, "Haptics")).asElement();
    R.check("P15", `Haptics row only where vibrate exists (vibrate: ${hasVibrate})`, haptics === hasVibrate, { hasVibrate, haptics });
    await R.shot(page, "12-sheet");
    await page.keyboard.press("Escape");
    await sleep(500);
    const e = await page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), menu: document.activeElement?.hasAttribute("data-phone-menu") ?? false, status: /SYS OK/.test(document.body.textContent ?? "") }));
    R.check("P15", "Esc closes and focus returns to Menu", !e.open && e.menu, e);
    R.check("P15", "closed again: StatusLine unmounted", !e.status);
    await openSheet(page);
    const x = await page.$('dialog[open] button[aria-label*="lose" i], dialog[open] button[aria-label*="Close" i]');
    if (x) {
      await x.click();
      await sleep(500);
      const c = await page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), menu: document.activeElement?.hasAttribute("data-phone-menu") ?? false }));
      R.check("P15", "× closes and focus returns to Menu", !c.open && c.menu, c);
    } else R.check("P15", "× close button found", false);
  } finally {
    await ctx.close();
  }
}

/** P16: reduced motion */
async function groupReduced(engine, dev, R, cdpDrag = true) {
  const { ctx, page, cdp } = await newPage(engine, dev, R, { ctx: { reducedMotion: "reduce" }, label: "reduced" });
  try {
    await home(page, "?probe=1");
    // fx.develop (window.__fx under ?probe=1) sampled every frame from load until 1.5 s after world-ready
    await page.evaluate(() => {
      const w = window;
      w.__devMin = 1;
      w.__devSeen = 0;
      const t0 = performance.now();
      const tick = () => {
        if (w.__fx) {
          w.__devSeen++;
          w.__devMin = Math.min(w.__devMin, w.__fx.develop);
        }
        const ready = performance.getEntriesByName("world-ready")[0];
        if ((ready && performance.now() - ready.startTime < 1500) || (!ready && performance.now() - t0 < 12000)) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await waitReady(page, 12000);
    await sleep(1600);
    const devx = await page.evaluate(() => ({ seen: window.__devSeen, min: window.__devMin }));
    R.check("P16", "fx.develop stays 1 (sampled each frame through world-ready + 1.5 s)", devx.seen > 0 && devx.min === 1, devx);
    await sleep(900);
    const s = await page.evaluate(() => ({
      loop: document.documentElement.dataset.loop,
      clone: document.querySelectorAll('[data-station="hero-clone"]').length,
      captions: document.getAnimations().filter((a) => a.effect?.target?.closest?.(".dissolve, .reveal, .scrub")).map((a) => a.animationName ?? a.id),
    }));
    R.check("P16", "html[data-loop=static]", s.loop === "static", s.loop);
    R.check("P16", "no hero clone", s.clone === 0, s.clone);
    R.check("P16", "no caption animations", s.captions.length === 0, s.captions.slice(0, 4));
    // a fast flick never recedes the Dock
    const dockState = () =>
      page.evaluate(() => {
        const d = document.querySelector("[data-phone-dock]");
        if (!d) return null;
        const r = d.getBoundingClientRect();
        return { top: Math.round(r.top), op: +getComputedStyle(d).opacity };
      });
    const before = await dockState();
    if (cdp && cdpDrag) {
      const pt = await safePoint(page);
      await drag(cdp, pt.x, Math.round(dev.h * 0.8), Math.round(dev.h * 0.2), 120);
    } else await page.evaluate(() => window.scrollBy(0, innerHeight * 0.8));
    await sleep(150);
    const during = await dockState();
    R.check("P16", "a fast flick does not recede the Dock", !!before && !!during && Math.abs(during.top - before.top) <= 1 && during.op >= 0.95, { before, during });
    if (await openSheet(page)) {
      const still = (await switchFor(page, "Still")).asElement();
      const st = still ? await still.evaluate((el) => ({ checked: el.checked, disabled: el.disabled })) : null;
      R.check("P16", "Still is checked and disabled", !!st && st.checked && st.disabled, st);
      await R.shot(page, "reduced-sheet");
      await closeSheet(page);
    }
    await scrollTo(page, 0);
    await sleep(600);
    await R.shot(page, "reduced-hero");
  } finally {
    await ctx.close();
  }
}

/** P17: no WebGL */
async function groupNoGL(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { flags: { noWebGL: true }, label: "no-webgl" });
  try {
    await home(page);
    await sleep(5000);
    R.check("P17", "content readable: the H1 is visible", await visible(page, "#hero h1"));
    R.check("P17", "the Dock is visible", await visible(page, "[data-phone-dock]"));
    await R.shot(page, "nogl-hero");
    const A = await anchors(page);
    await scrollTo(page, A.articles[0] ?? A.projects);
    await settle(page);
    await sleep(800);
    R.check("P17", "a DeviceCard fills the project slot", await visible(page, "#projects article [data-device-card]"));
    await R.shot(page, "nogl-project");
    await scrollTo(page, A.contact);
    await settle(page);
    await sleep(800);
    const icon = await page.evaluate(() => {
      const s = document.querySelector('[data-frame-slot="orb"] svg');
      const r = s?.getBoundingClientRect();
      return r ? { w: Math.round(r.width), h: Math.round(r.height), vis: getComputedStyle(s).visibility !== "hidden" } : null;
    });
    R.check("P17", "the orb slot shows the 96 px DOM icon", !!icon && icon.vis && Math.abs(icon.w - 96) <= 4, icon);
    await R.shot(page, "nogl-contact");
    const opened = await openSheet(page);
    R.check("P17", "the sheet opens", opened);
    if (opened) {
      await closeSheet(page);
      R.check("P17", "…and closes", !(await page.evaluate(() => !!document.querySelector("dialog[open]"))));
    }
  } finally {
    await ctx.close();
  }
}

/** P21: context loss (WEBGL_lose_context): a silent remount, then the static stand-ins */
async function groupContextLoss(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { flags: { blackout: true }, label: "ctx-loss" });
  try {
    await home(page);
    if (!(await waitReady(page, 12000))) return R.check("P21", "the world mounted", false);
    await sleep(2000);
    // a GPU reset: the context is lost, then the browser restores it (WEBGL_lose_context needs the explicit restore)
    const lose = () =>
      page.evaluate(() => {
        const c = [...document.querySelectorAll("canvas")].find((x) => !x.closest("#loop-root, main") && !x.dataset.ppLost);
        if (!c) return "no canvas";
        const gl = c.getContext("webgl2") ?? c.getContext("webgl");
        const ext = gl?.getExtension("WEBGL_lose_context");
        if (!ext) return "no WEBGL_lose_context";
        c.dataset.ppLost = "1";
        ext.loseContext();
        setTimeout(() => ext.restoreContext(), 500);
        return "lost";
      });
    R.check("P21", "first loss triggered", (await lose()) === "lost");
    const re = await page
      .waitForFunction(() => {
        const fresh = [...document.querySelectorAll("canvas")].some((x) => !x.closest("#loop-root, main") && !x.dataset.ppLost);
        return performance.getEntriesByName("world-ready").length >= 2 || fresh;
      }, null, { timeout: 12000 })
      .then(() => true)
      .catch(() => false);
    R.check("P21", "first loss: a silent remount (new canvas / world-ready)", re);
    const b1 = await page.evaluate(() => window.__pp.blackout);
    R.check("P21", "first loss: no overlay, content untouched", b1.length === 0 && (await visible(page, "#hero h1")), b1.slice(0, 3));
    await sleep(2500);
    R.check("P21", "second loss triggered", (await lose()) === "lost");
    await sleep(3000);
    const A = await anchors(page);
    await scrollTo(page, A.articles[0] ?? A.projects);
    await settle(page);
    await sleep(900);
    R.check("P21", "second loss: static stand-ins (DeviceCard visible)", await visible(page, "#projects article [data-device-card]"));
    await R.shot(page, "ctx-loss-2-project");
  } finally {
    await ctx.close();
  }
}

/** P19 (+P1): desktop and iPad show no phone UI and register no service worker */
async function groupControl(engine, dev, R) {
  const { ctx, page } = await newPage(engine, dev, R, { label: "control" });
  try {
    await home(page);
    if (!dev.fine) {
      const pt = await safePoint(page);
      await tap(page, pt.x, pt.y).catch(() => {});
    }
    await sleep(7000);
    const s = await page.evaluate(async (q) => {
      const shown = (el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.display !== "none" && cs.visibility !== "hidden" && r.width > 0 && r.height > 0;
      };
      const phoneOnly = ["[data-phone-dock]", "[data-index-sheet]", "[data-first-run-hint]", "[data-install-hint]", "[data-jump-veil]"];
      const hiddenOnly = ["[data-glow-poster]", "[data-device-card]", "[data-hero-scrim]", "[data-social-grid]", '[data-frame-slot]'];
      return {
        gate: matchMedia(q).matches,
        phoneNodes: phoneOnly.filter((s) => document.querySelector(s)),
        phoneVisible: hiddenOnly.filter((s) => [...document.querySelectorAll(s)].some(shown)),
        sw: "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0,
        prompt: typeof window.__pwaPrompt,
        navPill: !!document.querySelector(".nav-pill") && shown(document.querySelector(".nav-pill")),
      };
    }, PHONE_MQ);
    R.check("P1", "PHONE_MQ does not match", s.gate === false, s.gate);
    R.check("P19", "no phone-only nodes", s.phoneNodes.length === 0, s.phoneNodes);
    R.check("P19", "phone-only stand-ins are display:none", s.phoneVisible.length === 0, s.phoneVisible);
    R.check("P19", "no service worker registration", s.sw === 0, s.sw);
    R.check("P19", "no install prompt capture", s.prompt === "undefined", s.prompt);
    R.check("P19", "the desktop NavPill is visible", s.navPill);
    await R.shot(page, "control-hero");
  } finally {
    await ctx.close();
  }
}

// ================================================================= run
const results = [];
const t0 = Date.now();
async function guarded(R, label, fn) {
  try {
    await fn();
  } catch (e) {
    R.check(label, `${label} group ran to completion`, false, String(e?.stack ?? e).slice(0, 500));
  }
}
try {
  const up = await fetch(`${BASE}/`).then((r) => r.status).catch(() => 0);
  if (up !== 200) throw new Error(`${BASE}/ answered ${up || "nothing"}: start a production server first (npx next start -p 3112)`);
  for (const engine of engines) {
    for (const dev of [...PHONES, ...CONTROLS]) {
      if (!dev.engines.includes(engine) || (DEV_FILTER && !DEV_FILTER.includes(dev.key))) continue;
      console.log(`\n=== ${engine} ${dev.key}`);
      const R = new Result(engine, dev);
      if (dev.control) {
        if (want("P1") || want("P19")) await guarded(R, "P19", () => groupControl(engine, dev, R));
      } else {
        if (want("P2") && !dev.layoutOnly) await guarded(R, "P2", () => groupSSR(engine, dev, R));
        if (want("P2") && engine === "chromium" && !dev.land && !dev.layoutOnly) await guarded(R, "P2", () => groupLcp(engine, dev, R));
        if (want("P1") || want("P2") || want("P10") || want("P18")) await guarded(R, "P10", () => groupLayout(engine, dev, R));
        const deep = dev.deep?.includes(engine);
        if (deep) {
          if (want("P3") || want("P4")) await guarded(R, "P3", () => groupBoot(engine, dev, R));
          if (want("P5")) await guarded(R, "P5", () => groupIdle(engine, dev, R));
          if (want("P6")) await guarded(R, "P6", () => groupPerf(engine, dev, R));
          if (want("P7") || want("P8") || want("P9")) await guarded(R, "P7", () => groupRender(engine, dev, R));
          if (want("P12")) await guarded(R, "P12", () => groupSettle(engine, dev, R));
          if (want("P13")) await guarded(R, "P13", () => groupSeam(engine, dev, R));
          if (want("P14")) await guarded(R, "P14", () => groupNav(engine, dev, R));
          if (want("P15")) await guarded(R, "P15", () => groupSheet(engine, dev, R));
          if (want("P16")) await guarded(R, "P16", () => groupReduced(engine, dev, R));
          if (want("P17")) await guarded(R, "P17", () => groupNoGL(engine, dev, R));
          if (want("P21") && engine === "chromium") await guarded(R, "P21", () => groupContextLoss(engine, dev, R));
        }
        if (want("P11") && dev.framing && (deep || engine === "chromium")) await guarded(R, "P11", () => groupFraming(engine, dev, R));
      }
      if (want("P20")) R.check("P20", "zero pageerror / console.error in every run", R.errors.length === 0, R.errors.slice(0, 6));
      R.save();
      results.push({ engine, device: dev.key, pass: R.pass, failed: Object.entries(R.checks).flatMap(([p, cs]) => cs.filter((c) => !c.pass).map((c) => `${p} ${c.name}`)) });
    }
  }
} catch (e) {
  results.push({ fatal: String(e?.stack ?? e).slice(0, 1000) });
  console.error(`FATAL: ${e}`);
} finally {
  await chromeB?.close().catch(() => {});
  await webkitB?.close().catch(() => {});
}
const pass = results.length > 0 && results.every((r) => r.pass);
const report = { base: BASE, at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), engines, only: ONLY ?? "all", pass, results };
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log(`\nphone-probe: ${pass ? "PASS" : "FAIL"} in ${report.seconds} s → ${path.join(OUT, "report.json")}`);
for (const r of results) if (!r.pass) console.log(`  ${r.engine ?? ""} ${r.device ?? ""}: ${r.fatal ?? r.failed.slice(0, 12).join(" | ")}`);
process.exit(pass ? 0 : 1);
