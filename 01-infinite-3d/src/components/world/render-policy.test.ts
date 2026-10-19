import { describe, expect, it } from "vitest";
import {
  createLadder,
  createPolicy,
  decide,
  FIRST_STEP_MS,
  intervalFor,
  MAX_STEP_MS,
  MOTION_MS,
  NEXT_STEP_MS,
  sampleFrame,
  SLOW_MS,
  stepClock,
  takeDpr,
  TOLERANCE_MS,
  type Ladder,
  type MotionInput,
  type Policy,
} from "./render-policy";

const AMBIENT = 4000;
const still = (): MotionInput => ({ velocityPx: 0, wakeUntil: 0, cutUntil: 0, frost: 0, impulse: 0, develop: 1, flying: false, dirty: 0, pointerLive: false });

/** Run rAF ticks at `hz` from `from` for `ms`, returning the render timestamps. */
function run(p: Policy, from: number, ms: number, hz: number, input: (now: number) => MotionInput = still) {
  const renders: number[] = [];
  const step = 1000 / hz;
  for (let now = from; now < from + ms; now += step) if (decide(p, now, input(now)).render) renders.push(now);
  return renders;
}
const gaps = (r: number[]) => r.slice(1).map((t, i) => t - r[i]!);

describe("render policy: intervals", () => {
  it("renders every 60 Hz frame while scrolling", () => {
    const p = createPolicy(AMBIENT);
    const r = run(p, 1000, 1000, 60, () => ({ ...still(), velocityPx: 4 }));
    expect(r.length).toBeGreaterThanOrEqual(59);
    for (const g of gaps(r)) expect(g).toBeCloseTo(MOTION_MS, 6);
  });

  it("caps a 120 Hz panel at 60 fps: no two renders closer than 14 ms", () => {
    const p = createPolicy(AMBIENT);
    const r = run(p, 1000, 2000, 120, () => ({ ...still(), velocityPx: 4 }));
    expect(Math.min(...gaps(r))).toBeGreaterThanOrEqual(14);
    expect(r.length).toBeGreaterThanOrEqual(118);
    expect(r.length).toBeLessThanOrEqual(121);
  });

  it("drops to 30 fps ambient after the velocity window, then holds after DUR.ambient", () => {
    const p = createPolicy(AMBIENT);
    // scroll until t = 1000, then nothing
    const r = run(p, 0, 7000, 60, (now) => ({ ...still(), velocityPx: now < 1000 ? 4 : 0 }));
    const ambient = r.filter((t) => t > 1300 && t < 1000 + 250 + AMBIENT - 50);
    for (const g of gaps(ambient)) expect(g).toBeGreaterThanOrEqual(SLOW_MS - TOLERANCE_MS);
    // no render once DUR.ambient has passed since the last motion (≤ 1250 ms)
    expect(r.filter((t) => t > 1250 + AMBIENT + 20)).toEqual([]);
  });

  it("treats wake, cut, frost, impulse, develop, flights, dirty frames and a live pointer as motion", () => {
    const now = 10_000;
    const cases: Partial<MotionInput>[] = [
      { wakeUntil: now + 1 },
      { cutUntil: now + 1 },
      { frost: 0.01 },
      { impulse: -0.5 },
      { develop: 0.5 },
      { flying: true },
      { dirty: 1 },
      { pointerLive: true },
      { velocityPx: -0.5 },
    ];
    for (const c of cases) {
      const p = createPolicy(AMBIENT);
      expect(decide(p, now, { ...still(), ...c }).phase).toBe("motion");
    }
    const p = createPolicy(AMBIENT);
    expect(decide(p, now, { ...still(), velocityPx: 0.2, frost: 0.0005, impulse: 0.01 }).phase).toBe("held");
  });

  it("holds 30 fps in motion once thermally locked", () => {
    const p = createPolicy(AMBIENT);
    p.locked = true;
    const r = run(p, 0, 1000, 120, () => ({ ...still(), velocityPx: 4 }));
    for (const g of gaps(r)) expect(g).toBeGreaterThanOrEqual(SLOW_MS - TOLERANCE_MS);
    expect(intervalFor("motion", true)).toBe(SLOW_MS);
    expect(intervalFor("held", false)).toBe(Infinity);
  });

  it("reports the phase edges the DPR ladder waits for", () => {
    const p = createPolicy(AMBIENT);
    expect(decide(p, 0, { ...still(), dirty: 2 }).entered).toBe("motion");
    expect(decide(p, 16.7, { ...still(), dirty: 1 }).entered).toBeNull();
    expect(decide(p, 33.4, still()).entered).toBe("ambient");
    expect(decide(p, 33.4 + AMBIENT + 1, still()).entered).toBe("held");
  });
});

