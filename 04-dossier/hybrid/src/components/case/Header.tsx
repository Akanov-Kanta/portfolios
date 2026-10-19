"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { site } from "@/content/site";
import { useClock } from "@/lib/clock";
import { toggleSound, useSound } from "@/lib/sound";
import { useLenis } from "@/components/providers/SmoothScroll";

export const SECTIONS = [
  { id: "subject", label: "Subject" },
  { id: "files", label: "Files" },
  { id: "profile", label: "Profile" },
  { id: "contact", label: "Contact" },
] as const;

/**
 * The only fixed chrome: one 11 px mono line (name · index · sound · local time). The index marks the
 * section under the viewport's middle.
 *
 * It never sits on top of content it could collide with: at the top of the page it is a transparent line
 * over the hero's empty top band; scrolling down slides it away (220 ms, slam curve); scrolling up brings
 * it back as a solid black band with a hairline (320 ms, expo out). Keyboard focus inside it always shows it.
 * Direction comes from window scroll, which both Lenis and native scrolling drive.
 */
export function Header() {
  const time = useClock();
  const sound = useSound();
  const lenis = useLenis();
  const [active, setActive] = useState<string>("subject");
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const d = y - last;
      const h = el.offsetHeight;
      let state = el.dataset.state ?? "top";
      if (y <= 2) state = "top";
      else if (d > 3 && y > h * 2) state = "hidden";
      else if (d < -3) state = "band";
      else if (state === "top") state = "band";
      if (Math.abs(d) > 3 || y <= 2) last = y;
      if (el.dataset.state !== state) el.dataset.state = state;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => (e: MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.0 });
    else el.scrollIntoView();
    history.replaceState(history.state, "", `#${id}`);
  };

  const n = SECTIONS.findIndex((s) => s.id === active) + 1;

  return (
    <header ref={bar} className="hdr grid mono" data-state="top">
      <a href="#subject" onClick={go("subject")} className="hdr-name">
        {site.name}
      </a>
      <nav aria-label="Sections" className="hdr-nav">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} onClick={go(s.id)} aria-current={active === s.id ? "true" : undefined}>
            <span className="hdr-n">{String(i + 1).padStart(2, "0")}</span> {s.label}
          </a>
        ))}
      </nav>
      <span className="hdr-idx" aria-hidden>
        {String(n).padStart(2, "0")} / {String(SECTIONS.length).padStart(2, "0")}
      </span>
      <button type="button" className="hdr-sound" onClick={toggleSound} aria-pressed={sound}>
        Sound <span className="hdr-sound-v">{sound ? "On" : "Off"}</span>
      </button>
      <span className="hdr-time">
        <span className="max-md:hidden">{site.location.city} </span>
        <time suppressHydrationWarning>{time}</time>
        <span className="max-md:hidden"> {site.location.utc}</span>
      </span>
    </header>
  );
}
