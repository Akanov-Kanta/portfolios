import Image from "next/image";
import { art } from "@/art";
import { site } from "@/content";
import { SectionLabel } from "../bits";
import { Hanko } from "../Hanko";
import { Sprite } from "./Sprite";

/** 二 · Shot 2, the bamboo grove: the rōnin sits in the mist; who he is, written on a paper card. */
export function Shot2Bamboo() {
  return (
    <section id="about" data-shot="s2" data-near="true" aria-labelledby="about-h" className="shot shot-s2">
      <div className="layers">
        <Image src={art.s2Bg.src} alt="" width={art.s2Bg.width} height={art.s2Bg.height} quality={85} sizes="110vw" className="bg" data-f="s2-bg" />
        <div className="mist mist-a" aria-hidden="true" />
        <div className="mist mist-b" aria-hidden="true" />
        <Sprite name="meditate" className="chr s2-ronin breathe" f="s2-ronin" />
        <div className="culm culm-a" aria-hidden="true" data-f="s2-culm-a" />
        <div className="culm culm-b" aria-hidden="true" data-f="s2-culm-b" />
      </div>

      <div className="s2-card paper hard-shadow" data-f="s2-card">
        <SectionLabel num="一" kanji="序" en="About" id="about-h" />
        <div className="mt-5 space-y-3 text-ink">
          {site.bio.map((p, i) => (
            <p key={i} className={i === 0 ? "text-[clamp(1.15rem,2vw,1.6rem)] leading-snug font-semibold" : "font-cond text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-ink/85"}>
              {p}
            </p>
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 font-cond text-ink">
          <div className="border-t-2 border-ink pt-2">
            <dt className="label text-crimson">Now</dt>
            <dd className="mt-1 leading-snug">{site.currently}</dd>
          </div>
          <div className="border-t-2 border-ink pt-2">
            <dt className="label text-crimson">Based in</dt>
            <dd className="mt-1 leading-snug">
              {site.location.city}, {site.location.country}. {site.location.note}.
            </dd>
          </div>
        </dl>
        <Hanko text="序" size={52} className="absolute -right-4 -top-4 rotate-[8deg]" color="var(--crimson)" />
      </div>

      {/* a hanging scroll on the right: Hiroshige's plum against the moon */}
      <figure className="s2-kakejiku" data-f="s2-scroll">
        <span className="rod" aria-hidden="true" />
        <Image src={art.pdPlum.src} alt={art.pdPlum.alt} width={art.pdPlum.width} height={art.pdPlum.height} quality={75} sizes="(min-width: 768px) 16vw, 40vw" className="nl block h-auto w-full" />
        <span className="rod" aria-hidden="true" />
        <figcaption className="sr-only">Utagawa Hiroshige, A Red Plum Branch against the Summer Moon (public domain).</figcaption>
      </figure>
    </section>
  );
}
