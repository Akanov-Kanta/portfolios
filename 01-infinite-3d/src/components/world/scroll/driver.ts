import { frame, worldStore } from "../state/world-store";
import { mapScroll, wrap01 } from "./anchors";
import { STATION_T } from "../path/stations";
import { stepFlight } from "../path/routeFlight";
import { addTick } from "../ticker";

/** second smoothing stage (loop mode): per-60fps-frame chase factor and max step (viewports / frame) */
const CHASE = 0.15;
const MAX_STEP_VH = 0.25;
/** a chase longer than this is a programmatic jump (anchor, probe): cut instead of flying through */
const CUT_VH = 4;
/** |velocity| (share of a viewport per frame) that saturates vNorm; phones flick far harder than a
 *  wheel, so a normal flick no longer maxes out the glitch and the velocity FOV */
const VEL_FULL_VH = 0.05;
export const VEL_FULL_VH_PHONE = 0.12;

/**
 * Scroll → world mapping, on the shared ticker at priority -5 (after Lenis, before R3F).
 * Lives in the DOM layer so the HUD works even when the canvas never mounts.
 * Writes frame.t / transition / local / vNorm and the discrete `station`, plus the
 * `--vel` / `--vel-abs` CSS vars on each `.display` heading (loop mode only: their one consumer is
 * html[data-loop=loop], so touch-wrap / finite / static never pay for the writes).
 *
 * The CSS vars are written from a separate LAST tick (+40), so no layout read later in the frame
 * (label keep-out rects, the cursor's sticky target) pays for them, and only on the `.display`
 * headings that read them: an inherited custom property changing on <html> restyles the whole
 * document every scrolling frame (~half of all main-thread work in a throttled lap).
 */
export function installDriver(): () => void {
  /** live collection: headings mounted later (route changes, the loop clone) join automatically */
  const displays = document.getElementsByClassName("display");
  const writeVel = (v: string, a: string | null) => {
    for (const el of displays) {
      const st = (el as HTMLElement).style;
      if (a === null) {
        st.removeProperty("--vel");
        st.removeProperty("--vel-abs");
      } else {
        st.setProperty("--vel", v);
        st.setProperty("--vel-abs", a);
      }
    }
  };
  // smoothed scroll (loop mode only): Lenis lerp is stage one, this is stage two → S-shaped wheel response
  let sY = NaN;
  // signed damped velocity for --vel, the value to write this frame, and the last value written
  let vel = 0;
  let velNext = 0;
  let velOut = 0;
  const offCss = addTick(() => {
    if (Math.abs(velNext - velOut) > 0.005 || (velNext === 0 && velOut !== 0)) {
      velOut = velNext;
      writeVel(velNext.toFixed(3), Math.abs(velNext).toFixed(3));
    }
  }, 40);
  // the viewport height is read on resize only: window.innerHeight in the rAF forces a style recalc
  // whenever a CSS animation is running (phones at rest: one per frame, P7)
  let vh = window.innerHeight;
  const onResize = () => (vh = window.innerHeight);
  window.addEventListener("resize", onResize);
  const off = addTick((time, dt) => {
    const s = worldStore.getState();
    // phones: px per 60 Hz frame, whatever the refresh rate (a 120 Hz frame scrolls half as far, and a
    // frame between two 60 Hz scroll events reads 0), so the glitch, the FOV and the Dock react the same
    const vRaw =
      s.profile === "phone"
        ? Math.min(1, Math.abs(frame.velocityPx) / (Math.max(dt, 1 / 240) * 60 * VEL_FULL_VH_PHONE * vh))
        : Math.min(1, Math.abs(frame.velocityPx) / (VEL_FULL_VH * vh));
    const damp = 1 - Math.exp(-6 * dt);
    frame.vNorm += (vRaw - frame.vNorm) * damp;
    if (s.loopMode === "loop") {
      const vSigned = Math.max(-1, Math.min(1, frame.velocityPx / (VEL_FULL_VH * vh)));
      vel += (vSigned - vel) * damp;
      if (Math.abs(vel) < 1e-3) vel = 0;
      velNext = vel;
    }
    if (stepFlight(time)) {
      sY = NaN; // re-seed after the flight
      return;
    }
    // phones: the store's isHome / route trail the URL until the route's passive effects run (a frame or
    // more, longer under a view transition). Hold the pose until they catch up, so neither the home mapping
    // samples the new page's scroll (Next's scroll-to-top on a project link read as the hero) nor the inner
    // park the old route's station.
    if (s.profile === "phone" && s.isHome !== (location.pathname === "/")) {
      sY = NaN;
      return;
    }
    // mapScroll needs ≥ 1 segment (≥ 2 [data-station] anchors)
    if (s.isHome && frame.mapping?.segments.length) {
      const m = frame.mapping;
      let y = frame.scrollY;
      if (s.loopMode === "loop" && !frame.freeze) {
        const L = Math.max(1, m.limit);
        if (!Number.isFinite(sY)) sY = y;
        // wrap-aware: the shortest way round the lap, so the seam never flies the long way
        let d = y - sY;
        d -= L * Math.round(d / L);
        if (Math.abs(d) > CUT_VH * m.vh) sY = y;
        else {
          const max = MAX_STEP_VH * m.vh;
          sY += Math.max(-max, Math.min(max, d * (1 - Math.pow(1 - CHASE, dt * 60))));
          sY = ((sY % L) + L) % L;
        }
        y = sY;
      } else sY = NaN;
      const r = mapScroll(y, m);
      frame.t = r.t;
      frame.transition = r.bell;
      frame.local = r.local;
      frame.vhIn = r.vhIn;
      frame.segFrom = r.from;
      frame.segTo = r.to;
      frame.stops = r.stops;
      if (r.station !== s.station) s.set({ station: r.station });
    } else {
      sY = NaN;
      // inner page: parked at the route's station, drifting ≤ 2 % of a lap with page scroll
      frame.t = wrap01(STATION_T[s.route] + 0.02 * (frame.scrollY / Math.max(1, frame.limit)));
      frame.transition = 0;
      frame.local = 0;
      frame.vhIn = 0;
      frame.segFrom = s.route;
      frame.segTo = s.route;
      frame.stops = 1;
      if (s.station !== s.route) s.set({ station: s.route });
    }
  }, -5);
  return () => {
    off();
    offCss();
    window.removeEventListener("resize", onResize);
    writeVel("", null);
  };
}
