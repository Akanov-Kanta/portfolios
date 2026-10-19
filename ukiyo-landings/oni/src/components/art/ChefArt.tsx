import Steam from "./Steam";

const DROPS: [number, number, number, number][] = [
  [470, 60, 9, -30],
  [520, 110, 7, -10],
  [400, 30, 6, -50],
  [548, 168, 8, 10],
  [330, 22, 5, -70],
  [560, 230, 6, 30],
  [446, 96, 4, -20],
  [500, 40, 4, -40],
  [584, 140, 5, 0],
];

/**
 * Chef mid "yukiri" — the hard flick of the noodle strainer — against a giant vermilion disc.
 * Flat ink silhouette, ink-2 carving, steel rim light, rice slash arc.
 */
export default function ChefArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 720" className={className} aria-hidden="true">
      <g data-depth="0.12">
        <circle cx={330} cy={330} r={270} fill="var(--vermilion)" />
        <path d="M600,330 A270,270 0 0 1 330,600 C470,560 570,460 600,330 Z" fill="var(--crimson)" opacity={0.5} />
      </g>

      {/* slash arc of the strainer + flying water */}
      <g data-chef-slash>
        <path
          d="M574,250 C540,100 360,-10 150,40 C110,50 80,64 52,84 C150,30 380,20 500,150 C530,184 556,220 574,250 Z"
          fill="var(--rice)"
        />
        <path d="M560,230 C520,120 380,40 220,46" fill="none" stroke="var(--steel)" strokeWidth={3} />
      </g>
      <g data-chef-drops fill="var(--steel)">
        {DROPS.map(([x, y, r, rot], i) => (
          <path
            key={i}
            d={`M${x},${y - r * 2.2} C${x + r},${y - r * 0.4} ${x + r},${y + r} ${x},${y + r} C${x - r},${y + r} ${x - r},${y - r * 0.4} ${x},${y - r * 2.2} Z`}
            transform={`rotate(${rot} ${x} ${y})`}
          />
        ))}
      </g>

      <g data-depth="0.04">
        {/* torso */}
        <path d="M120,720 C130,580 170,460 240,420 L300,396 L376,400 C440,416 500,480 520,580 L540,720 Z" fill="var(--ink)" />
        {/* carved folds */}
        <path d="M430,440 C470,500 492,580 500,720 L462,720 C460,610 450,520 430,440 Z" fill="var(--ink-2)" />
        <path d="M200,500 C180,560 170,640 168,720 L196,720 C198,640 206,560 222,500 Z" fill="var(--ink-2)" />
        <path d="M330,560 C350,600 360,660 362,720 L340,720 C338,660 330,610 318,570 Z" fill="var(--ink-2)" />
        {/* happi collar */}
        <path d="M262,414 L330,600 L366,600 L304,404 Z" fill="var(--rice)" />
        <path d="M372,400 L346,520 L362,532 L396,408 Z" fill="var(--rice)" />
        <text
          x={300}
          y={470}
          fontSize={22}
          fill="var(--ink)"
          transform="rotate(-20 300 470)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800, writingMode: "vertical-rl" }}
        >
          鬼麺
        </text>
        {/* neck */}
        <path d="M290,330 L350,326 L360,404 L284,406 Z" fill="var(--ink)" />

        {/* raised arm with sleeve */}
        <path d="M290,420 C240,404 186,372 146,330 L180,290 C214,330 260,360 316,392 Z" fill="var(--ink)" />
        <path d="M262,410 C226,430 196,440 160,436 C190,420 214,400 230,380 Z" fill="var(--ink-2)" />
        <path d="M150,334 L118,190 L154,184 L180,318 Z" fill="var(--ink)" />
        <circle cx={136} cy={182} r={22} fill="var(--ink)" />
        <path d="M146,330 L118,192" stroke="var(--steel)" strokeWidth={3} fill="none" />
        <path d="M290,420 C240,404 186,372 146,330" stroke="var(--steel)" strokeWidth={3} fill="none" />

        {/* tebo strainer */}
        <line x1={132} y1={176} x2={70} y2={84} stroke="var(--ink)" strokeWidth={12} strokeLinecap="round" />
        <g transform="rotate(-56 48 56)">
          <rect x={10} y={30} width={78} height={52} fill="var(--ink)" />
          <ellipse cx={10} cy={56} rx={8} ry={26} fill="var(--rice)" stroke="var(--ink)" strokeWidth={4} />
          <g stroke="var(--rice)" strokeWidth={1.4} opacity={0.6}>
            {[22, 34, 46, 58, 70, 82].map((x) => (
              <line key={x} x1={x} y1={30} x2={x} y2={82} />
            ))}
            {[40, 50, 60, 70].map((y) => (
              <line key={y} x1={10} y1={y} x2={88} y2={y} />
            ))}
          </g>
        </g>

        {/* head in profile, facing left */}
        <path
          d="M372,262 C374,214 340,188 300,192 C272,195 258,214 258,238 L246,262 L258,268 L254,284 L262,292 L258,304 C262,318 276,330 300,334 C324,336 346,326 356,312 C368,300 372,284 372,262 Z"
          fill="var(--ink)"
        />
        <path
          d="M300,192 C272,195 258,214 258,238 L246,262 L258,268 L254,284 L262,292 L258,304 C262,318 276,330 300,334"
          fill="none"
          stroke="var(--steel)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path d="M266,240 L284,236 L280,243 Z" fill="var(--rice)" />
        <path d="M262,232 L288,226" stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
        {/* hachimaki + flying tails */}
        <path d="M262,214 C300,206 340,208 376,226 L374,244 C340,228 300,226 260,232 Z" fill="var(--vermilion)" />
        <path d="M374,226 C420,210 470,186 528,150 C484,206 438,234 380,250 Z" fill="var(--vermilion)" />
        <path d="M376,240 C420,248 478,250 540,232 C484,266 424,270 378,256 Z" fill="var(--crimson)" />
        <circle cx={378} cy={238} r={12} fill="var(--vermilion)" stroke="var(--ink)" strokeWidth={3} />
      </g>

      {/* stockpot rim in the foreground */}
      <path d="M-10,640 L300,640 L300,720 L-10,720 Z" fill="var(--ink-2)" />
      <line x1={-10} y1={641} x2={300} y2={641} stroke="var(--steel)" strokeWidth={4} />
      <Steam x={20} y={420} width={160} height={230} />
    </svg>
  );
}
