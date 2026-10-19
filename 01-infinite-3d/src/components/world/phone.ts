import { useSyncExternalStore } from "react";

/**
 * THE mobile gate. A "phone" is a touch-primary device whose viewport is narrow (portrait) or short
 * (landscape). Desktops (fine pointer, any size), touch laptops and tablets are never phones.
 * Mirrored byte-for-byte by the @custom-variant blocks in app/globals.css (phone.test.ts checks).
 */
export const PHONE_MQ = "(pointer: coarse) and (max-width: 767px), (pointer: coarse) and (max-height: 500px)";
/** strict subset: a phone held in landscape */
export const PHONE_LAND_MQ = "(pointer: coarse) and (max-height: 500px) and (orientation: landscape)";
/** strict subset: a phone running the installed app */
export const PHONE_APP_MQ = "(pointer: coarse) and (max-width: 767px) and (display-mode: standalone), (pointer: coarse) and (max-height: 500px) and (display-mode: standalone)";
export const STANDALONE_MQ = "(display-mode: standalone)";

const matches = (q: string) => typeof window !== "undefined" && window.matchMedia(q).matches;
export const isPhone = () => matches(PHONE_MQ);
export const isPhoneLand = () => matches(PHONE_LAND_MQ);
export const isStandalone = () =>
  matches(STANDALONE_MQ) || (typeof navigator !== "undefined" && (navigator as Navigator & { standalone?: boolean }).standalone === true);

const sub = (q: string) => (cb: () => void) => {
  const m = window.matchMedia(q);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const subPhone = sub(PHONE_MQ);
const subLand = sub(PHONE_LAND_MQ);
const subApp = sub(STANDALONE_MQ);
/** live; false on the server and during hydration, so phone-only UI mounts right after hydration */
export const usePhone = () => useSyncExternalStore(subPhone, isPhone, () => false);
export const usePhoneLand = () => useSyncExternalStore(subLand, isPhoneLand, () => false);
export const useStandalone = () => useSyncExternalStore(subApp, isStandalone, () => false);

let svh = 0;
let svhW = -1;
/** 100svh in px: stable while mobile toolbars move; re-measured only when the width changes. */
export function stableVh(): number {
  if (typeof window === "undefined") return 0;
  if (svh > 0 && window.innerWidth === svhW) return svh;
  const el = document.createElement("div");
  el.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(el);
  svh = el.getBoundingClientRect().height || window.innerHeight;
  el.remove();
  svhW = window.innerWidth;
  return svh;
}
