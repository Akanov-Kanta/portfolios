import { anchor, at, f, makeBody, outline, patch, Pt, rng, sampleBeziers, sampleSpline, scales } from "@/lib/serpent";
import { Blossom, Cloud, Petal, polyD, Sym, WindBars } from "./common";
import { buildDragon, DragonBody, DragonHeadAt, DragonLegAt } from "./dragon";

/*
 * Tattoo-flash sheets. Every colour is a CSS variable (see `.art` in globals.css) so a
 * second copy of the same drawing can be re-inked as a duotone print on hover.
 */

function Sheet({ children, label, duo = false }: { children: React.ReactNode; label: string; duo?: boolean }) {
  return (
    <svg viewBox="0 0 400 520" className={`art ${duo ? "duo" : ""} block h-full w-full`} role="img" aria-label={label} strokeWidth={4}>
      <rect width="400" height="520" className="p" />
      {children}
    </svg>
  );
}

export type FlashProps = { duo?: boolean };

/* ───────────────────────── 龍 Dragon ───────────────────────── */
export function FlashDragon({ duo }: FlashProps) {
  const b = buildDragon({
    ctrl: [
      [372, 498],
      [290, 492],
      [160, 476],
      [64, 420],
      [74, 350],
      [176, 318],
      [292, 300],
      [346, 236],
      [306, 168],
      [214, 148],
      [150, 178],
    ],
    samples: 260,
    width: (t) => (t < 0.32 ? 6 + 36 * Math.pow(t / 0.32, 0.6) : t > 0.88 ? 42 - 8 * ((t - 0.88) / 0.12) : 42),
    legs: [],
    headScale: 0.62,
    sw: 3,
  });
  return (
    <Sheet label="Dragon flash" duo={duo}>
      <WindBars bars={[[18, 48, 150, 12], [40, 70, 96, 9], [250, 380, 140, 12], [286, 402, 90, 9], [10, 250, 60, 9]]} />
      <Cloud x={232} y={74} lobes={[34, 44, 30, 38]} sw={3} />
      <Cloud x={8} y={512} lobes={[40, 52, 36]} sw={3} />
      <DragonLegAt b={b} t={0.3} scale={0.52} sw={3} />
      <DragonBody b={b} sw={3} rows={[-0.4, 0.1, 0.55]} />
      <DragonLegAt b={b} t={0.86} scale={0.56} sw={3} pearl />
      <DragonHeadAt b={b} scale={0.72} sw={3} />
      <Petal x={60} y={120} r={9} rot={-20} cls="c1" />
      <Petal x={346} y={300} r={8} rot={40} cls="c1" />
    </Sheet>
  );
}

