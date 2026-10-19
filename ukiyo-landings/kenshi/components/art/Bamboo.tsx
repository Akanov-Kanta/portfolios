import { leaf, rng } from "./geometry";

export type StalkSpec = {
  x: number;
  w: number;
  /** horizontal drift from top to bottom */
  lean?: number;
  top?: number;
  bottom?: number;
  seg?: number;
  leaves?: number;
};

type Props = {
  stalks: StalkSpec[];
  fill: string;
  gap?: string;
  seed?: number;
  leafScale?: number;
};

const r = (n: number) => Math.round(n * 10) / 10;

function stalkPaths(s: StalkSpec, rand: () => number, leafScale: number) {
  const top = s.top ?? -60;
  const bottom = s.bottom ?? 1060;
  const lean = s.lean ?? 0;
  const seg = s.seg ?? 150;
  const xAt = (y: number) => s.x + (lean * (y - top)) / (bottom - top);
  const segments: string[] = [];
  const nodes: string[] = [];
  const twigs: string[] = [];
  const leaves: { x: number; y: number; a: number; l: number; w: number }[] = [];

  let y = top + rand() * seg * 0.6;
  let prev = top;
  let i = 0;
  while (prev < bottom) {
    const y2 = Math.min(y, bottom);
    const hw = s.w / 2;
    const xa = xAt(prev);
    const xb = xAt(y2);
    // segment body, slightly pinched near the node
    segments.push(
      `M${r(xa - hw)} ${r(prev + 2)}L${r(xa + hw)} ${r(prev + 2)}` +
        `L${r(xb + hw * 0.96)} ${r(y2 - 3)}L${r(xb - hw * 0.96)} ${r(y2 - 3)}Z`,
    );
    // node ridge: a lens that pokes out on both sides
    if (y2 < bottom) {
      nodes.push(
        `M${r(xb - hw - 3)} ${r(y2)}Q${r(xb)} ${r(y2 - 6)} ${r(xb + hw + 3)} ${r(y2)}` +
          `Q${r(xb)} ${r(y2 + 4)} ${r(xb - hw - 3)} ${r(y2)}Z`,
      );
      if (s.leaves && i % 2 === 1 && rand() < s.leaves) {
        const dir = rand() < 0.5 ? -1 : 1;
        const tl = (40 + rand() * 70) * leafScale;
        const tx = xb + dir * (hw + tl);
        const ty = y2 - tl * 0.55;
        twigs.push(`M${r(xb + dir * hw)} ${r(y2)}Q${r(xb + dir * (hw + tl * 0.5))} ${r(y2 - tl * 0.1)} ${r(tx)} ${r(ty)}`);
        const n = 3 + Math.floor(rand() * 3);
        for (let k = 0; k < n; k++) {
          // fan of leaves hanging down and away from the stalk
          const base = dir > 0 ? 20 : 160;
          const a = base + dir * (k * 22 + rand() * 14 - 10) + (dir > 0 ? 25 : -25);
          leaves.push({
            x: tx - dir * k * 6 * leafScale,
            y: ty + k * 4 * leafScale,
            a,
            l: (70 + rand() * 50) * leafScale,
            w: (9 + rand() * 4) * leafScale,
          });
        }
      }
    }
    prev = y2;
    y = y2 + seg * (0.75 + rand() * 0.5);
    i++;
  }
  return { segments, nodes, twigs, leaves };
}

export function BambooLayer({ stalks, fill, gap, seed = 1, leafScale = 1 }: Props) {
  const rand = rng(seed);
  return (
    <g>
      {stalks.map((s, idx) => {
        const { segments, nodes, twigs, leaves } = stalkPaths(s, rand, leafScale);
        const body = (
          <g>
            <path d={segments.join("")} fill={fill} />
            <path d={nodes.join("")} fill={fill} />
            {gap ? (
              <path
                d={nodes.join("")}
                fill="none"
                stroke={gap}
                strokeWidth={Math.max(1, s.w * 0.05)}
                transform="translate(0 -4)"
                opacity={0.55}
              />
            ) : null}
            <path d={twigs.join("")} fill="none" stroke={fill} strokeWidth={Math.max(2, s.w * 0.12)} strokeLinecap="round" />
            {leaves.map((l, k) => (
              <path key={k} d={leaf(l.l, l.w)} fill={fill} transform={`translate(${r(l.x)} ${r(l.y)}) rotate(${r(l.a)})`} />
            ))}
          </g>
        );
        return <g key={idx}>{body}</g>;
      })}
    </g>
  );
}
