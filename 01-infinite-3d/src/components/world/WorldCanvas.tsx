"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, advance, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { WebGLRenderTarget, type Camera, type Material, type Mesh, type Scene, type Texture, type WebGLRenderer } from "three";
import { frame, useWorld, wake, worldStore, type Tier } from "./state/world-store";
import { PHONE, TIERS, type LiveTier } from "./quality";
import { DUR, EASE, cssEase, fx } from "./theme";
import { installFogChunks } from "./scenes/fog-chunks";
import { Atmosphere } from "./scenes/Atmosphere";
import { SmokeRibbons } from "./scenes/SmokeRibbons";
import { ContactShadows } from "./scenes/ContactShadows";
import { addTick } from "./ticker";
import { CameraRig } from "./path/CameraRig";
import { Post } from "./post/Post";
import { Room } from "./scenes/Room";
import { Devices } from "./scenes/Devices";
import { Portal } from "./scenes/Portal";
import { ServerRoom } from "./scenes/ServerRoom";
import { Sky } from "./scenes/Sky";
import { Gates } from "./scenes/Gate";
import { GlyphRain } from "./scenes/GlyphRain";
import { labelsState } from "./hud/labels-registry";
import { startIntro } from "./intro";
import { isFlying } from "./path/routeFlight";
import { waitForRest } from "./mount-gate";
import { createLadder, createPolicy, decide, sampleFrame, stepClock, takeDpr, type Ladder, type Policy } from "./render-policy";

/** phones: holds heavy main-thread work (compiles, uploads) until no finger is down (mount-gate.ts) */
type Gate = (cb: () => void) => () => void;

/** Hands the camera to the DOM label overlay (kept here so labels-registry stays free of R3F). */
function LabelsBridge() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    labelsState.camera = camera;
    return () => {
      labelsState.camera = null;
    };
  }, [camera]);
  return null;
}

/** a 1x1 target per renderer, bound only while compiling */
const compileTargets = new WeakMap<WebGLRenderer, WebGLRenderTarget>();

/**
 * compileAsync for the program variants frames actually use. Every scene render goes into a render
 * target (the composer's input buffer, or an offscreen pass), and three keys each program on that:
 * tone mapping and the sRGB output transform only apply when drawing straight to the canvas. Called
 * with no target bound, compileAsync built canvas variants that never render, and the real programs
 * linked synchronously the first time each object came into view (the glass flight, for the devices).
 */
function compileForTargets(gl: WebGLRenderer, scene: Scene, camera: Camera) {
  uploadTextures(gl, scene);
  let rt = compileTargets.get(gl);
  if (!rt) compileTargets.set(gl, (rt = new WebGLRenderTarget(1, 1)));
  const prev = gl.getRenderTarget();
  gl.setRenderTarget(rt);
  try {
    // program parameters are read synchronously here; only the readiness polling is async
    return gl.compileAsync(scene, camera);
  } finally {
    gl.setRenderTarget(prev);
  }
}

/**
 * Upload every texture a material in the scene references (maps and ShaderMaterial uniforms). three
 * uploads lazily on first draw, and compileAsync doesn't touch textures, so the project devices'
 * nine 1K maps otherwise uploaded (and mipmapped) the frame they first came into view. Already
 * uploaded textures only rebind, so repeating this at idle time is cheap.
 */
function uploadTextures(gl: WebGLRenderer, scene: Scene) {
  const seen = new Set<Texture>();
  const take = (v: unknown) => {
    if (v && (v as Texture).isTexture && !seen.has(v as Texture)) seen.add(v as Texture);
  };
  scene.traverse((o) => {
    const m = (o as Mesh).material as Material | Material[] | undefined;
    if (!m) return;
    for (const mat of Array.isArray(m) ? m : [m]) {
      for (const v of Object.values(mat)) take(v);
      const u = (mat as Material & { uniforms?: Record<string, { value: unknown }> }).uniforms;
      if (u) for (const k in u) take(u[k]?.value);
    }
  });
  for (const t of seen) {
    const img = t.image as { complete?: boolean } | null;
    // render-target textures have nothing to upload; a still-loading image uploads when it arrives
    if (!img || (t as Texture & { isRenderTargetTexture?: boolean }).isRenderTargetTexture || img.complete === false) continue;
    gl.initTexture(t);
  }
}

