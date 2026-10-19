"use client";

import { useEffect, useState } from "react";
import OniMask from "../art/OniMask";
import Hanko from "../art/Hanko";

const LINKS = [
  { href: "#menu", label: "Menu", jp: "品書き" },
  { href: "#story", label: "Story", jp: "物語" },
  { href: "#chef", label: "Chef", jp: "料理長" },
  { href: "#visit", label: "Visit", jp: "場所" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-colors duration-150 ${
          scrolled || open ? "border-b-2 border-gold bg-ink" : "border-b-2 border-transparent bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:h-20 md:px-8" aria-label="Main">
          <a href="#top" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <OniMask className="w-10 transition-transform duration-150 group-hover:-rotate-6 md:w-12" detailed={false} />
            <span className="font-display text-2xl font-extrabold tracking-[0.18em] text-rice md:text-3xl">ONI</span>
            <span className="label hidden text-gold sm:inline">Ramen · Izakaya</span>
          </a>

          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="group relative block py-2">
                  <span className="label text-rice transition-colors group-hover:text-vermilion">{l.label}</span>
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full origin-left scale-x-0 bg-vermilion transition-transform duration-200 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <a href="#reserve" className="btn btn-red hidden !py-2.5 !text-[0.8rem] sm:inline-flex">
              Reserve
            </a>
            <button
              type="button"
              className="relative flex h-11 w-11 items-center justify-center border-2 border-rice bg-ink lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <span
                className={`absolute h-[3px] w-6 bg-rice transition-transform duration-200 ${open ? "rotate-45" : "-translate-y-[5px]"}`}
              />
              <span
                className={`absolute h-[3px] w-6 bg-vermilion transition-transform duration-200 ${open ? "-rotate-45" : "translate-y-[5px]"}`}
              />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-menu"
        inert={!open}
        className="fixed inset-0 z-[70] flex flex-col justify-between overflow-hidden bg-crimson px-6 pb-10 pt-28 lg:hidden"
        style={{
          clipPath: open
            ? "polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)"
            : "polygon(0% 0%, 0% 0%, -30% 100%, -30% 100%)",
          transition: "clip-path 0.55s cubic-bezier(0.8, 0, 0.2, 1)",
        }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-steel" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-[17rem] h-6 w-[140%] -rotate-12 bg-ink" />
        <ul className="relative space-y-3">
          {[...LINKS, { href: "#reserve", label: "Reserve", jp: "予約" }].map((l, i) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 text-rice"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <span className="font-display text-5xl font-extrabold hard-text">{l.label}</span>
                <span className="font-display text-lg text-gold">{l.jp}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="relative flex items-end justify-between">
          <p className="label max-w-[14rem] leading-relaxed text-rice">
            9 Lantern Alley, under the rail bridge. Tue–Sun from 18:00.
          </p>
          <Hanko text="鬼麺" className="w-16" />
        </div>
      </div>
    </>
  );
}
