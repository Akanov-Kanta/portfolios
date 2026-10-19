import { Children, Fragment } from "react";
import { f, Pt } from "@/lib/serpent";

/** Ukiyo-e cloud band: scalloped top, flat bottom, curled ends, inner swirl lines. */
export function cloudPath(x: number, y: number, lobes: number[]) {
  let d = `M${x},${y}`;
  let cx = x;
  const swirls: string[] = [];
  lobes.forEach((w) => {
    const r = w / 2;
    d += `A${r},${r * 0.9} 0 0 1 ${cx + w},${y}`;
    const mid = cx + r;
    swirls.push(`M${f([mid - r * 0.55, y])}A${r * 0.55},${r * 0.5} 0 0 1 ${f([mid + r * 0.55, y])}`);
    cx += w;
  });
  const total = cx - x;
  // curl under the right end, flat return, curl under the left end
  const e = Math.min(lobes[lobes.length - 1], 40) * 0.5;
  d += `A${e},${e * 0.8} 0 0 1 ${cx - e},${y + e * 0.9}L${x + e},${y + e * 0.9}A${e},${e * 0.8} 0 0 1 ${x},${y}Z`;
  return { d, swirls: swirls.join(""), width: total };
}

export function Cloud({
  x,
  y,
  lobes,
  fillClass = "c4",
  sw = 3,
  swirl = true,
}: {
  x: number;
  y: number;
  lobes: number[];
  fillClass?: string;
  sw?: number;
  swirl?: boolean;
}) {
  const c = cloudPath(x, y, lobes);
  return (
    <g>
      <path d={c.d} className={`${fillClass} o`} strokeWidth={sw} />
      {swirl && <path d={c.swirls} className="sk" strokeWidth={sw * 0.7} />}
    </g>
  );
}

/** Black wind bars — the classic background of Japanese tattoo flash. */
export function WindBars({ bars }: { bars: [number, number, number, number][] }) {
  return (
    <g className="k">
      {bars.map(([x, y, w, h], i) => (
        <path
          key={i}
          d={`M${x},${y + h / 2}Q${x + h * 0.6},${y} ${x + h * 2},${y}L${x + w - h},${y}Q${x + w},${y} ${x + w},${y + h / 2}Q${x + w},${y + h} ${x + w - h},${y + h}L${x + h * 2},${y + h}Q${x + h * 0.6},${y + h} ${x},${y + h / 2}Z`}
        />
      ))}
    </g>
  );
}

/**
 * Mirror children about a vertical axis (for symmetrical masks and faces).
 * Each child is mirrored immediately after itself so layer order is preserved and the
 * mirrored back layers never paint over the front layers of the other half.
 */
export function Sym({ cx, children }: { cx: number; children: React.ReactNode }) {
  return (
    <>
      {Children.toArray(children).map((child, i) => (
        <Fragment key={i}>
          {child}
          <g transform={`translate(${cx * 2},0) scale(-1,1)`}>{child}</g>
        </Fragment>
      ))}
    </>
  );
}

/** A five-petal sakura blossom / loose petal. */
export function Petal({ x, y, r = 8, rot = 0, cls = "c4" }: { x: number; y: number; r?: number; rot?: number; cls?: string }) {
  return (
    <path
      transform={`translate(${x},${y}) rotate(${rot}) scale(${r / 10})`}
      d="M0,0 C-7,-4 -9,-12 -4,-17 L0,-14 L4,-17 C9,-12 7,-4 0,0 Z"
      className={`${cls} o`}
      strokeWidth={2.2 * (10 / r)}
    />
  );
}

export function Blossom({ x, y, r = 14, cls = "c4" }: { x: number; y: number; r?: number; cls?: string }) {
  const s = r / 18;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0,-2 C-9,-6 -11,-15 -5,-19 L0,-16 L5,-19 C11,-15 9,-6 0,-2 Z" className={`${cls} o`} strokeWidth={2.4 / s} />
      ))}
      <circle r="3.4" className="c2 o" strokeWidth={1.6 / s} />
    </g>
  );
}

export function polyD(pts: Pt[], close = true) {
  return pts.map((p, i) => (i ? "L" : "M") + f(p)).join("") + (close ? "Z" : "");
}
