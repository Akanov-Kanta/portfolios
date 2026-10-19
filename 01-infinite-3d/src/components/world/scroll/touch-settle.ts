import { frame, worldStore, type Mapping } from "../state/world-store";
import { isPhone } from "../phone";
import { DUR } from "../theme";
import { clamp01 } from "../math";
import { markProgrammatic } from "@/components/phone/jump";

export interface SettleGeom {
  /** document tops of the home project articles (one 100svh stop each) */
  articleTops: readonly number[];
  /** document top of #contact */
  contactTop: number;
  /** the true bottom, scrollHeight − innerHeight: resting there fires the touch-wrap to y = 0 */
  realMax: number;
  /** the mapping's viewport (100svh on phones) */
  vh: number;
}

/** a move shorter than this is not worth a glide */
const EPS = 4;

const nearest = (xs: readonly number[], y: number) =>
  xs.reduce<number | null>((best, x) => (best === null || Math.abs(x - y) < Math.abs(best - y) ? x : best), null);

/**
 * Where a released touch scroll should glide to, or null to stay (pure; touch-settle.test.ts).
 * Phones replace CSS snap with this (igloo's rule: never rest mid-transition):
 *  1. the second half of the rise into the clone, or past 97 % of the lap → the true bottom (wrap);
 *  2. inside a flight window (0.03 < local < 0.97): < 0.5 undoes to the hold end (projects: back to
 *     its nearest stop; contact → clone: back to contact.top + 0.5·vh), ≥ 0.5 finishes at the end;
 *  3. inside the projects hold → the nearest project stop;
 *  4. contact, resting past contact.top + 0.5·vh → contact.top + 0.5·vh;
 *  5. anything else (the hero and About holds: reading is free) → null;
 *  6. a target within 4 px → null.
 */
export function settleTarget(y: number, m: Mapping, g: SettleGeom): number | null {
  const segs = m.segments;
  if (!segs.length) return null;
  const pick = (target: number | null) => (target === null || Math.abs(target - y) <= EPS ? null : target);
  let i = segs.findIndex((s) => y < s.end);
  if (i < 0) i = segs.length - 1;
  const s = segs[i]!;
  const last = segs[segs.length - 1]!;
  /** the lap ends in the hero clone (touch-wrap); static / finite pages have no rule 1 */
  const looped = last.from === "contact" && last.to === "hero";
  const local = s.end > s.holdEnd ? clamp01((y - s.holdEnd) / (s.end - s.holdEnd)) : 0;
  const rest = g.contactTop + 0.5 * g.vh;

  if (looped && ((s === last && y >= s.holdEnd && local >= 0.5) || y > 0.97 * m.limit)) return pick(g.realMax);
  if (y >= s.holdEnd && local > 0.03 && local < 0.97) {
    if (local >= 0.5) return pick(s.end);
    if (s.from === "contact") return pick(rest);
    // undoing projects → contact: back onto the last stop, never mid-article at the hold end
    if (s.from === "projects") return pick(nearest(g.articleTops.filter((t) => t <= s.holdEnd + EPS), s.holdEnd) ?? s.holdEnd);
    return pick(s.holdEnd);
  }
  if (s.from === "projects" && y < s.holdEnd) return pick(nearest(g.articleTops, y));
  if (s.from === "contact" && y > rest) return pick(rest);
  return null;
}

function measure(vh: number): SettleGeom | null {
  const contact = document.getElementById("contact");
  if (!contact) return null;
  const sy = window.scrollY;
  return {
    articleTops: Array.from(document.querySelectorAll<HTMLElement>("#projects article"), (el) => el.getBoundingClientRect().top + sy),
    contactTop: contact.getBoundingClientRect().top + sy,
    realMax: document.documentElement.scrollHeight - window.innerHeight,
    vh,
  };
}

/**
 * Phone touch-wrap settle (HomeLoop installs it on phones). DUR.settleDelay after scrollend (a 140 ms
 * scroll debounce stands in where scrollend is missing), with no finger down, the Index sheet
 * closed and focus outside dialogs and inputs, settleTarget() glides there with a native smooth
 * scroll. A new touch or scroll cancels a pending settle. Static mode never settles.
 */
