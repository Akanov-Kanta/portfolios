import type { ReactNode } from "react";

export type StripZone = "tr" | "l";

/** Zones measured from the frames (x / y / w / h, % of the stage). The CSS in globals.css (ch3-4) mirrors them. */
export const STRIP_ZONES: Record<StripZone, { x: number; y: number; w: number; h: number }> = {
  tr: { x: 37.5, y: 4, w: 58.5, h: 28 }, // t_05.50
  l: { x: 2.3, y: 28.5, w: 59, h: 17 }, // t_06.50
};

interface StripProps {
  zone: StripZone;
  children: ReactNode;
  /** makes the whole strip a link (opens in a new tab) */
  href?: string;
  /** accessible name for the link */
  label?: string;
  className?: string;
  /** extra data attributes for timelines */
  data?: Record<`data-${string}`, string>;
}

/**
 * The hard-edged horizontal "evidence strip": no radius, a hairline light top edge, a drop shadow onto
 * whatever is behind. Positioned by zone class (absolute under motion; in normal flow under reduced
 * motion). Jumps between zones are hard cuts, done by the chapter (show another strip, never tween).
 */
export function Strip({ zone, children, href, label, className = "", data }: StripProps) {
  const cls = `ch34-strip strip-zone-${zone} overflow-hidden ${className}`;
  const style: React.CSSProperties = {
    background: "var(--ink-1)",
    borderTop: "1px solid rgba(240, 240, 240, 0.35)",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
  };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`group block ${cls}`} style={style} {...data}>
        {children}
      </a>
    );
  }
  return (
    <div className={cls} style={style} {...data}>
      {children}
    </div>
  );
}
