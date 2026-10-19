"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { projectBySlug, site } from "@/content/site";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { closeFile, openFile, readIntent } from "@/lib/fileRoute";
import { sfx } from "@/lib/audio";
import { useLenis } from "@/components/providers/SmoothScroll";
import { Media } from "./Media";

type Box = { left: number; top: number; width: number; height: number };
const FIXED = { position: "fixed", margin: 0, zIndex: 3 } as const;
const box = (r: Box) => ({ left: r.left, top: r.top, width: r.width, height: r.height });
const screen = () => ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
/** the iris: a ring of diameter D centred on the strip, opening to cover the whole screen */
const irisGeom = (from: Box) => {
  const cx = from.left + from.width / 2;
  const cy = from.top + from.height / 2;
  const d = Math.max(40, Math.min(72, from.height * 0.6));
  const R = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy)) + 2;
  return { cx, cy, d, R };
};
const stripOf = (slug: string) => {
  const r = document.querySelector(`[data-strip="${slug}"]`)?.getBoundingClientRect();
  return r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight ? r : null;
};

/**
 * A project FILE: the one polarity flip on the site (black page → paper), carried by one element.
 *
 * Open (from a row): bracket-to-iris (DIRECTION §4, after obys.agency). The strip's viewfinder brackets
 * close on its centre (280 ms, power3.in) and cut to a ring; the ring is an iris that opens over the black
 * page, a circular mask revealing the recording full screen (700 ms, power4.inOut); then a hard cut to
 * paper (0 ms) as the file's text appears, and the plate settles into its slot (600 ms, expo.out). One
 * mover at a time. Deep links start full screen.
 * Close (✕, Esc, Back): the reverse: the plate grows back to full screen (400 ms), cuts to the black page,
 * the iris closes onto the row's strip (600 ms) and the ring opens back into its brackets (240 ms).
 * NEXT FILE swaps files with a hard cut.
 * Reduced motion: no animation, instant swaps.
 *
 * While open: Lenis is stopped, the page behind is `inert` (focus stays in the dialog), Esc closes, and
 * focus returns to the row on close.
 */
