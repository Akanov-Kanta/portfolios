"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { onFrame } from "@/lib/animator";

/**
 * The film director. Without JS, or with reduced motion, the shots simply stack and scroll (static frames).
 * With motion, html[data-film] pins every shot into one fixed stage and a single GSAP timeline, scrubbed by
 * the whole page's scroll, cuts between them. Timeline units are "vh of scroll" (TOTAL of them).
 *
 * The loop: the timeline ENDS on exactly the frame it STARTS with (shot 1, every layer at rest, the wave
 * gone). Lenis runs with `infinite`, so scrolling on past the end sets the native scroll to (scroll mod limit)
 * = the top, and the cut is invisible. Keyboard and scrollbar scrolling stay native and simply stop at the end.
 */

type ShotId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "cr";
type Mode = "debris" | "leaves" | "gold" | "embers" | "petals" | "none";

const W = 50; // length of a sword-cut transition
const TOTAL = 2060;
const SHOTS: { id: ShotId; live: [number, number][]; n: string; k: string; t: string; mode: Mode; at: number }[] = [
  { id: "s1", live: [[0, 120 + W], [2000, TOTAL]], n: "01", k: "月", t: "The moon roof", mode: "debris", at: 0 },
  { id: "s2", live: [[120, 330 + W]], n: "02", k: "竹", t: "The bamboo grove", mode: "leaves", at: 215 },
  { id: "s3", live: [[330, 780 + W]], n: "03", k: "金", t: "The gold corridor", mode: "gold", at: 412 },
  { id: "s4", live: [[780, 1030 + W]], n: "04", k: "鬼", t: "The duel", mode: "embers", at: 905 },
  { id: "s5", live: [[1030, 1480 + W]], n: "05", k: "瓦", t: "The roof run", mode: "debris", at: 1110 },
  { id: "s6", live: [[1480, 1730 + W]], n: "06", k: "馬", t: "The rider", mode: "petals", at: 1590 },
  { id: "cr", live: [[1730, 2000]], n: "終", k: "幕", t: "End credits", mode: "none", at: 1800 },
];
const ANCHORS: Record<string, number> = { top: 0, about: 215, works: 412, techniques: 905, path: 1110, contact: 1590, credits: 1800 };

// scroll beats: while the playhead is inside, the named sprites cut to their beat drawing (see sprites.ts)
const BEATS: { name: string; from: number; to: number }[] = [{ name: "clash", from: 925, to: 1030 + W }];

const inRange = (t: number, r: [number, number][], pad = 0) => r.some(([a, b]) => t >= a - pad && t <= b + pad);

