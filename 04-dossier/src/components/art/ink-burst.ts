import { rng } from "@/lib/random";

/**
 * Procedural feathered ink / fur burst (the edit's white splash, d_7.60.jpg). Round 3 (Reference):
 * a soft dome whose envelope carries narrow rounded flame "tongues" at the top, a wide-blurred body
 * edge, short feathered bristles (faint wide stroke + brighter core, slightly bent) instead of long
 * straight spikes, and dark strands between bristles near the edge. Prototype:
 * reference/proto/burst2.html (compare: burst2_compare.png).
 *
 * Cost control: the proto ran `ctx.filter = blur()` for every stroke (thousands of blurred draws). Here
 * the body and the bristles are drawn sharp on their own layers and each layer is blurred once while
 * compositing. Browsers without canvas `filter` (older Safari) fall back to shadowBlur for the body.
 *
 * The bitmap is generated once per key and cached; components copy it into their own canvas.
 */
export interface BurstOptions {
  seed?: number;
  /** centre, as a fraction of the canvas */
  cx?: number;
  cy?: number;
  /** radius as a fraction of min(width, height) */
  radius?: number;
  strokes?: number;
  lobes?: number;
  width?: number;
  height?: number;
}

const PAPER = "236,236,236"; // --paper-1, never #fff
const cache = new Map<string, HTMLCanvasElement>();

