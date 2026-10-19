"use client";

import { useRef } from "react";
import { Eye } from "@/components/art/Eye";
import { EYE_PIVOT, EYE_VIEWBOX } from "@/components/art/eye-geometry";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

type Layer = "front" | "mid" | "back";

interface EyeSpec {
  /** centre, % of the stage */
  x: number;
  y: number;
  /** width in vmax */
  s: number;
  layer: Layer;
  seed: number;
  rot?: number;
  /** pops in late (scale 0.85 → 1), like the right-side arrivals in the edit */
  late?: boolean;
  /** hidden on narrow screens to keep the phone composition from clogging */
  wideOnly?: boolean;
  /** lines only (pencil under-drawing): the huge dim eye */
  ghost?: boolean;
}

// Composition after reference/frames/t_01.00.jpg: bright eyes scattered left/top, one huge dim eye in the
// middle, blurred far eyes at the edges, late arrivals on the right.
const EYES: EyeSpec[] = [
  // front: full brightness + bloom
  { x: 14, y: 33, s: 12, layer: "front", seed: 1, rot: -4 },
  { x: 44, y: 26, s: 14.5, layer: "front", seed: 2, rot: 2 },
  { x: 71, y: 33, s: 9.5, layer: "front", seed: 3, rot: -2 },
  { x: 9, y: 71, s: 15, layer: "front", seed: 4, rot: 3 },
  { x: 4, y: 86, s: 12, layer: "front", seed: 5, rot: -3, wideOnly: true },
  { x: 46, y: 75, s: 11, layer: "front", seed: 6, rot: 4 },
  { x: 84, y: 22, s: 7.5, layer: "front", seed: 7, rot: -6, late: true },
  { x: 66, y: 60, s: 8.5, layer: "front", seed: 8, rot: 5, late: true },
  { x: 90, y: 78, s: 10, layer: "front", seed: 9, rot: -2, late: true, wideOnly: true },
  // mid: ~30%, includes the one huge dim eye
  { x: 44, y: 58, s: 32, layer: "mid", seed: 10, rot: 0, ghost: true },
  { x: 47, y: 38, s: 10, layer: "mid", seed: 11, rot: 6 },
  { x: 78, y: 45, s: 9, layer: "mid", seed: 12, rot: -5 },
  { x: 24, y: 52, s: 8, layer: "mid", seed: 13, rot: 8, wideOnly: true },
  // back: dim and blurred, bleeding off the edges
  { x: 37, y: 5, s: 26, layer: "back", seed: 14, rot: -6, ghost: true },
  { x: 91, y: 14, s: 16, layer: "back", seed: 15, rot: 4 },
  { x: 62, y: 92, s: 20, layer: "back", seed: 16, rot: 3, ghost: true },
  { x: 4, y: 14, s: 14, layer: "back", seed: 17, rot: -8, wideOnly: true },
  { x: 97, y: 58, s: 18, layer: "back", seed: 18, rot: 10 },
];

const LAYERS: { id: Layer; opacity: number; blur: number; parallax: number }[] = [
  { id: "back", opacity: 0.22, blur: 3.5, parallax: 0.3 },
  { id: "mid", opacity: 0.32, blur: 0.6, parallax: 0.6 },
  { id: "front", opacity: 1, blur: 0, parallax: 1 },
];

const ASPECT = EYE_VIEWBOX.h / EYE_VIEWBOX.w;
/** max iris travel, viewBox units */
const IRIS_MAX = 13;

/**
 * Chapter 1 — INTRO. A swarm of glowing spiral-iris eyes on black in three depth layers. Staggered fade-in
 * on load, slow drift and push-in, random blinks, irises follow the cursor (fine pointers) or glance
 * around on their own (touch, or when the pointer rests). Pinned for exactly its own height: parallax
 * 1 : 0.6 : 0.3, then the defocus-out inside the pin; the title section overlaps the pin's end
 * (`.title-overlap`), so the defocus hands straight over to the title.
 */
