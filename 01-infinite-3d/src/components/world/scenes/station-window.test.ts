import { describe, expect, it } from "vitest";
import { Group, Mesh, PointLight } from "three";
import { CONTROL, STATION_T } from "../path/stations";
import { cullTargets, GATE_HALF, gateShown, inWindow, loopDist, nearT, setCulled, updateCull, WINDOWS, type CullNode, type CullState } from "./station-window";

const fresh = (): CullState => ({ on: false, t: 0, lag: 0, room: true, void: true, portal: true, server: true });

describe("station windows", () => {
  it("room wraps across the seam", () => {
    expect(inWindow(0, "room")).toBe(true);
    expect(inWindow(0.999, "room")).toBe(true);
    expect(inWindow(1, "room")).toBe(true); // t = 1 ≡ 0
    expect(inWindow(0.72, "room")).toBe(true);
    expect(inWindow(0.42, "room")).toBe(true);
    expect(inWindow(0.43, "room")).toBe(false);
    expect(inWindow(0.69, "room")).toBe(false);
    expect(inWindow(-0.1, "room")).toBe(true); // wrapped to 0.9
  });
  it("each station shows its own scene at rest", () => {
    expect(inWindow(STATION_T.hero, "room")).toBe(true);
    expect(inWindow(STATION_T.about, "room")).toBe(true);
    expect(inWindow(STATION_T.projects, "void")).toBe(true);
    expect(inWindow(STATION_T.contact, "server")).toBe(true);
  });
  it("hides the far scenes at each station", () => {
    expect(inWindow(STATION_T.hero, "void")).toBe(false);
    expect(inWindow(STATION_T.hero, "portal")).toBe(false);
    expect(inWindow(STATION_T.hero, "server")).toBe(false);
    expect(inWindow(STATION_T.about, "void")).toBe(false);
    expect(inWindow(STATION_T.about, "server")).toBe(false);
    expect(inWindow(STATION_T.projects, "room")).toBe(false);
    expect(inWindow(STATION_T.contact, "room")).toBe(false);
    expect(inWindow(STATION_T.contact, "void")).toBe(false);
  });
  it("keeps the server room for the lower project stops (they look down the portal at the orb)", () => {
    expect(inWindow(STATION_T.projects, "server")).toBe(true);
    expect(inWindow(STATION_T.projects, "portal")).toBe(true);
    expect(inWindow(STATION_T.about + 0.1, "server")).toBe(false);
  });
  it("covers the whole lap with at least one scene", () => {
    for (let t = 0; t < 1; t += 0.001) {
      const any = (Object.keys(WINDOWS) as (keyof typeof WINDOWS)[]).some((id) => inWindow(t, id));
      expect(any, `t=${t.toFixed(3)}`).toBe(true);
    }
  });
  it("gates are wrap-aware", () => {
    expect(loopDist(0.95, 0.05)).toBeCloseTo(0.1, 9);
    expect(loopDist(0.05, 0.95)).toBeCloseTo(-0.1, 9);
    expect(nearT(0.02, 8 / 9)).toBe(false);
    expect(nearT(0.95, 8 / 9)).toBe(true);
    expect(nearT(0.03, 0.98)).toBe(true);
    expect(nearT(1 / 9 + GATE_HALF + 0.001, 1 / 9)).toBe(false);
  });
});

describe("updateCull", () => {
  it("shows everything while off (desktop, ?cull=0, before ready)", () => {
    const s = updateCull(STATION_T.projects, STATION_T.projects, false, fresh());
    expect([s.room, s.void, s.portal, s.server]).toEqual([true, true, true, true]);
    const gates = CONTROL.map((c, i) => ({ c, i })).filter(({ c }) => !c.station);
    for (const { i } of gates) expect(gateShown(s, i / CONTROL.length)).toBe(true);
  });
  it("culls per station when on", () => {
    const s = updateCull(STATION_T.hero, STATION_T.hero, true, fresh());
    expect([s.room, s.void, s.portal, s.server]).toEqual([true, false, false, false]);
    updateCull(STATION_T.contact, STATION_T.contact, true, s);
    expect([s.room, s.void, s.portal, s.server]).toEqual([false, false, true, true]);
  });
  it("keeps what the lagging camera still sees", () => {
    // flicked past the room window, camera still at about
    const s = updateCull(0.5, STATION_T.about, true, fresh());
    expect(s.room).toBe(true);
    expect(s.void).toBe(true);
  });
  it("shows a gate near its t or wherever its scene shows", () => {
    // the room gates (1/9, 3/9) are in view across the room window, e.g. from the hero at t ≈ 0.03
    expect(gateShown(updateCull(0.03, 0.03, true, fresh()), 3 / 9)).toBe(true);
    // the dive gate (5/9) hangs in the void / portal / server windows, not the room's
    expect(gateShown(updateCull(STATION_T.hero, STATION_T.hero, true, fresh()), 5 / 9)).toBe(false);
    expect(gateShown(updateCull(STATION_T.projects, STATION_T.projects, true, fresh()), 5 / 9)).toBe(true);
    // at contact only the rising-out gates show
    const c = updateCull(STATION_T.contact, STATION_T.contact, true, fresh());
    expect(gateShown(c, 1 / 9)).toBe(false);
    expect(gateShown(c, 7 / 9)).toBe(true);
    // the lag keeps a gate the camera is still flying through
    expect(gateShown(updateCull(STATION_T.contact, 0.72, true, fresh()), 1 / 9)).toBe(true);
  });
});

describe("cullTargets", () => {
  it("never returns a light or an ancestor of one", () => {
    const root = new Group();
    const lit = new Group();
    const kit = new Mesh();
    const lamp = new PointLight();
    lit.add(kit, lamp);
    const plain = new Group();
    plain.add(new Mesh(), new Mesh());
    const floor = new Mesh();
    root.add(lit, plain, floor);
    const targets = cullTargets(root as unknown as CullNode) as unknown[];
    expect(targets).toContain(kit);
    expect(targets).toContain(plain);
    expect(targets).toContain(floor);
    expect(targets).not.toContain(lit);
    expect(targets).not.toContain(lamp);
    setCulled(root as unknown as CullNode, false);
    expect(lamp.visible && lit.visible && root.visible).toBe(true);
    expect(kit.visible || plain.visible || floor.visible).toBe(false);
    setCulled(root as unknown as CullNode, true);
    expect(kit.visible && plain.visible && floor.visible).toBe(true);
  });
});
