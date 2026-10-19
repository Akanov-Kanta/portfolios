"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferAttribute, Color, PerspectiveCamera, SRGBColorSpace, ShaderMaterial, Sphere, Vector3, type Group, type Points } from "three";
import { site } from "@/content/site";
import { socialKey } from "@/components/home/social-icons";
import { orbScreen, useSocial } from "../state/social-store";
import { frame, holdLoad, isCalm, useWorld, worldStore } from "../state/world-store";
import { PALETTE, fx } from "../theme";
import { buildIconShape, makePalette, morphK, orbPhase, MORPH_END, MORPH_SETTLE, MORPH_SPREAD, MORPH_TRAVEL, type CloudShape } from "./icon-cloud-geometry";
import { isReflectionCamera, reflectable, reflectPass } from "./reflect";
import { cull } from "./station-window";

/** "done" morph clock: past MORPH_END every orb evaluates to exactly its target */
const SETTLED = 1e3;
/**
 * Cursor spring: the flee displacement is the pointer field convolved with each orb's own
 * underdamped impulse response over the last HIST·HIST_DT seconds of pointer positions, so an orb
 * that is pushed (or released) swings a little past its mark and settles. Stateless on the GPU.
 */
const HIST = 16;
const HIST_DT = 0.03;
/** carousel impulse → spin (rad/s at |impulse| = 1); ~one full turn over the quartOut decay */
const SPIN = 10;
const TAU = Math.PI * 2;
/** local-space cull sphere for the cloud (see the <bufferGeometry> below) */
const cullBounds = new Sphere(new Vector3(), 6);
/** phones without a hold: the flee target, far from everything */
const PARKED = new Vector3(999, 999, 999);
/** half the logo's width in world units (buildIconShape: size 3.3 less its 8% raster padding each side) */
const LOGO_HALF = (3.3 * 0.84) / 2;

/**
 * igloo's footer object: the selected platform's logo as a thick solid made of thousands of
 * small lit orbs. Orbs flee the cursor (with a trailing wake), the solid breathes and turns,
 * and a platform change bursts the cloud apart and reassembles it as the next logo: each orb
 * rides an analytic curl-noise swirl (weighted by sin(pi*k), so it lands exactly), tinted from ice
 * toward the mood accent by its speed and flaring for bloom as it arrives. A change also spins the
 * solid in the direction of travel (fx.impulse). Reduced motion swaps instantly.
 * All per-orb motion is in the vertex shader; a morph only swaps one target buffer.
 */
