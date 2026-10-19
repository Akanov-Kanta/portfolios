// Desktop (and iPad) pixel baseline for the mobile work: proves non-phones stay unchanged.
//
//   node scripts/desktop-baseline.mjs [baseUrl]              capture the reference set  → <ART>/baseline/desktop/
//                                                            (serve the reference tree, e.g. main, for this one)
//   node scripts/desktop-baseline.mjs [baseUrl] --noise     re-capture, diff vs the reference, fold the per-shot
//                                                            diff into <ART>/baseline/noise.json (max over runs)
//   node scripts/desktop-baseline.mjs [baseUrl] --compare    re-capture, diff vs the reference → <ART>/final/desktop-diff/
//                                                            (diff PNGs + report.json); exits 1 when a shot's best of up
//                                                            to --runs loads exceeds max(1.5 × noise, 0.1 % px), or a run
//                                                            logged errors (see the note at the --compare code)
// Options: --only=1440x900,ipad-820x1180 (profiles)  --runs=5 (compare)  --headless  SETTLE=<ms> env (default 1800)
//          --art=<dir>: where the reference, the noise record and the diffs live (default test-results/desktop-baseline,
//          ignored by the repo; --noise and --compare need a reference there, or an --art that holds one)
//
// Profiles: 1440x900 and 1280x800 fine-pointer contexts, iPad 820x1180 (hasTouch, isMobile, DPR 2: tapped once so
// the world mounts). Shots, all with ?freeze=1 (intro skipped, time-based motion held): hero, about, project stops
// 1–3, contact, the clone seam, and /projects/glassbox top. Scrolls go through window.__lenis (loop mode) or
// native scrollTo (touch-wrap on the iPad), after world-ready + the intro + 1 s.
// Harness-only determinism: Date is pinned (the HUD clock, the device-label TEMP line) and Math.random is seeded
// (the anchored-label telemetry); the app itself is untouched.
// A machine in use: the run never drives a mouse, but a real cursor over the headed window does reach the page
// (camera parallax, a wheel that scrolls). The harness swallows trusted mouse input before any page script sees
// it (touch pointers and the iPad intent tap pass), the headed window opens off to the side, and --compare does
// not count the errors of a load that saw mouse input anyway (its shots still count: a disturbed load only diffs
// worse, and a failing shot is re-captured on the next load).
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3111").replace(/\/$/, "");
const ART = path.resolve(opt("art") ?? "test-results/desktop-baseline");
const MODE = flag("compare") ? "compare" : flag("noise") ? "noise" : "baseline";
const REF = path.join(ART, "baseline", "desktop");
const NOISE_JSON = path.join(ART, "baseline", "noise.json");
const DIFF_DIR = path.join(ART, "final", "desktop-diff");
/** a shot passes --compare within max(NOISE_K × its Step 0 noise, FLOOR_PCT) */
const NOISE_K = 1.5;
const FLOOR_PCT = 0.1;
/** ms after each scroll before the capture (camera damping, labels typing on, reveals) */
const SETTLE = Number(process.env.SETTLE ?? 1800);

// desktop DPR pinned to 2 (a Retina Mac, as the site is viewed here) so a different attached display can't shift the baseline
const PROFILES = [
  { key: "1440x900", ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } },
  { key: "1280x800", ctx: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 } },
  { key: "ipad-820x1180", touch: true, ctx: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
];
const only = opt("only")?.split(",");
let profiles = only ? PROFILES.filter((p) => only.includes(p.key)) : PROFILES;
const SHOTS = ["hero", "about", "project-1", "project-2", "project-3", "contact", "seam", "detail"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pinned Date + seeded Math.random, installed before any page script. */
function harness() {
  const FIXED = Date.UTC(2026, 0, 1, 9, 0, 0);
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...a) {
      if (a.length === 0) super(FIXED);
      else super(...a);
    }
    static now() {
      return FIXED;
    }
  }
  window.Date = FixedDate;
  // the run never drives a mouse: real mouse input (a cursor over the headed window) is counted and swallowed at
  // the window's capture phase, before any page listener (this script runs first); a wheel never scrolls. Touch
  // pointers and the compatibility mouse events of a tap (firesTouchEvents) pass.
  window.__mouseIn = 0;
  const swallow = (e) => {
    if (!e.isTrusted) return;
    const mouse = typeof PointerEvent === "function" && e instanceof PointerEvent ? e.pointerType === "mouse" : !e.sourceCapabilities?.firesTouchEvents;
    if (!mouse) return;
    window.__mouseIn++;
    if (e.type === "wheel") e.preventDefault();
    e.stopImmediatePropagation();
  };
  const POINTER = ["pointermove", "pointerover", "pointerout", "pointerenter", "pointerleave", "pointerdown", "pointerup"];
  const MOUSE = ["mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave", "mousedown", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "wheel"];
  for (const t of [...POINTER, ...MOUSE]) window.addEventListener(t, swallow, { capture: true, passive: false });
  let s = 0x2f6b1d3a;
  Math.random = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function waitWorld(page, log) {
  const t0 = Date.now();
  const ok = await page
    .waitForFunction(() => performance.getEntriesByName("world-ready").length > 0, null, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) log.push("world-ready never fired (30 s)");
  const intro = await page
    .waitForFunction(() => document.documentElement.dataset.intro === "done", null, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!intro) log.push("intro never reached done (15 s)");
  await page.evaluate(() => document.fonts?.ready);
  await sleep(1000);
  return Date.now() - t0;
}

