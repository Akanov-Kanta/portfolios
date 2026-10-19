/**
 * Hand-built flat illustrations. No gradients for volume: shapes are carved by solid fills,
 * with thin steel "rim light" lines like the cel outlines in Kawajiri's "Program".
 */
import { useId } from "react";

/* deterministic pseudo-random so server and client render identically */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/* ── Giant moon ────────────────────────────────────────────────────── */
export function Moon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="100" fill="var(--steel)" />
      {/* maria: flat darker blotches */}
      <g fill="var(--ink-2)" opacity="0.32">
        <path d="M44 52c10-12 30-14 40-4s4 24-8 28-22 8-30 0-12-12-2-24Z" />
        <path d="M112 34c14-4 30 2 32 14s-10 18-22 16-26-4-24-14 4-14 14-16Z" />
        <path d="M128 96c14-8 36-2 40 14s-6 34-22 34-30-6-32-20 2-20 14-28Z" />
        <path d="M58 118c8-6 22-4 26 6s-2 20-14 20-18-4-18-12 0-10 6-14Z" />
        <path d="M92 156c8-4 20 0 20 8s-8 12-16 10-12-6-10-12 2-4 6-6Z" />
      </g>
      <g fill="var(--ink-2)" opacity="0.18">
        <path d="M24 96c6-6 18-6 20 4s-6 16-14 14-12-12-6-18Z" />
        <path d="M150 62c6-2 14 2 14 8s-8 8-12 6-6-12-2-14Z" />
        <path d="M100 90c4-4 12-2 12 4s-6 8-10 6-4-8-2-10Z" />
      </g>
      {/* crater rings */}
      <g fill="none" stroke="var(--rice)" strokeWidth="1.2" opacity="0.5">
        <circle cx="74" cy="84" r="6" />
        <circle cx="120" cy="40" r="3" />
      </g>
      {/* a flat lit crescent on the right edge */}
      <path d="M200 100a100 100 0 0 1-70 95.4A110 110 0 0 0 186 100 110 110 0 0 0 130 4.6 100 100 0 0 1 200 100Z" fill="var(--rice)" opacity="0.22" />
    </svg>
  );
}

/* ── The ronin: kasa hat, haori, drawn blade, vermilion scarf in the wind ─ */
export function Ronin({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-70 30 420 480" className={className} aria-hidden="true">
      {/* scarf streaming left (behind the body) */}
      <g fill="var(--vermilion)">
        <path
          className="sway"
          d="M144 110C120 104 96 120 70 108 46 98 20 114-10 101-30 92-50 99-68 90l6 11C-42 110-22 104-4 113 24 126 52 118 76 126c24 8 46-6 68 0Z"
        />
        <path
          className="sway"
          style={{ animationDelay: "-1.1s" }}
          d="M142 122c-22 8-48 18-74 16-26-2-48 12-80 8l7 9c28 4 51-9 75-7 28 2 52-10 72-18Z"
        />
      </g>

      {/* saya (scabbard) at the left hip */}
      <path d="M120 258l7 10L6 342l-6-8Z" fill="var(--ink)" />
      <path d="M120 258 6 334" stroke="var(--steel)" strokeWidth="1.4" opacity="0.6" />

      {/* body: shoulders, sleeves, torso, hakama */}
      <path
        fill="var(--ink)"
        d="M136 96L166 96 164 114 200 124C214 134 226 156 234 186 240 210 242 232 240 256L234 276 218 274C212 262 210 250 208 236L202 262 212 310 226 380 240 450 248 500 250 506H200L198 498 186 440 172 380 160 350 150 352 138 400 126 450 116 498 114 506H66L64 500 46 496 60 490 72 440 88 380 104 316 116 268 114 256C104 262 88 268 68 270L56 266 66 258C78 246 84 222 88 196 92 172 98 146 108 134L136 118Z"
      />

      {/* kasa hat */}
      <path
        fill="var(--ink)"
        d="M82 106c26-26 46-44 68-56 22 10 44 26 70 48l2 6c-28-8-50-10-72-10-24 0-44 4-70 14Z"
      />

      {/* inner cel lines */}
      <g fill="none" stroke="var(--steel)" strokeLinecap="round" opacity="0.38" strokeWidth="1.6">
        <path d="M118 256h82" />
        <path d="M118 264h80" />
        <path d="M150 128l-6 124" />
        <path d="M140 300l-14 150" />
        <path d="M174 300l12 140" />
        <path d="M108 140c-4 40-8 80-22 116" />
        <path d="M96 100c18-6 36-10 54-10 22 0 46 4 66 10" />
      </g>

      {/* rim light from the moon behind */}
      <g fill="none" stroke="var(--steel)" strokeLinecap="round" strokeWidth="2.4">
        <path d="M150 50c22 10 44 26 70 48" />
        <path d="M200 124c14 10 26 32 34 62 6 24 8 46 6 70" />
        <path d="M212 310 226 380 240 450 248 500" />
        <path d="M104 132c-10 10-16 26-20 46" opacity="0.7" />
      </g>

      {/* drawn katana held low, edge catching the moon */}
      <path d="M216 246l8-4 18 36-8 4Z" fill="var(--ink)" />
      <rect x="226" y="270" width="16" height="6" rx="2" transform="rotate(-26 234 273)" fill="var(--gold)" />
      <path d="M233 281l7-3c18 50 50 128 98 198l-5 4c-52-66-82-148-100-199Z" fill="var(--steel)" />
      <path d="M238 280c18 50 50 128 98 198" fill="none" stroke="var(--rice)" strokeWidth="1.6" />
    </svg>
  );
}

