"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { CollageLoop } from "@/components/footage/CollageLoop";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { onHit } from "@/lib/intro";

const META: [string, string][] = [
  ["Role", site.role],
  ["Based", `${site.location.city}, ${site.location.country}`],
  ["Coord", `${site.location.lat} ${site.location.lng}`],
  ["Status", site.availability],
  ["Index", "01 / 04"],
];

/**
 * 01 SUBJECT. The edit's collage block as a poster on the grid:
 *   cols 1–4   the case header in 11 px mono (top) and the one typed caption (bottom, on the frame's
 *              bottom edge)
 *   cols 5–12  the footage, hard-edged, its bottom on the same line as the caption; a figure line under it
 *   full width the name in the display face, sized to span the grid exactly, cropped by the bottom edge
 * Three layers (footage, name, mono) and one mover (the footage). The caption starts 240 ms after the hit.
 */
export function Hero() {
  const cap = useRef<TypeCaptionHandle>(null);

  useEffect(() => onHit(() => cap.current?.play()), []);

  return (
    <section id="subject" aria-labelledby="hero-name" className="hero">
      <div className="grid hero-grid">
        <dl className="hero-meta mono">
          <div className="hero-meta-head">
            <dt>Case file</dt>
            <dd>Nº 001</dd>
          </div>
          {META.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <figure className="hero-fig">
          <CollageLoop className="hero-frame" />
          <figcaption className="hero-figcap mono">
            <span>Fig. 01 — The subject</span>
            <a href={site.creditHref} target="_blank" rel="noreferrer">
              {site.credit}
            </a>
          </figcaption>
        </figure>
        <div className="hero-cap">
          <TypeCaption ref={cap} trigger="manual" delay={0.24} label={site.subject.label} lines={site.subject.lines} />
        </div>
      </div>
      <h1 id="hero-name" className="hero-name display">
        <span className="hero-name-1">Nazar</span> <span className="hero-name-2">Akanov</span>
      </h1>
    </section>
  );
}
