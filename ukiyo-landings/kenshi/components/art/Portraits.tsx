import { leaf, rng } from "./geometry";

export type PortraitKind = "topknot" | "ponytail" | "shaved";
export type FieldKind = "crimson" | "steel" | "gold";

/* Profile bust facing right, 300×400. */
const BUST =
  "M40 400 C 44 356 76 330 122 318 L 130 288 C 112 272 100 244 102 210 C 104 162 140 128 186 130 " +
  "C 222 132 244 160 246 190 L 248 204 C 250 210 248 214 246 218 L 262 244 L 248 250 L 250 262 " +
  "L 244 266 L 248 274 L 240 288 C 232 296 218 300 206 300 L 202 316 C 236 330 270 352 290 400 Z";

const HAIR: Record<PortraitKind, React.ReactNode> = {
  topknot: (
    <>
      {/* chonmage folded forward over the crown */}
      <path d="M150 140 L 160 116 L 214 106 L 222 116 L 176 128 L 168 142 Z" />
      {/* beard along the jaw */}
      <path d="M204 296 L 236 284 L 248 292 L 240 318 L 222 334 L 202 322 Z" />
      {/* hair at the back of the head */}
      <path d="M104 214 C 98 180 114 148 150 136 L 158 150 C 132 160 120 188 126 224 Z" />
    </>
  ),
  ponytail: (
    <>
      {/* high tail, cut into sharp locks */}
      <path d="M124 160 C 110 142 92 132 70 132 L 18 146 L 60 152 L 6 182 L 62 176 L 22 222 L 74 196 L 70 250 L 100 204 L 112 214 Z" />
      <path d="M150 134 C 190 120 236 136 248 180 L 236 176 C 226 156 200 146 170 150 Z" />
    </>
  ),
  shaved: (
    <>
      {/* heavy neck and trapezius */}
      <path d="M96 340 L 126 282 L 206 300 L 214 336 Z" />
      {/* cauliflower ear */}
      <circle cx={168} cy={214} r={15} />
    </>
  ),
};

const DETAIL: Record<PortraitKind, React.ReactNode> = {
  topknot: (
    <>
      <path d="M178 124 L 186 110" stroke="var(--crimson)" strokeWidth={6} />
      {/* kimono collar */}
      <path d="M150 400 L 196 330 L 240 400" fill="none" stroke="var(--gold)" strokeWidth={5} />
      <path d="M176 400 L 206 352" fill="none" stroke="var(--gold)" strokeWidth={3} opacity={0.7} />
    </>
  ),
  ponytail: (
    <>
      <path d="M116 150 L 128 172" stroke="var(--crimson)" strokeWidth={8} />
      <path d="M140 400 L 190 334 L 236 400" fill="none" stroke="var(--rice)" strokeWidth={5} />
      <path d="M216 210 L 236 206" stroke="var(--steel)" strokeWidth={3} />
    </>
  ),
  shaved: (
    <>
      <path d="M170 162 L 200 150" stroke="var(--vermilion)" strokeWidth={4} />
      <path d="M160 206 C 170 204 176 214 172 222" fill="none" stroke="var(--steel)" strokeWidth={3} />
      {/* hand wraps over the shoulder strap */}
      <path d="M100 400 L 150 342 L 168 352 L 124 400 Z" fill="var(--rice)" />
    </>
  ),
};

const FIELD: Record<FieldKind, string> = {
  crimson: "var(--crimson)",
  steel: "var(--steel)",
  gold: "var(--gold)",
};