/* ── Temple roof ridge: diagonal across the hero (stretched, so strokes don't scale) ─ */
export function Roof({ className = "" }: { className?: string }) {
  // ridge: y = 280 - 0.24x  (viewBox 1000 x 400)
  const ridge = (x: number) => 280 - 0.24 * x;
  const channels = [];
  for (let x = -400; x <= 1000; x += 26) {
    const y0 = ridge(x);
    channels.push({ x0: x, y0, x1: x - 150, y1: 400, alt: Math.round(x / 26) % 2 === 0 });
  }
  const courses = [40, 90, 150, 220, 300];
  return (
    <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 280 1000 40V400H0Z" fill="var(--ink-2)" />
      <g vectorEffect="non-scaling-stroke">
        {channels.map((c, i) => (
          <line
            key={i}
            x1={r1(c.x0)}
            y1={r1(c.y0)}
            x2={r1(c.x1)}
            y2={c.y1}
            stroke={c.alt ? "var(--ink)" : "var(--steel)"}
            strokeWidth={c.alt ? 5 : 1}
            opacity={c.alt ? 0.9 : 0.35}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {courses.map((d) => (
          <line
            key={d}
            x1="0"
            y1={280 + d}
            x2="1000"
            y2={40 + d}
            stroke="var(--ink)"
            strokeWidth="2"
            opacity="0.55"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
      {/* ridge cap */}
      <path d="M0 266 1000 26V52L0 296Z" fill="var(--ink)" />
      <line x1="0" y1="266" x2="1000" y2="26" stroke="var(--steel)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* onigawara: ridge-end ornament */}
      <path d="M50 262c-6-30 6-52 30-64-4 18 2 30 14 36l-4 18Z" fill="var(--ink)" />
      {/* foreground lower roof, darker, bottom-left */}
      <path d="M0 360c120-12 240-22 330-40l20 6L320 400H0Z" fill="var(--ink)" />
    </svg>
  );
}

/* ── Flying ink debris / shards ────────────────────────────────────── */
export function Debris({ count = 18, seed = 11, className = "" }: { count?: number; seed?: number; className?: string }) {
  const rand = rng(seed);
  const shards = Array.from({ length: count }, (_, i) => {
    const x = r1(rand() * 100);
    const y = r1(rand() * 70);
    const s = r1(4 + rand() * 14);
    const rot = Math.round(rand() * 360);
    const kind = i % 3;
    return { x, y, s, rot, kind };
  });
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {shards.map((d, i) => (
        <span
          key={i}
          data-debris=""
          className="absolute block"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.s,
            height: d.kind === 0 ? d.s * 0.45 : d.s,
            background: "var(--ink)",
            clipPath:
              d.kind === 0 ? "none" : d.kind === 1 ? "polygon(0 0,100% 30%,40% 100%)" : "polygon(20% 0,100% 50%,0 100%)",
            transform: `rotate(${d.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Bamboo grove (sumi silhouettes). depth 0 = far mist, 1 = near ink ─ */
export function Bamboo({
  stalks = 7,
  seed = 3,
  depth = 1,
  className = "",
}: {
  stalks?: number;
  seed?: number;
  depth?: number;
  className?: string;
}) {
  const rand = rng(seed);
  const items = Array.from({ length: stalks }, () => {
    const x = r1(20 + rand() * 360);
    const w = r1(depth > 0.5 ? 9 + rand() * 9 : 5 + rand() * 6);
    const lean = r1((rand() - 0.5) * 18);
    const nodes = [] as number[];
    let y = 40 + rand() * 60;
    while (y < 1000) {
      nodes.push(Math.round(y));
      y += 90 + rand() * 70;
    }
    const leaves = Array.from({ length: 2 + Math.floor(rand() * 3) }, () => ({
      y: Math.round(60 + rand() * 600),
      dir: rand() > 0.5 ? 1 : -1,
      len: Math.round(40 + rand() * 50),
    }));
    return { x, w, lean, nodes, leaves };
  });
  return (
    <svg viewBox="0 0 400 1000" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <g fill="currentColor">
        {items.map((b, i) => (
          <g key={i} transform={`skewX(${b.lean / 10})`}>
            <rect x={b.x} y="-20" width={b.w} height="1040" />
            {b.nodes.map((n) => (
              <rect key={n} x={b.x - 2} y={n} width={b.w + 4} height="3" fill="var(--rice)" opacity="0.85" />
            ))}
            {b.leaves.map((l, j) => (
              <g key={j} transform={`translate(${r1(b.x + b.w / 2)} ${l.y})`}>
                <path d={`M0 0c${l.dir * l.len * 0.4} -10 ${l.dir * l.len * 0.8} -6 ${l.dir * l.len} 6c${-l.dir * l.len * 0.5} -2 ${-l.dir * l.len * 0.8} 0 ${-l.dir * l.len} -6Z`} />
                <path
                  d={`M0 4c${l.dir * l.len * 0.35} 4 ${l.dir * l.len * 0.7} 14 ${l.dir * l.len * 0.85} 28c${-l.dir * l.len * 0.4} -10 ${-l.dir * l.len * 0.7} -18 ${-l.dir * l.len * 0.85} -28Z`}
                />
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ── Gold-leaf screen ornaments: Rinpa mist bands + seigaiha waves in ink line ─ */
export function GoldOrnament({ variant = 0, className = "" }: { variant?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const flip = variant % 2 === 1;
  return (
    <svg viewBox="0 0 300 500" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <pattern id={`sei-${id}`} width="40" height="20" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--ink)" strokeWidth="1.1">
            {[18, 13, 8, 3].map((r) => (
              <g key={r}>
                <path d={`M${20 - r} 20a${r} ${r} 0 0 1 ${r * 2} 0`} />
                <path d={`M${-r} 10a${r} ${r} 0 0 1 ${r * 2} 0`} />
                <path d={`M${40 - r} 10a${r} ${r} 0 0 1 ${r * 2} 0`} />
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <g transform={flip ? "translate(300 0) scale(-1 1)" : undefined}>
        {/* suyari-gasumi: long mist bands with rounded ends */}
        <g fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.4" opacity="0.9">
          <path d="M-20 40h170c14 0 22 8 22 18s-8 18-22 18H60c-12 0-18 6-18 14s6 14 18 14h120c12 0 20 8 20 16s-8 16-20 16H-20Z" />
        </g>
        {/* swirl clouds */}
        <g fill="none" stroke="var(--ink)" strokeWidth="1.3" opacity="0.75">
          <path d="M210 120c0-14 12-24 26-22 16 2 22 20 12 30-8 8-22 4-22-6 0-8 10-10 14-4" />
          <path d="M236 98c4-16 22-24 38-16" />
          <path d="M40 220c0-10 8-18 20-16 12 2 16 14 8 22-6 6-16 2-16-4 0-6 6-8 10-4" />
        </g>
        {/* waves at the foot of the panel */}
        <rect x="0" y="400" width="300" height="100" fill={`url(#sei-${id})`} opacity="0.55" />
        <path d="M0 400c40-18 80-18 120 0s80 18 120 0 60-12 60-12" fill="none" stroke="var(--ink)" strokeWidth="1.6" opacity="0.7" />
      </g>
    </svg>
  );
}

/* ── Tapered brush stroke (filled shape, not a line) ───────────────── */
export function Brush({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 400 40" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path
        fill={color}
        d="M2 24C40 12 90 10 150 12s120 2 170-2c30-2 56-4 76 0 4 2 2 6-4 7-40 6-90 10-150 12-70 2-140 4-200 6-20 0-36-2-42-6-4-2-2-4 2-5Z"
      />
      <path fill={color} opacity="0.85" d="M330 9c20-2 40-1 60 2l-2 3c-18-1-38-2-58-1Z" />
    </svg>
  );
}

/* vertical brush stroke for the scroll columns */
export function BrushV({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 200" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path fill={color} d="M10 2c6 2 9 10 9 30l-1 70c0 40-2 70-6 94-1 3-3 3-4 0-3-26-4-60-4-96l1-70C5 12 6 2 10 2Z" />
    </svg>
  );
}
