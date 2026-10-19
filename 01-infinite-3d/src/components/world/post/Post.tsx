"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { frame, isCalm, useWorld, worldStore } from "../state/world-store";
import { PHONE, TIERS } from "../quality";
import { DUR, EASE, bezier, fx } from "../theme";
import { GlitchCutEffect } from "./GlitchCutEffect";
import { GradeEffect } from "./GradeEffect";
import { IceCutRender } from "./IceCutRender";
import { MonitorDive } from "./MonitorDive";
import { diveAllowed } from "../scenes/dive";

const inOut = bezier(EASE.inOut);
const quartOut = bezier(EASE.quartOut);
/** share of DUR.frost spent frosting over (the rest un-frosts after navigation) */
const RISE = 0.4;
/** give up waiting for the navigation after this long (cancelled / failed navigation) */
const NAV_WAIT_MS = 1200;
/** reduced motion: a plain fade instead of the frost */
const CALM_MS = 150;
/** phones: a short frost (the route itself is the transition there) */
const PHONE_FROST_MS = 400;

const isProjectPage = (path: string) => /^\/projects\/[^/]+\/?$/.test(path);

type Phase = "idle" | "rise" | "wait" | "fall";

/**
 * Enter-project frost: clicking a link into (or out of) a /projects/[slug] page, or the browser's
 * back / forward across one, frosts the frame over (EASE.inOut); once the route has changed it
 * un-frosts (EASE.quartOut). The envelope is written to fx.frost; GlitchCut draws it. Keyboard
 * activation of a link dispatches the same click. Nothing plays on first load.
 */
function useRouteFrost(effect: GlitchCutEffect) {
  const env = useRef({ phase: "idle" as Phase, t0: 0, from: 0, navigated: false, path: "" });

  useEffect(() => {
    const e = env.current;
    e.path = location.pathname;
    const start = () => {
      if (e.phase === "rise" || e.phase === "wait") return;
      e.from = fx.frost;
      e.phase = "rise";
      e.t0 = performance.now();
      e.navigated = false;
      frame.dirty = Math.max(frame.dirty, 3);
    };
    const onNavigated = () => {
      if (e.phase === "idle") start();
      e.navigated = true;
      frame.dirty = Math.max(frame.dirty, 3);
    };
    const onClick = (ev: MouseEvent) => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (isProjectPage(url.pathname) || isProjectPage(location.pathname)) start();
    };
    const onPop = () => {
      // location already shows the destination; e.path is still where we came from
      if (location.pathname !== e.path && (isProjectPage(location.pathname) || isProjectPage(e.path))) start();
    };
    document.addEventListener("click", onClick, true);
    addEventListener("popstate", onPop);
    // the route has landed: WorldRoot mirrors the pathname into the store (route / isHome)
    const unsub = worldStore.subscribe((s, prev) => {
      if (s.route === prev.route && s.isHome === prev.isHome) return;
      const was = !prev.isHome && prev.route === "projects";
      const is = !s.isHome && s.route === "projects";
      if (was || is) onNavigated();
    });
    return () => {
      document.removeEventListener("click", onClick, true);
      removeEventListener("popstate", onPop);
      unsub();
    };
  }, []);

  useFrame(() => {
    const e = env.current;
    // project -> project keeps route / isHome: catch the pathname change here instead
    const path = location.pathname;
    if (path !== e.path) {
      const hop = isProjectPage(path) && isProjectPage(e.path);
      e.path = path;
      if (hop && e.phase !== "idle") e.navigated = true;
    }
    if (e.phase === "idle") return;
    const calm = isCalm();
    const total = calm ? CALM_MS : worldStore.getState().profile === "phone" ? PHONE_FROST_MS : DUR.frost;
    const rise = total * RISE, fall = total - rise;
    const now = performance.now();
    let v = 0, p = 0;
    if (e.phase === "rise") {
      const k = Math.min(1, (now - e.t0) / rise);
      v = e.from + (1 - e.from) * inOut(k);
      p = RISE * k;
      if (k >= 1) {
        e.phase = "wait";
        e.t0 = now;
      }
    } else if (e.phase === "wait") {
      v = 1;
      p = RISE;
      if (e.navigated || now - e.t0 > NAV_WAIT_MS) {
        e.phase = "fall";
        e.t0 = now;
      }
    } else {
      const k = Math.min(1, (now - e.t0) / fall);
      v = 1 - quartOut(k);
      p = RISE + (1 - RISE) * k;
      if (k >= 1) {
        e.phase = "idle";
        v = 0;
      }
    }
    fx.frost = v;
    effect.setRouteFrost(v, p);
    frame.dirty = Math.max(frame.dirty, 2); // static mode renders on demand
  });
}

