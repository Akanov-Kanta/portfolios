import type { ReactNode } from "react";
import { CloudOrnament, DragonOrnament, MoonCycleOrnament, WaveOrnament } from "./art/Ornaments";

type Feature = { n: string; no: string; title: string; body: string; art: ReactNode; shade?: boolean };

const features: Feature[] = [
  {
    n: "一",
    no: "01",
    title: "One-strike duels",
    body: "No health bars, no button mashing. Read the stance, wait for the breath, cut once. Enemies fall to one clean strike — and so do you.",
    art: <CloudOrnament className="h-full w-full" />,
  },
  {
    n: "二",
    no: "02",
    title: "Three stances",
    body: "Heaven, Water, Earth. Each stance breaks another. Shift mid-swing to bait, feint and shatter a guard before it forms.",
    art: <WaveOrnament className="h-full w-full" />,
    shade: true,
  },
  {
    n: "三",
    no: "03",
    title: "The red moon cycle",
    body: "Every night the moon swells. The fuller it grows, the stronger the oni — and the hungrier your blade. Choose when to fight.",
    art: <MoonCycleOrnament className="h-full w-full" />,
  },
  {
    n: "四",
    no: "04",
    title: "A world drawn in ink",
    body: "Every frame hand-inked in flat colour and gold leaf. Bamboo seas, burning castles, rooftops beneath a moon the size of the sky.",
    art: <DragonOrnament className="h-full w-full" />,
    shade: true,
  },
];

export function Features() {
  return (
    <section id="combat" className="cut-top-rev relative overflow-hidden bg-ink-2 pb-28 md:pb-36">
      <span className="seam-glint" data-glint data-angle="4" style={{ top: "1px", width: "101%" }} />
      {/* spear-trail streak */}
      <svg
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
        className="pointer-events-none absolute left-0 top-[18%] h-[22vw] w-full"
        aria-hidden="true"
      >
        <path data-streak d="M0 170L1000 20v14L0 196z" fill="var(--vermilion)" />
      </svg>
      <div className="relative mx-auto max-w-[1320px] px-[6vw] lg:px-10">
        <div className="max-w-[44rem]">
          <p data-cut className="label text-gold">Gameplay</p>
          <h2
            data-cut
            className="font-display mt-4 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.98] font-extrabold text-rice"
          >
            Ink. Gold. Steel.
          </h2>
          <p data-cut className="mt-5 max-w-[34rem] text-lg leading-snug text-rice/80">
            A duelling game built on patience and a single decisive motion. Four rules carved into a folding
            screen.
          </p>
        </div>

        {/* byōbu: four hinged gold-leaf panels in a lacquer frame */}
        <ol
          data-stagger
          className="mt-14 grid grid-cols-1 gap-[6px] border-[6px] border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4"
          style={{ boxShadow: "14px 14px 0 var(--ink)" }}
        >
          {features.map((f) => (
            <li
              key={f.n}
              className={`gold-leaf relative flex flex-col p-6 text-ink ${f.shade ? "shade" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span lang="ja" className="font-display text-[3.2rem] leading-none font-extrabold text-crimson">
                  {f.n}
                </span>
                <span className="label pt-2 text-[0.66rem]">Rule {f.no}</span>
              </div>
              <div className="mt-4 aspect-[300/220] w-full">{f.art}</div>
              <h3 className="font-display mt-5 text-[1.6rem] leading-tight font-extrabold">{f.title}</h3>
              <p className="mt-3 text-[1.02rem] leading-snug font-medium text-ink-2">{f.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
