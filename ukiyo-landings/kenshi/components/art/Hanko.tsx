type Props = {
  glyph?: string;
  size?: number;
  className?: string;
  /** "solid" = rice glyph on red; "outline" = red glyph and frame on the page */
  variant?: "solid" | "outline";
  color?: string;
  title?: string;
};

/** Red square seal. Two-character glyphs are stacked vertically like a real hanko. */
export function Hanko({ glyph = "剣", size = 56, className = "", variant = "solid", color = "var(--vermilion)", title }: Props) {
  const chars = Array.from(glyph);
  const solid = variant === "solid";
  const fs = chars.length > 1 ? 38 : 64;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g filter="url(#rough)">
        {solid ? (
          <rect x="6" y="6" width="88" height="88" rx="6" fill={color} />
        ) : (
          <rect x="9" y="9" width="82" height="82" rx="5" fill="none" stroke={color} strokeWidth="7" />
        )}
        {chars.map((c, i) => (
          <text
            key={i}
            x="50"
            y={chars.length > 1 ? 44 + i * 38 - 4 : 72}
            textAnchor="middle"
            fontSize={fs}
            fontWeight={800}
            fill={solid ? "var(--rice)" : color}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {c}
          </text>
        ))}
      </g>
    </svg>
  );
}

/** Shared SVG defs (rendered once): ink-stamp roughness. */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="1" seed="9" result="holes" />
          <feColorMatrix in="holes" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.6" result="mask" />
          <feComposite in="d" in2="mask" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
