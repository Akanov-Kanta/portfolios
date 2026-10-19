type Props = {
  /** 1, 2 or 4 characters. 2 → stacked, 4 → read right column first. */
  text?: string;
  className?: string;
  tone?: "vermilion" | "crimson";
  label?: string;
};

/** Red square seal stamp with a slightly chewed edge. */
export default function Hanko({ text = "鬼", className, tone = "vermilion", label }: Props) {
  const chars = Array.from(text);
  const fill = tone === "vermilion" ? "var(--vermilion)" : "var(--crimson)";
  const font = { fontFamily: "var(--font-display)", fontWeight: 800 } as const;

  let glyphs: React.ReactNode;
  if (chars.length >= 4) {
    // traditional: right column top→bottom, then left column
    const pos = [
      [72, 44],
      [72, 84],
      [30, 44],
      [30, 84],
    ];
    glyphs = chars.slice(0, 4).map((c, i) => (
      <text key={i} x={pos[i][0]} y={pos[i][1]} fontSize={36} textAnchor="middle" style={font} fill="var(--rice)">
        {c}
      </text>
    ));
  } else if (chars.length === 2) {
    glyphs = chars.map((c, i) => (
      <text key={i} x={50} y={46 + i * 38} fontSize={38} textAnchor="middle" style={font} fill="var(--rice)">
        {c}
      </text>
    ));
  } else {
    glyphs = (
      <text x={50} y={72} fontSize={62} textAnchor="middle" style={font} fill="var(--rice)">
        {chars[0]}
      </text>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        d="M5,7 L30,5 L33,7 L70,4 L95,6 L96,30 L94,34 L96,70 L94,95 L66,96 L62,94 L30,96 L6,95 L4,66 L6,62 L4,30 Z"
        fill={fill}
      />
      <path
        d="M12,13 L88,11 L89,88 L12,89 Z"
        fill="none"
        stroke="var(--rice)"
        strokeWidth={3}
        strokeDasharray="70 3 40 2 120 4"
      />
      {glyphs}
      {/* worn spots where the ink didn't take */}
      <circle cx={80} cy={20} r={2.2} fill={fill} />
      <circle cx={22} cy={78} r={1.6} fill={fill} />
      <path d="M60,90 L70,88 L68,91 Z" fill={fill} />
    </svg>
  );
}
