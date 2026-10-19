import { anchor, belly, Body, makeBody, outline, Pt, rail, sampleSpline, scales, spines } from "@/lib/serpent";

/*
 * Dragon parts drawn in local coordinates. Local +x points forward (toward the head),
 * local -y is the dorsal (+N) side. Colours come from CSS custom properties so the same
 * drawing can be an ink silhouette (hero) or a coloured tattoo flash (gallery).
 */

const S = {
  body: { fill: "var(--dr-body)" },
  belly: { fill: "var(--dr-belly)" },
  fin: { fill: "var(--dr-fin)" },
  horn: { fill: "var(--dr-horn)" },
  claw: { fill: "var(--dr-claw)" },
  teeth: { fill: "var(--dr-teeth)" },
  eye: { fill: "var(--dr-eye)" },
  tongue: { fill: "var(--dr-tongue)" },
  line: { stroke: "var(--dr-line)" },
  detail: { stroke: "var(--dr-detail)", fill: "none" },
  rim: { stroke: "var(--dr-rim)", fill: "none" },
  ink: { fill: "var(--dr-line)" },
};

const stroke = (sw: number) => ({ ...S.line, strokeWidth: sw, strokeLinejoin: "round" as const, strokeLinecap: "round" as const });

export function DragonHead({ sw = 4 }: { sw?: number }) {
  return (
    <g>
      {/* mane — flame tufts streaming back */}
      <path
        style={{ ...S.fin, ...stroke(sw) }}
        d="M62,-40 C34,-70 4,-62 -30,-82 C-18,-64 -22,-54 -50,-52 C-26,-42 -30,-28 -64,-24 C-34,-12 -36,0 -62,10 C-32,12 -28,26 -50,44 C-20,36 -6,46 -14,64 C6,48 26,44 44,36 Z"
      />
      <path style={{ ...S.detail, strokeWidth: sw * 0.6 }} d="M30,-44 C10,-56 -10,-56 -26,-70 M20,-20 C0,-30 -20,-30 -44,-40 M18,6 C-4,0 -24,0 -46,6 M24,26 C8,30 -6,34 -18,48" />
      {/* horns */}
      <path style={{ ...S.horn, ...stroke(sw) }} d="M86,-50 C72,-92 40,-118 -18,-138 C26,-110 50,-84 66,-44 Z" />
      <path style={{ ...S.horn, ...stroke(sw) }} d="M64,-44 C42,-80 2,-104 -62,-112 C-10,-96 18,-74 40,-36 Z" />
      <path style={{ ...S.horn, ...stroke(sw) }} d="M8,-86 C0,-104 6,-120 20,-134 C22,-116 26,-102 28,-90 Z" />
      {/* beard */}
      <path style={{ ...S.fin, ...stroke(sw) }} d="M126,40 C120,60 132,72 122,92 C140,78 146,62 142,40 Z M100,40 C92,58 100,70 90,86 C108,74 114,60 114,40 Z" />
      {/* skull + jaws */}
      <path
        style={{ ...S.body, ...stroke(sw) }}
        d="M-6,-30 C14,-44 40,-52 66,-50 C78,-64 98,-68 112,-56 C120,-49 127,-47 137,-46 C153,-45 166,-41 176,-35 C184,-46 197,-46 199,-35 C201,-24 193,-16 182,-15 L178,-10 C152,-9 120,-6 92,0 L84,6 L150,22 C160,24 167,29 162,37 C150,45 120,47 96,43 C70,41 40,37 20,35 C10,34 0,33 -6,31 Z"
      />
      {/* cheek frill hides the neck joint */}
      <path
        style={{ ...S.fin, ...stroke(sw * 0.8) }}
        d="M44,-34 L18,-48 L26,-28 L-4,-36 L12,-16 L-18,-14 L6,0 L-16,14 L10,16 L-6,34 L22,26 L30,42 L46,18 C52,4 52,-18 44,-34 Z"
      />
      {/* tongue */}
      <path style={{ ...S.tongue, ...stroke(sw * 0.7) }} d="M94,6 C122,10 150,8 172,1 C188,-4 200,6 192,14 C186,19 180,14 184,9 C168,14 130,16 98,12 Z" />
      {/* teeth */}
      <path
        style={{ ...S.teeth, ...stroke(sw * 0.5) }}
        d="M172,-12 L176,4 L181,-13 Z M160,-11 L163,-2 L166,-11 Z M146,-9 L149,-1 L152,-10 Z M132,-8 L134,-1 L137,-8 Z M144,20 L149,6 L152,22 Z M132,17 L135,9 L138,18 Z M118,14 L121,7 L124,15 Z"
      />
      {/* brow, nostril, jaw details */}
      <path style={{ ...S.detail, strokeWidth: sw * 0.6 }} d="M98,-50 C112,-58 126,-54 134,-46 M186,-31 C190,-36 195,-31 191,-27 M60,-30 C70,-20 76,-8 80,4 M40,24 C60,30 80,32 100,34" />
      <path style={{ ...S.rim, strokeWidth: sw * 0.55 }} d="M4,-36 C22,-46 44,-52 66,-50 C78,-64 98,-68 112,-56 M138,-46 C154,-45 166,-41 176,-35" />
      {/* eye */}
      <path style={{ ...S.eye, ...stroke(sw * 0.5) }} d="M104,-38 C110,-47 124,-47 131,-40 C124,-33 111,-32 104,-38 Z" />
      <ellipse cx="118.5" cy="-39.5" rx="2.2" ry="4.6" style={S.ink} />
      {/* whiskers */}
      <g className="whisker" style={{ transformOrigin: "186px -20px" }}>
        <path style={{ ...S.line, fill: "none", strokeWidth: sw * 1.3, strokeLinecap: "round" }} d="M188,-24 C222,-48 252,-20 272,-40 C292,-60 314,-42 336,-56" />
      </g>
      <g className="whisker whisker--b" style={{ transformOrigin: "178px -12px" }}>
        <path style={{ ...S.line, fill: "none", strokeWidth: sw * 1.3, strokeLinecap: "round" }} d="M178,-12 C200,22 172,48 198,72 C216,88 208,110 230,124" />
      </g>
    </g>
  );
}

