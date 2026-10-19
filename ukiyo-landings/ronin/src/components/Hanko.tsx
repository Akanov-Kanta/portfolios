type HankoProps = {
  chars?: string;
  size?: number;
  className?: string;
  tilt?: number;
};

/** Red square seal stamp. Characters stack top→bottom, right→left like a real seal. */
export function Hanko({ chars = "浪人", size = 56, className = "", tilt = -4 }: HankoProps) {
  const glyphs = Array.from(chars);
  const two = glyphs.length <= 2;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden="true"
    >
      <g filter="url(#rough)">
        <rect x="5" y="5" width="90" height="90" fill="var(--vermilion)" />
        <rect x="13" y="13" width="74" height="74" fill="none" stroke="var(--rice)" strokeWidth="3.5" />
      </g>
      {two ? (
        glyphs.map((g, i) => (
          <text
            key={i}
            x="50"
            y={i === 0 ? 47 : 80}
            textAnchor="middle"
            fontSize="33"
            fontWeight="800"
            fill="var(--rice)"
            style={{ fontFamily: "var(--font-mincho), serif" }}
          >
            {g}
          </text>
        ))
      ) : (
        glyphs.slice(0, 4).map((g, i) => (
          <text
            key={i}
            x={i < 2 ? 68 : 32}
            y={i % 2 === 0 ? 47 : 80}
            textAnchor="middle"
            fontSize="30"
            fontWeight="800"
            fill="var(--rice)"
            style={{ fontFamily: "var(--font-mincho), serif" }}
          >
            {g}
          </text>
        ))
      )}
    </svg>
  );
}
