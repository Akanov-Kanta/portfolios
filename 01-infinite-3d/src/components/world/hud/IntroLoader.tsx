"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { frame, useWorld, worldStore } from "../state/world-store";
import { DUR, EASE, bezier } from "../theme";
import { emitSfx } from "../sfx-bus";
import { addTick } from "../ticker";
import { alphaAt, glyphAt, resolveAt } from "./Scramble";
import { triggerShock } from "../post/shock";
import { clamp01 } from "../math";
import { isPhone, usePhone } from "../phone";
import { startIntro } from "../intro";
import { lenisRef } from "../scroll/lenis-ref";

const FRAMES = ["---===+++===---", "--===+++===----", "-===+++===-----", "===+++===------", "==+++===------=", "=+++===------==", "+++===------===", "++===------===+", "+===------===++", "===------===+++", "==------===+++=", "=------===+++==", "------===+++===", "-----===+++===-", "----===+++===--"];
const sineOut = bezier(EASE.sineOut);

interface NameBox {
  style: CSSProperties;
  words: string[];
}

const quiet = () => matchMedia("(prefers-reduced-motion: reduce)").matches || worldStore.getState().tier === "static";

/** Overlay copy of the real H1: same box, same type, so the letters land exactly on it. */
function measureName(): NameBox | null {
  const h1 = document.querySelector<HTMLElement>("#hero h1");
  if (!h1) return null;
  const r = h1.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || r.width === 0) return null;
  const cs = getComputedStyle(h1);
  return {
    style: { left: r.left, top: r.top, width: r.width, fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing },
    words: [...h1.children].map((c) => c.textContent ?? ""),
  };
}

/** HUD boot: every [data-boot] module draws its frame, types its label and scrambles its value. */
function runBoot() {
  if (quiet()) return;
  const html = document.documentElement;
  const n = document.querySelectorAll("[data-hud] [data-boot]").length;
  html.dataset.boot = "run";
  window.dispatchEvent(new Event("hud:boot"));
  for (let i = 0; i < n; i++) window.setTimeout(() => emitSfx("boot", { gain: 0.6 }), i * DUR.bootStep);
  window.setTimeout(() => (html.dataset.boot = "done"), DUR.boot + n * DUR.bootStep + 200);
}

/** the loading screen never holds the page longer than this after navigation start (slow network, hidden tab) */
const MAX_WAIT = 20000;

type Step = "page" | "world" | "assets" | "warm";
const STEP_LABEL: Record<Step, string> = { page: "LOADING PAGE", world: "LOADING WORLD", assets: "LOADING ASSETS", warm: "WARMING UP" };

/** document `load` (styles, images, scripts) and the fonts */
function pageLoaded(): Promise<unknown> {
  const load = new Promise<void>((resolve) => {
    if (document.readyState === "complete") resolve();
    else addEventListener("load", () => resolve(), { once: true });
  });
  return Promise.all([load, document.fonts?.ready]);
}

/** Lift the loading screen: unlock the page (the intro, if it plays, locks it again at once). */
function reveal() {
  const s = worldStore.getState();
  if (s.revealed || isPhone()) return;
  s.set({ revealed: true });
  delete document.documentElement.dataset.loading;
  lenisRef.current?.start();
  performance.mark("page-revealed");
}

/**
 * igloo-style loader. 1) A loading screen from the first paint until the whole page is in: the
 * document and its fonts, the world's models and shaders, the assets that arrive after them
 * (holdLoad) and a few warm-up frames (WorldCanvas Settle), so nothing loads or compiles in view
 * afterwards. Scroll is locked meanwhile (html[data-loading], Lenis stopped). 2) While the intro plays,
 * an aria-hidden copy of the name sits over the real H1 (which is hidden by the existing intro rule),
 * its letters cycling glyphs and resolving left to right with the camera's landing; as the intro ends
 * it cross-fades onto the real H1 (opacity only, DUR.veil, --ease-hard), and one shockwave ring
 * leaves the H1's position across the canvas (post/shock.ts, drawn by GlitchCut). 3) Then the HUD boots.
 * Reduced motion, the static tier and no-WebGL never enter the intro (their loading screen waits
 * for the page only), so the name overlay doesn't run there; the H1 itself is never touched.
 * Phones have no loader and no intro (the world arrives at rest and develops): the overlay is
 * display:none from first paint (phone:hidden) and the whole loader unmounts after hydration.
 */
export function IntroLoader() {
  // a wrapper, so the loader's own hooks always run in the same order
  const phone = usePhone();
  useEffect(() => {
    if (phone) delete document.documentElement.dataset.loading;
  }, [phone]);
  return phone ? null : <Loader />;
}

