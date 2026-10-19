import { Moon } from "./art/Moon";
import { Ronin } from "./art/Ronin";
import { Pagoda, Roof, RoofOrnament, shardShapes } from "./art/Roof";
import { WishlistButton } from "./WishlistButton";

const shards = [
  { l: 48, t: 18, s: 1.6, r: 20 },
  { l: 55, t: 9, s: 1.1, r: -30 },
  { l: 83, t: 14, s: 1.8, r: 60 },
  { l: 90, t: 30, s: 1.2, r: 10 },
  { l: 79, t: 46, s: 0.9, r: -50 },
  { l: 52, t: 38, s: 1.3, r: 80 },
  { l: 72, t: 6, s: 0.8, r: 30 },
  { l: 95, t: 52, s: 1.5, r: -10 },
  { l: 44, t: 56, s: 0.9, r: 45 },
  { l: 61, t: 25, s: 0.7, r: -70 },
  { l: 87, t: 68, s: 1.1, r: 15 },
];

export function Hero() {
  return (
    <section
      id="top"
      data-hero
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-crimson"
      aria-labelledby="hero-title"
    >
      {/* far horizon: pagoda + pines in deeper crimson */}
      <div data-hero-far className="absolute bottom-[26%] left-[2%] h-[36%] w-auto md:bottom-[30%] md:left-[30%] md:h-[34%]">
        <Pagoda className="h-full w-auto" />
      </div>
      <svg
        data-hero-far
        viewBox="0 0 600 300"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-[34%] w-[70%] md:h-[38%]"
        aria-hidden="true"
      >
        <path
          d="M0 300V30q20-30 40-6 14-26 34-4 18-30 40-6 10-20 30-2 22-26 44-2 16-20 34 0 24-22 46 4 18-16 40 6 20-24 46 10 30-20 56 14 40-10 70 20 50 10 80 46V300z"
          fill="var(--crimson-deep)"
        />
      </svg>

      {/* moon */}
      <div
        data-hero-moon
        className="absolute left-[58%] top-[57%] w-[112vw] -translate-x-1/2 -translate-y-1/2 md:left-[68%] md:top-[45%] md:w-[min(80vh,54vw)]"
      >
        <Moon className="h-auto w-full" />
      </div>

      {/* debris */}
      <div aria-hidden="true" className="absolute inset-0">
        {shards.map((s, i) => (
          <svg
            key={i}
            data-shard
            viewBox="0 0 30 18"
            className="absolute w-[22px] md:w-[30px]"
            style={{ left: `${s.l}%`, top: `${s.t}%`, transform: `rotate(${s.r}deg) scale(${s.s})` }}
          >
            <path d={shardShapes[i % shardShapes.length]} fill="var(--ink)" />
          </svg>
        ))}
      </div>

      {/* roof */}
      <div data-hero-roof className="absolute inset-x-0 bottom-0 h-[30%] md:h-[36%]">
        <Roof className="h-full w-full" />
        <div className="absolute bottom-[78%] right-[2%] h-[44%] md:right-[3%]">
          <RoofOrnament className="h-full w-auto" />
        </div>
      </div>

      {/* the rōnin */}
      <div
        data-hero-warrior
        className="absolute bottom-[17.5%] left-[60%] h-[44%] -translate-x-1/2 md:bottom-[23%] md:left-[68%] md:h-[60%]"
      >
        <Ronin className="h-full w-auto" />
      </div>

      {/* title block */}
      <div
        data-hero-title
        className="absolute left-[6vw] right-[6vw] top-[13%] md:right-auto md:top-[22%] md:max-w-[46vw]"
      >
        <p data-intro className="label flex items-center gap-3 text-rice">
          <span className="inline-block h-[2px] w-10 bg-rice" />
          Kagerō Works presents
        </p>
        <h1
          id="hero-title"
          data-intro
          className="font-display mt-6 text-[clamp(4.6rem,13vw,10rem)] leading-[0.82] font-extrabold tracking-[-0.03em] text-rice"
          style={{ textShadow: "0.06em 0.06em 0 var(--ink)" }}
        >
          RŌNIN
        </h1>
        <p
          data-intro
          className="font-display mt-5 max-w-[30rem] text-[1.15rem] leading-snug font-medium text-rice md:text-[1.45rem]"
        >
          One blade. No master. A thousand oni between you and the red moon.
        </p>
        <div data-intro className="mt-7 flex flex-wrap items-center gap-3 md:gap-4">
          <WishlistButton />
          <span className="btn-wrap">
            <a href="#trailer" className="btn btn-rice">
              <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true">
                <path d="M0 0l12 7-12 7z" fill="currentColor" />
              </svg>
              Trailer
            </a>
          </span>
        </div>
        <p data-intro className="label mt-6 hidden text-rice/90 md:block">
          Winter 2027 · PC · PlayStation 5 · Xbox Series X|S · Switch 2
        </p>
      </div>

      {/* vertical kanji */}
      <p
        data-intro
        lang="ja"
        className="vertical font-display absolute right-[3vw] top-[13%] hidden text-[1.6rem] font-extrabold tracking-[0.3em] text-rice md:block"
      >
        浪人<span className="text-ink">・</span>月下の一閃
      </p>

      {/* scroll cue */}
      <div className="absolute bottom-5 left-[6vw] z-10 flex items-center gap-3 text-rice">
        <span className="relative block h-10 w-[2px] overflow-hidden bg-rice/30">
          <span data-scroll-cue className="absolute inset-x-0 top-0 block h-1/2 bg-rice" />
        </span>
        <span className="label text-[0.7rem]">Scroll to draw</span>
      </div>
    </section>
  );
}
