"use client";

import { PLANS } from "@/lib/data";
import { prefillTrial } from "./Schedule";
import { SectionHead } from "./SectionHead";

export function Plans() {
  return (
    <section id="membership" aria-labelledby="plans-title" className="edge-top relative z-40 bg-rice pb-28 pt-[calc(5vw+6rem)] [--edge:5vw]">
      <div className="mx-auto max-w-[1300px] px-5 sm:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead index="05" label="Membership" kanji="入門" id="plans-title" title={<>Enter the gate.</>} />
          <p className="max-w-[24rem] text-lg leading-relaxed text-ink/80">
            Month to month, no joining fee. Pause any time for injury or travel. Every plan starts with a free class.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-10 md:grid-cols-3 md:gap-6 lg:gap-10">
          {PLANS.map((p) => {
            const f = p.featured;
            return (
              <article
                key={p.id}
                data-reveal="rise"
                className={`relative flex flex-col border-2 border-ink p-7 sm:p-8 ${
                  f ? "bg-crimson text-rice shadow-[12px_12px_0_var(--ink)] md:-translate-y-6" : "bg-mist shadow-[8px_8px_0_var(--ink)]"
                }`}
              >
                {f ? (
                  <p className="label absolute -top-4 left-6 bg-ink px-3 py-1.5 text-rice">Most chosen</p>
                ) : null}
                <span aria-hidden="true" className={`vertical absolute right-5 top-6 font-display text-3xl font-extrabold ${f ? "text-ink" : "text-crimson"}`}>
                  {p.kanji}
                </span>
                <h3 className="font-display text-4xl font-extrabold">{p.name}</h3>
                <p className={`mt-3 max-w-[15rem] leading-relaxed ${f ? "text-rice/85" : "text-ink/75"}`}>{p.pitch}</p>
                <p className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-6xl font-extrabold tabular-nums">${p.price}</span>
                  <span className="label opacity-70">{p.cadence}</span>
                </p>
                <ul className={`mt-8 flex-1 space-y-3 border-t-2 pt-6 ${f ? "border-rice/40" : "border-ink/20"}`}>
                  {p.features.map((x) => (
                    <li key={x} className="flex items-start gap-3">
                      <span aria-hidden="true" className={`mt-2 inline-block h-[3px] w-4 shrink-0 -rotate-[28deg] ${f ? "bg-ink" : "bg-vermilion"}`} />
                      {x}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => prefillTrial({ plan: p.id })}
                  className={`btn mt-10 w-full ${f ? "btn-primary" : "btn-ghost"}`}
                >
                  Start with a free class
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
