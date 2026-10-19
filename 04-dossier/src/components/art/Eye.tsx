import { useId, useMemo } from "react";
import { EYE_VIEWBOX, eyeGeometry } from "./eye-geometry";

export const IRIS_GRADIENT_ID = "eye-iris-fill";
export const EYE_GLOW_ID = "eye-glow";

/**
 * Shared defs for every eye: the iris gradient and the eye bloom. Rendered once per page by FxLayer
 * (always mounted), so an <Eye> works in any chapter. The bloom is the edit's "deep glow": blown-out
 * line cores (tight blurs stacked over the source) on a wide soft halo, so bright eyes sit in a pool of
 * light as in t_01.00.
 */
export function EyeDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute" focusable="false">
      <defs>
        <radialGradient id={IRIS_GRADIENT_ID} cx="50%" cy="46%" r="55%">
          <stop offset="0%" stopColor="#c8c8c8" />
          <stop offset="40%" stopColor="#9a9a9a" />
          <stop offset="82%" stopColor="#5e5e5e" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </radialGradient>
        <filter id={EYE_GLOW_ID} x="-50%" y="-80%" width="200%" height="260%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="b1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b2" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b3" />
          <feComponentTransfer in="b3" result="b3s">
            <feFuncA type="linear" slope="1.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="b3s" />
            <feMergeNode in="b2" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

interface EyeProps {
  seed: number;
  /** apply the eye bloom (#eye-glow) */
  glow?: boolean;
  /**
   * "solid" (default): dark sclera + filled grey iris, for the bright swarm eyes and the giant eye.
   * "ghost": lines only, no fills, so the huge dim eye and the far tier read as pencil under-drawing.
   */
  variant?: "solid" | "ghost";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * One procedural hand-drawn eye. The iris group carries `data-iris` so a parent can move it (cursor
 * tracking, in viewBox units of the eye's own, possibly rotated, frame); it is clipped to the almond
 * so the lids cover it. Blinks are done by the parent (scaleY on a wrapper, pivot EYE_PIVOT).
 */
export function Eye({ seed, glow = true, variant = "solid", className, style }: EyeProps) {
  const g = useMemo(() => eyeGeometry(seed), [seed]);
  const clipId = `eye-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const solid = variant === "solid";

  return (
    <svg
      viewBox={`0 0 ${EYE_VIEWBOX.w} ${EYE_VIEWBOX.h}`}
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={g.almond} />
        </clipPath>
      </defs>
      <g filter={glow ? `url(#${EYE_GLOW_ID})` : undefined}>
        {solid ? <path className="eye-fill" d={g.almond} fill="#1a1a1a" /> : null}
        <g clipPath={`url(#${clipId})`}>
          <g data-iris className="eye-iris">
            {solid ? <circle className="eye-fill" cx={g.iris.cx} cy={g.iris.cy} r={g.iris.r} fill={`url(#${IRIS_GRADIENT_ID})`} /> : null}
            {solid ? <path className="eye-fill" d={g.spiralDark} fill="none" stroke="#141414" strokeWidth={1.1} strokeOpacity={0.5} /> : null}
            <path d={g.spiral} fill="none" stroke="#f0f0f0" strokeWidth={0.8} strokeOpacity={solid ? 0.5 : 0.6} />
            {g.rings.map((ring, i) => (
              <circle
                key={i}
                cx={g.iris.cx}
                cy={g.iris.cy}
                r={ring.r}
                fill="none"
                className={ring.light ? undefined : "eye-fill"}
                stroke={ring.light || !solid ? "#f0f0f0" : "#141414"}
                strokeWidth={ring.w}
                strokeOpacity={ring.o}
                strokeDasharray={ring.dash}
              />
            ))}
            <circle
              cx={g.iris.cx}
              cy={g.iris.cy}
              r={g.iris.r}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth={1.6}
              strokeOpacity={0.75}
            />
            <circle cx={g.iris.cx} cy={g.iris.cy} r={2.6} fill="#d8d8d8" />
          </g>
        </g>
        <g fill="none" stroke="#f0f0f0" strokeLinecap="round" strokeLinejoin="round">
          {g.strokes.map((s, i) => (
            <path key={i} d={s.d} strokeWidth={s.w} strokeOpacity={s.o} />
          ))}
          {g.hairs.map((s, i) => (
            <path key={`h${i}`} d={s.d} strokeWidth={s.w} strokeOpacity={s.o} />
          ))}
        </g>
        <path d={g.lashes} fill="#f0f0f0" />
      </g>
    </svg>
  );
}
