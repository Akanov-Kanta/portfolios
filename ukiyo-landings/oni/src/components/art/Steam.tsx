import { useId, type SVGProps } from "react";

type Props = { color?: string; strokes?: number } & SVGProps<SVGSVGElement>;

const PATHS = [
  "M40,240 C10,200 70,170 40,130 C14,96 64,70 44,30 C38,18 40,8 46,0",
  "M80,240 C110,206 52,178 82,140 C106,110 60,82 86,44 C92,32 90,18 84,6",
  "M118,240 C96,212 136,190 116,156 C100,128 134,104 120,74",
];

/** Rising steam as dry-brush strokes (roughened with turbulence, drawn on with dashes). */
export default function Steam({ className, color = "var(--rice)", strokes = 3, ...rest }: Props) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 160 250" className={className} aria-hidden="true" overflow="visible" {...rest}>
      <defs>
        <filter id={`b${id}`} x="-20%" y="-10%" width="140%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves={2} seed={4} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={6} />
        </filter>
      </defs>
      <g fill="none" stroke={color} strokeLinecap="round" filter={`url(#b${id})`}>
        {PATHS.slice(0, strokes).map((d, i) => (
          <path
            key={d}
            d={d}
            strokeWidth={[13, 9, 6][i]}
            className="steam-stroke"
            style={{ animationDelay: `${i * 1.3}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
