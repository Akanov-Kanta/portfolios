import { Bamboo, Enso, Splatter } from "../art/scenery";
import Hanko from "../Hanko";
import SectionHead from "../SectionHead";

const TENETS = [
  {
    n: "一",
    title: "Patience",
    body: "Large work is built across seasons. Each artist starts one new backpiece a month, so every line gets the hours it deserves.",
  },
  {
    n: "二",
    title: "Lineage",
    body: "We trained in the tebori tradition: shading poked by hand with steel needles bound to bamboo. We still offer it, alongside the machine.",
  },
  {
    n: "三",
    title: "Flow",
    body: "Designs follow the body’s currents. The wind bars, waves and clouds in the background are there to tie a piece into the skin around it.",
  },
];

export default function Philosophy() {
  return (
    <section id="philosophy" className="cut fibers relative z-10 overflow-hidden bg-rice pb-28 text-ink" aria-labelledby="philosophy-title">
      {/* bamboo grove on the right edge */}
      <div data-parallax="-0.1" className="pointer-events-none absolute -right-10 top-0 hidden h-[120%] w-[30vw] max-w-[420px] lg:block">
        <Bamboo className="h-full w-full" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-8 lg:pr-[30vw]">
        <SectionHead
          no="01"
          kanji="哲学"
          label="Philosophy"
          tone="light"
          title={
            <span id="philosophy-title">
              A tattoo is not worn.
              <br />
              <span className="text-crimson">It is carried.</span>
            </span>
          }
        />

        <div className="mt-14 grid gap-12 md:grid-cols-[minmax(0,260px)_1fr] md:items-center">
          <div className="relative mx-auto aspect-square w-60 md:w-full" data-reveal>
            <Splatter className="pointer-events-none absolute -bottom-6 -right-10 w-28" seed={3} />
            <Enso className="absolute inset-0 h-full w-full" />
            <span className="absolute inset-0 grid place-items-center font-display text-[5.5rem] font-extrabold text-crimson">彫</span>
          </div>
          <div className="max-w-2xl">
            <p className="font-display text-[clamp(1.25rem,2.2vw,1.75rem)] font-semibold leading-snug">
              Irezumi is a long conversation between skin and ink. We draw every design by hand, for one body, once.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-ink/80">
              No flash is repeated in the same placement, and no piece leaves the studio until it moves the way your
              muscles move. That takes more sittings than a street shop would schedule. It is also why our work still reads
              from across a room twenty years later.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Hanko chars="一期一会" size={52} tone="crimson" />
              <p className="label text-ink/70">Ichi-go ichi-e — one time, one meeting</p>
            </div>
          </div>
        </div>

        <ol className="mt-20 grid gap-0 md:grid-cols-3">
          {TENETS.map((t, i) => (
            <li
              key={t.n}
              data-reveal
              className="relative border-t-[3px] border-ink py-8 md:border-l-[3px] md:border-t-0 md:px-8 md:py-2"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="font-display text-6xl font-extrabold leading-none text-crimson">{t.n}</span>
              <h3 className="mt-4 font-display text-3xl font-extrabold">{t.title}</h3>
              <p className="mt-3 leading-relaxed text-ink/80">{t.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
