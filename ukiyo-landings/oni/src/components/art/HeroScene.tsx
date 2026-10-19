import { LanternGlyph } from "./Lantern";
import Steam from "./Steam";

/* ------------------------------------------------------------------ */
/* geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Suyari-gasumi style cloud band: long bar, round ends, scalloped top. */
export function cloudBand(x: number, y: number, w: number, h: number) {
  const r = h / 2;
  const span = w - 2 * r;
  const n = Math.max(2, Math.round(span / (h * 1.25)));
  const s = span / n;
  let d = `M${x + r},${y + h} L${x + w - r},${y + h} A${r},${r} 0 0 0 ${x + w - r},${y}`;
  for (let i = 0; i < n; i++) {
    const to = x + w - r - (i + 1) * s;
    d += ` A${s / 2},${(s / 2) * 0.62} 0 0 0 ${to.toFixed(1)},${y}`;
  }
  d += ` A${r},${r} 0 0 0 ${x + r},${y + h} Z`;
  return d;
}

/** Flared irimoya-ish roof: eave corners kick up. */
function roof(x: number, w: number, eave: number, ridge: number, over = 18) {
  return `M${x - over},${eave + 4} Q${x + w * 0.08},${eave - 2} ${x + w * 0.22},${ridge} L${x + w * 0.78},${ridge} Q${x + w * 0.92},${eave - 2} ${x + w + over},${eave + 4} Z`;
}

const ANGLE = 7.83;
const SIN = Math.sin((ANGLE * Math.PI) / 180);
const COS = Math.cos((ANGLE * Math.PI) / 180);
/** world-space y of the bridge underside at world x */
const underside = (X: number) => {
  const lx = (X + 110 * SIN) / COS;
  return 300 + lx * SIN + 110 * COS;
};

/* far skyline houses: [x, w, eave, ridge] */
const HOUSES: [number, number, number, number][] = [
  [260, 150, 800, 760],
  [430, 120, 820, 786],
  [580, 170, 790, 744],
  [770, 110, 812, 780],
  [900, 160, 770, 726],
  [1080, 120, 800, 770],
];

/* truss holes for the rail bridge (local, un-rotated coordinates) */
const truss = (() => {
  let d = "M-80,336 H1700 V412 H-80 Z";
  for (let x = -80; x < 1700; x += 80) {
    d += ` M${x + 10},344 L${x + 70},344 L${x + 40},402 Z`;
    d += ` M${x + 50},404 L${x + 110},404 L${x + 80},346 Z`;
  }
  return d;
})();

/* lanterns strung from the pier to the izakaya eave */
const STRING = { x0: 790, y0: underside(790) + 30, cx: 980, cy: 800, x1: 1170, y1: 736 };
const stringPoint = (t: number) => {
  const { x0, y0, cx, cy, x1, y1 } = STRING;
  const u = 1 - t;
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
};

/* the near roof the title sits on: edge from (-20,592) to (1010,1004) */
const EDGE = { x0: -20, y0: 592, x1: 1010, y1: 1004 };
const edgeLen = Math.hypot(EDGE.x1 - EDGE.x0, EDGE.y1 - EDGE.y0);
const dir = [(EDGE.x1 - EDGE.x0) / edgeLen, (EDGE.y1 - EDGE.y0) / edgeLen];
const nrm = [-dir[1], dir[0]]; // points into the roof (down-left)
const TILE_ENDS = Array.from({ length: Math.floor(edgeLen / 42) }, (_, i) => {
  const t = 20 + i * 42;
  return [EDGE.x0 + dir[0] * t + nrm[0] * 8, EDGE.y0 + dir[1] * t + nrm[1] * 8];
});
const TILE_ROWS = [40, 80, 130, 190, 260].map((k) => {
  const ox = nrm[0] * k;
  const oy = nrm[1] * k;
  return `M${EDGE.x0 + ox - dir[0] * 200},${EDGE.y0 + oy - dir[1] * 200} L${EDGE.x1 + ox + dir[0] * 200},${EDGE.y1 + oy + dir[1] * 200}`;
});

const ASH: [number, number, number, string][] = [
  [180, 220, 0, "var(--ink)"],
  [420, 160, 1, "var(--rice)"],
  [700, 260, 2, "var(--ink)"],
  [860, 120, 0, "var(--vermilion)"],
  [1000, 640, 1, "var(--ink)"],
  [1480, 220, 2, "var(--ink)"],
  [1560, 560, 0, "var(--rice)"],
  [560, 420, 1, "var(--ink)"],
  [320, 470, 2, "var(--vermilion)"],
  [1260, 140, 1, "var(--ink)"],
  [1100, 300, 0, "var(--rice)"],
  [80, 380, 1, "var(--ink)"],
];
const ASH_SHAPES = ["M0,0 L14,4 L4,10 Z", "M0,0 C6,-6 14,-2 12,6 C8,10 2,8 0,0 Z", "M0,0 L18,2 L16,6 L2,5 Z"];

