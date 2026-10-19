import { burstPath, cloudCurl, seeded } from "@/lib/shapes";

const display = { fontFamily: "var(--font-display)", fontWeight: 800 } as const;
const condensed = { fontFamily: "var(--font-condensed)", fontWeight: 600 } as const;

/* ------------------------------------------------------------------ */
/* Kura — the brewery storehouse with namako-kabe and a sugidama ball  */
/* ------------------------------------------------------------------ */
export function Kura({ className }: { className?: string }) {
  const roof =
    "M50 226 Q78 214 104 206 L150 142 L450 142 L496 206 Q522 214 550 226 L550 236 L50 236 Z";
  return (
    <svg viewBox="0 0 600 580" className={className} role="img" aria-label="The Kurosawa brewery storehouse">
      <defs>
        <pattern
          id="namako"
          width="34"
          height="34"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="34" height="34" fill="var(--ink)" />
          <rect x="0" y="0" width="34" height="34" fill="none" stroke="var(--rice)" strokeWidth="5" />
        </pattern>
        <clipPath id="roof-clip">
          <path d={roof} />
        </clipPath>
      </defs>

      {/* the giant gold disc behind the house */}
      <circle cx="390" cy="210" r="190" fill="var(--gold)" />
      <circle cx="390" cy="210" r="190" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="2 7" />


      {/* plaster wall (white) */}
      <rect x="114" y="230" width="372" height="132" fill="var(--rice)" stroke="var(--ink)" strokeWidth="4" />
      {/* eave shadow: flat, hard edged */}
      <path d="M114 230 H486 V252 L440 262 L300 254 L160 264 L114 256 Z" fill="var(--ink)" />

      {/* namako-kabe lower wall */}
      <rect x="114" y="362" width="372" height="178" fill="url(#namako)" stroke="var(--ink)" strokeWidth="4" />
      <rect x="114" y="356" width="372" height="12" fill="var(--ink)" />

      {/* window with gold light */}
      <path d="M244 276 H356 L366 290 H234 Z" fill="var(--ink)" />
      <rect x="258" y="292" width="84" height="52" fill="var(--gold)" stroke="var(--ink)" strokeWidth="4" />
      <path d="M279 292 V344 M300 292 V344 M321 292 V344" stroke="var(--ink)" strokeWidth="5" />

      {/* heavy door + noren */}
      <rect x="262" y="408" width="76" height="132" fill="var(--ink)" />
      <rect x="250" y="400" width="100" height="10" fill="var(--ink)" />
      <g>
        <rect x="256" y="410" width="28" height="70" fill="var(--ink-2)" />
        <rect x="286" y="410" width="28" height="70" fill="var(--ink-2)" />
        <rect x="316" y="410" width="28" height="70" fill="var(--ink-2)" />
        <text x="300" y="456" textAnchor="middle" fontSize="30" fill="var(--rice)" style={display}>
          酒
        </text>
      </g>

      {/* roof */}
      <path d={roof} fill="var(--ink)" />
      <g clipPath="url(#roof-clip)" stroke="var(--ink-2)" strokeWidth="5">
        {Array.from({ length: 34 }, (_, i) => (
          <path key={i} d={`M${86 + i * 13.5} 140 V240`} />
        ))}
      </g>
      <path d="M50 226 Q78 214 104 206 L496 206 Q522 214 550 226" fill="none" stroke="var(--gold)" strokeWidth="2.5" />
      {/* ridge with onigawara end blocks */}
      <rect x="140" y="124" width="320" height="20" fill="var(--ink)" />
      <path d="M128 144 L124 102 L162 116 L162 144 Z" fill="var(--ink)" />
      <path d="M472 144 L476 102 L438 116 L438 144 Z" fill="var(--ink)" />
      <rect x="140" y="130" width="320" height="3" fill="var(--gold)" />

      {/* sugidama — the cedar ball that announces new sake */}
      <path d="M176 236 V292" stroke="var(--ink)" strokeWidth="3" />
      <path d={burstPath(176, 324, 36, 29, 26)} fill="var(--gold-deep)" stroke="var(--ink)" strokeWidth="2.5" />
      <path d="M150 312 Q176 300 202 312 M146 330 Q176 318 206 330 M152 346 Q176 336 200 346" fill="none" stroke="var(--ink)" strokeWidth="2" />

      {/* ground */}
      <rect x="0" y="540" width="600" height="40" fill="var(--ink)" />
      <path d="M0 540 L600 540" stroke="var(--gold)" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Folding-screen panels — ink line drawings on gold leaf              */
/* ------------------------------------------------------------------ */
const inkLine = {
  fill: "none",
  stroke: "var(--ink)",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Curls({ items }: { items: [number, number, number, number][] }) {
  return (
    <g {...inkLine} strokeWidth={2}>
      {items.map(([x, y, r, dir], i) => (
        <path key={i} d={cloudCurl(x, y, r, dir)} data-draw />
      ))}
    </g>
  );
}

export function PanelRice({ className }: { className?: string }) {
  const stalks = [
    { x: 70, top: 190, lean: 70 },
    { x: 120, top: 150, lean: 80 },
    { x: 165, top: 175, lean: 64 },
    { x: 210, top: 140, lean: 58 },
    { x: 245, top: 205, lean: 40 },
  ];
  return (
    <svg viewBox="0 0 300 520" className={className} role="img" aria-label="Yamada Nishiki rice stalks heavy with grain">
      <Curls items={[[60, 70, 22, 1], [230, 56, 18, -1]]} />
      {stalks.map((s, i) => {
        const hx = s.x + s.lean * 0.4;
        const stem = `M${s.x} 470 C${s.x - 6} 380 ${s.x - 4} ${s.top + 60} ${hx} ${s.top}`;
        const grains = Array.from({ length: 9 }, (_, k) => {
          const t = k / 8;
          const gx = hx + s.lean * 0.6 * t;
          const gy = s.top + 6 + t * t * 120;
          return { gx, gy, rot: 30 + t * 50 };
        });
        return (
          <g key={i}>
            <path d={stem} {...inkLine} data-draw />
            <path
              d={`M${hx} ${s.top} Q${hx + s.lean * 0.5} ${s.top + 6} ${hx + s.lean * 0.62} ${s.top + 126}`}
              {...inkLine}
              strokeWidth={1.6}
            />
            {grains.map((g, k) => (
              <ellipse
                key={k}
                cx={g.gx}
                cy={g.gy}
                rx="5"
                ry="9"
                transform={`rotate(${-g.rot} ${g.gx} ${g.gy})`}
                fill={k % 3 === 0 ? "var(--ink)" : "var(--gold-pale)"}
                stroke="var(--ink)"
                strokeWidth="1.6"
              />
            ))}
            <path
              d={`M${s.x - 2} 420 Q${s.x - 40} 380 ${s.x - 54} 330 M${s.x + 2} 400 Q${s.x + 30} 360 ${s.x + 36} 300`}
              {...inkLine}
              strokeWidth={1.8}
            />
          </g>
        );
      })}
      {/* paddy water */}
      <g {...inkLine} strokeWidth={1.8}>
        <path d="M20 470 H120 M150 470 H280 M40 486 H90 M130 486 H230 M70 500 H180" />
      </g>
    </svg>
  );
}

const grain = (s: number) =>
  `M150 ${250 - 170 * s} C${150 + 96 * s} ${250 - 160 * s} ${150 + 104 * s} ${250 + 120 * s} ${150 + 10 * s} ${250 + 172 * s} C${150 - 4 * s} ${250 + 162 * s} ${150 - 20 * s} ${250 + 168 * s} ${150 - 30 * s} ${250 + 172 * s} C${150 - 110 * s} ${250 + 110 * s} ${150 - 92 * s} ${250 - 160 * s} 150 ${250 - 170 * s} Z`;

export function PanelPolish({ className }: { className?: string }) {
  const rand = seeded(7);
  const dust = Array.from({ length: 26 }, (_, i) => {
    const a = i * 0.7;
    const r = 120 + i * 4.2;
    return { x: 150 + Math.cos(a) * r * 0.62, y: 270 + Math.sin(a) * r * 0.9, s: 1.5 + rand() * 2.5 };
  });
  return (
    <svg viewBox="0 0 300 520" className={className} role="img" aria-label="A rice grain polished down to its 35% starch core">
      <Curls items={[[250, 470, 18, 1], [40, 60, 16, -1]]} />
      {dust.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.s} fill="var(--ink)" opacity={0.75} />
      ))}
      <path d={grain(1)} {...inkLine} strokeWidth={3} data-draw />
      <path d={grain(0.72)} {...inkLine} strokeDasharray="6 7" />
      <path d={grain(0.36)} fill="var(--ink)" />
      <path d={grain(0.36)} fill="none" stroke="var(--gold-pale)" strokeWidth="1.5" transform="translate(-5 -4)" />
      <g style={condensed} fontSize="13" fill="var(--ink)" letterSpacing="2">
        <text x="242" y="110">100%</text>
        <text x="216" y="168">70%</text>
        <text x="122" y="262" fill="var(--gold)" fontSize="15">35%</text>
      </g>
      <path d="M232 106 L210 120 M206 164 L192 176" {...inkLine} strokeWidth={1.4} />
    </svg>
  );
}

