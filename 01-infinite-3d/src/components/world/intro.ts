import { frame, wake, worldStore } from "./state/world-store";
import { lenisRef } from "./scroll/lenis-ref";
import { addTick } from "./ticker";
import { DUR, EASE, bezier, fx } from "./theme";

const DURATION = DUR.intro;
const introEase = bezier(EASE.intro);

/**
 * igloo-style intro: once the world is warm, the camera descends onto the room while the
 * furniture assembles, and scrolling is locked until it lands. Skipped for reduced motion,
 * static/finite modes and pixel tests (?freeze=1).
 * Phones never lock or hide anything: the intro is done at once and the room develops instead.
 */
export function startIntro() {
  const s = worldStore.getState();
  if (s.intro !== "pending") return;
  if (s.profile === "phone") {
    finishIntro();
    startDevelop();
    return;
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || s.loopMode === "static" || s.loopMode === "finite" || frame.freeze) return finishIntro();
  s.set({ intro: "playing" });
  document.documentElement.dataset.intro = "playing";
  lenisRef.current?.stop();
  const start = performance.now();
  const off = addTick((now) => {
    frame.introT = Math.min(1, (now - start) / DURATION);
    if (frame.introT >= 1) {
      off();
      finishIntro();
    }
  }, -6);
}

function finishIntro() {
  frame.introT = 1;
  worldStore.getState().set({ intro: "done" });
  document.documentElement.dataset.intro = "done";
  lenisRef.current?.start();
}

/**
 * Phone world arrival: at the hero the room DEVELOPS over DUR.develop on EASE.intro (fx.develop
 * 0 → 1: grade gain, lamp flicker, monitors waking, a small push-in; read by Grade, Room and
 * CameraRig). It keeps the render policy awake while it runs. Anywhere else, under reduced motion,
 * in Still mode and for pixel tests (?freeze=1) the world just fades in (fx.develop stays 1).
 * Runs once per session: a context-loss remount never develops again (intro is already "done").
 */
function startDevelop() {
  const s = worldStore.getState();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const atHero = s.isHome && s.station === "hero" && window.scrollY < 0.5 * window.innerHeight;
  if (reduced || s.loopMode === "static" || frame.freeze || !atHero) {
    fx.develop = 1;
    return;
  }
  fx.develop = 0;
  wake(DUR.develop);
  const start = performance.now();
  const off = addTick((now) => {
    const k = Math.min(1, Math.max(0, (now - start) / DUR.develop));
    fx.develop = k >= 1 ? 1 : introEase(k);
    wake(100);
    if (k >= 1) off();
  }, -6);
}
