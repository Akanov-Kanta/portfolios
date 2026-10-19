import { STATIONS, requestCut, worldStore, type StationId } from "@/components/world/state/world-store";
import { DUR } from "@/components/world/theme";

/**
 * Phone station jumps (Dock tabs, Index sheet rows). Home page, native scroll only.
 *  - one step in lap order (hero ↔ about ↔ projects ↔ contact, and contact → hero through the
 *    clone): native smooth scroll, so you watch the real flight;
 *  - farther: a DUR.jumpIn void veil ([data-jump-veil]), an instant scroll with a camera cut
 *    (requestCut), then DUR.jumpOut of veil out;
 *  - static loop mode or reduced motion: instant, no veil.
 */

let until = 0;
/** A scroll we started (jump, settle, Back restore): the Dock must not recede for it. */
export function markProgrammatic(ms = 1500): void {
  until = performance.now() + ms;
}
export const isProgrammatic = (): boolean => performance.now() < until;
if (typeof window !== "undefined") {
  // the finger takes over: whatever moves next is the user's
  window.addEventListener("touchstart", () => (until = 0), { passive: true, capture: true });
}

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Document top of a station: its section top (projects: the first article, i.e. the first stop). */
function topOf(id: StationId): number | null {
  const el = (id === "projects" && document.querySelector<HTMLElement>("#projects article")) || document.getElementById(id);
  return el ? el.getBoundingClientRect().top + window.scrollY : null;
}

/** One step in lap order. Backwards from the hero is not a step: the loop only wraps forwards. */
export function isAdjacent(from: StationId, to: StationId): boolean {
  const d = (STATIONS.indexOf(to) - STATIONS.indexOf(from) + STATIONS.length) % STATIONS.length;
  return d === 1 || (d === STATIONS.length - 1 && from !== "hero");
}

export function jump(id: StationId): void {
  const s = worldStore.getState();
  if (!s.isHome) return;
  const from = s.station;
  // contact → hero rides on through the clone to the true bottom, where touch-wrap lands on y = 0
  const wrap = id === "hero" && from === "contact" && s.loopMode === "touch-wrap";
  const top = wrap ? document.documentElement.scrollHeight - window.innerHeight : topOf(id);
  if (top === null || Math.abs(top - window.scrollY) <= 4) return;
  markProgrammatic();
  if (s.loopMode === "static" || reduced()) {
    window.scrollTo({ top, behavior: "instant" });
    requestCut();
    return;
  }
  if (isAdjacent(from, id)) {
    window.scrollTo({ top, behavior: "smooth" });
    return;
  }
  const veil = document.querySelector<HTMLElement>("[data-jump-veil]");
  veil?.setAttribute("data-on", "");
  window.setTimeout(() => {
    // re-measure: fonts or the clone may have moved layout while the veil came up
    window.scrollTo({ top: topOf(id) ?? top, behavior: "instant" });
    requestCut();
    markProgrammatic();
    // lift the veil once the frame that reads the new scroll (and draws the cut) has run
    requestAnimationFrame(() => veil?.removeAttribute("data-on"));
  }, DUR.jumpIn);
}
