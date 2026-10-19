import { describe, expect, it } from "vitest";
import { flyTo, isFlying, loopDelta, stepFlight } from "./routeFlight";
import { frame } from "../state/world-store";

describe("loopDelta", () => {
  it("takes the short way round the seam", () => {
    expect(loopDelta(0.9, 0.1)).toBeCloseTo(0.2, 9);
    expect(loopDelta(0.1, 0.9)).toBeCloseTo(-0.2, 9);
    expect(loopDelta(0.2, 0.6)).toBeCloseTo(0.4, 9);
    expect(loopDelta(0.5, 0.5)).toBeCloseTo(0, 9);
  });
});

describe("isFlying", () => {
  it("is true from flyTo until the flight lands", () => {
    frame.t = 0;
    expect(isFlying()).toBe(false);
    flyTo(0.4, 1);
    expect(isFlying()).toBe(true);
    const t0 = performance.now();
    expect(stepFlight(t0 + 500)).toBe(true);
    expect(isFlying()).toBe(true);
    // the landing frame still belongs to the flight; after it nothing does
    expect(stepFlight(t0 + 1100)).toBe(true);
    expect(frame.t).toBeCloseTo(0.4, 9);
    expect(isFlying()).toBe(false);
    expect(stepFlight(t0 + 1200)).toBe(false);
  });

  it("a cut (seconds = 0) never flies", () => {
    frame.t = 0.1;
    flyTo(0.7, 0);
    expect(isFlying()).toBe(false);
    expect(frame.t).toBeCloseTo(0.7, 9);
  });
});
