import { Katana } from "../art/scenery";
import SectionHead from "../SectionHead";

const STEPS = [
  {
    jp: "相談",
    en: "Consultation",
    time: "30 min · free",
    body: "At the studio or by video. Bring references, scars, the story behind it. We talk placement, scale, and how the piece will age with you.",
  },
  {
    jp: "下絵",
    en: "Sketch",
    time: "1 – 3 weeks",
    body: "Your artist draws the design by hand, then fits it to the contour of your body. We revise until it is right. The deposit holds your dates.",
  },
  {
    jp: "施術",
    en: "Session",
    time: "3 – 6 h per sitting",
    body: "Outline first, then colour and shading, sitting by sitting, with machine or tebori. Tea between passes; nobody rushes the needle.",
  },
  {
    jp: "養生",
    en: "Aftercare",
    time: "2 – 4 weeks",
    body: "Wrap, wash, balm. No sun and no onsen for two weeks. We check every piece at four weeks and touch it up free of charge.",
  },
];

export default function Process() {
  return (
    <section id="process" className="cut-rev relative z-40 bg-ink" aria-labelledby="process-title">
      <div data-hscroll className="relative overflow-hidden pb-24 md:flex md:min-h-[100svh] md:flex-col md:justify-center md:pb-12">
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-8">
          <SectionHead
            no="04"
            kanji="工程"
            label="Process"
            title={
              <span id="process-title">
                From the first word <span className="text-vermilion">to healed skin.</span>
              </span>
            }
          />
        </div>

        <div className="mx-auto mt-10 w-full max-w-[1500px] px-4 sm:px-8">
          <Katana className="h-8 w-full md:h-10" />
        </div>

        <ol data-hscroll-track className="mx-auto mt-10 grid max-w-[1500px] gap-8 px-4 sm:px-8 md:grid-cols-2 md:gap-10 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.en} data-reveal className="relative">
              <span aria-hidden="true" className="absolute inset-0 translate-x-[10px] translate-y-[10px] bg-crimson" style={{ clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)" }} />
              <div className="relative flex gap-5 bg-ink-2 p-6 md:min-h-[340px] md:p-8" style={{ clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)" }}>
                <span aria-hidden="true" className="vertical font-display text-5xl font-extrabold leading-none text-vermilion md:text-7xl">
                  {s.jp}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="font-display text-6xl font-extrabold leading-none text-rice/15 md:text-8xl">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">{s.en}</h3>
                  <p className="label mt-2 text-gold">{s.time}</p>
                  <p className="mt-4 leading-relaxed text-rice/80">{s.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
