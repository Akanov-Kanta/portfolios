"use client";

import { useEffect, useState } from "react";
import { Hanko } from "./art/Hanko";

const LINKS = [
  { href: "#way", label: "The Way" },
  { href: "#disciplines", label: "Disciplines" },
  { href: "#timetable", label: "Timetable" },
  { href: "#senseis", label: "Senseis" },
  { href: "#membership", label: "Membership" },
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dark = solid || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-150 ${
        dark ? "bg-ink text-rice" : "bg-rice text-ink lg:bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8" aria-label="Main">
        <a href="#top" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Hanko glyph="剣" size={34} />
          <span className="font-display text-xl font-extrabold tracking-[0.32em]">KENSHI</span>
        </a>
        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="label group relative inline-block py-2">
                {l.label}
                <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-vermilion transition-transform duration-150 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <a href="#trial" className="btn btn-red hidden !px-4 !py-2 !text-xs sm:inline-flex">
            Free class
          </a>
          <button
            type="button"
            className="label flex h-10 items-center gap-2 border-2 border-current px-3 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span aria-hidden="true" className="relative block h-3 w-4">
              <span className={`absolute left-0 top-0 h-[2px] w-4 bg-current transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-[2px] w-4 bg-current transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
            </span>
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-16 bg-ink text-rice transition-[clip-path] duration-300 ease-[cubic-bezier(.8,0,.2,1)] lg:hidden ${
          open ? "[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" : "pointer-events-none invisible [clip-path:polygon(0_0,100%_0,100%_0,0_0)]"
        }`}
        aria-hidden={!open}
      >
        <ul className="flex flex-col gap-1 px-6 pt-8">
          {LINKS.map((l, i) => (
            <li key={l.href} className="border-b border-rice/15">
              <a
                href={l.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between py-4 font-display text-3xl"
              >
                {l.label}
                <span className="label text-gold">0{i + 1}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="px-6 pt-8">
          <a href="#trial" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="btn btn-red w-full !border-rice">
            Book a free class
          </a>
        </div>
        <p aria-hidden="true" className="vertical absolute bottom-8 right-6 font-display text-6xl text-crimson">
          剣士
        </p>
      </div>
    </header>
  );
}
