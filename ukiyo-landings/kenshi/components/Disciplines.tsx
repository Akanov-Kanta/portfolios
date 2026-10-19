import { DISCIPLINES } from "@/lib/data";
import { IaidoPictogram, KendoPictogram, MmaPictogram } from "./art/Pictograms";
import { SectionHead } from "./SectionHead";

const ART = { kendo: KendoPictogram, iaido: IaidoPictogram, mma: MmaPictogram };

export function Disciplines() {
  return (
    <section id="disciplines" aria-labelledby="disc-title" className="edge-top-rev relative z-20 bg-rice pb-28 pt-[calc(5vw+6rem)] [--edge:5vw]">
      <div className="mx-auto max-w-[1300px] px-5 sm:px-10">
        <SectionHead index="02" label="Disciplines" kanji="三道" id="disc-title" title={<>Three paths.<br />One floor.</>} />

        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-10">
          {DISCIPLINES.map((d, i) => {
            const Art = ART[d.id];
            return (
              <article
                key={d.id}
                data-reveal="rise"
                className="group relative flex flex-col border-2 border-ink bg-mist shadow-[8px_8px_0_var(--ink)] transition-transform duration-150 hover:-translate-y-1"
              >
                <div className="relative aspect-square overflow-hidden border-b-2 border-ink bg-rice p-6">
                  <Art />
                  <span className="label absolute left-4 top-4 text-ink/60">0{i + 1}</span>
                  <span aria-hidden="true" className="vertical absolute right-3 top-4 font-display text-2xl font-extrabold text-ink">
                    {d.kanji}
                  </span>
                  {/* slash that cuts across on hover */}
                  <span aria-hidden="true" className="absolute -left-1/4 top-1/2 h-[3px] w-[150%] origin-left -rotate-[28deg] scale-x-0 bg-vermilion transition-transform duration-200 ease-[cubic-bezier(.8,0,.2,1)] group-hover:scale-x-100" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="label text-crimson">{d.tagline}</p>
                  <h3 className="mt-2 font-display text-3xl font-extrabold">{d.name}</h3>
                  <p className="mt-4 leading-relaxed text-ink/80">{d.body}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {d.facts.map((f) => (
                      <li key={f} className="label border-2 border-ink px-2 py-1 !text-[0.68rem] !tracking-[0.18em]">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
