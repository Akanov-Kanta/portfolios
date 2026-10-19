import { Splatter } from "../art/scenery";
import Hanko from "../Hanko";
import SectionHead from "../SectionHead";

const ROWS = [
  { name: "One-point", jp: "ワンポイント", note: "Palm-sized · single sitting", price: "from ¥35,000" },
  { name: "Panel", jp: "前腕", note: "Forearm or calf", price: "¥80,000 – 150,000" },
  { name: "Half sleeve", jp: "五分袖", note: "Gobu · shoulder to elbow", price: "¥250,000 – 400,000" },
  { name: "Full sleeve", jp: "長袖", note: "Nagasode · shoulder to wrist", price: "¥500,000 – 800,000" },
  { name: "Backpiece", jp: "背中", note: "Horimono · billed per sitting", price: "¥60,000 / 3 h" },
];

const NOTES = [
  { k: "Hourly", v: "¥20,000 machine · ¥24,000 tebori" },
  { k: "Deposit", v: "¥20,000, taken off your final sitting" },
  { k: "Touch-ups", v: "Free within six months" },
];

export default function Pricing() {
  return (
    <section id="pricing" className="cut fibers relative z-50 bg-rice pb-28 text-ink" aria-labelledby="pricing-title">
      <Splatter className="pointer-events-none absolute -left-10 bottom-10 hidden w-56 opacity-90 lg:block" seed={8} color="var(--crimson)" />
      <div className="relative mx-auto grid max-w-[1500px] gap-14 px-4 sm:px-8 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div>
          <SectionHead
            no="05"
            kanji="値段"
            label="Pricing guidance"
            tone="light"
            title={
              <span id="pricing-title">
                Honest
                <br />
                starting points.
              </span>
            }
          >
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/80">
              Every piece is quoted at consultation, by size, placement and detail. These are the ranges most clients land in.
              Prices in yen, tax included.
            </p>
          </SectionHead>
          <dl className="mt-10 grid gap-4 sm:ml-16">
            {NOTES.map((n) => (
              <div key={n.k} className="flex flex-wrap items-baseline gap-x-4 border-l-[6px] border-crimson pl-4">
                <dt className="label w-24 text-crimson">{n.k}</dt>
                <dd className="font-display text-lg font-semibold">{n.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-reveal>
          <div className="relative">
          <span aria-hidden="true" className="absolute inset-0 translate-x-[12px] translate-y-[12px] bg-ink" />
          <div className="relative border-[3px] border-ink bg-gold">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-5 py-3 text-gold">
              <span className="label">Price board · 料金表</span>
              <Hanko chars="料金" size={36} />
            </div>
            <ul>
              {ROWS.map((r, i) => (
                <li key={r.name} className={`group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-5 transition-colors duration-100 hover:bg-ink hover:text-rice sm:px-7 ${i ? "border-t-2 border-ink/40" : ""}`}>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-display text-2xl font-extrabold sm:text-3xl">{r.name}</span>
                      <span className="font-display text-sm text-crimson group-hover:text-vermilion">{r.jp}</span>
                    </p>
                    <p className="label mt-1 opacity-70">{r.note}</p>
                  </div>
                  <p className="text-right font-narrow text-xl font-bold tracking-wide sm:text-2xl">{r.price}</p>
                </li>
              ))}
            </ul>
          </div>
          </div>
          <p className="mt-10 max-w-lg text-ink/70 sm:ml-2">
            Bodysuits (sōshinbori) are planned as a series of sittings over two to five years. We agree the full plan, then
            bill each sitting as it happens.
          </p>
        </div>
      </div>
    </section>
  );
}
