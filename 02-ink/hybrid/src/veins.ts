// Procedural red ink roots + poppies, drawn on a 2D canvas that the shader samples.
// Growth is a pure function of a 0..1 progress value, so scrubbing backwards works.

interface Pt { x: number; y: number }

interface Thorn { s: number; x: number; y: number; a: number; len: number; w: number }

interface Branch {
  pts: Pt[];
  w: number[];
  cum: number[];
  len: number;
  t0: number;
  dur: number;
  kind: 'red' | 'cyan';
  core: boolean;
  thorns: Thorn[];
}

interface Flower { x: number; y: number; R: number; rot: number; t: number; seed: number }

export interface Anchor { x: number; y: number; side: 'left' | 'right'; reach: number }

const TAU = Math.PI * 2;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutBack = (x: number) => {
  const c1 = 1.5, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const angDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
};

export class Veins {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private branches: Branch[] = [];
  private flowers: Flower[] = [];
  anchors: Anchor[] = [];
  private w = 0;
  private h = 0;
  private scale = 1;
  private lastP = -1;
  private count: number;

  constructor(count: number) {
    this.count = count;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'veins-canvas';
    this.ctx = this.canvas.getContext('2d')!;
    this.layout();
  }

  layout(): void {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.scale = Math.min(window.devicePixelRatio || 1, 1.25);
    this.canvas.width = Math.round(this.w * this.scale);
    this.canvas.height = Math.round(this.h * this.scale);
    this.generate();
    this.lastP = -1;
  }

