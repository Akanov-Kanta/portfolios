import { arcPoints, f, makeBody, outline, rail, rng, sampleSpline } from "@/lib/serpent";

/** Moonlit tiled roof cutting the bottom of the hero on a diagonal. */
export function Roof({ className = "" }: { className?: string }) {
  const r: [number, number] = [0.99, -0.139];
  const d: [number, number] = [0.139, 0.99];
  const ridgeY = (x: number) => 318 + (x + 40) * (r[1] / r[0]);
  const rows: string[] = [];
  const glints: string[] = [];
  for (let x = -40; x < 1700; x += 38) {
    const y = ridgeY(x) + 18;
    rows.push(`M${f([x, y])}L${f([x + d[0] * 600, y + d[1] * 600])}`);
    glints.push(`M${f([x + 9, y + 4])}L${f([x + 9 + d[0] * 600, y + 4 + d[1] * 600])}`);
  }
  // tile courses: little arcs across rows
  let courses = "";
  for (let x = -40; x < 1700; x += 38) {
    for (let k = 1; k < 9; k++) {
      const y0 = ridgeY(x) + 18 + k * 46;
      const p = [x + d[0] * k * 46, y0];
      courses += `M${f([p[0] + 3, p[1]])}q16,-9 32,${(-38 * r[1] / r[0]).toFixed(1)}`;
    }
  }
  return (
    <svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <path d={`M-40,${ridgeY(-40)} L1640,${ridgeY(1640).toFixed(1)} L1640,420 L-40,420 Z`} fill="var(--ink-2)" />
      <path d={rows.join("")} stroke="var(--ink)" strokeWidth="13" />
      <path d={glints.join("")} stroke="var(--steel)" strokeWidth="2" opacity="0.55" />
      <path d={courses} stroke="var(--ink)" strokeWidth="3" fill="none" opacity="0.8" />
      {/* ridge cap */}
      <path d={`M-40,${ridgeY(-40) + 22} L1640,${(ridgeY(1640) + 22).toFixed(1)} L1640,${(ridgeY(1640) - 22).toFixed(1)} L-40,${ridgeY(-40) - 22} Z`} fill="var(--ink)" />
      <path d={`M-40,${ridgeY(-40) - 22} L1640,${(ridgeY(1640) - 22).toFixed(1)}`} stroke="var(--steel)" strokeWidth="3" />
      <path d={`M-40,${ridgeY(-40) - 4} L1640,${(ridgeY(1640) - 4).toFixed(1)}`} stroke="var(--ink-2)" strokeWidth="3" />
    </svg>
  );
}

/** Ink bamboo grove (sumi-e). */
export function Bamboo({ className = "", seed = 4 }: { className?: string; seed?: number }) {
  const rand = rng(seed);
  const stalks = [
    { x: 120, w: 34 },
    { x: 210, w: 16 },
    { x: 262, w: 28 },
    { x: 350, w: 20 },
  ];
  const leaves: string[] = [];
  stalks.forEach((s, i) => {
    for (let k = 0; k < 3; k++) {
      const y = 120 + rand() * 640;
      const dir = (i + k) % 2 ? 1 : -1;
      for (let j = 0; j < 4; j++) {
        const len = 60 + rand() * 50;
        const a = (dir * (20 + j * 16 + rand() * 10) * Math.PI) / 180;
        const bx = s.x + (dir > 0 ? s.w : 0);
        const tip = [bx + Math.cos(a) * len * dir, y + j * 10 + Math.sin(Math.abs(a)) * len * 0.6];
        const mid = [(bx + tip[0]) / 2, (y + tip[1]) / 2];
        const nx = -(tip[1] - y) / len;
        const ny = (tip[0] - bx) / len;
        const wd = 9;
        leaves.push(
          `M${f([bx, y + j * 10])}Q${f([mid[0] + nx * wd, mid[1] + ny * wd])} ${f(tip as [number, number])}Q${f([mid[0] - nx * wd * 0.6, mid[1] - ny * wd * 0.6])} ${f([bx, y + j * 10])}Z`,
        );
      }
    }
  });
  return (
    <svg viewBox="0 0 400 900" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      {stalks.map((s, i) => {
        const nodes = [];
        for (let y = 60 + i * 37; y < 900; y += 150 + (i % 2) * 30) nodes.push(y);
        return (
          <g key={i}>
            <rect x={s.x} y={0} width={s.w} height={900} fill="var(--ink)" />
            {nodes.map((y) => (
              <g key={y}>
                <rect x={s.x - 3} y={y} width={s.w + 6} height={6} fill="var(--ink)" />
                <path d={`M${s.x + 3},${y + 10} q${s.w / 2 - 3},-7 ${s.w - 6},0`} stroke="var(--rice)" strokeWidth="2" fill="none" />
              </g>
            ))}
            <rect x={s.x + s.w * 0.22} y={0} width={2} height={900} fill="var(--rice)" opacity="0.35" />
          </g>
        );
      })}
      <path d={leaves.join("")} fill="var(--ink)" />
    </svg>
  );
}

