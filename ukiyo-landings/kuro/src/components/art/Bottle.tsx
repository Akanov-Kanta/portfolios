type Shape = "tall" | "round" | "square";

const OUTLINES: Record<Shape, { body: string; shadow: string; rim: string; neckTop: number }> = {
  // 720ml yotsugo bottle: long neck, sloping shoulders
  tall: {
    body: "M101 74 L139 74 L139 214 C139 266 206 276 206 344 L206 732 Q206 752 186 752 L54 752 Q34 752 34 732 L34 344 C34 276 101 266 101 214 Z",
    shadow:
      "M101 74 L116 74 L116 214 C116 262 132 280 112 340 C96 392 92 520 104 752 L54 752 Q34 752 34 732 L34 344 C34 276 101 266 101 214 Z",
    rim: "M134 86 L134 214 C134 270 199 278 199 346 L199 728",
    neckTop: 74,
  },
  // wide-shouldered junmai bottle
  round: {
    body: "M100 92 L140 92 L140 236 C140 300 214 300 214 380 L214 734 Q214 752 196 752 L44 752 Q26 752 26 734 L26 380 C26 300 100 300 100 236 Z",
    shadow:
      "M100 92 L116 92 L116 236 C116 290 130 310 108 372 C92 420 88 540 100 752 L44 752 Q26 752 26 734 L26 380 C26 300 100 300 100 236 Z",
    rim: "M135 104 L135 236 C135 306 207 306 207 384 L207 730",
    neckTop: 92,
  },
  // squared aged-sake flask with cut shoulders
  square: {
    body: "M104 110 L136 110 L136 250 L200 300 L200 736 Q200 752 184 752 L56 752 Q40 752 40 736 L40 300 L104 250 Z",
    shadow:
      "M104 110 L118 110 L118 250 L104 300 C94 420 92 560 102 752 L56 752 Q40 752 40 736 L40 300 L104 250 Z",
    rim: "M131 122 L131 252 L194 302 L194 732",
    neckTop: 110,
  },
};

/* pleated paper hem: a row of small hard zig-zags along the skirt bottom */
const skirt = (top: number) => {
  const pts: string[] = [];
  for (let x = 154, i = 0; x >= 86; x -= 8.5, i++) {
    pts.push(`L${x.toFixed(1)} ${top + (i % 2 ? 84 : 92)}`);
  }
  return pts.join(" ");
};

type Props = {
  shape?: Shape;
  /** Label field colour */
  label?: string;
  /** Ink colour used on the label */
  labelInk?: string;
  kanji?: string;
  sub?: string;
  /** Rim light colour along the lit edge */
  rim?: string;
  className?: string;
  title?: string;
};

export default function Bottle({
  shape = "tall",
  label = "var(--gold)",
  labelInk = "var(--ink)",
  kanji = "黒",
  sub = "純米大吟醸",
  rim = "var(--gold)",
  className,
  title = "Bottle of KURO sake",
}: Props) {
  const o = OUTLINES[shape];
  const capTop = o.neckTop - 62;
  const labelTop = shape === "square" ? 380 : shape === "round" ? 430 : 410;
  return (
    <svg
      viewBox="0 0 240 760"
      className={className}
      role="img"
      aria-label={title}
    >
      {/* hard offset shadow: the same silhouette, flat, pushed down-right */}
      <path d={o.body} transform="translate(14 8)" fill="var(--ink)" opacity="0.55" />
      {/* body: raised indigo, carved by a solid ink shadow shape */}
      <path d={o.body} fill="var(--ink-2)" />
      <path d={o.shadow} fill="var(--ink)" />
      {/* rim light — the blade-glint edge */}
      <path d={o.rim} fill="none" stroke={rim} strokeWidth="3" strokeLinecap="square" />
      <path
        d={o.rim}
        fill="none"
        stroke="var(--rice)"
        strokeWidth="3"
        strokeDasharray="34 900"
        strokeDashoffset="-60"
        data-glint
      />

      {/* cap: washi paper wrap, pleated skirt, tied with a cord */}
      <path
        d={`M98 ${capTop + 30} V${capTop + 8} Q98 ${capTop} 106 ${capTop} H134 Q142 ${capTop} 142 ${capTop + 8} V${capTop + 30} L154 ${capTop + 92} ${skirt(capTop)} L86 ${capTop + 92} Z`}
        fill="var(--rice)"
      />
      <path
        d={`M98 ${capTop + 8} Q98 ${capTop} 106 ${capTop} H118 V${capTop + 30} L112 ${capTop + 92} L86 ${capTop + 92} L98 ${capTop + 30} Z`}
        fill="var(--ink-2)"
        opacity="0.28"
      />
      <path
        d={`M108 ${capTop + 34} L100 ${capTop + 84} M120 ${capTop + 34} L120 ${capTop + 86} M132 ${capTop + 34} L140 ${capTop + 84}`}
        stroke="var(--ink-2)"
        strokeOpacity="0.4"
        strokeWidth="1.4"
      />
      <rect x="96" y={capTop + 26} width="48" height="7" fill={rim} />
      <path
        d={`M144 ${capTop + 30} L152 ${capTop + 66} M144 ${capTop + 30} L160 ${capTop + 58}`}
        stroke={rim}
        strokeWidth="2.6"
        strokeLinecap="square"
      />

      {/* label */}
      <g>
        <rect x="62" y={labelTop + 6} width="128" height="252" fill="var(--ink)" opacity="0.6" />
        <rect x="56" y={labelTop} width="128" height="252" fill={label} />
        <rect
          x="64"
          y={labelTop + 8}
          width="112"
          height="236"
          fill="none"
          stroke={labelInk}
          strokeWidth="1.2"
        />
        <text
          x="120"
          y={labelTop + 112}
          textAnchor="middle"
          fontSize="92"
          fill={labelInk}
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          {kanji}
        </text>
        <text
          x="156"
          y={labelTop + 130}
          fontSize="13"
          fill={labelInk}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            writingMode: "vertical-rl",
            letterSpacing: "4px",
          }}
        >
          {sub}
        </text>
        <rect x="74" y={labelTop + 200} width="26" height="26" fill="var(--vermilion)" />
        <text
          x="87"
          y={labelTop + 219}
          textAnchor="middle"
          fontSize="16"
          fill="var(--rice)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          蔵
        </text>
        <text
          x="108"
          y={labelTop + 216}
          fontSize="9"
          fill={labelInk}
          style={{ fontFamily: "var(--font-condensed)", letterSpacing: "2.5px", fontWeight: 600 }}
        >
          KURO
        </text>
      </g>
    </svg>
  );
}
