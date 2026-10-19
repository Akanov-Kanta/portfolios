import { frame, worldStore } from "@/components/world/state/world-store";
import { addTick } from "@/components/world/ticker";
import { stableVh } from "@/components/world/phone";
import { VEL_FULL_VH_PHONE } from "@/components/world/scroll/driver";
import { DUR, EASE, bezier } from "@/components/world/theme";
import { isProgrammatic } from "./jump";

export interface DockParts {
  nav: HTMLElement;
  /** lap hairline fill: scaleX on the bar, scaleY on the rail ([data-variant]) */
  fill: HTMLElement | null;
  /** the project micro-dots under WORK */
  dots: HTMLElement | null;
  /** inner route: the dot to hold (the open project, else -1); on home the scroll drives it */
  innerDot: { current: number };
}

/** vNorm above this, moving down, for RECEDE_MS → the Dock recedes */
const RECEDE_V = 0.25;
const RECEDE_MS = 120;
/** the Dock's own vNorm smoothing (s): short, so a flick counts while it lasts (the driver's vNorm,
 *  damped for the glitch, needs ~0.3 s to climb) */
const FAST_TAU = 0.05;
/** |velocityPx| under this for REST_MS → at rest, the Dock returns */
const REST_V = 0.3;
const REST_MS = 150;
/** any upward scroll longer than this returns it */
const UP_PX = 8;

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** recede: DUR.dockOut on EASE.hard (--ease-hard) */
const easeOut = bezier(EASE.hard);
/** return: DUR.dockIn on --spring (globals.css, SPRING_CSS): the same linear() stops, overshoot included */
const SPRING = [[0, 0], [0.08, 0.35], [0.2, 0.82], [0.34, 1.08], [0.42, 1.12], [0.6, 1.02], [0.72, 0.98], [1, 1]] as const;
function spring(x: number): number {
  if (x >= 1) return 1;
  for (let i = 1; i < SPRING.length; i++) {
    const [x1, y1] = SPRING[i]!;
    if (x <= x1) {
      const [x0, y0] = SPRING[i - 1]!;
      return y0 + ((y1 - y0) * (Math.max(0, x) - x0)) / (x1 - x0);
    }
  }
  return 1;
}

/**
 * The Dock's per-frame work, on one +10 tick (after the driver wrote frame.*). Nothing here is
 * React state, and each write happens only on change:
 *  - lap hairline: a transform (t moved > 0.002), never layout;
 *  - project dots: [data-on] moves when the stop index changes; the flight into the projects counts as
 *    stop 1 from its second half (a jump or a restore can land a fraction of a pixel short of the
 *    first article on fractional station tops);
 *  - recede: [data-receded] flips, and this tick eases the Dock's transform + opacity toward the variant's
 *    offset (phone-hud.css --recede-x / --recede-y): out over DUR.dockOut on EASE.hard, back over DUR.dockIn on
 *    the spring, from wherever an interrupted one was. Not a CSS transition: a running time-based CSS
 *    animation dirties style before the frame's scroll events, so the first scroll-position read in them paid
 *    a second style recalc every scrolling frame (P6); style written here resolves in this frame's render.
 *    Recedes on a fast downward flick: vNorm (share of 0.12·vh per 60 Hz frame, from px/s so 120 Hz
 *    phones behave like 60 Hz ones; about 1500 px/s on a 393x852 phone) above 0.25 for 120 ms. Returns at
 *    rest (|v| < 0.3 px/frame for 150 ms), on any upward scroll over 8 px, with focus inside, at contact,
 *    on a sheet change, and always in static loop mode or under reduced motion (instantly there). Scrolls
 *    we started ourselves (jumps, settle, Back restore) never recede it.
 *  - html[data-moving] while the page scrolls under a finger (until 150 ms at rest; not our own jumps / settle /
 *    restore), for the same P6 reason: phone-hud.css finishes the tab pill's spring, the WORK label's lift and
 *    the Email shimmer in place meanwhile.
 */
