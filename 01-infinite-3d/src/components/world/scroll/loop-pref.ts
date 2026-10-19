import { useSyncExternalStore } from "react";

/** "Loop: on/off" user preference. Tiny external store so React and the scroll layer share it. */
const KEY = "portfolio.loop";
type Pref = "on" | "off";
const listeners = new Set<() => void>();
// read once: useSyncExternalStore calls the snapshot on every render/check
let cached: Pref | null = null;

export function readLoopPref(): Pref {
  if (cached) return cached;
  try {
    cached = localStorage.getItem(KEY) === "off" ? "off" : "on";
  } catch {
    cached = "on";
  }
  return cached;
}
export function writeLoopPref(v: Pref) {
  cached = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  listeners.forEach((l) => l());
}
export function subscribeLoopPref(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function useLoopPref(): Pref {
  return useSyncExternalStore(subscribeLoopPref, readLoopPref, () => "on");
}
