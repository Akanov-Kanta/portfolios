"use client";

import gsap from "gsap";
import { useRef, useState, type KeyboardEvent } from "react";
import Bottle from "../art/Bottle";
import { Kasumi } from "../art/Scenery";

type Sake = {
  id: string;
  kanji: string;
  name: string;
  meaning: string;
  style: string;
  field: string;
  fieldClass?: string;
  disc: string;
  discMare?: boolean;
  label: string;
  labelInk: string;
  rim: string;
  accentText: string;
  shape: "tall" | "round" | "square";
  sub: string;
  lede: string;
  notes: string[];
  pairing: string[];
  specs: [string, string][];
  price: string;
};

const SAKES: Sake[] = [
  {
    id: "tsuki",
    kanji: "月",
    name: "Tsuki",
    meaning: "Moon",
    style: "Junmai Daiginjo",
    field: "var(--steel)",
    disc: "var(--rice)",
    discMare: true,
    label: "var(--rice)",
    labelInk: "var(--ink)",
    rim: "var(--rice)",
    accentText: "text-steel",
    shape: "tall",
    sub: "純米大吟醸",
    lede: "Cold, clear and quiet. Rice milled to its 35% heart, fermented slowly at 8°C. The sake of a winter night with no wind.",
    notes: ["White peach", "Cold pear skin", "Rice steam", "River stone"],
    pairing: ["Hirame sashimi with yuzu", "Steamed clams, sake butter", "Fresh chèvre"],
    specs: [
      ["Polish", "35%"],
      ["Rice", "Yamada Nishiki"],
      ["ABV", "16%"],
      ["Serve", "8–10°C"],
    ],
    price: "¥ 9,800 · 720 ml",
  },
  {
    id: "hi",
    kanji: "緋",
    name: "Hi",
    meaning: "Scarlet",
    style: "Kimoto Junmai",
    field: "var(--crimson)",
    disc: "var(--steel)",
    discMare: true,
    label: "var(--vermilion)",
    labelInk: "var(--rice)",
    rim: "var(--vermilion)",
    accentText: "text-vermilion",
    shape: "round",
    sub: "生酛純米",
    lede: "A wild-yeast kimoto, six weeks in the making. Savory and warm, with an umami spine that opens when the cup is heated.",
    notes: ["Roasted chestnut", "Dried persimmon", "Shiitake broth", "Cedar"],
    pairing: ["Charcoal-grilled eel", "Yakitori with tare", "Aged comté"],
    specs: [
      ["Polish", "60%"],
      ["Rice", "Omachi"],
      ["ABV", "17%"],
      ["Serve", "15°C or 45°C"],
    ],
    price: "¥ 6,400 · 720 ml",
  },
  {
    id: "kin",
    kanji: "金",
    name: "Kin",
    meaning: "Gold",
    style: "Koshu · Aged 10 years",
    field: "var(--gold)",
    fieldClass: "gold-leaf",
    disc: "var(--crimson)",
    label: "var(--ink)",
    labelInk: "var(--gold)",
    rim: "var(--gold-pale)",
    accentText: "text-gold",
    shape: "square",
    sub: "十年熟成古酒",
    lede: "Ten winters asleep in the cellar beneath the kura. Amber in the glass, with flakes of real gold leaf drifting through it.",
    notes: ["Buckwheat honey", "Toasted rice", "Dried fig", "Soy caramel"],
    pairing: ["Duck with sansho", "Blue cheese", "70% dark chocolate"],
    specs: [
      ["Aged", "10 years"],
      ["Rice", "Yamada Nishiki"],
      ["ABV", "18%"],
      ["Serve", "Room temp."],
    ],
    price: "¥ 24,000 · 500 ml",
  },
];

const WIPE_IN = "polygon(0% 0%, 0% 0%, -40% 100%, -40% 100%)";
const WIPE_FULL = "polygon(0% 0%, 140% 0%, 140% 100%, -40% 100%)";
const WIPE_OUT = "polygon(140% 0%, 140% 0%, 140% 100%, 140% 100%)";

