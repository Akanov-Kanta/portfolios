import { blobPath, fanPath, seeded, taperedPath } from "@/lib/shapes";

/* ------------------------------------------------------------------ */
/* Giant moon: flat rice disc, posterized maria in flat tonal shapes   */
/* ------------------------------------------------------------------ */
export function Moon({
  className,
  fill = "var(--rice)",
  mare = "var(--steel)",
}: {
  className?: string;
  fill?: string;
  mare?: string;
}) {
  const maria = [
    blobPath(380, 300, 120, 3),
    blobPath(640, 470, 140, 7),
    blobPath(300, 610, 95, 11),
    blobPath(540, 760, 80, 17),
    blobPath(720, 260, 60, 23),
  ];
  const rand = seeded(42);
  const pits = Array.from({ length: 22 }, () => ({
    x: 140 + rand() * 720,
    y: 140 + rand() * 720,
    r: 3 + rand() * 8,
  })).filter((p) => Math.hypot(p.x - 500, p.y - 500) < 420);
  return (
    <svg viewBox="0 0 1000 1000" className={className} aria-hidden>
      <defs>
        <clipPath id="moon-clip">
          <circle cx="500" cy="500" r="490" />
        </clipPath>
      </defs>
      <circle cx="500" cy="500" r="490" fill={fill} />
      <g clipPath="url(#moon-clip)">
        {maria.map((d, i) => (
          <path key={i} d={d} fill={mare} opacity={i % 2 ? 0.14 : 0.2} />
        ))}
        {pits.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={mare} opacity="0.16" />
            <path
              d={`M${(p.x - p.r).toFixed(1)} ${p.y.toFixed(1)} A${p.r.toFixed(1)} ${p.r.toFixed(1)} 0 0 0 ${(p.x + p.r).toFixed(1)} ${p.y.toFixed(1)}`}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.12"
              strokeWidth="1.6"
            />
          </g>
        ))}
        {/* posterized terminator: one flat shadow crescent */}
        <path
          d="M10 500 A490 490 0 0 1 500 10 C300 120 190 300 190 500 C190 700 300 880 500 990 A490 490 0 0 1 10 500 Z"
          fill="var(--ink-2)"
          opacity="0.14"
        />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Kasumi — Rinpa gold mist bands with rounded ends                    */
