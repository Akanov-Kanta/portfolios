import { SENSEIS } from "@/lib/data";
import { Portrait } from "./art/Portraits";
import { Hanko } from "./art/Hanko";
import { SectionHead } from "./SectionHead";

export function Senseis() {
  return (
    <section id="senseis" aria-labelledby="sensei-title" className="relative z-30 bg-ink pb-28 pt-20 text-rice">
      <div className="mx-auto max-w-[1300px] px-5 sm:px-10">
        <SectionHead index="04" label="Senseis" kanji="先生" tone="dark" id="sensei-title" title={<>Taught by people<br />who still train.</>} />

        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-6 lg:gap-10">
          {SENSEIS.map((s, i) => (
            <article key={s.key} data-reveal="rise" className={`relative ${i === 1 ? "md:mt-16" : ""}`}>
              <div className="relative aspect-[3/4] border-2 border-rice/80 shadow-[10px_10px_0_var(--crimson)]">
                <Portrait kind={s.portrait} field={s.field} name={s.name} />
                <span aria-hidden="true" className="vertical absolute left-3 top-4 font-display text-3xl font-extrabold text-rice">
                  {s.kanji}
                </span>
                <Hanko glyph={s.kanji.slice(0, 1)} size={46} className="absolute bottom-4 left-4 -rotate-6" />
              </div>
              <div className="mt-7">
                <p className="label text-vermilion">{s.role}</p>
                <h3 className="mt-2 font-display text-3xl font-extrabold">{s.name}</h3>
                <p className="label mt-2 text-gold">{s.rank}</p>
                <p className="mt-1 text-rice/60">{s.years}</p>
                <blockquote className="mt-5 border-l-4 border-vermilion pl-4 font-display text-lg leading-snug text-rice/90">
                  “{s.quote}”
                </blockquote>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
