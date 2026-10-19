/* Dish illustrations: ink silhouettes on gold leaf with rice + vermilion accents.
   All share a 200×160 box. */

const INK = "var(--ink)";
const RICE = "var(--rice)";
const RED = "var(--vermilion)";
const DEEP = "var(--gold-deep)";

function Chopsticks({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? "translate(200 0) scale(-1 1)" : undefined}>
      <path d="M26,98 L196,22 L198,27 L30,104 Z" fill={INK} />
      <path d="M40,108 L198,40 L199,45 L44,114 Z" fill={INK} />
      <path d="M170,34 L196,22 L198,27 L172,39 Z" fill={RED} />
      <path d="M172,51 L198,40 L199,45 L174,56 Z" fill={RED} />
    </g>
  );
}

function Bowl({ broth, children, band = RED }: { broth: string; children?: React.ReactNode; band?: string }) {
  return (
    <g>
      <rect x={74} y={142} width={52} height={10} fill={INK} />
      <path d="M20,88 L180,88 C176,126 142,148 100,148 C58,148 24,126 20,88 Z" fill={INK} />
      <path d="M27,106 L173,106 C171,112 168,118 165,122 L35,122 C32,118 29,112 27,106 Z" fill={band} />
      <path
        d="M36,114 L44,108 L52,114 L60,108 L68,114 L76,108 L84,114 L92,108 L100,114 L108,108 L116,114 L124,108 L132,114 L140,108 L148,114 L156,108 L164,114"
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
      />
      <ellipse cx={100} cy={88} rx={80} ry={14} fill={INK} />
      <ellipse cx={100} cy={87} rx={71} ry={10} fill={broth} />
      {children}
      {/* rim light */}
      <path d="M26,94 C34,124 60,142 92,146" fill="none" stroke={RICE} strokeWidth={2.5} opacity={0.6} />
    </g>
  );
}

function Noodles({ color = INK }: { color?: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <path d="M44,90 q5,-5 10,0 t10,0 t10,0 t10,0" />
      <path d="M118,93 q5,-5 10,0 t10,0 t10,0" />
    </g>
  );
}

function SteamLines() {
  return (
    <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.75}>
      <path d="M70,46 C60,34 80,26 70,12" />
      <path d="M98,40 C108,28 88,20 98,4" />
    </g>
  );
}