/* ------------------------------------------------------------------ */
export function Kasumi({
  className,
  fill = "var(--gold)",
  line = "var(--ink)",
}: {
  className?: string;
  fill?: string;
  line?: string;
}) {
  const bands = [
    { x: 40, y: 20, w: 520, h: 34 },
    { x: 180, y: 48, w: 620, h: 40 },
    { x: 0, y: 82, w: 360, h: 30 },
  ];
  return (
    <svg viewBox="0 0 820 130" className={className} aria-hidden>
      {bands.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x + 8}
            y={b.y + 6}
            width={b.w}
            height={b.h}
            rx={b.h / 2}
            fill="var(--ink)"
            opacity="0.5"
          />
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.h / 2} fill={fill} />
          <path
            d={`M${b.x + b.h * 0.7} ${b.y + b.h * 0.62} H${b.x + b.w * 0.55}`}
            stroke={line}
            strokeOpacity="0.35"
            strokeWidth="1.4"
          />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Pine branch silhouette with layered, toothed needle fans            */
/* ------------------------------------------------------------------ */
const PINE_LIMBS: [number, number, number][][] = [
  [
    [830, 26, 42],
    [730, 58, 32],
    [650, 48, 26],
    [566, 98, 20],
    [474, 94, 15],
    [392, 148, 11],
    [304, 160, 7],
    [236, 198, 3],
  ],
  [
    [650, 50, 14],
    [616, 16, 8],
    [566, 2, 3],
  ],
  [
    [566, 100, 12],
    [546, 162, 8],
    [494, 212, 3],
  ],
  [
    [730, 60, 15],
    [712, 132, 9],
    [656, 190, 3],
  ],
  [
    [392, 150, 8],
    [364, 112, 5],
    [322, 92, 2],
  ],
];

const PINE_FANS: [number, number, number, number][] = [
  [236, 192, 46, -8],
  [278, 176, 32, -26],
  [322, 88, 38, -14],
  [356, 100, 26, 12],
  [446, 90, 34, -12],
  [494, 208, 50, 2],
  [536, 192, 34, -22],
  [566, 0, 42, 4],
  [606, 8, 30, -18],
  [656, 186, 52, 4],
  [700, 166, 34, 20],
  [770, 30, 32, 10],
];

export function PineBranch({
  className,
  fill = "var(--ink)",
  back = "var(--ink-2)",
}: {
  className?: string;
  fill?: string;
  back?: string;
}) {
  return (
    <svg viewBox="200 -60 640 320" className={className} aria-hidden>
      {/* back layer of needles: raised indigo, offset for depth */}
      {PINE_FANS.map(([x, y, r, a], i) => (
        <g key={`b${i}`} transform={`translate(${x - r * 0.45} ${y - r * 0.18}) rotate(${a - 8}) scale(1 0.5)`}>
          <path d={fanPath(0, 0, r * 0.9, -90, 176, 26)} fill={back} />
        </g>
      ))}
      {PINE_LIMBS.map((pts, i) => (
        <path key={`l${i}`} d={taperedPath(pts)} fill={fill} />
      ))}
      {PINE_FANS.map(([x, y, r, a], i) => (
        <g key={`f${i}`} transform={`translate(${x} ${y}) rotate(${a}) scale(1 0.52)`}>
          <path d={fanPath(0, 0, r, -90, 176, 28)} fill={fill} />
          <path
            d={`M0 0 L${-r * 0.55} ${-r * 0.62} M0 0 L0 ${-r * 0.8} M0 0 L${r * 0.55} ${-r * 0.62}`}
            stroke={back}
            strokeWidth="2.4"
          />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Tanchō crane in flight — ink silhouette with a vermilion crown      */
/* ------------------------------------------------------------------ */
export function Crane({
  className,
  fill = "var(--ink)",
  crown = "var(--vermilion)",
  flip = false,
}: {
  className?: string;
  fill?: string;
  crown?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 220 140"
      className={className}
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      {/* far wing (raised) with notched primaries */}
      <path
        d="M104 66 C96 44 84 26 58 8 L66 18 L48 10 L60 24 L40 18 L58 32 L42 30 C70 44 90 58 112 70 Z"
        fill={fill}
      />
      {/* body + neck + head + beak */}
      <path
        d="M66 72 C84 60 118 58 142 64 C158 60 172 52 190 48 L198 48 L216 52 L198 54 C182 58 166 66 146 72 C122 82 92 82 66 76 Z"
        fill={fill}
      />
      {/* trailing legs */}
      <path d="M70 72 L4 84 L4 87 L70 78 Z" fill={fill} />
      <path d="M68 70 L10 76 L10 78 L68 74 Z" fill={fill} />
      {/* near wing (lowered stroke) */}
      <path
        d="M118 74 C130 96 120 116 92 134 L102 120 L84 130 L98 114 L80 120 C100 102 108 90 104 74 Z"
        fill={fill}
      />
      <circle cx="194" cy="47" r="3.2" fill={crown} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Distant bird flock                                                  */
/* ------------------------------------------------------------------ */
export function Flock({ className, fill = "var(--ink)" }: { className?: string; fill?: string }) {
  const birds: [number, number, number][] = [
    [20, 60, 1],
    [70, 40, 0.8],
    [110, 70, 0.7],
    [150, 30, 0.6],
    [190, 52, 0.5],
  ];
  return (
    <svg viewBox="0 0 220 100" className={className} aria-hidden>
      {birds.map(([x, y, s], i) => (
        <path
          key={i}
          transform={`translate(${x} ${y}) scale(${s})`}
          d="M0 0 C10 -8 18 -8 24 2 C30 -8 38 -8 48 0 C38 -3 30 0 24 8 C18 0 10 -3 0 0 Z"
          fill={fill}
        />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Seigaiha wave band (ink lines)                                      */
/* ------------------------------------------------------------------ */
export function Seigaiha({
  id,
  className,
  stroke = "var(--ink)",
  fill = "var(--gold)",
  size = 40,
}: {
  id: string;
  className?: string;
  stroke?: string;
  fill?: string;
  size?: number;
}) {
  const s = size;
  const arcs = (cx: number, cy: number) =>
    [1, 0.75, 0.5, 0.25].map((k, i) => (
      <circle key={i} cx={cx} cy={cy} r={(s / 2) * k} fill={i === 0 ? fill : "none"} stroke={stroke} strokeWidth="1.4" />
    ));
  return (
    <svg className={className} aria-hidden preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={s} height={s / 2} patternUnits="userSpaceOnUse">
          <rect width={s} height={s / 2} fill={fill} />
          {arcs(0, 0)}
          {arcs(s, 0)}
          {arcs(s / 2, s / 4)}
          {arcs(0, s / 2)}
          {arcs(s, s / 2)}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Hanko seal (SVG so it scales crisply)                               */
/* ------------------------------------------------------------------ */
export function Hanko({
  className,
  chars = ["黒", "蔵"],
}: {
  className?: string;
  chars?: string[];
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect width="100" height="100" fill="var(--vermilion)" />
      <path
        d="M8 8 H60 M70 8 H92 V52 M92 64 V92 H40 M28 92 H8 V8"
        fill="none"
        stroke="var(--rice)"
        strokeWidth="3.4"
      />
      {chars.length === 1 ? (
        <text
          x="50"
          y="70"
          textAnchor="middle"
          fontSize="58"
          fill="var(--rice)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          {chars[0]}
        </text>
      ) : (
        <>
          <text x="50" y="46" textAnchor="middle" fontSize="36" fill="var(--rice)" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
            {chars[0]}
          </text>
          <text x="50" y="84" textAnchor="middle" fontSize="36" fill="var(--rice)" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
            {chars[1]}
          </text>
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Ink splatter                                                        */
/* ------------------------------------------------------------------ */
export function Splatter({
  className,
  d,
  fill = "var(--ink)",
}: {
  className?: string;
  d: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <path d={d} fill={fill} />
    </svg>
  );
}
