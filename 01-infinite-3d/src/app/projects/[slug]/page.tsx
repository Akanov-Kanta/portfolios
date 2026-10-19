import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { accentOf, projectBySlug, site, type Project } from "@/content/site";
import { Scramble } from "@/components/world/hud/Scramble";
import { DeviceCard } from "@/components/home/DeviceCard";
import { NextProject } from "./NextProject";

export function generateStaticParams() {
  return site.projects.map((p) => ({ slug: p.slug }));
}

// every project is prerendered: unknown slugs 404 at the router instead of rendering on demand
export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/projects/[slug]">, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await props.params;
  const p = projectBySlug(slug);
  if (!p) return { title: site.name };
  const title = `${p.name} - ${site.name}`;
  const url = `/projects/${p.slug}`;
  // openGraph / twitter merge shallowly: without these a shared project link previews as the home
  // page; the root share card (app/opengraph-image) is carried over explicitly
  const prev = await parent;
  return {
    title,
    description: p.tagline,
    alternates: { canonical: url },
    openGraph: { title, description: p.tagline, url, siteName: site.name, type: "website", images: prev.openGraph?.images },
    twitter: { card: "summary_large_image", title, description: p.tagline, images: prev.twitter?.images },
  };
}

const pad = (x: number) => String(x).padStart(2, "0");

/*
 * Phones (phone-stations.css, st-detail-* hooks): <main> is the frame-slot root; a header slot from the
 * top zone to 40svh holds the parked device (a DeviceCard until the world is ready), the content starts
 * at 44svh over a bottom-weighted gradient, the links become 44 px chips and 48 px pills, and the bottom
 * padding clears the Dock. Landscape: the slot moves to the right, the content to the left.
 */

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const p = projectBySlug(slug);
  if (!p) notFound();
  const i = site.projects.findIndex((x) => x.slug === slug);
  const n = site.projects.length;
  const accent = accentOf(p, i);
  return (
    <ViewTransition enter="vt-page" exit="vt-page" default="none">
      <main data-slot-root="" className="st-detail station relative min-h-svh px-5 pb-24 pt-32 sm:px-8 lg:px-16" style={{ ["--accent" as string]: accent }}>
        <div data-frame-slot="device" data-project-index="0" aria-hidden="true" className="st-detail-slot hidden phone:flex">
          <DeviceCard name={p.name} accent={accent} screenshot={(p as Project).screenshot} />
        </div>
        {/* Left column only: the camera parks the project device centre-right on inner routes. */}
        <div className="st-detail-body scrim scrim-left max-w-xl">
          <Link href="/#projects" className="st-chip st-back label link-mono link-quiet marker-muted hover:text-ink" data-sfx="tick" data-cursor="link">
            <span aria-hidden="true" className="hidden phone:inline">
              ←
            </span>
            <span className="lm" data-text="Back to projects">
              Back to projects
            </span>
          </Link>

          {/* index strip: every project, current one marked */}
          <nav aria-label="Projects" className="st-detail-index mt-10">
            <ul className="label flex gap-5">
              {site.projects.map((x, k) => (
                <li key={x.slug}>
                  <Link
                    href={`/projects/${x.slug}`}
                    aria-current={k === i ? "page" : undefined}
                    className={`st-chip link-mono link-quiet ${k === i ? "text-ink" : "marker-muted hover:text-ink"}`}
                    data-sfx="tick"
                    data-cursor="link"
                    data-cursor-accent={accentOf(x, k)}
                  >
                    {pad(k + 1)}
                    <span className="sr-only"> {x.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="slash label marker-muted mt-10">
            {p.date}
            <span className="mx-3 opacity-50" aria-hidden="true">
              /
            </span>
            {pad(i + 1)} of {pad(n)}
          </p>
          <ViewTransition name={`title-${p.slug}`} share="vt-title" default="none">
            <h1 className="st-display-l display lockup mt-4 text-5xl sm:text-7xl">
              <Scramble text={p.name} lockup={i} />
              <span className="accent-rule" aria-hidden="true" />
            </h1>
          </ViewTransition>
          <p className="st-tagline prose-ink mt-6 max-w-[38ch] text-xl leading-snug text-ink/90 sm:text-2xl">{p.tagline}</p>
          <p className="marker marker-muted mt-5">
            {p.tags.map((t, k) => (
              <span key={t}>
                {k > 0 && " / "}
                {t}
              </span>
            ))}
          </p>
          <div className="st-detail-desc prose-ink mt-14 max-w-[52ch] space-y-5 text-base leading-relaxed text-ink/90 sm:text-lg">
            <p>{p.description}</p>
          </div>
          <div className="st-detail-links mt-12 flex flex-wrap gap-8">
            {"url" in p && p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" className="st-pill label link-mono" data-sfx="tick" data-cursor="link" data-magnetic>
                <span className="lm" data-text="Visit site">
                  Visit site
                </span>
                <span aria-hidden="true" className="hidden phone:inline">
                  ↗
                </span>
              </a>
            )}
            {"repo" in p && p.repo && (
              <a href={p.repo} target="_blank" rel="noreferrer" className="st-pill label link-mono" data-sfx="tick" data-cursor="link" data-magnetic>
                <span className="lm" data-text="Source">
                  Source
                </span>
                <span aria-hidden="true" className="hidden phone:inline">
                  ↗
                </span>
              </a>
            )}
          </div>
          {n > 1 && <NextProject index={i} />}
        </div>
      </main>
    </ViewTransition>
  );
}