/** Compile every shader and upload every texture before the first visible frame (phones: at rest). */
function Warmup({ onReady, gate }: { onReady: () => void; gate?: Gate }) {
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene), camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    let safety = 0;
    const run = () => {
      safety = window.setTimeout(() => alive && onReady(), 8000);
      compileForTargets(gl, scene, camera).finally(() => {
        if (alive) {
          window.clearTimeout(safety);
          onReady();
        }
      });
    };
    const offGate = gate ? gate(run) : (run(), undefined);
    return () => {
      alive = false;
      offGate?.();
      window.clearTimeout(safety);
    };
  }, [gl, scene, camera, onReady, gate]);
  return null;
}

/** After world-ready, compile anything that mounted lazily (async assets, late shapes) in idle time (phones: at rest). */
function IdleCompile({ gate }: { gate?: Gate }) {
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene), camera = useThree((s) => s.camera);
  useEffect(() => {
    let offGate: (() => void) | undefined;
    const compile = () => void compileForTargets(gl, scene, camera).catch(() => {});
    const run = gate ? () => void (offGate = gate(compile)) : compile;
    if (typeof requestIdleCallback !== "function") {
      const id = setTimeout(run, 1500);
      return () => {
        clearTimeout(id);
        offGate?.();
      };
    }
    const id = requestIdleCallback(run, { timeout: 3000 });
    return () => {
      cancelIdleCallback(id);
      offGate?.();
    };
  }, [gl, scene, camera, gate]);
  return null;
}

/** frames rendered behind the loading screen before it lifts (framebuffers, composer passes, first uploads) */
const WARM_FRAMES = 20;

/**
 * Desktop: behind the loading screen, wait for the assets that arrive after the Suspense boundary
 * (holdLoad: screenshots, orb logos), compile and upload them, then render a few frames, and only
 * then report settled, so nothing the visitor sees still has a compile or upload ahead of it.
 */
