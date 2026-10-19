import { useId } from "react";

/**
 * Red square seal. Text is stacked like a real hanko (two characters / letters, top to bottom,
 * or two columns for four). A turbulence displacement makes the edge look stamped, not drawn.
 */
export function Hanko({
  text,
  size = 64,
  className = "",
  color = "var(--vermilion)",
  ink = "var(--rice)",
  title,
}: {
  text: string;
  size?: number;
  className?: string;
  color?: string;
  ink?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const chars = Array.from(text);
  const two = chars.length <= 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <filter id={`stamp-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="3" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="4.5" />
        </filter>
        <mask id={`wear-${id}`}>
          <rect width="100" height="100" fill="#fff" />
          <circle cx="78" cy="22" r="2.2" fill="#000" />
          <circle cx="16" cy="70" r="1.4" fill="#000" />
          <rect x="60" y="88" width="12" height="2" fill="#000" />
        </mask>
      </defs>
      <g filter={`url(#stamp-${id})`} mask={`url(#wear-${id})`}>
        <rect x="6" y="6" width="88" height="88" rx="5" fill={color} />
        <rect x="13" y="13" width="74" height="74" rx="2" fill="none" stroke={ink} strokeWidth="2.5" />
        {two ? (
          chars.map((c, i) => (
            <text
              key={i}
              x="50"
              y={chars.length === 1 ? 64 : 45 + i * 31}
              textAnchor="middle"
              fontFamily="var(--serif)"
              fontWeight="800"
              fontSize={chars.length === 1 ? 50 : 33}
              fill={ink}
            >
              {c}
            </text>
          ))
        ) : (
          // four characters: right column first, read top to bottom
          chars.slice(0, 4).map((c, i) => (
            <text
              key={i}
              x={i < 2 ? 67 : 33}
              y={i % 2 === 0 ? 46 : 76}
              textAnchor="middle"
              fontFamily="var(--serif)"
              fontWeight="800"
              fontSize="28"
              fill={ink}
            >
              {c}
            </text>
          ))
        )}
      </g>
    </svg>
  );
}
