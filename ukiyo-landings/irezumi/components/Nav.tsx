"use client";

import { useEffect, useState } from "react";
import Hanko from "./Hanko";

const LINKS = [
  { href: "#philosophy", en: "Philosophy", jp: "哲学" },
  { href: "#artists", en: "Artists", jp: "彫師" },
  { href: "#flash", en: "Flash", jp: "下絵" },
  { href: "#process", en: "Process", jp: "工程" },
  { href: "#pricing", en: "Pricing", jp: "値段" },
  { href: "#faq", en: "FAQ", jp: "問答" },
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
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-150 ${solid ? "bg-ink" : "bg-transparent"}`}
      style={solid ? { boxShadow: "0 3px 0 0 var(--crimson)" } : undefined}
    >
      <nav className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-8" aria-label="Main">
        <a href="#top" className="flex items-center gap-3" aria-label="Irezumi — back to top">
          <Hanko chars="彫" size={34} />
          <span className="font-display text-lg font-extrabold tracking-[0.3em] text-rice">IREZUMI</span>
        </a>
        <ul className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="group label flex items-baseline gap-1.5 text-rice/85 hover:text-rice">
                <span className="font-display text-[0.7rem] tracking-normal text-vermilion">{l.jp}</span>
                <span className="relative">
                  {l.en}
                  <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-vermilion transition-transform duration-150 group-hover:scale-x-100" />
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <a href="#book" className="btn glint hidden !px-4 !py-2.5 sm:inline-flex" style={{ ["--sh" as string]: "var(--crimson)" }}>
            Book
          </a>
          <button
            type="button"
            className="label flex h-10 items-center gap-2 px-2 text-rice lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-7">
              <span className={`absolute left-0 top-0 h-[3px] w-7 bg-rice transition-transform ${open ? "translate-y-[5px] rotate-[24deg]" : ""}`} />
              <span className={`absolute bottom-0 left-0 h-[3px] w-7 bg-rice transition-transform ${open ? "-translate-y-[4px] -rotate-[24deg]" : ""}`} />
            </span>
            <span className="sr-only sm:not-sr-only">{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="slash-in fixed inset-0 top-16 z-40 overflow-y-auto bg-crimson lg:hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-ink" />
          <ul className="relative flex flex-col gap-1 px-6 pt-8">
            {LINKS.map((l, i) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b-2 border-ink/40 py-4 font-display text-4xl font-extrabold text-rice"
                >
                  <span className="label w-6 text-ink">{String(i + 1).padStart(2, "0")}</span>
                  {l.en}
                  <span className="ml-auto text-xl text-gold">{l.jp}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="relative px-6 py-10">
            <a href="#book" onClick={() => setOpen(false)} className="btn glint">
              Book a consultation
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
