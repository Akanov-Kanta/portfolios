import { describe, expect, it } from "vitest";
import { ndcRect } from "./device-link";

describe("ndcRect", () => {
  it("maps NDC to viewport px (y down)", () => {
    const r = ndcRect([{ x: -0.5, y: 0.5, z: 0.9 }, { x: 0.5, y: -0.5, z: 0.9 }], 1000, 800);
    expect(r).toEqual({ x: 250, y: 200, w: 500, h: 400 });
  });

  it("clips to the viewport", () => {
    const r = ndcRect([{ x: 0.5, y: 0.2, z: 0.5 }, { x: 1.5, y: -0.2, z: 0.5 }], 1000, 800);
    expect(r).toEqual({ x: 750, y: 320, w: 250, h: 160 });
  });

  it("is null when behind the camera or fully off screen", () => {
    expect(ndcRect([{ x: 0, y: 0, z: 0.5 }, { x: 0.2, y: 0.2, z: 1.2 }], 1000, 800)).toBeNull();
    expect(ndcRect([{ x: 1.2, y: 0, z: 0.5 }, { x: 1.6, y: 0.4, z: 0.5 }], 1000, 800)).toBeNull();
    expect(ndcRect([], 1000, 800)).toBeNull();
  });
});
