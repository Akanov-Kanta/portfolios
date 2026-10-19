import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { posCurve, tgtCurve, fovAt } from "./curves";
import { STATION_T } from "./stations";
import { STACK_BOTTOM, SERVER, VOID } from "../scenes/layout";
import { FILL, ZOOM_MAX, ZOOM_MIN, blendFraming, framingAt, identity, solveFraming, stationFramings, type Framing, type Pose, type Rect, type Size, type StationSubject, type V3 } from "./framing";

const pose = (t: number, lift = 0): Pose => {
  const p = posCurve.getPoint(t), q = tgtCurve.getPoint(t);
  return { pos: [p.x, p.y + lift, p.z], target: [q.x, q.y + lift, q.z], fov: fovAt(t) };
};
const PROJECTS = pose(STATION_T.projects, VOID.y - STACK_BOTTOM);
const CONTACT = pose(STATION_T.contact);
const DEVICE = { center: [VOID.x, VOID.y, VOID.z] as V3, radius: 1.3 };
const ORB = { center: [SERVER.x, SERVER.y + 2.2, SERVER.z] as V3, radius: 1.4 };

/** project p through a real three camera with the solved zoom + view offset (CSS px on the canvas) */
function screenOf(ps: Pose, canvas: Size, f: Framing, p: V3) {
  const cam = new PerspectiveCamera(ps.fov, canvas.w / canvas.h, 0.1, 160);
  cam.position.set(...ps.pos);
  cam.lookAt(new Vector3(...ps.target));
  cam.zoom = f.zoom;
  if (f.offX !== 0 || f.offY !== 0) cam.setViewOffset(canvas.w, canvas.h, f.offX, f.offY, canvas.w, canvas.h);
  else cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  const v = new Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * canvas.w, y: ((1 - v.y) / 2) * canvas.h };
}

const PHONES: { canvas: Size; device: Rect; orb: Rect }[] = [
  // 393x852 portrait: device slot from the top zone to 46svh, orb slot mid-stage
  { canvas: { w: 393, h: 852 }, device: { x: 20, y: 64, w: 353, h: 328 }, orb: { x: 20, y: 250, w: 353, h: 400 } },
  // SE 375x667 (40svh slot)
  { canvas: { w: 375, h: 667 }, device: { x: 20, y: 64, w: 335, h: 203 }, orb: { x: 20, y: 250, w: 335, h: 230 } },
  // landscape 852x393: the slots sit on the right
  { canvas: { w: 852, h: 393 }, device: { x: 430, y: 24, w: 330, h: 345 }, orb: { x: 430, y: 24, w: 330, h: 345 } },
];

