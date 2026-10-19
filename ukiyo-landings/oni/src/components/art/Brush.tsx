import { useId } from "react";

/** A single loaded sumi brush swipe with dry-brush streaks. */
export default function Brush({ className, color = "var(--ink)" }: { className?: string; color?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 600 90" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <filter id={`r${id}`} x="-5%" y="-30%" width="110%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.6" numOctaves={3} seed={9} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={14} />
        </filter>
      </defs>
      <g filter={`url(#r${id})`} fill={color}>
        <path d="M6,40 C30,8 160,3 330,4 C450,5 540,8 594,20 C599,48 588,74 560,82 C420,88 230,89 60,89 C26,89 3,72 6,40 Z" />
        <path d="M500,80 C550,82 590,84 600,90 L530,90 Z" />
      </g>
      <g stroke="var(--rice)" strokeWidth={2} opacity={0.75}>
        <line x1={140} y1={9} x2={420} y2={8} />
        <line x1={330} y1={84} x2={560} y2={80} />
      </g>
    </svg>
  );
}
