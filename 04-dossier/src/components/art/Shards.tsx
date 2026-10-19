import { SHARD_VIEW, shardField } from "./shards-geometry";

/**
 * Full-bleed SVG of glass shards and streak lines. Each shard is a `[data-shard]` group placed at its
 * rest position with `data-side` (-1 left, 1 right) so a timeline can fly it in from that edge.
 */
export function Shards({ seed = 5, count = 14, className = "" }: { seed?: number; count?: number; className?: string }) {
  const { shards, lines } = shardField(seed, count);
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox={`0 0 ${SHARD_VIEW.w} ${SHARD_VIEW.h}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`shard-streak-${seed}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f0f0f0" stopOpacity="0" />
          <stop offset="0.75" stopColor="#f0f0f0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f0f0f0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map((l, i) => (
        <g key={`l${i}`} data-shard data-side={l.side}>
          <line
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={`url(#shard-streak-${seed})`}
            strokeWidth={1.2}
            opacity={l.opacity}
          />
        </g>
      ))}
      {shards.map((s, i) => (
        // outer group is animated (offset from rest), inner group holds the rest pose
        <g key={i} data-shard data-side={s.side}>
          <g transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
            <polygon
              points={s.points}
              fill="#f0f0f0"
              fillOpacity={s.opacity}
              stroke="rgba(240,240,240,0.9)"
              strokeWidth={0.5}
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