/* ───────────────────────── 鯉 Koi ───────────────────────── */
export function FlashKoi({ duo }: FlashProps) {
  const W = 96;
  const b = makeBody(
    sampleSpline(
      [
        [286, 404],
        [292, 348],
        [262, 282],
        [212, 226],
        [184, 160],
        [186, 104],
      ],
      180,
    ),
    (t) => (t < 0.55 ? W * (0.2 + 0.8 * Math.sin(((t / 0.55) * Math.PI) / 2)) : W * (1 - 0.24 * ((t - 0.55) / 0.45) ** 2)),
  );
  // dorsal fin band on the +N side
  const dorsal: Pt[] = [];
  const dorsalBase: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = 0.3 + (0.4 * i) / 24;
    const a = at(b, t, 0.9);
    const s = i / 24;
    const h = 30 * Math.pow(Math.sin(Math.PI * s), 0.8) * (1 - 0.35 * s);
    dorsal.push([a.p[0] + a.N[0] * h - a.T[0] * h * 0.5, a.p[1] + a.N[1] * h - a.T[1] * h * 0.5]);
    dorsalBase.push(a.p);
  }
  const dorsalD = polyD([...dorsal, ...dorsalBase.slice().reverse()]);
  const dorsalRays = dorsal
    .filter((_, i) => i % 3 === 1)
    .map((p, i) => `M${f(dorsalBase[i * 3 + 1])}L${f(p)}`)
    .join("");
  const head = at(b, 1);
  const eye = at(b, 0.93, 0.42);
  const gillTop = at(b, 0.83, 0.96);
  const gillBot = at(b, 0.83, -0.96);
  const gillMid = at(b, 0.8, 0);
  const sc = scales(b, { t0: 0.1, t1: 0.8, rows: [-0.66, -0.22, 0.22, 0.66], spacing: 0.17, size: 0.1 });
  return (
    <Sheet label="Koi flash" duo={duo}>
      {/* water */}
      <g className="sk" strokeWidth={3}>
        <path d="M14,330 C60,300 90,350 140,322 C180,300 196,330 228,318" />
        <path d="M200,476 C240,452 280,490 330,466 C360,452 376,470 392,462" />
        <path d="M18,206 C46,190 70,214 98,200" />
      </g>
      <path className="c3 o" strokeWidth={3} d="M0,520 L0,430 C30,400 70,396 96,420 C112,436 104,458 86,458 C72,458 70,444 80,440 C60,430 34,446 30,470 C66,472 110,488 128,520 Z" />
      <path className="c3 o" strokeWidth={3} d="M400,120 C370,100 330,110 320,140 C314,160 330,176 346,170 C358,166 358,150 348,148 C362,136 384,142 400,160 Z" />
      <path className="sk" strokeWidth={2.4} d="M8,456 C40,440 70,444 96,470 M340,128 C356,122 376,126 394,140" />
      {/* tail */}
      <g transform={anchor(b, 0, 0, 1.15)}>
        <path
          className="c4 o"
          strokeWidth={3}
          d="M8,-10 C-16,-38 -58,-66 -118,-74 C-98,-52 -92,-28 -64,-6 C-60,-2 -60,2 -64,6 C-92,28 -98,52 -118,74 C-58,66 -16,38 8,10 Z"
        />
        <path className="sk" strokeWidth={1.6} d="M0,-4 L-100,-64 M0,-3 L-84,-40 M0,-2 L-70,-18 M0,2 L-70,18 M0,3 L-84,40 M0,4 L-100,64" />
        <path className="c1" d="M-60,-40 C-80,-50 -96,-62 -110,-68 C-96,-56 -88,-44 -80,-30 Z M-62,40 C-80,52 -96,62 -110,68 C-96,56 -86,44 -80,30 Z" />
      </g>
      {/* far-side fins */}
      <g transform={anchor(b, 0.72, -0.85, 0.9)}>
        <path className="c4 o" strokeWidth={3} d="M0,0 C8,26 -12,54 -52,64 C-40,46 -32,26 -16,4 Z" />
        <path className="sk" strokeWidth={1.4} d="M-4,4 L-44,56 M-8,4 L-32,40 M0,6 L-20,58" />
      </g>
      <g transform={anchor(b, 0.4, -0.85, 0.7)}>
        <path className="c4 o" strokeWidth={3.5} d="M0,0 C8,26 -12,54 -52,64 C-40,46 -32,26 -16,4 Z" />
      </g>
      {/* dorsal */}
      <path d={dorsalD} className="c4 o" strokeWidth={3} />
      <path d={dorsalRays} className="sk" strokeWidth={1.4} />
      {/* body */}
      <path d={outline(b, 0, 1, { capEnd: "round" })} className="c4" />
      <path d={patch(b, { t0: 0.56, t1: 1, from: 1, to: -0.25, wave: 0.25, freq: 4 })} className="c1" />
      <path d={patch(b, { t0: 0.26, t1: 0.52, from: -1, to: 0.35, wave: 0.3, freq: 3, phase: 1 })} className="c1" />
      <path d={patch(b, { t0: 0.08, t1: 0.27, from: 1, to: 0.05, wave: 0.2, freq: 2 })} className="c1" />
      <path d={sc} className="sk" strokeWidth={1.7} />
      <path d={outline(b, 0, 1, { capEnd: "round" })} className="sk" strokeWidth={4} fill="none" />
      {/* head */}
      <path d={`M${f(gillTop.p)}Q${f([gillMid.p[0] - gillMid.T[0] * 30, gillMid.p[1] - gillMid.T[1] * 30])} ${f(gillBot.p)}`} className="sk" strokeWidth={3} />
      <circle cx={eye.p[0].toFixed(1)} cy={eye.p[1].toFixed(1)} r="7.5" className="c4 o" strokeWidth={2.6} />
      <circle cx={(eye.p[0] + head.T[0] * 1.5).toFixed(1)} cy={(eye.p[1] + head.T[1] * 1.5).toFixed(1)} r="3.6" className="k" />
      <g transform={anchor(b, 1, 0, 1)}>
        <path
          className="sk"
          strokeWidth={2.4}
          d={`M${(head.w * 0.6).toFixed(1)},-8c-2,-22 -14,-40 -32,-50c-12,-6 -16,-16 -10,-24M${(head.w * 0.6).toFixed(1)},8c-2,22 -14,40 -32,50c-12,6 -16,16 -10,24M${(head.w * 0.66).toFixed(1)},-5q4,5 0,10`}
        />
      </g>
      {/* near-side fins on top of the body */}
      <g transform={anchor(b, 0.72, 0.85, 1)}>
        <g transform="scale(1,-1)">
          <path className="c4 o" strokeWidth={3} d="M0,0 C8,26 -12,54 -52,64 C-40,46 -32,26 -16,4 Z" />
          <path className="sk" strokeWidth={1.4} d="M-4,4 L-44,56 M-8,4 L-32,40 M0,6 L-20,58" />
          <path className="c1" d="M-30,40 C-38,50 -46,56 -50,62 C-40,58 -34,54 -26,50 Z" />
        </g>
      </g>
      <g transform={anchor(b, 0.4, 0.85, 0.72)}>
        <g transform="scale(1,-1)">
          <path className="c4 o" strokeWidth={4} d="M0,0 C8,26 -12,54 -52,64 C-40,46 -32,26 -16,4 Z" />
        </g>
      </g>
      <Blossom x={74} y={96} r={22} />
      <Blossom x={338} y={228} r={16} />
      <Blossom x={60} y={268} r={13} />
      <Petal x={120} y={60} r={9} rot={30} cls="c1" />
      <Petal x={360} y={340} r={8} rot={-40} />
      <Petal x={30} y={380} r={8} rot={70} cls="c1" />
    </Sheet>
  );
}