  private grow(
    r: () => number, start: Pt, angle: number, len: number, w0: number, opts: {
      target?: Pt; wiggle?: number; step?: number; wEnd?: number; taper?: number;
    } = {},
  ): { pts: Pt[]; w: number[]; cum: number[]; len: number } {
    const step = opts.step ?? 5;
    const wiggle = opts.wiggle ?? 0.18;
    const wEnd = opts.wEnd ?? 0.6;
    const taper = opts.taper ?? 0.75;
    let x = start.x, y = start.y, a = angle;
    const n = Math.max(2, Math.ceil(len / step));
    const pts: Pt[] = [{ x, y }];
    const seed = r() * 100;
    for (let i = 1; i <= n; i++) {
      const f = i / n;
      if (opts.target) {
        const want = Math.atan2(opts.target.y - y, opts.target.x - x);
        a += angDiff(want, a) * (0.05 + 0.6 * f * f);
        const dx = opts.target.x - x, dy = opts.target.y - y;
        if (dx * dx + dy * dy < step * step * 1.5) { pts.push({ ...opts.target }); break; }
      }
      a += (r() - 0.5) * wiggle + Math.sin(i * 0.23 + seed) * wiggle * 0.35;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      pts.push({ x, y });
    }
    const m = pts.length;
    const w: number[] = [];
    const cum: number[] = [0];
    for (let i = 0; i < m; i++) {
      const f = i / (m - 1);
      const bump = 0.88 + 0.24 * Math.sin(i * 0.37 + seed * 2.1);
      w.push(wEnd + (w0 - wEnd) * Math.pow(1 - f, taper) * bump);
      if (i > 0) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    return { pts, w, cum, len: cum[m - 1] };
  }

  private addThorns(r: () => number, b: Omit<Branch, 'thorns'>, density: number): Thorn[] {
    const th: Thorn[] = [];
    let s = 6 + r() * 8;
    const unit = Math.min(this.w, this.h) / 900;
    while (s < b.len - 4) {
      const i = b.cum.findIndex((c) => c >= s);
      if (i <= 0) break;
      const p0 = b.pts[i - 1], p1 = b.pts[i];
      const tan = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const side = r() < 0.5 ? -1 : 1;
      const w = b.w[i];
      th.push({
        s, x: p1.x, y: p1.y,
        a: tan + side * (0.75 + r() * 0.7) - side * 0.25,
        len: (4 + r() * 9) * Math.max(0.55, Math.min(1.6, w / 6)) * Math.max(0.7, unit * 1.2),
        w: Math.max(0.8, w * 0.42),
      });
      s += (5 + r() * 11) / density;
    }
    return th;
  }

  private push(r: () => number, g: ReturnType<Veins['grow']>, t0: number, dur: number,
    kind: Branch['kind'], core: boolean, thornDensity: number): Branch {
    const base = { ...g, t0, dur, kind, core };
    const b: Branch = { ...base, thorns: thornDensity > 0 ? this.addThorns(r, base, thornDensity) : [] };
    this.branches.push(b);
    return b;
  }

  private sprout(r: () => number, parent: Branch, depth: number): void {
    let s = 30 + r() * 40;
    while (s < parent.len - 20) {
      const i = parent.cum.findIndex((c) => c >= s);
      if (i <= 0) break;
      const pw = parent.w[i];
      if (r() < (depth === 0 ? 0.8 : 0.5) && pw > 1.4) {
        const p0 = parent.pts[i - 1], p1 = parent.pts[i];
        const tan = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const side = r() < 0.5 ? -1 : 1;
        const unit = Math.min(this.w, this.h) / 900;
        const len = (depth === 0 ? 50 + r() * 140 : 18 + r() * 55) * Math.max(0.6, unit) * Math.min(1.4, 0.5 + pw / 10);
        const g = this.grow(r, { ...p1 }, tan + side * (0.45 + r() * 0.75), len, pw * 0.62, {
          wiggle: 0.32, wEnd: 0.4, taper: 0.9,
        });
        const speed = parent.len / parent.dur;
        const t0 = parent.t0 + parent.dur * (s / parent.len);
        const child = this.push(r, g, t0, len / (speed * 0.55), 'red', false, depth === 0 ? 1 : 0.7);
        if (depth < 1) this.sprout(r, child, depth + 1);
        if (depth === 1 && r() < 0.12 && this.flowers.length < 12) {
          const end = child.pts[child.pts.length - 1];
          this.flowers.push({ x: end.x, y: end.y, R: (16 + r() * 12) * Math.max(0.7, unit), rot: r() * TAU, t: child.t0 + child.dur, seed: r() * 50 });
        }
      }
      s += (depth === 0 ? 34 : 22) + r() * 50;
    }
  }

  private generate(): void {
    const r = rng(20261017);
    const { w, h } = this;
    this.branches = [];
    this.flowers = [];
    this.anchors = [];
    const mobile = w < 700;
    const unit = Math.min(w, h) / 900;

    // anchors where project cards attach
    const reach = [0.36, 0.5, 0.64, 0.78];
    if (mobile) {
      const cardW = Math.min(260, w - 110);
      const lx = 16 + cardW + 14;
      const rx = w - lx;
      const ys = [0.3, 0.47, 0.64, 0.81];
      for (let i = 0; i < this.count; i++) {
        const left = i % 2 === 0;
        this.anchors.push({ x: left ? lx : rx, y: h * ys[i % 4], side: left ? 'left' : 'right', reach: reach[i % 4] });
      }
    } else {
      const pos: [number, number][] = [[0.36, 0.33], [0.64, 0.44], [0.335, 0.7], [0.665, 0.8]];
      for (let i = 0; i < this.count; i++) {
        const [ax, ay] = pos[i % 4];
        this.anchors.push({ x: w * ax, y: h * ay, side: ax < 0.5 ? 'left' : 'right', reach: reach[i % 4] });
      }
    }

    // cyan glint stems, drawn first (behind the red)
    const glints: [Pt, number, number][] = [
      [{ x: -10, y: h * 0.18 }, -0.15, w * 0.55],
      [{ x: w + 10, y: h * 0.12 }, Math.PI + 0.35, w * 0.45],
      [{ x: w * 0.12, y: h + 10 }, -1.1, h * 0.7],
      [{ x: w + 10, y: h * 0.62 }, Math.PI - 0.2, w * 0.5],
    ];
    glints.forEach(([s, a, len], k) => {
      const g = this.grow(r, s, a, len, 2.2, { wiggle: 0.06, wEnd: 0.8, taper: 0.4, step: 6 });
      this.push(r, g, 0.04 + k * 0.08, 0.55, 'cyan', false, 0);
    });

    // trunk from the top edge
    const trunkLen = h * (mobile ? 0.9 : 0.66);
    const trunk = this.push(
      r,
      this.grow(r, { x: w * 0.5, y: -14 }, Math.PI / 2, trunkLen, (mobile ? 19 : 34) * Math.max(0.8, unit), {
        target: { x: w * (mobile ? 0.5 : 0.52), y: trunkLen - 14 }, wiggle: 0.14, wEnd: 2.5, taper: 0.55,
      }),
      0, 0.42, 'red', true, 1.7,
    );

    // primary roots to each card anchor
    this.anchors.forEach((an) => {
      const wantY = an.y - h * (mobile ? 0.08 : 0.14);
      let best = 0, bd = 1e9;
      trunk.pts.forEach((p, i) => { const d = Math.abs(p.y - wantY); if (d < bd) { bd = d; best = i; } });
      best = Math.max(4, Math.min(best, trunk.pts.length - 2));
      const sp = trunk.pts[best];
      const t0 = trunk.t0 + trunk.dur * (trunk.cum[best] / trunk.len);
      const dist = Math.hypot(an.x - sp.x, an.y - sp.y);
      const g = this.grow(r, { ...sp }, Math.atan2(an.y - sp.y, an.x - sp.x) + (an.side === 'left' ? 0.5 : -0.5), dist * 1.5,
        trunk.w[best] * 0.82, { target: { x: an.x, y: an.y }, wiggle: 0.2, wEnd: 1.6, taper: 0.7 });
      const b = this.push(r, g, t0, Math.max(0.08, an.reach - t0), 'red', true, 1.4);
      this.sprout(r, b, 0);
      this.flowers.push({ x: an.x, y: an.y, R: (mobile ? 30 : 48) * Math.max(0.75, unit), rot: r() * TAU, t: an.reach - 0.015, seed: r() * 50 });
    });
    this.sprout(r, trunk, 0);

    // thin roots creeping in from the frame edges
    const edges: [Pt, number, number, number][] = [
      [{ x: -10, y: h * 0.55 }, 0.1, w * 0.35, 0.18],
      [{ x: w + 10, y: h * 0.3 }, Math.PI - 0.1, w * 0.3, 0.3],
      [{ x: w * 0.82, y: h + 10 }, -1.9, h * 0.45, 0.45],
      [{ x: w * 0.2, y: -10 }, 1.3, h * 0.4, 0.1],
    ];
    edges.forEach(([s, a, len, t0]) => {
      const b = this.push(r, this.grow(r, s, a, len, 5 * Math.max(0.8, unit), { wiggle: 0.26, wEnd: 0.5, taper: 0.8 }), t0, 0.4, 'red', false, 0.9);
      this.sprout(r, b, 1);
    });

    // big poppies half out of frame, like the edit's corners
    this.flowers.push(mobile ? { x: w * 0.02, y: h * 0.5, R: 60, rot: 0.4, t: 0.22, seed: 3 } : { x: w * 0.37, y: h * 0.02, R: 70 * unit, rot: 0.4, t: 0.22, seed: 3 });
    this.flowers.push({ x: w * 0.97, y: h * 0.93, R: 96 * Math.max(0.6, unit), rot: 1.7, t: 0.7, seed: 9 });
    if (!mobile) this.flowers.push({ x: w * 0.93, y: h * 0.12, R: 54 * unit, rot: 2.3, t: 0.46, seed: 13 });
  }

  /** Redraws for a growth value. Returns true if the canvas changed. */
  draw(p: number): boolean {
    if (Math.abs(p - this.lastP) < 0.0008) return false;
    this.lastP = p;
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const b of this.branches) if (b.kind === 'cyan') this.drawBranch(b, p);
    // cyan rim underlay offset up-left (chromatic edge like the edit)
    for (const b of this.branches) if (b.kind === 'red') this.drawBranch(b, p, true);
    for (const b of this.branches) if (b.kind === 'red') this.drawBranch(b, p);
    for (const f of this.flowers) {
      const bloom = clamp01((p - f.t) / 0.1);
      if (bloom > 0) this.poppy(f, bloom);
    }
    return true;
  }

