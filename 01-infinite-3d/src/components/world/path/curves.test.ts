import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { posCurve, tgtCurve } from "./curves";
import { CONTROL, STATION_T } from "./stations";

describe("camera curves", () => {
  const N = CONTROL.length;
  it("puts control point i at t = i/N", () => {
    for (let i = 0; i < N; i++) {
      const p = posCurve.getPoint(i / N);
      expect(p.distanceTo(new Vector3(...CONTROL[i].pos))).toBeLessThan(1e-6);
      const q = tgtCurve.getPoint(i / N);
      expect(q.distanceTo(new Vector3(...CONTROL[i].target))).toBeLessThan(1e-6);
    }
  });
  it("closes the loop: getPoint(1) === getPoint(0)", () => {
    expect(posCurve.getPoint(1).distanceTo(posCurve.getPoint(0))).toBeLessThan(1e-6);
    expect(tgtCurve.getPoint(1).distanceTo(tgtCurve.getPoint(0))).toBeLessThan(1e-6);
  });
  it("station params are ordered and start at the hero", () => {
    expect(STATION_T.hero).toBe(0);
    expect(STATION_T.about).toBeGreaterThan(STATION_T.hero);
    expect(STATION_T.projects).toBeGreaterThan(STATION_T.about);
    expect(STATION_T.contact).toBeGreaterThan(STATION_T.projects);
    expect(STATION_T.contact).toBeLessThan(1);
  });
});
