import type { Profile, StationId } from "../state/world-store";

/**
 * Phone framing, projection only: a zoom plus a lens shift (camera.setViewOffset) that puts a
 * station's subject (a project device, the orb) into the DOM slot the layout left for it. Poses,
 * curves and the t = 1 ≡ 0 seam are untouched. Pure maths (no three / DOM), unit-tested.
 *
 * Screen convention: CSS px from the canvas's top-left; a view offset (offX, offY) shows the
 * full image from (offX, offY), so a point projecting at (px, py) lands at (px - offX, py - offY).
 */

export type V3 = readonly [number, number, number];
/** a camera at pos looking at target (up = +y), vertical fov in degrees */
export interface Pose {
  pos: V3;
  target: V3;
  fov: number;
}
export interface Subject {
  center: V3;
  radius: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Size {
  w: number;
  h: number;
}
export interface Framing {
  zoom: number;
  offX: number;
  offY: number;
}

export const ZOOM_MIN = 0.45;
export const ZOOM_MAX = 1.25;
/** share of the slot's half extent the subject's projected radius fills */
export const FILL = { device: 0.8, orb: 0.64 } as const;

/** Today's framing: portrait zooms out so the scenes fit a tall screen (igloo: min(1, aspect * 1.25)), no shift. */
export const identity = (aspect: number): Framing => ({ zoom: Math.min(1, aspect * 1.25), offX: 0, offY: 0 });

/** p in the camera's view basis: [right, up, depth along the view axis] */
export function toView(pose: Pose, p: V3): [number, number, number] {
  const [ox, oy, oz] = pose.pos;
  let fx = pose.target[0] - ox, fy = pose.target[1] - oy, fz = pose.target[2] - oz;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl;
  fy /= fl;
  fz /= fl;
  // right = fwd × up(0, 1, 0), up' = right × fwd (three's lookAt basis)
  const rl = Math.hypot(fz, fx) || 1;
  const rx = -fz / rl, rz = fx / rl;
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  const dx = p[0] - ox, dy = p[1] - oy, dz = p[2] - oz;
  return [dx * rx + dz * rz, dx * ux + dy * uy + dz * uz, dx * fx + dy * fy + dz * fz];
}

/** where p lands on the canvas (CSS px, no view offset) at this zoom; null behind the camera */
export function project(pose: Pose, aspect: number, canvas: Size, zoom: number, p: V3): { x: number; y: number } | null {
  const [vx, vy, vz] = toView(pose, p);
  if (vz <= 1e-6) return null;
  const tan = Math.tan((pose.fov * Math.PI) / 360) / zoom;
  const nx = vx / (vz * tan * aspect), ny = vy / (vz * tan);
  return { x: ((nx + 1) / 2) * canvas.w, y: ((1 - ny) / 2) * canvas.h };
}

/**
 * zoom = clamp(fill · slotHalfExtent / projectedRadiusAtZoom1, 0.45, 1.25); the offsets then put the
 * zoomed subject centre on the slot centre. No slot (or a subject behind the camera) → identity.
 */
export function solveFraming(pose: Pose, aspect: number, canvas: Size, subject: Subject, slot: Rect | null, fill: number): Framing {
  if (!slot || slot.w < 1 || slot.h < 1 || canvas.w < 1 || canvas.h < 1) return identity(aspect);
  const depth = toView(pose, subject.center)[2];
  if (depth <= subject.radius) return identity(aspect);
  const r1 = ((canvas.h / 2) * subject.radius) / (depth * Math.tan((pose.fov * Math.PI) / 360));
  const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (fill * Math.min(slot.w, slot.h)) / 2 / r1));
  const c = project(pose, aspect, canvas, zoom, subject.center)!;
  return { zoom, offX: c.x - (slot.x + slot.w / 2), offY: c.y - (slot.y + slot.h / 2) };
}

export function blendFraming(a: Framing, b: Framing, w: number, out: Framing = { zoom: 1, offX: 0, offY: 0 }): Framing {
  out.zoom = a.zoom + (b.zoom - a.zoom) * w;
  out.offX = a.offX + (b.offX - a.offX) * w;
  out.offY = a.offY + (b.offY - a.offY) * w;
  return out;
}

export type FramingTable = Record<StationId, Framing>;
export interface StationSubject {
  pose: Pose;
  subject: Subject;
  slot: Rect | null;
  fill: number;
}

/**
 * Per-station framing. Hero and about are always identity (the room is framed exactly as today, and
 * t = 0 ≡ 1 stays one frame); the desktop profile is identity everywhere, so it never gets an offset.
 */
export function stationFramings(profile: Profile, aspect: number, canvas: Size, subjects: Partial<Record<StationId, StationSubject>>): FramingTable {
  const id = identity(aspect);
  const solve = (s: StationId): Framing => {
    const k = subjects[s];
    return profile === "phone" && k && s !== "hero" && s !== "about" ? solveFraming(k.pose, aspect, canvas, k.subject, k.slot, k.fill) : { ...id };
  };
  return { hero: solve("hero"), about: solve("about"), projects: solve("projects"), contact: solve("contact") };
}

const wrap01 = (t: number) => t - Math.floor(t);
/** a parked camera (inner routes drift ≤ 2 % of a lap with page scroll) keeps its station's framing */
const PARK = 0.03;

/**
 * The framing at lap position t. Scroll segments map t = t0 + (t1 - t0) · smootherstep(local), so the
 * bracketing weight (t - t0) / (t1 - t0) IS the segment's smootherstep(local): holds use P[from]
 * exactly, and a route flight (which moves t without the scroll layer) blends continuously too.
 * segFrom === segTo parked near its station (inner routes) keeps that station's framing.
 */
export function framingAt(
  t: number,
  segFrom: StationId,
  segTo: StationId,
  table: FramingTable,
  stationT: Record<StationId, number>,
  out: Framing = { zoom: 1, offX: 0, offY: 0 },
): Framing {
  const p = wrap01(t);
  if (segFrom === segTo && Math.abs(wrap01(p - stationT[segFrom] + 0.5) - 0.5) <= PARK) return blendFraming(table[segFrom], table[segFrom], 0, out);
  let from: StationId = "hero", to: StationId = "hero", t0 = -1, t1 = 2;
  for (const k in stationT) {
    const s = k as StationId;
    const st = wrap01(stationT[s]);
    if (st <= p && st > t0) {
      t0 = st;
      from = s;
    }
    if (st > p && st < t1) {
      t1 = st;
      to = s;
    }
  }
  if (t1 > 1) {
    // past the last station: the segment closes the lap onto the first one (at t0 + 1)
    let first: StationId = "hero", f = 2;
    for (const k in stationT) {
      const st = wrap01(stationT[k as StationId]);
      if (st < f) {
        f = st;
        first = k as StationId;
      }
    }
    to = first;
    t1 = f + 1;
  }
  const w = t1 > t0 ? (p - t0) / (t1 - t0) : 0;
  return blendFraming(table[from], table[to], Math.min(1, Math.max(0, w)), out);
}