export function installDockMotion(p: DockParts): () => void {
  const reducedMq = matchMedia("(prefers-reduced-motion: reduce)");
  let focus = false;
  const onIn = () => (focus = true);
  const onOut = (e: FocusEvent) => (focus = p.nav.contains(e.relatedTarget as Node | null));
  p.nav.addEventListener("focusin", onIn);
  p.nav.addEventListener("focusout", onOut);
  // the viewport height, read on resize only (a per-frame read can force a style recalc)
  let vh = stableVh() || window.innerHeight;
  const onResize = () => (vh = stableVh() || window.innerHeight);
  window.addEventListener("resize", onResize);

  let lastT = -1;
  let lastRail: boolean | null = null;
  let lastDot = -2;
  let receded = false;
  let written = false;
  let fastSince = -1;
  let restSince = -1;
  let peakY = 0;
  /** signed vNorm, lightly smoothed */
  let fast = 0;
  /** sign of the last non-zero frame velocity (120 Hz frames between 60 Hz scroll events read 0) */
  let dir = 0;
  let sheet = worldStore.getState().sheet;
  /** recede progress (0 shown, 1 receded; the spring overshoots below 0), the tween's start and target */
  let k = 0;
  let k0 = 0;
  let t0 = 0;
  let tween = false;
  const style = p.nav.style;
  const place = (x: number) => {
    k = x;
    if (x === 0) {
      style.removeProperty("transform");
      style.removeProperty("opacity");
    } else {
      style.transform = `translate(calc(var(--recede-x) * ${x.toFixed(4)}), calc(var(--recede-y) * ${x.toFixed(4)}))`;
      style.opacity = clamp(1 - x, 0, 1).toFixed(3);
    }
  };
  const html = document.documentElement;
  let moving = false;
  let stillSince = -1;

  const off = addTick((time, dt) => {
    const s = worldStore.getState();
    const rail = p.nav.dataset.variant === "rail";

    const t = ((frame.t % 1) + 1) % 1;
    if (p.fill && (Math.abs(t - lastT) > 0.002 || rail !== lastRail)) {
      lastT = t;
      lastRail = rail;
      p.fill.style.transform = rail ? `scaleY(${t.toFixed(4)})` : `scaleX(${t.toFixed(4)})`;
    }

    if (p.dots) {
      const dot = !s.isHome
        ? p.innerDot.current
        : frame.segFrom === "projects"
          ? clamp(Math.round(frame.vhIn), 0, frame.stops - 1)
          : frame.segTo === "projects" && frame.local >= 0.5
            ? 0
            : lastDot;
      if (dot !== lastDot) {
        lastDot = dot;
        const kids = p.dots.children;
        for (let i = 0; i < kids.length; i++) kids[i]!.toggleAttribute("data-on", i === dot);
      }
    }

    const v = frame.velocityPx;
    if (v !== 0) dir = Math.sign(v);
    fast += (v / (Math.max(dt, 1 / 240) * 60 * VEL_FULL_VH_PHONE * vh) - fast) * (1 - Math.exp(-dt / FAST_TAU));
    const y = frame.scrollY;
    const sheetChanged = s.sheet !== sheet;
    sheet = s.sheet;
    const allowed =
      !sheetChanged &&
      s.sheet === "none" &&
      s.loopMode !== "static" &&
      !reducedMq.matches &&
      !focus &&
      !(s.isHome && s.station === "contact");
    if (!allowed) {
      receded = false;
      fastSince = -1;
    } else if (!receded) {
      if (dir > 0 && fast > RECEDE_V && !isProgrammatic()) {
        if (fastSince < 0) fastSince = time;
        else if (time - fastSince >= RECEDE_MS) {
          receded = true;
          peakY = y;
          restSince = -1;
        }
      } else fastSince = -1;
    } else {
      peakY = Math.max(peakY, y);
      if (peakY - y > UP_PX) receded = false;
      else if (Math.abs(v) < REST_V) {
        if (restSince < 0) restSince = time;
        else if (time - restSince >= REST_MS) receded = false;
      } else restSince = -1;
      if (!receded) fastSince = -1;
    }
    if (receded !== written) {
      written = receded;
      p.nav.toggleAttribute("data-receded", receded);
      k0 = k;
      t0 = time;
      tween = true;
    }
    if (tween) {
      const x = reducedMq.matches ? 1 : Math.max(0, time - t0) / (receded ? DUR.dockOut : DUR.dockIn);
      if (x >= 1) tween = false;
      place(x >= 1 ? +receded : receded ? k0 + (1 - k0) * easeOut(x) : k0 * (1 - spring(x)));
    }

    if (Math.abs(v) >= REST_V && !isProgrammatic()) {
      stillSince = -1;
      if (!moving) html.toggleAttribute("data-moving", (moving = true));
    } else if (moving) {
      if (stillSince < 0) stillSince = time;
      else if (time - stillSince >= REST_MS) html.toggleAttribute("data-moving", (moving = false));
    }
  }, 10);

  return () => {
    off();
    p.nav.removeEventListener("focusin", onIn);
    p.nav.removeEventListener("focusout", onOut);
    window.removeEventListener("resize", onResize);
    p.nav.removeAttribute("data-receded");
    place(0);
    html.removeAttribute("data-moving");
  };
}
