import { Medal } from "../art/Objects";
import { Crane } from "../art/Scenery";

const QUOTES = [
  {
    quote: "Tsuki is clean, long and almost impossibly still — like a temple bell heard from across a frozen lake.",
    who: "Mariko Sato",
    where: "The Pacific Sake Review",
  },
  {
    quote: "Hi is the kimoto I want on a cold night with something smoky on the grill.",
    who: "Daniel Okafor",
    where: "Night Table Journal",
  },
  {
    quote: "Kin makes an argument for aged sake that no one at the table could answer.",
    who: "Léa Fontaine",
    where: "Cellar & Cup",
  },
];

const AWARDS = [
  { kanji: "金", top: "TOKYO SAKE ASSEMBLY", bottom: "GOLD · 2025", label: "Tsuki — Gold, Tokyo Sake Assembly 2025" },
  { kanji: "極", top: "KURA NIGHT AWARDS", bottom: "BEST IN SHOW · 2025", label: "Kin — Best in show, Kura Night Awards 2025" },
  { kanji: "雅", top: "PACIFIC SAKE REVIEW", bottom: "97 POINTS · 2024", label: "Hi — 97 points, Pacific Sake Review 2024" },
];

export default function Press() {
  const [lead, ...rest] = QUOTES;
  return (
    <section
      id="press"
      aria-labelledby="press-title"
      className="relative isolate z-40 -mt-[8vw] overflow-hidden bg-crimson pt-[calc(8vw+5rem)] pb-28 md:pb-40"
      style={{ clipPath: "polygon(0 0, 100% 8vw, 100% 100%, 0 100%)" }}
    >
      {/* giant ink sun + cranes crossing it */}
      <div aria-hidden className="absolute right-[-30vw] top-[10%] -z-10 aspect-square w-[90vw] rounded-full bg-ink md:right-[-12vw] md:w-[min(64vw,900px)]" data-parallax="0.25" />
      <div aria-hidden className="absolute right-[6%] top-[80%] -z-10 hidden w-[16vw] md:block" data-crane>
        <Crane className="w-full" fill="var(--ink)" crown="var(--rice)" />
      </div>
      <div aria-hidden className="absolute right-[8%] top-[22%] -z-10 w-[30vw] md:w-[18vw]" data-crane>
        <Crane className="w-full" fill="var(--rice)" crown="var(--vermilion)" />
      </div>

      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <p className="label text-rice">Press &amp; awards · 評判</p>
        <h2 id="press-title" className="sr-only">
          What they say about KURO
        </h2>

        <figure className="mt-10 md:mt-14">
          <blockquote data-reveal className="max-w-[21ch] font-display text-[clamp(2rem,4.6vw,4.2rem)] leading-[1.08] font-bold text-balance text-rice">
            <span aria-hidden className="mr-1 text-ink">“</span>
            {lead.quote}
            <span aria-hidden className="text-ink">”</span>
          </blockquote>
          <figcaption data-rise className="label mt-8 flex items-center gap-4 text-rice">
            <span className="h-px w-12 shrink-0 bg-rice" />
            <span>
              {lead.who} — <span className="text-gold">{lead.where}</span>
            </span>
          </figcaption>
        </figure>

        <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-2 md:gap-10 lg:max-w-[60%]">
          {rest.map((q) => (
            <figure key={q.who} data-rise className="bg-ink p-7 text-rice" style={{ boxShadow: "8px 8px 0 var(--gold)" }}>
              <blockquote className="font-display text-xl leading-snug font-bold">“{q.quote}”</blockquote>
              <figcaption className="label mt-5 text-[0.66rem]! text-rice/70">
                {q.who} — <span className="text-gold">{q.where}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <ul className="mt-20 flex flex-wrap items-center gap-4 sm:gap-8 md:mt-24 md:gap-12" aria-label="Awards">
          {AWARDS.map((a, i) => (
            <li key={a.kanji} data-rise className="flex items-center gap-4">
              <Medal id={`medal-${i}`} kanji={a.kanji} top={a.top} bottom={a.bottom} className="h-24 w-24 sm:h-28 sm:w-28 md:h-36 md:w-36" />
              <span className="sr-only">{a.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
