import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMapping, mapScroll, observeAnchors, WINDOW_VH } from "./anchors";
import { STATION_T } from "../path/stations";
import { frame } from "../state/world-store";

const vh = 900;
// hero 1vh, about 1vh, projects 3vh, contact 1.5vh, clone 1vh
const tops = [
  { id: "hero" as const, top: 0, stops: 1 },
  { id: "about" as const, top: 900, stops: 1 },
  { id: "projects" as const, top: 1800, stops: 3 },
  { id: "contact" as const, top: 4500, stops: 1 },
  { id: "hero-clone" as const, top: 5850, stops: 1 },
];
const limit = 5850; // scrollHeight (6750) - vh
const m = buildMapping(tops, limit, vh);

describe("mapScroll", () => {
  it("starts at t=0 on the hero", () => {
    const r = mapScroll(0, m);
    expect(r.t).toBe(0);
    expect(r.bell).toBe(0);
    expect(r.station).toBe("hero");
  });
  it("is seam-continuous: limit-1 ≈ 1 and limit ≡ 0", () => {
    expect(mapScroll(limit - 1, m).t).toBeGreaterThan(0.99);
    expect(mapScroll(limit, m).t).toBe(0);
  });
  it("is monotonic in y apart from the single wrap", () => {
    let prev = -1, wraps = 0;
    for (let y = 0; y < limit; y += 5) {
      const t = mapScroll(y, m).t;
      if (t < prev - 1e-9) wraps++;
      prev = t;
    }
    expect(wraps).toBe(0);
    // the only drop is the wrap itself, exactly at the limit
    expect(mapScroll(limit, m).t).toBe(0);
  });
  it("has bell = 0 at every segment start and end", () => {
    for (const s of m.segments) {
      expect(mapScroll(s.start, m).bell).toBeCloseTo(0, 6);
      expect(mapScroll(s.holdEnd, m).bell).toBeCloseTo(0, 6);
      expect(mapScroll(Math.min(s.end, limit), m).bell).toBeCloseTo(0, 6);
    }
  });
  it("holds tall sections for height - window", () => {
    const projects = m.segments.find((s) => s.from === "projects")!;
    expect(projects.holdEnd - projects.start).toBeCloseTo(2700 - WINDOW_VH * vh, 6);
    expect(projects.stops).toBe(3);
  });
  it("lands on each station's curve parameter at rest", () => {
    expect(mapScroll(900, m).t).toBeCloseTo(STATION_T.about, 9);
    expect(mapScroll(1800, m).t).toBeCloseTo(STATION_T.projects, 9);
    expect(mapScroll(4500, m).t).toBeCloseTo(STATION_T.contact, 9);
  });
});

// Phone (393 x 852 lvh, 760 svh with the toolbar out): hero and clone are 100lvh, the rest is sized
// in svh. The mapping uses the stable 100svh, so it never moves with the toolbar.
const svh = 760, lvh = 852;
const phoneTops = [
  { id: "hero" as const, top: 0, stops: 1 },
  { id: "about" as const, top: lvh, stops: 1 },
  { id: "projects" as const, top: lvh + svh, stops: 3 },
  { id: "contact" as const, top: lvh + 4 * svh, stops: 1 },
  { id: "hero-clone" as const, top: lvh + 5.5 * svh, stops: 1 },
];
const phoneScrollHeight = lvh + 5.5 * svh + lvh;

describe("phone mapping (stable vh)", () => {
  const pm = buildMapping(phoneTops, phoneScrollHeight - svh, svh);
  const projects = pm.segments.find((s) => s.from === "projects")!;

  it("puts every project stop on a whole viewport, so the device index is the article index", () => {
    for (let i = 0; i < 3; i++) {
      const r = mapScroll(projects.start + i * svh, pm);
      expect(r.vhIn).toBeCloseTo(i, 9);
      expect(r.t).toBeCloseTo(STATION_T.projects, 9);
      expect(r.station).toBe("projects");
      expect(Math.min(Math.round(r.vhIn), r.stops - 1)).toBe(i);
    }
    // the last stop is still inside the hold: the flight to contact starts 0.85 svh before it ends
    expect(projects.holdEnd).toBeCloseTo(projects.start + 3 * svh - WINDOW_VH * svh, 6);
    expect(mapScroll(projects.start + 2 * svh, pm).local).toBe(0);
  });

  it("ends the lap at the clone top whichever way the toolbar is (max scroll with lvh or svh)", () => {
    const cloneTop = phoneTops[4]!.top;
    // toolbar collapsed: innerHeight = lvh, the real scroll max is exactly the clone top
    expect(phoneScrollHeight - lvh).toBe(cloneTop);
    expect(mapScroll(cloneTop, pm).t).toBe(0);
    // toolbar out: the page scrolls lvh - svh further, still on the seam frame
    expect(mapScroll(phoneScrollHeight - svh, pm).t).toBe(0);
    expect(mapScroll(cloneTop - 1, pm).t).toBeGreaterThan(0.99);
  });
});

describe("observeAnchors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    frame.mapping = null;
  });

  function stubDom(win: { innerWidth: number; innerHeight: number }) {
    const listeners = new Map<string, () => void>();
    vi.stubGlobal("window", {
      get innerWidth() {
        return win.innerWidth;
      },
      get innerHeight() {
        return win.innerHeight;
      },
      scrollY: 0,
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
    });
    vi.stubGlobal("document", { documentElement: { scrollHeight: phoneScrollHeight }, fonts: undefined });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    const nodes = phoneTops.map((a) => ({ dataset: { station: a.id, stops: String(a.stops) }, getBoundingClientRect: () => ({ top: a.top }) }));
    const root = { querySelectorAll: () => nodes } as unknown as HTMLElement;
    return { listeners, root };
  }

  it("widthOnly: a height-only resize (toolbar) keeps the mapping; a width change re-measures", () => {
    const win = { innerWidth: 393, innerHeight: svh };
    const { listeners, root } = stubDom(win);
    const off = observeAnchors(root, { vh: () => svh, widthOnly: true });
    const first = frame.mapping;
    expect(first?.vh).toBe(svh);
    win.innerHeight = lvh;
    listeners.get("resize")!();
    expect(frame.mapping).toBe(first);
    win.innerWidth = 852;
    listeners.get("resize")!();
    expect(frame.mapping).not.toBe(first);
    off();
    expect(listeners.has("resize")).toBe(false);
  });

  it("desktop (no options): every resize re-measures with innerHeight", () => {
    const win = { innerWidth: 1440, innerHeight: 900 };
    const { listeners, root } = stubDom(win);
    const off = observeAnchors(root);
    const first = frame.mapping;
    expect(first?.vh).toBe(900);
    win.innerHeight = 800;
    listeners.get("resize")!();
    expect(frame.mapping).not.toBe(first);
    expect(frame.mapping?.vh).toBe(800);
    off();
  });
});
