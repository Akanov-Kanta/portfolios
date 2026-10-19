/* Ink-line ornaments painted on the gold-leaf screen panels (Rinpa / Kanō style). */
const line = { fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function CloudOrnament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 220" className={className} aria-hidden="true">
      <g {...line}>
        <path d="M24 170c-14-26 8-50 34-42 0-32 38-48 62-28 12-34 62-38 80-6 26-14 60 4 58 34 26 2 34 32 14 42" />
        <path d="M18 176h270" />
        <path d="M58 128c6-14 24-18 34-8M120 100c8-12 28-12 36 2M200 94c10-8 26-4 30 8" />
        <path d="M40 148c-2-12 10-20 20-14 8 6 4 18-6 18M266 152c4-10-4-20-14-16-8 4-6 16 4 16" />
        <path d="M60 200c20-10 50-10 70 0M150 204c24-10 56-10 80 0" />
        <path d="M112 202c0-10 12-14 18-6M216 206c0-10 12-14 18-6" />
      </g>
      {/* sword cutting through cloud */}
      <path d="M20 40L250 150" stroke="var(--rice)" strokeWidth="5" />
      <path d="M20 40L250 150" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M250 150l26 12-6 6z" fill="var(--ink)" />
    </svg>
  );
}

export function WaveOrnament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 220" className={className} aria-hidden="true">
      <path
        d="M10 210C24 132 86 62 176 56c44-2 76 24 72 54-4 22-26 30-40 18 14-2 20-14 12-26-14-20-58-12-70 22-10 28 6 64 50 72H10z"
        fill="var(--ink)"
      />
      <g {...line} stroke="var(--gold)" strokeWidth="2.4">
        <path d="M40 196c14-60 60-110 122-118M70 198c10-44 44-84 92-92M104 198c6-30 26-58 58-66" />
      </g>
      {/* claw-like foam tips */}
      <g fill="var(--rice)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={`M${150 + i * 16} ${60 + (i % 2) * 4}l6-14 4 10 6-12 2 16z`} />
        ))}
      </g>
      <g {...line}>
        <path d="M200 210c20-14 40-14 60 0M240 192c14-10 30-10 44 0" />
      </g>
      <circle cx="240" cy="26" r="16" fill="var(--crimson)" />
    </svg>
  );
}

export function MoonCycleOrnament({ className = "" }: { className?: string }) {
  const phases = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 300 220" className={className} aria-hidden="true">
      {phases.map((p) => {
        const cx = 34 + p * 58;
        const cy = 110 - Math.sin((p / 4) * Math.PI) * 50;
        const r = 18 + p * 3;
        return (
          <g key={p}>
            <circle cx={cx} cy={cy} r={r} fill={p === 4 ? "var(--crimson)" : "var(--ink)"} />
            {p < 4 && <circle cx={cx + r * (1 - p / 4) * 1.1 + 4} cy={cy - 2} r={r} fill="var(--gold)" />}
          </g>
        );
      })}
      <g {...line}>
        <path d="M10 196c40-20 80-20 120 0s80 20 160 0" />
        <path d="M30 176c26-12 52-12 78 0M170 178c30-12 60-12 90 0" />
      </g>
      {/* pine branch */}
      <g fill="var(--ink)">
        <path d="M300 214c-30-10-60-30-80-60l4-4c22 28 50 46 78 58z" />
        <path d="M206 150c10-14 32-16 46-8 10 6 4 16-6 16h-32c-8 0-12-2-8-8zM240 186c10-12 30-12 42-4 8 6 2 14-8 14h-28c-8 0-10-4-6-10z" />
      </g>
    </svg>
  );
}

export function DragonOrnament({ className = "" }: { className?: string }) {
  const body = "M20 190C60 120 120 200 160 140S240 60 200 40 130 70 170 96";
  return (
    <svg viewBox="0 0 300 220" className={className} aria-hidden="true">
      <path d={body} fill="none" stroke="var(--ink)" strokeWidth="26" strokeLinecap="round" />
      <path d={body} fill="none" stroke="var(--gold)" strokeWidth="18" strokeLinecap="round" />
      <path d={body} fill="none" stroke="var(--ink)" strokeWidth="9" strokeDasharray="1 7" strokeLinecap="round" opacity="0.9" />
      {/* spine fins */}
      <g fill="var(--ink)">
        <path d="M62 140l6-16 6 14zM98 168l4-18 8 14zM150 150l10-14 2 16zM190 90l12-10v16zM226 52l14-4-6 14z" />
      </g>
      {/* head */}
      <path d="M160 92l40 6 18 18-16 4-20-6-10 14-14-8z" fill="var(--ink)" />
      <path d="M200 98c20-14 40-20 64-16M206 112c24 6 44 20 56 40M176 92c-6-20 2-36 18-44" {...line} />
      <circle cx="190" cy="102" r="3" fill="var(--rice)" />
      {/* claw */}
      <path d="M110 186l-8 18M116 188l2 18M122 184l10 14" {...line} />
      {/* flame pearls */}
      <circle cx="262" cy="174" r="12" fill="var(--crimson)" />
      <path d="M262 160c6-12 0-20 8-30M252 166c-4-10-12-12-12-22" {...line} />
    </svg>
  );
}
