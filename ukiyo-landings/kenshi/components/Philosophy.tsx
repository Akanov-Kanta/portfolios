import { MoonScene } from "./art/Portraits";
import { SectionHead } from "./SectionHead";

const PRECEPTS = [
  {
    kanji: "気剣体",
    name: "Ki-ken-tai-itchi",
    gloss: "Spirit, sword, body — as one",
    body: "The shout, the blade and the stamping foot arrive in the same instant. A cut without all three is only a touch.",
  },
  {
    kanji: "残心",
    name: "Zanshin",
    gloss: "The mind that remains",
    body: "After the strike you do not relax. Eyes forward, sword alive, ready for whatever answers back.",
  },
  {
    kanji: "無心",
    name: "Mushin",
    gloss: "No-mind",
    body: "Ten thousand repetitions so that when it matters, nothing — not fear, not pride — stands in the way.",
  },
];

export function Philosophy() {
  return (
    <section id="way" aria-labelledby="way-title" className="edge-top relative z-10 overflow-hidden bg-ink pb-24 pt-[calc(6vw+1rem)] text-rice [--edge:6vw] lg:pt-[calc(5vw+6rem)]">
      <div className="relative mx-auto max-w-[1300px] px-5 sm:px-10">
        <div
          className="pointer-events-none relative -mr-[30%] ml-auto mt-4 w-[95%] max-w-[520px] sm:-mr-[10%] sm:w-[70%] lg:absolute lg:-right-[8%] lg:-top-28 lg:mr-0 lg:mt-0 lg:w-[46%] lg:max-w-[680px]"
          data-depth-float
        >
          <MoonScene />
        </div>
        <div className="relative -mt-[10%] sm:-mt-[8%] lg:mt-0">
          <SectionHead index="01" label="The Way" kanji="道" tone="dark" id="way-title" title={<>The sword is<br />only the excuse.</>} />
        </div>

        <p data-reveal="rise" className="mt-10 max-w-[34rem] text-lg leading-relaxed text-rice/80 sm:text-xl">
          We teach people to hit and not be hit — but what you take home is posture, breath and the habit of
          stepping forward when it would be easier to step back. Three ideas run through every class.
        </p>

        <ol className="relative mt-16 grid border-t border-rice/20 sm:grid-cols-3 lg:mt-24 lg:max-w-[50rem]">
          {PRECEPTS.map((p, i) => (
            <li key={p.name} data-reveal="rise" className="relative flex gap-5 border-b border-rice/20 py-8 pr-4 sm:flex-col sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
              <span aria-hidden="true" className="vertical self-start font-display text-4xl font-extrabold leading-none text-gold sm:h-[9.5rem] sm:text-5xl">
                {p.kanji}
              </span>
              <div>
                <p className="label text-vermilion">0{i + 1}</p>
                <h3 className="mt-2 font-display text-2xl font-extrabold">{p.name}</h3>
                <p className="label mt-1 !tracking-[0.16em] text-rice/55">{p.gloss}</p>
                <p className="mt-4 leading-relaxed text-rice/80">{p.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <figure data-reveal="rise" className="seigaiha relative mt-20 max-w-[52rem] border-2 border-ink p-1 shadow-[10px_10px_0_var(--crimson)]">
          <div className="bg-ink px-6 py-8 sm:px-10 sm:py-10">
            <p className="label text-gold">Dōjō kun · the rules on our wall</p>
            <blockquote className="mt-4 font-display text-2xl leading-snug sm:text-3xl">
              We bow on entering. We train without ego. We protect our partner.
              We leave the floor cleaner than we found it.
            </blockquote>
          </div>
        </figure>
      </div>
    </section>
  );
}
