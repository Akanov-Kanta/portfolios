import { describe, expect, it } from "vitest";
import { buildMapping } from "./anchors";
import { settleTarget, type SettleGeom } from "./touch-settle";
import { isAdjacent } from "@/components/phone/jump";

// Phone 393 x 852 lvh, 760 svh (toolbar out). Hero and clone are 100lvh; About runs 1.4 svh (bio +
// bento), projects 3 x 100svh stops, contact 150svh. The mapping measures with the stable 100svh.
const svh = 760;
const lvh = 852;
const tops = [
  { id: "hero" as const, top: 0, stops: 1 },
  { id: "about" as const, top: lvh, stops: 1 }, // 852
  { id: "projects" as const, top: lvh + 1.4 * svh, stops: 3 }, // 1916
  { id: "contact" as const, top: lvh + 4.4 * svh, stops: 1 }, // 4196
  { id: "hero-clone" as const, top: lvh + 5.9 * svh, stops: 1 }, // 5336
];
const scrollHeight = tops[4]!.top + lvh; // 6188
const m = buildMapping(tops, scrollHeight - svh, svh); // limit 5428
const g: SettleGeom = {
  articleTops: [1916, 1916 + svh, 1916 + 2 * svh],
  contactTop: 4196,
  realMax: scrollHeight - svh,
  vh: svh,
};
const seg = (from: string) => m.segments.find((s) => s.from === from)!;
/** y at `local` of a segment's flight window */
const at = (from: string, local: number) => {
  const s = seg(from);
  return s.holdEnd + local * (s.end - s.holdEnd);
};

describe("settleTarget", () => {
  it("undoes a flight released before its middle (about → projects at 0.3 → holdEnd)", () => {
    const s = seg("about");
    expect(settleTarget(at("about", 0.3), m, g)).toBeCloseTo(s.holdEnd, 6);
    expect(settleTarget(at("hero", 0.4), m, g)).toBeCloseTo(seg("hero").holdEnd, 6);
  });

  it("finishes a flight released past its middle (0.7 → the flight end)", () => {
    expect(settleTarget(at("about", 0.7), m, g)).toBe(1916);
    expect(settleTarget(at("hero", 0.6), m, g)).toBe(lvh);
    expect(settleTarget(at("projects", 0.8), m, g)).toBe(4196);
  });

  it("leaves the flight's first and last 3 % alone", () => {
    expect(settleTarget(at("about", 0.02), m, g)).toBeNull();
    expect(settleTarget(at("about", 0.98), m, g)).toBeNull();
  });

  it("glides to the nearest project stop between stops", () => {
    expect(settleTarget(1916 + 0.4 * svh, m, g)).toBe(1916);
    expect(settleTarget(1916 + 0.6 * svh, m, g)).toBe(1916 + svh);
    expect(settleTarget(1916 + 1.45 * svh, m, g)).toBe(1916 + svh);
    expect(settleTarget(1916 + 1.55 * svh, m, g)).toBe(1916 + 2 * svh);
  });

  it("undoes projects → contact onto the last stop, not mid-article", () => {
    expect(settleTarget(at("projects", 0.3), m, g)).toBe(1916 + 2 * svh);
    // resting exactly on the hold end (past the last stop) also comes back to it
    expect(settleTarget(seg("projects").holdEnd - 1, m, g)).toBe(1916 + 2 * svh);
  });

  it("normalises contact to top + 0.5·svh", () => {
    expect(settleTarget(4196 + 0.6 * svh, m, g)).toBe(4196 + 0.5 * svh);
    // the first half of the rise into the clone also returns to the contact rest
    expect(settleTarget(at("contact", 0.3), m, g)).toBe(4196 + 0.5 * svh);
    // above the rest point contact reads freely
    expect(settleTarget(4196 + 0.2 * svh, m, g)).toBeNull();
  });

  it("finishes the lap into the clone: the true bottom, where touch-wrap jumps to 0", () => {
    expect(settleTarget(at("contact", 0.6), m, g)).toBe(g.realMax);
    expect(settleTarget(0.98 * m.limit, m, g)).toBe(g.realMax);
    expect(settleTarget(tops[4]!.top + 20, m, g)).toBe(g.realMax);
  });

  it("never moves the hero or About holds", () => {
    for (const y of [0, 60, 120, 900, 1000, 1200]) expect(settleTarget(y, m, g)).toBeNull();
  });

  it("skips moves of 4 px or less", () => {
    expect(settleTarget(1916 + 3, m, g)).toBeNull();
    expect(settleTarget(4196 + 0.5 * svh + 4, m, g)).toBeNull();
    expect(settleTarget(4196 + 0.5 * svh + 5, m, g)).toBe(4196 + 0.5 * svh);
  });

  it("has no wrap rule on a page without the clone (static / finite)", () => {
    const flat = buildMapping(tops.slice(0, 4), tops[3]!.top + 1.5 * svh - svh, svh);
    const y = 0.99 * flat.limit;
    expect(settleTarget(y, flat, { ...g, realMax: flat.limit })).not.toBe(flat.limit);
  });

  it("returns null without segments", () => {
    expect(settleTarget(100, { segments: [], limit: 1, vh: svh }, g)).toBeNull();
  });
});

describe("jump adjacency (lap order)", () => {
  it("steps one station either way, and contact → hero forwards through the clone", () => {
    expect(isAdjacent("hero", "about")).toBe(true);
    expect(isAdjacent("about", "hero")).toBe(true);
    expect(isAdjacent("projects", "contact")).toBe(true);
    expect(isAdjacent("contact", "projects")).toBe(true);
    expect(isAdjacent("contact", "hero")).toBe(true);
  });
  it("treats everything else as far (veil + cut)", () => {
    expect(isAdjacent("hero", "contact")).toBe(false);
    expect(isAdjacent("hero", "projects")).toBe(false);
    expect(isAdjacent("about", "contact")).toBe(false);
    expect(isAdjacent("contact", "about")).toBe(false);
  });
});