export function PanelBrew({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 520" className={className} role="img" aria-label="A cedar brewing vat with koji steam rising">
      <Curls
        items={[
          [110, 190, 24, 1],
          [170, 140, 30, -1],
          [120, 86, 22, 1],
          [200, 64, 16, -1],
        ]}
      />
      {/* paddle: the diagonal that cuts the panel */}
      <path d="M262 60 L136 330" stroke="var(--ink)" strokeWidth="7" strokeLinecap="square" />
      <path d="M142 316 L118 366 L94 356 L118 306 Z" fill="var(--ink)" />
      {/* vat */}
      <path d="M48 300 H252 L236 480 H64 Z" fill="var(--gold-pale)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M48 300 H252 L250 318 H50 Z" fill="var(--ink)" />
      <g stroke="var(--ink)" strokeWidth="1.8">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const tx = 70 + i * 20;
          const bx = 80 + i * 17.5;
          return <path key={i} d={`M${tx} 318 L${bx} 480`} />;
        })}
      </g>
      <path d="M53 360 H247 L245 376 H55 Z" fill="var(--ink)" />
      <path d="M58 430 H242 L240 446 H60 Z" fill="var(--ink)" />
      {/* hard shadow side of the vat */}
      <path d="M200 318 H250 L236 480 H196 Z" fill="var(--ink)" opacity="0.35" />
      <path d="M30 480 H270" {...inkLine} strokeWidth={3} />
      {/* koji spores */}
      <g fill="var(--ink)">
        {[
          [70, 250],
          [90, 230],
          [232, 250],
          [214, 220],
          [60, 210],
          [246, 198],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" />
        ))}
      </g>
    </svg>
  );
}