/** A touch point that hits no link / button, so the tap only counts as "intent" (mounts the world). */
async function safeTap(page) {
  const pt = await page.evaluate(() => {
    const bad = "a,button,input,select,textarea,label,summary,[role=button],[role=link],[tabindex]";
    for (const fy of [0.5, 0.6, 0.4, 0.7, 0.3, 0.8]) {
      for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const x = Math.round(innerWidth * fx), y = Math.round(innerHeight * fy);
        const el = document.elementFromPoint(x, y);
        if (el && !el.closest(bad)) return { x, y };
      }
    }
    return { x: 4, y: Math.round(innerHeight / 2) };
  });
  await page.touchscreen.tap(pt.x, pt.y);
  return pt;
}

async function scrollToY(page, y) {
  await page.evaluate((t) => {
    const l = window.__lenis;
    if (l) l.scrollTo(t, { immediate: true, force: true });
    else window.scrollTo({ top: t, behavior: "instant" });
  }, y);
}

async function settleAndShoot(page, cdp, file) {
  await sleep(SETTLE);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(file, Buffer.from(data, "base64"));
}

async function captureProfile(browser, prof, dir) {
  const out = path.join(dir, prof.key);
  fs.mkdirSync(out, { recursive: true });
  const meta = { shots: {}, errors: [], log: [] };
  const ctx = await browser.newContext({ ...prof.ctx, reducedMotion: "no-preference" });
  await ctx.addInitScript(harness);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => meta.errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && meta.errors.push("console: " + m.text()));
  const cdp = await ctx.newCDPSession(page);

  // ---- home ----
  await page.goto(`${BASE}/?freeze=1`, { waitUntil: "load" });
  await page.waitForFunction(() => !!document.documentElement.dataset.loop, null, { timeout: 15000 }).catch(() => meta.log.push("no data-loop"));
  if (prof.touch) meta.tap = await safeTap(page);
  meta.readyMs = await waitWorld(page, meta.log);
  meta.loop = await page.evaluate(() => document.documentElement.dataset.loop);
  meta.lenis = await page.evaluate(() => !!window.__lenis);
  const targets = await page.evaluate(() => {
    const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
    const arts = [...document.querySelectorAll("#projects article")];
    return {
      hero: 0,
      about: top(document.getElementById("about")),
      "project-1": top(arts[0]),
      "project-2": top(arts[1]),
      "project-3": top(arts[2]),
      contact: top(document.getElementById("contact")),
      limit: document.documentElement.scrollHeight - innerHeight,
    };
  });
  meta.limit = targets.limit;
  for (const name of SHOTS.slice(0, 6)) {
    const y = targets[name];
    if (y == null) {
      meta.errors.push(`${name}: anchor not found`);
      continue;
    }
    await scrollToY(page, y);
    await settleAndShoot(page, cdp, path.join(out, `${name}.png`));
    meta.shots[name] = { target: y, ...(await page.evaluate(() => ({ y: Math.round(scrollY), mouseIn: window.__mouseIn }))) };
  }

  // ---- clone seam ----
  // loop: limit-1 (the clone 1 px below the top; exactly `limit` would wrap to 0).
  // touch-wrap jumps to 0 once scroll rests within 2 px of the limit: stay just above that.
  // useAutoCenter glides to the limit (the wrap) 900 ms after the last scroll event once y > 0.97·limit, so in
  // loop mode the settle is spent in ≤ 700 ms slices, each ended by a 1 px there-and-back that restarts its timer.
  const seamTarget = meta.loop === "loop" ? targets.limit - 1 : targets.limit - 3;
  await scrollToY(page, seamTarget);
  if (meta.loop === "loop") {
    for (let k = 0; k < 3; k++) {
      await sleep(k === 2 ? 450 : 650);
      await scrollToY(page, seamTarget - 1);
      await sleep(40);
      await scrollToY(page, seamTarget);
    }
    await sleep(200);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(out, "seam.png"), Buffer.from(data, "base64"));
  } else {
    await settleAndShoot(page, cdp, path.join(out, "seam.png"));
  }
  const seam = await page.evaluate(() => ({
    y: Math.round(scrollY),
    cloneTop: +[...document.querySelectorAll("section")].at(-1).getBoundingClientRect().top.toFixed(2),
    isClone: [...document.querySelectorAll("section")].at(-1).dataset.station === "hero-clone",
  }));
  meta.shots.seam = { target: seamTarget, ...seam };
  meta.mouseIn = await page.evaluate(() => window.__mouseIn);
  if (!seam.isClone) meta.errors.push("seam: the last section is not the hero clone");
  if (Math.abs(seam.y - seamTarget) > 1) meta.errors.push(`seam: landed at ${seam.y}, expected ${seamTarget}`);

  // ---- /projects/glassbox top ----
  await page.goto(`${BASE}/projects/glassbox?freeze=1`, { waitUntil: "load" });
  if (prof.touch) await safeTap(page);
  meta.detailReadyMs = await waitWorld(page, meta.log);
  await sleep(1500); // WorldRoot's route flight (1.4 s) toward the projects station
  await scrollToY(page, 0);
  await settleAndShoot(page, cdp, path.join(out, "detail.png"));
  meta.shots.detail = { target: 0, y: await page.evaluate(() => Math.round(scrollY)) };
  meta.mouseIn += await page.evaluate(() => window.__mouseIn);

  await ctx.close();
  return meta;
}