describe("solveFraming", () => {
  it("is identity without a slot", () => {
    const f = solveFraming(PROJECTS, 393 / 852, { w: 393, h: 852 }, DEVICE, null, FILL.device);
    expect(f).toEqual(identity(393 / 852));
    expect(identity(393 / 852).zoom).toBeCloseTo((393 / 852) * 1.25, 9);
    expect(identity(1440 / 900).zoom).toBe(1);
  });
  it("puts the subject centre on the slot centre (three's projection, within 0.5 px)", () => {
    for (const ph of PHONES) {
      const aspect = ph.canvas.w / ph.canvas.h;
      for (const [ps, subj, slot, fill] of [
        [PROJECTS, DEVICE, ph.device, FILL.device],
        [CONTACT, ORB, ph.orb, FILL.orb],
      ] as const) {
        const f = solveFraming(ps, aspect, ph.canvas, subj, slot, fill);
        const s = screenOf(ps, ph.canvas, f, subj.center);
        expect(Math.abs(s.x - (slot.x + slot.w / 2))).toBeLessThan(0.5);
        expect(Math.abs(s.y - (slot.y + slot.h / 2))).toBeLessThan(0.5);
        expect(f.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
        expect(f.zoom).toBeLessThanOrEqual(ZOOM_MAX);
      }
    }
  });
  it("fits the projected subject to fill × the slot's half extent", () => {
    const ph = PHONES[0]!;
    const f = solveFraming(PROJECTS, ph.canvas.w / ph.canvas.h, ph.canvas, DEVICE, ph.device, FILL.device);
    // a point one radius above the centre (the view is level at the projects pose)
    const c = screenOf(PROJECTS, ph.canvas, f, DEVICE.center);
    const top = screenOf(PROJECTS, ph.canvas, f, [DEVICE.center[0], DEVICE.center[1] + DEVICE.radius, DEVICE.center[2]]);
    const half = Math.min(ph.device.w, ph.device.h) / 2;
    expect(Math.abs(c.y - top.y)).toBeCloseTo(FILL.device * half, 0);
  });
  it("clamps the zoom to [0.45, 1.25]", () => {
    const canvas = { w: 393, h: 852 };
    const tiny = solveFraming(PROJECTS, 393 / 852, canvas, DEVICE, { x: 180, y: 100, w: 10, h: 10 }, FILL.device);
    const huge = solveFraming(PROJECTS, 393 / 852, canvas, DEVICE, { x: -2000, y: -2000, w: 5000, h: 5000 }, FILL.device);
    expect(tiny.zoom).toBe(ZOOM_MIN);
    expect(huge.zoom).toBe(ZOOM_MAX);
  });
});

describe("station framing", () => {
  const T = STATION_T;
  const ph = PHONES[0]!;
  const aspect = ph.canvas.w / ph.canvas.h;
  const subjects: Partial<Record<"projects" | "contact", StationSubject>> = {
    projects: { pose: PROJECTS, subject: DEVICE, slot: ph.device, fill: FILL.device },
    contact: { pose: CONTACT, subject: ORB, slot: ph.orb, fill: FILL.orb },
  };
  const phone = stationFramings("phone", aspect, ph.canvas, subjects);
  const desk = stationFramings("desktop", aspect, ph.canvas, subjects);

  it("hero and about are identity", () => {
    expect(phone.hero).toEqual(identity(aspect));
    expect(phone.about).toEqual(identity(aspect));
    expect(framingAt(T.about, "about", "projects", phone, T)).toEqual(identity(aspect));
    expect(framingAt(T.hero, "hero", "about", phone, T)).toEqual(identity(aspect));
  });
  it("hero at t = 0 equals hero at t = 1", () => {
    const a = framingAt(0, "hero", "about", phone, T);
    const b = framingAt(1, "contact", "hero", phone, T);
    const c = framingAt(1 - 1e-9, "contact", "hero", phone, T);
    expect(b).toEqual(a);
    expect(c.zoom).toBeCloseTo(a.zoom, 6);
    expect(c.offX).toBeCloseTo(a.offX, 4);
    expect(c.offY).toBeCloseTo(a.offY, 4);
  });
  it("holds use their station; flights blend by the segment's eased progress", () => {
    expect(framingAt(T.projects, "projects", "contact", phone, T)).toEqual(phone.projects);
    expect(framingAt(T.contact, "contact", "hero", phone, T)).toEqual(phone.contact);
    const mid = framingAt((T.projects + T.contact) / 2, "projects", "contact", phone, T);
    const half = blendFraming(phone.projects, phone.contact, 0.5);
    expect(mid.zoom).toBeCloseTo(half.zoom, 9);
    expect(mid.offX).toBeCloseTo(half.offX, 6);
    expect(mid.offY).toBeCloseTo(half.offY, 6);
    // a parked inner route keeps its station while the page scroll drifts t by ≤ 2 %
    expect(framingAt(T.projects + 0.02, "projects", "projects", phone, T)).toEqual(phone.projects);
    // a route flight (t moves, the segment is stale) blends continuously
    const flying = framingAt(T.about + 0.05, "projects", "projects", phone, T);
    expect(flying.offY).toBeGreaterThan(0);
    expect(flying.offY).toBeLessThan(phone.projects.offY);
  });
  it("the desktop profile never produces an offset", () => {
    for (let t = 0; t < 1; t += 0.01) {
      for (const [a, b] of [["hero", "about"], ["projects", "contact"], ["projects", "projects"]] as const) {
        const f = framingAt(t, a, b, desk, T);
        expect(f.offX).toBe(0);
        expect(f.offY).toBe(0);
        expect(f.zoom).toBeCloseTo(identity(aspect).zoom, 12);
      }
    }
  });
});
