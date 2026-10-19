import { PanelAge, PanelBrew, PanelPolish, PanelRice } from "../art/Objects";
import { Seigaiha } from "../art/Scenery";

const STEPS = [
  {
    n: "一",
    jp: "米",
    title: "Rice",
    body: "Yamada Nishiki and Omachi from contract farmers in Hyōgo and Okayama, harvested when the heads bow lowest.",
    Art: PanelRice,
  },
  {
    n: "二",
    jp: "磨",
    title: "Polish",
    body: "Milled for up to 72 hours until only the starch heart remains — 35% of the grain for Tsuki. The rest is rice flour for the town's bakers.",
    Art: PanelPolish,
  },
  {
    n: "三",
    jp: "醸",
    title: "Brew",
    body: "Koji, water and rice meet in cedar. The brewers stir by hand through the night, reading the mash by its sound and smell.",
    Art: PanelBrew,
  },
  {
    n: "四",
    jp: "熟",
    title: "Age",
    body: "Pressed, then rested in the cold cellar — six months for Tsuki and Hi, ten winters for Kin — until the first cold moon.",
    Art: PanelAge,
  },
];

export default function Craft() {
  return (
    <section
      id="craft"
      aria-labelledby="craft-title"
      className="relative z-30 -mt-[8vw] bg-ink-2 pt-[calc(8vw+5rem)] pb-28 md:pb-40"
      style={{ clipPath: "polygon(0 8vw, 100% 0, 100% 100%, 0 100%)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-14">
          <div className="vertical-upright hidden font-display text-7xl font-extrabold leading-none text-gold md:block">造り</div>
          <div>
            <p className="label text-gold">How it&apos;s made · 造り</p>
            <h2 id="craft-title" data-reveal className="mt-4 max-w-[18ch] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] font-extrabold">
              Four seasons on one golden screen.
            </h2>
            <p data-rise className="mt-5 max-w-[56ch] leading-relaxed text-rice/70">
              In the kura&apos;s tasting room stands a four-panel byōbu, painted in 1891, that shows how KURO is made.
              It has not needed updating.
            </p>
          </div>
        </div>

        {/* the folding screen */}
        <div data-screen className="mt-14 [perspective:1800px] md:mt-20">
          <ol className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4 lg:gap-0">
            {STEPS.map(({ n, jp, title, body, Art }, i) => (
              <li key={title} className="flex flex-col">
                <div
                  data-screen-panel
                  className={`relative border-x-[6px] border-y-[10px] border-ink bg-ink lg:border-x-[3px] ${
                    i === 0 ? "lg:border-l-[10px]" : ""
                  } ${i === STEPS.length - 1 ? "lg:border-r-[10px]" : ""}`}
                  style={{ transformOrigin: "50% 50%" }}
                >
                  <div className="gold-leaf relative overflow-hidden">
                    <div data-draw-group>
                      <Art className="relative block h-auto w-full" />
                    </div>
                    {/* the hinge-side fold shadow — flat, hard edged */}
                    <div
                      data-screen-fold
                      aria-hidden
                      className="absolute inset-0 bg-ink"
                      style={{
                        opacity: 0.12,
                        clipPath: i % 2 ? "polygon(0 0, 22% 0, 8% 100%, 0 100%)" : "polygon(78% 0, 100% 0, 100% 100%, 92% 100%)",
                      }}
                    />
                    <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center bg-vermilion font-display text-lg font-extrabold text-rice">
                      {n}
                    </span>
                    <Seigaiha id={`sg-${i}`} className="block h-10 w-full" size={36} />
                  </div>
                </div>
                <div data-rise className="mt-6 pr-2 lg:pr-8">
                  <div className="flex items-baseline gap-3">
                    <h3 className="font-display text-2xl font-extrabold md:text-3xl">{title}</h3>
                    <span className="font-display text-lg text-gold">{jp}</span>
                  </div>
                  <div className="mt-3 h-px w-10 bg-gold" />
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-rice/70">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