  private visibleLen(b: Branch, p: number): number {
    return b.len * clamp01((p - b.t0) / b.dur);
  }

  private drawBranch(b: Branch, p: number, rim = false): void {
    const L = this.visibleLen(b, p);
    if (L <= 0) return;
    const ctx = this.ctx;
    const growing = L < b.len - 0.5;
    if (b.kind === 'cyan') {
      ctx.strokeStyle = 'rgba(40,90,255,0.35)';
      this.strokePath(b, L, 2.4);
      ctx.strokeStyle = 'rgba(120,225,255,0.85)';
      this.strokePath(b, L, 0.7);
      return;
    }
    if (rim) {
      if (!b.core) return;
      ctx.save();
      ctx.translate(-1.4, -1.2);
      ctx.strokeStyle = 'rgba(90,200,255,0.42)';
      this.strokePath(b, L, 1, 0.4);
      ctx.restore();
      return;
    }
    ctx.strokeStyle = '#ff5a43';
    ctx.fillStyle = '#ff5a43';
    this.strokePath(b, L, 1);
    for (const t of b.thorns) {
      if (t.s > L) break;
      const g = clamp01((L - t.s) / 14);
      const tl = t.len * g;
      const nx = Math.cos(t.a + Math.PI / 2) * t.w * 0.5;
      const ny = Math.sin(t.a + Math.PI / 2) * t.w * 0.5;
      ctx.beginPath();
      ctx.moveTo(t.x + nx, t.y + ny);
      ctx.lineTo(t.x + Math.cos(t.a) * tl, t.y + Math.sin(t.a) * tl);
      ctx.lineTo(t.x - nx, t.y - ny);
      ctx.fill();
    }
    if (b.core) {
      ctx.strokeStyle = 'rgba(255,170,150,0.55)';
      this.strokePath(b, L, 0.28);
    }
    if (growing && b.core) {
      const tip = this.pointAt(b, L);
      const grd = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 16);
      grd.addColorStop(0, 'rgba(255,240,230,0.95)');
      grd.addColorStop(0.3, 'rgba(255,120,90,0.6)');
      grd.addColorStop(1, 'rgba(255,90,67,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 16, 0, TAU);
      ctx.fill();
    }
  }

