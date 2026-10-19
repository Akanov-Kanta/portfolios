"use client";

import { useSyncExternalStore } from "react";
import { projectBySlug } from "@/content/site";

/**
 * The open project file lives in the URL (?file=<slug>), so files are deep-linkable and Back closes
 * them. This is a tiny store over location.search: it updates on popstate and on our own push/replace.
 * `intent` carries how the next open should animate (set just before the URL changes).
 */
const EVENT = "casefile:route";

export type OpenMode = "flip" | "cut" | "deeplink";
const intent: { mode: OpenMode; time: number; at: number } = { mode: "deeplink", time: 0, at: -1e9 };

/** How the file view should open: the intent set by openFile() if it is fresh, else a deep link
 * (first load, Back/Forward). Read-only, so StrictMode's double effects see the same answer. */
export function readIntent(): { mode: OpenMode; time: number } {
  return performance.now() - intent.at < 1000 ? { mode: intent.mode, time: intent.time } : { mode: "deeplink", time: 0 };
}

const readSlug = () => {
  const s = new URLSearchParams(window.location.search).get("file");
  return projectBySlug(s) ? s : null;
};

function subscribe(fn: () => void) {
  window.addEventListener("popstate", fn);
  window.addEventListener(EVENT, fn);
  return () => {
    window.removeEventListener("popstate", fn);
    window.removeEventListener(EVENT, fn);
  };
}

export const useFileSlug = () => useSyncExternalStore(subscribe, readSlug, () => null);

export function openFile(slug: string, mode: OpenMode, time = 0) {
  intent.mode = mode;
  intent.time = time;
  intent.at = performance.now();
  const url = `${window.location.pathname}?file=${slug}${window.location.hash}`;
  const st = window.history.state as { casefile?: boolean } | null;
  // file → file (NEXT FILE) replaces, so Back still leaves the file view in one step
  if (st?.casefile) window.history.replaceState({ ...st, casefile: true }, "", url);
  else window.history.pushState({ casefile: true }, "", url);
  window.dispatchEvent(new Event(EVENT));
}

export function closeFile() {
  const st = window.history.state as { casefile?: boolean } | null;
  if (st?.casefile) {
    window.history.back(); // popstate updates the store
    return;
  }
  window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  window.dispatchEvent(new Event(EVENT));
}
