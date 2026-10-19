"use client";

import { useRef } from "react";
import { projectBySlug, site, type DossierItem } from "@/content/site";
import { CaseFile } from "@/components/art/CaseFile";
import { Eye } from "@/components/art/Eye";
import { InkBurst } from "@/components/art/InkBurst";
import { PhotoPlaceholder } from "@/components/art/PhotoPlaceholder";
import { StackPanel } from "@/components/art/StackPanel";
import { Strip, type StripZone } from "@/components/art/Strip";
import { shake, stripGlitch } from "@/components/art/strip-fx";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";
import { sfx } from "@/lib/audio";
import { BURST, GIANT_EYE_SEED } from "./stage";

type Slot = "tl" | "br";
type Handle = TypeCaptionHandle & { setProgress?: (p: number) => void };

const STEPS: readonly DossierItem[] = site.dossier;
const N = STEPS.length;
/** share of each step's scroll over which its caption types (when TypeCaption supports scrubbing) */
const TYPE_SPAN = 0.45;

/**
 * Edit grammar (t_05.50 → t_06.50): a caption typing top-left puts the strip in the left zone and keeps
 * the previous bottom-right caption on screen; a caption typing bottom-right puts the strip top-right
 * and clears the top-left. So slots alternate, starting top-left (the drop's caption is bottom-right).
 */