const DISHES: Record<string, React.ReactNode> = {
  tonkotsu: (
    <>
      <SteamLines />
      <Bowl broth={RICE}>
        <Noodles />
        <path d="M134,52 L162,58 L156,90 L128,86 Z" fill={INK} />
        <circle cx={76} cy={82} r={18} fill={RICE} stroke={INK} strokeWidth={3} />
        <circle cx={76} cy={82} r={11} fill="none" stroke={RED} strokeWidth={4} />
        <ellipse cx={118} cy={82} rx={16} ry={10} fill={RICE} stroke={INK} strokeWidth={3} />
        <ellipse cx={118} cy={82} rx={8} ry={5} fill={RED} />
        <g fill={INK}>
          <circle cx={98} cy={92} r={3} />
          <circle cx={146} cy={92} r={3} />
          <circle cx={56} cy={94} r={3} />
        </g>
      </Bowl>
      <Chopsticks />
    </>
  ),
  tantan: (
    <>
      <SteamLines />
      <Bowl broth={RED} band={RICE}>
        <path d="M120,62 C140,52 166,62 160,84 C146,90 128,86 120,62 Z" fill={INK} />
        <path d="M124,66 L156,82" stroke={RICE} strokeWidth={2} />
        <g fill={INK}>
          {[
            [70, 84],
            [78, 80],
            [86, 86],
            [74, 90],
            [92, 82],
            [82, 92],
            [96, 90],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={6} height={5} transform={`rotate(20 ${x} ${y})`} />
          ))}
        </g>
        <g stroke={RICE} strokeWidth={1.6} fill="none">
          <path d="M60,78 l18,-10 M66,74 l10,-14 M104,72 l6,-14" />
        </g>
        <g fill={RICE}>
          <circle cx={52} cy={90} r={1.8} />
          <circle cx={112} cy={92} r={1.8} />
          <circle cx={140} cy={94} r={1.8} />
        </g>
      </Bowl>
      <Chopsticks flip />
    </>
  ),
  shio: (
    <>
      <SteamLines />
      <Bowl broth={RICE}>
        <Noodles />
        <circle cx={132} cy={62} r={24} fill={INK} />
        <path d="M120,46 A20,20 0 1 0 148,74 A24,24 0 0 1 120,46 Z" fill="var(--gold)" />
        <g fill={DEEP} stroke={INK} strokeWidth={1.5}>
          <rect x={58} y={76} width={8} height={18} transform="rotate(-20 62 85)" />
          <rect x={70} y={74} width={8} height={18} transform="rotate(10 74 83)" />
        </g>
        <path d="M92,84 l14,-4 M96,90 l12,-2" stroke="var(--gold)" strokeWidth={3} strokeLinecap="round" />
      </Bowl>
      <Chopsticks />
    </>
  ),
  tsukemen: (
    <>
      <ellipse cx={74} cy={118} rx={66} ry={22} fill={INK} />
      <ellipse cx={74} cy={113} rx={58} ry={16} fill={INK} stroke={RICE} strokeWidth={2} />
      <g fill="none" stroke={RICE} strokeWidth={3} strokeLinecap="round">
        <path d="M30,110 q8,-8 16,0 t16,0 t16,0 t16,0 t16,0" />
        <path d="M36,100 q8,-8 16,0 t16,0 t16,0 t16,0" />
        <path d="M44,90 q8,-8 16,0 t16,0 t16,0" />
        <path d="M54,80 q8,-8 16,0 t16,0" />
      </g>
      <path d="M128,100 L192,100 C190,124 176,140 160,140 C144,140 130,124 128,100 Z" fill={INK} />
      <ellipse cx={160} cy={100} rx={32} ry={8} fill={INK} />
      <ellipse cx={160} cy={100} rx={27} ry={5.5} fill={RED} />
      <rect x={150} y={140} width={20} height={6} fill={INK} />
      <path d="M178,72 L196,84 L176,94 Z" fill={RICE} stroke={INK} strokeWidth={2} />
      <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.75}>
        <path d="M150,84 C142,72 160,64 152,52" />
        <path d="M166,80 C174,68 160,60 168,48" />
      </g>
    </>
  ),
  karaage: (
    <>
      <ellipse cx={100} cy={122} rx={86} ry={24} fill={INK} />
      <ellipse cx={100} cy={118} rx={74} ry={16} fill={RICE} />
      <g fill={DEEP} stroke={INK} strokeWidth={3} strokeLinejoin="round">
        <path d="M44,112 C40,92 62,82 74,90 C86,82 96,98 88,112 C78,124 50,124 44,112 Z" />
        <path d="M84,104 C82,80 108,70 120,82 C134,78 140,98 130,108 C118,120 90,120 84,104 Z" />
        <path d="M70,92 C70,72 94,66 100,78 C110,72 116,88 106,94 C96,100 76,102 70,92 Z" />
        <path d="M118,112 C116,96 136,90 144,98 C156,96 158,112 150,118 C138,126 122,124 118,112 Z" />
      </g>
      <g stroke={INK} strokeWidth={2} fill="none">
        <path d="M58,104 l8,-6 M98,96 l10,-8 M84,86 l6,-4 M130,108 l8,-6" />
      </g>
      <path d="M152,96 L184,108 L156,118 Z" fill="var(--gold)" stroke={INK} strokeWidth={2.5} />
      <path d="M156,102 L174,108 L158,113" fill="none" stroke={INK} strokeWidth={1.5} />
      <circle cx={46} cy={124} r={8} fill={RICE} stroke={INK} strokeWidth={2} />
    </>
  ),
  gyoza: (
    <>
      <path d="M8,118 L160,96 L192,126 L40,148 Z" fill={INK} />
      <path d="M22,118 L156,100 L178,122 L44,140 Z" fill="none" stroke={RICE} strokeWidth={1.5} opacity={0.5} />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 38 + i * 26;
        const y = 118 - i * 3.4;
        return (
          <g key={i}>
            <path d={`M${x},${y} C${x - 4},${y - 34} ${x + 30},${y - 38} ${x + 30},${y - 6} Z`} fill={RICE} stroke={INK} strokeWidth={2.5} />
            <path d={`M${x + 4},${y - 3} L${x + 28},${y - 7} L${x + 30},${y - 2} L${x + 2},${y + 2} Z`} fill={RED} />
            <path d={`M${x + 6},${y - 18} l3,-8 M${x + 13},${y - 22} l2,-8 M${x + 20},${y - 22} l1,-8`} stroke={INK} strokeWidth={2} />
          </g>
        );
      })}
      <path d="M30,124 L170,104" stroke={RICE} strokeWidth={1.5} strokeDasharray="3 4" />
      <ellipse cx={170} cy={70} rx={20} ry={8} fill={INK} />
      <ellipse cx={170} cy={69} rx={15} ry={5} fill={RED} />
    </>
  ),
  yakitori: (
    <>
      <rect x={14} y={126} width={172} height={22} fill={INK} />
      <g fill={RED}>
        <path d="M30,126 l6,-8 l6,8 Z" />
        <path d="M80,126 l5,-6 l5,6 Z" />
        <path d="M140,126 l7,-9 l7,9 Z" />
      </g>
      <g stroke={INK} strokeWidth={3}>
        <line x1={28} y1={142} x2={172} y2={142} stroke={RICE} strokeWidth={1.5} opacity={0.5} />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * 22} ${i * 12}) rotate(-24 100 70)`}>
          <line x1={14} y1={70} x2={190} y2={70} stroke={RICE} strokeWidth={3} />
          {[0, 1, 2, 3].map((j) => (
            <g key={j}>
              <rect x={42 + j * 30} y={58} width={24} height={24} rx={6} fill={INK} />
              <path d={`M${46 + j * 30},${62} l10,0`} stroke={RED} strokeWidth={3} strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
    </>
  ),
  agedashi: (
    <>
      <path d="M30,96 L170,96 C166,128 136,146 100,146 C64,146 34,128 30,96 Z" fill={INK} />
      <ellipse cx={100} cy={96} rx={70} ry={12} fill={INK} />
      <ellipse cx={100} cy={95} rx={62} ry={8} fill={DEEP} />
      {[
        [56, 72],
        [94, 66],
        [128, 74],
      ].map(([x, y]) => (
        <g key={x} stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
          <path d={`M${x},${y + 8} L${x + 14},${y} L${x + 34},${y + 4} L${x + 20},${y + 12} Z`} fill={RICE} />
          <path d={`M${x},${y + 8} L${x + 20},${y + 12} L${x + 20},${y + 30} L${x},${y + 26} Z`} fill={RICE} />
          <path d={`M${x + 20},${y + 12} L${x + 34},${y + 4} L${x + 34},${y + 22} L${x + 20},${y + 30} Z`} fill={DEEP} />
        </g>
      ))}
      <path d="M86,64 C86,50 112,48 112,64 Z" fill={RICE} stroke={INK} strokeWidth={2.5} />
      <g fill="none" stroke={RED} strokeWidth={2.5} strokeLinecap="round">
        <path d="M90,46 q4,-6 8,0 t8,0" />
        <path d="M100,38 q4,-6 8,0" />
        <path d="M84,40 q3,-5 6,0" />
      </g>
    </>
  ),
  kurozuki: (
    <>
      <path d="M80,152 L80,66 C80,54 92,50 94,40 L94,12 L106,12 L106,40 C108,50 120,54 120,66 L120,152 Z" fill={INK} />
      <rect x={92} y={8} width={16} height={8} fill={RED} />
      <rect x={86} y={76} width={28} height={58} fill={RICE} />
      <circle cx={100} cy={88} r={8} fill={RED} />
      <text x={100} y={104} textAnchor="start" fontSize={13} fill={INK} style={{ fontFamily: "var(--font-display)", fontWeight: 800, writingMode: "vertical-rl" }}>
        黒月
      </text>
      <path d="M84,64 L84,148" stroke={RICE} strokeWidth={2.5} opacity={0.5} />
      <path d="M140,124 L176,124 L170,148 L146,148 Z" fill={INK} />
      <ellipse cx={158} cy={124} rx={18} ry={5} fill={RICE} />
      <circle cx={158} cy={124} r={3} fill="none" stroke="var(--steel)" strokeWidth={1.5} />
      <path d="M40,148 L60,92" stroke={INK} strokeWidth={2} strokeDasharray="2 5" />
    </>
  ),
  nigori: (
    <>
      <path d="M86,22 L114,22 L112,40 C140,58 150,100 138,130 C132,146 68,146 62,130 C50,100 60,58 88,40 Z" fill={RICE} stroke={INK} strokeWidth={3.5} />
      <path d="M64,96 C88,104 112,104 136,96 L138,108 C112,116 88,116 62,108 Z" fill={INK} />
      <text x={100} y={86} textAnchor="middle" fontSize={22} fill={RED} style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
        暁
      </text>
      <path d="M84,22 L116,22 L116,16 L84,16 Z" fill={INK} />
      <path d="M150,118 L188,118 L182,146 L156,146 Z" fill={INK} />
      <ellipse cx={169} cy={118} rx={19} ry={5} fill={RICE} />
      <path d="M72,60 C66,76 66,96 70,112" fill="none" stroke="var(--gold)" strokeWidth={3} />
    </>
  ),
  atsukan: (
    <>
      <g fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.75}>
        <path d="M90,40 C80,28 98,18 88,4" />
        <path d="M112,36 C122,24 104,14 114,0" />
      </g>
      <path d="M44,96 L156,96 L150,148 L50,148 Z" fill={INK} />
      <ellipse cx={100} cy={96} rx={56} ry={10} fill={INK} />
      <ellipse cx={100} cy={96} rx={50} ry={6} fill={RICE} opacity={0.7} />
      <path d="M156,104 C176,104 180,126 158,130" fill="none" stroke={INK} strokeWidth={6} />
      <path d="M88,46 L112,46 L110,60 C126,70 128,92 122,104 L78,104 C72,92 74,70 90,60 Z" fill={RED} stroke={INK} strokeWidth={3} />
      <rect x={86} y={40} width={28} height={7} fill={INK} />
      <path d="M50,108 L150,108" stroke={RICE} strokeWidth={2} opacity={0.5} />
      <path d="M54,130 L146,130" stroke={RICE} strokeWidth={2} opacity={0.3} />
    </>
  ),
  highball: (
    <>
      <path d="M66,20 L134,20 L128,150 L72,150 Z" fill={RICE} />
      <path d="M68,48 L132,48 L128,150 L72,150 Z" fill={DEEP} />
      <g fill={RICE} stroke={INK} strokeWidth={2}>
        <rect x={78} y={56} width={22} height={22} transform="rotate(12 89 67)" />
        <rect x={100} y={80} width={22} height={22} transform="rotate(-16 111 91)" />
        <rect x={80} y={104} width={22} height={22} transform="rotate(6 91 115)" />
      </g>
      <g fill="none" stroke={INK} strokeWidth={1.5}>
        <circle cx={112} cy={64} r={2.5} />
        <circle cx={118} cy={124} r={2} />
        <circle cx={86} cy={134} r={2.5} />
        <circle cx={106} cy={140} r={1.8} />
      </g>
      <path d="M66,20 L134,20 L128,150 L72,150 Z" fill="none" stroke={INK} strokeWidth={4} />
      <circle cx={136} cy={30} r={20} fill="var(--gold)" stroke={INK} strokeWidth={3} />
      <g stroke={INK} strokeWidth={1.5}>
        <path d="M136,12 L136,48 M118,30 L154,30 M123,17 L149,43 M149,17 L123,43" />
      </g>
      <path d="M100,8 L118,150" stroke={RED} strokeWidth={4} />
    </>
  ),
};

export default function DishArt({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true" overflow="visible">
      {DISHES[id]}
    </svg>
  );
}
