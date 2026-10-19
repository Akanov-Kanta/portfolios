import { BambooLayer, type StalkSpec } from "./Bamboo";
import { Fighters } from "./Fighters";
import { leaf, rng } from "./geometry";

const VB = "0 0 1600 1000";

const MOON = { cx: 1110, cy: 420, r: 350 };

function farStalks(): StalkSpec[] {
  const rand = rng(7);
  const out: StalkSpec[] = [];
  for (let x = 20; x < 1600; x += 70 + rand() * 70) {
    out.push({ x, w: 8 + rand() * 12, lean: rand() * 30 - 15, seg: 110 + rand() * 60, leaves: 0.35 });
  }
  return out;
}

const FAR = farStalks();

const MID: StalkSpec[] = [
  { x: 36, w: 26, lean: -10, seg: 170, leaves: 0.8 },
  { x: 470, w: 18, lean: 14, seg: 150, leaves: 0.7 },
  { x: 556, w: 13, lean: -8, seg: 140, leaves: 0.4 },
  { x: 1536, w: 24, lean: -16, seg: 160, leaves: 0.8 },
];

const NEAR: StalkSpec[] = [
  { x: -14, w: 66, lean: 18, seg: 210, leaves: 0.5 },
  { x: 1612, w: 58, lean: -12, seg: 230, leaves: 0.3 },
];

function Layer({ children, className = "", depth }: { children: React.ReactNode; className?: string; depth?: number }) {
  return (
    <svg
      className={`hero-layer ${className}`}
      viewBox={VB}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-depth={depth}
    >
      {children}
    </svg>
  );
}

/** A diagonally cut bamboo stalk — the strike already happened. */
function SlicedStalk() {
  const x = 1470;
  const w = 54;
  // cut line runs from (x-w/2, 300) up to (x+w/2, 262)
  return (
    <g>
      <g className="sliced-top">
        <path d={`M${x - w / 2} -60 L${x + w / 2} -60 L${x + w / 2} 262 L${x - w / 2} 300 Z`} fill="var(--ink)" />
        <path d={`M${x - w / 2 - 3} 110 Q${x} 104 ${x + w / 2 + 3} 110 Q${x} 114 ${x - w / 2 - 3} 110Z`} fill="var(--ink)" />
        <path d={`M${x - w / 2} 300 L${x + w / 2} 262`} stroke="var(--rice)" strokeWidth={3} />
      </g>
      <path d={`M${x - w / 2} 306 L${x + w / 2} 268 L${x + w / 2 + 4} 1060 L${x - w / 2 + 4} 1060 Z`} fill="var(--ink)" />
      <path d={`M${x - w / 2 - 3} 520 Q${x} 514 ${x + w / 2 + 6} 520 Q${x} 524 ${x - w / 2 - 3} 520Z`} fill="var(--ink)" />
      <path d={`M${x - w / 2 - 3} 760 Q${x} 754 ${x + w / 2 + 6} 760 Q${x} 764 ${x - w / 2 - 3} 760Z`} fill="var(--ink)" />
      {/* fresh cut face, red flash on the edge */}
      <path d={`M${x - w / 2} 306 L${x + w / 2} 268`} stroke="var(--vermilion)" strokeWidth={5} />
      {/* the slash itself, a hairline across the frame */}
      <path className="slash-trail" d="M1380 330 L 1640 186" stroke="var(--vermilion)" strokeWidth={3} pathLength={100} />
    </g>
  );
}

function HangingLeaves() {
  const rand = rng(31);
  const items = Array.from({ length: 16 }, (_, i) => ({
    x: 1180 + i * 26 + rand() * 30,
    y: -10 + rand() * 50,
    a: 70 + rand() * 50,
    l: 90 + rand() * 70,
    w: 13 + rand() * 6,
  }));
  return (
    <g>
      <path d="M1160 -10 C 1260 40 1380 50 1620 30" stroke="var(--ink)" strokeWidth={6} fill="none" />
      {items.map((it, i) => (
        <path key={i} d={leaf(it.l, it.w)} fill="var(--ink)" transform={`translate(${it.x.toFixed(1)} ${it.y.toFixed(1)}) rotate(${it.a.toFixed(1)})`} />
      ))}
    </g>
  );
}

