import Link from "next/link";
import { ViewTransition } from "react";
import { accentOf, site, type Project } from "@/content/site";
import { ScrambleOnView } from "@/components/world/hud/ScrambleOnView";
import { Magnetic } from "@/components/ui/Magnetic";
import { DeviceCard } from "./DeviceCard";

/**
 * One 100svh stop per project. The section height drives how long the camera
 * spends descending the device stack in the 3D scene (data-stops = count).
 * Text mirrors the device: it sits on the side the device leaves free.
 * Each project carries its accent (accentOf: its own override, else theme.projectAccent):
 * the title underline and the cursor only; cyan stays the system colour.
 *
 * View transitions (home <-> /projects/[slug]): each title morphs into the detail H1
 * ('vt-title'); the rest of the page crossfades (root + the detail page's 'vt-page').
 * The home page is kept alive across the navigation, so it has no enter/exit of its own.
 *
 * Phones (phone-stations.css, st-proj-* hooks): the device floats in a frame slot at the top (the
 * camera lens-shifts it there, measured against the article, its data-slot-root) and the caption
 * sits left-aligned at the bottom over a gradient, clear of the Dock. Tapping the device opens the
 * project: the slot is a duplicate of the pill hidden from assistive tech and Tab (aria-hidden,
 * tabIndex -1), holding a DeviceCard until the world is ready.
 *
 * Desktop: clicking the 3D device opens the project too. [data-device-link] is another such duplicate,
 * fixed and invisible until the world keeps it over the device's on-screen box (scenes/device-link.ts).
 * The caption card is positioned and comes later, so where the two overlap the card wins.
 */
export function Projects() {
  const n = site.projects.length;
  return (
    <section id="projects" data-station="projects" data-stops={n} className="station">
      <h2 className="sr-only">Projects</h2>
      {site.projects.map((p, i) => {
        const right = i % 2 === 1;
        const accent = accentOf(p, i);
        return (
          <article
            key={p.slug}
            id={`project-${p.slug}`}
            data-slot-root=""
            className="st-proj dz-scope relative flex min-h-svh items-center"
            style={{ ["--accent" as string]: accent }}
          >
            <Link
              href={`/projects/${p.slug}`}
              data-frame-slot="device"
              data-project-index={i}
              aria-hidden="true"
              tabIndex={-1}
              data-sfx="tick"
              className="st-proj-slot hidden phone:flex"
            >
              <DeviceCard name={p.name} accent={accent} screenshot={(p as Project).screenshot} />
            </Link>
            <Link
              href={`/projects/${p.slug}`}
              data-device-link={p.slug}
              aria-hidden="true"
              tabIndex={-1}
              data-cursor="open"
              data-cursor-text="OPEN"
              data-cursor-accent={accent}
              data-sfx="tick"
              className="invisible fixed left-0 top-0 z-0 phone:hidden"
            />
            <div className={`st-proj-caption scrim w-full px-5 sm:px-8 ${right ? "scrim-right text-right sm:pr-20" : "scrim-left"}`}>
              <div className={`st-proj-card dissolve relative max-w-lg ${right ? "ml-auto" : ""}`}>
                <p className="reveal slash label marker-muted mb-4">
                  {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                  <span className="mx-3 opacity-50" aria-hidden="true">
                    ·
                  </span>
                  {p.date}
                </p>
                {/* shared with the detail page's H1: the title morphs across the navigation */}
                <ViewTransition name={`title-${p.slug}`} share="vt-title" default="none">
                  <h3 className="st-display-l reveal display lockup text-5xl text-ink sm:text-6xl md:text-7xl" style={{ ["--i" as string]: 1 }}>
                    <ScrambleOnView text={p.name} lockup={i} />
                    <span className="accent-rule" aria-hidden="true" />
                  </h3>
                </ViewTransition>
                <p className="st-tagline reveal prose-ink mt-5 max-w-md text-lg leading-snug text-ink/90 sm:text-xl" style={{ ["--i" as string]: 2 }}>
                  {p.tagline}
                </p>
                <p className={`st-proj-tags reveal marker marker-muted mt-4 ${right ? "ml-auto" : ""}`} style={{ ["--i" as string]: 3 }}>
                  {p.tags.map((t, k) => (
                    <span key={t}>
                      {k > 0 && " / "}
                      {t}
                    </span>
                  ))}
                </p>
                <Magnetic className="st-proj-cta mt-8">
                  <Link
                    href={`/projects/${p.slug}`}
                    className="btn-pill btn-glass"
                    aria-label={`Open project ${p.name}`}
                    data-cursor="open"
                    data-cursor-text="OPEN"
                    data-cursor-accent={accent}
                    data-sfx="tick"
                  >
                    Open project
                    <span aria-hidden="true" className="btn-arrow">
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                    </span>
                  </Link>
                </Magnetic>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