export function IconCloud({ count = 14000, position = [0, 1.7, 0] as [number, number, number] }) {
  const key = useSocial((s) => s.key);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const group = useRef<Group>(null);
  const pts = useRef<Points>(null);
  const [shapes, setShapes] = useState<Map<string, CloudShape> | null>(null);
  const releaseLoad = useRef(() => {});

  const keys = useMemo(() => Array.from(new Set(site.socials.map((s) => socialKey(s.label, s.href)))), []);
  const palette = useMemo(() => makePalette(count), [count]);

  // build every logo once (rasterised SVG → orb positions); same count so buffers can morph
  useEffect(() => {
    let alive = true;
    // the loading screen waits for the logos (desktop): released once the points are in the scene (below)
    const release = (releaseLoad.current = holdLoad());
    // a logo that fails to rasterise falls back to the globe, so one bad icon can't blank the cloud
    const build = (k: string) => buildIconShape(k, count).catch(() => buildIconShape("globe", count));
    Promise.all(keys.map((k) => build(k).then((s) => [k, s] as const)))
      .then((all) => {
        if (alive) setShapes(new Map(all));
      })
      .catch((err) => {
        console.error("[IconCloud]", err);
        release();
      });
    return () => {
      alive = false;
      release();
    };
  }, [keys, count]);
  useEffect(() => {
    if (shapes) releaseLoad.current();
  }, [shapes]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: false,
        depthWrite: true,
        depthTest: true,
        uniforms: {
          uTime: { value: 0 },
          uMorphT: { value: SETTLED },
          uPxScale: { value: 1 },
          uHist: { value: Array.from({ length: HIST }, () => new Vector3(999, 999, 999)) },
          uHistPhase: { value: 0 },
          uFleeOn: { value: 0 },
          uProj: { value: 600 },
          uRadius: { value: 0.011 },
          uMouse: { value: new Vector3(999, 999, 999) },
          uWake: { value: new Vector3(999, 999, 999) },
          uMouseR: { value: 0.75 },
          uPush: { value: 0.42 },
          uScatter: { value: 0 },
          uIce: { value: new Color(PALETTE.ice) },
          uAccent: { value: new Color(PALETTE.screen) },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aPosB;
          attribute vec3 aColor;
          attribute float aSize;
          attribute float aSeed;
          uniform float uTime, uMorphT, uProj, uPxScale, uRadius, uMouseR, uPush, uScatter, uHistPhase, uFleeOn;
          uniform vec3 uMouse, uWake, uIce, uAccent;
          uniform vec3 uHist[${HIST}];
          varying vec3 vColor;
          varying float vFade;
          varying float vGlow;
          // analytic curl of a sine potential (2 octaves): divergence-free, so the swirl reads as flow
          vec3 curl1(vec3 p) {
            float ca = cos(1.3 * p.y + 0.7 * p.z), cb = cos(1.1 * p.z + 0.9 * p.x), cc = cos(1.7 * p.x + 0.5 * p.y);
            return vec3(0.5 * cc - 1.1 * cb, 0.7 * ca - 1.7 * cc, 0.9 * cb - 1.3 * ca);
          }
          vec3 curl(vec3 p) { return curl1(p) + 0.5 * curl1(p * 2.3 + 4.1); }
          // per-orb underdamped spring step response (mirrors morphK in icon-cloud-geometry.ts)
          float morphK(float t, float seed) {
            if (t <= 0.0) return 0.0;
            if (t >= ${MORPH_SETTLE.toFixed(3)}) return 1.0;
            float w = 6.2 + 2.4 * fract(seed * 5.13 + 0.37);
            float z = 0.58 + 0.16 * fract(seed * 9.71 + 0.83);
            float a = z * w, wd = w * sqrt(1.0 - z * z);
            float e = exp(-a * t) * (cos(wd * t) + a / wd * sin(wd * t));
            return 1.0 - e * (1.0 - smoothstep(${(MORPH_SETTLE - 0.35).toFixed(3)}, ${MORPH_SETTLE.toFixed(3)}, t));
          }
          void main() {
            vColor = aColor;
            vGlow = 0.0;
            float s = fract(aSeed * 0.15915494);            // 0..1 per-orb phase
            // morph: each orb leaves on its own schedule, so the solid peels apart, not slides; its
            // position rides its own spring (k overshoots 1 a little), the swirl rides linear progress k
            float lt = uMorphT - s * ${MORPH_SPREAD.toFixed(3)};
            float k = clamp(lt / ${MORPH_TRAVEL.toFixed(3)}, 0.0, 1.0);
            vec3 pos = mix(position, aPosB, morphK(lt, aSeed));
            vec3 dir = normalize(vec3(sin(aSeed * 3.1), cos(aSeed * 1.7) * 0.6, sin(aSeed * 5.3)));
            // mid-morph the solid dissolves: orbs ride a curl-noise swirl (seeded per orb), sift down a
            // little like sand, then settle exactly (sin(pi*k) = 0 at both ends)
            float burst = sin(k * 3.14159);
            if (k > 0.0 && k < 1.0) {
              vec3 q = position * 0.9 + vec3(aSeed * 1.7, aSeed * 0.9, aSeed * 2.3);
              float amp = 0.3 * (0.5 + fract(aSeed * 11.0));
              float k1 = min(1.0, k + 0.03);
              vec3 o0 = curl(q + vec3(0.0, k * 2.5, 0.0)) * burst;
              vec3 o1 = curl(q + vec3(0.0, k1 * 2.5, 0.0)) * sin(k1 * 3.14159);
              pos += o0 * amp + vec3(0.0, -0.25 * fract(aSeed * 7.0) * burst, 0.0);
              // per-orb speed (finite difference of the offset) tints ice → accent; flare on arrival for bloom
              float spd = clamp(length(o1 - o0) * amp / 0.03 * 0.35, 0.0, 1.0);
              vColor = mix(aColor, mix(uIce, uAccent, spd), burst * 0.8);
              vGlow = spd * burst * 0.8 + smoothstep(0.6, 0.9, k) * (1.0 - smoothstep(0.9, 1.0, k)) * 1.2;
            }
            // idle: surface shimmer, plus a few loose grains that trickle down the solid and return
            pos += 0.006 * vec3(sin(uTime * 1.3 + aSeed), cos(uTime * 1.1 + aSeed * 2.0), sin(uTime * 0.9 + aSeed * 3.0));
            float loose = smoothstep(0.93, 1.0, sin(uTime * 0.33 + aSeed * 13.0));
            pos += vec3(dir.x * 0.08, -0.28 * loose, dir.z * 0.08) * loose;
            // scroll velocity loosens the solid
            pos += dir * uScatter * 0.3 * (0.4 + 0.6 * s);
            vec4 wpos = modelMatrix * vec4(pos, 1.0);
            // cursor field: orbs flee the pointer. The push is filtered through this orb's spring:
            // sum over past pointer samples of field(sample) * h(age), h(t) = e^(-a t) sin(wd t),
            // normalised to unit gain. Stiffness/damping hashed per orb, so the settle is not uniform.
            // e^(-a t) and sin/cos(wd t) advance by constant ratios / rotations per sample: 3 exp/trig total.
            vec3 flee = vec3(0.0);
            float fsum = 0.0, wsum = 1.0;
            // uniform branch: skipped entirely while no recent pointer sample is near the solid
            if (uFleeOn > 0.5) {
              wsum = 0.0;
              float hw = 13.0 + 7.0 * fract(aSeed * 7.31 + 0.13);
              float hz = 0.5 + 0.15 * fract(aSeed * 3.77 + 0.61);
              float ha = hz * hw, hwd = hw * sqrt(1.0 - hz * hz);
              float he = exp(-ha * uHistPhase), hr = exp(-ha * ${HIST_DT.toFixed(3)});
              vec2 hsc = vec2(sin(hwd * uHistPhase), cos(hwd * uHistPhase));
              vec2 hrot = vec2(sin(hwd * ${HIST_DT.toFixed(3)}), cos(hwd * ${HIST_DT.toFixed(3)}));
              float push = uPush * (0.7 + 0.6 * s);
              for (int i = 1; i < ${HIST}; i++) {
                float w = he * hsc.x;
                vec3 dv = wpos.xyz - uHist[i];
                float fi = smoothstep(uMouseR, 0.0, length(dv));
                fi *= fi;
                flee += w * fi * (normalize(dv + vec3(1e-4, 2e-4, 1e-4)) * push + vec3(0.0, 0.12, 0.25));
                fsum += w * fi;
                wsum += w;
                he *= hr;
                hsc = vec2(hsc.x * hrot.y + hsc.y * hrot.x, hsc.y * hrot.y - hsc.x * hrot.x);
              }
            }
            wsum = max(wsum, 1e-4);
            float f = max(fsum / wsum, 0.0);
            wpos.xyz += flee / wsum;
            // a slower trailing point leaves a wake behind the cursor
            float d2 = distance(wpos.xyz, uWake);
            float f2 = smoothstep(uMouseR * 0.8, 0.0, d2);
            vec3 away2 = normalize(wpos.xyz - uWake + vec3(1e-4, 2e-4, 1e-4));
            wpos.xyz += away2 * f2 * f2 * uPush * 0.45;
            vFade = 1.0 - burst * 0.3 - loose * 0.35;
            vec4 mv = viewMatrix * wpos;
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uPxScale * uRadius * 2.0 * aSize * (1.0 + f * 0.3) * (1.0 - loose * 0.4) * uProj / max(0.05, -mv.z);
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor;
          varying float vFade;
          varying float vGlow;
          void main() {
            vec2 c = gl_PointCoord * 2.0 - 1.0;
            c.y = -c.y;
            float r2 = dot(c, c);
            if (r2 > 1.0) discard;
            // sphere impostor: normal from the disc, lit in view space so the look is camera-stable
            vec3 n = vec3(c, sqrt(1.0 - r2));
            vec3 keyDir = normalize(vec3(-0.35, 0.75, 0.6));
            vec3 fillDir = normalize(vec3(0.7, -0.35, 0.45));
            float key = max(dot(n, keyDir), 0.0);
            float fill = max(dot(n, fillDir), 0.0);
            float rim = pow(1.0 - n.z, 2.5);
            vec3 col = vColor * (0.16 + key * 0.8);
            col += vec3(0.32, 0.5, 0.72) * fill * 0.22;
            col += vec3(0.45, 0.9, 1.0) * rim * 0.22;
            col += vColor * vGlow * (0.6 + key);
            gl_FragColor = vec4(col * vFade, 1.0);
          }`,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  // morph bookkeeping: `position` holds where the orbs are, aPosB where they are going
  const posAttr = useMemo(() => new BufferAttribute(new Float32Array(count * 3), 3), [count]);
  const targetAttr = useMemo(() => new BufferAttribute(new Float32Array(count * 3), 3), [count]);
  const morphStart = useRef(-1);
  const current = useRef<string | null>(null);

  useEffect(() => {
    if (!shapes) return;
    const next = shapes.get(key) ?? shapes.get(keys[0]);
    if (!next) return;
    const a = posAttr.array as Float32Array, b = targetAttr.array as Float32Array;
    const instant = worldStore.getState().loopMode === "static" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (current.current === null || instant) {
      a.set(next.positions);
      b.set(next.positions);
      material.uniforms.uMorphT.value = SETTLED;
      morphStart.current = -1;
      frame.dirty = Math.max(frame.dirty, 2);
    } else {
      // freeze the orbs where they are right now (mid-morph included), then aim at the new logo
      const T = material.uniforms.uMorphT.value as number;
      const seeds = palette.seeds;
      for (let i = 0; i < count; i++) {
        const seed = seeds[i]!;
        const k = morphK(T - orbPhase(seed) * MORPH_SPREAD, seed);
        const j = i * 3;
        a[j] += (b[j] - a[j]) * k;
        a[j + 1] += (b[j + 1] - a[j + 1]) * k;
        a[j + 2] += (b[j + 2] - a[j + 2]) * k;
      }
      b.set(next.positions);
      material.uniforms.uMorphT.value = 0;
      morphStart.current = performance.now();
    }
    posAttr.needsUpdate = true;
    targetAttr.needsUpdate = true;
    current.current = key;
  }, [shapes, key, keys, posAttr, targetAttr, material, palette, count]);

  const mouseWorld = useMemo(() => new Vector3(999, 999, 999), []);
  const wakeWorld = useMemo(() => new Vector3(999, 999, 999), []);
  const target = useMemo(() => new Vector3(), []);
  const center = useMemo(() => new Vector3(), []);
  const spin = useRef(0);
  const phone = useWorld((s) => s.profile === "phone");
  const tilt = useRef({ x: 0, y: 0, parked: true });

  useFrame((state, dt) => {
    orbScreen.on = false;
    // phones: outside the server window nothing is drawn, so skip the uniform work too
    if (!cull.server) return;
    const u = material.uniforms;
    // phones: the tilt follows a damped pointer that eases back to 0 unless a hold is live (OrbStage)
    const tl = tilt.current;
    if (phone) {
      const k = 1 - Math.exp(-6 * dt);
      tl.x += ((frame.pointerLive ? frame.pointer.x : 0) - tl.x) * k;
      tl.y += ((frame.pointerLive ? frame.pointer.y : 0) - tl.y) * k;
    }
    u.uProj.value = (state.size.height * 0.5) / Math.tan((camera.fov * Math.PI) / 360) * state.viewport.dpr;
    u.uScatter.value = frame.vNorm;
    const acc = fx.mood.accent;
    (u.uAccent.value as Color).setRGB(acc[0], acc[1], acc[2], SRGBColorSpace);
    const g = group.current;
    if (!g) return;
    if (morphStart.current >= 0) {
      const T = frame.freeze ? SETTLED : (performance.now() - morphStart.current) / 1000;
      u.uMorphT.value = T >= MORPH_END ? SETTLED : T;
      if (T >= MORPH_END) morphStart.current = -1;
    }
    if (!frame.freeze) {
      u.uTime.value += dt;
      const t = state.clock.elapsedTime;
      // carousel impulse spins the solid the way you travelled; it then eases onto a whole turn
      spin.current += fx.impulse * SPIN * dt;
      if (Math.abs(fx.impulse) < 0.02) spin.current += (Math.round(spin.current / TAU) * TAU - spin.current) * (1 - Math.exp(-4 * dt));
      const px = phone ? tl.x : frame.pointer.x, py = phone ? tl.y : frame.pointer.y;
      g.rotation.y = Math.sin(t * 0.35) * 0.28 + px * 0.25 + spin.current;
      g.rotation.x = Math.sin(t * 0.27) * 0.06 - py * 0.08;
      g.position.set(position[0], position[1] + Math.sin(t * 0.8) * 0.06, position[2]);
    }
    // project the cursor onto the object's depth → a world point the orbs flee from
    // (unproject uses the offset-aware projection, so the phone lens shift is accounted for)
    g.getWorldPosition(center);
    // desktop: where the logo sits on screen, for the click-through link (home/OrbLink)
    const depth = -target.copy(center).applyMatrix4(camera.matrixWorldInverse).z;
    center.project(camera);
    if (!phone && depth > 0.1) {
      orbScreen.x = (center.x * 0.5 + 0.5) * state.size.width;
      orbScreen.y = (-center.y * 0.5 + 0.5) * state.size.height;
      orbScreen.half = (LOGO_HALF * state.size.height * 0.5 * camera.zoom) / (Math.tan((camera.fov * Math.PI) / 360) * depth);
      orbScreen.on = true;
    }
    target.set(frame.pointer.x, frame.pointer.y, center.z).unproject(camera);
    if (phone && !frame.pointerLive) {
      // no hold: the flee target is parked far away (the history springs the orbs back)
      mouseWorld.copy(PARKED);
      wakeWorld.copy(PARKED);
      tl.parked = true;
    } else if (phone && tl.parked) {
      // a hold starts where the finger is, instead of sweeping in from the parked point
      mouseWorld.copy(target);
      wakeWorld.copy(target);
      tl.parked = false;
    } else {
      mouseWorld.lerp(target, 1 - Math.exp(-16 * dt));
      wakeWorld.lerp(mouseWorld, 1 - Math.exp(-4 * dt));
    }
    u.uMouse.value.copy(mouseWorld);
    u.uWake.value.copy(wakeWorld);
    // pointer history for the per-orb flee springs: slot 0 is now, slot i is (phase + (i-1)·HIST_DT) s old.
    // No dynamics when time is held (freeze / static loop): every slot = now, so the push is instant.
    const hist = u.uHist.value as Vector3[];
    const still = isCalm();
    hist[0]!.copy(mouseWorld);
    if (still) {
      for (let i = 1; i < HIST; i++) hist[i]!.copy(mouseWorld);
      u.uHistPhase.value = 0;
    } else {
      let ph = (u.uHistPhase.value as number) + Math.min(dt, 0.1);
      while (ph >= HIST_DT) {
        ph -= HIST_DT;
        for (let i = HIST - 1; i > 1; i--) hist[i]!.copy(hist[i - 1]!);
        hist[1]!.copy(mouseWorld);
      }
      u.uHistPhase.value = ph;
    }
    // any sample within reach of the solid (bounding radius ~2.4 + field radius)? else the shader skips the loop
    g.getWorldPosition(center);
    const reach = (2.4 + (u.uMouseR.value as number)) ** 2;
    let on = 0;
    for (let i = 1; i < HIST && !on; i++) if (hist[i]!.distanceToSquared(center) < reach) on = 1;
    u.uFleeOn.value = on;
  });

  // the floor reflection renders at a fraction of the drawing buffer: scale the sprites to match
  useEffect(() => {
    const p = pts.current;
    if (!p) return;
    reflectable(p);
    p.onBeforeRender = (_r, _s, cam) => {
      material.uniforms.uPxScale.value = isReflectionCamera(cam) ? reflectPass.pxScale : 1;
    };
  }, [shapes, material]);

  if (!shapes) return null;
  return (
    <group ref={group} position={position}>
      <points ref={pts} material={material} renderOrder={2}>
        {/* fixed cull bounds: the solid (~2.4 m) plus swirl, scatter, loose drift and cursor flee, with
            margin. The shader moves every orb, so the attribute data can't be used to compute them. */}
        <bufferGeometry boundingSphere={cullBounds}>
          <primitive attach="attributes-position" object={posAttr} />
          <primitive attach="attributes-aPosB" object={targetAttr} />
          <bufferAttribute attach="attributes-aColor" args={[palette.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[palette.sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[palette.seeds, 1]} />
        </bufferGeometry>
      </points>
    </group>
  );
}