function Settle() {
  const gl = useThree((s) => s.gl), scene = useThree((s) => s.scene), camera = useThree((s) => s.camera);
  const warm = useRef(-1);
  useEffect(() => {
    let alive = true;
    const run = () =>
      compileForTargets(gl, scene, camera)
        .catch(() => {})
        .finally(() => {
          if (!alive) return;
          warm.current = 0;
          // Still mode renders dirty frames only
          frame.dirty = Math.max(frame.dirty, WARM_FRAMES + 2);
        });
    if (worldStore.getState().loads <= 0) {
      run();
      return () => void (alive = false);
    }
    const off = worldStore.subscribe((s) => {
      if (s.loads > 0) return;
      off();
      run();
    });
    return () => {
      alive = false;
      off();
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    if (warm.current < 0 || ++warm.current !== WARM_FRAMES) return;
    worldStore.getState().set({ settled: true });
    performance.mark("world-settled");
  });
  return null;
}

/** canvases replaced after a context restore (their forced loss on unmount is not counted) */
const retiredCanvases = new WeakSet<HTMLCanvasElement>();

/** ms of steady fps before a trimmed feature level is restored (hysteresis) */
const RESTORE_MS = 3000;

/**
 * igloo-style adaptive quality. Declines first trim atmosphere (fx.featureLevel 2 → 1 → 0), and only
 * then scale DPR down toward 1; inclines restore DPR first, then the feature level after ~3 s steady.
 */
function AdaptiveQuality({ dprMax, onDpr }: { dprMax: number; onDpr: (dpr: number) => void }) {
  const st = useRef({ dpr: 1, changed: 0 });
  useEffect(() => {
    fx.featureLevel = 2;
  }, []);
  // through the Canvas `dpr` prop, not useThree's setDpr: R3F re-applies the prop on every Canvas render
  const apply = () => onDpr(1 + (dprMax - 1) * st.current.dpr);
  return (
    <PerformanceMonitor
      factor={1}
      step={0.1}
      flipflops={6}
      onDecline={() => {
        // static mode renders only dirty frames: its "fps" says nothing about the GPU
        if (worldStore.getState().loopMode === "static") return;
        const s = st.current;
        s.changed = performance.now();
        if (fx.featureLevel > 0) fx.featureLevel = (fx.featureLevel - 1) as 0 | 1;
        else {
          s.dpr = Math.max(0, s.dpr - 0.25);
          apply();
        }
        frame.dirty = Math.max(frame.dirty, 2);
      }}
      onIncline={() => {
        const s = st.current;
        const now = performance.now();
        if (s.dpr < 1) {
          s.dpr = Math.min(1, s.dpr + 0.25);
          s.changed = now;
          apply();
        } else if (fx.featureLevel < 2 && now - s.changed > RESTORE_MS) {
          fx.featureLevel = (fx.featureLevel + 1) as 1 | 2;
          s.changed = now;
        }
      }}
      onFallback={() => {
        st.current.dpr = 0;
        apply();
      }}
    />
  );
}

export default function WorldCanvas({ tier }: { tier: Exclude<Tier, "static"> }) {
  // written once by WorldRoot at hydration, before the mount: fixed for this canvas
  const phone = useWorld((s) => s.profile) === "phone";
  const cfg = phone ? PHONE : TIERS[tier as LiveTier];
  const loopMode = useWorld((s) => s.loopMode);
  const [ready, setReady] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  // phones start at exactly DPR 1; the ladder (render-policy.ts) steps it up once frames are steady
  const [dpr, setDpr] = useState<number | [number, number]>(phone ? 1 : [1, cfg.dprMax]);
  // phones: a multisampled composer (Post still checks the GPU); off after a context loss or with ?msaa=0
  const [msaa, setMsaa] = useState(() => phone && new URLSearchParams(location.search).get("msaa") !== "0");
  const losses = useRef(0);
  const glRef = useRef<WebGLRenderer | null>(null);
  const policy = useRef<Policy | null>(null);
  const ladder = useRef<Ladder | null>(null);
  const onReady = useCallback(() => {
    setReady(true);
    frame.dirty = 3;
    worldStore.getState().set({ webglReady: true });
    performance.mark("world-ready");
    // desktop: the intro waits for the loading screen to lift (hud/IntroLoader.tsx)
    if (phone) startIntro();
  }, [phone]);

  // One rAF for everything: Lenis (-10), driver (-5), R3F here at 0.
  useEffect(() => {
    if (phone) return;
    return addTick((time) => {
      if (!ready || document.hidden) return;
      if (loopMode === "static") {
        // reduced motion: render only when something changed
        if (Math.abs(frame.velocityPx) > 0.01) frame.dirty = Math.max(frame.dirty, 2);
        if (frame.dirty <= 0) return;
        frame.dirty--;
      }
      // R3F (frameloop="never") treats this timestamp as its clock: it must be in seconds
      advance(time / 1000);
    }, 0);
  }, [ready, loopMode, phone]);

  // Phones: the render policy (render-policy.ts) instead of a frame every rAF. 60 fps in motion,
  // 30 fps ambient for DUR.ambient, then the last frame is held; frozen while the Index sheet is
  // open, the tab is hidden or the context is lost. Advanced on a virtual clock (no dt spikes).
  // Still / reduced motion keep the dirty-frame path. The quality ladder samples motion frames and
  // applies DPR steps only as the policy settles (a resize reallocates every render target).
  useEffect(() => {
    if (!phone) return;
    const p = (policy.current ??= createPolicy(DUR.ambient));
    const l = (ladder.current ??= createLadder(PHONE.dprLadder, window.devicePixelRatio || 1));
    fx.featureLevel = l.featureLevel;
    let frozen = false;
    // the first frame is ready before the finger moves
    const onTouch = () => wake(300);
    addEventListener("touchstart", onTouch, { passive: true });
    const off = addTick((time) => {
      if (!ready) return;
      const gl = glRef.current;
      if (document.hidden || worldStore.getState().sheet === "menu" || !gl || gl.getContext().isContextLost()) {
        frozen = true;
        return;
      }
      if (frozen) {
        // back from the sheet / a hidden tab: repaint for a moment (a resize may have landed meanwhile)
        frozen = false;
        wake(300);
      }
      if (loopMode === "static") {
        if (Math.abs(frame.velocityPx) > 0.01) frame.dirty = Math.max(frame.dirty, 2);
        if (frame.dirty <= 0) return;
        frame.dirty--;
        advance(stepClock(p, time) / 1000);
        return;
      }
      const d = decide(p, time, {
        velocityPx: frame.velocityPx,
        wakeUntil: frame.wakeUntil,
        cutUntil: frame.cutUntil,
        frost: fx.frost,
        impulse: fx.impulse,
        develop: fx.develop,
        flying: isFlying(),
        dirty: frame.dirty,
        pointerLive: frame.pointerLive,
      });
      if (d.entered === "ambient" || d.entered === "held") {
        const next = takeDpr(l);
        if (next !== null) {
          setDpr(next);
          // the resize clears the drawing buffer: paint the next frames instead of skipping them
          frame.dirty = Math.max(frame.dirty, 2);
        }
      }
      if (!d.render) return;
      if (frame.dirty > 0) frame.dirty--;
      if (d.motionFrameMs > 0 && sampleFrame(l, d.motionFrameMs, time)) {
        fx.featureLevel = l.featureLevel;
        p.locked = l.locked;
      }
      advance(d.vt / 1000);
    }, 0);
    return () => {
      off();
      removeEventListener("touchstart", onTouch);
    };
  }, [ready, loopMode, phone]);

  useEffect(() => {
    // phones: OrbStage's press-and-hold is the only writer of frame.pointer
    if (phone) return;
    const onMove = (e: PointerEvent) => {
      frame.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      frame.pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => removeEventListener("pointermove", onMove);
  }, [phone]);

  return (
    <Canvas
      key={canvasKey}
      frameloop="never"
      dpr={dpr}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: tier === "high" ? "high-performance" : "default" }}
      camera={{ fov: 38, near: 0.1, far: 160, position: [3.6, 1.9, 4.2] }}
      style={{ opacity: ready ? 1 : 0, transition: `opacity ${DUR.veil}ms ${cssEase(EASE.hard)}` }}
      onCreated={({ gl, scene }) => {
        // before any program compiles: the fog chunks are baked into every built-in shader
        installFogChunks();
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
        gl.setClearColor("#0a0b10");
        scene.background = null;
        glRef.current = gl;
        const c = gl.domElement;
        c.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          // phones: R3F's unmount of the canvas replaced below forces its context loss; not a real one
          if (phone && retiredCanvases.has(c)) return;
          losses.current += 1;
          worldStore.getState().set(losses.current >= 2 ? { webglReady: false, tier: "static" } : { webglReady: false });
          // phones: no world is coming back, so the Dock's mount shimmer stops
          if (phone && losses.current >= 2) worldStore.getState().set({ mounting: false });
        });
        c.addEventListener("webglcontextrestored", () => {
          setReady(false);
          setDpr(phone ? 1 : [1, cfg.dprMax]);
          if (phone) {
            // silent remount: no MSAA, back at the bottom of the DPR ladder
            retiredCanvases.add(c);
            setMsaa(false);
            if (ladder.current) ladder.current.idx = ladder.current.applied = 0;
          }
          setCanvasKey((k) => k + 1);
        });
      }}
    >
      {/* mood-driven fog, backdrop, clear colour and fill lights (MoodDriver, useFrame -40) */}
      <Atmosphere fogNoise={cfg.fogNoise} />
      <Suspense fallback={null}>
        <Room dust={cfg.dust} shafts={cfg.shafts} />
        <ContactShadows />
        {cfg.smoke > 0 && <SmokeRibbons count={cfg.smoke} />}
        <Devices bokeh={cfg.bokeh} />
        <Portal />
        <ServerRoom orbs={cfg.orbs} />
        <Gates />
        <GlyphRain count={phone ? PHONE.glyphs : tier === "low" ? 250 : 700} />
        <Sky count={cfg.stars} />
        <Warmup onReady={onReady} gate={phone ? waitForRest : undefined} />
        {ready && <IdleCompile gate={phone ? waitForRest : undefined} />}
        {ready && !phone && <Settle />}
      </Suspense>
      {/* phones: the render-policy ladder instead (PerformanceMonitor would read the 30 fps ambient as a decline) */}
      {!phone && <AdaptiveQuality dprMax={cfg.dprMax} onDpr={setDpr} />}
      <LabelsBridge />
      <CameraRig />
      <Post bloom={cfg.bloom} levels={cfg.bloomLevels} msaa={msaa} />
    </Canvas>
  );
}