/** Brushed ensō circle with dry-brush streaks. */
export function Enso({ className = "" }: { className?: string }) {
  const pts = arcPoints(200, 200, 150, (-100 * Math.PI) / 180, (238 * Math.PI) / 180, 60, 4);
  const b = makeBody(sampleSpline(pts, 260), (t) => (t < 0.08 ? 20 + 170 * t : t > 0.7 ? 34 * (1 - (t - 0.7) / 0.3) + 3 : 34));
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <g filter="url(#brush)">
        <path d={outline(b, 0, 1, { capStart: "round" })} fill="var(--ink)" />
        <path d={rail(b, 0.35, 0.55, 1)} stroke="var(--rice)" strokeWidth="2.2" fill="none" />
        <path d={rail(b, -0.3, 0.72, 1)} stroke="var(--rice)" strokeWidth="1.6" fill="none" />
        <path d={rail(b, 0.05, 0.85, 1)} stroke="var(--rice)" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}

/** Ink splatter. */
export function Splatter({ className = "", seed = 1, color = "var(--ink)" }: { className?: string; seed?: number; color?: string }) {
  const rand = rng(seed);
  const drops = Array.from({ length: 26 }, () => {
    const a = rand() * Math.PI * 2;
    const d = 20 + Math.pow(rand(), 1.6) * 90;
    return { x: 100 + Math.cos(a) * d, y: 100 + Math.sin(a) * d, r: Math.max(1, 9 - d / 12 + rand() * 3) };
  });
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g fill={color} filter="url(#rough)">
        <circle cx="100" cy="100" r="24" />
        {drops.map((d, i) => (
          <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(1)} />
        ))}
      </g>
    </svg>
  );
}

/** Katana in its scabbard; the blade is a separate group so it can be drawn out. */
export function Katana({ className = "" }: { className?: string }) {
  let wrap = "";
  for (let x = 30; x < 250; x += 22) wrap += `M${x},20 L${x + 11},40 L${x + 22},20 M${x},40 L${x + 11},20 L${x + 22},40 `;
  return (
    <svg viewBox="0 0 1600 60" className={className} aria-hidden="true" preserveAspectRatio="xMinYMid meet">
      {/* tsuka (handle) */}
      <path d="M10,18 L262,16 L262,44 L10,42 Q2,30 10,18 Z" fill="var(--ink-2)" />
      <path d={wrap} stroke="var(--gold)" strokeWidth="3" fill="none" />
      {/* tsuba */}
      <ellipse cx="276" cy="30" rx="12" ry="28" fill="var(--gold)" />
      <ellipse cx="276" cy="30" rx="5" ry="14" fill="var(--ink)" />
      <g data-blade>
        <path d="M290,22 L1500,20 Q1560,22 1592,34 Q1560,38 1500,40 L290,38 Z" fill="var(--steel)" />
        <path d="M290,22 L1500,20 Q1560,22 1592,34 L1500,28 L290,28 Z" fill="var(--rice)" />
        <path
          d={Array.from({ length: 30 }, (_, i) => `${i ? "L" : "M"}${300 + i * 41},${i % 2 ? 31 : 34}`).join("")}
          stroke="var(--rice)"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
}

/** Seigaiha (blue ocean wave) band. */
export function Seigaiha({ className = "" }: { className?: string }) {
  const rows: React.ReactNode[] = [];
  const R = 30;
  for (let row = 0; row < 4; row++) {
    for (let i = -1; i < 56; i++) {
      const cx = i * R * 2 + (row % 2 ? R : 0);
      const cy = row * R * 0.55 + R;
      rows.push(
        <g key={`${row}-${i}`}>
          {[1, 0.75, 0.5, 0.25].map((k) => (
            <circle key={k} cx={cx} cy={cy} r={R * k} fill={k === 1 ? "var(--ink-2)" : "none"} stroke={k === 1 ? "var(--ink)" : "var(--steel)"} strokeWidth={k === 1 ? 4 : 2} opacity={k === 1 ? 1 : 0.55} />
          ))}
        </g>,
      );
    }
  }
  return (
    <svg viewBox="0 0 3200 100" preserveAspectRatio="xMinYMin slice" className={className} aria-hidden="true">
      {rows}
    </svg>
  );
}
