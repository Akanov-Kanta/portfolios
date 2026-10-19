import Image from "next/image";
import { art } from "@/art";
import { site } from "@/content";
import { Hanko } from "../Hanko";
import { InkGarden } from "../InkGarden";
import { GoldClouds } from "./Motion";
import { Sprite } from "./Sprite";

/** 一 · Shot 1, the moon roof: the rōnin under a giant moon, his name growing out of ink. */
export function Shot1Moon() {
  return (
    <section id="top" data-shot="s1" data-near="true" aria-labelledby="hero-h" className="shot shot-s1">
      <div className="layers">
        <Image src={art.s1Sky.src} alt="" width={art.s1Sky.width} height={art.s1Sky.height} preload quality={85} sizes="100vw" className="bg" data-f="s1-sky" />
        <div className="moon-glint" data-f="s1-glint" aria-hidden="true" />
        <GoldClouds count={2} />
        <Sprite name="idle" className="chr s1-ronin" f="s1-ronin" eager />
        <Image src={art.s1Roof.src} alt="" width={art.s1Roof.width} height={art.s1Roof.height} loading="eager" quality={85} sizes="(min-width: 768px) 118vw, 250vw" className="chr s1-roof" data-f="s1-roof" />
      </div>

      <div className="s1-copy" data-f="s1-copy">
        <h1 id="hero-h" className="sr-only">
          {site.name}, {site.role.toLowerCase()} in {site.location.city}
        </h1>
        <p className="label s1-kicker text-rice">
          <span className="inline-block h-px w-10 bg-rice align-middle" /> {site.role} · {site.location.city}
        </p>
        <InkGarden className="s1-ink" palette="scene" mode="loop" demoText={site.name.toUpperCase()} wrapWords sizeFrac={0.5} maxWFrac={0.94} hold={7000} startDelay={2300} density={0.85} />
        <div className="s1-manifesto">
          <Hanko text={site.initials} size={64} className="stamp-in shrink-0 rotate-[-6deg]" />
          <p className="max-w-sm font-cond text-lg leading-snug text-rice sm:text-xl">{site.manifesto}</p>
        </div>
      </div>

      <p lang="ja" aria-hidden="true" className="s1-vertical vertical-upright display text-rice">
        {site.epithet}
      </p>
      <p lang="ja" aria-hidden="true" className="s1-kana vertical label text-rice/80">
        {site.nameKana}
      </p>
      <p className="label s1-scroll text-rice" aria-hidden="true" data-f="s1-cue">
        <span lang="ja" className="font-serif text-base">巻</span> Scroll — the film begins
      </p>
    </section>
  );
}