/* ───────────────────────── 虎 Tiger ───────────────────────── */
export function FlashTiger({ duo }: FlashProps) {
  const ruff =
    "M201,96 C176,94 156,98 140,106 C118,116 104,132 96,152 L74,148 L86,170 L58,174 L78,194 L48,204 L74,220 L44,240 L76,250 L52,278 L86,282 L72,310 L106,308 L100,336 L132,330 L136,356 L162,346 C174,358 188,364 201,366";
  return (
    <Sheet label="Tiger flash" duo={duo}>
      {/* bamboo + wind */}
      <g>
        <path className="c5 o" strokeWidth={3} d="M28,0 L50,0 L50,520 L28,520 Z M352,0 L372,0 L372,520 L352,520 Z" />
        <path className="sk" strokeWidth={3} d="M28,120 L50,120 M28,300 L50,300 M28,460 L50,460 M352,70 L372,70 M352,250 L372,250 M352,430 L372,430" />
      </g>
      <WindBars bars={[[0, 420, 170, 13], [230, 436, 170, 13], [60, 444, 110, 9], [250, 460, 120, 9]]} />
      <g className="c3 o" strokeWidth={3}>
        <path d="M50,118 C80,96 120,96 150,106 C116,112 84,120 50,126 Z" />
        <path d="M50,300 C30,330 10,350 -6,356 C14,330 30,310 50,298 Z" />
        <path d="M352,250 C320,226 286,222 258,232 C292,236 322,244 352,258 Z" />
        <path d="M372,70 C392,96 406,110 420,116 C400,90 388,78 372,66 Z" />
        <path d="M50,462 C80,486 110,494 140,492 C110,480 80,470 50,456 Z" />
        <path d="M352,432 C330,462 304,478 280,484 C306,466 326,450 352,428 Z" />
      </g>
      <g transform="translate(0,22)">
        <Sym cx={200}>
          {/* ear */}
          <path className="c2 o" strokeWidth={4} d="M148,112 C130,74 100,68 86,84 C74,100 84,130 104,140 Z" />
          <path className="c4 o" strokeWidth={3} d="M138,112 C126,90 106,86 98,96 C92,106 98,122 110,128 Z" />
          {/* head */}
          <path className="c2" d={ruff + " L201,96 Z"} />
          <path className="sk" strokeWidth={4} d={ruff} />
          {/* white fur: brow, cheeks, muzzle */}
          <path className="c4 o" strokeWidth={2.5} d="M150,170 C160,158 178,158 190,166 C178,174 162,178 150,170 Z" />
          <path className="c4" d="M201,258 C182,254 162,258 148,272 L128,266 L138,286 L112,292 L136,306 L122,320 L150,320 L156,338 C172,350 188,356 201,357 Z" />
          <path className="sk" strokeWidth={2.5} d="M201,258 C182,254 162,258 148,272 L128,266 L138,286 L112,292 L136,306 L122,320 L150,320 L156,338" />
          {/* stripes */}
          <g className="k">
            <path d="M201,118 C190,116 178,120 168,128 C180,126 190,127 201,129 Z" />
            <path d="M201,138 C186,136 170,142 160,152 C176,148 190,149 201,151 Z" />
            <path d="M98,152 C120,148 140,154 152,164 C134,160 116,161 100,166 Z" />
            <path d="M84,184 C108,180 126,188 136,200 C118,194 100,195 86,200 Z" />
            <path d="M68,226 C96,222 116,232 128,244 C108,238 90,240 72,246 Z" />
            <path d="M74,258 C98,258 114,266 122,280 C104,272 88,274 78,280 Z" />
            <path d="M98,294 C114,296 126,304 132,316 C118,310 106,310 96,314 Z" />
            <path d="M120,138 C132,128 148,124 162,128 C150,132 136,138 126,148 Z" />
            <path d="M146,104 C152,116 152,128 146,140 C158,128 160,116 156,104 Z" />
          </g>
          {/* eye */}
          <path className="k" d="M132,186 C150,174 174,176 194,196 C176,186 156,184 132,190 Z" />
          <path className="c4 o" strokeWidth={3.5} d="M186,206 C176,192 156,186 138,190 C150,204 168,212 186,206 Z" />
          <circle cx="166" cy="199" r="7.5" className="c2 o" strokeWidth={2} />
          <ellipse cx="166" cy="199" rx="2.4" ry="6" className="k" />
          {/* brow furrow */}
          <path className="sk" strokeWidth={2.5} d="M196,176 C190,184 190,194 194,202 M186,226 C190,236 188,244 182,250" />
          {/* nose */}
          <path className="c6" d="M201,234 L176,234 C168,236 168,246 175,252 C184,260 193,266 201,268 Z" />
          <path className="sk" strokeWidth={3.5} d="M201,234 L176,234 C168,236 168,246 175,252 C184,260 193,266 201,268" />
          {/* muzzle + whiskers */}
          <path className="sk" strokeWidth={3} d="M200,284 C190,292 176,294 164,288 C154,284 146,288 142,296" />
          <g className="k">
            <circle cx="178" cy="280" r="2" />
            <circle cx="168" cy="275" r="2" />
            <circle cx="170" cy="287" r="2" />
          </g>
          <path className="sk" strokeWidth={2} d="M160,280 C124,268 92,272 58,288 M162,290 C124,290 96,300 66,322 M166,272 C132,256 100,252 70,258" />
          {/* mouth */}
          <path className="k" d="M201,290 C186,298 170,298 156,292 L142,298 C146,316 160,336 180,344 C188,346 196,347 201,347 Z" />
          <path className="c6" d="M201,320 C186,318 174,324 170,334 C182,342 194,345 201,345 Z" />
          <path className="c4 o" strokeWidth={2} d="M158,294 L167,330 L174,297 Z M176,298 L180,310 L186,299 Z M172,342 L177,314 L185,344 Z" />
        </Sym>
        <path className="sk" strokeWidth={3} d="M200,268 L200,286" />
      </g>
      <Petal x={300} y={40} r={9} rot={20} cls="c1" />
      <Petal x={90} y={392} r={8} rot={-30} cls="c1" />
    </Sheet>
  );
}

