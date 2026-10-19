/**
 * The service-worker half of PwaRegister, fetched only where it acts (a phone in production, or
 * next dev / NEXT_PUBLIC_SW=off anywhere), so desktops and tablets never download it.
 */

/** this app's cache names (public/sw.js); dev and the kill switch only ever delete these */
const OWN_CACHE = /^(core|pages|static|assets)-/;
/** what the page fetched before the worker controlled it: replayed into the worker's caches ("warm") */
const WARM = /^\/(?:_next\/static\/|models\/|draco\/)/;

/** next dev / NEXT_PUBLIC_SW=off: drop any worker a production run left behind, and its caches. */
export function unregisterOwn(sw: ServiceWorkerContainer): void {
  sw.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister()), () => {});
  window.caches?.keys().then((ks) => ks.filter((k) => OWN_CACHE.test(k)).forEach((k) => void caches.delete(k)), () => {});
}

/**
 * A client-side route change (a <Link>): the worker never sees it (RSC requests are not intercepted), so the
 * page it shows would never be readable offline, and an installed app reaches every project that way. Ask the
 * controlling worker to store this page's HTML too (the "warm" message: one revalidating GET, no RSC cached),
 * at idle. Before a worker controls the page, scheduleRegister's first warm covers where the visitor is.
 */
export function warmRoute(sw: ServiceWorkerContainer, href: string): void {
  // href is the page as it was routed to: a quick second route change posts its own page, this one still lands.
  // Leaving the document first (a full navigation, the app closed) posts at once: the worker finishes the fetch.
  let done = false;
  const post = () => {
    if (done) return;
    done = true;
    window.removeEventListener("pagehide", post);
    sw.controller?.postMessage({ type: "warm", urls: [], pages: [href] });
  };
  window.addEventListener("pagehide", post);
  // Safari has no requestIdleCallback
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(post, { timeout: 1500 });
  else window.setTimeout(post, 500);
}

/** Register /sw.js after load + idle (never competing with the LCP or the world mount). Returns a cancel. */
export function scheduleRegister(sw: ServiceWorkerContainer): () => void {
  const wasControlled = !!sw.controller;
  const register = async () => {
    try {
      const reg = await sw.register("/sw.js", { scope: "/", updateViaCache: "none" });
      if (wasControlled) return; // every request of this page already went through the worker
      await sw.ready;
      // once each: the world's HEAD probe (mount-gate) and its loader GET share a name, and the worker warms the
      // list in parallel (two fetches and, in WebKit, two cache entries for one file)
      const urls = [
        ...new Set(
          performance
            .getEntriesByType("resource")
            .map((e) => e.name)
            .filter((u) => {
              try {
                const x = new URL(u);
                return x.origin === location.origin && WARM.test(x.pathname);
              } catch {
                return false;
              }
            }),
        ),
      ];
      // the landing page (a shared project link, say) and where the visitor is now: both readable offline
      const landing = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.name;
      const pages = [...new Set([landing, location.href].filter((u): u is string => !!u))];
      (reg.active ?? sw.controller)?.postMessage({ type: "warm", urls, pages });
    } catch {}
  };
  let cancel = () => {};
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => void register(), { timeout: 5000 });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(() => void register(), 2000);
      cancel = () => window.clearTimeout(id);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    cancel();
  };
}
