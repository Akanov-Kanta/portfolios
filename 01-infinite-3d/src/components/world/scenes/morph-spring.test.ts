import { describe, expect, it } from "vitest";
import { MORPH_SETTLE, morphK } from "./icon-cloud-geometry";
import { contactNear } from "./reflect";
import { STATION_T } from "../path/stations";

describe("per-orb morph spring", () => {
  const seeds = Array.from({ length: 64 }, (_, i) => (i / 64) * Math.PI * 2);

  it("starts at 0 and lands exactly on 1", () => {
    for (const s of seeds) {
      expect(morphK(-0.1, s)).toBe(0);
      expect(morphK(0, s)).toBe(0);
      expect(morphK(MORPH_SETTLE, s)).toBe(1);
      expect(Math.abs(morphK(MORPH_SETTLE - 1e-3, s) - 1)).toBeLessThan(2e-3);
    }
  });

  it("overshoots a little, differently per orb", () => {
    const peaks = seeds.map((s) => {
      let m = 0;
      for (let t = 0; t < MORPH_SETTLE; t += 0.005) m = Math.max(m, morphK(t, s));
      return m;
    });
    for (const p of peaks) {
      expect(p).toBeGreaterThan(1.01);
      expect(p).toBeLessThan(1.13);
    }
    expect(Math.max(...peaks) - Math.min(...peaks)).toBeGreaterThan(0.03);
  });
});

describe("contactNear", () => {
  it("is 1 at the contact station and 0 on the rest of the loop", () => {
    expect(contactNear(STATION_T.contact)).toBe(1);
    expect(contactNear(STATION_T.contact + 0.02)).toBe(1);
    expect(contactNear(STATION_T.contact - 0.1)).toBe(0);
    expect(contactNear(STATION_T.hero)).toBe(0);
    expect(contactNear(STATION_T.projects)).toBe(0);
  });
});
