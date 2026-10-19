"use client";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { PerspectiveCamera, Vector3 } from "three";
import { frame, useWorld, worldStore } from "../state/world-store";
import { DRIFT, EASE, bezier, fx } from "../theme";
import { fbm1 } from "./fbm";
import { smoothstep as smooth } from "../math";
import { CursorLight } from "../scenes/CursorLight";
import { fovAt, posCurve, tgtCurve } from "./curves";
import { STATION_T } from "./stations";
import { DEVICE_SPACING, SERVER, STACK_BOTTOM, VOID } from "../scenes/layout";
import { ORB_POS, ORB_RADIUS } from "../scenes/ServerRoom";
import { DIVE_OFFSET, FLIP_FORCE, SCREEN_C, dive, diveAllowed, diveGate, divePose, flipDist, inDiveWindow, screenCoversView, screenPlaneDist } from "../scenes/dive";
import { cull, loopDist, updateCull, wrap01 } from "../scenes/station-window";
import { FILL, framingAt, stationFramings, type Framing, type FramingTable, type Pose } from "./framing";
import { frameSlots, installFrameSlots } from "./frame-slots";
import { site } from "@/content/site";

/** vertical distance from the last device (the curve's pose) up to the first */
const STACK_LIFT = VOID.y - STACK_BOTTOM;

const PARALLAX = 0.12; // world units at the camera; igloo uses a similarly small displacement
/** steadicam drift at DRIFT = 1: position (world units) and rotation (radians, ≈ 0.28°) */
const DRIFT_POS = 0.02;
const DRIFT_ROT = (0.28 * Math.PI) / 180;
/** scroll speed widens the lens by up to this many degrees (velocity is power) */
const VEL_FOV = 5;
/** intro "FOV breath": the lens opens from this to the curve FOV */
const INTRO_FOV = 26;
const introEase = bezier(EASE.intro);

/* ---- phone profile ---- */
/** develop push-in: the camera starts this far back along its view axis and eases in with fx.develop */
const DEVELOP_PUSH = 0.12;
/** culling lag: frame.t smoothed about as slowly as the damped camera follows (0.16 s), a little slower to be safe */
const LAG_RATE = 4;
/** rest poses the framing is solved from; projects (and the inner-route park) sits on device 0 */
const restPose = (t: number, lift: number): Pose => {
  const p = posCurve.getPoint(t), q = tgtCurve.getPoint(t);
  return { pos: [p.x, p.y + lift, p.z], target: [q.x, q.y + lift, q.z], fov: fovAt(t) };
};
const PROJECTS_POSE = restPose(STATION_T.projects, STACK_LIFT);
const CONTACT_POSE = restPose(STATION_T.contact, 0);
/**
 * Phones: the device a project page parks at, from the URL (its index in site.projects). The devices are
 * centred and evenly spaced there, so the solved framing holds for each: only the lift changes. Off a project
 * page (the frames before the store catches up with a Link home) it keeps the last one, so the park never hops.
 */
let parkPath = "";
let parkIdx = 0;
function parkIndex(): number {
  const path = location.pathname;
  if (path !== parkPath) {
    parkPath = path;
    const i = site.projects.findIndex((p) => p.slug === path.split("/")[2]);
    if (i >= 0) parkIdx = i;
  }
  return parkIdx;
}
/** device 0 (centred on phones, so every stop has the same geometry) and the orb logo */
const DEVICE = { center: [VOID.x, VOID.y, VOID.z] as const, radius: 1.3 };
const ORB = { center: [SERVER.x + ORB_POS[0], SERVER.y + ORB_POS[1], SERVER.z + ORB_POS[2]] as const, radius: ORB_RADIUS };

/**
 * Apply a framing: zoom, then the lens shift. Only on a visible change (0.002 zoom, 0.5 px), and
 * again whenever R3F has resized the canvas (the view's full size no longer matches).
 */
