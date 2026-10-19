import { HeroArt } from "./art/HeroArt";
import { Hanko } from "./art/Hanko";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-rice lg:h-[100svh] lg:min-h-[720px]" aria-labelledby="hero-title">
      <div className="hero-parallax-root absolute inset-0">
        <HeroArt />
      </div>

      {/* spacer that lets the stage show above the copy on small screens */}
      <div className="h-[calc(min(max(66svh,430px),640px)-5rem)] lg:hidden" aria-hidden="true" />

      <div className="relative z-10 px-5 pb-16 sm:px-10 lg:absolute lg:left-[5vw] lg:top-[15vh] lg:max-w-[38rem] lg:px-0 lg:pb-0">
        <p className="label cut-in mb-6 flex items-center gap-3 text-crimson" style={{ animationDelay: "1.3s" }}>
          <span className="inline-block h-[2px] w-10 bg-crimson" />
          Kendō · Iaidō · Conditioning
        </p>
        <h1 id="hero-title" className="font-display text-[clamp(3rem,6.4vw,6.4rem)] font-extrabold leading-[0.98] tracking-[-0.01em] text-ink">
          <span className="cut-in block" style={{ animationDelay: "1.35s" }}>
            One cut.
          </span>
          <span className="cut-in block" style={{ animationDelay: "1.45s" }}>
            A lifetime
          </span>
          <span className="cut-in block" style={{ animationDelay: "1.55s" }}>
            of <span className="text-crimson">practice.</span>
          </span>
        </h1>
        <p className="cut-in mt-7 max-w-[30rem] text-lg leading-relaxed text-ink/85 sm:text-xl" style={{ animationDelay: "1.7s" }}>
          KENSHI is a sword dojo at the edge of the bamboo district. Classes every evening, armour on loan,
          and your first class is on the house.
        </p>
        <div className="cut-in mt-9 flex flex-wrap gap-4" style={{ animationDelay: "1.8s" }}>
          <a href="#trial" className="btn btn-red">
            Book a free class <span aria-hidden="true">→</span>
          </a>
          <a href="#timetable" className="btn btn-ghost">
            Timetable
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[17vh] right-[3vw] z-10 hidden items-end gap-4 lg:flex" aria-hidden="true">
        <p className="label vertical-side bg-rice px-1 py-2 text-ink/80">Est. 1998 · Kiln St.</p>
        <Hanko glyph="士道" size={64} variant="solid" color="var(--crimson)" />
      </div>
      <p className="label vertical-side pointer-events-none absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 text-ink/60 xl:block" aria-hidden="true">
        剣の道 — the way of the sword
      </p>
    </section>
  );
}
