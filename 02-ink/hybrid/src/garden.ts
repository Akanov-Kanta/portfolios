// Type Garden typing for the two big words (hero name, outro handle).
// Type Garden (type-garden.vercel.app) is by Akshat Agarwal: as each letter is typed, stems,
// thorns, leaves and roses grow out of it. The growth generation (gen, genEnd, grow, vine, curl,
// weave), the drawing (rose, leaf, thorn, strokeRange, path), the 120 ms boil, the letter sway on
// birth (wpt) and the roses facing the pointer (faceTurn) are ported as-is from its core; only the
// layout differs: letters sit exactly on the page's DOM glyphs (site font and size, garden scale
// S = font size), and the canvas rides inside the word's element so it follows its transforms.

type Pt = [number, number];
type Seg = { u0: number; u1: number; layer: number };
type Stem = { t: 'stem'; id: number; pts: Pt[]; segs: Seg[]; d0: number; dur: number; w: number; thorns: { u: number; s: number }[] };
type Leaf = { t: 'leaf'; id: number; x: number; y: number; a: number; L: number; bend: number; layer: number; d0: number };
type Rose = { t: 'rose'; id: number; x: number; y: number; R: number; rot: number; ph1: number; ph2: number; turns: number; layer: number; d0: number };
type El = Stem | Leaf | Rose;
type WordP = { roseP: number; leafy: number; dens: number; lean: number; big: number; curvy: number; bridgeP: number; w: number };
interface Letter {
  ch: string;
  id: number;
  birth: number;
  tb: number;
  ws: number;
  wi: number;
  prev: Letter | null;
  /** the card frame's pseudo-letter: stems along the box edges, no glyph */
  frame?: boolean;
  els?: El[];
  endEls?: El[] | null;
  tend?: El[];
  cut?: number | null;
  dead?: number;
  lean?: [number, number];
  x: number;
  y: number;
  tw: number;
}
interface Backend {
  fill: (p: Pt[], col: string) => void;
  stroke: (p: Pt[], col: string, w: number) => void;
}
export interface Palette {
  red: string;
  blue: string;
  line: string;
  text: string;
  vein: string;
  /** optional outline around stems, thorns and leaves (dark stems on a dark page) */
  rim?: string;
}
interface St {
  S: number;
  C: Palette;
  boil: boolean;
  recoil: number;
  speed: number;
  wither: number;
  face: boolean;
}

/** A glow layer for the canvas letters (mirrors the word's CSS text-shadow). */
export interface Glow {
  color: string;
  blur: number; // in em
  y?: number; // offset in em
}

export interface GardenOpts {
  /** CSS font family / weight of the word (the site's font, not Type Garden's) */
  family: string;
  weight: number;
  palette: Palette;
  glows: Glow[];
  /** Type Garden's density knob (1 = original) */
  density: number;
  /** ms per letter, randomised +-30 % */
  pace: number;
  /** keep the caret blinking once the word is typed (else it fades after a beat) */
  caretStays: boolean;
  /** static: draw fully grown, no motion (reduced motion) */
  still: boolean;
  /** ?freeze=1: fixed seed and fixed clock, so the drawing is deterministic */
  frozen: boolean;
  /** the element whose glyphs are typed, when it is not the host itself */
  textEl?: HTMLElement;
  /** stems, leaves and roses this many times bigger than the letters (small type) */
  scale?: number;
  /** also grow stems along the host's box edges, with roses on two corners, at this scale */
  frame?: number;
  /** letters over the whole garden (small type: nothing woven in front of them) */
  textOnTop?: boolean;
}

const MARGIN = { l: 0.95, r: 0.95, t: 1.45, b: 0.95 }; // canvas margins around the word, in S

export class Garden {
  readonly canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private host: HTMLElement;
  private textEl: HTMLElement;
  private o: GardenOpts;
  private k: number;
  /** growth scale of what is being generated now: the letters' (k) or the frame's */
  private gk = 1;
  private letters: Letter[] = [];
  private frameL: Letter | null = null;
  private box = { x: 0, y: 0, w: 1, h: 1 };
  private slots: { ch: string; x: number; y: number; tw: number }[] = [];
  private S = 40;
  private dpr = 1;
  private cssW = 1;
  private cssH = 1;
  private nextId = 1;
  private typed = 0; // slots typed so far
  private nextAt = 0;
  private lastKey = -1e9;
  private doneAt = -1;
  private cache: Record<string, number> = {};
  private fa: Record<number, [number, number]> = {};
  private sprites = new Map<string, { c: HTMLCanvasElement; ox: number; oy: number }>();
  private pointer: Pt | null = null;
  private rand: () => number = Math.random;
  private cc!: Palette;
  private _now: number | null = null;
  private dirty = true;
  /** tests: stop typing after this many slots (screenshots of a given moment) */
  holdAt: number | null = null;
  /** tests: hide the canvas letters (contrast is measured on what is behind them) */
  hideText = false;
  /** frame mode: the side where the vein's tick meets the box (gets a small rose) */
  tick: 'l' | 'r' | null = null;
  /** 'idle' (nothing), 'typing', 'done' (all letters in) */
  state: 'idle' | 'typing' | 'done' = 'idle';

  constructor(host: HTMLElement, opts: GardenOpts) {
    this.host = host;
    this.textEl = opts.textEl ?? host;
    this.o = opts;
    this.k = opts.scale ?? 1;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'garden';
    this.canvas.setAttribute('aria-hidden', 'true');
    const g = this.canvas.getContext('2d');
    if (!g) throw new Error('2D canvas unavailable');
    this.g = g;
    host.appendChild(this.canvas);
    host.classList.add('garden-on');
    if (!opts.frozen && !opts.still) {
      window.addEventListener('pointermove', (e) => (this.pointer = [e.clientX, e.clientY]), { passive: true });
    }
  }