export function Intro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const visible = (e: Element) => (e as HTMLElement).offsetParent !== null;
        const eyes = q<HTMLElement>("[data-eye]").filter(visible);
        const byLayer = (l: Layer) => eyes.filter((e) => e.dataset.layer === l && !("late" in e.dataset));
        const giant = eyes.find((e) => e.dataset.seed === "10");

        // entrance: the faint giant eye first, then bright eyes, then the dim tiers, then late pop-ins
        const intro = gsap.timeline({ delay: 0.25 });
        if (giant) intro.to(giant, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0);
        intro.to(byLayer("front"), { opacity: 1, duration: 0.42, ease: "power2.out", stagger: 0.11 }, 0.3);
        intro.to(byLayer("mid").filter((e) => e !== giant), { opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.1 }, 0.55);
        intro.to(byLayer("back"), { opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.12 }, 0.6);
        intro.fromTo(
          eyes.filter((e) => "late" in e.dataset),
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.4)", stagger: 0.17 },
          1.05,
        );
        intro.to(q(".intro-hint"), { opacity: 1, duration: 0.5, ease: "power1.out" }, 1.7);

        // idle: each eye drifts on its own slow loop; each layer pushes in very slowly
        q<HTMLElement>("[data-drift]").forEach((d) => {
          gsap.to(d, {
            x: gsap.utils.random(-14, 14),
            y: gsap.utils.random(-10, 10),
            rotation: gsap.utils.random(-2, 2),
            duration: gsap.utils.random(4, 8),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: gsap.utils.random(0, 2),
          });
        });
        q<HTMLElement>("[data-layer-wrap]").forEach((layer, i) => {
          gsap.fromTo(layer, { scale: 1 }, { scale: 1.035, duration: 9 + i * 2, ease: "sine.inOut", yoyo: true, repeat: -1 });
        });

        // blinks: lids snap shut (70 ms) and reopen (130 ms) every 2.5–7 s, sometimes twice
        const blinkCalls = new Map<HTMLElement, gsap.core.Tween>();
        const blink = (b: HTMLElement) =>
          gsap
            .timeline()
            .to(b, { scaleY: 0.06, duration: 0.07, ease: "power2.in" })
            .to(b, { scaleY: 1, duration: 0.13, ease: "power2.out" }, "+=0.04");
        const scheduleBlink = (b: HTMLElement, first = false) => {
          blinkCalls.set(
            b,
            gsap.delayedCall(first ? gsap.utils.random(2, 5) : gsap.utils.random(2.5, 7), () => {
              blink(b);
              if (Math.random() < 0.18) gsap.delayedCall(0.3, () => blink(b));
              scheduleBlink(b);
            }),
          );
        };
        eyes
          .filter((e) => e.dataset.layer !== "back" && !("ghost" in e.dataset))
          .forEach((e) => {
            const b = e.querySelector<HTMLElement>("[data-blink]");
            if (b) scheduleBlink(b, true);
          });

        // pinned for exactly the section's height (the title's -100svh overlap depends on it):
        // tiers rise at 1 : 0.6 : 0.3, the hint goes first, then the defocus-out (blur rises, the bright
        // tier dims first, then everything fades to black) ends just as the pin releases.
        const pin = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${el.offsetHeight}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        pin.to(q(".intro-hint"), { opacity: 0, duration: 0.08, ease: "none" }, 0);
        LAYERS.forEach(({ id, parallax }) => {
          pin.to(q(`[data-parallax="${id}"]`), { y: () => -window.innerHeight * 0.3 * parallax, ease: "none", duration: 1 }, 0);
        });
        pin
          .to(q('[data-parallax="front"]'), { opacity: 0.35, duration: 0.22, ease: "power2.in" }, 0.5)
          .fromTo(q("[data-stage]"), { filter: "blur(0px)" }, { filter: "blur(12px)", duration: 0.35, ease: "power2.in" }, 0.5)
          .to(q("[data-stage]"), { opacity: 0, duration: 0.2, ease: "power2.in" }, 0.8);

        return () => {
          blinkCalls.forEach((c) => c.kill());
          blinkCalls.clear();
        };
      });

      // irises: follow the cursor on fine pointers; otherwise (touch, or a resting pointer) glance around
      // together every couple of seconds. The offset is rotated into each eye's own frame (static tilt +
      // the current drift rotation) so "look left" means left on screen.
      mm.add({ motion: MQ.motion, fine: MQ.finePointer }, (ctx) => {
        const { motion, fine } = ctx.conditions as { motion: boolean; fine: boolean };
        if (!motion) return;
        const eyes = q<HTMLElement>("[data-eye]").filter((e) => e.dataset.layer !== "back");
        const svgs = eyes.map((e) => e.querySelector("svg")!);
        const drifts = eyes.map((e) => e.querySelector<HTMLElement>("[data-drift]")!);
        const tilt = eyes.map((e) => Number(e.dataset.rot ?? 0));
        const irises = eyes.map((e) => e.querySelector<SVGGElement>("[data-iris]")!);
        const qx = irises.map((i) => gsap.quickTo(i, "x", { duration: 0.45, ease: "power3.out" }));
        const qy = irises.map((i) => gsap.quickTo(i, "y", { duration: 0.45, ease: "power3.out" }));

        /** screen-space look vector (viewBox units) → the eye's local frame */
        const look = (i: number, sx: number, sy: number) => {
          const a = (-(tilt[i] + Number(gsap.getProperty(drifts[i], "rotation"))) * Math.PI) / 180;
          const c = Math.cos(a), s = Math.sin(a);
          qx[i](sx * c - sy * s);
          qy[i](sx * s + sy * c);
        };

        let px = 0;
        let py = 0;
        let lastMove = -1e9;
        let dirty = false;
        let glanceCall: gsap.core.Tween | null = null;

        const glance = () => {
          const idle = !fine || performance.now() - lastMove > 3500;
          if (idle) {
            const home = Math.random() < 0.25;
            const ang = Math.random() * Math.PI * 2;
            const mag = home ? 0 : IRIS_MAX * gsap.utils.random(0.55, 1);
            eyes.forEach((_, i) => {
              const jitter = gsap.utils.random(-0.25, 0.25);
              look(i, Math.cos(ang + jitter) * mag, Math.sin(ang + jitter) * mag * 0.7);
            });
          }
          glanceCall = gsap.delayedCall(gsap.utils.random(1.4, 3.4), glance);
        };
        glanceCall = gsap.delayedCall(1.6, glance);

        if (!fine) return () => glanceCall?.kill();

        const onMove = (e: PointerEvent) => {
          px = e.clientX;
          py = e.clientY;
          lastMove = performance.now();
          dirty = true;
        };
        const onScroll = () => {
          dirty = performance.now() - lastMove < 3500;
        };
        // reads every rect first, then writes, once per frame at most
        const tick = () => {
          if (!dirty) return;
          dirty = false;
          const rects = svgs.map((s) => s.getBoundingClientRect());
          rects.forEach((r, i) => {
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            const dx = px - (r.left + r.width / 2);
            const dy = py - (r.top + r.height / 2);
            const d = Math.hypot(dx, dy) || 1;
            const k = (IRIS_MAX * d) / (d + 220);
            look(i, (dx / d) * k, (dy / d) * k * 0.7);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        gsap.ticker.add(tick);
        return () => {
          glanceCall?.kill();
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("scroll", onScroll);
          gsap.ticker.remove(tick);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      id="intro"
      ref={root}
      aria-label="Intro"
      className="relative h-svh w-full overflow-hidden"
      style={{ background: "var(--ink-0)" }}
    >
      <div data-stage className="absolute inset-0 will-change-[filter,opacity]">
        {LAYERS.map(({ id, opacity, blur }) => (
          <div key={id} data-parallax={id} className="absolute inset-0">
            <div
              data-layer-wrap
              className="absolute inset-0"
              style={{ opacity, filter: blur ? `blur(${blur}px)` : undefined }}
            >
              {EYES.filter((e) => e.layer === id).map((e) => (
                <div
                  key={e.seed}
                  data-eye
                  data-layer={e.layer}
                  data-seed={e.seed}
                  data-rot={e.rot ?? 0}
                  {...(e.late ? { "data-late": "" } : {})}
                  {...(e.ghost ? { "data-ghost": "" } : {})}
                  className={`intro-eye absolute ${e.wideOnly ? "max-md:hidden" : ""}`}
                  style={{
                    left: `calc(${e.x}% - ${e.s / 2}vmax)`,
                    top: `calc(${e.y}% - ${(e.s * ASPECT) / 2}vmax)`,
                    width: `${e.s}vmax`,
                  }}
                >
                  {/* the light pool around a bright eye (static, so it costs nothing per frame) */}
                  {e.layer === "front" ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute"
                      style={{
                        inset: "-55% -30%",
                        background:
                          "radial-gradient(closest-side, rgba(240,240,240,0.12), rgba(240,240,240,0.04) 55%, transparent)",
                      }}
                    />
                  ) : null}
                  <div data-drift>
                    <div
                      data-blink
                      style={{ transformOrigin: `${EYE_PIVOT.x * 100}% ${EYE_PIVOT.y * 100}%` }}
                    >
                      <Eye
                        seed={e.seed}
                        glow={e.layer === "front"}
                        variant={e.ghost ? "ghost" : "solid"}
                        className="block h-auto w-full"
                        style={{ transform: e.rot ? `rotate(${e.rot}deg)` : undefined }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="intro-hint caption pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ bottom: "calc(var(--gutter) * 1.5)" }}
        aria-hidden
      >
        <span>SCROLL</span>
        <span className="block h-8 w-px" style={{ background: "linear-gradient(var(--paper-0), transparent)" }} />
      </div>
    </section>
  );
}