  private pointAt(b: Branch, L: number): Pt {
    let i = 1;
    while (i < b.cum.length && b.cum[i] < L) i++;
    if (i >= b.cum.length) return b.pts[b.pts.length - 1];
    const f = (L - b.cum[i - 1]) / Math.max(1e-6, b.cum[i] - b.cum[i - 1]);
    return { x: b.pts[i - 1].x + (b.pts[i].x - b.pts[i - 1].x) * f, y: b.pts[i - 1].y + (b.pts[i].y - b.pts[i - 1].y) * f };
  }

  private strokePath(b: Branch, L: number, wMul: number, wAdd = 0): void {
    const ctx = this.ctx;
    const { pts, w, cum } = b;
    for (let i = 1; i < pts.length; i++) {
      if (cum[i - 1] >= L) break;
      let x1 = pts[i].x, y1 = pts[i].y;
      if (cum[i] > L) {
        const f = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
        x1 = pts[i - 1].x + (x1 - pts[i - 1].x) * f;
        y1 = pts[i - 1].y + (y1 - pts[i - 1].y) * f;
      }
      ctx.lineWidth = Math.max(0.5, w[i] * wMul + wAdd);
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  private poppy(f: Flower, bloom: number): void {
    const ctx = this.ctx;
    const r = rng(Math.floor(f.seed * 1000));
    const R = f.R * easeOutBack(bloom);
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot + (1 - bloom) * 0.6);
    ctx.globalAlpha = clamp01(bloom * 1.6);

    const layer = (count: number, rad: number, spread: number, light: number, off: number) => {
      for (let k = 0; k < count; k++) {
        const a = off + (k / count) * TAU + (r() - 0.5) * 0.35;
        const pr = rad * (0.88 + r() * 0.2);
        const N = 30;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let j = 0; j <= N; j++) {
          const u = j / N;
          const phi = a - spread + 2 * spread * u;
          const lobe = Math.pow(Math.sin(Math.PI * u), 0.35);
          const wav = 1 + 0.07 * Math.sin(j * 1.9 + k * 3 + f.seed) + 0.035 * Math.sin(j * 5.1 + k);
          const rr = pr * lobe * wav;
          ctx.lineTo(Math.cos(phi) * rr, Math.sin(phi) * rr);
        }
        ctx.closePath();
        const g = ctx.createRadialGradient(0, 0, pr * 0.05, 0, 0, pr);
        g.addColorStop(0, '#1a0304');
        g.addColorStop(0.28, '#7a140c');
        g.addColorStop(0.62, light > 0 ? '#f0533b' : '#d23a26');
        g.addColorStop(1, light > 0 ? '#ff7a5f' : '#f0533b');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(70,6,4,0.55)';
        ctx.stroke();
        // crinkle lines
        ctx.strokeStyle = 'rgba(80,8,6,0.22)';
        ctx.lineWidth = 0.8;
        for (let v = 0; v < 4; v++) {
          const va = a + (r() - 0.5) * spread * 1.2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(va) * pr * 0.3, Math.sin(va) * pr * 0.3);
          ctx.quadraticCurveTo(Math.cos(va + 0.15) * pr * 0.6, Math.sin(va + 0.15) * pr * 0.6, Math.cos(va) * pr * 0.9, Math.sin(va) * pr * 0.9);
          ctx.stroke();
        }
      }
    };
    layer(5, R, 0.95, 0, 0);
    layer(4, R * 0.72, 0.9, 1, 0.6);

    // cyan rim catch-light on one edge
    ctx.strokeStyle = 'rgba(110,215,255,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.92, -2.6, -1.6);
    ctx.stroke();

    // dark heart with stamens
    ctx.fillStyle = '#0d0204';
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#050102';
    for (let s = 0; s < 18; s++) {
      const a = (s / 18) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R * 0.27, Math.sin(a) * R * 0.27, Math.max(0.8, R * 0.025), 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(60,20,25,0.9)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R * 0.17, Math.sin(a) * R * 0.17);
      ctx.stroke();
    }
    ctx.restore();
  }
}
