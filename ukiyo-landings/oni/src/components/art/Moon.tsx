import { useId } from "react";

type Props = { className?: string; tone?: "steel" | "rice" };

/** Giant posterized moon: one flat disc, flat maria and craters — no gradients. */
export default function Moon({ className, tone = "steel" }: Props) {
  const id = useId().replace(/:/g, "");
  const base = tone === "steel" ? "var(--steel)" : "var(--rice)";
  const dark = tone === "steel" ? "var(--ink-2)" : "var(--gold)";
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`m${id}`}>
          <circle cx={200} cy={200} r={198} />
        </clipPath>
      </defs>
      <circle cx={200} cy={200} r={198} fill={base} />
      <g clipPath={`url(#m${id})`}>
        {/* highland light patches */}
        <g fill="var(--rice)" opacity={0.3}>
          <path d="M60,150 C80,90 170,70 200,110 C222,140 170,186 130,190 C96,194 50,190 60,150 Z" />
          <path d="M250,300 C280,280 340,290 350,330 C356,362 300,380 270,364 C246,350 232,316 250,300 Z" />
          <path d="M150,330 C170,320 200,330 196,350 C192,366 162,370 150,358 C140,348 140,336 150,330 Z" />
        </g>
        {/* maria */}
        <g fill={dark} opacity={0.32}>
          <path d="M226,74 C268,54 330,86 322,136 C316,176 270,170 248,158 C222,144 196,96 226,74 Z" />
          <path d="M120,220 C160,196 238,224 236,276 C234,322 172,330 144,306 C116,282 92,238 120,220 Z" />
          <path d="M276,196 C298,182 336,194 338,222 C340,248 306,258 288,246 C272,234 260,208 276,196 Z" />
          <path d="M40,250 C58,236 86,250 84,276 C82,296 54,300 44,286 C34,272 30,258 40,250 Z" />
          <path d="M330,120 C344,116 362,128 360,146 C356,160 340,160 332,150 C324,140 322,124 330,120 Z" />
        </g>
        {/* craters: dark bowl + light lip */}
        {[
          [110, 120, 14],
          [300, 60, 9],
          [180, 170, 7],
          [330, 280, 12],
          [92, 320, 10],
          [214, 380, 16],
          [260, 120, 6],
        ].map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r} fill={dark} opacity={0.4} />
            <path
              d={`M${x - r},${y} A${r},${r} 0 0 0 ${x + r},${y}`}
              fill="none"
              stroke="var(--rice)"
              strokeWidth={2.5}
              opacity={0.55}
            />
          </g>
        ))}
        {/* cut shadow on lower-right rim */}
        <path d="M398,200 A198,198 0 0 1 200,398 C300,360 370,290 398,200 Z" fill={dark} opacity={0.22} />
      </g>
    </svg>
  );
}
