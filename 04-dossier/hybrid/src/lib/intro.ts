"use client";

/**
 * The cold open's "hit": the moment the loader hard-cuts to the hero. Components that wait for it
 * (the hero's caption and footage, Lenis) subscribe here; after the hit, subscribers fire at once.
 * The loader is skipped (hit fires on mount) on repeat visits, deep links and reduced motion: an inline
 * script in app/layout.tsx sets <html data-intro="skip"> before first paint.
 */
let hit = false;
const subs = new Set<() => void>();

export const SEEN_KEY = "casefile:seen";
export const introHit = () => hit;

export function markHit() {
  if (hit) return;
  hit = true;
  subs.forEach((fn) => fn());
  subs.clear();
}

export function onHit(fn: () => void): () => void {
  if (hit) {
    fn();
    return () => {};
  }
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

/** Runs before first paint (inlined in <head>): decide whether the cold open plays. */
export const INTRO_SCRIPT = `try{var d=document.documentElement,r=matchMedia("(prefers-reduced-motion: reduce)").matches,s=localStorage.getItem("${SEEN_KEY}"),f=/[?&]file=/.test(location.search);d.dataset.intro=(r||s||f)?"skip":"run"}catch(e){document.documentElement.dataset.intro="skip"}`;