describe("render policy: virtual clock", () => {
  it("steps at most 50 ms per render, so a long held stretch or a sleep never spikes dt", () => {
    const p = createPolicy(AMBIENT);
    const a = decide(p, 5000, { ...still(), dirty: 1 });
    expect(a.render).toBe(true);
    expect(a.vt).toBe(5000); // seeded with the real clock
    const b = decide(p, 5016.7, { ...still(), dirty: 1 });
    expect(b.vt).toBeCloseTo(5016.7, 6);
    // 60 s asleep (frozen ticks never reach decide), then a touch wakes it
    const c = decide(p, 65_000, { ...still(), wakeUntil: 66_000 });
    expect(c.render).toBe(true);
    expect(c.vt - b.vt).toBe(MAX_STEP_MS);
  });

  it("the static dirty-frame path shares the same clamp", () => {
    const p = createPolicy(AMBIENT);
    expect(stepClock(p, 100)).toBe(100);
    expect(stepClock(p, 3100)).toBe(100 + MAX_STEP_MS);
  });

  it("reports frame times only for consecutive motion renders", () => {
    const p = createPolicy(AMBIENT);
    const v = { ...still(), velocityPx: 5 };
    expect(decide(p, 0, v).motionFrameMs).toBe(0);
    expect(decide(p, 16.7, v).motionFrameMs).toBeCloseTo(16.7, 6);
    expect(decide(p, 50, v).motionFrameMs).toBeCloseTo(33.3, 6);
    // after a pause (> 100 ms between renders) the pair is not consecutive
    decide(p, 400, still());
    const q = createPolicy(AMBIENT);
    decide(q, 0, v);
    expect(decide(q, 300, v).motionFrameMs).toBe(0);
  });
});

/** Feed `ms` of motion frames of `frameMs` each. */
function feed(l: Ladder, frameMs: number, ms: number, t0 = 0) {
  const events: string[] = [];
  let now = t0;
  for (let acc = 0; acc < ms - 1e-6; acc += frameMs) {
    now += frameMs;
    const e = sampleFrame(l, frameMs, now);
    if (e) events.push(e);
  }
  return { events, now };
}

