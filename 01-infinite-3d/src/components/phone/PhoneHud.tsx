"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePhoneLand } from "@/components/world/phone";
import { requestCut, useWorld } from "@/components/world/state/world-store";
import { Dock } from "./Dock";
import { JumpVeil } from "./JumpVeil";
import { FirstRunHint } from "./FirstRunHint";
import { PhoneHome } from "./PhoneHome";

const loadSheet = () => import("./IndexSheet");
/**
 * The Index sheet is its own chunk: preloaded at idle, so the first Menu tap opens at once. It renders only once
 * that chunk has resolved (the preload, or Menu's own load), so offline with the chunk uncached a tap does nothing
 * instead of taking the route down; the loader cannot reject either way.
 */
const IndexSheet = dynamic(() => loadSheet().catch(() => ({ default: () => null })), { ssr: false });
/** once per page load: PhoneHome's two lazy chunks were fetched for the worker's cache */
let homeChunksWarmed = false;

/**
 * Phone chrome, mounted by StationHud only while usePhone() (a lazy chunk: desktops never load it):
 * the jump veil, the one-time swipe cue (portrait), the Dock / rail and the Index sheet. Everything
 * sits in StationHud's fixed, pointer-events:none HUD layer.
 * It also carries the phone wiring that would otherwise sit in every route's first-load JS: the Back
 * restore (restore.ts fills HomeLoop's returnSlot and listens for popstate from the first route on), the
 * home wiring (PhoneHome, while the home page shows) and the service-worker registration (production,
 * after load + idle; NEXT_PUBLIC_SW=off turns it off), plus the offline copy of each page a <Link> opens.
 */
export default function PhoneHud() {
  const land = usePhoneLand();
  const isHome = useWorld((s) => s.isHome);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const ready = useWorld((s) => s.webglReady);
  const pathname = usePathname();
  const landing = useRef<string | null>(null);
  const routeSeen = useRef<string | null>(null);

  // the DOM stand-ins (DeviceCard, server-rendered) cross-fade out while the world is ready
  useEffect(() => {
    document.documentElement.toggleAttribute("data-world-ready", ready);
    return () => document.documentElement.removeAttribute("data-world-ready");
  }, [ready]);

  useEffect(() => {
    const offs: (() => void)[] = [];
    let alive = true;
    import("@/components/world/scroll/restore").then((m) => {
      if (alive) offs.push(m.installReturnCapture());
    }, () => {});
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SW !== "off" && "serviceWorker" in navigator && navigator.serviceWorker) {
      const sw = navigator.serviceWorker;
      import("@/components/pwa/register").then((m) => {
        if (alive) offs.push(m.scheduleRegister(sw));
      }, () => {});
    }
    return () => {
      alive = false;
      offs.forEach((off) => off());
    };
  }, []);

  // A route change is the transition on a phone (the 400 ms frost), never a fly-through: a project page cuts to
  // its device, and a Link home (the Dock's inner-page tabs, '← Back to projects', the monogram) cuts to the stop
  // the page landed on (the driver maps it on its next tick; the monogram's lands on the hero). A flight from a
  // project page would also carry the device park's lift through the void. A layout effect: it runs before
  // WorldRoot's route effect (a passive one), which then cuts.
  useLayoutEffect(() => {
    if (routeSeen.current === null) {
      routeSeen.current = pathname;
      return;
    }
    if (routeSeen.current === pathname) return;
    routeSeen.current = pathname;
    requestCut();
  }, [pathname]);

  // a client-side route change: the worker stores that page for offline too (register.ts warmRoute). The landing
  // page is already covered (the worker's navigation handler, or scheduleRegister's first warm).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SW === "off" || !("serviceWorker" in navigator) || !navigator.serviceWorker) return;
    if (landing.current === null) {
      landing.current = pathname;
      return;
    }
    const sw = navigator.serviceWorker;
    const href = location.href;
    import("@/components/pwa/register").then((m) => m.warmRoute(sw, href), () => {});
  }, [pathname]);

  // a visit that never reaches the home page (a shared project link, then Install) must still find the home's
  // lazy chunks offline: once the worker controls a project page, fetch them at idle so its cache-first stores them
  useEffect(() => {
    if (isHome || homeChunksWarmed || process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SW === "off" || !("serviceWorker" in navigator) || !navigator.serviceWorker) return;
    const sw = navigator.serviceWorker;
    const w = window as Window & { requestIdleCallback?: Window["requestIdleCallback"] };
    let idle = 0;
    let timer = 0;
    const warm = () => {
      if (homeChunksWarmed) return;
      homeChunksWarmed = true;
      import("@/components/world/scroll/touch-settle").catch(() => {});
      import("@/components/home/OrbStage").catch(() => {});
    };
    // a first visit: the worker registers after load and claims the page later
    const schedule = () => {
      if (!sw.controller || idle || timer) return;
      sw.removeEventListener("controllerchange", schedule);
      if (w.requestIdleCallback) idle = w.requestIdleCallback(warm, { timeout: 8000 });
      else timer = window.setTimeout(warm, 2000);
    };
    sw.addEventListener("controllerchange", schedule);
    schedule();
    return () => {
      sw.removeEventListener("controllerchange", schedule);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [isHome]);

  useEffect(() => {
    let alive = true;
    let loaded = false;
    let stopRest = () => {};
    // the closed sheet's first render is a long task (~60 ms on a mid phone): like the world, it waits
    // until no finger is down and the page is at rest (mount-gate is already loaded on phones).
    // Offline with the chunk uncached the preload fails quietly, and 'online' runs it again.
    const preload = () => {
      if (loaded) return;
      Promise.all([loadSheet(), import("@/components/world/mount-gate")]).then(
        ([, gate]) => {
          if (!alive || loaded) return;
          loaded = true;
          removeEventListener("online", preload);
          stopRest = gate.waitForRest(() => alive && setSheet(true));
        },
        () => {},
      );
    };
    addEventListener("online", preload);
    // Safari only got requestIdleCallback recently
    const w = window as Window & { requestIdleCallback?: Window["requestIdleCallback"] };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(preload, { timeout: 4000 }) : 0;
    const timer = idle ? 0 : window.setTimeout(preload, 2000);
    return () => {
      alive = false;
      removeEventListener("online", preload);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      stopRest();
    };
  }, []);

  return (
    <>
      <JumpVeil />
      {!land && <FirstRunHint />}
      {isHome && <PhoneHome />}
      <Dock
        menuOpen={open}
        menuRef={menuRef}
        onMenu={() => {
          // already resolved after the idle preload (a microtask); offline with the chunk missing, nothing opens
          loadSheet().then(
            () => {
              setSheet(true);
              setOpen(true);
            },
            () => {},
          );
        }}
      />
      {sheet && <IndexSheet open={open} onClosed={() => setOpen(false)} menuRef={menuRef} />}
    </>
  );
}