/* ───────────────────────── 般若 Hannya ───────────────────────── */
export function FlashHannya({ duo }: FlashProps) {
  const face =
    "M201,108 C176,108 154,114 138,126 C120,140 112,160 110,182 C104,196 96,210 98,226 C100,244 108,254 108,266 C104,286 100,304 106,324 C112,352 130,376 154,392 C170,402 186,408 201,410";
  const lips = "M201,288 C180,284 160,278 140,268 C126,262 114,264 112,274 C120,302 140,332 166,348 C180,356 192,358 201,358";
  const rand = rng(9);
  const flames = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / 11;
    const r0 = 160;
    const r1 = 214 + rand() * 34;
    const sway = 0.16;
    const p = (ang: number, r: number) => f([200 + Math.cos(ang) * r, 260 + Math.sin(ang) * r]);
    return `M${p(a - 0.17, r0)}C${p(a - 0.2, r0 + 40)} ${p(a + sway, r1 - 40)} ${p(a + sway * 0.6, r1)}C${p(a + 0.02, r1 - 30)} ${p(a + 0.2, r0 + 30)} ${p(a + 0.15, r0)}Z`;
  }).join("");
  return (
    <Sheet label="Hannya mask flash" duo={duo}>
      <path d={flames} className="c6 o" strokeWidth={3} />
      <circle cx="200" cy="260" r="172" className="c3 o" strokeWidth={4} />
      <WindBars bars={[[0, 470, 150, 13], [250, 482, 150, 13], [40, 494, 90, 9]]} />
      <Sym cx={200}>
        {/* hair */}
        <path
          className="k"
          d="M201,98 C168,92 128,100 102,124 C78,148 66,186 62,232 C58,274 62,318 52,372 C70,344 76,304 82,272 C84,314 82,354 72,404 C96,364 102,322 100,282 C106,322 108,352 100,384 C120,344 120,302 114,252 L201,252 Z"
        />
        <path className="sd" stroke="var(--c5)" strokeWidth={1.6} d="M90,160 C78,210 80,280 70,350 M100,180 C92,240 96,300 88,370" />
        {/* horn */}
        <path className="c4 o" strokeWidth={4} d="M152,128 C122,104 104,72 112,32 C116,22 124,16 134,10 C128,30 130,58 150,82 C160,94 168,102 174,114 Z" />
        <path className="c2" d="M112,32 C116,22 124,16 134,10 C130,22 128,34 129,42 C122,40 116,36 112,32 Z" />
        <path className="sk" strokeWidth={2.4} d="M118,62 C126,64 134,66 140,72 M126,86 C134,88 142,92 148,98 M140,106 C146,108 152,112 158,118 M114,44 C120,46 126,48 131,52" />
        {/* face */}
        <path className="c1" d={face + " L201,108 Z"} />
        <path className="sk" strokeWidth={4} d={face} />
        {/* forehead + brows */}
        <path className="c2 o" strokeWidth={2} d="M196,152 C182,138 160,130 130,140 C146,140 162,146 174,158 Z" />
        <path className="sk" strokeWidth={2.4} d="M200,124 C190,120 180,122 172,128 M196,136 C186,132 176,134 168,140 M150,124 C142,118 132,118 124,122" />
        {/* eye */}
        <path className="k" d="M188,184 C176,164 154,158 130,168 C148,164 168,168 188,184 Z" />
        <path className="c2 o" strokeWidth={3.5} d="M186,184 C176,168 156,162 136,172 C140,188 160,198 186,184 Z" />
        <circle cx="160" cy="178" r="7.5" className="k" />
        <circle cx="157.5" cy="175.5" r="2" className="c4" />
        <path className="sk" strokeWidth={2.4} d="M136,190 C150,202 170,204 188,196 M120,204 C126,220 128,236 124,250" />
        {/* nose */}
        <path className="c1" d="M201,198 C196,214 192,228 184,236 C176,242 176,252 186,254 C192,256 196,252 201,252 Z" />
        <path className="sk" strokeWidth={3.2} d="M201,198 C196,214 192,228 184,236 C176,242 176,252 186,254 C192,256 196,252 201,252" />
        <path className="k" d="M186,246 C190,241 196,243 195,249 C192,250 189,249 186,246 Z" />
        <path className="sk" strokeWidth={2.6} d="M176,232 C158,238 146,252 140,270 M150,370 C164,382 180,388 196,390" />
        {/* mouth */}
        <path className="k" d={lips + " L201,288 Z"} />
        <path className="c4 o" strokeWidth={2} d="M124,272 C148,282 174,290 201,292 L201,304 C186,302 170,298 156,292 L150,300 L146,288 C138,285 132,281 126,278 Z" />
        <path className="sk" strokeWidth={1.6} d="M150,284 L148,298 M164,288 L164,300 M180,291 L180,302" />
        <path className="c4 o" strokeWidth={2.4} d="M130,278 L140,324 L148,286 Z" />
        <path className="c4 o" strokeWidth={2} d="M152,336 C168,344 184,348 201,348 L201,340 C186,340 170,336 158,330 Z" />
        <path className="c4 o" strokeWidth={2.4} d="M158,338 L163,304 L171,340 Z" />
        <path className="sk" strokeWidth={4.5} d={lips} />
      </Sym>
      <Petal x={50} y={60} r={10} rot={-20} />
      <Petal x={346} y={420} r={9} rot={50} />
    </Sheet>
  );
}