async function capture(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    headless: flag("headless"),
    // headed: off to the side, away from where the cursor usually is (macOS keeps a corner of it on screen).
    // --hide-scrollbars: macOS shows layout-taking classic scrollbars while a mouse is connected ("Automatic"), which
    // narrows the scrollable inner pages by 15 px; hidden, every capture lays out like the overlay-scrollbar reference
    args: ["--ignore-gpu-blocklist", "--use-angle=metal", "--hide-scrollbars", ...(flag("headless") ? [] : ["--window-position=3000,1400"])],
  });
  const meta = { base: BASE, at: new Date().toISOString(), settleMs: SETTLE, profiles: {} };
  try {
    for (const prof of profiles) meta.profiles[prof.key] = await captureProfile(browser, prof, dir);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 1));
  return meta;
}

/** % of pixels pixelmatch (threshold 0.1) flags; writes the diff PNG when diffFile is given */
function diffPct(fileA, fileB, diffFile) {
  if (!fs.existsSync(fileA) || !fs.existsSync(fileB)) return { pct: 100, note: "missing capture" };
  const a = PNG.sync.read(fs.readFileSync(fileA));
  const b = PNG.sync.read(fs.readFileSync(fileB));
  if (a.width !== b.width || a.height !== b.height) return { pct: 100, note: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  const d = new PNG({ width: a.width, height: a.height });
  const bad = pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.1 });
  if (diffFile) {
    fs.mkdirSync(path.dirname(diffFile), { recursive: true });
    fs.writeFileSync(diffFile, PNG.sync.write(d));
  }
  return { pct: +((100 * bad) / (a.width * a.height)).toFixed(4), px: bad };
}

function diffAll(runDir, diffRoot) {
  const res = {};
  for (const prof of profiles) {
    for (const shot of SHOTS) {
      const key = `${prof.key}/${shot}`;
      res[key] = diffPct(path.join(REF, prof.key, `${shot}.png`), path.join(runDir, prof.key, `${shot}.png`), path.join(diffRoot, prof.key, `${shot}.png`));
    }
  }
  return res;
}

const errorsOf = (meta, { skipDisturbed = false } = {}) =>
  Object.fromEntries(
    Object.entries(meta.profiles)
      .filter(([, p]) => !skipDisturbed || !(p.mouseIn > 0))
      .map(([k, p]) => [k, [...p.errors, ...p.log]])
      .filter(([, e]) => e.length),
  );
/** the profiles that saw real mouse input on this load, with their errors: reported, never failing --compare */
const disturbedOf = (meta) =>
  Object.fromEntries(Object.entries(meta.profiles).filter(([, p]) => p.mouseIn > 0).map(([k, p]) => [k, { mouseIn: p.mouseIn, errors: [...p.errors, ...p.log] }]));

