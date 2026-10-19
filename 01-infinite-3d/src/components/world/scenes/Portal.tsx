"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import { posCurve } from "../path/curves";
import { STATION_T } from "../path/stations";
import { CONTROL } from "../path/stations";
import { frame } from "../state/world-store";
import { fx, PALETTE } from "../theme";
import { cull, setCulled } from "./station-window";

const Z = new Vector3(0, 0, 1);
const Y = new Vector3(0, 1, 0);

const N = CONTROL.length;
const T0 = STATION_T.projects + 1 / N; // gate 5
const T1 = STATION_T.contact;
/** ring radii (outer torus) */
const RING_R = [2.6, 2.3, 2.0];
const TUNNEL_LEN = 9;

/** Ring + tunnel frames on the dive (module-level: the curve is static). SmokeRibbons reads the tunnel mouth. */
export const PORTAL = {
  rings: [0.15, 0.42, 0.68].map((k, i) => {
    const t = T0 + (T1 - T0) * k;
    const p = posCurve.getPoint(t);
    const tan = posCurve.getTangent(t).normalize();
    return { p, tan, q: new Quaternion().setFromUnitVectors(Z, tan), r: RING_R[i]! };
  }),
  tunnel: (() => {
    const t = T0 + (T1 - T0) * 0.85;
    const p = posCurve.getPoint(t);
    const tan = posCurve.getTangent(t).normalize();
    // cylinder axis is Y: rotate Y onto the tangent. The camera enters at p - tan · len/2.
    return { p, tan, q: new Quaternion().setFromUnitVectors(Y, tan), len: TUNNEL_LEN, r: 2.8, mouth: p.clone().addScaledVector(tan, -TUNNEL_LEN / 2) };
  })(),
};

/** ±units along a ring's axis over which fx.ring falls from 1 to 0 */
const RING_FALLOFF = 1.5;

/** Ring gates + tunnel on the dive between the project stack and the server room. */
export function Portal() {
  const camera = useThree((s) => s.camera);
  const g = useRef<Group>(null);
  const root = useRef<Group>(null);
  const shown = useRef(true);
  const d = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    // phones: culled outside the portal window (no ring swirl there either)
    if (cull.portal !== shown.current) {
      shown.current = cull.portal;
      setCulled(root.current, cull.portal);
    }
    if (!cull.portal) {
      fx.ring = 0;
      return;
    }
    // fx.ring: 1 exactly while the camera crosses a ring plane, 0 beyond ±1.5 units (and off-axis)
    let ring = 0;
    for (const r of PORTAL.rings) {
      d.subVectors(camera.position, r.p);
      const along = d.dot(r.tan);
      const lateral = Math.sqrt(Math.max(0, d.lengthSq() - along * along));
      if (lateral > r.r * 1.5) continue;
      const k = Math.max(0, 1 - Math.abs(along) / RING_FALLOFF);
      ring = Math.max(ring, k * k * (3 - 2 * k));
    }
    fx.ring = ring;
    if (!g.current || frame.freeze) return;
    const t = state.clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.rotation.z = t * (0.15 + i * 0.05) * (i % 2 ? -1 : 1);
    });
  });
  return (
    <group ref={root}>
      <group ref={g}>
        {PORTAL.rings.map((r, i) => (
          <group key={i} position={r.p} quaternion={r.q}>
            <mesh>
              <torusGeometry args={[r.r, 0.06, 12, 96]} />
              <meshStandardMaterial color="#0d1020" emissive={PALETTE.screen} emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
            <mesh>
              <torusGeometry args={[r.r - 0.6, 0.02, 8, 96]} />
              <meshBasicMaterial color={PALETTE.violet} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={PORTAL.tunnel.p} quaternion={PORTAL.tunnel.q}>
        <cylinderGeometry args={[PORTAL.tunnel.r, PORTAL.tunnel.r, PORTAL.tunnel.len, 32, 12, true]} />
        <meshBasicMaterial color="#2c2566" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
