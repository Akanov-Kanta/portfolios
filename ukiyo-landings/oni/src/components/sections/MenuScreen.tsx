"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MENU } from "@/lib/data";
import DishArt from "../art/MenuArt";
import { Dragon, InkCloud, Waves } from "../art/Ornaments";
import { MOTION_OK, SLASH_FROM, SLASH_TO } from "../motion/Motion";

const EXIT = "polygon(130% 0%, 130% 0%, 100% 100%, 100% 100%)";

export default function MenuScreen() {
  const [active, setActive] = useState(0);
  const busy = useRef(false);
  const root = useRef<HTMLElement>(null);
  const wipe = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
        gsap.fromTo(
          panels,
          {
            rotateY: (i: number) => (i % 2 ? -78 : 78),
            transformOrigin: (i: number) => (i % 2 ? "right center" : "left center"),
          },
          {
            rotateY: 0,
            duration: 1.1,
            ease: "power3.out",
            stagger: 0.09,
            clearProps: "transform",
            scrollTrigger: { trigger: "[data-screen]", start: "top 78%", once: true },
          },
        );
      });
    },
    { scope: root },
  );

  function choose(next: number) {
    if (next === active || busy.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !wipe.current) {
      setActive(next);
      return;
    }
    busy.current = true;
    gsap
      .timeline({ onComplete: () => void (busy.current = false) })
      .fromTo(wipe.current, { clipPath: SLASH_FROM }, { clipPath: SLASH_TO, duration: 0.32, ease: "power4.in" })
      .add(() => setActive(next))
      .to(wipe.current, { clipPath: EXIT, duration: 0.42, ease: "power4.out" }, "+=0.06");
  }

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % MENU.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + MENU.length) % MENU.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = MENU.length - 1;
    else return;
    e.preventDefault();
    tabs.current[n]?.focus();
    choose(n);
  };

  const cat = MENU[active];

  return (
    <section ref={root} id="menu" className="relative overflow-clip bg-ink pb-24 pt-28 md:pb-32 md:pt-40">
      {/* giant faint kanji in the field */}
      <p
        aria-hidden="true"
        className="vertical pointer-events-none absolute right-2 top-20 font-display text-[9rem] font-extrabold leading-none text-ink-2 md:right-10 md:text-[14rem]"
      >
        品書
      </p>

      <div className="relative mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p data-reveal="cut" className="label mb-4 flex items-center gap-3 text-gold">
              <span className="inline-block h-[3px] w-10 bg-gold" /> The menu · お品書き
            </p>
            <h2 data-glint className="glint-host font-display text-5xl font-extrabold leading-[0.95] text-rice md:text-7xl">
              <span data-reveal="slash" className="block">
                Eat late.
              </span>
              <span data-reveal="slash" data-delay="0.1" className="block text-vermilion">
                Drink slow.
              </span>
              <span className="glint-line" aria-hidden="true" />
            </h2>
          </div>
          <p data-reveal="cut" className="max-w-sm text-lg text-rice/80">
            Painted on the folding screen behind the counter. Twelve things, done properly — pick a leaf.
          </p>
        </div>

        {/* tabs as hanging plaques */}
        <div role="tablist" aria-label="Menu sections" className="mt-12 flex flex-wrap gap-3 md:mt-16 md:gap-5">
          {MENU.map((c, i) => {
            const on = i === active;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`tab-${c.id}`}
                aria-selected={on}
                aria-controls="menu-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={`group relative flex items-center gap-3 border-2 px-4 py-2.5 transition-[transform,box-shadow] duration-100 md:px-6 md:py-3 ${
                  on
                    ? "-translate-x-0.5 -translate-y-0.5 border-ink bg-vermilion text-ink shadow-[6px_6px_0_0_var(--gold)]"
                    : "border-gold bg-ink-2 text-rice shadow-[4px_4px_0_0_var(--ink)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--gold)]"
                }`}
              >
                <span className="font-display text-xl font-extrabold md:text-2xl">{c.jp}</span>
                <span className="label !text-[0.72rem] md:!text-[0.8rem]">{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* the folding screen */}
        <div data-screen className="relative mt-10 [perspective:1800px] md:mt-12">
          <div className="border-[10px] border-ink-2 bg-ink-2 shadow-[12px_12px_0_0_var(--crimson)] outline outline-2 outline-gold">
            <div
              id="menu-panel"
              role="tabpanel"
              aria-labelledby={`tab-${cat.id}`}
              className="relative grid grid-cols-1 gap-[6px] sm:grid-cols-2 lg:grid-cols-4"
            >
              {cat.items.map((d, i) => (
                <article
                  key={d.id}
                  data-panel
                  className="gold-leaf relative flex sm:min-h-[25rem] flex-col overflow-hidden text-ink lg:min-h-[34rem]"
                >
                  <Dragon
                    className="pointer-events-none absolute top-0 hidden h-full lg:block"
                    style={{ width: "400%", left: `${-i * 100}%` }}
                  />
                  {/* fold shading: alternate leaves catch / lose the light */}
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 ${i % 2 ? "bg-ink/[0.13]" : "bg-rice/[0.07]"}`}
                  />
                  <InkCloud className="pointer-events-none absolute -right-6 top-3 w-40 opacity-60" flip={i % 2 === 1} />
                  <Waves className="pointer-events-none absolute inset-x-0 bottom-0 opacity-50" height={46} />

                  <div className="relative flex flex-1 flex-col p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="label !text-[0.7rem] text-ink/70">
                        {cat.jp} · {String(i + 1).padStart(2, "0")}
                      </span>
                      {d.note && (
                        <span className="label border-2 border-ink bg-rice px-2 py-0.5 !text-[0.65rem] !tracking-[0.16em]">
                          {d.note}
                        </span>
                      )}
                    </div>
                    <DishArt id={d.id} className="mx-auto mt-4 h-32 w-auto md:h-36" />
                    <div className="mt-5 flex flex-1 gap-4">
                      <p className="vertical font-display text-2xl font-extrabold text-crimson">{d.jp}</p>
                      <div className="flex flex-1 flex-col">
                        <h3 className="font-display text-2xl font-extrabold leading-tight">{d.name}</h3>
                        <p className="mt-2 text-[1.05rem] leading-snug text-ink/85">{d.desc}</p>
                        <p className="mt-auto pt-5 pb-8">
                          <span className="inline-block border-2 border-ink bg-vermilion px-3 py-1 font-sans text-xl font-bold tracking-wider text-ink shadow-[4px_4px_0_0_var(--ink)]">
                            {d.price}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              <div
                ref={wipe}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-vermilion"
                style={{ clipPath: SLASH_FROM }}
              >
                <span className="font-display text-[10rem] font-extrabold leading-none text-ink">鬼</span>
              </div>
            </div>
          </div>
          {/* brass corner fittings */}
          {["-left-2 -top-2", "-right-2 -top-2", "-left-2 -bottom-2", "-right-2 -bottom-2"].map((p) => (
            <span key={p} aria-hidden="true" className={`absolute ${p} h-6 w-6 border-2 border-ink bg-gold`} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl text-rice/80">{cat.blurb}</p>
          <p className="label text-gold">Tax included · kitchen closes 30 min before the door</p>
        </div>
      </div>
    </section>
  );
}
