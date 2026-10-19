import { requestCut } from "../state/world-store";
import { isPhone } from "../phone";
import { markProgrammatic } from "@/components/phone/jump";
import { returnSlot } from "./return-slot";

/**
 * Phone Back restore: returning from /projects/<slug> (the ← button, Android back, the iOS edge
 * swipe) lands on that project's stop with an instant scroll and a camera cut, not a fly-through
 * from the hero. Links to '/' and fresh loads still open at the hero. Desktop never restores.
 * The phone-only PhoneHud chunk loads this module right after hydration on any route (so this popstate
 * listener is live before any Back); it fills returnSlot, which HomeLoop runs from a layout effect on
 * every home mount.
 */
const KEY = "portfolio.return";
/** Back must land within this of the popstate to count as one */
const POP_MS = 1500;
const MAX_AGE_MS = 30 * 60 * 1000;
const UAVT_MS = 600;

let popAt = -Infinity;
let uavtTimer = 0;
if (typeof window !== "undefined") {
  returnSlot.run = restoreReturn;
  window.addEventListener("popstate", (e) => {
    popAt = performance.now();
    // iOS swipe-back already animated the page: skip our view-transition (phone-runtime.css keys on this)
    if ((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) {
      const html = document.documentElement;
      html.dataset.uavt = "";
      window.clearTimeout(uavtTimer);
      uavtTimer = window.setTimeout(() => delete html.dataset.uavt, UAVT_MS);
    }
  });
}

/** Remember which project a phone home tap opens (capture phase: before Link navigates). */
export function installReturnCapture(): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href^='/projects/']");
    if (!a || !isPhone() || location.pathname !== "/") return;
    const slug = (a.getAttribute("href") ?? "").slice("/projects/".length).split(/[/?#]/)[0];
    if (!slug) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ slug, at: Date.now() }));
    } catch {}
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}

/**
 * If this home mount is a Back and a fresh entry exists: jump to #project-<slug> and cut the camera.
 * Runs in a layout effect, so requestCut() is set before WorldRoot's route effect decides between a
 * route flight and a cut. "A Back": React commits a traversal synchronously inside Next's popstate
 * handler (which was registered first, so the listener above has not run yet): window.event is that
 * popstate. Where the commit comes later (a suspended render), the listener's timestamp covers it.
 */
export function restoreReturn(): void {
  const inPop = (window.event as Event | undefined)?.type === "popstate";
  if (!isPhone() || (!inPop && performance.now() - popAt > POP_MS)) return;
  let entry: { slug?: unknown; at?: unknown } | null = null;
  try {
    entry = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    sessionStorage.removeItem(KEY);
  } catch {}
  if (typeof entry?.slug !== "string" || typeof entry.at !== "number" || Date.now() - entry.at > MAX_AGE_MS) return;
  const el = document.getElementById(`project-${entry.slug}`);
  if (!el) return;
  const go = () => {
    markProgrammatic();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    requestCut();
  };
  go();
  // late layout (fonts, the loop clone, the route's view transition) can shift the article once
  requestAnimationFrame(() => {
    if (el.isConnected && Math.abs(el.getBoundingClientRect().top) > 2) go();
  });
}