export function PanelAge({ className }: { className?: string }) {
  const bottle = (x: number, h: number) =>
    `M${x - 7} ${480 - h} H${x + 7} V${480 - h + 44} C${x + 7} ${480 - h + 64} ${x + 26} ${480 - h + 70} ${x + 26} ${480 - h + 96} V480 H${x - 26} V${480 - h + 96} C${x - 26} ${480 - h + 70} ${x - 7} ${480 - h + 64} ${x - 7} ${480 - h + 44} Z`;
  return (
    <svg viewBox="0 0 300 520" className={className} role="img" aria-label="Bottles resting in the cellar under a full moon">
      <circle cx="150" cy="150" r="92" fill="var(--rice)" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="150" cy="150" r="80" {...inkLine} strokeWidth={1.2} strokeDasharray="3 6" />
      <path d="M40 166 H200 M90 182 H262" stroke="var(--gold)" strokeWidth="14" strokeLinecap="round" />
      <path d="M40 166 H200 M90 182 H262" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" fill="none" transform="translate(0 8)" opacity="0.5" />
      <path
        d="M60 92 c6 -6 12 -6 16 0 c4 -6 10 -6 16 0 c-6 -1 -10 0 -16 5 c-6 -5 -10 -6 -16 -5 Z M100 70 c4 -4 8 -4 11 0 c3 -4 7 -4 11 0 c-4 -1 -7 0 -11 4 c-4 -4 -7 -5 -11 -4 Z"
        fill="var(--ink)"
      />
      <Curls items={[[250, 290, 16, -1], [44, 300, 14, 1]]} />
      {/* cellar shelf */}
      <path d="M20 480 H280 V496 H20 Z" fill="var(--ink)" />
      <path d={bottle(78, 170)} fill="var(--ink)" />
      <path d={bottle(150, 200)} fill="var(--ink)" />
      <path d={bottle(222, 160)} fill="var(--ink)" />
      <rect x="132" y="380" width="36" height="58" fill="var(--rice)" />
      <text x="150" y="420" textAnchor="middle" fontSize="26" fill="var(--ink)" style={display}>
        黒
      </text>
      <path d="M95 330 V476 M167 300 V476 M239 340 V476" stroke="var(--gold)" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Masu cup holding a reflected moon                                   */
/* ------------------------------------------------------------------ */
export function Masu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 380" className={className} role="img" aria-label="A cedar masu cup with the moon reflected in the sake">
      <path d="M70 140 L230 210 L230 360 L70 290 Z" transform="translate(30 10)" fill="var(--ink)" opacity="0.6" />
      <path d="M230 210 L390 140 L390 290 L230 360 Z" transform="translate(30 10)" fill="var(--ink)" opacity="0.6" />
      {/* faces */}
      <path d="M40 110 L200 180 L200 330 L40 260 Z" fill="var(--gold)" />
      <path d="M200 180 L360 110 L360 260 L200 330 Z" fill="var(--gold-deep)" />
      {/* wood grain */}
      <g stroke="var(--ink)" strokeOpacity="0.28" strokeWidth="1.4" fill="none">
        <path d="M40 150 C90 170 140 190 200 222 M40 200 C100 222 150 250 200 270 M40 236 C90 258 140 280 200 300" />
        <path d="M200 222 C260 196 300 176 360 150 M200 262 C260 236 310 214 360 196 M200 300 C250 280 310 252 360 232" />
      </g>
      {/* rim */}
      <path d="M40 110 L200 40 L360 110 L200 180 Z" fill="var(--gold-pale)" />
      <path d="M62 110 L200 52 L338 110 L200 168 Z" fill="var(--ink)" />
      {/* reflected moon + ripples */}
      <ellipse cx="200" cy="110" rx="48" ry="21" fill="var(--rice)" />
      <path d="M140 116 H178 M222 104 H262 M162 126 H238" stroke="var(--ink)" strokeWidth="3" />
      <rect x="226" y="88" width="9" height="9" fill="var(--gold)" transform="rotate(20 230 92)" />
      {/* brand on the face */}
      <g transform="matrix(1 0.4375 0 1 0 0)">
        <text x="120" y="194" textAnchor="middle" fontSize="54" fill="var(--ink)" style={display}>
          黒
        </text>
      </g>
      <path d="M200 180 V330" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Award medallion                                                     */
/* ------------------------------------------------------------------ */
export function Medal({
  className,
  kanji,
  top,
  bottom,
  id,
}: {
  className?: string;
  kanji: string;
  top: string;
  bottom: string;
  id: string;
}) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden>
      <path d={burstPath(118, 118, 100, 90, 36)} fill="var(--ink)" />
      <path d={burstPath(110, 110, 100, 90, 36)} fill="var(--gold)" />
      <circle cx="110" cy="110" r="78" fill="var(--ink)" />
      <circle cx="110" cy="110" r="72" fill="none" stroke="var(--gold)" strokeWidth="1.2" />
      <defs>
        <path id={`${id}-t`} d="M48 110 A62 62 0 0 1 172 110" />
        <path id={`${id}-b`} d="M40 110 A70 70 0 0 0 180 110" />
      </defs>
      <text fontSize="11" fill="var(--gold)" letterSpacing="3" style={condensed}>
        <textPath href={`#${id}-t`} startOffset="50%" textAnchor="middle">
          {top}
        </textPath>
      </text>
      <text fontSize="11" fill="var(--gold)" letterSpacing="3" style={condensed}>
        <textPath href={`#${id}-b`} startOffset="50%" textAnchor="middle">
          {bottom}
        </textPath>
      </text>
      <text x="110" y="128" textAnchor="middle" fontSize="44" fill="var(--rice)" style={display}>
        {kanji}
      </text>
    </svg>
  );
}
