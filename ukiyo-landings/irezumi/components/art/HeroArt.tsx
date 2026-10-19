import { at, Body, f, Pt, rng } from "@/lib/serpent";
import { buildDragon, DragonBody, DragonHeadAt, DragonLegAt } from "./dragon";
import { cloudPath } from "./common";

const MOON: { cx: number; cy: number; r: number } = { cx: 500, cy: 500, r: 330 };

function nearestT(b: Body, p: Pt) {
  let best = 0;
  let bd = Infinity;
  b.pts.forEach((q, i) => {
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best / (b.n - 1);
}

const CTRL: Pt[] = [
  [990, 940],
  [800, 815],
  [560, 845],
  [320, 795],
  [150, 690],
  [105, 565],
  [215, 495],
  [480, 515],
  [760, 465],
  [950, 350],
  [915, 190],
  [750, 140],
  [560, 205],
  [385, 250],
];

const width = (t: number) => (t < 0.38 ? 9 + 63 * Math.pow(t / 0.38, 0.62) : t > 0.86 ? 72 - 12 * ((t - 0.86) / 0.14) : 72);

function MoonFace() {
  const rand = rng(42);
  const craters: { x: number; y: number; r: number }[] = [];
  while (craters.length < 26) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 300;
    const r = 6 + rand() * 22;
    if (d + r < MOON.r - 8) craters.push({ x: MOON.cx + Math.cos(a) * d, y: MOON.cy + Math.sin(a) * d, r });
  }
  const stipple: { x: number; y: number; r: number }[] = [];
  while (stipple.length < 260) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 318;
    stipple.push({ x: Math.round(MOON.cx + Math.cos(a) * d), y: Math.round(MOON.cy + Math.sin(a) * d), r: Math.round((1 + rand() * 3.2) * 10) / 10 });
  }
  return (
    <g>
      <circle cx={MOON.cx} cy={MOON.cy} r={MOON.r} fill="var(--steel)" />
      {/* maria — flat darker fields */}
      <g fill="var(--ink-2)" opacity="0.32">
        <path d="M300,330 C340,270 450,260 500,300 C560,340 520,400 450,410 C400,420 380,470 330,470 C270,470 250,380 300,330 Z" />
        <path d="M560,560 C620,520 720,540 740,600 C760,660 700,720 640,700 C600,690 590,740 540,730 C480,720 500,600 560,560 Z" />
        <path d="M620,250 C670,230 730,260 720,310 C712,350 660,340 640,330 C600,310 590,262 620,250 Z" />
        <path d="M250,560 C280,540 330,560 330,600 C330,650 280,660 260,640 C236,620 228,576 250,560 Z" />
      </g>
      <g fill="var(--ink-2)" opacity="0.28">
        {stipple.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={c.r} />
        ))}
      </g>
      <g fill="var(--ink-2)" opacity="0.22">
        {craters.map((c, i) => (
          <ellipse key={i} cx={Math.round(c.x)} cy={Math.round(c.y)} rx={Math.round(c.r)} ry={Math.round(c.r * 0.82)} />
        ))}
      </g>
    </g>
  );
}

function TailFlame({ b }: { b: Body }) {
  const a = at(b, 0);
  return (
    <g transform={`translate(${f(a.p)}) rotate(${a.deg.toFixed(1)}) scale(1,-1)`}>
      <path
        style={{ fill: "var(--dr-fin)", stroke: "var(--dr-line)", strokeWidth: 4, strokeLinejoin: "round" }}
        d="M6,-6 C-20,-30 -50,-44 -92,-84 C-72,-52 -66,-38 -80,-22 C-100,-32 -122,-30 -144,-42 C-120,-18 -104,-2 -134,14 C-98,16 -82,28 -102,52 C-60,36 -36,20 6,6 Z"
      />
      <path style={{ fill: "none", stroke: "var(--dr-rim)", strokeWidth: 2 }} d="M-10,-10 C-40,-34 -56,-44 -74,-62 M-20,0 C-56,-6 -84,-10 -110,-20 M-20,8 C-50,12 -70,18 -86,30" />
    </g>
  );
}

export default function HeroArt({ className = "" }: { className?: string }) {
  const b = buildDragon({ ctrl: CTRL, samples: 340, width, legs: [], headScale: 1, sw: 4 });
  const tA = nearestT(b, CTRL[4]);
  const tC = nearestT(b, CTRL[9]);
  const sw = 4;
  const c1 = cloudPath(70, 880, [70, 90, 60, 110, 80]);
  const c2 = cloudPath(560, 905, [60, 80, 100, 70]);
  return (
    <svg viewBox="0 0 1000 1000" className={`art hero-art ${className}`} aria-hidden="true" overflow="visible">
      {/* full body — the stretch that passes behind the moon */}
      <g data-layer="back">
        <DragonBody b={b} sw={sw} />
      </g>
      <g data-layer="moon">
        <MoonFace />
      </g>
      {/* low cloud bank crossing the moon */}
      <g data-layer="clouds" style={{ fill: "var(--ink-2)", stroke: "var(--ink)", strokeWidth: 4 }}>
        <path d={c1.d} />
        <path d={c1.swirls} fill="none" stroke="var(--steel)" strokeWidth="2" opacity="0.6" />
        <path d={c2.d} />
        <path d={c2.swirls} fill="none" stroke="var(--steel)" strokeWidth="2" opacity="0.6" />
      </g>
      {/* front stretches re-drawn over the moon so the dragon coils around it */}
      <g data-layer="front-tail">
        <DragonLegAt b={b} t={0.24} scale={0.95} sw={sw} />
        <TailFlame b={b} />
        <DragonBody b={b} t0={0} t1={tA} sw={sw} />
      </g>
      <g data-layer="front-head">
        <DragonBody b={b} t0={tC} t1={1} sw={sw} />
        <DragonLegAt b={b} t={0.8} scale={0.9} sw={sw} />
        <DragonLegAt b={b} t={0.93} scale={1.05} sw={sw} pearl />
        <DragonHeadAt b={b} scale={1.22} sw={sw} />
      </g>
    </svg>
  );
}
