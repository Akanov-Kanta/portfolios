/** Diagonal temple roof; ridge rises left→right: y = 220 − 150·(x/1440). Stretched to fill. */
export function Roof({ className = "" }: { className?: string }) {
  const ridge = (x: number) => 220 - (150 * x) / 1440;
  const channels = Array.from({ length: 52 }, (_, i) => i * 30 - 20);
  return (
    <svg viewBox="0 0 1440 360" preserveAspectRatio="none" className={className} aria-hidden="true">
      <polygon points="0,220 1440,70 1440,360 0,360" fill="var(--ink-2)" />
      {channels.map((x) => (
        <g key={x}>
          <line
            x1={x}
            y1={ridge(x) + 16}
            x2={x - 90}
            y2={360}
            stroke="var(--ink)"
            strokeWidth="7"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={x + 13}
            y1={ridge(x + 13) + 18}
            x2={x - 77}
            y2={360}
            stroke="#2b4862"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
      {/* ridge cap */}
      <polygon points="0,204 1440,54 1440,86 0,236" fill="var(--ink)" />
      <line x1="0" y1="204" x2="1440" y2="54" stroke="var(--steel)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {/* end tiles along the ridge face */}
      {Array.from({ length: 24 }, (_, i) => i * 62 + 20).map((x) => (
        <rect key={x} x={x} y={ridge(x) - 2} width="8" height="18" fill="var(--ink-2)" />
      ))}
    </svg>
  );
}

/** Onigawara / shachi ornament at the roof's high end. */
export function RoofOrnament({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 160" className={className} aria-hidden="true">
      <path
        d="M20 160L34 92Q30 60 48 34 62 14 86 6q-14 16-12 34 22-18 40-14-22 10-26 30 10 6 14 18-18-6-30 2l-4 84z"
        fill="var(--ink)"
      />
      <path d="M48 70q14-8 26 0M44 96q16-8 30 0" stroke="var(--ink-2)" strokeWidth="3" fill="none" />
      <path d="M86 6q-14 16-12 34" stroke="var(--steel)" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Distant five-tier pagoda silhouette. */
export function Pagoda({ className = "", fill = "var(--crimson-deep)" }: { className?: string; fill?: string }) {
  const tiers = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 200 400" className={className} aria-hidden="true">
      <g fill={fill}>
        <rect x="96" y="20" width="8" height="80" />
        {[34, 46, 58, 70].map((y) => (
          <rect key={y} x="88" y={y} width="24" height="4" />
        ))}
        {tiers.map((k) => {
          const y = 360 - k * 58;
          const w = 176 - k * 24;
          const l = 100 - w / 2;
          const r = 100 + w / 2;
          return (
            <g key={k}>
              <rect x={l + 22} y={y} width={w - 44} height={40} />
              <path d={`M${l - 8} ${y + 2}Q${l + 8} ${y - 2} ${l + 14} ${y - 18}H${r - 14}Q${r - 8} ${y - 2} ${r + 8} ${y + 2}Z`} />
            </g>
          );
        })}
        <rect x="20" y="398" width="160" height="2" />
      </g>
    </svg>
  );
}

/** Flying ink shards (roof tile debris). */
export const shardShapes = [
  "M0 6L18 0 22 10 4 14z",
  "M0 0L14 4 10 16 2 10z",
  "M2 0L24 6 20 12 0 8z",
  "M0 4L10 0 16 14 6 18z",
  "M0 2L30 0 26 6 2 6z",
];