describe("quality ladder", () => {
  it("starts at DPR 1 and feature level 2; 1.5 only on DPR >= 3 screens", () => {
    const l3 = createLadder([1, 1.25, 1.5], 3);
    expect(l3.steps[l3.idx]).toBe(1);
    expect(l3.featureLevel).toBe(2);
    expect(l3.top).toBe(2);
    expect(createLadder([1, 1.25, 1.5], 2.625).top).toBe(1);
    expect(createLadder([1, 1.25, 1.5], 2).top).toBe(1);
    expect(createLadder([1, 1.25, 1.5], 1).top).toBe(0);
  });

  it("steps DPR 1 → 1.25 after 2 s steady, and → 1.5 after 3 more (DPR 3)", () => {
    // windows are ~1 s of motion frames, so the steps land on window edges
    const l = createLadder([1, 1.25, 1.5], 3);
    let r = feed(l, 16.7, FIRST_STEP_MS - 1100);
    expect(l.idx).toBe(0);
    r = feed(l, 16.7, 1300, r.now);
    expect(l.idx).toBe(1);
    // the next step waits until 1.25 is really on the canvas, and counts from there
    r = feed(l, 16.7, 10_000, r.now);
    expect(l.idx).toBe(1);
    expect(takeDpr(l)).toBe(1.25);
    r = feed(l, 16.7, NEXT_STEP_MS - 1100, r.now);
    expect(l.idx).toBe(1);
    r = feed(l, 16.7, 1300, r.now);
    expect(l.idx).toBe(2);
    expect(takeDpr(l)).toBe(1.5);
    // never above the top
    feed(l, 16.7, 10_000, r.now);
    expect(l.idx).toBe(2);
  });

  it("a slow window cancels a queued step up; a queued step down is not stacked", () => {
    const l = createLadder([1, 1.25, 1.5], 3);
    feed(l, 16.7, FIRST_STEP_MS + 1100);
    expect(l.idx).toBe(1);
    expect(feed(l, 25, 1100).events).toEqual(["decline"]);
    expect(l.idx).toBe(0);
    expect(takeDpr(l)).toBeNull();
    // at 1.5 on the canvas: one slow window queues 1.25, more slow windows wait for it to land
    l.idx = l.applied = 2;
    expect(feed(l, 25, 3100).events).toEqual(["decline"]);
    expect(l.idx).toBe(1);
    expect(l.featureLevel).toBe(2);
    expect(takeDpr(l)).toBe(1.25);
  });

  it("stops at 1.25 on a DPR 2.625 screen", () => {
    const l = createLadder([1, 1.25, 1.5], 2.625);
    feed(l, 16.7, 20_000);
    expect(l.steps[l.idx]).toBe(1.25);
  });

  it("declines DPR first, then the feature level, then counts floor declines; two within 20 s lock 30 fps", () => {
    const l = createLadder([1, 1.25, 1.5], 3);
    l.idx = l.applied = 2;
    // each DPR step lands (ambient) before the next window
    const events: string[] = [];
    let now = 0;
    for (let i = 0; i < 5; i++) {
      const r = feed(l, 25, 1000, now);
      now = r.now;
      events.push(...r.events);
      takeDpr(l);
    }
    expect(events).toEqual(["decline", "decline", "decline", "decline", "floor"]);
    expect(l.idx).toBe(0);
    expect(l.featureLevel).toBe(0);
    expect(l.locked).toBe(false);
    const more = feed(l, 25, 1000, now);
    expect(more.events).toEqual(["lock"]);
    expect(l.locked).toBe(true);
    // locked: sampling stops for the session
    expect(feed(l, 16, 5000).events).toEqual([]);
  });

  it("does not lock when the two floor declines are more than 20 s apart", () => {
    const l = createLadder([1, 1.25, 1.5], 3);
    l.featureLevel = 0;
    expect(feed(l, 25, 1000, 0).events).toEqual(["floor"]);
    expect(feed(l, 25, 1000, 25_000).events).toEqual(["floor"]);
    expect(l.locked).toBe(false);
  });

  it("a window between 17.5 and 20 ms neither declines nor counts as steady", () => {
    const l = createLadder([1, 1.25, 1.5], 3);
    feed(l, 16.7, 1500);
    feed(l, 19, 1000);
    feed(l, 16.7, 1500);
    expect(l.idx).toBe(0);
  });

  it("restores a trimmed feature level after 3 s steady before raising DPR", () => {
    const l = createLadder([1, 1.25, 1.5], 3);
    l.featureLevel = 1;
    let r = feed(l, 16.7, NEXT_STEP_MS - 1100);
    expect(l.featureLevel).toBe(1);
    r = feed(l, 16.7, 1300, r.now);
    expect(l.featureLevel).toBe(2);
    expect(l.idx).toBe(0);
    feed(l, 16.7, FIRST_STEP_MS + 1100, r.now);
    expect(l.idx).toBe(1);
  });

  it("a DPR 1 screen never leaves 1, and declines go straight to the feature level", () => {
    const l = createLadder([1, 1.25, 1.5], 1);
    feed(l, 16.7, 20_000);
    expect(takeDpr(l)).toBeNull();
    // (the first window still holds the steady frames before these)
    expect(feed(l, 25, 1100).events).toEqual(["decline"]);
    expect(l.featureLevel).toBe(1);
  });

  it("queues DPR changes until they are taken (on entering ambient / held)", () => {
    const l = createLadder([1, 1.25, 1.5], 3);
    expect(takeDpr(l)).toBeNull();
    feed(l, 16.7, FIRST_STEP_MS + 100);
    expect(l.applied).toBe(0);
    expect(takeDpr(l)).toBe(1.25);
    expect(takeDpr(l)).toBeNull();
  });
});
