"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import {
  Color, HalfFloatType, LinearFilter, LinearMipmapLinearFilter, Matrix4, MeshStandardMaterial, PerspectiveCamera, Plane,
  SRGBColorSpace, UnsignedByteType, Vector2, Vector3, Vector4, WebGLRenderTarget, type Mesh, type Object3D, type Texture,
} from "three";
import { frame, useWorld, worldStore } from "../state/world-store";
import { fx, PALETTE } from "../theme";
import { getNoiseTexture } from "./noise-texture";
import { SERVER } from "./layout";
import { contactNear, REFL_LAYER, reflectPass } from "./reflect";

/** floor disc radius (m) */
const RADIUS = 9;
/** reflection target size (square; the blur comes from its mip chain) */
const RES = 512;
/** reflection strength at full proximity: a dark, rough floor, never a mirror */
const REFL_GAIN = 0.4;
/** grid cell (m), reveal radius around the cursor (m), peak line intensity (linear, additive) */
const GRID_CELL = 0.5;
const GRID_R = 1.7;
const GRID_GAIN = 0.07;

const PARS = /* glsl */ `
varying vec3 vFloorW;
uniform vec3 uGridColor;
uniform vec3 uCursor;
uniform float uGrid;
uniform vec2 uCenter;
#ifdef FLOOR_REFLECT
  uniform sampler2D tRefl;
  uniform sampler2D tNoise;
  uniform mat4 uReflMat;
  uniform float uRefl;
#endif
`;

const FRAG = /* glsl */ `
#ifdef FLOOR_REFLECT
  if ( uRefl > 0.001 ) {
    vec4 rp = uReflMat * vec4( vFloorW, 1.0 );
    vec2 ruv = rp.xy / rp.w;
    // rough, not mirrored: tiling noise breaks the image up, then a coarse-mip 5-tap blur
    ruv += ( texture2D( tNoise, vFloorW.xz * 0.21 ).rb - 0.5 ) * 0.035;
    vec3 refl = textureLod( tRefl, ruv, 3.0 ).rgb * 0.4
      + textureLod( tRefl, ruv + vec2( 0.016, 0.006 ), 3.6 ).rgb * 0.15
      + textureLod( tRefl, ruv - vec2( 0.016, 0.006 ), 3.6 ).rgb * 0.15
      + textureLod( tRefl, ruv + vec2( -0.005, 0.018 ), 3.6 ).rgb * 0.15
      + textureLod( tRefl, ruv - vec2( -0.005, 0.018 ), 3.6 ).rgb * 0.15;
    vec2 redge = smoothstep( 0.0, 0.06, ruv ) * smoothstep( 0.0, 0.06, 1.0 - ruv );
    float rfall = 1.0 - smoothstep( 2.5, 8.5, distance( vFloorW.xz, uCenter ) );
    outgoingLight += refl * ( uRefl * redge.x * redge.y * rfall );
  }
#endif
  if ( uGrid > 0.001 ) {
    // world-space grid, antialiased with fwidth; lines fade out where they would alias
    vec2 gp = vFloorW.xz / ${GRID_CELL.toFixed(3)};
    vec2 gw = max( fwidth( gp ), vec2( 1e-4 ) );
    vec2 gq = abs( fract( gp - 0.5 ) - 0.5 ) / gw;
    float gline = ( 1.0 - min( min( gq.x, gq.y ), 1.0 ) ) * ( 1.0 - smoothstep( 0.15, 0.5, max( gw.x, gw.y ) ) );
    float gm = 1.0 - smoothstep( 0.0, 1.0, distance( vFloorW.xz, uCursor.xy ) / uCursor.z );
    outgoingLight += uGridColor * ( gline * gm * gm * uGrid );
  }
`;

