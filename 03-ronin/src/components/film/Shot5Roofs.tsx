import Image from "next/image";
import { art } from "@/art";
import { site } from "@/content";
import { SectionLabel } from "../bits";
import { GoldClouds, RidgeRun, SpeedLines } from "./Motion";
import { Sprite } from "./Sprite";

/** 五 · Shot 5, the roof run: the rōnin leaps across the castle roofs; the path so far rolls past beneath him. */
export function Shot5Roofs() {
  return (
    <section id="path" data-shot="s5" data-near="false" aria-labelledby="path-h" className="shot shot-s5">
      <div className="layers">
        <Image src={art.s5Bg.src} alt="" width={art.s5Bg.width} height={art.s5Bg.height} quality={85} sizes="120vw" className="bg" data-f="s5-bg" />
        <GoldClouds count={2} />
        <RidgeRun />
        {/* the runner: the film brings him in and out; inside, he gains and loses ground on the camera and leaps */}
        <div className="s5-runner" data-f="s5-runner">
          <div className="s5-across">
            <div className="s5-leap">
              <SpeedLines className="speed-s5" />
              <Sprite name="run" className="s5-ronin" />
            </div>
          </div>
        </div>
      </div>

      <div className="s5-head" data-f="s5-head">
        <SectionLabel num="四" kanji="道" en="Path" tone="light" id="path-h" />
      </div>

      <ol className="s5-track" data-f="s5-track">
        <li className="s5-print" aria-hidden="true">
          <Image src={art.pdNight.src} alt="" width={art.pdNight.width} height={art.pdNight.height} quality={75} sizes="(min-width: 768px) 30vw, 80vw" className="nl h-full w-full object-cover" />
          <span className="label absolute bottom-2 left-2 bg-ink px-2 py-1 text-[10px] text-rice">Kuniyoshi · the 47 rōnin, c. 1831</span>
        </li>
        {site.path.map((m, i) => (
          <li key={i} className="s5-card">
            <span lang="ja" aria-hidden="true" className="s5-kanji display">
              {m.kanji}
            </span>
            <p className="label text-vermilion">{m.date ?? "Along the way"}</p>
            <h3 className="display mt-1.5 text-[clamp(1.35rem,2.2vw,1.9rem)] leading-[0.95] text-rice">{m.title}</h3>
            <p className="mt-2 font-cond text-[15px] leading-snug text-rice/85">{m.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
