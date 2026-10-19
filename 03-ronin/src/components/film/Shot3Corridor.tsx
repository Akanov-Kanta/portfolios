"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { art } from "@/art";
import { site, type Project } from "@/content";
import { SectionLabel } from "../bits";
import { ProjectDialog } from "../ProjectDialog";
import { Sprite } from "./Sprite";

const SCREENS = [art.pdGanku, art.pdKorin];

/**
 * 三 · Shot 3, the gold corridor: the rōnin walks between dragon screens; every screen he passes is a project.
 * The film slides them in one at a time; without the film they sit in a grid.
 */
export function Shot3Corridor() {
  const [active, setActive] = useState<Project | null>(null);

  // the film stops scrolling while the details scroll is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(active ? "film:lock" : "film:unlock"));
  }, [active]);

  return (
    <section id="works" data-shot="s3" data-near="false" aria-labelledby="works-h" className="shot shot-s3">
      <div className="layers">
        {/* the dolly: two copies of the hall zoom toward the vanishing point and cross-fade, so the camera can travel forever */}
        <div className="bg dolly" data-f="s3-bg">
          <Image src={art.s3Bg.src} alt="" width={art.s3Bg.width} height={art.s3Bg.height} quality={85} sizes="110vw" className="dolly-a" />
          <Image src={art.s3Bg.src} alt="" width={art.s3Bg.width} height={art.s3Bg.height} quality={85} sizes="110vw" className="dolly-b" />
        </div>
        <Sprite name="walk" className="chr s3-ronin" f="s3-ronin" />
      </div>

      <div className="s3-head" data-f="s3-head">
        <SectionLabel num="二" kanji="作" en="Works" tone="light" id="works-h" />
        <p className="label mt-3 max-w-xs text-gold">
          {site.projects.length} screens in the corridor. Open one to unroll its scroll.
        </p>
      </div>

      <ul className="s3-panels">
        {site.projects.map((p, i) => {
          const screen = SCREENS[i % 2];
          return (
            <li key={p.slug} className={`s3-panel ${i % 2 ? "is-right" : "is-left"}`} data-f={`s3-panel-${i}`}>
              <button
                type="button"
                className="fusuma glint group"
                onClick={() => setActive(p)}
                aria-haspopup="dialog"
                aria-label={`${p.name}, ${p.date}: ${p.tagline} Open details.`}
              >
                <Image src={screen.src} alt="" width={screen.width} height={screen.height} quality={75} sizes="(min-width: 768px) 44vw, 92vw" className="fusuma-paint nl" />
                <span className="fusuma-veil" aria-hidden="true" />
                <span className="relative flex items-start gap-4 p-4 sm:p-5">
                  <span lang="ja" aria-hidden="true" className="vertical-upright display text-[clamp(2.4rem,4.5vw,4rem)] leading-none text-ink">
                    {p.kanji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="label block text-crimson">{p.date}</span>
                    <span className="display mt-1 block text-[clamp(1.7rem,3.4vw,3rem)] text-ink">{p.name}</span>
                    <span className="mt-2 block font-cond text-[clamp(0.95rem,1.25vw,1.15rem)] leading-snug text-ink">{p.tagline}</span>
                  </span>
                </span>
                <span className="fusuma-shot">
                  <Image src={p.image.src} alt={p.image.alt} width={p.image.width} height={p.image.height} sizes="(min-width: 768px) 36vw, 84vw" className="nl h-full w-full object-cover object-top" />
                </span>
                <span className="label relative mx-4 mb-4 mt-auto inline-flex items-center gap-2 self-start bg-ink px-3 py-2 text-[11px] text-rice transition-colors group-hover:bg-vermilion sm:mx-5 sm:mb-5">
                  <span lang="ja" aria-hidden="true" className="font-serif text-sm tracking-normal">
                    巻
                  </span>
                  Unroll the scroll
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ProjectDialog project={active} onClose={() => setActive(null)} />
    </section>
  );
}
