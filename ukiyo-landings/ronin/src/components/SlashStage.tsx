import { Hero } from "./Hero";
import { Bamboo, groveLeft, groveRight } from "./art/Bamboo";
import { Hanko } from "./Hanko";

/**
 * Hero + the panel it gets cut into. With motion enabled the stage is pinned and the
 * panel is revealed by a scrubbed diagonal clip-path; without motion the panel simply
 * follows the hero in normal flow.
 */
export function SlashStage() {
  return (
    <div className="slash-stage" data-slash-stage>
      <Hero />
      <section
        className="slash-panel relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-rice text-ink"
        data-slash-panel
        aria-label="Every cut is final"
      >
        <div data-panel-grove="l" className="absolute inset-y-0 left-0 w-[22%] md:w-[26%]">
          <Bamboo stalks={groveLeft} className="h-full w-full" />
        </div>
        <div data-panel-grove="r" className="absolute inset-y-0 right-0 w-[22%] md:w-[26%]">
          <Bamboo stalks={groveRight} className="h-full w-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <p className="label mb-2 bg-rice px-2 py-1 text-crimson">第一章 · Chapter I — The Red Moon</p>
          <div className="relative">
            {/* sumi brush swoosh along the cut */}
            <svg
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
              className="absolute left-1/2 top-[18%] h-[70%] w-[min(150vw,1500px)] -translate-x-1/2"
              aria-hidden="true"
            >
              <path
                filter="url(#brush)"
                d="M0 330C180 300 380 230 560 160 720 98 860 60 1000 40L1000 70C860 96 730 140 580 210 400 292 190 356 0 372z"
                fill="var(--wash-2)"
              />
              <path
                filter="url(#brush)"
                d="M120 360C320 318 520 240 700 170L720 182C540 262 330 340 120 372z"
                fill="var(--vermilion)"
              />
            </svg>
            <span
              lang="ja"
              aria-hidden="true"
              className="font-display relative block text-[clamp(9rem,34vh,20rem)] leading-none font-extrabold text-ink"
              style={{ textShadow: "0.04em 0.04em 0 var(--crimson)" }}
            >
              斬
            </span>
            <Hanko chars="一閃" size={64} className="absolute -right-10 bottom-6 md:-right-14" tilt={6} />
          </div>
          <h2 className="font-display relative mt-2 bg-rice px-3 py-1 text-[clamp(2rem,5vw,3.6rem)] leading-none font-extrabold">
            Every cut is final.
          </h2>
          <p className="mt-4 max-w-[30rem] bg-rice px-2 text-lg leading-snug font-medium text-ink-2 md:text-xl">
            No health bars. No second chances. One clean strike ends any duel — yours included.
          </p>
        </div>
      </section>
      <div className="slash-blade" data-slash-blade aria-hidden="true" />
      <div className="slash-flash" data-slash-flash aria-hidden="true" />
    </div>
  );
}