function Effects({ bloom, levels, iceCut, monitorDive, samples }: { bloom: boolean; levels: number; iceCut: boolean; monitorDive: boolean; samples: number }) {
  const glitch = useMemo(() => new GlitchCutEffect(), []);
  const grade = useMemo(() => new GradeEffect(), []);
  const bloomRef = useRef<BloomEffect>(null);
  useEffect(
    () => () => {
      glitch.dispose();
      grade.dispose();
    },
    [glitch, grade],
  );
  useRouteFrost(glitch);
  // bloom threshold follows the mood (lower in the portal, higher in the warm room)
  useFrame(() => {
    const b = bloomRef.current;
    if (b) b.luminanceMaterial.threshold = fx.mood.bloomThreshold;
  });
  // GlitchCut first: it replaces the frame with displaced inputBuffer samples, so bloom (added after)
  // survives fast scrolls; Grade last colours everything. All three merge into ONE EffectPass.
  return (
    <>
      {monitorDive ? <MonitorDive /> : iceCut ? <IceCutRender effect={glitch} /> : null}
      <EffectComposer multisampling={samples} enableNormalPass={false}>
        <primitive object={glitch} dispose={null} />
        {bloom ? <Bloom ref={bloomRef} mipmapBlur levels={levels} luminanceThreshold={0.55} luminanceSmoothing={0.2} intensity={0.9} radius={0.7} /> : <></>}
        <primitive object={grade} dispose={null} />
      </EffectComposer>
    </>
  );
}

/**
 * msaa (phones, first context only, not ?msaa=0): PHONE.msaa (quality.ts, 4) samples on the composer's input buffer,
 * but only when the GPU can multisample the HalfFloat target the Grade's HDR input needs. Otherwise
 * 0 samples (the DPR ladder is the only AA), exactly as on desktop.
 */
export function Post({ bloom, levels, msaa = false }: { bloom: boolean; levels: number; msaa?: boolean }) {
  const gl = useThree((s) => s.gl);
  const samples = useMemo(
    () =>
      msaa && PHONE.msaa > 0 && gl.capabilities.maxSamples >= PHONE.msaa && (gl.extensions.has("EXT_color_buffer_float") || gl.extensions.has("EXT_color_buffer_half_float"))
        ? PHONE.msaa
        : 0,
    [msaa, gl],
  );
  const tier = useWorld((s) => s.tier);
  const phone = useWorld((s) => s.profile) === "phone";
  // about -> projects on high: the composite monitor dive reads as "entering the monitor", which the
  // ice cut (a diagonal wipe to the next pose) can't; both cost one extra scene render, so the dive
  // replaces it there. The ice cut stays for any tier whose TIERS flag enables it without the dive
  // (today: high with ?dive=0). Medium / low keep the single-frame frost. Phones (PHONE.iceCut is
  // false) never run either, whatever ?q= forces.
  const monitorDive = !phone && tier === "high" && diveAllowed();
  const iceCut = !phone && tier !== "static" && TIERS[tier].iceCut && !monitorDive;
  return <Effects bloom={bloom} levels={levels} iceCut={iceCut} monitorDive={monitorDive} samples={samples} />;
}
