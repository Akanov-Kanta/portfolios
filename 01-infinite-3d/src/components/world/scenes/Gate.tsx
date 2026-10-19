"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Quaternion, Vector3, type Points } from "three";
import { posCurve } from "../path/curves";
import { CONTROL } from "../path/stations";
import { frame } from "../state/world-store";
import { rng } from "./rng";
import { cull, gateShown } from "./station-window";

const Z = new Vector3(0, 0, 1);

/** A ring of points at each non-station control point; scatters with scroll velocity. */
export function Gates({ perGate = 300 }: { perGate?: number }) {
  const N = CONTROL.length;
  const gates = useMemo(
    () =>
      CONTROL.map((c, i) => ({ c, i }))
        .filter(({ c }) => !c.station)
        .map(({ i }) => {
          const t = i / N;
          const p = posCurve.getPoint(t);
          const tan = posCurve.getTangent(t).normalize();
          const q = new Quaternion().setFromUnitVectors(Z, tan);
          const pos = new Float32Array(perGate * 3);
          const base = new Float32Array(perGate * 3);
          const rand = rng(100 + i);
          for (let k = 0; k < perGate; k++) {
            const a = (k / perGate) * Math.PI * 2;
            const r = 1.4 + (rand() - 0.5) * 0.15;
            base[k * 3] = Math.cos(a) * r;
            base[k * 3 + 1] = Math.sin(a) * r;
            base[k * 3 + 2] = (rand() - 0.5) * 0.1;
          }
          pos.set(base);
          return { p, q, pos, base, t };
        }),
    [N, perGate],
  );
  const refs = useRef<(Points | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const v = frame.vNorm;
    // only visible while flying: opacity follows the transition bell (+ a little with velocity)
    const vis = Math.min(1, frame.transition * 1.2 + v * 0.4);
    gates.forEach((g, gi) => {
      const pts = refs.current[gi];
      if (!pts) return;
      (pts.material as import("three").PointsMaterial).opacity = vis * 0.9;
      // phones: only near its own control point or where its scene shows (station-window.ts gateShown)
      pts.visible = vis > 0.01 && gateShown(cull, g.t);
      // positions are a pure function of t, so a hidden ring can skip the rebuild + upload
      if (!pts.visible || frame.freeze) return;
      const posAttr = pts.geometry.getAttribute("position") as import("three").BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let k = 0; k < perGate; k++) {
        const s = 1 + v * 0.35 * Math.sin(t * 3 + k);
        arr[k * 3] = g.base[k * 3] * s;
        arr[k * 3 + 1] = g.base[k * 3 + 1] * s;
        arr[k * 3 + 2] = g.base[k * 3 + 2] + Math.sin(t * 2 + k * 0.3) * 0.02 * (1 + v * 4);
      }
      posAttr.needsUpdate = true;
      pts.rotation.z = t * 0.1;
    });
  });
  return (
    <group>
      {gates.map((g, i) => (
        <points
          key={i}
          ref={(p) => {
            refs.current[i] = p as Points | null;
          }}
          position={g.p}
          quaternion={g.q}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[g.pos, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.035} color="#7c8cff" transparent opacity={0.9} depthWrite={false} blending={AdditiveBlending} sizeAttenuation />
        </points>
      ))}
    </group>
  );
}