function Loader() {
  const ready = useWorld((s) => s.webglReady);
  const revealed = useWorld((s) => s.revealed);
  // no world (static tier, WebGL lost or failed): only the page is waited for
  const none = useWorld((s) => s.tier === "static");
  const idle = useWorld((s) => s.loads <= 0);
  const settled = useWorld((s) => s.settled);
  const done = { world: none || ready, assets: none || (ready && idle), warm: none || settled };
  const [page, setPage] = useState(false);
  const [i, setI] = useState(0);
  const [name, setName] = useState<NameBox | null>(null);
  const [out, setOut] = useState(false);
  const nameEl = useRef<HTMLParagraphElement>(null);
  const show = !revealed;
  const steps: [Step, boolean][] = [["page", page], ["world", done.world], ["assets", done.assets], ["warm", done.warm]];
  const step = steps.find(([, ok]) => !ok)?.[0] ?? null;
  const count = steps.filter(([, ok]) => ok).length;

  useEffect(() => {
    let alive = true;
    pageLoaded().then(() => alive && setPage(true));
    const safety = window.setTimeout(reveal, Math.max(0, MAX_WAIT - performance.now()));
    return () => {
      alive = false;
      window.clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (step === null) reveal();
  }, [step]);

  // the intro waits for both the loading screen and the world (a timed-out screen lifts before the world is ready)
  useEffect(() => {
    if (revealed && ready && !isPhone()) startIntro();
  }, [revealed, ready]);

  useEffect(() => {
    if (!show || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % FRAMES.length), 70);
    return () => window.clearInterval(id);
  }, [show]);

  // intro phases -> name overlay + boot
  useEffect(() => {
    let prev = worldStore.getState().intro;
    let timer = 0;
    const onPhase = (phase: typeof prev, was: typeof prev) => {
      if (phase === "playing" && !quiet()) {
        setOut(false);
        setName(measureName());
      }
      if (phase === "done" && was === "playing") {
        // the name lands on the H1: one shockwave ring from it across the canvas (post/shock.ts).
        // Reads the H1's box only; the H1 itself is never touched or waited on.
        const h1 = document.querySelector<HTMLElement>("#hero h1")?.getBoundingClientRect();
        if (h1 && h1.width > 0 && !quiet()) triggerShock(h1.left + h1.width / 2, h1.top + h1.height / 2);
        setOut(true);
        timer = window.setTimeout(() => setName(null), DUR.veil + 60);
        runBoot();
      }
    };
    if (prev === "playing") onPhase("playing", "pending");
    const off = worldStore.subscribe((s) => {
      if (s.intro === prev) return;
      const was = prev;
      prev = s.intro;
      onPhase(s.intro, was);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, []);

  // letters: alpha front early, glyphs resolve left to right as the camera lands (frame.introT)
  useEffect(() => {
    if (!name) return;
    const chars = [...(nameEl.current?.querySelectorAll<HTMLSpanElement>(".sc-c") ?? [])];
    const n = chars.length;
    return addTick((now) => {
      const t = frame.introT;
      const p1 = sineOut(clamp01(t / 0.3));
      const p2 = sineOut(clamp01((t - 0.1) / 0.75));
      for (let k = 0; k < n; k++) {
        const c = chars[k]!;
        const a = alphaAt(p1, k, n);
        c.style.opacity = a >= 1 ? "" : a.toFixed(3);
        if (p2 >= 1 || p2 > resolveAt(k, n)) c.removeAttribute("data-g");
        else c.setAttribute("data-g", glyphAt(k, now));
      }
    }, 12);
  }, [name]);

  return (
    <>
      <div
        id="page-loader"
        className="pointer-events-none fixed inset-0 z-30 grid place-items-center bg-void transition-opacity duration-700 phone:hidden"
        style={{ opacity: show ? 1 : 0 }}
        aria-hidden="true"
      >
        <div className="marker text-center">
          <p className="tracking-[0.3em] text-ink">{FRAMES[i]}</p>
          <p className="marker-muted mt-3">
            {`// ${STEP_LABEL[step ?? "warm"]}`}
            <span className="ml-3 tabular-nums">{`${count}/${steps.length}`}</span>
          </p>
        </div>
      </div>
      {name && (
        <p ref={nameEl} className="intro-name display text-ink" style={name.style} data-out={out ? "" : undefined} aria-hidden="true">
          {name.words.map((w, wi) => (
            <span key={wi} className="block">
              {Array.from(w, (ch, ci) => (
                <span key={ci} className="sc-c" style={{ opacity: 0 }}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </p>
      )}
    </>
  );
}
