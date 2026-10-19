/**
 * One requestAnimationFrame for everything. Callbacks run in ascending priority:
 *   -10 lenis.raf → 0 R3F advance → +10 DOM label projection.
 * Returns an unsubscribe. Starts/stops itself with the first/last subscriber.
 */
type Tick = (time: number, dt: number) => void;
interface Entry { fn: Tick; priority: number; failed?: boolean }

let entries: Entry[] = [];
let raf = 0;
let last = 0;

function loop(time: number) {
  raf = requestAnimationFrame(loop);
  const dt = last ? Math.min(0.1, (time - last) / 1000) : 1 / 60;
  last = time;
  // add/remove replace `entries` (copy-on-write), so a callback may unsubscribe mid-frame
  for (const e of entries) {
    // one throwing callback must not stop the ones after it (R3F, labels, cursor) every frame
    try {
      e.fn(time, dt);
    } catch (err) {
      if (!e.failed) console.error("[ticker]", err);
      e.failed = true;
    }
  }
}

export function addTick(fn: Tick, priority = 0): () => void {
  const entry: Entry = { fn, priority };
  entries = [...entries, entry].sort((a, b) => a.priority - b.priority);
  if (entries.length === 1 && typeof window !== "undefined") {
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  return () => {
    entries = entries.filter((e) => e !== entry);
    if (entries.length === 0 && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