if (MODE === "baseline") {
  const meta = await capture(REF);
  fs.rmSync(NOISE_JSON, { force: true }); // a new reference invalidates the recorded noise
  console.log(JSON.stringify({ mode: MODE, dir: REF, shots: SHOTS.length * profiles.length, errors: errorsOf(meta) }, null, 1));
  process.exit(Object.keys(errorsOf(meta)).length ? 1 : 0);
}

if (!fs.existsSync(path.join(REF, "meta.json"))) {
  console.error(`No reference at ${REF}: capture one first (no flag, against the reference build), or pass --art=<dir> holding baseline/desktop/.`);
  process.exit(2);
}

if (MODE === "noise") {
  const prev = fs.existsSync(NOISE_JSON) ? JSON.parse(fs.readFileSync(NOISE_JSON, "utf8")) : { runs: [], noise: {} };
  const runDir = path.join(ART, "baseline", `desktop-noise-${prev.runs.length + 1}`);
  const meta = await capture(runDir);
  const res = diffAll(runDir, path.join(runDir, "diff"));
  const pct = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.pct]));
  const noise = { ...prev.noise };
  for (const [k, v] of Object.entries(pct)) noise[k] = Math.max(noise[k] ?? 0, v);
  const next = { ref: REF, runs: [...prev.runs, { dir: runDir, at: meta.at, pct, errors: errorsOf(meta) }], noise };
  fs.writeFileSync(NOISE_JSON, JSON.stringify(next, null, 1));
  console.log(JSON.stringify({ mode: MODE, run: next.runs.length, pct, noise, errors: errorsOf(meta) }, null, 1));
  process.exit(0);
}

// --compare
// Best of up to --runs captures (default 5): the app settles into a slightly different 3D state on some page loads
// (stable for the whole load, ~0.1–0.4 % px of sub-pixel edges and particles), so a spike on one load is noise, while
// a real regression shows on every load. Profiles whose shots all pass are not re-captured.
const RUNS = Math.max(1, Number(opt("runs") ?? 5));
const noise = fs.existsSync(NOISE_JSON) ? JSON.parse(fs.readFileSync(NOISE_JSON, "utf8")).noise : {};
fs.rmSync(DIFF_DIR, { recursive: true, force: true });
const allowedOf = (k) => +Math.max(NOISE_K * (noise[k] ?? 0), FLOOR_PCT).toFixed(4);
const best = {};
const runs = [];
const errors = {};
const disturbed = {};
const all = profiles;
let todo = all;
for (let i = 1; i <= RUNS && todo.length; i++) {
  profiles = todo; // capture() / diffAll() walk `profiles`
  const runDir = path.join(DIFF_DIR, `current-${i}`);
  const meta = await capture(runDir);
  const res = diffAll(runDir, path.join(runDir, "diff"));
  runs.push({ run: i, at: meta.at, profiles: todo.map((p) => p.key), pct: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.pct])) });
  for (const [k, e] of Object.entries(errorsOf(meta, { skipDisturbed: true }))) errors[`${k}#${i}`] = e;
  for (const [k, d] of Object.entries(disturbedOf(meta))) disturbed[`${k}#${i}`] = d;
  for (const [k, v] of Object.entries(res)) {
    if (!best[k] || v.pct < best[k].pct) {
      best[k] = { ...v, run: i };
      const [prof, shot] = k.split("/");
      const src = path.join(runDir, "diff", prof, `${shot}.png`);
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.join(DIFF_DIR, prof), { recursive: true });
        fs.copyFileSync(src, path.join(DIFF_DIR, prof, `${shot}.png`));
      }
    }
  }
  todo = todo.filter((p) => SHOTS.some((s) => best[`${p.key}/${s}`].pct > allowedOf(`${p.key}/${s}`)));
}
profiles = all;
const shots = {};
let fail = 0;
for (const [k, v] of Object.entries(best)) {
  const allowed = allowedOf(k);
  const pass = v.pct <= allowed;
  if (!pass) fail++;
  shots[k] = { pct: v.pct, run: v.run, runs: runs.filter((r) => k in r.pct).map((r) => r.pct[k]), noise: noise[k] ?? 0, allowed, pass, ...(v.note ? { note: v.note } : {}) };
}
const report = {
  mode: MODE,
  at: new Date().toISOString(),
  ref: REF,
  rule: `best of up to ${RUNS} loads: pct <= max(${NOISE_K} x noise, ${FLOOR_PCT}%)`,
  pass: fail === 0 && !Object.keys(errors).length,
  failed: fail,
  loads: runs.length,
  shots,
  errors,
  disturbed,
};
fs.writeFileSync(path.join(DIFF_DIR, "report.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
process.exit(report.pass ? 0 : 1);
