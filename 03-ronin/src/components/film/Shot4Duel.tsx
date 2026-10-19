import Image from "next/image";
import { art } from "@/art";
import { site } from "@/content";
import { SectionLabel } from "../bits";
import { Sprite } from "./Sprite";

/** 四 · Shot 4, the duel: the oni warlord and the rōnin close in; between them, the scroll of techniques. */
export function Shot4Duel() {
  const { primary, secondary } = site.techniques;
  return (
    <section id="techniques" data-shot="s4" data-near="false" aria-labelledby="tech-h" className="shot shot-s4">
      <div className="layers">
        <Image src={art.s4Bg.src} alt="" width={art.s4Bg.width} height={art.s4Bg.height} quality={85} sizes="110vw" className="bg" data-f="s4-bg" />
        <Sprite name="oni" className="chr s4-oni" f="s4-oni" />
        <Sprite name="strike" className="chr s4-ronin" f="s4-ronin" />
        <div className="clash" aria-hidden="true" data-f="s4-clash" />
        <div className="impact" aria-hidden="true" />
      </div>

      <div className="s4-scroll" data-f="s4-scroll">
        <span className="rod" aria-hidden="true" />
        <div className="s4-sheet paper">
          <SectionLabel num="三" kanji="技" en="Techniques" id="tech-h" />
          <h3 className="label mt-5 text-crimson">The core forms</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {primary.map((t) => (
              <li key={t} className="font-serif text-[clamp(1.05rem,1.7vw,1.5rem)] font-extrabold text-ink">
                {t}
              </li>
            ))}
          </ul>
          <h3 className="label mt-5 text-crimson">Forged in the projects</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {secondary.map((t) => (
              <li key={t} className="label border-2 border-ink px-2 py-1 text-[11px] text-ink">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <span className="rod" aria-hidden="true" />
      </div>

      {/* one cut to a painting at the moment of the clash */}
      <figure className="s4-memory" data-f="s4-memory" aria-hidden="true">
        <Image src={art.pdTsuna.src} alt="" width={art.pdTsuna.width} height={art.pdTsuna.height} quality={75} sizes="100vw" className="nl h-full w-full object-cover" />
      </figure>
    </section>
  );
}