export function Film() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const html = document.documentElement;
    const track = document.querySelector<HTMLElement>(".film-track");
    const film = document.querySelector<HTMLElement>(".film");
    if (!track || !film) return;
    html.dataset.film = "on";

    const q = <T extends Element = HTMLElement>(sel: string) => film.querySelector<T>(sel) ?? document.querySelector<T>(sel);
    const f = (name: string) => q(`[data-f="${name}"]`);
    const shotEl = Object.fromEntries(SHOTS.map((s) => [s.id, q(`[data-shot="${s.id}"]`)])) as Record<ShotId, HTMLElement | null>;
    const blade = document.querySelector<HTMLElement>(".film-blade");
    const flashEl = document.querySelector<HTMLElement>(".film-flash");
    const counter = {
      n: document.querySelector(".film-counter-n"),
      k: document.querySelector(".film-counter-k"),
      t: document.querySelector(".film-counter-t"),
    };

    let vh = window.innerHeight;
    let vw = window.innerWidth;
    const VW = (n: number) => () => (n / 100) * vw;
    const VH = (n: number) => () => (n / 100) * vh;
    // the cut edge leans 18% of the width over the full height
    const bladeDeg = () => (Math.atan2(0.18 * vw, vh) * 180) / Math.PI;
    const setTrack = () => {
      track.style.height = `${Math.round((TOTAL / 100) * vh + vh)}px`;
    };
    setTrack();

    // ── the flash frame (time-based, fired as the playhead passes a cut) ──
    const flash = (color = "var(--rice)") => {
      if (!flashEl) return;
      flashEl.style.background = color;
      flashEl.classList.remove("on");
      void flashEl.offsetWidth;
      flashEl.classList.add("on");
    };

    // ── timeline ──
    const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });
    // everything but shot 1 starts hidden; shots are revealed by a diagonal sword cut on --w
    SHOTS.forEach((s) => s.id !== "s1" && shotEl[s.id] && gsap.set(shotEl[s.id], { autoAlpha: 0, "--w": 0 }));
    gsap.set(".loop-wave", { x: () => 1.15 * vw });

    // a diagonal cut from `a` to `b` over [at, at + W]; the blade line rides the edge, one flash at the end
    const cut = (a: ShotId, b: ShotId, at: number, color?: string) => {
      const A = shotEl[a], B = shotEl[b];
      if (!A || !B) return;
      tl.set(B, { autoAlpha: 1 }, at);
      tl.fromTo(B, { "--w": 0 }, { "--w": 1, duration: W, ease: "power2.inOut" }, at);
      tl.fromTo(A, { scale: 1 }, { scale: 1.06, duration: W, ease: "power1.in" }, at);
      if (blade) {
        tl.set(blade, { autoAlpha: 1 }, at);
        tl.fromTo(blade, { x: () => -0.09 * vw, rotation: bladeDeg }, { x: () => 1.09 * vw, rotation: bladeDeg, duration: W, ease: "power2.inOut" }, at);
        tl.set(blade, { autoAlpha: 0 }, at + W);
      }
      tl.call(() => flash(color), [], at + W - 2);
      tl.set(A, { autoAlpha: 0, scale: 1 }, at + W);
    };

    // 1 · moon roof [0, 120]: the camera pushes in, the roof drops away, the title lifts off
    tl.fromTo(f("s1-sky"), { scale: 1, y: 0 }, { scale: 1.07, y: VH(-2), duration: 120 }, 0);
    tl.fromTo(f("s1-ronin"), { y: 0, scale: 1 }, { y: VH(-5), scale: 1.05, duration: 120 }, 0);
    tl.fromTo(f("s1-roof"), { y: 0 }, { y: VH(10), duration: 120 }, 0);
    tl.fromTo(f("s1-copy"), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: VH(-8), duration: 50 }, 66);
    tl.fromTo(f("s1-cue"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 24 }, 0);
    cut("s1", "s2", 120);

    // 2 · bamboo [170, 330]: slow pan, culms rush past in front, the card rises
    tl.fromTo(f("s2-bg"), { x: 0, scale: 1.08 }, { x: VW(-4), scale: 1.1, duration: 260 }, 120);
    tl.fromTo(f("s2-ronin"), { x: VW(-2) }, { x: VW(1.5), duration: 260 }, 120);
    tl.fromTo(f("s2-culm-a"), { x: VW(10) }, { x: VW(-16), duration: 260 }, 120);
    tl.fromTo(f("s2-culm-b"), { x: VW(6) }, { x: VW(-9), duration: 260 }, 120);
    tl.fromTo(f("s2-card"), { autoAlpha: 0, y: VH(10) }, { autoAlpha: 1, y: 0, duration: 50, ease: "power2.out" }, 165);
    tl.fromTo(f("s2-scroll"), { autoAlpha: 0, y: VH(-14) }, { autoAlpha: 1, y: 0, duration: 60, ease: "power2.out" }, 180);
    cut("s2", "s3", 330, "var(--gold)");

    // 3 · gold corridor [380, 780]: a slow dolly down the hall; the rōnin walks away; each screen slides in
    tl.fromTo(f("s3-bg"), { scale: 1 }, { scale: 1.32, duration: 450 }, 330);
    tl.fromTo(f("s3-ronin"), { scale: 1.05, y: 0 }, { scale: 0.7, y: VH(-7), duration: 450 }, 330);
    tl.fromTo(f("s3-head"), { autoAlpha: 0, y: VH(4) }, { autoAlpha: 1, y: 0, duration: 30 }, 362);
    for (let i = 0; i < 4; i++) {
      const p = f(`s3-panel-${i}`);
      if (!p) continue;
      const t0 = 380 + i * 100, side = i % 2 ? 1 : -1;
      // a fusuma sliding open: the panel is uncovered from its hinge side
      tl.fromTo(p, { autoAlpha: 0, x: VW(side * 8), clipPath: side < 0 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" }, { autoAlpha: 1, x: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 36, ease: "power2.out" }, t0 - 6);
      if (i < 3) tl.to(p, { autoAlpha: 0, x: VW(-side * 10), duration: 24, ease: "power2.in" }, t0 + 72);
    }
    cut("s3", "s4", 780, "var(--crimson)");

    // 4 · duel [830, 1030]: the two close in, the clash, one frame of a painting, they drive past each other
    tl.fromTo(f("s4-bg"), { scale: 1.12 }, { scale: 1, duration: 250 }, 780);
    // they step in fast and hold their ground on either side of the frame; the duel itself is drawn (sprites)
    tl.fromTo(f("s4-oni"), { x: VW(-12) }, { x: 0, duration: 60, ease: "power2.out" }, 790);
    tl.fromTo(f("s4-ronin"), { x: VW(12) }, { x: 0, duration: 60, ease: "power2.out" }, 790);
    tl.fromTo(f("s4-scroll"), { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 50, ease: "power2.out" }, 840);
    tl.call(() => flash("var(--vermilion)"), [], 925);
    tl.fromTo(f("s4-clash"), { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1.4, duration: 8 }, 925);
    tl.to(f("s4-clash"), { autoAlpha: 0, duration: 14 }, 933);
    tl.fromTo(f("s4-memory"), { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1.04, duration: 4 }, 928);
    tl.to(f("s4-memory"), { scale: 1, duration: 14 }, 932);
    tl.set(f("s4-memory"), { autoAlpha: 0 }, 946);
    tl.to(f("s4-oni"), { x: VW(3), duration: 80 }, 950);
    tl.to(f("s4-ronin"), { x: VW(-3), duration: 80 }, 950);
    cut("s4", "s5", 1030);

    // 5 · roof run [1080, 1480]: three leaps across the roofs while the path rolls by underneath
    tl.fromTo(f("s5-bg"), { x: 0, scale: 1.14 }, { x: VW(-9), scale: 1.14, duration: 450 }, 1030);
    tl.fromTo(f("s5-head"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 30 }, 1060);
    // the runner is brought in and carried off by the scroll; his stride, leaps and drift run in time (film.css)
    tl.fromTo(f("s5-runner"), { x: VW(-70) }, { x: 0, duration: 70, ease: "power2.out" }, 1030);
    tl.to(f("s5-runner"), { x: VW(90), duration: 60, ease: "power2.in" }, 1440);
    const trk = f("s5-track");
    if (trk) tl.fromTo(trk, { x: VW(100) }, { x: () => -(trk.scrollWidth - 0.55 * vw), duration: 400 }, 1080);
    cut("s5", "s6", 1480, "var(--rice)");

    // 6 · rider [1530, 1730]: the horse gallops across and away; the letter waits
    tl.fromTo(f("s6-bg"), { scale: 1.06, x: 0 }, { scale: 1.06, x: VW(-3), duration: 250 }, 1480);
    // a tracking shot: the horse catches up with the camera, holds pace in the rushing grove, and pulls away
    tl.fromTo(f("s6-rider"), { x: VW(-80) }, { x: 0, duration: 60, ease: "power2.out" }, 1490);
    tl.to(f("s6-rider"), { x: VW(110), duration: 50, ease: "power2.in" }, 1700);
    tl.fromTo([f("s6-head"), f("s6-letter")], { autoAlpha: 0, y: VH(5) }, { autoAlpha: 1, y: 0, duration: 40, stagger: 10, ease: "power2.out" }, 1525);
    cut("s6", "cr", 1730, "var(--ink)");

    // credits [1780, 1940]: they roll up over the moon
    const roll = f("cr-roll");
    tl.fromTo(f("cr-moon"), { scale: 1.12 }, { scale: 1, duration: 270 }, 1730);
    if (roll) tl.fromTo(roll, { y: VH(78) }, { y: () => -(roll.offsetHeight - 0.42 * vh), duration: 190 }, 1760);

    // ∞ loop [1940, 2060]: the Great Wave sweeps in, covers everything, and leaves shot 1 exactly as it began
    tl.fromTo(".loop-wave", { x: () => 1.15 * vw }, { x: 0, duration: 60, ease: "power1.in" }, 1940);
    tl.set(shotEl.cr, { autoAlpha: 0 }, 2000);
    tl.set(shotEl.s1, { autoAlpha: 1, scale: 1 }, 2000);
    tl.set(f("s1-sky"), { scale: 1, y: 0 }, 2000);
    tl.set(f("s1-ronin"), { y: 0, scale: 1 }, 2000);
    tl.set(f("s1-roof"), { y: 0 }, 2000);
    tl.set([f("s1-copy"), f("s1-cue")], { autoAlpha: 1, y: 0 }, 2000);
    tl.to(".loop-wave", { x: () => -1.15 * vw, duration: 60, ease: "power1.out" }, 2000);
    tl.set({}, {}, TOTAL);

    // ── shot bookkeeping: which shots are live (painting), near (mounted), and the counter ──
    let cur = -1;
    const mode = { v: "debris" as Mode, burst: 0 };
    const beatOn: Record<string, boolean> = {};
    const sync = (t: number) => {
      let idx = 0;
      SHOTS.forEach((s, i) => {
        const el = shotEl[s.id];
        if (!el) return;
        const live = inRange(t, s.live);
        const near = inRange(t, s.live, 160) || (s.id === "s1" && t > TOTAL - 200);
        if (el.dataset.live !== String(live)) el.dataset.live = String(live);
        if (el.dataset.near !== String(near)) el.dataset.near = String(near);
        if (live) idx = i;
      });
      for (const b of BEATS) {
        const on = t >= b.from && t < b.to;
        if (beatOn[b.name] === on) continue;
        beatOn[b.name] = on;
        window.dispatchEvent(new CustomEvent("film:beat", { detail: { name: b.name, on } }));
      }
      const wave = document.querySelector<HTMLElement>(".loop-wave");
      const wn = String(t > 1700);
      if (wave && wave.dataset.near !== wn) wave.dataset.near = wn;
      if (idx !== cur) {
        cur = idx;
        const s = SHOTS[idx];
        if (counter.n) counter.n.textContent = s.n;
        if (counter.k) counter.k.textContent = s.k;
        if (counter.t) counter.t.textContent = s.t;
        mode.v = s.mode;
      }
    };

    const st = ScrollTrigger.create({
      trigger: track,
      start: 0,
      end: "max",
      animation: tl,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: () => sync(tl.time()),
    });
    sync(0);

    // ── Lenis (smooth wheel, infinite) driven by GSAP's ticker ──
    const lenis = new Lenis({ infinite: true, smoothWheel: true, syncTouch: false, lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const unitPx = (u: number) => (u / 100) * vh;
    const go = (id: string, immediate = false) => {
      if (!(id in ANCHORS)) return false;
      lenis.scrollTo(unitPx(ANCHORS[id]), immediate ? { immediate: true, force: true } : { duration: 1.6, force: true });
      return true;
    };

    // in-page anchors (nav, skip link) jump along the film instead of to the stacked layout
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      if (go(id)) e.preventDefault();
    };
    document.addEventListener("click", onClick);
    // keyboard focus landing in a shot that isn't on screen brings that shot up
    const onFocus = (e: FocusEvent) => {
      const shot = (e.target as Element | null)?.closest?.<HTMLElement>("[data-shot]");
      if (!shot || shot.dataset.live === "true") return;
      const s = SHOTS.find((x) => x.id === shot.dataset.shot);
      if (s) lenis.scrollTo(unitPx(s.at), { immediate: true, force: true });
    };
    document.addEventListener("focusin", onFocus);

    const lock = () => lenis.stop();
    const unlock = () => lenis.start();
    window.addEventListener("film:lock", lock);
    window.addEventListener("film:unlock", unlock);

    if (location.hash) go(location.hash.slice(1), true);

    // ── resize: keep the film where it was ──
    let rt = 0;
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      if (w === vw && Math.abs(h - vh) < 140) return; // phone toolbars
      clearTimeout(rt);
      rt = window.setTimeout(() => {
        const p = st.progress;
        vw = w; vh = h;
        setTrack();
        ScrollTrigger.refresh();
        lenis.resize();
        lenis.scrollTo(p * ScrollTrigger.maxScroll(window), { immediate: true, force: true });
      }, 150);
    };
    window.addEventListener("resize", onResize);

    // ── impact frames: every time the rōnin's cut lands, a white star, a camera jolt and a spray of embers ──
    const impact = q(".impact");
    const s4bg = f("s4-bg");
    const onImpact = (e: Event) => {
      const d = (e as CustomEvent<{ name: string; frame: number }>).detail;
      if (d.name !== "strike" || shotEl.s4?.dataset.live !== "true") return;
      for (const el of [impact, s4bg]) {
        if (!el) continue;
        el.classList.remove("hit");
        void el.offsetWidth;
        el.classList.add("hit");
      }
      mode.burst = 1;
    };
    window.addEventListener("film:frame", onImpact);

    // ── particles: one canvas, the mood of the current shot ──
    const stopParticles = particles(document.querySelector<HTMLCanvasElement>(".film-particles"), mode);

    return () => {
      stopParticles();
      window.removeEventListener("film:frame", onImpact);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("film:lock", lock);
      window.removeEventListener("film:unlock", unlock);
      document.removeEventListener("click", onClick);
      document.removeEventListener("focusin", onFocus);
      gsap.ticker.remove(tick);
      lenis.destroy();
      st.kill();
      tl.kill();
      delete html.dataset.film;
      track.style.height = "";
    };
  }, []);

  return null;
}

