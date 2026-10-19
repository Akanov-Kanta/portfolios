"use client";
import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

const never = () => () => {};
const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
/** Web Share support (fixed for the page's life); false on the server and during hydration */
export const useCanShare = () => useSyncExternalStore(never, canShare, () => false);

/** The iOS share glyph (a tray with an arrow out of it), 14 px, decorative. */
export function ShareGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M8 10V1.5M5 4.5l3-3 3 3M5.5 7H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** [ Share ]: what the installed app offers instead of Install. Renders nothing without navigator.share. */
export function ShareButton() {
  const ok = useCanShare();
  if (!ok) return null;
  const share = () => {
    navigator.share({ title: site.name, url: location.origin + location.pathname }).catch(() => {});
  };
  return (
    <button type="button" data-pwa-pill data-pwa-share onClick={share}>
      <ShareGlyph />
      <span className="bracket">{site.phone.share}</span>
    </button>
  );
}
