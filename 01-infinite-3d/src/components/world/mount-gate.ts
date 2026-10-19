import { worldStore } from "./state/world-store";
import { DUR } from "./theme";
import { detectQuality } from "./quality";
import { isStandalone } from "./phone";

/**
 * Phone WebGL mount gate (threeD MOUNT). The world never mounts under a finger: it waits until it is
 * due (load + 1.2 s, then idle; or the first intent; or an installed-app launch), then until the page
 * is at rest (no touch down, DUR.rest since the last scroll or touchend, visible). Save-Data / 2G
 * never auto-mount: the Index sheet's "Load 3D world" (requestWorld) does. DOM layer, no three.
 */

let touches = 0;
/** last scroll / touch activity (performance.now) */
let activeAt = -Infinity;
let tracking = false;
const waiters = new Set<() => void>();
/** a touch count this old with no touch event since is stale (a lost touchend) */
const STUCK_MS = 8000;

function track() {
  if (tracking || typeof window === "undefined") return;
  tracking = true;
  const poke = () => {
    for (const w of [...waiters]) w();
  };
  const onTouch = (e: TouchEvent) => {
    touches = e.touches?.length ?? 0; // a synthetic Event("touchstart") has no touch list
    activeAt = performance.now();
    if (touches === 0) poke();
  };
  const opts = { passive: true, capture: true } as const;
  // a finger's pointerdown is dispatched BEFORE its touchstart, and pointerdown is a mount intent: count
  // the finger now, or that intent found "no touch, no scroll yet" and mounted the world under it
  addEventListener(
    "pointerdown",
    (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touches = Math.max(touches, 1);
      activeAt = performance.now();
    },
    opts,
  );
  addEventListener("touchstart", onTouch, opts);
  addEventListener("touchend", onTouch, opts);
  addEventListener("touchcancel", onTouch, opts);
  // scroll only stamps the time: each waiter's own timer re-checks it
  addEventListener("scroll", () => (activeAt = performance.now()), opts);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") touches = 0;
    poke();
  });
}

/**
 * Run cb once the page is at rest: no active touch, ≥ DUR.rest since the last scroll or touchend,
 * and visible. Returns a cancel.
 */
export function waitForRest(cb: () => void): () => void {
  track();
  let timer = 0;
  let done = false;
  const check = () => {
    if (done) return;
    window.clearTimeout(timer);
    const now = performance.now();
    if (touches > 0 && now - activeAt > STUCK_MS) touches = 0;
    if (touches > 0) {
      // re-checked on touchend; the timer only catches a lost one
      timer = window.setTimeout(check, 1000);
      return;
    }
    if (document.visibilityState !== "visible") return; // re-checked on visibilitychange
    const wait = activeAt + DUR.rest - now;
    if (wait > 0) {
      timer = window.setTimeout(check, wait + 1);
      return;
    }
    done = true;
    waiters.delete(check);
    cb();
  };
  waiters.add(check);
  check();
  return () => {
    done = true;
    window.clearTimeout(timer);
    waiters.delete(check);
  };
}

/** Save-Data or a 2G connection: the world waits for an explicit request. */
export function constrainedNetwork(): boolean {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !!c && (c.saveData === true || c.effectiveType === "2g" || c.effectiveType === "slow-2g");
}

/** ms after the load event before the idle mount may start */
const AFTER_LOAD_MS = 1200;
const IDLE_TIMEOUT_MS = 2500;
const INTENTS = ["pointerdown", "touchstart", "keydown", "scroll"] as const;

/** cb when the mount is due: load + 1.2 s then idle, or the first intent, or right away (standalone). */
function whenDue(standalone: boolean, cb: () => void): () => void {
  let done = false;
  let timer = 0;
  let idleId = 0;
  const cancel = () => {
    done = true;
    window.clearTimeout(timer);
    if (idleId && typeof cancelIdleCallback === "function") cancelIdleCallback(idleId);
    INTENTS.forEach((e) => removeEventListener(e, fire));
    removeEventListener("load", afterLoad);
  };
  const fire = () => {
    if (done) return;
    cancel();
    cb();
  };
  const afterLoad = () => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const loadedAt = nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : performance.now();
    timer = window.setTimeout(
      () => {
        if (typeof requestIdleCallback === "function") idleId = requestIdleCallback(fire, { timeout: IDLE_TIMEOUT_MS });
        else fire();
      },
      Math.max(0, loadedAt + AFTER_LOAD_MS - performance.now()),
    );
  };
  // an installed app's launch is the intent: due right after first paint (hydration is past it)
  if (standalone) {
    timer = window.setTimeout(fire, 0);
    return cancel;
  }
  INTENTS.forEach((e) => addEventListener(e, fire, { passive: true }));
  if (document.readyState === "complete") afterLoad();
  else addEventListener("load", afterLoad, { once: true });
  return cancel;
}