/** Drifting ink shards, falling bamboo leaves, gold flakes, embers or petals; paused when the tab is hidden. */
function particles(cv: HTMLCanvasElement | null, mode: { v: Mode; burst: number }) {
  if (!cv) return () => {};
  const g = cv.getContext("2d")!;
  let W = 0, H = 0;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const resize = () => {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  };
  resize();
  window.addEventListener("resize", resize);
  const N = window.innerWidth < 700 ? 22 : 42;
  const P = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), r: Math.random() * 6.28, v: 0.4 + Math.random() * 0.8, ph: i * 1.7 }));
  let shown = 0;
  const frame = (now: number, ms: number) => {
    const dt = Math.min(50, ms) / 1000;
    const m = mode.v;
    // an impact flings the embers: a short burst of speed that decays
    const boost = 1 + 5 * mode.burst;
    mode.burst = Math.max(0, mode.burst - dt * 2.2);
    shown += ((m === "none" ? 0 : 1) - shown) * Math.min(1, dt * 3);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (shown < 0.01) return;
    g.globalAlpha = shown;
    const t = now / 1000;
    for (const p of P) {
      if (m === "debris") { p.x += (0.025 + 0.02 * p.v) * dt; p.y += (0.012 * Math.sin(t * 0.7 + p.ph) + 0.01) * dt; p.r += dt * p.v; }
      else if (m === "leaves") { p.y += 0.045 * p.v * dt; p.x += 0.02 * Math.sin(t * 1.3 + p.ph) * dt; p.r = Math.sin(t * 1.6 + p.ph) * 0.9 + 1; }
      else if (m === "gold") { p.y -= 0.012 * p.v * dt; p.x += 0.006 * Math.sin(t + p.ph) * dt; p.r += dt * 0.6; }
      else if (m === "embers") { p.y -= 0.09 * p.v * dt * boost; p.x += (0.025 * Math.sin(t * 2 + p.ph) + 0.04 * (boost - 1) * (p.ph % 2 > 1 ? 1 : -1)) * dt; }
      else if (m === "petals") { p.x += 0.05 * p.v * dt; p.y += (0.02 + 0.018 * Math.sin(t * 1.5 + p.ph)) * dt; p.r += dt * 1.4 * p.v; }
      if (p.x > 1.05) p.x -= 1.1; if (p.x < -0.05) p.x += 1.1;
      if (p.y > 1.05) p.y -= 1.1; if (p.y < -0.05) p.y += 1.1;
      const x = p.x * W, y = p.y * H, s = p.s;
      g.save(); g.translate(x, y); g.rotate(p.r);
      if (m === "debris") { g.fillStyle = "#0B1622"; g.beginPath(); g.moveTo(-6 * s, -2 * s); g.lineTo(5 * s, -4 * s); g.lineTo(3 * s, 4 * s); g.closePath(); g.fill(); }
      else if (m === "leaves") { g.fillStyle = "#16283A"; g.beginPath(); g.ellipse(0, 0, 14 * s, 2.4 * s, 0, 0, 7); g.fill(); }
      else if (m === "gold") { g.fillStyle = "#E6CC85"; g.globalAlpha = shown * (0.5 + 0.5 * Math.sin(t * 3 + p.ph)); g.fillRect(-2.5 * s, -2.5 * s, 5 * s, 5 * s); }
      else if (m === "embers") { g.fillStyle = p.ph % 2 > 1 ? "#E2401C" : "#F1D27A"; g.globalAlpha = shown * (0.55 + 0.45 * Math.sin(t * 9 + p.ph)); g.beginPath(); g.arc(0, 0, 2.2 * s, 0, 7); g.fill(); }
      else if (m === "petals") { g.fillStyle = p.ph % 3 > 1.5 ? "#F2C4BE" : "#ECE6D8"; g.beginPath(); g.ellipse(0, 0, 6 * s, 3.4 * s, 0, 0, 7); g.fill(); }
      g.restore();
    }
  };
  const off = onFrame(frame);
  return () => {
    off();
    window.removeEventListener("resize", resize);
  };
}