export function installTouchSettle(): () => void {
  let timer = 0;
  let debounce = 0;
  let touches = 0;
  /** a scroll happened since the last settle check (a finger lifted after a slow drag with no fling) */
  let moved = false;
  const hasScrollEnd = "onscrollend" in window;

  const settle = () => {
    timer = 0;
    moved = false;
    const s = worldStore.getState();
    const m = frame.mapping;
    if (!m || touches > 0 || !isPhone() || !s.isHome || s.loopMode !== "touch-wrap" || s.sheet !== "none") return;
    if (document.activeElement?.closest("input,textarea,select,dialog,[role=dialog]")) return;
    const g = measure(m.vh);
    const target = g && settleTarget(window.scrollY, m, g);
    if (target === null || target === undefined) return;
    markProgrammatic();
    window.scrollTo({ top: target, behavior: "smooth" });
  };
  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(settle, DUR.settleDelay);
  };
  const cancel = () => {
    window.clearTimeout(timer);
    window.clearTimeout(debounce);
  };
  const onScroll = () => {
    moved = true;
    cancel();
    if (!hasScrollEnd) debounce = window.setTimeout(arm, 140);
  };
  const onTouch = (e: TouchEvent) => {
    touches = e.touches?.length ?? 0; // a synthetic Event("touchstart") has no touch list
    if (e.type === "touchstart") cancel();
    else if (touches === 0 && moved) arm();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  if (hasScrollEnd) window.addEventListener("scrollend", arm);
  for (const t of ["touchstart", "touchend", "touchcancel"] as const) window.addEventListener(t, onTouch, { passive: true });
  return () => {
    cancel();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scrollend", arm);
    for (const t of ["touchstart", "touchend", "touchcancel"] as const) window.removeEventListener(t, onTouch);
  };
}

/**
 * Phones: the loop clone's document top (= the end of the scroll range, where the touch-wrap swaps in
 * the hero at 0) on a whole DEVICE pixel. Stations sized in svh (contact is 150svh) and wrapped text
 * leave it on a fraction, and at DPR 2.625 even a whole CSS pixel is not a whole device pixel, so the
 * resting clone was drawn half a device pixel off the hero and its particle name resampled (P13 seam).
 * A margin under q CSS px above the clone (q: the smallest step with q·dpr whole: 1 at DPR 2 and 3,
 * 8 at 2.625) rounds its top up; re-measured whenever #loop-root resizes (fonts, rotation, the clone
 * mounting after a Still toggle). The gap sits in the contact → clone flight, over the canvas.
 */
export function installCloneAlign(): () => void {
  const root = document.getElementById("loop-root");
  if (!root) return () => {};
  let el: HTMLElement | null = null;
  let applied = 0;
  const dpr = window.devicePixelRatio || 1;
  let q = 1;
  while (q < 8 && Math.abs(q * dpr - Math.round(q * dpr)) > 1e-3) q++;
  const fix = () => {
    const clone = root.querySelector<HTMLElement>('[data-station="hero-clone"]');
    if (clone !== el) {
      el = clone;
      applied = 0;
    }
    if (!clone) return;
    const top = clone.getBoundingClientRect().top + window.scrollY - applied;
    const next = Math.max(0, Math.round((Math.ceil((top - 0.005) / q) * q - top) * 1000) / 1000);
    if (Math.abs(next - applied) < 0.002) return;
    applied = next;
    clone.style.marginTop = next ? `${next}px` : "";
  };
  // written a frame later: resizing the observed root inside its own ResizeObserver callback is a loop
  // (WebKit reports "ResizeObserver loop completed with undelivered notifications")
  let raf = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fix);
  });
  ro.observe(root);
  fix();
  return () => {
    ro.disconnect();
    cancelAnimationFrame(raf);
    if (el) el.style.marginTop = "";
  };
}