export function DragonLeg({ sw = 4, pearl = false }: { sw?: number; pearl?: boolean }) {
  return (
    <g>
      {/* elbow flame */}
      <path style={{ ...S.fin, ...stroke(sw) }} d="M-18,28 C-40,30 -54,44 -70,40 C-56,54 -40,54 -16,46 Z" />
      {/* limb */}
      <path style={{ ...S.body, ...stroke(sw) }} d="M-26,-10 C-32,24 -16,50 8,66 L32,74 C22,58 18,38 24,-10 Z" />
      <path style={{ ...S.detail, strokeWidth: sw * 0.6 }} d="M-14,10 C-12,24 -4,36 6,46 M0,4 C2,18 8,30 16,40" />
      {pearl && (
        <g>
          <circle cx="64" cy="104" r="26" style={{ ...S.teeth, ...stroke(sw) }} />
          <path style={{ ...S.fin, ...stroke(sw * 0.7) }} d="M64,78 C76,64 72,52 84,42 C82,56 92,62 86,80 C98,72 104,76 108,66 C108,82 100,92 88,92 Z" />
          <path style={{ ...S.detail, strokeWidth: sw * 0.6 }} d="M50,96 C54,88 62,86 70,88" />
        </g>
      )}
      {/* talons */}
      <path style={{ ...S.body, ...stroke(sw) }} d="M2,62 C18,58 34,62 40,76 C34,86 18,86 4,80 Z" />
      <path style={{ ...S.claw, ...stroke(sw * 0.8) }} d="M30,64 C54,60 70,70 74,86 C76,95 68,100 64,94 C66,84 54,76 32,78 Z" />
      <path style={{ ...S.claw, ...stroke(sw * 0.8) }} d="M22,78 C36,90 40,104 36,118 C34,126 26,126 25,120 C30,110 24,98 12,84 Z" />
      <path style={{ ...S.claw, ...stroke(sw * 0.8) }} d="M8,76 C4,92 -6,102 -18,108 C-24,112 -28,105 -24,101 C-14,97 -8,88 -4,74 Z" />
    </g>
  );
}

export interface DragonSpec {
  ctrl: Pt[];
  samples: number;
  width: (t: number) => number;
  legs: { t: number; scale: number; pearl?: boolean }[];
  headScale: number;
  sw: number;
  scaleRows?: number[];
}

export function buildDragon(spec: DragonSpec): Body {
  return makeBody(sampleSpline(spec.ctrl, spec.samples), spec.width);
}

/** Body segment (t0..t1) with spines, belly and scales. */
export function DragonBody({ b, t0 = 0, t1 = 1, sw, rows }: { b: Body; t0?: number; t1?: number; sw: number; rows?: number[] }) {
  const sp = spines(b, { t0: Math.max(t0, 0.03), t1: Math.min(t1, 0.97), count: Math.max(2, Math.round((t1 - t0) * 44)), height: 0.42 });
  const bl = belly(b, { t0: Math.max(t0, 0.05), t1, depth: 0.32, every: 4 });
  const sc = scales(b, { t0, t1, rows: rows ?? [-0.42, 0.05, 0.52], spacing: 0.3, size: 0.13, minW: 12 });
  return (
    <g>
      <path d={sp} style={{ ...S.fin, ...stroke(sw * 0.8) }} />
      <path d={outline(b, t0, t1)} style={{ ...S.body, ...stroke(sw) }} />
      <path d={bl.fill} style={{ ...S.belly, ...stroke(sw * 0.5) }} />
      <path d={bl.lines} style={{ ...S.line, fill: "none", strokeWidth: sw * 0.45 }} />
      <path d={sc} style={{ ...S.detail, strokeWidth: sw * 0.5, strokeLinecap: "round" }} />
      <path d={rail(b, 0.72, Math.max(t0, 0.04), t1)} style={{ ...S.rim, strokeWidth: sw * 0.5 }} />
    </g>
  );
}

export function DragonHeadAt({ b, scale, sw }: { b: Body; scale: number; sw: number }) {
  return (
    <g transform={anchor(b, 1, 0, scale)}>
      <DragonHead sw={sw / scale} />
    </g>
  );
}

export function DragonLegAt({ b, t, scale, sw, pearl }: { b: Body; t: number; scale: number; sw: number; pearl?: boolean }) {
  return (
    <g transform={anchor(b, t, -0.5, scale)}>
      <DragonLeg sw={sw / scale} pearl={pearl} />
    </g>
  );
}
