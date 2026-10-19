import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { DIVE_OFFSET, SCREEN_C, divePose, flipDist, screenPlaneDist } from "./dive";
import { posCurve, tgtCurve } from "../path/curves";
import { STATION_T } from "../path/stations";
import { STACK_BOTTOM, VOID } from "./layout";

const p = new Vector3(), t = new Vector3(), q = new Vector3(), r = new Vector3();

describe("monitor dive path", () => {
  it("starts on the about pose and ends (through the portal) on the first-device pose", () => {
    divePose(0, p, t);
    expect(p.distanceTo(posCurve.getPoint(STATION_T.about))).toBeLessThan(1e-6);
    expect(t.distanceTo(tgtCurve.getPoint(STATION_T.about))).toBeLessThan(1e-6);
    divePose(1, p, t);
    const lift = new Vector3(0, VOID.y - STACK_BOTTOM, 0);
    expect(p.add(DIVE_OFFSET).distanceTo(posCurve.getPoint(STATION_T.projects).add(lift))).toBeLessThan(1e-6);
    expect(t.add(DIVE_OFFSET).distanceTo(tgtCurve.getPoint(STATION_T.projects).add(lift))).toBeLessThan(1e-6);
  });

  it("crosses the screen centre at the middle of the window, continuously", () => {
    divePose(0.5, p, t);
    expect(p.distanceTo(SCREEN_C)).toBeLessThan(1e-6);
    expect(screenPlaneDist(p)).toBeCloseTo(0, 6);
    divePose(0.5 - 1e-5, q, r);
    divePose(0.5 + 1e-5, p, t);
    expect(p.distanceTo(q)).toBeLessThan(1e-3);
    expect(t.distanceTo(r)).toBeLessThan(1e-3);
    // in front before, behind after
    expect(screenPlaneDist(q)).toBeGreaterThan(0);
    expect(screenPlaneDist(p)).toBeLessThan(0);
  });

  it("flips beyond the near plane", () => {
    for (const aspect of [0.8, 1.6, 2.4]) expect(flipDist(47, aspect, Math.min(1, aspect * 1.25))).toBeGreaterThan(0.1);
  });
});
