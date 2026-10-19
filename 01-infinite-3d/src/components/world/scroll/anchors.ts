import { frame, type Mapping, type Segment, type StationId } from "../state/world-store";
import { STATION_T } from "../path/stations";
import { clamp01, smootherstep } from "../math";

export const wrap01 = (x: number) => x - Math.floor(x);
/** Share of a viewport, before the next section's top reaches the top edge, spent flying. */
export const WINDOW_VH = 0.85;

type AnchorId = StationId | "hero-clone";
export interface AnchorTop { id: AnchorId; top: number; stops: number }

export function measureAnchors(root: HTMLElement, vh = window.innerHeight): Mapping {
  const y = window.scrollY;
  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-station]"));
  const tops: AnchorTop[] = nodes.map((el) => ({
    id: el.dataset.station as AnchorId,
    top: el.getBoundingClientRect().top + y,
    stops: Number(el.dataset.stops ?? 1) || 1,
  }));
  const limit = Math.max(1, document.documentElement.scrollHeight - vh);
  return buildMapping(tops, limit, vh);
}

/** Pure part of measureAnchors (unit-tested). */
export function buildMapping(tops: AnchorTop[], limit: number, vh: number): Mapping {
  const segments: Segment[] = [];
  for (let i = 0; i < tops.length - 1; i++) {
    const a = tops[i], b = tops[i + 1];
    const from: StationId = a.id === "hero-clone" ? "hero" : a.id;
    const to: StationId = b.id === "hero-clone" ? "hero" : b.id;
    const end = Math.min(b.top, limit);
    const holdEnd = Math.max(a.top, end - WINDOW_VH * vh);
    const t0 = STATION_T[from];
    let t1 = b.id === "hero-clone" ? 1 : STATION_T[to];
    if (t1 <= t0) t1 += 1;
    segments.push({ from, to, start: a.top, holdEnd, end, t0, t1, stops: a.stops });
  }
  return { segments, limit, vh };
}

export interface Mapped {
  t: number;
  bell: number;
  local: number;
  /** 0..1 progress through the hold zone of the current segment */
  hold: number;
  /** viewports scrolled into the current segment */
  vhIn: number;
  from: StationId;
  to: StationId;
  stops: number;
  station: StationId;
}

export function mapScroll(y: number, m: Mapping): Mapped {
  const segs = m.segments;
  let i = segs.findIndex((s) => y < s.end);
  if (i < 0) i = segs.length - 1;
  const s = segs[i];
  const local = s.end > s.holdEnd ? clamp01((y - s.holdEnd) / (s.end - s.holdEnd)) : 0;
  const hold = s.holdEnd > s.start ? clamp01((y - s.start) / (s.holdEnd - s.start)) : 0;
  const e = smootherstep(local);
  return {
    t: wrap01(s.t0 + (s.t1 - s.t0) * e),
    bell: Math.sin(Math.PI * local),
    local,
    hold,
    vhIn: (y - s.start) / m.vh,
    from: s.from,
    to: s.to,
    stops: s.stops,
    station: local < 0.5 ? s.from : s.to,
  };
}

export interface ObserveOptions {
  /** viewport height for the mapping (phones: stableVh, 100svh, so a toolbar move never re-maps) */
  vh?: () => number;
  /** window resizes re-measure only when innerWidth changes (phones: height-only toolbar resizes are ignored) */
  widthOnly?: boolean;
}

/** Re-measure on layout changes (fonts, images, resize). Home only. */
export function observeAnchors(root: HTMLElement, opts: ObserveOptions = {}): () => void {
  let alive = true;
  const run = () => {
    // fonts.ready can resolve after cleanup: don't write a mapping for a detached root
    if (alive) frame.mapping = measureAnchors(root, opts.vh ? opts.vh() : window.innerHeight);
  };
  let width = window.innerWidth;
  const onResize = () => {
    if (opts.widthOnly && window.innerWidth === width) return;
    width = window.innerWidth;
    run();
  };
  run();
  const ro = new ResizeObserver(run);
  ro.observe(root);
  window.addEventListener("resize", onResize, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(run).catch(() => {});
  return () => {
    alive = false;
    ro.disconnect();
    window.removeEventListener("resize", onResize);
  };
}