function applyFraming(camera: PerspectiveCamera, f: Framing, w: number, h: number) {
  let dirty = false;
  if (Math.abs(camera.zoom - f.zoom) > 0.002) {
    camera.zoom = f.zoom;
    dirty = true;
  }
  const view = camera.view;
  if (Math.abs(f.offX) <= 0.5 && Math.abs(f.offY) <= 0.5) {
    if (view?.enabled) {
      camera.clearViewOffset(); // re-projects
      dirty = false;
    }
  } else if (!view?.enabled || view.fullWidth !== w || view.fullHeight !== h || Math.abs(view.offsetX - f.offX) > 0.5 || Math.abs(view.offsetY - f.offY) > 0.5) {
    camera.setViewOffset(w, h, f.offX, f.offY, w, h); // re-projects
    dirty = false;
  }
  if (dirty) camera.updateProjectionMatrix();
}

/**
 * Follows the closed curve at frame.t with damping, pointer parallax, a steadicam fBm drift
 * (6 channels, scaled per station, fading out at speed) and a velocity FOV.
 * Also hosts the cursor light, so that light is always mounted (constant light count for compileAsync).
 * High tier: about -> projects flies the monitor dive instead of the curve (scenes/dive.ts). The
 * damped state then lives in room space and the rendered camera adds dive.offset past the screen.
 *
 * Phone profile (worldStore.profile, fixed at hydration): no pointer parallax and no cursor light;
 * requestCut() snaps to the pose; the develop push-in; per-station framing into the DOM frame slots
 * (path/framing.ts, blended along the lap, applied as camera.zoom + setViewOffset); and the station
 * culling state (scenes/station-window.ts) for the scenes' useFrames. Desktop never sets a view offset.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const phone = useWorld((s) => s.profile === "phone");
  const [cullOff] = useState(() => new URLSearchParams(location.search).get("cull") === "0");
  const fr = useRef({ table: null as FramingTable | null, version: -1, w: 0, h: 0, cur: { zoom: 1, offX: 0, offY: 0 } as Framing });
  useEffect(() => {
    // ?probe=1: the framing probe reads the live camera (zoom, view offset, matrices), the culling state
    // and the fx envelopes (P16: fx.develop stays 1 under reduced motion)
    if (new URLSearchParams(location.search).get("probe") === "1") Object.assign(window, { __cam: camera, __cull: cull, __fx: fx });
    if (!phone) return;
    return installFrameSlots();
  }, [phone, camera]);
  // the damped look-at point = the current focus (world space); the cursor light uses it for its focal depth
  const [look] = useState(() => new Vector3());
  // cam / vlook: the damped camera and look-at in PATH space (world, except during the dive: room space)
  const scratch = useRef({ p: new Vector3(), t: new Vector3(), cam: new Vector3(), vlook: new Vector3(), right: new Vector3(), up: new Vector3(), fwd: new Vector3(), ptr: { x: 0, y: 0 }, fov: { v: 40 }, drift: { v: 0 }, init: false, lag: 0 });
  useFrame((state, dt) => {
    const v = scratch.current;
    const u = frame.t;
    const ws = worldStore.getState();
    const staticMode = ws.loopMode === "static";
    // phone: a jump / restore cut snaps to the pose through the static branch below
    const cut = phone && performance.now() < frame.cutUntil;
    dive.tick++;
    // station culling, before every scene's useFrame; lag trails t like the damped camera
    v.lag = staticMode || cut || !v.init ? u : wrap01(v.lag + loopDist(v.lag, u) * (1 - Math.exp(-LAG_RATE * dt)));
    updateCull(u, v.lag, phone && ws.webglReady && !cullOff);
    // a project page needs only its device: the portal's rings, the orb and the racks hang right under the last
    // one, behind that page's text (the home stops keep them: they look down the portal at the orb)
    if (cull.on && !ws.isHome) cull.portal = cull.server = false;

    const wantDive = v.init && !staticMode && !frame.freeze && ws.intro !== "playing" && diveAllowed() && inDiveWindow();
    const diving = diveGate(wantDive);
    if (diving && !dive.on && v.cam.y < SCREEN_C.y + DIVE_OFFSET.y * 0.5) {
      // entering from the void side (scrolling back up from projects): damped state into room space
      v.cam.sub(DIVE_OFFSET);
      v.vlook.sub(DIVE_OFFSET);
    } else if (!diving && dive.on && dive.void) {
      // leaving on the void side: back to world space (the rendered pose does not move)
      v.cam.add(DIVE_OFFSET);
      v.vlook.add(DIVE_OFFSET);
    }

    let parallax = 1;
    let follow = 0.16;
    if (diving) {
      // near the screen the parallax fades and the damping tightens, so a fast flick still arrives
      // square-on and the screen covers the frustum at the flip
      const close = divePose(frame.local, v.p, v.t);
      parallax = 1 - 0.85 * close;
      follow = 0.16 * (1 - 0.7 * close);
    } else {
      posCurve.getPoint(u, v.p);
      tgtCurve.getPoint(u, v.t);
      // projects: the curve is posed on the LAST device. During the hold the camera is lifted to
      // device idx (one viewport each, descending), so by the last stop the lift is zero and the
      // outgoing flight runs exactly on the curve (through the portal rings, well under the device).
      // Arriving from the room, the lift fades in so the camera lands on the first device.
      if (frame.segFrom === "projects") {
        const idx = Math.min(frame.vhIn, frame.stops - 1);
        // inner route: park at the first device (phones: at that project's own device, the one its page names)
        const lift = frame.stops > 1 ? (frame.stops - 1 - idx) * DEVICE_SPACING : phone ? STACK_LIFT - parkIndex() * DEVICE_SPACING : STACK_LIFT;
        v.p.y += lift;
        v.t.y += lift;
      } else if (frame.segTo === "projects") {
        const l = frame.local;
        const lift = STACK_LIFT * l * l * (3 - 2 * l);
        v.p.y += lift;
        v.t.y += lift;
      }
    }
    // pointer parallax in the camera's right/up plane (damped); none on phones (ptr stays 0)
    if (!staticMode && !phone) {
      easing.damp(v.ptr, "x", frame.pointer.x, 0.35, dt);
      easing.damp(v.ptr, "y", frame.pointer.y, 0.35, dt);
    }
    v.fwd.subVectors(v.t, v.p).normalize();
    v.right.crossVectors(v.fwd, camera.up).normalize();
    v.up.crossVectors(v.right, v.fwd);
    // phone develop: the world arrives with a short push-in along the view axis (fx.develop ≡ 1 on desktop)
    if (phone && fx.develop < 1) v.p.addScaledVector(v.fwd, -DEVELOP_PUSH * (1 - fx.develop));
    v.p.addScaledVector(v.right, v.ptr.x * PARALLAX * parallax).addScaledVector(v.up, v.ptr.y * PARALLAX * 0.5 * parallax);
    let fov = fovAt(u);
    // intro: descend from high above the room onto the hero pose while the furniture assembles;
    // the lens "breathes" open from a long focal length on igloo's intro ease
    if (ws.intro === "playing") {
      const k = 1 - introEase(frame.introT);
      v.p.x += 2.5 * k;
      v.p.y += 7 * k;
      v.p.z += 3 * k;
      v.t.y += 1.5 * k;
      fov += (INTRO_FOV - fov) * k;
    }
    if (phone) {
      // subjects into their DOM slots: re-solve on a slot re-measure or a canvas resize, blend along the lap
      const W = state.size.width, H = state.size.height;
      const f = fr.current;
      if (!f.table || f.version !== frameSlots.version || f.w !== W || f.h !== H) {
        const device = frameSlots.device.get(0) ?? frameSlots.device.values().next().value ?? null;
        f.table = stationFramings("phone", W / Math.max(1, H), { w: W, h: H }, {
          projects: { pose: PROJECTS_POSE, subject: DEVICE, slot: device, fill: FILL.device },
          contact: { pose: CONTACT_POSE, subject: ORB, slot: frameSlots.orb, fill: FILL.orb },
        });
        f.version = frameSlots.version;
        f.w = W;
        f.h = H;
      }
      applyFraming(camera, framingAt(u, frame.segFrom, frame.segTo, f.table, STATION_T, f.cur), W, H);
    } else {
      // portrait phones: zoom out so the scenes fit a tall screen (igloo: min(1, aspect * 1.25))
      const zoom = Math.min(1, state.viewport.aspect * 1.25);
      if (Math.abs(camera.zoom - zoom) > 1e-3) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
      }
    }

    if (staticMode || !v.init || cut) {
      // reduced motion (or first frame): cut straight to the pose, no drift, no velocity FOV
      v.init = true;
      v.cam.copy(v.p);
      v.vlook.copy(v.t);
      camera.position.copy(v.p);
      look.copy(v.t);
      camera.lookAt(look);
      v.fov.v = fov;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      publishDive(false, false, 0);
      return;
    }
    // steadicam: 3-octave fBm on 6 channels; per-station amount, near zero at speed, 0 when frozen
    easing.damp(v.drift, "v", frame.freeze ? 0 : DRIFT[ws.station] * (1 - frame.vNorm), 0.5, dt);
    const a = frame.freeze ? 0 : v.drift.v;
    const t = state.clock.elapsedTime;
    if (a > 1e-4) {
      v.p.addScaledVector(v.right, fbm1(t * 0.23, 11) * DRIFT_POS * a);
      v.p.addScaledVector(v.up, fbm1(t * 0.19, 23) * DRIFT_POS * a);
      v.p.addScaledVector(v.fwd, fbm1(t * 0.13, 37) * DRIFT_POS * 0.6 * a);
    }
    if (!frame.freeze) fov += VEL_FOV * frame.vNorm;
    easing.damp3(v.cam, v.p, follow, dt);
    easing.damp3(v.vlook, v.t, follow, dt);
    camera.position.copy(v.cam);
    camera.lookAt(v.vlook);
    if (a > 1e-4) {
      camera.rotateX(fbm1(t * 0.17, 41) * DRIFT_ROT * a);
      camera.rotateY(fbm1(t * 0.21, 53) * DRIFT_ROT * a);
      camera.rotateZ(fbm1(t * 0.11, 67) * DRIFT_ROT * 0.5 * a);
    }
    easing.damp(v.fov, "v", fov, 0.2, dt);
    // re-project only on a visible change
    if (Math.abs(camera.fov - v.fov.v) > 0.05) {
      camera.fov = v.fov.v;
      camera.updateProjectionMatrix();
    }
    // the portal flip: once the damped camera is close and the screen covers the whole frame, render
    // from the void side. A pure translation keeps the orientation, so the frame is the portal's view.
    // One predicate of the camera state, so scrolling back flips back at the same place.
    const fd = flipDist(camera.fov, camera.aspect, camera.zoom);
    const pd = diving ? screenPlaneDist(v.cam) : 1e9;
    let voidSide = pd < FLIP_FORCE;
    if (!voidSide && pd < fd) {
      camera.updateMatrixWorld();
      voidSide = screenCoversView(camera);
    }
    publishDive(diving, voidSide, frame.local, 1 - smooth(0, 1.5 * fd, Math.abs(pd - fd)));
    camera.position.add(dive.offset);
    look.copy(v.vlook).add(dive.offset);
  }, -50);
  // phones keep a constant light set without it (5 point lights from mount to the end of the session)
  return phone ? null : <CursorLight focus={look} />;
}

/** the single writer of scenes/dive.ts `dive` */
function publishDive(on: boolean, voidSide: boolean, local: number, near = 0) {
  if (on && dive.on && voidSide !== dive.void) {
    dive.flipTick = dive.tick;
    dive.flipDelta.copy(DIVE_OFFSET).multiplyScalar(voidSide ? 1 : -1);
  }
  dive.near = on ? near : 0;
  dive.on = on;
  dive.void = on && voidSide;
  if (dive.void) dive.offset.copy(DIVE_OFFSET);
  else dive.offset.set(0, 0, 0);
  // the code texture gives way to the portal early in the window
  dive.mix = on ? smooth(0.02, 0.22, local) : 0;
}