export default function Range() {
  const [active, setActive] = useState(0);
  const busy = useRef(false);
  const wipe = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = SAKES[active];

  const select = (i: number) => {
    if (i === active || busy.current) return;
    const motion = document.documentElement.classList.contains("motion");
    if (!motion || !wipe.current) {
      setActive(i);
      return;
    }
    busy.current = true;
    wipe.current.style.background = SAKES[i].field;
    gsap
      .timeline({ onComplete: () => void (busy.current = false) })
      .fromTo(wipe.current, { clipPath: WIPE_IN }, { clipPath: WIPE_FULL, duration: 0.42, ease: "expo.in" })
      .call(() => setActive(i))
      .to(wipe.current, { clipPath: WIPE_OUT, duration: 0.5, ease: "expo.out" }, "+=0.04")
      .fromTo(
        "[data-range-copy] > *",
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" },
        "<",
      )
      .fromTo("[data-range-bottle]", { yPercent: 6 }, { yPercent: 0, duration: 0.8, ease: "power3.out" }, "<");
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + SAKES.length) % SAKES.length;
    tabs.current[next]?.focus();
    select(next);
  };

  return (
    <section
      id="range"
      aria-labelledby="range-title"
      className="relative z-20 -mt-[8vw] bg-ink pt-[calc(8vw+5rem)] pb-28 md:pb-36"
      style={{ clipPath: "polygon(0 0, 100% 8vw, 100% 100%, 0 100%)" }}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label text-gold">The Range · 三つの夜</p>
            <h2 id="range-title" data-reveal className="mt-4 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] font-extrabold">
              Three nights, three sakes.
            </h2>
          </div>
          <p data-rise className="max-w-[40ch] leading-relaxed text-rice/70">
            Each bottle in the Night Series is brewed for one kind of darkness — the clear night, the fire-lit night,
            and the long night of the cellar.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-10">
          {/* tabs */}
          <div
            role="tablist"
            aria-label="KURO sakes"
            aria-orientation="vertical"
            onKeyDown={onKey}
            className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:content-start lg:gap-4"
          >
            {SAKES.map((k, i) => {
              const on = i === active;
              return (
                <button
                  key={k.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  role="tab"
                  id={`tab-${k.id}`}
                  aria-selected={on}
                  aria-controls="range-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(i)}
                  className={`group relative flex flex-col items-center gap-2 py-4 transition-[transform,box-shadow,background-color] duration-150 lg:py-6 ${
                    on ? "bg-rice text-ink" : "bg-ink-2 text-rice hover:-translate-x-0.5 hover:-translate-y-0.5"
                  }`}
                  style={{ boxShadow: on ? `6px 6px 0 ${k.field}` : undefined }}
                >
                  <span className="font-display text-4xl font-extrabold leading-none lg:text-5xl">{k.kanji}</span>
                  <span className="label text-[0.66rem]!">{k.name}</span>
                  {on && <span aria-hidden className="absolute -right-1 -top-1 h-3 w-3 bg-vermilion" />}
                </button>
              );
            })}
          </div>

          {/* stage */}
          <div
            id="range-panel"
            role="tabpanel"
            aria-labelledby={`tab-${s.id}`}
            className="relative grid overflow-hidden bg-ink-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            {/* art field */}
            <div
              className={`relative isolate min-h-[440px] overflow-hidden md:min-h-[640px] ${s.fieldClass ?? ""}`}
              style={{ backgroundColor: s.field }}
            >
              <svg aria-hidden viewBox="0 0 400 400" className="absolute left-1/2 top-[8%] w-[86%] -translate-x-1/2">
                <circle cx="200" cy="200" r="196" fill={s.disc} />
                {s.discMare && (
                  <g fill="var(--ink)" opacity="0.12">
                    <path d="M120 110 C150 80 210 92 214 130 C218 168 168 180 140 168 C112 156 96 134 120 110 Z" />
                    <path d="M230 210 C270 190 320 214 318 252 C316 290 270 300 244 284 C218 268 204 228 230 210 Z" />
                    <circle cx="140" cy="270" r="22" />
                  </g>
                )}
              </svg>
              <div className="absolute left-[-6%] top-[52%] w-[70%]" aria-hidden>
                <Kasumi className="w-full" fill={s.id === "kin" ? "var(--ink)" : "var(--gold)"} line={s.id === "kin" ? "var(--gold)" : "var(--ink)"} />
              </div>
              {/* diagonal ink ground */}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[22%] bg-ink" style={{ clipPath: "polygon(0 40%, 100% 0, 100% 100%, 0 100%)" }} />
              <div data-range-bottle className="absolute bottom-[6%] left-1/2 h-[80%] -translate-x-1/2">
                <Bottle
                  shape={s.shape}
                  label={s.label}
                  labelInk={s.labelInk}
                  rim={s.rim}
                  kanji={s.kanji}
                  sub={s.sub}
                  className="h-full w-auto"
                  title={`KURO ${s.name} bottle`}
                />
              </div>
              <span className="vertical-upright absolute right-4 top-4 font-display text-lg font-bold tracking-[0.4em] text-ink">
                {s.sub}
              </span>
            </div>

            {/* copy */}
            <div data-range-copy className="flex flex-col p-6 sm:p-10 lg:p-12">
              <p className={`label ${s.accentText}`}>
                {s.style}
              </p>
              <h3 className="mt-3 flex items-baseline gap-4 font-display text-[clamp(3rem,6vw,5rem)] leading-none font-extrabold">
                {s.name}
                <span className="label text-rice/60">“{s.meaning}”</span>
              </h3>
              <p className="mt-6 max-w-[44ch] leading-relaxed text-rice/80">{s.lede}</p>

              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                <div>
                  <h4 className="label border-b border-gold/40 pb-2 text-gold">Tasting notes</h4>
                  <ul className="mt-3 space-y-2">
                    {s.notes.map((n) => (
                      <li key={n} className="flex items-center gap-3 text-rice/90">
                        <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-gold" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="label border-b border-gold/40 pb-2 text-gold">At the table</h4>
                  <ul className="mt-3 space-y-2">
                    {s.pairing.map((n) => (
                      <li key={n} className="flex items-center gap-3 text-rice/90">
                        <span aria-hidden className="h-px w-3 bg-gold" />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-2 border-t border-gold/40 sm:grid-cols-4">
                {s.specs.map(([k, v]) => (
                  <div key={k} className="flex flex-col border-b border-gold/20 py-3 sm:border-b-0">
                    <dt className="label order-2 text-[0.62rem]! text-rice/55">{k}</dt>
                    <dd className="font-display text-lg font-bold">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-8">
                <span className="font-display text-lg text-rice/90">{s.price}</span>
                <a href="#buy" className="btn btn-gold">
                  <span>Find {s.name}</span>
                </a>
              </div>
            </div>

            <div ref={wipe} aria-hidden className="pointer-events-none absolute inset-0 z-10" style={{ clipPath: WIPE_IN }} />
          </div>
        </div>
      </div>
    </section>
  );
}
