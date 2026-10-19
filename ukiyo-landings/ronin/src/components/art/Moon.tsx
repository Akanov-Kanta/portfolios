type MoonProps = { className?: string; tone?: "steel" | "crimson" | "rice" };

const tones = {
  steel: { base: "var(--moon)", shade: "var(--moon-shade)", deep: "var(--steel)", hi: "#d6e8f1" },
  crimson: { base: "var(--crimson)", shade: "var(--crimson-deep)", deep: "#5e0f0f", hi: "#b42a24" },
  rice: { base: "var(--rice)", shade: "var(--wash-1)", deep: "var(--wash-2)", hi: "#f6f2ea" },
};

const craters: [number, number, number][] = [
  [420, 150, 22],
  [250, 470, 18],
  [470, 300, 11],
  [160, 140, 10],
  [110, 340, 14],
];

/** Giant flat moon: base disc, posterized maria shapes, rimmed craters. */
export function Moon({ className = "", tone = "steel" }: MoonProps) {
  const t = tones[tone];
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <circle cx="300" cy="300" r="300" fill={t.base} />
      <clipPath id={`moon-clip-${tone}`}>
        <circle cx="300" cy="300" r="300" />
      </clipPath>
      <g clipPath={`url(#moon-clip-${tone})`}>
        <rect width="600" height="600" fill={t.shade} filter="url(#moonTexA)" />
        <rect width="600" height="600" fill={t.deep} filter="url(#moonTexB)" />
        <rect width="600" height="600" fill={t.deep} filter="url(#moonTexC)" />
      </g>
      {craters.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={t.deep} />
          <circle cx={x + r * 0.25} cy={y + r * 0.22} r={r * 0.8} fill={t.shade} />
        </g>
      ))}
      {/* cold rim highlight on the lit edge */}
      <path d="M470 60a300 300 0 0 1 80 380" fill="none" stroke={t.hi} strokeWidth="7" />
    </svg>
  );
}