function layer(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

export function renderBurst({
  seed = 3,
  cx = 0.5,
  cy = 0.97,
  radius = 0.5,
  strokes = 3400,
  lobes = 10,
  width = 1600,
  height = 1000,
}: BurstOptions = {}): HTMLCanvasElement {
  const key = [seed, cx, cy, radius, strokes, lobes, width, height].join(":");
  const hit = cache.get(key);
  if (hit) return hit;

  const R = rng(seed * 104729 + 7);
  const W = width;
  const H = height;
  const S = Math.min(W, H);
  const X = cx * W;
  const Y = cy * H;
  const unit = S / 700;
  // the soft body sits inside its envelope (0.8) and the fur stops near 1.0, so the effective radius is
  // inflated to keep the visible burst as wide as the edit's (~75–85 % of the frame at the callers' sizing)
  radius *= 1.22;

  // envelope: a dome with rounded flame tongues (gaussian bumps), ~70 % of them in the upper ±56°
  // (d_7.60: narrow soft "fingers" at the top, bushy fur on the sides), plus a low-frequency wobble
  const tongues = Array.from({ length: lobes }, (_, k) => {
    const up = k < lobes * 0.7;
    const c = up ? -Math.PI / 2 + (R.next() - 0.5) * Math.PI * 0.62 : -Math.PI * (0.08 + 0.84 * R.next());
    return { c, w: up ? 0.045 + R.next() * 0.05 : 0.08 + R.next() * 0.1, A: up ? 0.1 + R.next() * 0.26 : 0.04 + R.next() * 0.1 };
  });
  const wob = Array.from({ length: 6 }, () => ({ f: 3 + Math.floor(R.next() * 9), p: R.next() * 6.28, a: 0.012 + R.next() * 0.02 }));
  const angd = (a: number, b: number) => {
    const d = a - b;
    return Math.atan2(Math.sin(d), Math.cos(d));
  };
  const env = (a: number) => {
    let e = 1;
    for (const t of tongues) {
      const d = angd(a, t.c) / t.w;
      e += t.A * Math.exp(-d * d);
    }
    for (const w of wob) e += w.a * Math.sin(a * w.f + w.p);
    return e;
  };

  const [out, ctx] = layer(W, H);
  const canFilter = typeof ctx.filter === "string";
  const blurred = (src: HTMLCanvasElement, px: number) => {
    if (canFilter) ctx.filter = `blur(${px.toFixed(2)}px)`;
    ctx.drawImage(src, 0, 0);
    ctx.filter = "none";
  };

  // 1) body: the envelope at 0.8, blurred wide so the edge is a soft gradient, not a cut-out
  const [bodyC, body] = layer(W, H);
  body.fillStyle = `rgb(${PAPER})`;
  body.beginPath();
  for (let i = 0; i <= 720; i++) {
    const a = (i / 720) * Math.PI * 2;
    const r = radius * S * env(a) * 0.8;
    body.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r);
  }
  body.closePath();
  body.fill();
  if (canFilter) blurred(bodyC, S / 38);
  else {
    ctx.save();
    ctx.shadowColor = `rgb(${PAPER})`;
    ctx.shadowBlur = S / 30;
    ctx.drawImage(bodyC, 0, 0);
    ctx.restore();
  }
  // the blur also fades the body where it meets the canvas edge: re-fill the core (well inside the soft edge)
  ctx.save();
  ctx.beginPath();
  ctx.arc(X, Y, radius * S * 0.68, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = `rgb(${PAPER})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // 2) fur: short, wide, soft, slightly bent bristles straddling the edge; each one is a faint wide
  //    stroke plus a brighter narrow core over its first two thirds (a feather, not a spike)
  const [furC, fur] = layer(W, H);
  fur.lineCap = "round";
  for (let i = 0; i < strokes; i++) {
    const a = R.next() * Math.PI * 2;
    const e = env(a) * radius * S;
    const r0 = e * (0.55 + R.next() * 0.3);
    const r1 = e * (0.86 + R.next() * 0.16);
    const bend = (R.next() - 0.5) * 0.05 * e;
    const curl = (R.next() - 0.5) * 0.035;
    const x0 = X + Math.cos(a) * r0;
    const y0 = Y + Math.sin(a) * r0;
    const x1 = X + Math.cos(a + curl) * r1;
    const y1 = Y + Math.sin(a + curl) * r1;
    const mx = (x0 + x1) / 2 - Math.sin(a) * bend;
    const my = (y0 + y1) / 2 + Math.cos(a) * bend;
    const w0 = (8 + R.next() * 18) * unit;
    const al = 0.07 + R.next() * 0.16;
    fur.strokeStyle = `rgba(${PAPER},${al.toFixed(3)})`;
    fur.lineWidth = w0;
    fur.beginPath();
    fur.moveTo(x0, y0);
    fur.quadraticCurveTo(mx, my, x1, y1);
    fur.stroke();
    fur.strokeStyle = `rgba(${PAPER},${(al * 1.2).toFixed(3)})`;
    fur.lineWidth = w0 * 0.3;
    fur.beginPath();
    fur.moveTo(x0, y0);
    fur.quadraticCurveTo(mx, my, x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.8);
    fur.stroke();
  }
  blurred(furC, S / 200);

  // 3) texture, drawn on its own layer and laid onto the white only (source-atop): faint radial
  //    dry-brush streaks inside, darker strands between the bristles near the edge (the fur's definition)
  const [texC, tex] = layer(W, H);
  const streak = (a: number, r0: number, r1: number, rgba: string, w: number, twist = 0) => {
    tex.strokeStyle = rgba;
    tex.lineWidth = w;
    tex.beginPath();
    tex.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0);
    tex.lineTo(X + Math.cos(a + twist) * r1, Y + Math.sin(a + twist) * r1);
    tex.stroke();
  };
  for (let i = 0; i < 450; i++) {
    const a = R.next() * Math.PI * 2;
    const e = env(a) * radius * S;
    const r0 = e * (0.35 + R.next() * 0.5);
    streak(a, r0, r0 + e * (0.08 + R.next() * 0.3), `rgba(70,70,70,${(0.02 + R.next() * 0.04).toFixed(3)})`, (1 + R.next() * 3) * unit);
  }
  for (let i = 0; i < 420; i++) {
    const a = R.next() * Math.PI * 2;
    const e = env(a) * radius * S;
    streak(a, e * (0.7 + R.next() * 0.2), e * (0.9 + R.next() * 0.12), `rgba(40,40,40,${(0.08 + R.next() * 0.16).toFixed(3)})`, (0.6 + R.next() * 1.4) * unit, 0.01);
  }
  ctx.globalCompositeOperation = "source-atop";
  blurred(texC, S / 600);

  // 4) specks: punch tiny holes
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 140; i++) {
    const a = R.next() * Math.PI * 2;
    const r = radius * S * (0.3 + R.next() * 0.75);
    ctx.fillStyle = `rgba(0,0,0,${(0.2 + R.next() * 0.5).toFixed(2)})`;
    ctx.fillRect(X + Math.cos(a) * r, Y + Math.sin(a) * r, (1 + R.next() * 2) * unit, (1 + R.next() * 1.5) * unit);
  }
  ctx.globalCompositeOperation = "source-over";

  cache.set(key, out);
  return out;
}

/** Object URL of the burst as a PNG, for `mask-image` (burst-as-window). Revoke when done. */
export function burstObjectURL(opts?: BurstOptions): Promise<string> {
  const c = renderBurst(opts);
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(URL.createObjectURL(b)) : reject(new Error("burst toBlob failed"))), "image/png"),
  );
}
