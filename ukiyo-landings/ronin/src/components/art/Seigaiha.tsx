/** Seigaiha wave band — rows of concentric arcs, each row overlapping the one above. */
export function Seigaiha({ className = "", rows = 5, cols = 40 }: { className?: string; rows?: number; cols?: number }) {
  const r = 30;
  const items: { cx: number; cy: number; k: string }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let c = -1; c < cols; c++) {
      items.push({ cx: c * r * 2 + (row % 2 ? r : 0), cy: row * (r / 2) + r, k: `${row}-${c}` });
    }
  }
  return (
    <svg
      viewBox={`0 0 ${cols * r * 2} ${rows * (r / 2) + r}`}
      preserveAspectRatio="xMidYMin slice"
      className={className}
      aria-hidden="true"
    >
      {items.map(({ cx, cy, k }) => (
        <g key={k}>
          <circle cx={cx} cy={cy} r={r} fill="var(--crimson-deep)" />
          {[r - 2, r - 9, r - 16, r - 23].map((rr, i) => (
            <circle key={i} cx={cx} cy={cy} r={rr} fill="none" stroke="var(--crimson)" strokeWidth="3" />
          ))}
        </g>
      ))}
    </svg>
  );
}
