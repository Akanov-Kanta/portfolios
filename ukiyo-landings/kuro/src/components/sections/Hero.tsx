import { seeded } from "@/lib/shapes";
import Bottle from "../art/Bottle";
import { Flock, Kasumi, Moon, PineBranch } from "../art/Scenery";

const rand = seeded(1789);
const FLAKES = Array.from({ length: 16 }, () => ({
  left: `${Math.round(rand() * 1000) / 10}%`,
  size: Math.round(4 + rand() * 9),
  duration: `${Math.round(11 + rand() * 12)}s`,
  delay: `${-Math.round(rand() * 20)}s`,
  opacity: Math.round((0.45 + rand() * 0.55) * 100) / 100,
}));

export default function Hero() {
  return (
    <section
      id="top"
      tabIndex={-1}
      className="relative isolate h-[calc(100svh+8vw)] min-h-[720px] overflow-hidden bg-ink outline-none"
      aria-labelledby="hero-title"
    >
      {/* ---------- far layer: moon, mist, birds ---------- */}
      <div data-hero-depth className="absolute inset-0">
        <div
          data-hero-moon
          className="absolute left-1/2 top-[56px] w-[118vw] -translate-x-[38%] sm:w-[92vw] md:left-auto md:right-[-6vw] md:top-[6vh] md:w-[min(92vh,64vw)] md:translate-x-0"
        >
          <Moon className="block h-auto w-full" />
        </div>
        <div
          data-hero-kasumi
          className="absolute right-[-10vw] top-[44%] w-[90vw] md:right-[-4vw] md:top-[50%] md:w-[min(70vh,48vw)]"
        >
          <Kasumi className="w-full" />
        </div>
        <div data-hero-kasumi className="absolute right-[18vw] top-[22%] hidden w-[min(40vh,28vw)] md:block">
          <Kasumi className="w-full" />
        </div>
        <div className="absolute right-[34%] top-[18%] w-[22vw] md:right-[38%] md:top-[16%] md:w-[min(18vh,12vw)]" data-parallax="-0.4">
          <Flock className="w-full" />
        </div>
      </div>

      {/* falling gold leaf */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="flake"
            style={{
              left: f.left,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDuration: f.duration,
              animationDelay: f.delay,
            }}
          />
        ))}
      </div>

      {/* pine branch cutting the moon on the diagonal */}
      <div
        data-hero-pine
        className="absolute right-[-30vw] top-[40px] w-[100vw] md:right-[-6vw] md:top-[-3vh] md:w-[min(84vh,58vw)]"
      >
        <PineBranch className="h-auto w-full" />
      </div>

      {/* ground: a diagonal ridge of raised indigo with a gold edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[34%] bg-ink-2 md:h-[30%]"
        style={{ clipPath: "polygon(0 42%, 100% 0, 100% 100%, 0 100%)" }}
      />
      <svg aria-hidden className="absolute inset-x-0 bottom-0 h-[34%] w-full md:h-[30%]" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0 42 L100 0" stroke="var(--gold)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[20%] bg-ink md:h-[17%]"
        style={{ clipPath: "polygon(0 0, 100% 60%, 100% 100%, 0 100%)" }}
      />

      {/* ---------- the bottle ---------- */}
      <div
        data-hero-bottle
        className="absolute bottom-[calc(8vw+min(300px,36svh))] left-[62%] h-[36svh] -translate-x-1/2 md:bottom-[calc(8vw+5vh)] md:left-auto md:right-[calc(min(92vh,64vw)*0.5_-_6vw)] md:h-[70vh] md:translate-x-1/2"
      >
        <Bottle className="h-full w-auto" title="KURO Tsuki bottle silhouetted against the moon" />
      </div>

      {/* ---------- copy ---------- */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-[calc(8vw+2.5rem)] md:justify-center md:px-10 md:pb-[8vw]">
        <p data-hero-rise className="label mb-5 flex items-center gap-3 text-gold">
          <span className="inline-block h-px w-10 bg-gold" />
          The Night Series · 2026
        </p>
        <h1 id="hero-title" className="relative w-fit">
          <span
            data-hero-cut
            className="block font-display text-[clamp(5.2rem,21vw,15rem)] font-extrabold leading-[0.82] tracking-[0.04em] text-rice"
            style={{ textShadow: "0.06em 0.06em 0 var(--ink-2)" }}
          >
            KURO
          </span>
          <span data-hero-cut className="mt-4 block max-w-[17ch] font-display text-[clamp(1.25rem,2.6vw,2rem)] font-bold leading-snug text-rice">
            Brewed in darkness.
            <br />
            <span className="text-gold">Poured by moonlight.</span>
          </span>
        </h1>
        <p data-hero-rise className="mt-6 hidden max-w-[34ch] sm:block text-[0.98rem] leading-relaxed text-rice/75 md:max-w-[40ch]">
          Three junmai sakes from a Fushimi kura that has worked through the night since 1789. Pressed in winter,
          rested until the cold moon, bottled by hand.
        </p>
        <div data-hero-rise className="mt-8 flex flex-wrap gap-4">
          <a href="#range" className="btn btn-gold">
            <span>Discover the range</span>
          </a>
          <a href="#buy" className="btn btn-ghost max-sm:hidden!">
            <span>Where to buy</span>
          </a>
        </div>
      </div>

      {/* vertical kanji + coordinates */}
      <div
        data-hero-rise
        className="vertical-upright absolute left-5 top-24 z-10 hidden font-display text-sm tracking-[0.6em] text-gold md:left-10 md:block"
      >
        純米大吟醸
      </div>
      <p
        data-hero-rise
        className="vertical label absolute right-4 top-24 z-10 hidden text-rice/60 md:block md:right-8"
      >
        Fushimi, Kyoto · 34°56′N 135°46′E
      </p>
    </section>
  );
}