  get F(): string {
    return this.o.family;
  }

  // ---------------------------------------------------------------- layout (DOM glyphs -> slots)
  layout(): void {
    const host = this.host;
    const fs = parseFloat(getComputedStyle(this.textEl).fontSize) || 40;
    this.S = fs;
    this.cache = {};
    this.sprites.clear();
    const hr = host.getBoundingClientRect();
    const scale = host.offsetWidth ? hr.width / host.offsetWidth : 1;
    const m = fs * Math.max(this.k, this.o.frame ?? 0), ml = MARGIN.l * m, mt = MARGIN.t * m;
    this.cssW = host.offsetWidth + (MARGIN.l + MARGIN.r) * m;
    this.cssH = host.offsetHeight + (MARGIN.t + MARGIN.b) * m;
    this.box = { x: ml, y: mt, w: host.offsetWidth, h: host.offsetHeight };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const c = this.canvas;
    c.style.left = `${-ml}px`;
    c.style.top = `${-mt}px`;
    c.style.width = `${this.cssW}px`;
    c.style.height = `${this.cssH}px`;
    c.width = Math.round(this.cssW * this.dpr);
    c.height = Math.round(this.cssH * this.dpr);
    // glyph boxes of the DOM text, in the canvas's own (untransformed) px
    const g = this.g;
    g.font = this.font(fs);
    const asc = g.measureText('H').fontBoundingBoxAscent;
    const slots: { ch: string; x: number; y: number; tw: number }[] = [];
    const walker = document.createTreeWalker(this.textEl, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node.textContent ?? '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (/\s/.test(ch)) continue;
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        const adv = g.measureText(ch).width;
        const left = (r.left - hr.left) / scale;
        const top = (r.top - hr.top) / scale;
        slots.push({ ch, x: ml + left + adv / 2, y: mt + top + asc, tw: adv });
      }
    }
    // the gap between the two DOM words is a space for the garden (cuts the stem: genEnd)
    const withSpaces: typeof slots = [];
    const words = (this.textEl.getAttribute('aria-label') ?? this.textEl.textContent ?? '').trim().split(/\s+/);
    let k = 0;
    words.forEach((w, wi) => {
      if (wi > 0) withSpaces.push({ ch: ' ', x: 0, y: 0, tw: 0 });
      for (let j = 0; j < w.length && k < slots.length; j++) withSpaces.push(slots[k++]);
    });
    this.slots = withSpaces;
    // glow sprites are built now, not on the first frame each letter appears (no hitch mid-typing)
    for (const sl of withSpaces) if (sl.ch !== ' ') this.sprite(sl.ch);
    for (const l of this.letters) {
      // re-seat letters already typed
      const sl = this.slotOf(l);
      if (sl) Object.assign(l, { x: sl.x, y: sl.y, tw: sl.tw });
    }
    if (this.frameL) {
      // same seed, new box: the frame regrows to the new size in place
      Object.assign(this.frameL, { x: this.box.x, y: this.box.y });
      this.genFrame(this.frameL);
    }
    this.dirty = true;
  }

  private slotOf(l: Letter) {
    const i = this.letters.indexOf(l);
    return i >= 0 ? this.slots[i] : null;
  }

  private font(px: number): string {
    return `${this.o.weight} ${px}px ${this.o.family}`;
  }

  // ---------------------------------------------------------------- typing
  /** Start typing the word from scratch (fresh seed). */
  start(now: number, delay = 0): void {
    this.letters = [];
    this.fa = {};
    this.nextId = 1;
    this.typed = 0;
    this.rand = this.o.frozen ? this.rng(20261018) : Math.random;
    this.doneAt = -1;
    this.state = 'typing';
    this.nextAt = now + delay;
    this.frameL = null;
    if (this.o.frame) {
      const b = now + delay;
      this.frameL = { ch: '', id: 900, birth: b, tb: b, ws: Math.floor(this.rand() * 1e9), wi: 0, prev: null, frame: true, x: this.box.x, y: this.box.y, tw: 0 };
      this.genFrame(this.frameL);
    }
    if (this.o.still || this.o.frozen) this.finish(now);
    this.dirty = true;
  }

  /** Everything typed and fully grown, now (click-to-skip, reduced motion, frozen tests). */
  finish(now: number): void {
    if (this.state === 'idle') this.start(now);
    const past = now - 6000;
    while (this.typed < this.slots.length) this.add(this.typed, past);
    for (const l of this.all()) {
      // pull everything already typed to fully grown too
      const shift = Math.max(0, l.birth - past);
      l.birth -= shift;
      l.tb -= shift;
      if (l.cut != null) l.cut -= shift;
    }
    this.state = 'done';
    this.doneAt = past;
    this.lastKey = past;
    this.dirty = true;
  }

  /** Wither everything (fades out over 260 ms), then the word is idle and can be typed again. */
  wither(now: number): void {
    if (this.state === 'idle') return;
    for (const l of this.all()) if (l.dead == null) l.dead = now;
    this.state = 'idle';
    this.dirty = true;
  }

  /** the typed letters, after the frame's pseudo-letter (drawn first, under the word) */
  private all(): Letter[] {
    return this.frameL ? [this.frameL, ...this.letters] : this.letters;
  }

  get done(): boolean {
    return this.state === 'done';
  }

  private add(i: number, now: number): void {
    const s = this.slots[i];
    const last = this.letters[this.letters.length - 1];
    if (s.ch === ' ') {
      if (last && last.ch !== ' ') {
        last.cut = now;
        this.genEnd(last, now - last.birth);
      }
      this.letters.push({ ch: ' ', id: this.nextId++, birth: now, tb: now, ws: 0, wi: 0, prev: null, x: 0, y: 0, tw: 0 });
    } else {
      const same = !!last && last.ch !== ' ';
      const l: Letter = {
        ch: s.ch, id: this.nextId++, birth: now, tb: now,
        ws: same ? last.ws : Math.floor(this.rand() * 1e9), wi: same ? last.wi + 1 : 0, prev: same ? last : null,
        x: s.x, y: s.y, tw: s.tw,
      };
      this.gen(l);
      this.letters.push(l);
    }
    this.typed = i + 1;
    this.lastKey = now;
  }

  /** Advance typing; returns true when a letter was added. */
  update(now: number): boolean {
    // dead letters are removed 300 ms after death
    if (this.letters.some((l) => l.dead != null && now - l.dead > 300)) {
      this.letters = this.letters.filter((l) => l.dead == null || now - l.dead <= 300);
      this.dirty = true;
    }
    if (this.frameL?.dead != null && now - this.frameL.dead > 300) {
      this.frameL = null;
      this.dirty = true;
    }
    if (this.state !== 'typing' || now < this.nextAt) return false;
    if (this.holdAt != null && this.typed >= this.holdAt) return false;
    if (this.typed >= this.slots.length) {
      // nothing to type (a frame-only garden)
      this.state = 'done';
      this.doneAt = now;
      return false;
    }
    this.add(this.typed, now);
    if (this.typed >= this.slots.length) {
      this.state = 'done';
      this.doneAt = now;
    } else {
      const nx = this.slots[this.typed];
      // a natural rhythm: +-30 %, a breath before a new word, now and then a hesitation
      let d = this.o.pace * (0.7 + this.rand() * 0.6);
      if (nx.ch === ' ') d += this.o.pace * 0.8;
      else if (this.rand() < 0.12) d += this.o.pace * 0.9;
      this.nextAt = now + d;
    }
    return true;
  }

  // ---------------------------------------------------------------- math (Type Garden)
  h(n: number) { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); }
  spr(t: number, k = 7, w = 16) { if (t <= 0) return 0; return 1 - Math.exp(-t * k) * Math.cos(t * w); }
  eo(t: number) { if (t <= 0) return 0; if (t >= 1) return 1; return 1 - Math.pow(1 - t, 3); }
  rng(seed: number) {
    let s = seed | 0;
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  bez(a: Pt, b: Pt, c: Pt, d: Pt, n: number): Pt[] {
    const P: Pt[] = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
      P.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]); }
    return P;
  }
  at(P: Pt[], u: number): [Pt, number] {
    const n = P.length; const i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1))));
    return [P[i], Math.atan2(P[i+1][1] - P[i-1][1], P[i+1][0] - P[i-1][0])];
  }
  jit(id: number, f: number, amp: number): [number, number, number] {
    if (!amp) return [0, 0, 0];
    return [(this.h(id*1.37 + f*7.13)*2 - 1)*amp, (this.h(id*2.71 + f*3.11)*2 - 1)*amp, (this.h(id*5.3 + f*1.7)*2 - 1)*0.035];
  }
  path(c: CanvasRenderingContext2D, p: Pt[], closed: boolean) {
    const n = p.length; if (n < 2) return;
    const m = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const s = m(p[n-1], p[0]); c.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const q = m(p[i], p[(i+1) % n]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.closePath();
    } else {
      c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n - 1; i++) { const q = m(p[i], p[i+1]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.lineTo(p[n-1][0], p[n-1][1]);
    }
  }
  backend(g: CanvasRenderingContext2D): Backend {
    return {
      fill: (p, col) => { g.beginPath(); this.path(g, p, true); g.fillStyle = col; g.fill(); },
      stroke: (p, col, w) => { g.beginPath(); this.path(g, p, false); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); },
    };
  }
  vine(base: Pt, dir: number, len: number, amp: number, waves: number, ph: number, bend: number, n?: number): Pt[] {
    n = n || 40; const P: Pt[] = [[base[0], base[1]]], step = len / n; let x = base[0], y = base[1];
    for (let i = 1; i <= n; i++) {
      const u = i / n, a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
      x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
    }
    return P;
  }
  curl(P: Pt[], sign: number, rad: number): Pt[] {
    const n = P.length, e = P[n - 1], a = Math.atan2(e[1] - P[n - 2][1], e[0] - P[n - 2][0]);
    const c = [e[0] - Math.sin(a) * sign * rad, e[1] + Math.cos(a) * sign * rad];
    const a0 = Math.atan2(e[1] - c[1], e[0] - c[0]);
    for (let i = 1; i <= 14; i++) { const u = i / 14, t = a0 + sign * u * Math.PI * 1.6, rr = rad * (1 - 0.5 * u); P.push([c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr]); }
    return P;
  }
  weave(r: () => number, startLayer: number): Seg[] {
    const cuts: number[] = []; const nc = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nc; i++) cuts.push(0.15 + r() * 0.7);
    cuts.sort((a, b) => a - b);
    const segs: Seg[] = []; let u0 = 0, layer = startLayer;
    for (const c of cuts) {
      if (c <= u0) continue;
      segs.push({ u0, u1: c, layer });
      if (r() < 0.3) { const g = 0.02 + r() * 0.03; u0 = Math.min(0.98, c + g); } else u0 = c;
      layer = 1 - layer;
    }
    segs.push({ u0, u1: 1, layer });
    return segs;
  }
  layerAt(segs: Seg[], u: number) { for (const s of segs) if (u >= s.u0 && u <= s.u1) return s.layer; return segs[segs.length - 1].layer; }

  /** glyph advance in S units, measured with the site font */
  mw(ch: string) {
    if (this.cache[ch] != null) return this.cache[ch];
    this.g.font = this.font(100);
    let w = this.g.measureText(ch).width / 100;
    if (ch === ' ') w *= 1.4;
    return (this.cache[ch] = w);
  }

  // ---------------------------------------------------------------- growth (Type Garden)
  wordParams(ws: number): WordP {
    const r = this.rng(ws * 7 + 13), dens = this.o.density;
    return { roseP: 0.3 + r() * 0.3, leafy: (0.6 + r() * 0.8) * dens, dens, lean: (r() - 0.5) * 0.6, big: 0.85 + r() * 0.45, curvy: 0.8 + r() * 0.6, bridgeP: Math.min(0.95, (0.45 + r() * 0.35) * dens), w: 0.5 };
  }
  grow(r: () => number, E: El[], nid: () => number, p: WordP, o: { tip?: string | null; pts?: Pt[]; base?: Pt; dir?: number; len?: number; d0: number; depth?: number; layer0?: number }): Pt[] {
    const tip = o.tip || (r() < p.roseP ? 'rose' : r() < 0.45 ? 'fan' : r() < 0.6 ? 'leaf' : 'curl');
    const k = this.gk;
    let P = o.pts || this.vine(o.base!, o.dir!, o.len! * k, (0.35 + r() * 0.45) * p.curvy, 1 + r() * 1.6, r() * 6.28, (r() - 0.5) * 1.2, 40);
    if (tip === 'curl') P = this.curl(P, r() < 0.5 ? -1 : 1, (0.05 + r() * 0.05) * k);
    const segs = this.weave(r, o.layer0 != null ? o.layer0 : (r() < 0.5 ? 0 : 1));
    const dur = Math.max(320, (o.len || 0.8) * 620);
    const thorns: { u: number; s: number }[] = []; const nt = Math.floor(r() * 2.5);
    for (let i = 0; i < nt; i++) thorns.push({ u: 0.15 + r() * 0.65, s: r() < 0.5 ? -1 : 1 });
    E.push({ t: 'stem', id: nid(), pts: P, segs, d0: o.d0, dur, w: (o.depth ? 0.82 : 1) * k, thorns });
    const nl = Math.floor(r() * 2.8 * p.leafy);
    let sd = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < nl; i++) {
      const u = 0.25 + r() * 0.6, [q, a] = this.at(P, u); sd = -sd;
      E.push({ t: 'leaf', id: nid(), x: q[0], y: q[1], a: a + sd * (0.55 + r() * 0.5), L: (0.14 + r() * 0.2) * (o.depth ? 0.8 : 1) * k, bend: (r() - 0.5) * 1.2, layer: this.layerAt(segs, u), d0: o.d0 + dur * u });
    }
    const [tp, ta] = this.at(P, 1), td = o.d0 + dur * 0.8, tl = this.layerAt(segs, 1);
    if (tip === 'rose') {
      const R = (0.13 + r() * 0.15) * p.big * (o.depth ? 0.75 : 1) * k;
      // legibility: a rose sitting over the letter body mostly goes behind it
      const over = tp[1] > -0.78 && tp[1] < 0.05 && Math.abs(tp[0]) < p.w * 0.5;
      const layer = over ? (r() < 0.22 ? 1 : 0) : (r() < 0.6 ? 1 : tl);
      E.push({ t: 'rose', id: nid(), x: tp[0], y: tp[1], R, rot: (r() - 0.5) * 1.0, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r() * 1, layer, d0: td });
      if (r() < 0.2) { const oo = ta + (r() < 0.5 ? 1 : -1) * 1.3; E.push({ t: 'rose', id: nid(), x: tp[0] + Math.cos(oo) * R * 1.4, y: tp[1] + Math.sin(oo) * R * 1.4, R: R * (0.6 + r() * 0.3), rot: (r() - 0.5) * 1.2, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r(), layer, d0: td + 120 }); }
    } else if (tip === 'fan') {
      const spread = 0.6 + r() * 0.3;
      for (let j = 0; j < 2; j++) E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (j - 0.5) * spread, L: (0.2 + r() * 0.2) * k, bend: (j - 0.5) * 0.8, layer: tl, d0: td + j * 60 });
    } else if (tip === 'leaf') {
      E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (r() - 0.5) * 0.3, L: (0.16 + r() * 0.16) * k, bend: (r() - 0.5), layer: tl, d0: td });
    }
    if (!o.depth && r() < 0.3) {
      const u = 0.35 + r() * 0.35, [q, a] = this.at(P, u);
      this.grow(r, E, nid, p, { base: q, dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), len: (o.len || 0.8) * (0.35 + r() * 0.2), d0: o.d0 + dur * u, depth: 1, layer0: this.layerAt(segs, u) });
    }
    return P;
  }
  gen(l: Letter) {
    this.gk = this.k;
    const r = this.rng((l.ws ^ Math.imul(l.wi + 1, 2654435761)) + Math.floor(this.rand() * 1e6));
    const p = this.wordParams(l.ws), E: El[] = []; let k0 = 0; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), inX = () => (r() - 0.5) * w * 0.7; p.w = w;
    const nUp = 1 + (r() < 0.45 * p.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++) {
      this.grow(r, E, nid, p, { base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + p.lean * 0.5 + (r() - 0.5) * 0.7, len: 0.6 + r() * 0.5, d0: 40 + i * 130, tip: l.wi === 0 && i === 0 ? 'rose' : null });
    }
    if (r() < 0.4 * p.dens) this.grow(r, E, nid, p, { base: [inX(), -0.1 - r() * 0.35], dir: Math.PI / 2 + (r() - 0.5) * 0.8, len: 0.35 + r() * 0.35, d0: 160 });
    if (l.prev && r() < p.bridgeP) {
      const px = -(this.mw(l.prev.ch) + w) / 2;
      const a: Pt = [inX(), -0.05 - r() * 0.55], b: Pt = [px + (r() - 0.5) * 0.25, -0.05 - r() * 0.55];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.4 + r() * 0.4), dx = b[0] - a[0];
      let P = this.bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
      if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
      this.grow(r, E, nid, p, { pts: P, len: Math.abs(dx) + Math.abs(bulge), d0: 90, tip: r() < 0.5 ? 'curl' : r() < 0.5 ? 'leaf' : 'rose' });
    }
    if (l.wi === 0) this.grow(r, E, nid, p, { base: [-w * 0.3, -0.15 - r() * 0.4], dir: Math.PI + (r() - 0.5) * 1.2, len: 0.45 + r() * 0.3, d0: 120, tip: 'curl' });
    l.els = E;
    l.endEls = null;
    const T: El[] = [], tr = this.rng(l.id * 977 + Math.floor(this.rand() * 1e6));
    this.grow(tr, T, () => l.id * 100 + 90 + T.length, p, { base: [w * 0.25, -0.1 - tr() * 0.45], dir: (tr() - 0.5) * 1.4, len: 0.45 + tr() * 0.25, d0: 0, tip: 'curl', depth: 1 });
    l.tend = T.filter(e => e.t === 'stem').slice(0, 1);
    this.legible(l, E);
  }
  /**
   * Type Garden's legibility rule (a rose over the letter body mostly goes behind it), extended to
   * the word's other letters: on a two-line name, line 1's hanging roses would otherwise sit in
   * front of line 2's letters.
   */
  legible(l: Letter, E: El[]) {
    const S = this.S;
    for (const e of E) {
      if (e.t !== 'rose' || e.layer !== 1) continue;
      const ax = l.x + e.x * S, ay = l.y + e.y * S;
      const over = this.slots.some((s) => s.ch !== ' ' && !(s.x === l.x && s.y === l.y) &&
        Math.abs(ax - s.x) < s.tw * 0.5 && ay > s.y - 0.78 * S && ay < s.y + 0.05 * S);
      if (over && this.h(e.id * 7.77 + 1.3) >= 0.22) e.layer = 0;
    }
  }
  genEnd(l: Letter, rel: number) {
    this.gk = this.k;
    const r = this.rng(l.ws + l.wi * 31 + Math.floor(this.rand() * 1e6)), p = this.wordParams(l.ws), E: El[] = [];
    let k0 = 50; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), n = 1 + Math.floor(r() * 2.5); p.w = w;
    for (let i = 0; i < n; i++) {
      const dir = -Math.PI / 2 + 0.6 + (i - (n - 1) / 2) * 0.9 + (r() - 0.5) * 0.4;
      this.grow(r, E, nid, p, { base: [(r() - 0.2) * w * 0.6, -r() * 0.5], dir, len: 0.4 + r() * 0.45, d0: rel + 40 + i * 90, depth: 1, tip: i === 0 || r() < 0.5 ? 'rose' : 'fan' });
    }
    this.legible(l, E);
    l.endEls = E;
  }
  /**
   * Card frames (not in Type Garden): from the top-left and bottom-right corners a stem runs along
   * each edge, wobbling just outside the border, with Type Garden's thorns, leaves and tips; a big
   * rose blooms on each of the two corners, and a small one where the vein's tick meets the box.
   */
  genFrame(l: Letter) {
    const S = this.S, k = (this.gk = this.o.frame ?? 1), W = this.box.w / S, H = this.box.h / S;
    const r = this.rng(l.ws), p = this.wordParams(l.ws), E: El[] = [];
    let k0 = 0; const nid = () => l.id * 100 + (k0++);
    p.w = 0;
    const edge = (c: Pt, d: Pt, n: Pt, len: number): Pt[] => {
      const P: Pt[] = [], amp = 0.06 + r() * 0.08, waves = 1.5 + r() * 2, ph = r() * 6.28;
      for (let i = 0; i <= 40; i++) {
        const u = i / 40, o = (0.05 + amp * (0.5 + 0.5 * Math.sin(u * Math.PI * waves + ph))) * Math.min(1, u * 4) * k;
        P.push([c[0] + d[0] * len * u + n[0] * o, c[1] + d[1] * len * u + n[1] * o]);
      }
      return P;
    };
    const rose = (x: number, y: number, R: number, d0: number) =>
      E.push({ t: 'rose', id: nid(), x, y, R, rot: (r() - 0.5) * 1.0, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r() * 1, layer: 1, d0 });
    // [corner, edge A dir, its outward normal, edge B dir, its outward normal]
    const corners: [Pt, Pt, Pt, Pt, Pt][] = [
      [[0, 0], [1, 0], [0, -1], [0, 1], [-1, 0]],
      [[W, H], [-1, 0], [0, 1], [0, -1], [1, 0]],
    ];
    corners.forEach(([c, dA, nA, dB, nB], ci) => {
      const t0 = ci * 240, span = (d: Pt) => (d[0] ? W : H);
      this.grow(r, E, nid, p, { pts: edge(c, dA, nA, span(dA) * (0.34 + r() * 0.26)), len: 1.5, d0: t0 + 60, tip: 'rose' });
      this.grow(r, E, nid, p, { pts: edge(c, dB, nB, span(dB) * (0.3 + r() * 0.25)), len: 1.2, d0: t0 + 140, tip: r() < 0.5 ? 'curl' : 'leaf' });
      // the corner bloom: a fan of leaves, a big rose on the corner, a smaller one beside it
      const out = Math.atan2(nA[1] + nB[1], nA[0] + nB[0]), R = (0.46 + r() * 0.14) * k;
      for (let j = 0; j < 3; j++) {
        E.push({ t: 'leaf', id: nid(), x: c[0], y: c[1], a: out + (j - 1) * 0.95 + (r() - 0.5) * 0.3, L: (0.26 + r() * 0.12) * k, bend: (r() - 0.5) * 0.9, layer: 1, d0: t0 + 240 + j * 50 });
      }
      rose(c[0] + Math.cos(out) * R * 0.25, c[1] + Math.sin(out) * R * 0.25, R, t0 + 300);
      const side = r() < 0.5 ? dA : dB;
      rose(c[0] + side[0] * R * 1.35, c[1] + side[1] * R * 1.35, R * (0.55 + r() * 0.15), t0 + 430);
    });
    if (this.tick) rose(this.tick === 'l' ? 0 : W, H / 2, (0.2 + r() * 0.06) * k, 560);
    l.els = E;
    l.endEls = null;
  }

  // ---------------------------------------------------------------- drawing (Type Garden)
  strokeRange(B: Backend, P: Pt[], a: number, b: number, col: string, w: number) {
    const n = P.length - 1, ia = a * n, ib = b * n;
    const lerp = (t: number): Pt => { const i = Math.min(n - 1, Math.floor(t)), f = t - i; return [P[i][0] + (P[i+1][0] - P[i][0]) * f, P[i][1] + (P[i+1][1] - P[i][1]) * f]; };
    const pts = [lerp(ia)];
    for (let i = Math.floor(ia) + 1; i < ib; i++) pts.push(P[i]);
    pts.push(lerp(ib));
    if (pts.length >= 2) B.stroke(pts, col, w);
  }
  thorn(B: Backend, P: Pt[], u: number, s: number, S: number, k = 1) {
    const [p, a] = this.at(P, u), d = a + s * 2.3, L = S * 0.045 * k;
    B.stroke([p, [p[0] + Math.cos(d) * L, p[1] + Math.sin(d) * L]], this.cc.rim ?? this.cc.blue, S * 0.022 * k);
  }
  leaf(B: Backend, bx: number, by: number, a: number, L: number, bend: number) {
    if (L < 0.5) return;
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const ax = (u: number): Pt => { const b = Math.sin(Math.PI * u) * bend * 0.15 * L; return [bx + ca * u * L + px * b, by + sa * u * L + py * b]; };
    const hw = (u: number) => L * 0.18 * Math.sin(Math.PI * Math.pow(u, 0.8));
    const N = 12, s1: Pt[] = [], s2: Pt[] = [];
    for (let i = 0; i <= N; i++) { const u = i / N, c = ax(u), w = hw(u); s1.push([c[0] + px * w, c[1] + py * w]); s2.push([c[0] - px * w, c[1] - py * w]); }
    const tip = ax(1), base = ax(0);
    B.fill([base, ...s1.slice(1, N), tip, tip, ...s2.slice(1, N).reverse(), base], this.cc.blue);
    if (this.cc.rim) { const w = Math.max(0.7, L * 0.03); B.stroke([base, ...s1.slice(1, N), tip], this.cc.rim, w); B.stroke([base, ...s2.slice(1, N), tip], this.cc.rim, w); }
    if (L > 6) { const v: Pt[] = []; for (let i = 0; i <= 8; i++) v.push(ax(0.08 + 0.72 * i / 8)); B.stroke(v, this.cc.vein, Math.max(0.8, L * 0.03)); }
  }
  rose(B: Backend, cx: number, cy: number, R: number, rot: number, e: Rose, a: number, tl: [number, number] | null) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const tm = tl ? Math.hypot(tl[0], tl[1]) : 0, ux = tm ? tl![0] / tm : 0, uy = tm ? tl![1] / tm : 0, sq = -0.28 * tm;
    const T = (x: number, y: number, z = 0): Pt => {
      let dx = x * cr - y * sr, dy = x * sr + y * cr;
      if (tm) { const k = (dx * ux + dy * uy) * sq; dx += k * ux + tl![0] * R * z; dy += k * uy + tl![1] * R * z; }
      return [cx + dx, cy + dy];
    };
    // petals, back to front: [cx, cy, rx, ry, angle, depth, edge]
    const P = [
      [0, -0.36, 0.56, 0.54, 0, 0, 0],
      [-0.5, -0.06, 0.6, 0.6, -0.35, 0, 0],
      [0.52, -0.06, 0.6, 0.6, 0.35, 0, 0],
      [-0.42, 0.3, 0.62, 0.48, 0.2, 0.12, 1],
      [0.47, 0.3, 0.62, 0.48, -0.2, 0.12, 1],
      [0.05, 0.42, 0.56, 0.38, 0, 0.14, 0]
    ];
    const ax0 = 0, ay0 = 0.5, lw = Math.max(0.8, R * 0.045), st = 85;
    P.forEach((q, i) => {
      const s = this.spr((a - i * st) / 1000, 8, 14); if (s <= 0.001) return;
      const open = (1 - Math.min(1, s)) * (q[0] < 0 ? 0.5 : -0.5), ang = q[4] + open, ca = Math.cos(ang), sa = Math.sin(ang);
      const pt = (th: number) => {
        const rr = 1 + 0.08 * Math.sin(3 * th + e.ph1 + i) + 0.04 * Math.sin(5 * th + e.ph2);
        const lx = Math.cos(th) * q[2] * rr, ly = Math.sin(th) * q[3] * rr;
        const px = q[0] + lx * ca - ly * sa, py = q[1] + lx * sa + ly * ca;
        return T((ax0 + (px - ax0) * s) * R, (ay0 + (py - ay0) * s) * R, q[5]);
      };
      const pts: Pt[] = []; for (let k = 0; k < 26; k++) pts.push(pt(k / 26 * Math.PI * 2));
      B.fill(pts, this.cc.red);
      if (q[6] && R >= 12 && s > 0.4) {
        const arc: Pt[] = []; for (let k = 0; k <= 14; k++) arc.push(pt(Math.PI * (1.18 + 0.64 * k / 14)));
        this.strokeRange(B, arc, 0, Math.min(1, (s - 0.4) / 0.5), this.cc.line, lw * 0.8);
      }
    });
    const fr = this.eo((a - P.length * st - 80) / 520);
    if (fr > 0 && R > 3) {
      const sp: Pt[] = [], scl: Pt[] = [];
      const turns = R < 20 ? Math.min(e.turns, 1.3) : R < 32 ? e.turns * 0.8 : e.turns;
      for (let i = 0; i <= 70; i++) { const u = i / 70, th = e.ph1 + u * turns * Math.PI * 2, rr = R * (0.08 + 0.57 * u); sp.push(T(Math.cos(th) * rr * 1.05, Math.sin(th) * rr * 0.72 - 0.12 * R, 0.34 - 0.24 * u)); }
      this.strokeRange(B, sp, 0, fr, this.cc.line, lw);
      if (R >= 14) {
        for (let i = 0; i <= 36; i++) { const u = i / 36; scl.push(T((-0.72 + 1.5 * u) * R, 0.36 * R + 0.16 * R * Math.abs(Math.sin(u * Math.PI * 3)), 0.18)); }
        this.strokeRange(B, scl, 0, fr, this.cc.line, lw);
      }
    }
  }
  /** nearest pointer in canvas px (one local cursor here; Type Garden supports many) */
  near(): Pt | null {
    if (!this.pointer) return null;
    const r = this.canvas.getBoundingClientRect();
    const k = this.cssW / (r.width || 1);
    return [(this.pointer[0] - r.left) * k, (this.pointer[1] - r.top) * k];
  }
  faceTurn(e: Rose, x: number, y: number): [number, number] {
    let wx = 0, wy = 0;
    const A = this.nearPt;
    if (A) {
      const dx = A[0] - x, dy = A[1] - y, d = Math.hypot(dx, dy), reach = 300;
      if (d < reach && d > 0.001) {
        const w = 1 - d / reach, s = w * w * (3 - 2 * w) * Math.min(1, d / 40);
        wx = dx / d * s; wy = dy / d * s;
      }
    }
    const c = this.fa[e.id] || [0, 0];
    c[0] += (wx - c[0]) * 0.09; c[1] += (wy - c[1]) * 0.09;
    this.fa[e.id] = c;
    return c;
  }
  private nearPt: Pt | null = null;

  render(B: Backend, now: number, st: St) {
    const S = st.S, L = this.all(), act = L.filter(l => l.dead == null), sp = st.speed || 1;
    this.cc = st.C; this._now = now;
    this.nearPt = st.face ? this.near() : null;
    if (st.face) for (const l of L) {
      let tx = 0, ty = 0;
      const A = l.dead == null && l.ch !== ' ' ? this.nearPt : null;
      if (A) {
        const dx = A[0] - l.x, dy = A[1] - (l.y - S * 0.6), d = Math.hypot(dx, dy), reach = Math.max(260, S * 3.2);
        if (d < reach && d > 1) { const w = 1 - d / reach, s = w * w * (3 - 2 * w); tx = dx / d * s; ty = dy / d * s; }
      }
      const c = l.lean || (l.lean = [0, 0]);
      c[0] += (tx - c[0]) * 0.07; c[1] += (ty - c[1]) * 0.07;
    }
    const f = st.boil ? Math.floor(now / 120) : 0, amp = st.boil ? Math.max(0.8, S * 0.01) : 0;
    const kd = (l: Letter) => l.dead != null ? 1 - this.eo((now - l.dead) / st.wither) : 1;
    const draw = (layer: number) => {
      for (const l of L) {
        if (l.ch === ' ' || !l.els) continue;
        const age = (now - l.birth) * sp, kk = kd(l);
        const each = (e: El) => { if (e.t === 'stem') this.drawStem(B, e, l, age, kk, st, f, amp, layer); else if (e.layer === layer) this.drawEl(B, e, l, age, kk, st, f, amp); };
        l.els.forEach(each);
        if (l.endEls) l.endEls.forEach(each);
        const i = act.indexOf(l), nx = i >= 0 ? act[i + 1] : null;
        if (l.tend && (l.dead != null || !nx || nx.ch === ' ')) {
          let fr = this.eo(((now - l.tb) * sp - 150) / 450);
          if (l.cut != null) fr *= 1 - this.eo((now - l.cut) * sp / 150) * Math.min(0.85, st.recoil / (0.6 * S));
          for (const e of l.tend) this.drawStem(B, e as Stem, l, age, kk, st, f, amp, layer, fr * kk);
        }
      }
    };
    const text = () => { if (!this.hideText) for (const l of L) if (l.ch !== ' ' && !l.frame && l.dead == null) this.text(l); };
    draw(0);
    if (!this.o.textOnTop) text();
    draw(1);
    if (this.o.textOnTop) text();
  }
  wpt(st: St, l: Letter, x: number, y: number): Pt {
    if (l.frame) return [x, y]; // the frame doesn't sway like a letter
    if (l.birth != null && this._now != null) {
      const t = (this._now - l.birth) * (st.speed || 1) / 1000;
      if (t > 0 && t < 2.5) {
        const hh = Math.max(0, (l.y - y) / st.S), dmp = Math.exp(-t * 3.2), dir = (l.id % 2 ? 1 : -1);
        x += st.S * 0.07 * hh * dmp * Math.sin(t * 11) * dir;
        y += st.S * 0.035 * hh * dmp * Math.sin(t * 11 + 1.2);
      }
    }
    if (st.face && l.lean) {
      const hh = Math.min(2.5, Math.max(0, (l.y - y) / st.S)), f = hh * hh * 0.5 + hh * 0.5;
      x += l.lean[0] * st.S * 0.1 * f;
      y += l.lean[1] * st.S * 0.05 * f;
    }
    return [x, y];
  }
  drawStem(B: Backend, e: Stem, l: Letter, age: number, kk: number, st: St, f: number, amp: number, layer: number, frO?: number) {
    const S = st.S, fr = frO != null ? frO : this.eo((age - e.d0) / e.dur) * kk; if (fr <= 0) return;
    const j = this.jit(e.id, f, amp);
    const P = e.pts.map(p => this.wpt(st, l, l.x + p[0] * S + j[0], l.y + p[1] * S + j[1]));
    for (const sg of e.segs) {
      if (sg.layer !== layer) continue;
      const b = Math.min(sg.u1, fr); if (b <= sg.u0) continue;
      const w = S * 0.022 * (e.w || 1) * (st.C.rim ? 1.7 : 1);
      if (st.C.rim) this.strokeRange(B, P, sg.u0, b, st.C.rim, w + Math.max(1.2, w * 0.8));
      this.strokeRange(B, P, sg.u0, b, st.C.blue, w);
    }
    for (const th of e.thorns) if (fr > th.u && this.layerAt(e.segs, th.u) === layer) this.thorn(B, P, th.u, th.s, S, Math.max(1, e.w || 1));
  }
  drawEl(B: Backend, e: Leaf | Rose, l: Letter, age: number, kk: number, st: St, f: number, amp: number) {
    const S = st.S, j = this.jit(e.id, f, amp), wx = (x: number, y: number) => this.wpt(st, l, l.x + x * S + j[0], l.y + y * S + j[1]);
    if (e.t === 'leaf') {
      const sc = this.spr((age - e.d0) / 1000, 7, 15) * kk; if (sc <= 0) return;
      const p = wx(e.x, e.y); this.leaf(B, p[0], p[1], e.a + j[2], e.L * S * sc, e.bend);
    } else {
      const a = age - e.d0; if (a < 0) return;
      if (kk <= 0.001) return;
      const p = wx(e.x, e.y), tl = st.face ? this.faceTurn(e, p[0], p[1]) : null;
      this.rose(B, p[0], p[1], e.R * S * kk, e.rot + j[2] + (tl ? tl[0] * 0.22 : 0), e, a, tl);
    }
  }

  // ---------------------------------------------------------------- the letters themselves
  // drawn from cached sprites carrying the word's CSS glow, so 12 letters cost 12 drawImage calls
  private sprite(ch: string) {
    let sp = this.sprites.get(ch);
    if (sp) return sp;
    const S = this.S, d = this.dpr;
    const pad = Math.max(0, ...this.o.glows.map((gl) => gl.blur * S * 1.3 + Math.abs(gl.y ?? 0) * S));
    const g0 = this.g;
    g0.font = this.font(S);
    const m = g0.measureText(ch);
    const w = m.width + pad * 2;
    const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
    const h = asc + desc + pad * 2;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * d);
    c.height = Math.ceil(h * d);
    const g = c.getContext('2d')!;
    g.scale(d, d);
    g.font = this.font(S);
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const x = w / 2, y = pad + asc;
    for (const gl of this.o.glows) {
      g.save();
      g.shadowColor = gl.color;
      g.shadowBlur = gl.blur * S * d;
      g.shadowOffsetY = (gl.y ?? 0) * S * d;
      // draw the glyph far off-canvas so only its shadow lands here
      g.shadowOffsetX = 10000 * d;
      g.fillStyle = '#000';
      g.fillText(ch, x - 10000, y);
      g.restore();
    }
    g.fillStyle = this.o.palette.text;
    g.fillText(ch, x, y);
    sp = { c, ox: x, oy: y };
    this.sprites.set(ch, sp);
    return sp;
  }

  private text(l: Letter) {
    const sp = this.sprite(l.ch);
    this.g.drawImage(sp.c, l.x - sp.ox, l.y - sp.oy, sp.c.width / this.dpr, sp.c.height / this.dpr);
  }

  private caret(now: number) {
    if (this.o.frozen || this.o.still || this.hideText) return;
    if (this.state === 'idle') return;
    const S = this.S;
    let alpha = 1;
    if (this.state === 'done' && !this.o.caretStays) {
      alpha = 1 - this.eo((now - this.doneAt - 1400) / 400);
      if (alpha <= 0) return;
    }
    const on = now - this.lastKey < 500 || Math.floor(now / 530) % 2 === 0;
    if (!on) return;
    const live = this.letters.filter((l) => l.ch !== ' ' && l.dead == null);
    const last = live[live.length - 1];
    let x: number, y: number;
    if (last) {
      x = last.x + last.tw / 2 + 0.07 * S;
      y = last.y - 0.33 * S;
    } else {
      const first = this.slots.find((s) => s.ch !== ' ');
      if (!first) return;
      x = first.x - first.tw / 2;
      y = first.y - 0.33 * S;
    }
    const h = 0.8 * S, w = Math.max(2, S * 0.03);
    const g = this.g;
    g.globalAlpha = alpha;
    g.fillStyle = this.o.palette.text;
    g.shadowColor = 'rgba(255,255,255,0.8)';
    g.shadowBlur = 10 * this.dpr;
    g.fillRect(x - w / 2, y - h / 2, w, h);
    g.shadowBlur = 0;
    g.globalAlpha = 1;
  }

  /** Draw a frame. `visible` false skips the work (the canvas keeps its last pixels). */
  frame(now: number, visible: boolean): void {
    const typedNow = this.update(now);
    if (!visible) return;
    if (this.o.still && !this.dirty && !typedNow) return;
    this.dirty = false;
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.letters.length && !this.frameL) return;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.render(this.backend(g), now, {
      S: this.S,
      C: this.o.palette,
      boil: !this.o.still,
      recoil: 20,
      speed: 1,
      wither: 260,
      face: !this.o.still && !this.o.frozen,
    });
    this.caret(now);
  }

  /** Force a redraw next frame (layout change, hideText toggle). */
  touch(): void {
    this.dirty = true;
  }

  /** Visible letter count (tests). */
  get count(): number {
    return this.letters.filter((l) => l.ch !== ' ' && l.dead == null).length;
  }
}
