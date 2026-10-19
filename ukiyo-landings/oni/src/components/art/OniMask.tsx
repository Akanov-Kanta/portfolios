type Props = {
  className?: string;
  title?: string;
  /** draw the steel rim light + extra carving (off for tiny logo sizes) */
  detailed?: boolean;
};

const mirror = (d: string) =>
  d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x: string, y: string) => `${240 - Number(x)},${y}`);

const HORN = "M80,72 C70,48 58,26 36,6 C62,18 90,38 102,60 Z";
const HORN_SHADE = "M80,72 C72,50 60,30 36,6 C56,26 70,46 88,68 Z";
const BROW = "M48,108 L64,90 L70,100 L80,86 L86,100 L98,92 L104,106 L112,122 L104,126 C88,116 70,112 48,116 Z";
const EYE = "M62,128 C76,120 96,124 108,134 C96,146 74,146 62,128 Z";
const CHEEK = "M62,146 Q80,156 98,150 Q86,168 66,162 Z";
const TUSK = "M80,216 L96,218 L86,180 Z";
const FANG = "M88,192 L98,192 L93,212 Z";
const FOLD = "M94,162 C80,174 76,190 82,200";

/** Red oni mask — flat vermilion, crimson carved shadows, ink line. */
export default function OniMask({ className, title, detailed = true }: Props) {
  return (
    <svg
      viewBox="0 0 240 250"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* wild hair behind */}
      <path
        d="M30,132 L18,84 L42,96 L40,52 L66,72 L78,34 L102,62 L120,26 L138,62 L162,34 L174,72 L200,52 L198,96 L222,84 L210,132 Z"
        fill="var(--ink)"
      />
      {/* face */}
      <path
        d="M58,72 C82,56 158,56 182,72 C200,88 206,110 204,128 C216,138 216,162 202,172 C196,208 160,238 120,242 C80,238 44,208 38,172 C24,162 24,138 36,128 C34,110 40,88 58,72 Z"
        fill="var(--vermilion)"
        stroke="var(--ink)"
        strokeWidth={5}
        strokeLinejoin="round"
      />
      {/* carved shadow, light from upper-left */}
      <path
        d="M182,72 C200,88 206,110 204,128 C216,138 216,162 202,172 C196,208 160,238 120,242 C152,222 178,196 186,160 C192,128 192,100 182,72 Z"
        fill="var(--crimson)"
      />
      <path d="M78,82 Q120,66 162,82" fill="none" stroke="var(--crimson)" strokeWidth={6} strokeLinecap="round" />
      <path d="M90,94 Q120,84 150,94" fill="none" stroke="var(--crimson)" strokeWidth={5} strokeLinecap="round" />
      <path d={CHEEK} fill="var(--crimson)" />
      <path d={mirror(CHEEK)} fill="var(--crimson)" />

      {/* horns */}
      <g stroke="var(--ink)" strokeWidth={4} strokeLinejoin="round">
        <path d={HORN} fill="var(--gold)" />
        <path d={mirror(HORN)} fill="var(--gold)" />
      </g>
      <path d={HORN_SHADE} fill="var(--gold-deep, #a9852f)" />
      <path d={mirror(HORN_SHADE)} fill="var(--gold-deep, #a9852f)" />
      <g stroke="var(--ink)" strokeWidth={3} fill="none">
        <path d="M70,52 L86,44 M58,34 L70,28" />
        <path d={mirror("M70,52 L86,44 M58,34 L70,28")} />
      </g>

      {/* brows */}
      <path d={BROW} fill="var(--ink)" />
      <path d={mirror(BROW)} fill="var(--ink)" />

      {/* eyes */}
      <g stroke="var(--ink)" strokeWidth={3.5} strokeLinejoin="round">
        <path d={EYE} fill="var(--gold)" />
        <path d={mirror(EYE)} fill="var(--gold)" />
      </g>
      <circle cx={90} cy={134} r={7} fill="var(--ink)" />
      <circle cx={150} cy={134} r={7} fill="var(--ink)" />
      <circle cx={87.5} cy={131.5} r={2} fill="var(--rice)" />
      <circle cx={147.5} cy={131.5} r={2} fill="var(--rice)" />

      {/* nose */}
      <path
        d="M108,136 C104,152 94,160 98,172 C106,180 134,180 142,172 C146,160 136,152 132,136 Z"
        fill="var(--vermilion)"
        stroke="var(--ink)"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <path d="M132,136 C136,152 146,160 142,172 C138,176 132,178 126,178 C134,166 134,150 132,136 Z" fill="var(--crimson)" />
      <ellipse cx={111} cy={170} rx={6} ry={4} fill="var(--ink)" />
      <ellipse cx={129} cy={170} rx={6} ry={4} fill="var(--ink)" />
      <g fill="none" stroke="var(--ink)" strokeWidth={3.5} strokeLinecap="round">
        <path d={FOLD} />
        <path d={mirror(FOLD)} />
      </g>

      {/* mouth */}
      <path
        d="M72,190 C96,178 144,178 168,190 C162,216 142,228 120,228 C98,228 78,216 72,190 Z"
        fill="var(--ink)"
      />
      <path d="M86,191 L154,191 L150,200 L90,200 Z" fill="var(--rice)" />
      <g stroke="var(--ink)" strokeWidth={2}>
        <line x1={104} y1={190} x2={104} y2={200} />
        <line x1={120} y1={190} x2={120} y2={200} />
        <line x1={136} y1={190} x2={136} y2={200} />
      </g>
      <g fill="var(--rice)" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round">
        <path d={FANG} />
        <path d={mirror(FANG)} />
        <path d={TUSK} />
        <path d={mirror(TUSK)} />
      </g>
      <path d="M98,234 Q120,240 142,234" fill="none" stroke="var(--crimson)" strokeWidth={4} strokeLinecap="round" />

      {detailed && (
        <>
          <path d="M44,112 C38,136 40,168 52,196" fill="none" stroke="var(--steel)" strokeWidth={3} strokeLinecap="round" />
          <path d="M64,74 C76,66 90,62 104,60" fill="none" stroke="var(--rice)" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
          <path d="M50,150 C48,166 52,180 60,192 C56,178 54,166 56,150 Z" fill="var(--rice)" opacity={0.45} />
        </>
      )}
    </svg>
  );
}