function makeFloorMaterial(reflect: boolean, tRefl: Texture | null) {
  const uniforms = {
    uGridColor: { value: new Color().setStyle(PALETTE.screen, SRGBColorSpace) },
    /** xy: pointer's hit on the floor (world xz), z: reveal radius */
    uCursor: { value: new Vector3(SERVER.x, SERVER.z, GRID_R) },
    uGrid: { value: 0 },
    uCenter: { value: new Vector2(SERVER.x, SERVER.z) },
    tRefl: { value: tRefl },
    tNoise: { value: getNoiseTexture() },
    uReflMat: { value: new Matrix4() },
    uRefl: { value: 0 },
  };
  const m = new MeshStandardMaterial({ color: "#0f1220", roughness: 0.9 });
  if (reflect) m.defines = { ...m.defines, FLOOR_REFLECT: "" };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFloorW;")
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vFloorW = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\n${PARS}`)
      .replace("#include <opaque_fragment>", `${FRAG}\n#include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => (reflect ? "server-floor-r" : "server-floor");
  return { material: m, uniforms };
}

const isLight = (o: Object3D) => {
  if ((o as Object3D & { isLight?: boolean }).isLight) o.layers.enable(REFL_LAYER);
};

/**
 * Server-room floor disc. Two extras on top of the plain lit floor:
 *  - high tier: a dark, rough planar reflection of the reflection layer (orb logo, halo, rack LEDs),
 *    rendered into a 512² target with an oblique near plane, blurred through its mips. Only rendered
 *    while the camera is near the contact station (contactNear), so it costs nothing on the rest of the loop.
 *  - every live tier, fine pointers only: a faint accent grid revealed in a soft radius around the
 *    pointer's hit on the floor. Off under reduced motion / static loop / ?freeze.
 */
