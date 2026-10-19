import { useId } from "react";

/** Line-drawn cloud swirl (kumo) — ink on gold, Rinpa style. */
export function InkCloud({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 260 90" className={className} aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <g fill="none" stroke="var(--ink)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12,70 C8,48 30,36 48,46 C50,24 78,14 94,32 C106,14 140,16 144,40 C164,36 176,54 166,70 Z" fill="var(--gold)" />
        <path d="M48,46 C40,56 52,66 60,58 C66,52 60,44 54,48" />
        <path d="M94,32 C86,44 98,52 106,46 C112,40 106,34 100,38" />
        <path d="M144,40 C136,50 146,58 154,54" />
        <path d="M166,70 C190,70 210,62 248,66" />
        <path d="M12,70 C2,72 -4,78 4,82 L120,82" />
        <path d="M60,76 L150,76" opacity={0.6} />
      </g>
    </svg>
  );
}

/** Seigaiha wave band — repeating concentric arcs. */
export function Waves({ className, height = 60 }: { className?: string; height?: number }) {
  const id = useId().replace(/:/g, "");
  const scale = (r: number) => [r, r * 0.72, r * 0.46, r * 0.2];
  const arcSet = (cx: number, cy: number) =>
    scale(19).map((r, i) => (
      <circle
        key={`${cx}-${cy}-${i}`}
        cx={cx}
        cy={cy}
        r={r}
        fill={i === 0 ? "var(--gold)" : "none"}
        stroke="var(--ink)"
        strokeWidth={1.6}
      />
    ));
  return (
    <svg className={className} width="100%" height={height} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={`w${id}`} width={40} height={20} patternUnits="userSpaceOnUse">
          {arcSet(20, 10)}
          {arcSet(0, 20)}
          {arcSet(40, 20)}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#w${id})`} />
    </svg>
  );
}

const BODY = "M-60,600 C100,430 230,660 420,540 S700,250 870,370 S1130,610 1290,430 S1430,190 1500,200";

/** Faint line-art dragon that spans the whole folding screen (each panel shows its slice). */
export function Dragon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="none" className={className} style={style} aria-hidden="true">
      <g opacity={0.2} fill="none" strokeLinecap="butt">
        <path d={BODY} stroke="var(--ink)" strokeWidth={70} strokeDasharray="5 15" />
        <path d={BODY} stroke="var(--ink)" strokeWidth={50} />
        <path d={BODY} stroke="var(--gold)" strokeWidth={42} />
        <path d={BODY} stroke="var(--ink)" strokeWidth={42} strokeDasharray="2.5 11" />
        <path d={BODY} stroke="var(--gold)" strokeWidth={14} />
        {/* claws */}
        <g stroke="var(--ink)" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M520,486 L500,540 L470,552 M500,540 L494,568 M500,540 L520,566" />
          <path d="M760,300 L800,250 L830,252 M800,250 L796,222 M800,250 L776,232" />
          <path d="M1180,560 L1160,612 L1130,622 M1160,612 L1156,640 M1160,612 L1182,636" />
          <path d="M230,560 L200,610 L170,612 M200,610 L194,640 M200,610 L222,632" />
        </g>
        {/* head */}
        <g transform="translate(1490 196) rotate(-18)" stroke="var(--ink)" strokeWidth={5} strokeLinejoin="round">
          <path d="M-10,-28 L-60,-60 L-30,-20 L-80,-30 L-30,0 L-84,12 L-28,22 L-70,46 L-10,34 Z" fill="var(--ink)" />
          <path
            d="M0,-20 C30,-46 80,-48 116,-26 L150,-16 C142,-2 124,4 104,2 L134,26 C102,40 60,36 40,28 C18,40 -6,28 0,-20 Z"
            fill="var(--gold)"
          />
          <path d="M104,2 L112,12 L118,4 L124,14 L130,6" fill="none" strokeWidth={3} />
          <circle cx={70} cy={-22} r={8} fill="var(--rice)" />
          <circle cx={73} cy={-22} r={3.5} fill="var(--ink)" stroke="none" />
          <path d="M40,-40 C30,-90 4,-110 -30,-130 M28,-80 L52,-104 M8,-100 L-2,-124" fill="none" strokeWidth={6} strokeLinecap="round" />
          <path d="M140,-12 C200,-60 240,0 300,-46" fill="none" strokeWidth={3} strokeLinecap="round" />
          <path d="M126,24 C190,64 230,30 290,74" fill="none" strokeWidth={3} strokeLinecap="round" />
        </g>
        {/* pearl */}
        <circle cx={1560} cy={420} r={26} fill="none" stroke="var(--ink)" strokeWidth={4} />
        <path d="M1540,412 C1548,398 1566,396 1574,406" fill="none" stroke="var(--ink)" strokeWidth={3} />
      </g>
    </svg>
  );
}
