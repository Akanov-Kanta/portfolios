/** Touch: native scroll; when it comes to rest on the clone (bottom), jump to the identical top frame. */
export function installTouchWrap(onWrap?: () => void): () => void {
  let timer = 0;
  const check = () => {
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    if (limit > 0 && window.scrollY >= limit - 2) {
      window.scrollTo({ top: 0, behavior: "instant" });
      onWrap?.();
    }
  };
  const debounced = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(check, 140);
  };
  const hasScrollEnd = "onscrollend" in window;
  if (hasScrollEnd) window.addEventListener("scrollend", check);
  else window.addEventListener("scroll", debounced, { passive: true });
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("scrollend", check);
    window.removeEventListener("scroll", debounced);
  };
}
