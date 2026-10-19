"use client";

import { useEffect, useState } from "react";
import { Hanko } from "./art/Scenery";

const LINKS = [
  { href: "#heritage", label: "Heritage", jp: "蔵" },
  { href: "#range", label: "The Range", jp: "酒" },
  { href: "#craft", label: "Craft", jp: "造" },
  { href: "#press", label: "Press", jp: "評" },
  { href: "#buy", label: "Where to buy", jp: "店" },
];

export default function Nav() {
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        solid || open ? "bg-ink" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="KURO — back to top">
          <Hanko className="h-8 w-8" chars={["黒"]} />
          <span className="font-display text-xl font-extrabold tracking-[0.32em] text-rice">KURO</span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="label group relative py-2 text-rice/80 transition-colors hover:text-gold">
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-200 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#buy" className="btn btn-gold !px-4 !py-2.5 max-sm:hidden!">
            <span>Find a bottle</span>
          </a>
          <button
            type="button"
            className="label flex h-10 items-center gap-3 text-rice lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span>{open ? "Close" : "Menu"}</span>
            <span aria-hidden className="relative block h-3 w-6">
              <span
                className={`absolute left-0 top-0 h-px w-6 bg-gold transition-transform duration-200 ${open ? "translate-y-1.5 rotate-[30deg]" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-6 bg-gold transition-transform duration-200 ${open ? "-translate-y-1.5 -rotate-[30deg]" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>
      <div className="h-px bg-gold/50" style={{ opacity: solid ? 1 : 0 }} />

      <div
        id="mobile-menu"
        className="fixed inset-x-0 bottom-0 top-16 bg-ink transition-[clip-path,visibility] duration-500 ease-[cubic-bezier(.8,0,.2,1)] lg:hidden"
        style={{
          clipPath: open
            ? "polygon(0% 0%, 140% 0%, 100% 100%, -40% 100%)"
            : "polygon(0% 0%, 0% 0%, -40% 100%, -40% 100%)",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <ul className="flex h-full flex-col justify-center gap-2 px-8">
          {LINKS.map((l, i) => (
            <li key={l.href} className="border-b border-gold/30">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between py-4 font-display text-3xl font-bold text-rice"
              >
                <span>
                  <span className="label mr-4 text-gold">0{i + 1}</span>
                  {l.label}
                </span>
                <span className="text-xl text-gold">{l.jp}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
