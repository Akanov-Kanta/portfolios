"use client";

import { useEffect, useState } from "react";
import { Hanko } from "./Hanko";

const links = [
  ["Story", "#story"],
  ["Clans", "#clans"],
  ["Combat", "#combat"],
  ["Trailer", "#trailer"],
  ["Release", "#release"],
];

export function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    const raf = requestAnimationFrame(on);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-150 ${solid ? "bg-ink" : "bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-[4vw] md:h-[72px]">
        <a href="#top" className="flex items-center gap-3" aria-label="RŌNIN — back to top">
          <Hanko size={36} tilt={0} />
          <span className="font-display text-[1.35rem] leading-none font-extrabold tracking-[0.04em] text-rice">
            RŌNIN
          </span>
        </a>
        <nav aria-label="Primary" className="hidden md:block">
          <ul
            className="flex items-center gap-8 bg-ink py-2.5 pr-9 pl-10"
            style={{ clipPath: "polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)" }}
          >
            {links.map(([l, h]) => (
              <li key={h}>
                <a href={h} className="label relative text-rice hover:text-gold">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <span className="btn-wrap">
          <a href="#release" className="btn btn-blade !px-4 !py-3 !text-[0.8rem]">
            Wishlist
          </a>
        </span>
      </div>
      {solid && <div className="h-[3px] bg-crimson" />}
    </header>
  );
}
