type Stalk = { x: number; w: number; tone: string; lean: number; leaves?: boolean };

const leaf = "M0 0Q34-7 78 2 34 6 0 0z";

/** Sumi-e bamboo grove: flat ink tones layered far→near, nodes as paper gaps. */
export function Bamboo({
  className = "",
  stalks,
  height = 900,
  width = 400,
}: {
  className?: string;
  stalks: Stalk[];
  height?: number;
  width?: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
    >
      {stalks.map((s, i) => {
        const nodes = Array.from({ length: Math.ceil(height / 120) + 1 }, (_, k) => k * 120 + ((i * 37) % 90));
        return (
          <g key={i} transform={`rotate(${s.lean} ${s.x} ${height})`}>
            <rect x={s.x} y={-40} width={s.w} height={height + 80} fill={s.tone} />
            {nodes.map((y) => (
              <g key={y}>
                <rect x={s.x - 1} y={y} width={s.w + 2} height={Math.max(2, s.w * 0.12)} fill="var(--rice)" />
                <rect x={s.x - 2} y={y - Math.max(3, s.w * 0.14)} width={s.w + 4} height={Math.max(3, s.w * 0.14)} fill={s.tone} />
              </g>
            ))}
            {s.leaves &&
              nodes.slice(0, 4).map((y, k) => (
                <g key={`l${k}`} fill={s.tone}>
                  <path d={leaf} transform={`translate(${s.x + s.w} ${y + 4}) rotate(${18 + k * 6}) scale(${0.9 + (k % 2) * 0.3})`} />
                  <path d={leaf} transform={`translate(${s.x + s.w} ${y + 8}) rotate(${42 + k * 5}) scale(0.8)`} />
                  <path d={leaf} transform={`translate(${s.x} ${y + 6}) rotate(${150 - k * 6}) scale(${0.85 + (k % 2) * 0.2})`} />
                </g>
              ))}
          </g>
        );
      })}
    </svg>
  );
}

export const groveLeft: Stalk[] = [
  { x: 40, w: 10, tone: "var(--wash-1)", lean: 1 },
  { x: 120, w: 14, tone: "var(--wash-1)", lean: -1, leaves: true },
  { x: 210, w: 9, tone: "var(--wash-1)", lean: 2 },
  { x: 80, w: 20, tone: "var(--wash-2)", lean: -2, leaves: true },
  { x: 260, w: 16, tone: "var(--wash-2)", lean: 1 },
  { x: 170, w: 28, tone: "var(--wash-3)", lean: 1.5, leaves: true },
  { x: 10, w: 40, tone: "var(--ink)", lean: -1 },
  { x: 330, w: 22, tone: "var(--ink)", lean: 3, leaves: true },
];

export const groveRight: Stalk[] = [
  { x: 60, w: 9, tone: "var(--wash-1)", lean: -1 },
  { x: 150, w: 12, tone: "var(--wash-1)", lean: 1, leaves: true },
  { x: 300, w: 10, tone: "var(--wash-1)", lean: -2 },
  { x: 230, w: 18, tone: "var(--wash-2)", lean: 2, leaves: true },
  { x: 110, w: 22, tone: "var(--wash-2)", lean: -1 },
  { x: 40, w: 30, tone: "var(--wash-3)", lean: -2, leaves: true },
  { x: 330, w: 44, tone: "var(--ink)", lean: 1 },
  { x: 200, w: 14, tone: "var(--ink)", lean: -3, leaves: true },
];
