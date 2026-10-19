/** One-frame colour flash (~80ms) for impact moments. Skipped under reduced motion. */
export function flashFrame(color = "var(--rice)", ms = 80) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = `position:fixed;inset:0;z-index:80;pointer-events:none;background:${color};`;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), ms);
}
