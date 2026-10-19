"use client";

import { site } from "@/content/site";
import { EYE_STRIP } from "@/content/footage";
import { useClock } from "@/lib/clock";
import { useLenis } from "@/components/providers/SmoothScroll";
import { SectionHead } from "./SectionHead";

/**
 * 04 CONTACT: the edit's eye strip as a still (the hero's footage, bookended), the email set huge in the
 * display face (sized to span the grid), socials in mono, then the colophon with the footage credit.
 * The still is a pre-processed 2x asset (EYE_STRIP.src: the full-quality edit frame, cropped to the eyes,
 * Lanczos 2x, light unsharp, film grain), shown no wider than ~1.3x its pixels so it stays crisp.
 */
export function Contact() {
  const time = useClock();
  const lenis = useLenis();
  return (
    <section id="contact" aria-labelledby="contact-title" className="contact">
      <SectionHead id="contact-title" index="04" title="Contact" note="Write, or find me here" />
      <div className="grid contact-top">
        <figure className="contact-fig">
          {/* eslint-disable-next-line @next/next/no-img-element -- one static, pre-sized still */}
          <img
            className="contact-eye"
            src={EYE_STRIP.src}
            width={EYE_STRIP.w}
            height={EYE_STRIP.h}
            alt="The eye strip from the edit"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <figcaption className="mono">Fig. 02 — The eyes</figcaption>
        </figure>
        <dl className="contact-meta mono">
          <div>
            <dt>Email</dt>
            <dd>{site.email}</dd>
          </div>
          <div>
            <dt>Local</dt>
            <dd>
              <time suppressHydrationWarning>{time}</time> {site.location.utc}
            </dd>
          </div>
          <div>
            <dt>Based</dt>
            <dd>
              {site.location.city}, {site.location.country}
            </dd>
          </div>
        </dl>
      </div>
      <a href={`mailto:${site.email}`} className="contact-email display">
        {site.email}
      </a>
      <ul className="grid contact-socials mono">
        {site.socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noreferrer">
              <span className="cs-k">{s.label}</span>
              <span className="cs-v">
                {s.handle} <span aria-hidden>↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <footer className="grid colophon mono">
        <span className="colo-a">© 2026 {site.name}</span>
        <a className="colo-b" href={site.creditHref} target="_blank" rel="noreferrer">
          {site.credit}
        </a>
        <a
          className="colo-c"
          href="#subject"
          onClick={(e) => {
            e.preventDefault();
            if (lenis) lenis.scrollTo(0, { duration: 1.2 });
            else window.scrollTo(0, 0);
          }}
        >
          Back to top ↑
        </a>
      </footer>
    </section>
  );
}