/* ───────────────────────── 牡丹 Peony ───────────────────────── */
function petalD(w: number, h: number) {
  const s = (x: number, y: number) => `${(x * w).toFixed(1)},${(-y * h).toFixed(1)}`;
  return `M${s(-0.22, 0)}C${s(-0.62, 0.3)} ${s(-0.58, 0.8)} ${s(-0.42, 0.95)}Q${s(-0.28, 1.06)} ${s(-0.15, 0.93)}Q${s(-0.02, 1.07)} ${s(0.1, 0.94)}Q${s(0.26, 1.06)} ${s(0.4, 0.95)}C${s(0.58, 0.8)} ${s(0.62, 0.3)} ${s(0.22, 0)}Z`;
}
function veinD(w: number, h: number) {
  return [-0.28, -0.1, 0.1, 0.28]
    .map((x) => `M${(x * w * 0.4).toFixed(1)},${(-h * 0.12).toFixed(1)}Q${(x * w * 0.9).toFixed(1)},${(-h * 0.5).toFixed(1)} ${(x * w).toFixed(1)},${(-h * 0.82).toFixed(1)}`)
    .join("");
}
function Leaf({ x, y, rot, s = 1 }: { x: number; y: number; rot: number; s?: number }) {
  const leaflet = "M0,0 C18,-22 58,-30 104,-12 C62,8 22,12 0,0 Z";
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      {[-34, 0, 34].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d={leaflet} className="c3 o" strokeWidth={3.2 / s} />
          <path d="M6,-1 C40,-8 70,-10 96,-12" className="sd" strokeWidth={2 / s} />
        </g>
      ))}
    </g>
  );
}
export function FlashPeony({ duo }: FlashProps) {
  const cx = 200;
  const cy = 236;
  const ring = (n: number, w: number, h: number, off: number, dy: number, sq: number, cls = "c6") =>
    Array.from({ length: n }, (_, i) => {
      const a = off + (360 / n) * i;
      return (
        <g key={`${n}-${i}`} transform={`translate(${cx},${cy + dy}) scale(1,${sq}) rotate(${a})`}>
          <path d={petalD(w, h)} className={`${cls} o`} strokeWidth={3.6} />
          <path d={veinD(w, h)} className="sd" strokeWidth={1.6} />
        </g>
      );
    });
  return (
    <Sheet label="Peony flash" duo={duo}>
      <WindBars bars={[[200, 40, 190, 13], [250, 62, 120, 9], [0, 470, 160, 13], [30, 492, 100, 9]]} />
      <Leaf x={190} y={330} rot={120} s={1.15} />
      <Leaf x={200} y={330} rot={40} s={1.05} />
      <Leaf x={150} y={250} rot={190} s={0.95} />
      <Leaf x={250} y={250} rot={-20} s={0.9} />
      <path className="k" d="M196,330 C190,380 200,430 186,520 L200,520 C212,440 206,380 206,330 Z" />
      {ring(9, 128, 150, 10, 4, 0.86)}
      {ring(7, 104, 108, 30, -2, 0.84)}
      {ring(6, 76, 72, 4, -8, 0.82, "c1")}
      <g transform={`translate(${cx},${cy - 12})`}>
        <ellipse rx="30" ry="22" className="c2 o" strokeWidth={3.5} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <circle key={i} cx={(Math.cos(a) * 19).toFixed(1)} cy={(Math.sin(a) * 13).toFixed(1)} r="3" className="k" />;
        })}
        <path className="sk" strokeWidth={2} d="M-10,-4 C-4,-10 6,-10 10,-2" />
      </g>
      {/* bud */}
      <g transform="translate(330,120) rotate(20)">
        <path className="k" d="M-2,30 C-6,70 10,100 0,150 L8,150 C16,100 4,70 6,30 Z" />
        <ellipse rx="26" ry="32" className="c6 o" strokeWidth={3.5} />
        <path className="sd" strokeWidth={1.6} d="M-10,-24 C-16,-6 -14,12 -6,26 M8,-26 C14,-8 14,10 6,26" />
        <path className="c3 o" strokeWidth={3} d="M-26,8 C-30,30 -14,44 0,38 C-10,30 -16,20 -26,8 Z M26,8 C30,30 14,44 0,38 C10,30 16,20 26,8 Z" />
      </g>
      <Petal x={70} y={110} r={11} rot={-30} cls="c6" />
      <Petal x={340} y={420} r={10} rot={40} cls="c6" />
      <Petal x={44} y={400} r={8} rot={110} cls="c6" />
    </Sheet>
  );
}

