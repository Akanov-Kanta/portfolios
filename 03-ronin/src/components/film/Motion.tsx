/**
 * Procedural layers that give the shots travel: everything here tiles seamlessly (an SVG pattern slid by
 * exactly one tile), so it can run forever without the seam a looped painting would show. The motion
 * itself is CSS (film.css), only switched on while the film plays.
 */

/** A roof ridge rushing past under the running rōnin: cap, round end tiles with gold crests, tile channels. */
export function RidgeRun() {
  return (
    <div className="ridge" aria-hidden="true">
      <svg className="ridge-run" height="1200" preserveAspectRatio="none">
        <defs>
          <pattern id="ridge-tile" width="240" height="1200" patternUnits="userSpaceOnUse">
            <rect y="40" width="240" height="1160" fill="#16283A" />
            {[0, 120].map((x) => (
              <g key={x}>
                <rect x={x} y="74" width="106" height="1126" fill="#1B3149" />
                <rect x={x + 106} y="74" width="14" height="1126" fill="#0B1622" />
                <rect x={x + 6} y="74" width="4" height="1126" fill="#5FA8D3" opacity="0.32" />
                <circle cx={x + 60} cy="62" r="23" fill="#1D3550" stroke="#5FA8D3" strokeWidth="3" />
                <circle cx={x + 60} cy="62" r="23" fill="none" stroke="#0B1622" strokeWidth="1.5" />
                <circle cx={x + 60} cy="62" r="10" fill="#C9A24A" />
                <circle cx={x + 60} cy="62" r="3.5" fill="#0B1622" />
              </g>
            ))}
            <rect y="22" width="240" height="22" fill="#0F1D2C" />
            <rect y="22" width="240" height="4" fill="#5FA8D3" />
            <rect y="44" width="240" height="3" fill="#0B1622" />
          </pattern>
        </defs>
        <rect width="100%" height="1200" fill="url(#ridge-tile)" />
      </svg>
    </div>
  );
}

/** Bamboo culms rushing past at two depths: pale far stalks behind the rider, one dark near stalk in front. */
export function CulmRush({ depth }: { depth: "far" | "near" }) {
  const id = `culm-${depth}`;
  return (
    <div className={`culm-rush culm-rush-${depth}`} aria-hidden="true">
      <svg className="culm-run" height="100%" preserveAspectRatio="none">
        <defs>
          {depth === "far" ? (
            <pattern id={id} width="300" height="2400" patternUnits="userSpaceOnUse">
              <rect x="40" width="26" height="2400" fill="#5FA8D3" opacity="0.3" />
              <rect x="196" width="17" height="2400" fill="#5FA8D3" opacity="0.22" />
              {Array.from({ length: 15 }, (_, k) => (
                <g key={k}>
                  <rect x="38" y={k * 168 + 40} width="30" height="5" fill="#16283A" opacity="0.3" />
                  <rect x="194" y={k * 168 + 120} width="21" height="4" fill="#16283A" opacity="0.25" />
                </g>
              ))}
            </pattern>
          ) : (
            <pattern id={id} width="1400" height="2400" patternUnits="userSpaceOnUse">
              <rect x="300" width="74" height="2400" fill="#0B1622" />
              <rect x="300" width="5" height="2400" fill="#5FA8D3" />
              {Array.from({ length: 11 }, (_, k) => (
                <g key={k}>
                  <rect x="296" y={k * 236 + 90} width="82" height="12" fill="#16283A" />
                  <rect x="296" y={k * 236 + 102} width="82" height="3" fill="#5FA8D3" opacity="0.5" />
                </g>
              ))}
              <path d="M374 520 q90 -40 170 -18 q-80 8 -170 30 z M374 560 q70 30 150 30 q-80 -2 -150 -14 z" fill="#0B1622" />
            </pattern>
          )}
        </defs>
        <rect width="100%" height="2400" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

/** Anime speed lines: broken streaks racing past behind a fast subject. */
export function SpeedLines({ className = "" }: { className?: string }) {
  return (
    <div className={`speedlines ${className}`} aria-hidden="true">
      <svg className="speed-run" height="100%" preserveAspectRatio="none">
        <defs>
          <pattern id={`speed-${className || "a"}`} width="640" height="320" patternUnits="userSpaceOnUse">
            {[
              [0, 18, 260, 2], [330, 46, 180, 1.5], [90, 83, 340, 2.5], [470, 121, 140, 1.5],
              [40, 158, 220, 2], [300, 196, 300, 1.5], [520, 233, 110, 2], [140, 271, 260, 1.5], [430, 304, 190, 2],
            ].map(([x, y, w, h], k) => (
              <rect key={k} x={x} y={y} width={w} height={h} fill="#ECE6D8" />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#speed-${className || "a"})`} />
      </svg>
    </div>
  );
}

/** Rinpa gold-leaf cloud bands drifting across the sky. */
export function GoldClouds({ count = 2 }: { count?: number }) {
  return (
    <div className="gold-clouds" aria-hidden="true">
      {Array.from({ length: count }, (_, k) => (
        <svg key={k} className={`gold-cloud gold-cloud-${k}`} viewBox="0 0 600 64">
          <path
            d="M8 42c0-16 26-22 50-16h352c18-14 52-16 70-4 22-2 46 4 46 18 0 12-18 16-38 12-16 8-48 8-62 0H58c-24 8-50 6-50-10z"
            fill="#C9A24A"
            stroke="#0B1622"
            strokeWidth="2.5"
          />
          <path d="M70 34h330" stroke="#E6CC85" strokeWidth="2" fill="none" />
        </svg>
      ))}
    </div>
  );
}