const slotOf = (k: number): Slot => (k % 2 === 0 ? "tl" : "br");
const zoneOf = (k: number): StripZone => (slotOf(k) === "tl" ? "l" : "tr");
const fileNo = (k: number) => `FILE ${String(k + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;

function StripContent({ item, k }: { item: DossierItem; k: number }) {
  if (item.slug) {
    const p = projectBySlug(item.slug);
    if (p) return <CaseFile project={p} index={k + 1} total={N} linked={Boolean(p.url ?? p.repo)} />;
  }
  if (item.label === "THE STACK") return <StackPanel skills={site.skills} />;
  return <PhotoPlaceholder variant={k + 1} />;
}

/**
 * Chapter 4 — DOSSIER. One pinned stage, one step per dossier item. Step changes are hard sets on scroll
 * boundaries: the strip teleports between the two measured zones with a 2-frame slice glitch and swaps
 * content, captions alternate top-left / bottom-right, the burst stays behind as the ground. Project
 * steps make the strip a link (new tab) with an "OPEN FILE →" affordance. Phones: stacked layout.
 * Reduced motion: no pin; every step in order, statically.
 *
 * The wrapper is pulled up by one viewport (motion only) so this pin starts on the exact scroll position
 * where the Drop's pin ends: a hard cut, no scroll-away gap.
 */
export function Dossier() {
  const root = useRef<HTMLElement>(null);
  const handles = useRef<(Handle | null)[]>([]);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const stage = q("[data-stage]")[0];
        const burst = q("[data-burst]")[0];
        const carry = q("[data-carry]")[0];
        const meta = q("[data-meta]")[0];
        const strips = STEPS.map((_, k) => q(`[data-strip="${k}"]`)[0]);
        const caps = STEPS.map((_, k) => q(`[data-cap="${k}"]`)[0]);

        gsap.set(el, { autoAlpha: 0 });
        gsap.set([...strips, ...caps, carry], { autoAlpha: 0 });

        const complete = (h: Handle | null | undefined) => {
          if (!h) return;
          if (h.setProgress) h.setProgress(1);
          else {
            h.play();
            h.timeline()?.progress(1);
          }
        };

        let cur = -1;
        const apply = (k: number, prev: number) => {
          const fwd = k > prev;
          strips.forEach((s, i) => gsap.set(s, { autoAlpha: i === k ? 1 : 0 }));
          if (prev >= 0) stripGlitch(strips[k]);
          const show = new Set([k]);
          if (slotOf(k) === "tl" && k > 0) show.add(k - 1);
          caps.forEach((c, i) => gsap.set(c, { autoAlpha: show.has(i) ? 1 : 0 }));
          gsap.set(carry, { autoAlpha: k === 0 ? 1 : 0 });
          if (k > 0 && show.has(k - 1)) complete(handles.current[k - 1]);

          const h = handles.current[k];
          if (h && !h.setProgress) {
            if (fwd) {
              h.reset();
              h.play();
            } else complete(h);
          }
          meta.textContent = `${fileNo(k)} · ${STEPS[k].label}`;
          if (prev >= 0) {
            sfx.hit(0.45);
            shake(stage, 0.6);
            gsap.fromTo(burst, { scale: 1 }, { scale: 1.04, duration: 0.06, yoyo: true, repeat: 1, ease: "power1.out" });
          }
        };

        // visible only from the moment this pin starts (it overlaps the Drop's pinned last frame)
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "max",
          onToggle: (self) => gsap.set(el, { autoAlpha: self.isActive ? 1 : 0 }),
        });

        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: `+=${N * 100}%`,
          pin: true,
          onUpdate: (self) => {
            const f = self.progress * N;
            const k = Math.min(N - 1, Math.floor(f));
            if (k !== cur) {
              apply(k, cur);
              cur = k;
            }
            const h = handles.current[k];
            h?.setProgress?.(Math.min(1, (f - k) / TYPE_SPAN));
          },
          onLeaveBack: () => {
            cur = -1;
            handles.current.forEach((h) => h?.reset());
          },
        });

        return () => {
          gsap.set(el, { clearProps: "visibility,opacity" });
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div className="ch34-overlap relative" style={{ zIndex: 1 }}>
      <section
        id="dossier"
        ref={root}
        aria-label="Dossier"
        className="relative w-full motion-safe:h-svh motion-safe:overflow-hidden motion-reduce:px-[var(--gutter)] motion-reduce:py-[12vh]"
        style={{ background: "var(--ink-0)" }}
      >
        <div data-stage className="motion-safe:absolute motion-safe:inset-0">
          <div data-burst className="ch34-burst motion-reduce:hidden">
            <InkBurst {...BURST} className="block h-full w-full" />
          </div>
          <div className="ch34-giant pointer-events-none motion-reduce:hidden">
            <Eye seed={GIANT_EYE_SEED} glow variant="ghost" className="block h-auto w-full" />
          </div>

          {/* the drop's caption, carried across the cut, already typed */}
          <p data-carry aria-hidden className="cap-slot-br caption caption--dark motion-reduce:hidden">
            <span className="block">{site.drop.label}:</span>
            {site.drop.lines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </p>

          {STEPS.map((item, k) => {
            const slot = slotOf(k);
            const p = item.slug ? projectBySlug(item.slug) : undefined;
            const href = p?.url ?? p?.repo;
            return (
              <article key={item.label} aria-label={item.label} className="motion-safe:contents motion-reduce:mb-[10vh] motion-reduce:block">
                <div data-cap={k} className={`${slot === "tl" ? "cap-slot-tl" : "cap-slot-br"} motion-reduce:mb-4`}>
                  <TypeCaption
                    ref={(h) => {
                      handles.current[k] = h;
                    }}
                    trigger="manual"
                    tone={!reduced && slot === "br" ? "dark" : "light"}
                    label={item.label}
                    lines={item.lines}
                  />
                </div>
                <Strip
                  zone={zoneOf(k)}
                  className="ch34-pre"
                  href={href}
                  label={href ? `Open ${item.label} (new tab)` : undefined}
                  data={{ "data-strip": String(k) }}
                >
                  <StripContent item={item} k={k} />
                </Strip>
              </article>
            );
          })}

          <p data-meta aria-hidden className="caption ch34-meta motion-reduce:hidden" style={{ opacity: 0.55 }}>
            {fileNo(0)} · {STEPS[0].label}
          </p>
        </div>
      </section>
    </div>
  );
}