function FallingLeaves() {
  const rand = rng(77);
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const x = 200 + rand() * 1300;
        const y = 40 + rand() * 300;
        const s = 0.6 + rand() * 0.6;
        return (
          <g key={i} transform={`translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})`}>
            <path
              className="leaf-fall"
              style={{ animationDelay: `${(-i * 1.7).toFixed(1)}s`, animationDuration: `${(9 + (i % 4) * 2).toFixed(0)}s` }}
              d={leaf(46, 7)}
              fill="var(--ink)"
            />
          </g>
        );
      })}
    </g>
  );
}

export function HeroArt() {
  return (
    <div className="hero-stage" aria-hidden="true">
      {/* 0 · sky: flat rice field and mist bands */}
      <Layer className="hero-layer--sky">
        <rect width="1600" height="1000" fill="var(--rice)" />
        <path d="M0 610 C 200 590 380 620 600 600 C 820 580 1000 610 1240 590 C 1400 578 1520 590 1600 584 L1600 1000 L0 1000Z" fill="var(--mist)" />
      </Layer>

      {/* 1 · giant crimson moon + far bamboo, re-inked inside the disc */}
      <Layer depth={0.12}>
        <defs>
          <clipPath id="moon-clip">
            <circle cx={MOON.cx} cy={MOON.cy} r={MOON.r} />
          </clipPath>
        </defs>
        <BambooLayer stalks={FAR} fill="var(--bamboo-far)" seed={3} leafScale={0.7} />
        <circle cx={MOON.cx} cy={MOON.cy} r={MOON.r} fill="var(--crimson)" />
        <g clipPath="url(#moon-clip)">
          <BambooLayer stalks={FAR} fill="var(--crimson-deep)" seed={3} leafScale={0.7} />
        </g>
      </Layer>

      {/* 2 · drifting mist */}
      <Layer depth={0.2} className="hero-layer--mist">
        <g className="mist-drift">
          <path d="M-200 520 C 0 490 200 530 420 506 C 640 482 820 520 1040 500 C 1260 480 1460 512 1800 492 L1800 560 C 1500 590 1200 552 960 572 C 700 594 400 556 -200 580Z" fill="var(--mist)" opacity={0.9} />
          <path d="M-200 300 C 100 286 300 310 520 298 L 520 318 C 300 330 100 310 -200 326Z" fill="var(--mist)" opacity={0.8} />
        </g>
      </Layer>

      {/* 3 · mid bamboo */}
      <Layer depth={0.32}>
        <g opacity={0.55}>
          <BambooLayer stalks={MID} fill="var(--ink)" gap="var(--rice)" seed={11} />
        </g>
      </Layer>

      {/* 4 · the clash */}
      <Layer depth={0.45} className="hero-layer--fighters">
        <Fighters />
      </Layer>

      {/* 5 · foreground: thick ink stalks, sliced stalk, leaves */}
      <Layer depth={0.75}>
        <BambooLayer stalks={NEAR} fill="var(--ink)" gap="var(--rice)" seed={21} leafScale={1.4} />
        <SlicedStalk />
        <HangingLeaves />
        <FallingLeaves />
      </Layer>

      {/* 6 · ground mist that hands off to the copy */}
      <Layer depth={0.9} className="hero-layer--front">
        <path className="mist-drift mist-drift--slow" d="M-200 900 C 100 860 300 900 560 880 C 820 860 1000 900 1280 884 C 1460 874 1600 890 1800 880 L1800 1000 L-200 1000Z" fill="var(--rice)" />
      </Layer>
    </div>
  );
}