export function Portrait({ kind, field, name }: { kind: PortraitKind; field: FieldKind; name: string }) {
  const rand = rng(kind.length * 13);
  return (
    <svg viewBox="0 0 300 400" role="img" aria-label={`Silhouette portrait of ${name}`} className="h-full w-full">
      <rect width="300" height="400" fill="var(--ink-2)" />
      <circle className="portrait-disc" cx={170} cy={180} r={128} fill={FIELD[field]} />
      {field === "gold" ? (
        <g opacity={0.45} stroke="var(--ink)" strokeWidth={2} fill="none">
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${60 + i * 10} ${110 + i * 42} C 120 ${90 + i * 42} 200 ${130 + i * 42} 290 ${100 + i * 42}`} />
          ))}
        </g>
      ) : null}
      {/* bamboo leaves drifting through the frame */}
      <g fill="var(--ink)" opacity={0.9}>
        {Array.from({ length: 4 }, (_, i) => (
          <path
            key={i}
            d={leaf(36 + rand() * 20, 6)}
            transform={`translate(${(20 + rand() * 240).toFixed(0)} ${(30 + rand() * 120).toFixed(0)}) rotate(${(rand() * 180).toFixed(0)})`}
          />
        ))}
      </g>
      {/* steel rim light, then the ink silhouette */}
      <g fill="var(--steel)" transform="translate(4 -3)">
        <path d={BUST} />
        {HAIR[kind]}
      </g>
      <g fill="var(--ink)">
        <path d={BUST} />
        {HAIR[kind]}
      </g>
      <g strokeLinecap="round">{DETAIL[kind]}</g>
    </svg>
  );
}

/** Steel moon with a bamboo branch and a seated swordsman, for "The Way". */
export function MoonScene() {
  const rand = rng(5);
  // leaf sprays hanging off the branch, classic sumi-e bamboo
  const sprays: [number, number][] = [
    [640, 40],
    [540, 108],
    [452, 170],
    [380, 222],
  ];
  const leaves = sprays.flatMap(([x, y], k) =>
    Array.from({ length: 4 + (k % 2) }, (_, i) => ({
      x,
      y,
      a: 40 + i * 26 + rand() * 12,
      l: 92 + rand() * 40,
    })),
  );
  return (
    <svg viewBox="0 0 700 700" aria-hidden="true" className="h-full w-full overflow-visible">
      <circle className="way-moon" cx={350} cy={330} r={290} fill="var(--steel)" />
      {/* flat craters */}
      <g fill="var(--ink-2)" opacity={0.35}>
        <path d="M200 200 C 240 170 300 190 290 230 C 280 270 210 270 196 240 Z" />
        <path d="M420 420 C 470 400 520 430 500 470 C 480 500 420 490 410 460 Z" />
        <path d="M300 460 C 320 450 340 460 336 476 C 330 490 304 488 300 476 Z" />
        <path d="M470 220 C 490 210 520 220 516 240 C 510 256 480 254 472 242 Z" />
        <path d="M150 360 C 170 350 196 364 190 384 C 184 400 156 398 150 384 Z" />
      </g>
      {/* hill line */}
      <path d="M-40 640 C 120 560 260 548 400 572 C 520 592 620 560 740 520 L 740 720 L -40 720 Z" fill="var(--ink)" />
      {/* seated swordsman in seiza, sword laid at his right */}
      <g fill="var(--ink)">
        <circle cx={286} cy={480} r={16} />
        <path d="M268 500 L 304 498 L 312 548 L 326 566 L 252 568 L 262 540 Z" />
        <path d="M282 466 L 278 452 L 290 448 L 294 462 Z" />
        <path d="M230 572 L 360 566" stroke="var(--ink)" strokeWidth={4} />
      </g>
      <path d="M300 566 L 380 556" stroke="var(--rice)" strokeWidth={2.5} />
      {/* bamboo branch cutting across the disc */}
      <path d="M760 -20 C 640 40 520 110 330 262" stroke="var(--ink)" strokeWidth={9} fill="none" />
      <path d="M640 40 L 660 -10 M540 108 L 560 70 M452 170 L 440 130" stroke="var(--ink)" strokeWidth={4} fill="none" />
      <g fill="var(--ink)">
        {leaves.map((l, i) => (
          <path key={i} d={leaf(l.l, 15)} transform={`translate(${l.x.toFixed(0)} ${l.y.toFixed(0)}) rotate(${l.a.toFixed(0)})`} />
        ))}
      </g>
    </svg>
  );
}
