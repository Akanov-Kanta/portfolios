"use client";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";

/**
 * Primary action (email) as a solid shimmer pill, the address with a copy action, availability.
 * Phones (st-contact-* hooks): the copy action is a 44 px target with a copy glyph and a width that never
 * changes with its label (CSS); a copy ticks on Android (OrbStage, in the phone-only chunk, watches the label).
 */
export function ContactStatus() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <div className="st-contact-status mt-7">
      <div className="st-contact-row flex flex-wrap items-center gap-x-5 gap-y-3">
        <Magnetic>
          <a href={`mailto:${site.email}`} className="btn-pill btn-solid" data-cursor="link" data-sfx="tick">
            <span className="btn-shimmer" aria-hidden="true" />
            <span className="relative">Email me</span>
          </a>
        </Magnetic>
        <button type="button" onClick={copy} className="st-copy marker link-mono" aria-live="polite" data-cursor="link" data-sfx="press">
          <span className="lm" data-text={copied ? "Copied to clipboard" : site.email}>
            {copied ? "Copied to clipboard" : site.email}
          </span>
        </button>
      </div>
      <p className="st-contact-avail slash marker mt-5">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-screen align-middle" aria-hidden="true" />
        Available for work
      </p>
    </div>
  );
}
