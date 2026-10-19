import Link from "next/link";
import { site } from "@/content/site";
import { Scramble } from "./Scramble";

/** '[NA]' as strokes on a 44x24 grid. Same paths in app/icon.svg and app/opengraph-image.tsx. */
export const MONOGRAM_D = "M7 3H3V21H7M10.5 20V4L19.5 20V4M23.5 20L28 4L32.5 20M25.1 14.5H30.9M37 3H41V21H37";

export function MonogramMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 44 24" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined} fill="none">
      {title && <title>{title}</title>}
      <path d={MONOGRAM_D} stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

/**
 * Identity mark in the HUD: '[NA]' that opens (max-width, --ease-hard) into the handle on hover or
 * keyboard focus, scrambling as it arrives. The link is named once: "nazarakanov, home".
 */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.handle}, home`}
      data-cursor="link"
      data-sfx="tick"
      className={`monogram pointer-events-auto inline-flex items-center gap-2.5 text-ink ${className}`}
    >
      <MonogramMark className="h-[22px] w-auto" />
      <span className="monogram-word marker text-[13px]" aria-hidden="true">
        <Scramble text={site.handle} replayOnHover />
      </span>
    </Link>
  );
}
