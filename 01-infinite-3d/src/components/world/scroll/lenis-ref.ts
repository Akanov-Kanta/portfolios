import type Lenis from "lenis";
/** Module-level handle so HUD/menu/dialogs can stop/start/scrollTo without prop drilling. */
export const lenisRef: { current: Lenis | null } = { current: null };

/** Scroll the home page to a station section (nav pill, lap map). Native scroll respects reduced motion. */
export function scrollToStation(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