/* ───────────────────────── 波 Wave ───────────────────────── */
export function FlashWave({ duo }: FlashProps) {
  // crest line from the back of the wave over the top and down into the curl
  const crest = sampleBeziers(
    [
      [330, 168],
      [290, 136],
      [200, 118],
      [130, 136],
      [80, 150],
      [44, 186],
      [52, 230],
      [58, 262],
      [100, 270],
      [112, 246],
    ],
    90,
  );
  const N: Pt[] = crest.map((_, i) => {
    const a = crest[Math.max(0, i - 1)];
    const c = crest[Math.min(crest.length - 1, i + 1)];
    const dx = c[0] - a[0];
    const dy = c[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  const T: Pt[] = N.map(([x, y]) => [-y, x]);
  // foam band + claws
  let claws = "";
  const claw = (i: number, L: number, b: number) => {
    const p = crest[i];
    const n = N[i];
    const fw: Pt = [-T[i][0], -T[i][1]]; // forward, toward the curl
    const P = (u: number, v: number) => f([p[0] + n[0] * u + fw[0] * v, p[1] + n[1] * u + fw[1] * v]);
    // finger: rises outward, leans forward, then hooks back down toward the wave
    return `M${P(0, -b)}Q${P(L * 0.9, -b * 0.6)} ${P(L, L * 0.55)}Q${P(L * 0.9, L * 0.95)} ${P(L * 0.55, L * 0.9)}Q${P(L * 0.72, L * 0.62)} ${P(L * 0.62, L * 0.4)}Q${P(L * 0.3, L * 0.3)} ${P(0, b)}Z`;
  };
  for (let i = 3; i < 66; i += 5) claws += claw(i, 34 - i * 0.18, 7);
  for (let i = 66; i < crest.length - 6; i += 5) claws += claw(i, 18, 5);
  const inner = crest.map((p, i) => [p[0] - N[i][0] * 16, p[1] - N[i][1] * 16] as Pt);
  const foam = polyD([...crest, ...inner.slice().reverse()]);
  const rand = rng(5);
  const spray = Array.from({ length: 22 }, () => {
    const i = 6 + Math.floor(rand() * (crest.length - 30));
    const d = 34 + rand() * 40;
    return { x: crest[i][0] + N[i][0] * d, y: crest[i][1] + N[i][1] * d, r: 2 + rand() * 4 };
  });
  return (
    <Sheet label="Great wave flash" duo={duo}>
      <circle cx="300" cy="96" r="62" className="c6 o" strokeWidth={4} />
      <WindBars bars={[[190, 40, 210, 12], [250, 64, 150, 9], [0, 70, 90, 9]]} />
      {/* main wave body */}
      <path
        className="c3 o"
        strokeWidth={4}
        d="M400,520 L400,240 C380,196 356,180 330,168 C290,136 200,118 130,136 C80,150 44,186 52,230 C58,262 100,270 112,246 C134,254 148,282 140,322 C130,384 80,430 0,446 L0,520 Z"
      />
      <path className="c5" d="M400,520 L400,380 C372,320 330,290 276,284 C226,280 190,300 172,330 C160,380 120,420 70,446 C46,458 20,466 0,470 L0,520 Z" />
      <g className="s4" strokeWidth={3}>
        <path d="M392,268 C366,226 320,196 250,186 C200,180 160,194 140,214" />
        <path d="M396,300 C368,262 324,234 264,222 C220,214 182,224 160,240" />
        <path d="M150,320 C142,370 108,410 60,432" />
        <path d="M380,360 C350,320 310,296 260,290" />
        <path d="M360,400 C330,370 300,356 260,352" />
      </g>
      <path d={foam} className="c4 o" strokeWidth={3} />
      <path d={claws} className="c4 o" strokeWidth={2.6} />
      <g className="c4 o" strokeWidth={2}>
        {spray.map((s, i) => (
          <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(1)} />
        ))}
      </g>
      {/* foreground swell */}
      <path className="c3 o" strokeWidth={4} d="M0,520 L0,470 C40,446 90,440 130,452 C160,462 170,488 150,496 C136,502 126,490 134,482 C150,488 240,470 300,480 C350,488 380,500 400,496 L400,520 Z" />
      <path className="c4 o" strokeWidth={2.6} d="M110,446 C130,440 152,446 164,460 L156,466 C148,456 132,452 118,454 Z" />
      <path className="s4" strokeWidth={3} d="M20,500 C60,486 100,486 130,498 M220,500 C270,494 320,498 380,510" />
    </Sheet>
  );
}
