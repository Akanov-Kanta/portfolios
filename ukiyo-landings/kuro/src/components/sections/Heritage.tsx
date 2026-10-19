import { splatter } from "@/lib/shapes";
import { Kura } from "../art/Objects";
import { Hanko, Splatter } from "../art/Scenery";

const TIMELINE = [
  {
    year: "1789",
    jp: "井戸",
    title: "A well is dug in Fushimi",
    body: "Kurosawa Jinbei strikes soft, iron-free water beneath the Momoyama hills and sells his first pressing to the night boatmen of the Uji river.",
  },
  {
    year: "1868",
    jp: "灯",
    title: "Brewing by lantern",
    body: "When fire sweeps the district in the Boshin War, the kura's earthen walls hold. The brewers keep the starter alive by lantern light for nine nights.",
  },
  {
    year: "1923",
    jp: "黒",
    title: "The black board",
    body: "The fourth master paints a single character — 黒, black — on a cedar board over the door. The townspeople start calling the sake by it.",
  },
  {
    year: "1975",
    jp: "磨",
    title: "Polished to thirty-five",
    body: "The kura mills Yamada Nishiki rice down to its 35% starch core for the first time. The result becomes the house's moon sake, Tsuki.",
  },
  {
    year: "2011",
    jp: "生酛",
    title: "Back to kimoto",
    body: "Sixth-generation tōji Kurosawa Aya revives the slow, wild-yeast kimoto starter — six weeks of cold work that gives Hi its depth.",
  },
  {
    year: "2026",
    jp: "夜",
    title: "The Night Series",
    body: "Three sakes, one release, timed to the first cold moon of winter. Bottled by hand, numbered, and sealed in washi.",
  },
];

export default function Heritage() {
  return (
    <section
      id="heritage"
      aria-labelledby="heritage-title"
      className="paper relative z-10 -mt-[8vw] pt-[calc(8vw+6rem)] pb-28 md:pb-40"
      style={{ clipPath: "polygon(0 8vw, 100% 0, 100% 100%, 0 100%)" }}
    >
      <Splatter
        d={splatter(100, 100, 26, 5)}
        className="pointer-events-none absolute right-[4vw] top-[calc(8vw+2rem)] w-40 opacity-90 md:w-56"
      />
      <div className="mx-auto grid max-w-[1400px] gap-16 px-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20 md:px-10">
        {/* left: the house */}
        <div>
          <div className="flex items-start gap-5">
            <div className="vertical-upright font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-none font-extrabold text-ink">
              蔵元
            </div>
            <div className="pt-2">
              <p className="label text-crimson">Heritage · 蔵の歴史</p>
              <h2
                id="heritage-title"
                data-reveal
                className="mt-4 font-display text-[clamp(2.2rem,4.6vw,3.9rem)] leading-[1.02] font-extrabold text-balance"
              >
                Two hundred and thirty-seven winters in the dark.
              </h2>
              <p data-rise className="mt-6 max-w-[46ch] leading-relaxed text-ink/80">
                Sake is a winter craft. The Kurosawa family brews only when the nights are long, and the work happens
                after dark — when the rooms are coldest and the koji is most awake. KURO is what that patience tastes
                like.
              </p>
            </div>
          </div>
          <div data-reveal className="relative mt-12">
            <Kura className="h-auto w-full max-w-[560px]" />
            <Hanko className="absolute -right-1 bottom-12 h-14 w-14 md:right-6" chars={["黒", "沢"]} />
          </div>
          <dl className="mt-10 grid max-w-[560px] grid-cols-3 border-t-2 border-ink">
            {[
              ["237", "Winters brewed"],
              ["1", "Well, still drawn"],
              ["6", "Generations of tōji"],
            ].map(([n, l]) => (
              <div key={l} data-rise className="flex flex-col border-r border-ink/30 py-4 pr-3 last:border-r-0 [&:not(:first-child)]:pl-4">
                <dt className="label order-2 mt-1 block text-[0.62rem]! text-ink/70">{l}</dt>
                <dd className="font-display text-4xl font-extrabold text-ink">{n}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* right: brush-line timeline */}
        <div data-timeline className="relative pl-14 md:pl-20 md:pt-24">
          <svg
            aria-hidden
            className="absolute left-3 top-0 h-full w-8 md:left-6"
            viewBox="0 0 20 1000"
            preserveAspectRatio="none"
          >
            <path
              data-brush
              d="M10 0 C14 80 6 160 10 240 C14 330 7 420 11 500 C15 590 6 680 10 760 C13 840 8 920 10 1000"
              fill="none"
              stroke="var(--ink)"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          </svg>
          <ol className="space-y-14 md:space-y-20">
            {TIMELINE.map((t, i) => (
              <li key={t.year} className="relative">
                <span
                  aria-hidden
                  className={`absolute top-3 -left-[2.95rem] grid h-5 w-5 place-items-center md:-left-[3.95rem] ${
                    i === TIMELINE.length - 1 ? "bg-vermilion" : "bg-ink"
                  }`}
                  style={{ transform: "rotate(45deg)" }}
                >
                  <span className="h-1.5 w-1.5 bg-gold" />
                </span>
                <div data-reveal className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <span className="font-display text-[clamp(2.6rem,5vw,4.2rem)] leading-none font-extrabold text-ink">
                    {t.year}
                  </span>
                  <span className="font-display text-xl font-bold text-crimson">{t.jp}</span>
                </div>
                <h3 data-rise className="label mt-3 text-[0.8rem]! font-semibold! text-ink">
                  {t.title}
                </h3>
                <p data-rise className="mt-2 max-w-[48ch] leading-relaxed text-ink/75">
                  {t.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