export function FileView({ slug, closing, onClosed }: { slug: string; closing: boolean; onClosed: () => void }) {
  const project = projectBySlug(slug)!;
  const i = site.projects.indexOf(project);
  const next = site.projects[(i + 1) % site.projects.length];
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const iris = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const lenis = useLenis();
  const [entry] = useState(readIntent);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  // lock the page while open
  useEffect(() => {
    const page = document.getElementById("page");
    const html = document.documentElement;
    // the class first: making the page inert blurs the row, and the row keeps its strip open while a file is open
    html.classList.add("file-open");
    page?.setAttribute("inert", "");
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFile();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      page?.removeAttribute("inert");
      html.classList.remove("file-open");
      lenis?.start();
      document.querySelector<HTMLElement>(`[data-row="${slug}"]`)?.focus({ preventScroll: true });
    };
  }, [lenis, slug]);

  // open
  useLayoutEffect(() => {
    const el = root.current;
    const pl = plate.current;
    const sl = slot.current;
    if (!el || !pl || !sl) return;
    const mode = entry.mode;
    const settle = () => {
      gsap.set(pl, { clearProps: "position,left,top,width,height,margin,zIndex" });
      closeBtn.current?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion() || mode === "cut") {
      el.dataset.phase = "open";
      settle();
      return;
    }
    const from = mode === "flip" ? stripOf(slug) : null;
    const ir = iris.current;
    el.dataset.phase = "flip";
    const t = gsap.timeline();
    gsap.set(pl, { ...FIXED, ...screen() });
    if (from && ir) {
      const { cx, cy, d, R } = irisGeom(from);
      const st = { r: d / 2 };
      const apply = () => {
        pl.style.clipPath = `circle(${st.r}px at ${cx}px ${cy}px)`;
        gsap.set(ir, { left: cx - st.r, top: cy - st.r, width: st.r * 2, height: st.r * 2 });
      };
      pl.style.clipPath = `circle(0px at ${cx}px ${cy}px)`;
      delete ir.dataset.ring;
      gsap.set(ir, { display: "block", ...box(from) });
      t.to(ir, { left: cx - d / 2, top: cy - d / 2, width: d, height: d, duration: 0.28, ease: "power3.in" });
      t.add(() => {
        ir.dataset.ring = "";
        apply();
      });
      t.to(st, { r: R, duration: 0.7, ease: "power4.inOut", onUpdate: apply });
      t.add(() => {
        gsap.set(ir, { display: "none" });
        pl.style.clipPath = "";
      });
    }
    t.add(() => {
      el.dataset.phase = "open";
      sfx.sweep();
    }, from ? undefined : 0.12);
    t.to(pl, {
      left: () => sl.getBoundingClientRect().left,
      top: () => sl.getBoundingClientRect().top,
      width: () => sl.getBoundingClientRect().width,
      height: () => sl.getBoundingClientRect().height,
      duration: 0.6,
      ease: "expo.out",
    });
    t.add(settle);
    tl.current = t;
    return () => {
      t.kill();
      pl.style.clipPath = "";
      if (ir) gsap.set(ir, { display: "none" });
    };
  }, [slug, entry]);

  // close
  useEffect(() => {
    if (!closing) return;
    const el = root.current;
    const pl = plate.current;
    tl.current?.kill();
    if (!el || !pl || prefersReducedMotion()) {
      onClosedRef.current();
      return;
    }
    const r = pl.getBoundingClientRect();
    const t = gsap.timeline({ onComplete: () => onClosedRef.current() });
    gsap.set(pl, { ...FIXED, ...box(r) });
    t.to(pl, { ...screen(), duration: 0.4, ease: "power3.in" });
    t.add(() => {
      el.dataset.phase = "flip";
      sfx.hit(0.4);
    });
    const to = stripOf(slug);
    const ir = iris.current;
    if (to && ir) {
      const { cx, cy, d, R } = irisGeom(to);
      const st = { r: R };
      const apply = () => {
        pl.style.clipPath = `circle(${st.r}px at ${cx}px ${cy}px)`;
        gsap.set(ir, { left: cx - st.r, top: cy - st.r, width: st.r * 2, height: st.r * 2 });
      };
      t.add(() => {
        ir.dataset.ring = "";
        gsap.set(ir, { display: "block" });
        apply();
      });
      t.to(st, { r: d / 2, duration: 0.6, ease: "power4.inOut", onUpdate: apply });
      t.add(() => {
        gsap.set(pl, { visibility: "hidden" });
        delete ir.dataset.ring;
      });
      t.to(ir, { ...box(to), duration: 0.24, ease: "power3.out" });
      t.add(() => gsap.set(ir, { display: "none" }));
    }
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [closing, slug]);

  const links = [
    project.url ? { label: "Open", href: project.url } : null,
    project.repo ? { label: "Code", href: project.repo } : null,
  ].filter((l): l is { label: string; href: string } => !!l);

  const meta: [string, string][] = [
    ["Date", project.date],
    ["Role", project.role],
    ["Team", project.team],
    ["Stack", project.tags.join(" / ")],
    ["Status", project.status],
  ];
  const n = String(i + 1).padStart(2, "0");
  const hasRec = "rec" in project.media;

  return (
    <div
      ref={root}
      className="file"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-name"
      data-phase="flip"
      data-lenis-prevent
    >
      <div ref={iris} className="vf vf-iris" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="grid file-bar mono file-c">
        <span className="file-bar-n">
          File {n} / {String(site.projects.length).padStart(2, "0")}
        </span>
        <span className="file-bar-t">Case file — {project.name}</span>
        <button ref={closeBtn} type="button" className="file-close" onClick={closeFile}>
          Close <span aria-hidden>✕</span> <span className="max-md:hidden">[Esc]</span>
        </button>
      </div>

      <h2 id="file-name" className="file-name display file-c">
        {project.name}
      </h2>

      <div className="grid file-main">
        <div className="file-side file-c">
          <p className="file-lede">{project.tagline}</p>
          <dl className="file-meta mono">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="file-links">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="file-link display">
                {l.label} <span aria-hidden>↗</span>
              </a>
            ))}
          </div>
        </div>
        <div className="file-slot">
          {/* the box keeps the plate's place in the layout while the plate itself is position: fixed */}
          <div ref={slot} className="file-plate-box">
            <div ref={plate} className="file-plate">
              <Media project={project} variant="plate" startAt={entry.time} />
            </div>
          </div>
          <p className="file-figcap mono file-c">
            Fig. {n}A — {hasRec ? "Screen recording, live site, 10 s" : "Screens"}
          </p>
        </div>
      </div>

      <div className="grid file-more file-c">
        <span className="file-more-k mono">Summary</span>
        <p className="file-desc">{project.description}</p>
      </div>

      {hasRec ? (
        <figure className="grid file-shot file-c">
          <figcaption className="mono">Fig. {n}B — Screenshot</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element -- static grayscale screenshot */}
          <img src={project.media.still} alt={project.media.alt} loading="lazy" decoding="async" className="media" />
        </figure>
      ) : null}

      <a
        href={`?file=${next.slug}`}
        className="grid file-next file-c"
        onClick={(e) => {
          e.preventDefault();
          root.current?.scrollTo(0, 0);
          openFile(next.slug, "cut");
        }}
      >
        <span className="mono file-next-k">Next file</span>
        <span className="display file-next-name">
          {next.name} <span aria-hidden>→</span>
        </span>
      </a>
    </div>
  );
}