/* ------------------------------------------------------------------ */

/**
 * Night street under the rail bridge: crimson sky, giant moon, bridge + train,
 * izakaya front with noren and lanterns, near tiled roof in the foreground.
 * Each depth is its own <g data-depth> so GSAP can parallax it.
 */
export default function HeroScene({ className }: { className?: string }) {
  const piers = [300, 760, 1140];
  return (
    <svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMaxYMax slice"
      className={className}
      aria-hidden="true"
    >
      {/* sky */}
      <rect width="1600" height="1000" fill="var(--crimson)" />

      {/* clouds behind moon */}
      <g data-depth="0.15" fill="var(--ink)" opacity={0.2}>
        <path d={cloudBand(60, 150, 760, 46)} />
        <path d={cloudBand(260, 214, 480, 30)} />
        <path d={cloudBand(-40, 470, 520, 36)} />
      </g>

      {/* moon */}
      <g data-depth="0.08" data-moon>
        <circle cx={1250} cy={380} r={300} fill="var(--steel)" />
        <g fill="var(--rice)" opacity={0.28}>
          <path d="M1010,330 C1030,240 1140,200 1190,250 C1230,290 1170,350 1110,360 C1060,368 1000,370 1010,330 Z" />
          <path d="M1330,560 C1370,530 1450,540 1460,590 C1466,630 1390,650 1350,630 C1320,614 1306,580 1330,560 Z" />
        </g>
        <g fill="var(--ink-2)" opacity={0.3}>
          <path d="M1270,150 C1330,120 1430,170 1420,240 C1410,300 1340,290 1306,270 C1266,250 1226,180 1270,150 Z" />
          <path d="M1110,420 C1170,384 1290,430 1286,510 C1282,580 1190,590 1150,556 C1110,520 1070,446 1110,420 Z" />
          <path d="M1370,360 C1400,340 1460,356 1462,398 C1464,436 1414,450 1388,432 C1364,414 1348,376 1370,360 Z" />
          <path d="M990,470 C1014,450 1052,468 1050,500 C1048,526 1012,532 998,514 C984,498 978,480 990,470 Z" />
        </g>
        {[
          [1080, 300, 18],
          [1360, 130, 12],
          [1210, 340, 9],
          [1450, 470, 15],
          [1060, 560, 13],
          [1290, 640, 20],
        ].map(([x, y, r]) => (
          <g key={`${x}`}>
            <circle cx={x} cy={y} r={r} fill="var(--ink-2)" opacity={0.36} />
            <path d={`M${x - r},${y} A${r},${r} 0 0 0 ${x + r},${y}`} fill="none" stroke="var(--rice)" strokeWidth={3} opacity={0.5} />
          </g>
        ))}
        <path d="M1550,380 A300,300 0 0 1 1250,680 C1400,630 1510,520 1550,380 Z" fill="var(--ink-2)" opacity={0.22} />
      </g>

      {/* cloud across the moon face */}
      <g data-depth="0.2" fill="var(--ink)" opacity={0.24}>
        <path d={cloudBand(940, 250, 640, 34)} />
        <path d={cloudBand(1100, 300, 420, 22)} />
      </g>

      {/* far skyline */}
      <g data-depth="0.25" fill="var(--ink-2)">
        {/* pagoda */}
        <g>
          {[0, 1, 2, 3, 4].map((i) => {
            const base = 1000 - i * 92;
            const W = 230 - i * 26;
            const cx = 150;
            return (
              <g key={i}>
                <rect x={cx - W * 0.28} y={base - 70} width={W * 0.56} height={72} />
                <path d={roof(cx - W / 2, W, base - 64, base - 92, 22)} />
              </g>
            );
          })}
          <rect x={147} y={430} width={6} height={110} />
          {[450, 466, 482, 498, 514].map((y) => (
            <rect key={y} x={140} y={y} width={20} height={5} />
          ))}
        </g>
        {HOUSES.map(([x, w, eave, ridge]) => (
          <g key={x}>
            <rect x={x} y={eave} width={w} height={1000 - eave} />
            <path d={roof(x, w, eave, ridge)} />
          </g>
        ))}
        {/* pine */}
        <path d="M1000,1000 L1008,790 L1016,1000 Z" />
        <path d={cloudBand(950, 760, 120, 26)} />
        <path d={cloudBand(970, 712, 90, 22)} />
        <path d={cloudBand(940, 808, 150, 24)} />
        {/* a few lit windows far away */}
        <g fill="var(--gold)" opacity={0.75}>
          <rect x={612} y={820} width={22} height={14} />
          <rect x={930} y={800} width={16} height={12} />
          <rect x={460} y={850} width={14} height={14} />
        </g>
      </g>

      {/* rail bridge + train */}
      <g data-depth="0.35">
        <g transform={`rotate(${ANGLE} 0 300)`}>
          {/* catenary wire + masts */}
          <line x1={-80} y1={196} x2={1700} y2={196} stroke="var(--ink)" strokeWidth={3} />
          {[60, 380, 700, 1020, 1340].map((x) => (
            <rect key={x} x={x} y={170} width={8} height={128} fill="var(--ink)" />
          ))}
          {/* train (slides via GSAP) */}
          <g data-train>
            {[0, 1, 2, 3, 4].map((k) => {
              const x0 = k * 252;
              return (
                <g key={k}>
                  <rect x={x0} y={236} width={242} height={62} fill="var(--ink)" />
                  <rect x={x0 + 8} y={226} width={226} height={12} fill="var(--ink)" />
                  {[0, 1, 2, 3, 4].map((j) => (
                    <rect
                      key={j}
                      x={x0 + 16 + j * 45}
                      y={250}
                      width={j === 2 ? 20 : 30}
                      height={j === 2 ? 34 : 18}
                      fill="var(--gold)"
                    />
                  ))}
                  {k % 2 === 1 && (
                    <path
                      d={`M${x0 + 96},226 L${x0 + 121},200 L${x0 + 146},226 M${x0 + 106},198 L${x0 + 136},198`}
                      stroke="var(--ink)"
                      strokeWidth={4}
                      fill="none"
                    />
                  )}
                  <line x1={x0 + 4} y1={237} x2={x0 + 238} y2={237} stroke="var(--steel)" strokeWidth={2} />
                </g>
              );
            })}
          </g>
          {/* deck + truss */}
          <rect x={-80} y={296} width={1780} height={42} fill="var(--ink)" />
          <line x1={-80} y1={297} x2={1700} y2={297} stroke="var(--steel)" strokeWidth={3} />
          <path d={truss} fill="var(--ink)" fillRule="evenodd" />
          <line x1={-80} y1={411} x2={1700} y2={411} stroke="var(--steel)" strokeWidth={2} opacity={0.6} />
        </g>
        {piers.map((X) => (
          <g key={X}>
            <rect x={X - 27} y={underside(X) - 6} width={54} height={1006 - underside(X)} fill="var(--ink)" />
            <rect x={X - 36} y={underside(X) - 6} width={72} height={18} fill="var(--ink)" />
            <line x1={X - 25} y1={underside(X) + 14} x2={X - 25} y2={1000} stroke="var(--steel)" strokeWidth={3} />
          </g>
        ))}
      </g>

      {/* near street */}
      <g data-depth="0.5">
        {/* back-alley building between piers */}
        <rect x={800} y={800} width={310} height={200} fill="var(--ink)" />
        <path d={roof(800, 310, 800, 768, 14)} fill="var(--ink)" />
        <rect x={850} y={836} width={110} height={56} fill="var(--gold)" />
        {[862, 876, 890, 904, 918, 932, 946].map((x) => (
          <rect key={x} x={x} y={836} width={4} height={56} fill="var(--ink)" />
        ))}
        <rect x={1010} y={826} width={40} height={130} fill="var(--rice)" />
        <text
          x={1030}
          y={870}
          textAnchor="middle"
          fontSize={30}
          fill="var(--ink)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          酒
        </text>
        <text
          x={1030}
          y={928}
          textAnchor="middle"
          fontSize={30}
          fill="var(--crimson)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          処
        </text>

        {/* lantern string */}
        <path
          d={`M${STRING.x0},${STRING.y0} Q${STRING.cx},${STRING.cy} ${STRING.x1},${STRING.y1}`}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={3}
        />
        {[0.18, 0.36, 0.54, 0.72].map((t, i) => {
          const [x, y] = stringPoint(t);
          return <LanternGlyph key={t} x={x - 17} y={y} scale={0.34} kanji={["ら", "ー", "め", "ん"][i]} sway />;
        })}

        {/* izakaya ONI */}
        <rect x={1168} y={640} width={440} height={360} fill="var(--ink)" />
        <path d="M1150,650 L1610,600 L1610,640 L1168,672 Z" fill="var(--ink)" />
        {/* upper lattice window */}
        <rect x={1250} y={672} width={200} height={58} fill="var(--gold)" />
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={1256 + i * 12.4} y={672} width={4} height={58} fill="var(--ink)" />
        ))}
        <rect x={1250} y={698} width={200} height={4} fill="var(--ink)" />
        {/* pent roof with tile ends */}
        <path d="M1136,790 L1610,770 L1610,738 L1168,752 Z" fill="var(--ink)" />
        <line x1={1136} y1={790} x2={1610} y2={770} stroke="var(--steel)" strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => {
          const x = 1150 + i * 40;
          const y = 790 - (x - 1136) * (20 / 474);
          return <circle key={i} cx={x} cy={y + 6} r={8} fill="var(--ink-2)" stroke="var(--ink)" strokeWidth={2} />;
        })}
        {/* sign board */}
        <rect x={1300} y={796} width={142} height={30} fill="var(--ink-2)" stroke="var(--gold)" strokeWidth={2} />
        <text
          x={1371}
          y={819}
          textAnchor="middle"
          fontSize={22}
          letterSpacing={6}
          fill="var(--gold)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          ONI 鬼
        </text>
        {/* doorway light */}
        <rect x={1262} y={834} width={218} height={166} fill="var(--gold)" />
        {/* patrons under the noren: stools + legs */}
        <g fill="var(--ink)">
          <rect x={1272} y={936} width={200} height={10} />
          <rect x={1296} y={946} width={34} height={8} />
          <rect x={1304} y={954} width={6} height={46} />
          <rect x={1318} y={954} width={6} height={46} />
          <path d="M1290,930 L1316,930 L1318,990 L1306,1000 L1296,996 Z" />
          <path d="M1324,930 L1344,930 L1340,992 L1328,998 Z" />
          <rect x={1410} y={946} width={34} height={8} />
          <rect x={1418} y={954} width={6} height={46} />
          <rect x={1432} y={954} width={6} height={46} />
          <path d="M1404,930 L1426,930 L1440,986 L1452,994 L1430,998 Z" />
          <path d="M1430,930 L1450,930 L1462,992 L1446,996 Z" />
        </g>
        {/* noren */}
        <rect x={1252} y={828} width={238} height={8} fill="var(--ink)" />
        {[0, 1, 2].map((i) => (
          <g key={i} className="animate-sway" style={{ animationDuration: `${4.5 + i * 0.7}s`, animationDelay: `${-i * 1.1}s` }}>
            <rect x={1266 + i * 72} y={836} width={68} height={92} fill="var(--ink-2)" />
          </g>
        ))}
        <circle cx={1371} cy={880} r={30} fill="none" stroke="var(--rice)" strokeWidth={4} />
        <text
          x={1371}
          y={894}
          textAnchor="middle"
          fontSize={38}
          fill="var(--rice)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
        >
          鬼
        </text>
        {/* vertical board */}
        <rect x={1500} y={812} width={40} height={168} fill="var(--rice)" />
        <text
          x={1520}
          y={828}
          textAnchor="start"
          fontSize={28}
          letterSpacing={4}
          fill="var(--ink)"
          style={{ fontFamily: "var(--font-display)", fontWeight: 800, writingMode: "vertical-rl" }}
        >
          らーめん
        </text>
        {/* lanterns at the eave */}
        <LanternGlyph x={1188} y={792} scale={0.62} kanji="鬼" sway />
        <LanternGlyph x={1548} y={780} scale={0.62} kanji="麺" sway />
        {/* steam from the doorway */}
        <Steam x={1300} y={640} width={150} height={220} strokes={3} />
        {/* wet street with flat reflections */}
        <rect x={700} y={990} width={900} height={10} fill="var(--ink)" />
      </g>

      {/* near tiled roof (title sits on it) */}
      <g data-depth="0.7">
        <path d={`M${EDGE.x0 - 40},${EDGE.y0 - 16} L${EDGE.x1 + 60},${EDGE.y1 + 24} L-60,1060 Z`} fill="var(--ink)" />
        <g stroke="var(--ink-2)" strokeWidth={7} fill="none">
          {TILE_ROWS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {TILE_ENDS.map(([x, y]) => (
          <g key={`${x.toFixed(0)}`}>
            <circle cx={x} cy={y} r={15} fill="var(--ink)" stroke="var(--ink-2)" strokeWidth={4} />
            <path d={`M${x - 13},${y - 6} A15,15 0 0 1 ${x + 4},${y - 14.5}`} fill="none" stroke="var(--steel)" strokeWidth={3} />
          </g>
        ))}
        <line
          x1={EDGE.x0}
          y1={EDGE.y0 - 7}
          x2={EDGE.x1 + 40}
          y2={EDGE.y1 + 9}
          stroke="var(--steel)"
          strokeWidth={2}
          opacity={0.7}
        />
      </g>

      {/* drifting ash and petals */}
      <g data-depth="0.9">
        {ASH.map(([x, y, s, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path
              d={ASH_SHAPES[s]}
              fill={c}
              className="drift"
              style={{ animationDuration: `${7 + (i % 5) * 1.7}s`, animationDelay: `${-i * 1.3}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
