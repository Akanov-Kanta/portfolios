import { describe, expect, it } from "vitest";
import { crossedStop, projectStops } from "./project-catch";
import type { Mapping } from "../state/world-store";

const STOPS = [2000, 2900, 3800];
const LAP = 6000;

describe("crossedStop", () => {
  it("catches the first stop a step crosses, in either direction", () => {
    expect(crossedStop(1900, 2100, STOPS, LAP)).toBe(2000);
    expect(crossedStop(1900, 3000, STOPS, LAP)).toBe(2000); // a big step still stops at the first one
    expect(crossedStop(3000, 2800, STOPS, LAP)).toBe(2900);
    expect(crossedStop(4000, 1000, STOPS, LAP)).toBe(3800);
  });

  it("lands exactly on a stop, and leaving a stop does not re-catch it", () => {
    expect(crossedStop(1900, 2000, STOPS, LAP)).toBe(2000);
    expect(crossedStop(2000, 2100, STOPS, LAP)).toBeNull();
    expect(crossedStop(2000, 1900, STOPS, LAP)).toBeNull();
  });

  it("ignores steps that cross nothing, and no-op input", () => {
    expect(crossedStop(100, 900, STOPS, LAP)).toBeNull();
    expect(crossedStop(2100, 2100, STOPS, LAP)).toBeNull();
    expect(crossedStop(1900, 2100, [], LAP)).toBeNull();
  });

  it("repeats every lap (Lenis's infinite target is unbounded)", () => {
    expect(crossedStop(LAP + 1900, LAP + 2100, STOPS, LAP)).toBe(LAP + 2000);
    expect(crossedStop(-LAP + 3700, -LAP + 3900, STOPS, LAP)).toBe(-LAP + 3800);
    // across the seam: from the end of one lap into the next one's stops
    expect(crossedStop(5900, LAP + 2100, STOPS, LAP)).toBe(LAP + 2000);
  });
});

describe("projectStops", () => {
  it("puts one stop per project, a viewport apart, from the projects hold start", () => {
    const m = {
      vh: 900,
      limit: 9000,
      segments: [
        { from: "about", to: "projects", start: 900, holdEnd: 1000, end: 2000, t0: 0, t1: 0.3, stops: 1 },
        { from: "projects", to: "contact", start: 2000, holdEnd: 3800, end: 4700, t0: 0.3, t1: 0.6, stops: 3 },
      ],
    } as unknown as Mapping;
    expect(projectStops(m)).toEqual([2000, 2900, 3800]);
    expect(projectStops(null)).toEqual([]);
  });
});
