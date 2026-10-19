"use client";

import { useRef, useState, type MouseEvent } from "react";
import type { SiteProject } from "@/content/site";
import { gsap, MQ } from "@/lib/gsap";
import { scramble, unscramble } from "@/lib/scramble";
import { openFile } from "@/lib/fileRoute";
import { prefersReducedMotion } from "@/lib/motion";
import { Media } from "./Media";

const CLOSED = "inset(0% 100% 0% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";

/**
 * One INDEX row (Locomotive's type list on hairlines): the project's name in the display face, mono
 * metadata left (index, year, team, status) and its one-line pitch right. Hover or keyboard focus slams
 * the evidence strip in over the pitch: clip-path wipe in 180 ms on the slam curve, then 2 frames of
 * ±6 px, never a loop; the recording plays only while the strip is open, and the left metadata decodes
 * (scramble, 450 ms). The viewfinder brackets cut in as the slam lands (180 ms). Leaving is a hard cut.
 * Click / Enter opens the file through the brackets (FileView: bracket-to-iris).
 * Phones and coarse pointers: the strip is a static still under the name, always visible.
 */
export function FileRow({ project, index, total }: { project: SiteProject; index: number; total: number }) {
  const strip = useRef<HTMLDivElement>(null);
  const meta = useRef<HTMLDListElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const hoverable = () => typeof window !== "undefined" && window.matchMedia(`${MQ.finePointer} and (min-width: 768px)`).matches;

  const activate = () => {
    if (active || !hoverable()) return;
    setActive(true);
    const el = strip.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: OPEN });
      return;
    }
    gsap
      .timeline()
      .fromTo(el, { clipPath: CLOSED, x: 0 }, { clipPath: OPEN, duration: 0.18, ease: "power3.in" })
      .set(el, { x: 6 }, "+=0.017")
      .set(el, { x: -6 }, "+=0.017")
      .set(el, { x: 0 }, "+=0.017");
    meta.current?.querySelectorAll<HTMLElement>("[data-scramble]").forEach((m) => scramble(m, 0.45));
  };

  const deactivate = () => {
    // a file opening from this row makes the page inert (which blurs it): the strip stays, the iris opens on it
    if (!active || document.documentElement.classList.contains("file-open")) return;
    setActive(false);
    meta.current?.querySelectorAll<HTMLElement>("[data-scramble]").forEach(unscramble);
    const el = strip.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { clipPath: CLOSED, x: 0 });
  };

  const open = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    openFile(project.slug, "flip", video.current?.currentTime ?? 0);
  };

  const n = String(index + 1).padStart(2, "0");
  return (
    <li className="row-li">
      <a
        href={`?file=${project.slug}`}
        className="row grid"
        data-row={project.slug}
        data-active={active ? "" : undefined}
        onPointerEnter={activate}
        onPointerLeave={deactivate}
        onFocus={activate}
        onBlur={deactivate}
        onClick={open}
        aria-label={`File ${n} of ${String(total).padStart(2, "0")}: ${project.name}, ${project.date}. ${project.tagline} Open file.`}
      >
        <dl ref={meta} className="row-meta mono" aria-hidden>
          <div>
            <dt>File</dt>
            <dd data-scramble>F—{n}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd data-scramble>{project.date}</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd data-scramble>{project.team}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd data-scramble>{project.status}</dd>
          </div>
        </dl>
        <span className="row-name display" aria-hidden>
          {project.name}
        </span>
        <span className="row-pitch mono" aria-hidden>
          <span>{project.tagline}</span>
          <span className="row-stack">{project.tags.join(" / ")}</span>
          <span className="row-open">Open file →</span>
        </span>
        <div ref={strip} className="row-strip" data-strip={project.slug} aria-hidden>
          <Media project={project} variant="strip" active={active} ref={video} />
        </div>
        {/* the viewfinder: four brackets around the strip, cut in once the slam lands (the file opens through them) */}
        <span className="vf row-vf" aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </span>
      </a>
    </li>
  );
}