/**
 * Schedule the phone world mount. onMount runs at rest (the caller probes the tier there);
 * onDefer runs at once on Save-Data / 2G, and the mount then waits for worldRequested.
 */
export function scheduleWorldMount({ standalone, onMount, onDefer }: { standalone: boolean; onMount: () => void; onDefer: () => void }): () => void {
  // count touches from now on, so an intent that lands mid-touch still waits for its touchend
  track();
  let offDue = () => {};
  let offRest = () => {};
  let offReq = () => {};
  const due = () => {
    offRest = waitForRest(onMount);
  };
  if (constrainedNetwork()) {
    onDefer();
    const onReq = () => {
      if (!worldStore.getState().worldRequested) return;
      offReq();
      due();
    };
    offReq = worldStore.subscribe(onReq);
    onReq();
  } else offDue = whenDue(standalone, due);
  return () => {
    offDue();
    offRest();
    offReq();
  };
}

/** what the world's loaders fetch (Kit / Devices .glb and the Draco decoder, Kit.tsx DRACO_PATH): one missing throws */
const WORLD_ASSETS = ["/models/kit.glb", "/models/devices.glb", "/draco/draco_wasm_wrapper.js", "/draco/draco_decoder.wasm"];

/** every world asset is in the service worker's caches (false where Cache Storage is missing or throws) */
function assetsCached(): Promise<boolean> {
  if (typeof caches === "undefined") return Promise.resolve(false);
  return Promise.all(WORLD_ASSETS.map((u) => caches.match(u))).then(
    (hits) => hits.every(Boolean),
    () => false,
  );
}

/**
 * The origin answers: one HEAD the service worker never intercepts (it handles GET only), so no cached copy can
 * stand in. navigator.onLine stays true with the server down, behind a captive portal or on a dead connection.
 */
function originUp(): Promise<boolean> {
  return fetch(WORLD_ASSETS[0], { method: "HEAD", cache: "no-store" }).then(
    (r) => r.ok && !r.redirected,
    () => false,
  );
}

/**
 * cb once the world can load: its assets are all in the service worker's caches (an installed app's offline
 * launch, say) or the origin answers, and then its own JS (load: the import WorldRoot's dynamic() uses) has
 * arrived. Chunk URLs are per deploy while the assets cache is not, so cached models say nothing about the
 * chunks. Otherwise the .glb loader or the chunk would fail, and although WorldErrorBoundary drops to the
 * poster, it logs, and R3F reports a caught loader error as an uncaught one; the world would also stay off for
 * the session. So the poster simply stays, and 'online' or the page becoming visible again retries (at rest
 * again). The Dock's shimmer (mounting) runs while the chunk arrives. Returns a cancel.
 */
function whenWorldLoads(load: () => Promise<unknown>, cb: () => void): () => void {
  let live = true;
  let busy = false;
  let offRest = () => {};
  const off = () => {
    removeEventListener("online", retry);
    document.removeEventListener("visibilitychange", onVisible);
  };
  const go = () => {
    if (!live) return;
    live = false;
    off();
    cb();
  };
  const check = () => {
    if (!live || busy) return;
    busy = true;
    const store = worldStore.getState();
    assetsCached()
      .then((hit) => hit || (navigator.onLine !== false && originUp()))
      .then((ok) => {
        if (!ok || !live) return false;
        store.set({ mounting: true });
        return load().then(
          () => true,
          () => (store.set({ mounting: false }), false),
        );
      })
      .then((ok) => {
        busy = false;
        if (ok && live) go();
        else if (ok) store.set({ mounting: false }); // cancelled while the chunk arrived
      });
  };
  const retry = () => {
    offRest();
    offRest = waitForRest(check);
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") retry();
  };
  addEventListener("online", retry);
  document.addEventListener("visibilitychange", onVisible);
  check();
  return () => {
    live = false;
    offRest();
    off();
  };
}

/**
 * WorldRoot's phone mount, whole (here so desktop first-load JS never carries it): scheduled as above;
 * at rest the throwaway WebGL2 tier probe runs (on phones not at hydration), the static tier never
 * mounts, anything else sets mounting and calls mount() once the world's assets and its JS (load) can load.
 */
export function schedulePhoneWorld(mount: () => void, load: () => Promise<unknown>): () => void {
  let offAssets = () => {};
  const cancel = scheduleWorldMount({
    standalone: isStandalone(),
    onDefer: () => worldStore.getState().set({ worldDeferred: true }),
    onMount: () => {
      const t = detectQuality();
      worldStore.getState().set({ tier: t });
      if (t === "static") return;
      offAssets = whenWorldLoads(load, mount);
    },
  });
  return () => {
    cancel();
    offAssets();
  };
}
