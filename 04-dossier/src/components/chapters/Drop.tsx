"use client";

import { useRef, useState } from "react";
import { site } from "@/content/site";
import { Eye } from "@/components/art/Eye";
import { InkBurst } from "@/components/art/InkBurst";
import { PhotoPlaceholder } from "@/components/art/PhotoPlaceholder";
import { Shards } from "@/components/art/Shards";
import { Strip } from "@/components/art/Strip";
import { shake, stripSlam } from "@/components/art/strip-fx";
import { FLASH_ID, flash } from "@/components/fx/flash";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";
import { sfx } from "@/lib/audio";
import { BURST, DROP_PIN, GIANT_EYE_SEED } from "./stage";

/** fraction of the pinned scroll spent in the silent "breath" before the drop fires */
const THRESHOLD = 0.3;

/**
 * Chapter 3 — DROP. A pinned, near-silent black pause while the first caption types bottom-right. Past
 * the threshold, on one beat: white flash (~70 ms), glass shards fly in from the edges, the ink burst
 * grows from the bottom (expo.out), a giant eye zooms in, the evidence strip slams in top-right, the
 * stage shakes, and the caption flips to dark-on-white. Scrolling back above the threshold hard-resets.
 */
export function Drop() {
  const root = useRef<HTMLElement>(null);
  const caption = useRef<TypeCaptionHandle>(null);
  const reduced = useReducedMotion();
  const [dropped, setDropped] = useState(false);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const stage = q("[data-stage]")[0];
        const burst = q("[data-burst]")[0];
        const giant = q("[data-giant]")[0];
        const shardsWrap = q("[data-shards]")[0];
        const shardEls = q<SVGGElement>("[data-shard]");
        const strip = q("[data-strip]")[0];
        const meta = q("[data-meta]")[0];
        const late = [burst, giant, shardsWrap, strip, meta];
        // (by element: selector strings would resolve inside this component's scope)
        const clearFlash = () => {
          const f = document.getElementById(FLASH_ID);
          if (f) gsap.set(f, { opacity: 0 });
        };

        const breath = () => {
          gsap.set(late, { autoAlpha: 0 });
          gsap.set(stage, { x: 0, y: 0, rotation: 0 });
          clearFlash();
        };
        breath();

        let hit: gsap.core.Timeline | null = null;
        let isDropped = false;

        const fire = () => {
          isDropped = true;
          hit?.kill();
          const tl = gsap.timeline();
          tl.add(flash({ hold: 0.07, fade: 0.03 }), 0);
          tl.call(() => {
            sfx.unduck();
            sfx.hit(1);
          }, [], 0);
          tl.call(() => setDropped(true), [], 0.07);
          tl.set(burst, { autoAlpha: 1 }, 0.07);
          tl.fromTo(burst, { scale: 0.3 }, { scale: 1, duration: 0.35, ease: "expo.out" }, 0.07);
          tl.set(shardsWrap, { autoAlpha: 1 }, 0.07);
          tl.fromTo(
            shardEls,
            {
              x: (i: number, t: Element) => Number((t as HTMLElement).dataset.side ?? 1) * gsap.utils.random(700, 1000),
              y: () => gsap.utils.random(-80, 80),
              rotation: () => gsap.utils.random(-90, 90),
              opacity: 0,
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.2,
              ease: "power3.out",
              stagger: { each: 0.008, from: "edges" },
              transformOrigin: "50% 50%",
            },
            0.07,
          );
          tl.fromTo(
            giant,
            { autoAlpha: 0, scale: 1.6, filter: "blur(10px)" },
            { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.25, ease: "power3.out" },
            0.1,
          );
          tl.set(strip, { autoAlpha: 1 }, 0.13);
          tl.add(stripSlam(strip), 0.13);
          tl.add(shake(stage), 0.07);
          tl.set(meta, { autoAlpha: 1 }, 0.35);
          // after the hit: shards hang and drift, the burst re-pulses once on the next beat
          tl.to(shardEls, { x: "+=14", rotation: "+=3", duration: 6, ease: "none" }, 0.3);
          tl.fromTo(burst, { scale: 1 }, { scale: 1.04, duration: 0.06, yoyo: true, repeat: 1, ease: "power1.out" }, 0.07 + 60 / 104);
          hit = tl;
        };

        const reset = () => {
          isDropped = false;
          hit?.kill();
          hit = null;
          breath();
          setDropped(false);
        };

        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: `+=${DROP_PIN * 100}%`,
          pin: true,
          onEnter: () => {
            sfx.duck();
            caption.current?.play();
          },
          onEnterBack: () => {
            if (!isDropped) sfx.duck();
          },
          onLeave: () => sfx.unduck(),
          onLeaveBack: () => {
            sfx.unduck();
            reset();
            caption.current?.reset();
          },
          onUpdate: (self) => {
            const past = self.progress >= THRESHOLD;
            if (past && !isDropped) fire();
            else if (!past && isDropped) {
              reset();
              sfx.duck();
            }
          },
        });

        return () => {
          hit?.kill();
          clearFlash();
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const dark = dropped || reduced;

  return (
    <section
      id="drop"
      ref={root}
      aria-label="The subject"
      className="relative h-svh w-full overflow-hidden"
      style={{ background: "var(--ink-0)" }}
    >
      <div data-stage className="absolute inset-0">
        <div data-burst className="ch34-burst ch34-pre">
          <InkBurst {...BURST} className="block h-full w-full" />
        </div>
        <div data-giant className="ch34-giant ch34-pre pointer-events-none">
          <Eye seed={GIANT_EYE_SEED} glow variant="ghost" className="block h-auto w-full" />
        </div>
        <div data-shards className="ch34-pre pointer-events-none absolute inset-0">
          <Shards seed={5} count={15} className="absolute inset-0 h-full w-full" />
        </div>
        <Strip zone="tr" className="ch34-pre" data={{ "data-strip": "" }}>
          <PhotoPlaceholder variant={0} />
        </Strip>
        <div className="cap-slot-br">
          <TypeCaption
            ref={caption}
            trigger="manual"
            tone={dark ? "dark" : "light"}
            label={site.drop.label}
            lines={site.drop.lines}
          />
        </div>
        <p data-meta className="caption ch34-meta ch34-pre" style={{ opacity: 0.55 }}>
          FILE 00 / SUBJECT
        </p>
      </div>
    </section>
  );
}
