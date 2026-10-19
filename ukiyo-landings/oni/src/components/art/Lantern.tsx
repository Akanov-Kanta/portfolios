import type { SVGProps } from "react";

type GlyphProps = {
  kanji?: string;
  glow?: boolean;
  sway?: boolean;
  tone?: "vermilion" | "rice";
  /** placement inside a parent SVG (lantern box is 100×170, origin = top of cord) */
  x?: number;
  y?: number;
  scale?: number;
};

const ribs = Array.from({ length: 9 }, (_, i) => {
  const y = 36 + i * 10;
  const t = (y - 76) / 52;
  const half = 41 * Math.sqrt(Math.max(0, 1 - t * t));
  return { y, x1: 50 - half, x2: 50 + half };
});

/**
 * Chōchin paper lantern as flat shapes, for use inside any SVG.
 * The glow is a pair of hard-edged translucent discs — no blur.
 */
export function LanternGlyph({ kanji = "鬼", glow = true, sway = false, tone = "vermilion", x = 0, y = 0, scale = 1 }: GlyphProps) {
  const body = tone === "vermilion" ? "var(--vermilion)" : "var(--rice)";
  const shade = tone === "vermilion" ? "var(--crimson)" : "#cfc6b2";
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {glow && (
        <g fill="var(--vermilion)">
          <circle cx={50} cy={76} r={92} opacity={0.12} />
          <circle cx={50} cy={76} r={70} opacity={0.16} />
        </g>
      )}
      <g className={sway ? "animate-sway" : undefined}>
        <line x1={50} y1={0} x2={50} y2={16} stroke="var(--ink)" strokeWidth={3} />
        <rect x={30} y={14} width={40} height={12} fill="var(--ink)" />
        <rect x={30} y={22} width={40} height={3} fill="var(--gold)" />
        <path d="M30,26 C4,40 4,112 30,126 L70,126 C96,112 96,40 70,26 Z" fill={body} />
        <path d="M60,26 L70,26 C96,40 96,112 70,126 L60,126 C78,106 78,46 60,26 Z" fill={shade} />
        <path d="M24,42 C17,60 17,92 24,110" stroke="var(--rice)" strokeWidth={3} fill="none" opacity={0.55} />
        <g stroke="var(--ink)" strokeWidth={1.4} opacity={0.38} fill="none">
          {ribs.map((r) => (
            <path key={r.y} d={`M${r.x1},${r.y} Q50,${r.y + 4} ${r.x2},${r.y}`} />
          ))}
        </g>
        {kanji && (
          <text
            x={50}
            y={92}
            textAnchor="middle"
            fontSize={42}
            fill="var(--ink)"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            {kanji}
          </text>
        )}
        <rect x={32} y={124} width={36} height={10} fill="var(--ink)" />
        <line x1={50} y1={134} x2={50} y2={150} stroke="var(--ink)" strokeWidth={3} />
        <path d="M44,150 L56,150 L58,170 L42,170 Z" fill="var(--ink)" />
      </g>
    </g>
  );
}

type Props = GlyphProps & Omit<SVGProps<SVGSVGElement>, "x" | "y" | "scale">;

/** Standalone lantern SVG. */
export default function Lantern({ kanji, glow, sway, tone, className, ...rest }: Props) {
  return (
    <svg viewBox="-50 -20 200 210" className={className} aria-hidden="true" overflow="visible" {...rest}>
      <LanternGlyph kanji={kanji} glow={glow} sway={sway} tone={tone} />
    </svg>
  );
}
