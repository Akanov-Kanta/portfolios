/**
 * One requestAnimationFrame loop for the whole film: sprites, the wind shader and the particles all tick
 * from here. It only runs while something is subscribed and the tab is visible.
 */

export type FrameFn = (now: number, dt: number) => void;

const fns = new Set<FrameFn>();
let raf = 0;
let last = 0;
let wired = false;

function loop(now: number) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(64, now - (last || now));
  last = now;
  fns.forEach((fn) => fn(now, dt));
}

function start() {
  if (raf || !fns.size || document.hidden) return;
  last = 0;
  raf = requestAnimationFrame(loop);
}

function stop() {
  cancelAnimationFrame(raf);
  raf = 0;
}

export function onFrame(fn: FrameFn) {
  if (!wired) {
    wired = true;
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }
  fns.add(fn);
  start();
  return () => {
    fns.delete(fn);
    if (!fns.size) stop();
  };
}
