import HeroArt from "../art/HeroArt";
import { Roof } from "../art/scenery";
import Hanko from "../Hanko";

// flying debris: shards and petals crossing the sky on a diagonal
const DEBRIS = [
  { x: 92, y: 8, s: 14, kind: "shard", dur: 11, delay: -2, dx: "-70vw", dy: "40vh" },
  { x: 78, y: 18, s: 9, kind: "petal", dur: 9, delay: -6, dx: "-60vw", dy: "55vh" },
  { x: 60, y: 4, s: 18, kind: "shard", dur: 13, delay: -9, dx: "-50vw", dy: "70vh" },
  { x: 98, y: 40, s: 10, kind: "petal", dur: 10, delay: -1, dx: "-80vw", dy: "30vh" },
  { x: 70, y: 30, s: 7, kind: "shard", dur: 8, delay: -4, dx: "-65vw", dy: "45vh" },
  { x: 88, y: 60, s: 12, kind: "shard", dur: 12, delay: -7, dx: "-75vw", dy: "25vh" },
  { x: 45, y: 10, s: 8, kind: "petal", dur: 10, delay: -3, dx: "-45vw", dy: "60vh" },
  { x: 100, y: 22, s: 22, kind: "shard", dur: 14, delay: -11, dx: "-90vw", dy: "50vh" },
  { x: 84, y: 2, s: 6, kind: "shard", dur: 7, delay: -5, dx: "-55vw", dy: "65vh" },
  { x: 55, y: 26, s: 9, kind: "petal", dur: 11, delay: -8, dx: "-50vw", dy: "45vh" },
];

export default function Hero() {
  return (
    <section id="top" className="relative isolate min-h-[100svh] overflow-hidden bg-crimson" aria-labelledby="hero-title">
      {/* moon + dragon */}
      <div
        className="pointer-events-none absolute left-1/2 top-14 w-[115vw] max-w-[720px] -translate-x-1/2 md:left-auto md:right-[-3vw] md:top-[52%] md:w-auto md:max-w-none md:translate-x-0 md:-translate-y-1/2"
        data-intro="art"
      >
        <div data-parallax="0.12" className="md:aspect-square md:h-[min(100vh,62vw)]">
          <HeroArt className="block h-auto w-full md:h-full" />
        </div>
      </div>

      {/* debris */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {DEBRIS.map((d, i) => (
          <span
            key={i}
            className="drift absolute block"
            style={
              {
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: d.s,
                height: d.kind === "shard" ? d.s * 0.55 : d.s,
                background: d.kind === "shard" ? "var(--ink)" : "var(--rice)",
                clipPath: d.kind === "shard" ? "polygon(0 30%, 100% 0, 80% 100%, 10% 80%)" : "polygon(50% 0, 100% 40%, 60% 100%, 0 60%)",
                ["--dur"]: `${d.dur}s`,
                ["--delay"]: `${d.delay}s`,
                ["--dx"]: d.dx,
                ["--dy"]: d.dy,
                ["--r1"]: `${(i % 2 ? 1 : -1) * 620}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* roof diagonal */}
      <div data-parallax="-0.06" className="pointer-events-none absolute inset-x-0 bottom-0 h-[46svh] md:h-[42vh]">
        <Roof className="absolute inset-0 h-full w-full" />
      </div>

      {/* vertical side text */}
      <p
        aria-hidden="true"
        className="vertical absolute bottom-[calc(var(--cut)+1.5rem)] right-5 z-10 hidden font-display text-[clamp(2.6rem,4vw,4.2rem)] font-extrabold leading-none text-rice md:block"
        data-intro="side"
      >
        入れ墨
      </p>
      <p aria-hidden="true" className="vertical-side label absolute left-4 top-28 hidden text-rice/70 md:block">
        Shimokitazawa · Tokyo · Est. 2009
      </p>

      {/* copy */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1500px] flex-col justify-end px-4 pb-10 pt-[calc(3.5rem+98vw)] sm:px-8 md:justify-center md:pb-24 md:pt-28">
        <div className="max-w-[640px] md:max-w-[46vw]">
          <div className="mb-5 flex items-center gap-4" data-intro="line">
            <span className="label text-rice">Traditional Japanese tattooing</span>
            <span className="h-[2px] w-16 bg-rice" />
          </div>
          <h1 id="hero-title" className="relative" data-intro="title">
            <span className="display block text-[clamp(4.2rem,11.5vw,11rem)] font-extrabold text-rice" style={{ textShadow: "0.06em 0.06em 0 var(--ink)" }}>
              IREZUMI
            </span>
            <span className="sr-only">— a Japanese tattoo studio in Tokyo</span>
          </h1>
          <div className="mt-4 flex items-start gap-4" data-intro="copy">
            <Hanko chars="入墨彫師" size={58} className="mt-1" />
            <p className="max-w-md font-display text-[clamp(1.25rem,2vw,1.7rem)] font-semibold leading-snug text-rice">
              Ink that outlives the skin.
              <span className="mt-2 block font-body text-base font-normal leading-relaxed text-rice/85">
                Tebori and machine work from a small studio in Shimokitazawa. Dragons, koi, and the long silence between strokes.
              </span>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4" data-intro="cta">
            <a href="#book" className="btn glint">
              Book a consultation
              <span aria-hidden="true">→</span>
            </a>
            <a href="#flash" className="btn btn--ghost glint">
              See the flash
            </a>
          </div>
        </div>
      </div>

      {/* intro curtain — split along the diagonal by the opening slash */}
      <div aria-hidden="true" className="curtain pointer-events-none fixed inset-0 z-[70]">
        <div data-curtain="a" className="absolute inset-0 bg-ink" style={{ clipPath: "polygon(0 0, 100% 0, 100% 30%, 0 78%)" }} />
        <div data-curtain="b" className="absolute inset-0 bg-ink" style={{ clipPath: "polygon(0 78%, 100% 30%, 100% 100%, 0 100%)" }} />
        <div data-curtain="slash" className="absolute left-[-10%] top-1/2 h-[3px] w-[120%] origin-left bg-rice" style={{ transform: "rotate(-24deg) scaleX(0)" }} />
        <div data-curtain="seal" className="absolute inset-0 grid place-items-center">
          <span className="font-display text-[22vw] font-extrabold leading-none text-crimson md:text-[12vw]">墨</span>
        </div>
      </div>
    </section>
  );
}