export function ServerFloor() {
  const tier = useWorld((s) => s.tier);
  const reflect = tier === "high";
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;

  const rt = useMemo(() => {
    if (!reflect) return null;
    const halfOk = gl.extensions.has("EXT_color_buffer_float") || gl.extensions.has("EXT_color_buffer_half_float");
    const t = new WebGLRenderTarget(RES, RES, {
      type: halfOk ? HalfFloatType : UnsignedByteType,
      minFilter: LinearMipmapLinearFilter,
      magFilter: LinearFilter,
      generateMipmaps: true,
      depthBuffer: true,
    });
    return t;
  }, [reflect, gl]);
  const { material, uniforms } = useMemo(() => makeFloorMaterial(reflect, rt?.texture ?? null), [reflect, rt]);
  useEffect(() => () => {
    material.dispose();
    rt?.dispose();
  }, [material, rt]);

  const floor = useRef<Mesh>(null);
  const st = useMemo(
    () => ({
      fine: false,
      reduced: false,
      env: { v: 0 },
      hit: new Vector2(SERVER.x, SERVER.z),
      lightSync: 0,
      vcam: (() => {
        const c = new PerspectiveCamera();
        c.layers.set(REFL_LAYER);
        return c;
      })(),
      cp: new Vector3(),
      dir: new Vector3(),
      look: new Vector3(),
      up: new Vector3(),
      plane: new Plane(),
      clip: new Vector4(),
      q: new Vector4(),
      clear: new Color(),
    }),
    [],
  );

  useEffect(() => {
    const fine = matchMedia("(pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => {
      st.fine = fine.matches;
      st.reduced = reduced.matches;
    };
    on();
    fine.addEventListener("change", on);
    reduced.addEventListener("change", on);
    return () => {
      fine.removeEventListener("change", on);
      reduced.removeEventListener("change", on);
    };
  }, [st]);

  // priority 0: after CameraRig (-50) has placed the camera, before the composer renders (1)
  useFrame((_, dt) => {
    const mesh = floor.current;
    if (!mesh) return;
    const near = contactNear();
    const y0 = SERVER.y;
    camera.updateMatrixWorld();
    st.cp.setFromMatrixPosition(camera.matrixWorld);

    /* ---- cursor grid ---- */
    const live = near > 0 && st.fine && !st.reduced && !frame.freeze && worldStore.getState().loopMode !== "static";
    let hit = false;
    if (live) {
      st.dir.set(frame.pointer.x, frame.pointer.y, 0.5).unproject(camera).sub(st.cp);
      if (st.dir.y < -1e-4) {
        const k = (y0 - st.cp.y) / st.dir.y;
        if (k > 0 && k < 40) {
          const hx = st.cp.x + st.dir.x * k, hz = st.cp.z + st.dir.z * k;
          hit = Math.hypot(hx - SERVER.x, hz - SERVER.z) < RADIUS;
          if (hit) {
            // snap on first reveal, then trail the pointer slightly
            if (st.env.v < 0.01) st.hit.set(hx, hz);
            else easing.damp2(st.hit, [hx, hz], 0.08, dt);
          }
        }
      }
    }
    if (live || st.env.v > 0) {
      easing.damp(st.env, "v", hit ? near : 0, hit ? 0.25 : 0.4, dt);
      if (st.env.v < 1e-3 && !hit) st.env.v = 0;
    }
    uniforms.uGrid.value = st.env.v * GRID_GAIN;
    uniforms.uCursor.value.set(st.hit.x, st.hit.y, GRID_R);

    /* ---- planar reflection (high tier) ---- */
    const strength = rt && fx.featureLevel > 0 ? near : 0;
    uniforms.uRefl.value = strength * REFL_GAIN;
    if (!rt || strength <= 0 || st.cp.y <= y0 + 0.02) return;

    // lights must match the main pass (three's light-state hash is per scene): keep every light on the layer
    if (st.lightSync-- <= 0) {
      st.lightSync = 60;
      scene.traverse(isLight);
    }

    const { vcam, cp, look, up, plane, clip, q } = st;
    // mirror the camera across y = y0 (proper rotation; the image flip lives in the texture matrix)
    vcam.position.set(cp.x, 2 * y0 - cp.y, cp.z);
    look.set(0, 0, -1).transformDirection(camera.matrixWorld).add(cp);
    look.y = 2 * y0 - look.y;
    up.set(0, 1, 0).transformDirection(camera.matrixWorld);
    up.y = -up.y;
    vcam.up.copy(up);
    vcam.lookAt(look);
    vcam.updateMatrixWorld();
    vcam.projectionMatrix.copy(camera.projectionMatrix);
    uniforms.uReflMat.value
      .set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(vcam.projectionMatrix)
      .multiply(vcam.matrixWorldInverse);
    // oblique near plane on the floor (Lengyel): nothing below the floor reaches the target
    plane.normal.set(0, 1, 0);
    plane.constant = -y0;
    plane.applyMatrix4(vcam.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const e = vcam.projectionMatrix.elements;
    q.set((Math.sign(clip.x) + e[8]!) / e[0]!, (Math.sign(clip.y) + e[9]!) / e[5]!, -1, (1 + e[10]!) / e[14]!);
    clip.multiplyScalar(2 / clip.dot(q));
    e[2] = clip.x;
    e[6] = clip.y;
    e[10] = clip.z + 1;
    e[14] = clip.w;
    vcam.projectionMatrixInverse.copy(vcam.projectionMatrix).invert();

    const prev = gl.getRenderTarget();
    const alpha = gl.getClearAlpha();
    gl.getClearColor(st.clear);
    reflectPass.pxScale = RES / Math.max(1, gl.domElement.height);
    gl.setRenderTarget(rt);
    gl.setClearColor(0x000000, 1);
    gl.clear(true, true, false);
    gl.render(scene, vcam);
    gl.setRenderTarget(prev);
    gl.setClearColor(st.clear, alpha);
    reflectPass.pxScale = 1;
  }, 0);

  return (
    <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <circleGeometry args={[RADIUS, 64]} />
    </mesh>
  );
}
