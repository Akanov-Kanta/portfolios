/**
 * Ink Garden: letters that grow sumi-ink plum branches, bamboo and camellias.
 * After Type Garden by Akshat Agarwal (https://type-garden.vercel.app), redrawn in the ukiyo / "Program" style.
 *
 * Framework-free canvas engine, ported from prototypes/ink-garden.html. One instance per canvas:
 *   const ig = createInkGarden({ canvas, input, font, palette: 'scene', demoText: 'NAZAR AKANOV' });
 *   ig.setMode('loop' | 'type'); ig.setActive(visible); ig.text(); ig.destroy();
 * Space cuts (a sword stroke), Backspace drops the camellia heads, Enter clears with a diagonal wipe.
 */

const SENT = String.fromCharCode(0x200b); // kept in the hidden field so Backspace on an empty field still reports
const LIGHT = [0.55, -0.83]; // moonlight from the upper right: rim light lands on the edges facing it
const FW = 800;

// p1/p2: camellia petals, pShade: their hard shadow, blossom: plum petals. bg null = transparent canvas
const PALETTES = {
  night: { bg: '#0B1622', text: '#ECE6D8', shadow: '#03070D', ink: '#03070D', rim: '#5FA8D3', bamboo: '#16283A', leaf: '#16283A', leafRim: '#5FA8D3',
    p1: '#9E1B1B', p2: '#E2401C', pShade: '#4E0B0E', stamen: '#C9A24A', anther: '#F1D27A', blossom: '#ECE6D8', blossomEye: '#9E1B1B', blade: '#F7F3EA', glow: '#5FA8D3' },
  // over the crimson sky of the first shot: transparent, ink branches, rice-paper letters
  scene: { bg: null, wipeBg: '#9E1B1B', text: '#ECE6D8', shadow: '#0B1622', ink: '#0B1622', rim: '#5FA8D3', bamboo: '#16283A', leaf: '#0B1622', leafRim: '#5FA8D3',
    p1: '#ECE6D8', p2: '#C9A24A', pShade: '#5C0D0F', stamen: '#C9A24A', anther: '#F1D27A', blossom: '#ECE6D8', blossomEye: '#0B1622', blade: '#FFFFFF', glow: '#ECE6D8' },
  // over the misty bamboo of the last shot: transparent, letters in ink
  mist: { bg: null, wipeBg: '#ECE6D8', text: '#0B1622', shadow: '#B9C3C9', ink: '#0B1622', rim: null, halo: true, bamboo: '#16283A', leaf: '#16283A', leafRim: null,
    p1: '#9E1B1B', p2: '#E2401C', pShade: '#5C0D0F', stamen: '#C9A24A', anther: '#C9A24A', blossom: '#F2C4BE', blossomEye: '#9E1B1B', blade: '#0B1622', glow: '#9E1B1B', haloCol: '#ECE6D8' },
};

// ---------- math (pure) ----------
const h = n => { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); };
const spr = (t, k = 7, w = 16) => t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * w);
const eo = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
const eio = t => t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function rng(seed) {
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function bez(a, b, c, d, n) {
  const P = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
    P.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]); }
  return P;
}
function at(P, u) {
  const n = P.length, i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1))));
  return [P[i], Math.atan2(P[i+1][1] - P[i-1][1], P[i+1][0] - P[i-1][0])];
}
function jit(id, f, amp) {
  if (!amp) return [0, 0, 0];
  return [(h(id*1.37 + f*7.13)*2 - 1)*amp, (h(id*2.71 + f*3.11)*2 - 1)*amp, (h(id*5.3 + f*1.7)*2 - 1)*0.035];
}
function vine(base, dir, len, amp, waves, ph, bend, n) {
  n = n || 40; const P = [[base[0], base[1]]], step = len / n; let x = base[0], y = base[1];
  for (let i = 1; i <= n; i++) {
    const u = i / n, a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
    x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
  }
  return P;
}
// a stem alternates passing behind (0) and in front of (1) the letters
function weave(r, startLayer) {
  const cuts = []; const nc = 1 + Math.floor(r() * 3);
  for (let i = 0; i < nc; i++) cuts.push(0.15 + r() * 0.7);
  cuts.sort((a, b) => a - b);
  const segs = []; let u0 = 0, layer = startLayer;
  for (const c of cuts) {
    if (c <= u0) continue;
    segs.push({ u0, u1: c, layer });
    if (r() < 0.3) { const gp = 0.02 + r() * 0.03; u0 = Math.min(0.98, c + gp); } else u0 = c;
    layer = 1 - layer;
  }
  segs.push({ u0, u1: 1, layer });
  return segs;
}
function layerAt(segs, u) { for (const s of segs) if (u >= s.u0 && u <= s.u1) return s.layer; return segs[segs.length - 1].layer; }
function sampleRange(P, a, b) {
  const n = P.length - 1, ia = a * n, ib = b * n;
  const lerp = t => { const i = Math.min(n - 1, Math.max(0, Math.floor(t))), f = t - i; return [P[i][0] + (P[i+1][0] - P[i][0]) * f, P[i][1] + (P[i+1][1] - P[i][1]) * f]; };
  const pts = [lerp(ia)], us = [a];
  for (let i = Math.floor(ia) + 1; i < ib; i++) { pts.push(P[i]); us.push(i / n); }
  pts.push(lerp(ib)); us.push(b);
  return { pts, us };
}
const RINGS = [
  { n: 5, d: 0.5, rx: 0.5, ry: 0.43, c: 'p1', off: 0 },
  { n: 5, d: 0.29, rx: 0.37, ry: 0.32, c: 'p2', off: Math.PI / 5 },
  { n: 3, d: 0.12, rx: 0.25, ry: 0.22, c: 'p1', off: 0.5 }
];
function petalPts(px, py, ang, rx, ry, w1, w2, notch) {
  const pts = [], ca = Math.cos(ang), sa = Math.sin(ang);
  for (let k = 0; k < 24; k++) {
    const th = k / 24 * Math.PI * 2;
    let rr = 1 + 0.06 * Math.sin(3 * th + w1) + 0.035 * Math.sin(5 * th + w2);
    if (notch) { const d = Math.atan2(Math.sin(th), Math.cos(th)); rr *= 1 - 0.13 * Math.exp(-d * d / 0.025); }
    const lx = Math.cos(th) * rx * rr, ly = Math.sin(th) * ry * rr;
    pts.push([px + lx * ca - ly * sa, py + lx * sa + ly * ca]);
  }
  return pts;
}

export function createInkGarden(opts) {
  const cv = opts.canvas, g = cv.getContext('2d'), inp = opts.input || null;
  const REDUCE = !!(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const SPEED = REDUCE ? 60 : 1;
  const FONT = `${opts.font || ''}${opts.font ? ',' : ''}"Hiragino Mincho ProN","Yu Mincho",Georgia,serif`;
  const sizeFrac = opts.sizeFrac || 0.28, maxWFrac = opts.maxWFrac || 0.8;
  const onChange = opts.onChange || null;
  let C = PALETTES[opts.palette] || PALETTES.night;

  let W = 0, H = 0, dpr = 1;
  let letters = [], uid = 1, cache = {}, Sd = 0, St = 0, wrapped = false;
  let cx = 0, cy = 0, ctx_ = 0, cty = 0;
  let lastKey = 0, lt = 0, nowG = 0;
  const t0 = performance.now();
  let mx = null, my = null, ptype = 'mouse';
  const fa = {};
  let perch = [], falls = [], slashes = [], petals = [], wipe = null, flash = { t: -1e9, a: 0 };
  const rand = Math.random;
  let kdFlag = false, composing = false, iv = SENT;
  let raf = 0, active = true, dead = false;
  const showCaret = opts.caret !== false;

  // ---------- canvas helpers ----------
  function smooth(p, closed) {
    const n = p.length; if (n < 2) return;
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const s = m(p[n-1], p[0]); g.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const q = m(p[i], p[(i+1) % n]); g.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      g.closePath();
    } else {
      g.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n - 1; i++) { const q = m(p[i], p[i+1]); g.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      g.lineTo(p[n-1][0], p[n-1][1]);
    }
  }
  const knock = () => C.bg || C.haloCol || C.wipeBg || '#0B1622';

  // a tapered sumi stroke: filled outline whose width follows wf(u); dry bristle streaks near the tail; rim light on the moonlit edge
  function brush(P, a, b, wf, col, rim, dry, seed, rimW, halo) {
    if (b - a < 0.002) return;
    const { pts, us } = sampleRange(P, a, b), n = pts.length;
    if (n < 2) return;
    const Lp = [], Rp = [], N = [], Wd = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
      const nx = -ty, ny = tx, w = wf(us[i]) / 2;
      N.push([nx, ny]); Wd.push(w);
      Lp.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rp.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    g.fillStyle = col;
    g.beginPath(); g.moveTo(Lp[0][0], Lp[0][1]);
    for (let i = 1; i < n; i++) g.lineTo(Lp[i][0], Lp[i][1]);
    for (let i = n - 1; i >= 0; i--) g.lineTo(Rp[i][0], Rp[i][1]);
    g.closePath();
    if (halo) { g.strokeStyle = knock(); g.lineWidth = halo; g.lineJoin = 'round'; g.stroke(); }
    g.fill();
    if (a <= 0.001) { g.beginPath(); g.arc(pts[0][0], pts[0][1], Wd[0] * 1.05, 0, Math.PI * 2); g.fill(); }
    if (dry && n > 4) {
      g.save(); g.globalAlpha = 0.6; g.strokeStyle = knock(); g.lineCap = 'round'; g.lineJoin = 'round';
      if (!C.bg) g.globalCompositeOperation = 'destination-out'; // transparent canvas: dry bristles cut through to the scene
      for (const k of [-0.42, 0.18, 0.55]) {
        const start = 0.42 + 0.25 * h(seed * 3.1 + k * 7), stop = 0.92 + 0.08 * h(seed + k);
        let on = false, wsum = 0, cnt = 0; g.beginPath();
        for (let i = 0; i < n; i++) {
          const u = us[i]; if (u < start || u > stop) continue;
          const x = pts[i][0] + N[i][0] * Wd[i] * k, y = pts[i][1] + N[i][1] * Wd[i] * k;
          if (!on) { g.moveTo(x, y); on = true; } else g.lineTo(x, y);
          wsum += Wd[i]; cnt++;
        }
        if (cnt > 1) { g.lineWidth = Math.max(0.5, (wsum / cnt) * 0.22); g.stroke(); }
      }
      g.restore();
    }
    if (rim) {
      g.strokeStyle = rim; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = rimW || 1;
      let run = null, sgn = 0;
      const flush = () => { if (run && run.length > 2) { g.beginPath(); g.moveTo(run[0][0], run[0][1]); for (let k = 1; k < run.length; k++) g.lineTo(run[k][0], run[k][1]); g.stroke(); } run = null; };
      for (let i = 0; i < n; i++) {
        const s = N[i][0] * LIGHT[0] + N[i][1] * LIGHT[1];
        if (Math.abs(s) < 0.3 || Wd[i] < 1.2) { flush(); continue; }
        const sg = s > 0 ? 1 : -1, w = Wd[i] * 0.92;
        if (run && sgn !== sg) flush();
        if (!run) { run = []; sgn = sg; }
        run.push([pts[i][0] + N[i][0] * w * sg, pts[i][1] + N[i][1] * w * sg]);
      }
      flush();
    }
  }

  // ---------- flowers & leaves ----------
  // camellia (tsubaki): three rings of flat petals, each with a hard offset shadow, then a gold stamen crown
  function camellia(x, y, R, rot, e, a, tl) {
    if (R < 1) return;
    const ST = 65, tx = tl ? tl[0] : 0, ty = tl ? tl[1] : 0;
    let idx = 0;
    RINGS.forEach((rg, ri) => {
      const items = [];
      for (let k = 0; k < rg.n; k++, idx++) {
        const s = spr((a - idx * ST) / 1000, 8, 13); if (s <= 0.001) continue;
        const open = (1 - Math.min(1, s)) * 0.7, ang = rot + e.ph1 + rg.off + k * Math.PI * 2 / rg.n + open;
        const par = R * 0.16 * ri;
        const pcx = x + Math.cos(ang) * rg.d * R * s + tx * par, pcy = y + Math.sin(ang) * rg.d * R * s * 0.94 + ty * par;
        items.push({ p: petalPts(pcx, pcy, ang, rg.rx * R * s, rg.ry * R * s, e.ph2 + k, e.ph1 * 2 + k, ri === 0), s, ang, pcx, pcy });
      }
      g.fillStyle = C.pShade;
      for (const it of items) { g.beginPath(); smooth(it.p.map(q => [q[0] + R * 0.05, q[1] + R * 0.075]), true); g.fill(); }
      g.fillStyle = C[rg.c];
      for (const it of items) { g.beginPath(); smooth(it.p, true); g.fill(); }
      if (ri === 0 && R >= 12) { // one ink vein per outer petal, drawn on as it opens
        g.strokeStyle = C.pShade; g.lineWidth = Math.max(0.7, R * 0.022); g.lineCap = 'round';
        for (const it of items) {
          const k = Math.min(1, Math.max(0, (it.s - 0.5) / 0.4)); if (!k) continue;
          const ca = Math.cos(it.ang), sa = Math.sin(it.ang), r0 = -0.05 * R, r1 = r0 + 0.32 * R * k;
          g.beginPath(); g.moveTo(it.pcx + ca * r0, it.pcy + sa * r0); g.quadraticCurveTo(it.pcx + ca * (r0 + r1) / 2 - sa * R * 0.05, it.pcy + sa * (r0 + r1) / 2 + ca * R * 0.05, it.pcx + ca * r1, it.pcy + sa * r1); g.stroke();
        }
      }
    });
    const fr = eo((a - idx * ST - 40) / 480);
    if (fr > 0 && R > 3) {
      const sx = x + tx * R * 0.4, sy = y + ty * R * 0.4, n = 13;
      g.strokeStyle = C.stamen; g.lineWidth = Math.max(0.7, R * 0.032); g.lineCap = 'round';
      g.beginPath();
      const ends = [];
      for (let k = 0; k < n; k++) {
        const an = e.ph1 + k / n * Math.PI * 2, rr = R * (0.17 + 0.11 * h(e.ph2 * 10 + k)) * fr;
        const ex = sx + Math.cos(an) * rr, ey = sy + Math.sin(an) * rr * 0.9 - R * 0.04 * fr;
        g.moveTo(sx, sy); g.lineTo(ex, ey); ends.push([ex, ey]);
      }
      g.stroke();
      g.fillStyle = C.anther;
      for (const p of ends) { g.beginPath(); g.arc(p[0], p[1], Math.max(0.8, R * 0.042) * fr, 0, 7); g.fill(); }
      g.fillStyle = C.stamen; g.beginPath(); g.arc(sx, sy, R * 0.09 * fr, 0, 7); g.fill();
    }
  }
  function plum(x, y, R, rot, s) {
    const r = R * s; if (r < 0.8) return;
    g.fillStyle = C.blossom;
    for (let k = 0; k < 5; k++) { const an = rot + k * Math.PI * 2 / 5; g.beginPath(); g.arc(x + Math.cos(an) * r * 0.52, y + Math.sin(an) * r * 0.52, r * 0.46, 0, 7); g.fill(); }
    g.fillStyle = C.blossomEye; g.beginPath(); g.arc(x, y, r * 0.2, 0, 7); g.fill();
    if (r > 4) {
      g.strokeStyle = C.stamen; g.lineWidth = Math.max(0.5, r * 0.05); g.lineCap = 'round'; g.beginPath();
      const ends = [];
      for (let k = 0; k < 7; k++) { const an = rot + 0.4 + k * 0.9, ex = x + Math.cos(an) * r * 0.46, ey = y + Math.sin(an) * r * 0.46; g.moveTo(x, y); g.lineTo(ex, ey); ends.push([ex, ey]); }
      g.stroke(); g.fillStyle = C.anther;
      for (const p of ends) { g.beginPath(); g.arc(p[0], p[1], Math.max(0.6, r * 0.06), 0, 7); g.fill(); }
    }
  }
  function bud(x, y, r) {
    if (r < 0.6) return;
    g.fillStyle = C.blossomEye; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = C.blossom; g.beginPath(); g.arc(x - r * 0.28, y - r * 0.3, r * 0.38, 0, 7); g.fill();
  }
  // slender bamboo leaf: narrow base, widest near a third, long point; rim light on the moonlit edge, ink midrib
  function leaf(bx, by, a, L, bend, S) {
    if (L < 0.6) return;
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const ax = u => { const b = Math.sin(Math.PI * u) * bend * 0.18 * L; return [bx + ca * u * L + px * b, by + sa * u * L + py * b]; };
    const hw = u => L * 0.1 * Math.sin(Math.PI * Math.pow(u, 0.55));
    const N = 14, s1 = [], s2 = [];
    for (let i = 0; i <= N; i++) { const u = i / N, c = ax(u), w = hw(u); s1.push([c[0] + px * w, c[1] + py * w]); s2.push([c[0] - px * w, c[1] - py * w]); }
    const tip = ax(1), base = ax(0);
    g.fillStyle = C.leaf; g.beginPath(); smooth([base, ...s1.slice(1, N), tip, tip, ...s2.slice(1, N).reverse(), base], true); g.fill();
    if (C.leafRim) {
      const edge = (px * LIGHT[0] + py * LIGHT[1]) > 0 ? s1 : s2;
      g.strokeStyle = C.leafRim; g.lineWidth = Math.max(0.6, S * 0.0055); g.lineCap = 'round'; g.beginPath(); smooth(edge.slice(1, N), false); g.stroke();
    }
    if (L > 8) { const v = []; for (let i = 0; i <= 8; i++) v.push(ax(0.04 + 0.78 * i / 8)); g.strokeStyle = C.ink; g.lineWidth = Math.max(0.6, L * 0.014); g.beginPath(); smooth(v, false); g.stroke(); }
  }
  function petal(x, y, s, rot, col) { // drifting sakura petal with a notch
    const pts = [], ca = Math.cos(rot), sa = Math.sin(rot);
    for (let k = 0; k < 16; k++) { const th = k / 16 * Math.PI * 2, d = Math.atan2(Math.sin(th), Math.cos(th)), rr = 1 - 0.3 * Math.exp(-d * d / 0.05);
      const lx = Math.cos(th) * s * rr, ly = Math.sin(th) * s * 0.58 * rr; pts.push([x + lx * ca - ly * sa, y + lx * sa + ly * ca]); }
    g.fillStyle = col; g.beginPath(); smooth(pts, true); g.fill();
  }

  // ---------- layout ----------
  function resize() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    W = r.width; H = r.height; dpr = d;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    cache = {};
    layout(true);
  }
  function mw(ch) {
    if (cache[ch] != null) return cache[ch];
    g.font = `${FW} 100px ${FONT}`;
    let w = g.measureText(ch).width / 100;
    if (ch === ' ') w *= 1.4;
    return (cache[ch] = w);
  }
  // sets tx/ty/tw on letters; keeps headroom for the garden above and below the type
  function layoutCore(A, W, H, prevWrapped) {
    const maxW = W * maxWFrac, S0 = H * sizeFrac, LH = 2.1;
    const ws = A.map(l => mw(l.ch));
    const words = []; let cur = null;
    A.forEach((l, i) => {
      if (l.ch === ' ') { if (cur) { words.push(cur); cur = null; } words.push({ sp: true, idx: [i] }); }
      else { if (!cur) cur = { idx: [] }; cur.idx.push(i); }
    });
    if (cur) words.push(cur);
    const lineW = (li, S) => { let e = li.length; while (e > 0 && A[li[e-1]].ch === ' ') e--; let w = 0; for (let k = 0; k < e; k++) w += ws[li[k]]; return w * S; };
    const wrap = S => {
      const lines = [[]]; let lw = 0;
      for (const w of words) {
        const ww = w.idx.reduce((s, i) => s + ws[i], 0) * S;
        if (!w.sp && lw > 0 && lw + ww > maxW) { lines.push([]); lw = 0; }
        lines[lines.length - 1].push(...w.idx); lw += ww;
      }
      return lines;
    };
    let lines = [A.map((_, i) => i)];
    const unit = lineW(lines[0], 1);
    let S = unit > 0 ? Math.min(S0, maxW / unit) : S0;
    const multi = words.filter(w => !w.sp).length > 1;
    let wr = multi && (S < H * 0.1 || (prevWrapped && S < H * 0.14) || (opts.wrapWords && multi));
    if (wr) {
      let lo = H * 0.03, hi = H * (opts.wrapWords ? sizeFrac * 0.62 : 0.15);
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2, ls = wrap(mid);
        const ok = ls.every(li => lineW(li, mid) <= maxW) && ls.length * LH * mid <= H * 0.82;
        if (ok) lo = mid; else hi = mid;
      }
      S = lo; lines = wrap(S);
      if (lines.length < 2) wr = false;
    }
    const n = lines.length, lh = LH * S;
    lines.forEach((li, k) => {
      let x = W / 2 - lineW(li, S) / 2;
      const y = H / 2 + (k - (n - 1) / 2) * lh + 0.33 * S;
      li.forEach(i => { const l = A[i], w = ws[i] * S; l.tx = x + w / 2; l.ty = y; l.tw = w; l.line = k; x += w; });
    });
    return { S, wrapped: wr, n };
  }
  function layout(snap) {
    if (!W) return;
    const A = letters.filter(l => !l.dead);
    const res = layoutCore(A, W, H, wrapped);
    wrapped = res.wrapped;
    A.forEach(l => { if (l.x == null) { l.x = l.tx; l.y = l.ty; } });
    const S = res.S, last = A[A.length - 1];
    St = S;
    ctx_ = last ? last.tx + last.tw / 2 + 0.07 * S : W / 2;
    cty = last ? last.ty - 0.33 * S : H / 2;
    if (snap || !Sd) { Sd = S; cx = ctx_; cy = cty; A.forEach(l => { l.x = l.tx; l.y = l.ty; }); }
  }

  // ---------- growth ----------
  function wordParams(ws) {
    const r = rng(ws * 7 + 13), dens = opts.density || 1;
    return { roseP: 0.32 + r() * 0.26, leafy: (0.6 + r() * 0.8) * dens, dens, lean: (r() - 0.5) * 0.6, big: 0.85 + r() * 0.45, curvy: 0.8 + r() * 0.6,
      bridgeP: Math.min(0.95, (0.45 + r() * 0.35) * dens), w: 0.5, bambooP: 0.12 + r() * 0.22, bloom: (0.6 + r() * 0.9) * dens };
  }
  function grow(r, E, nid, p, o) {
    let tip = o.tip || (r() < p.roseP ? 'cam' : r() < 0.4 ? 'fan' : r() < 0.55 ? 'leaf' : 'plum');
    const bamboo = !o.pts && !o.depth && tip !== 'cam' && r() < p.bambooP;
    if (bamboo) tip = 'fan';
    const P = o.pts || vine(o.base, o.dir, o.len, bamboo ? 0.05 : (0.35 + r() * 0.45) * p.curvy, 1 + r() * 1.6, r() * 6.28, (r() - 0.5) * (bamboo ? 0.2 : 1.2), 40);
    const segs = weave(r, o.layer0 != null ? o.layer0 : (r() < 0.5 ? 0 : 1));
    const dur = Math.max(320, (o.len || 0.8) * 620);
    const thorns = [], knots = [], nodes = [];
    if (bamboo) { for (let u = 0.1 + r() * 0.06; u < 0.94; u += 0.15 + r() * 0.05) nodes.push(u); }
    else {
      const nt = Math.floor(r() * 2.6);
      for (let i = 0; i < nt; i++) thorns.push({ u: 0.2 + r() * 0.6, s: r() < 0.5 ? -1 : 1, L: 0.6 + r() * 0.9, bud: r() < 0.55 });
      if (r() < 0.55) knots.push(0.12 + r() * 0.5);
    }
    E.push({ t: 'stem', id: nid(), pts: P, segs, d0: o.d0, dur, w: o.depth ? 0.62 : 1, thorns, knots, nodes, bamboo });
    const nl = bamboo ? 2 + Math.floor(r() * 3) : Math.floor(r() * 1.4 * p.leafy);
    let sd = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < nl; i++) {
      const u = bamboo ? 0.3 + r() * 0.6 : 0.25 + r() * 0.6, [q, a] = at(P, u); sd = -sd;
      E.push({ t: 'leaf', id: nid(), x: q[0], y: q[1], a: a + sd * (0.5 + r() * 0.5), L: (bamboo ? 0.22 + r() * 0.2 : 0.15 + r() * 0.16) * (o.depth ? 0.8 : 1), bend: (r() - 0.5) * 1.2, layer: layerAt(segs, u), d0: o.d0 + dur * u });
    }
    if (!bamboo && !o.noBloom) { // plum blossoms and buds sitting along the branch
      const nb = Math.floor(r() * 2.4 * p.bloom);
      for (let i = 0; i < nb; i++) {
        const u = 0.3 + r() * 0.6, [q, a] = at(P, u), side = r() < 0.5 ? -1 : 1, off = 0.02 + r() * 0.025;
        E.push({ t: 'plum', id: nid(), x: q[0] + Math.cos(a + side * 1.57) * off, y: q[1] + Math.sin(a + side * 1.57) * off, R: (0.042 + r() * 0.035) * p.big * (o.depth ? 0.85 : 1),
          rot: r() * 6.28, layer: layerAt(segs, u), d0: o.d0 + dur * u + 60, bud: r() < 0.35 });
      }
    }
    const [tp, ta] = at(P, 1), td = o.d0 + dur * 0.8, tl = layerAt(segs, 1);
    if (tip === 'cam') {
      const R = (0.12 + r() * 0.13) * p.big * (o.depth ? 0.75 : 1);
      // legibility: a camellia sitting over the letter body mostly goes behind it
      const over = tp[1] > -0.78 && tp[1] < 0.05 && Math.abs(tp[0]) < p.w * 0.5;
      const layer = over ? (r() < 0.22 ? 1 : 0) : (r() < 0.6 ? 1 : tl);
      E.push({ t: 'cam', id: nid(), x: tp[0], y: tp[1], R, rot: (r() - 0.5) * 1.0, ph1: r() * 6.28, ph2: r() * 6.28, layer, d0: td });
      if (r() < 0.2) { const oo = ta + (r() < 0.5 ? 1 : -1) * 1.3; E.push({ t: 'cam', id: nid(), x: tp[0] + Math.cos(oo) * R * 1.4, y: tp[1] + Math.sin(oo) * R * 1.4, R: R * (0.6 + r() * 0.3), rot: (r() - 0.5) * 1.2, ph1: r() * 6.28, ph2: r() * 6.28, layer, d0: td + 120 }); }
    } else if (tip === 'fan') {
      const n = bamboo ? 3 : 2, spread = 0.45 + r() * 0.3;
      for (let j = 0; j < n; j++) E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (j - (n - 1) / 2) * spread, L: 0.22 + r() * 0.18, bend: (j - (n - 1) / 2) * 0.8, layer: tl, d0: td + j * 60 });
    } else if (tip === 'leaf') {
      E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (r() - 0.5) * 0.3, L: 0.18 + r() * 0.16, bend: (r() - 0.5), layer: tl, d0: td });
    } else if (tip === 'plum') {
      const n = 1 + Math.floor(r() * 2.5);
      for (let j = 0; j < n; j++) {
        const an = ta + (r() - 0.5) * 2.4, d = j ? 0.045 + r() * 0.05 : 0;
        E.push({ t: 'plum', id: nid(), x: tp[0] + Math.cos(an) * d, y: tp[1] + Math.sin(an) * d, R: (0.05 + r() * 0.035) * p.big, rot: r() * 6.28, layer: tl, d0: td + j * 90, bud: j > 0 && r() < 0.5 });
      }
    }
    if (!o.depth && r() < 0.35) {
      const u = 0.35 + r() * 0.35, [q, a] = at(P, u);
      grow(r, E, nid, p, { base: q, dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), len: (o.len || 0.8) * (0.35 + r() * 0.2), d0: o.d0 + dur * u, depth: 1, layer0: layerAt(segs, u) });
    }
    return P;
  }
  function gen(l) {
    const r = rng((l.ws ^ Math.imul(l.wi + 1, 2654435761)) + Math.floor(rand() * 1e6));
    const p = wordParams(l.ws), E = []; let k0 = 0; const nid = () => l.id * 100 + (k0++);
    const w = mw(l.ch), inX = () => (r() - 0.5) * w * 0.7; p.w = w;
    const nUp = 1 + (r() < 0.45 * p.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++)
      grow(r, E, nid, p, { base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + p.lean * 0.5 + (r() - 0.5) * 0.7, len: 0.6 + r() * 0.5, d0: 40 + i * 130, tip: l.wi === 0 && i === 0 ? 'cam' : null });
    if (r() < 0.4 * p.dens) grow(r, E, nid, p, { base: [inX(), -0.1 - r() * 0.35], dir: Math.PI / 2 + (r() - 0.5) * 0.8, len: 0.35 + r() * 0.35, d0: 160 });
    if (l.prev && r() < p.bridgeP) { // a branch arching back to the previous letter
      const px = -(mw(l.prev.ch) + w) / 2;
      const a = [inX(), -0.05 - r() * 0.55], b = [px + (r() - 0.5) * 0.25, -0.05 - r() * 0.55];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.4 + r() * 0.4), dx = b[0] - a[0];
      let P = bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
      if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
      grow(r, E, nid, p, { pts: P, len: Math.abs(dx) + Math.abs(bulge), d0: 90, tip: r() < 0.5 ? 'plum' : r() < 0.5 ? 'leaf' : 'cam' });
    }
    if (l.wi === 0) grow(r, E, nid, p, { base: [-w * 0.3, -0.15 - r() * 0.4], dir: Math.PI + (r() - 0.5) * 1.2, len: 0.45 + r() * 0.3, d0: 120, tip: 'plum' });
    l.els = E;
    l.endEls = null;
    // the reaching twig at the end of a word; it recoils when space cuts it
    const T = [], tr = rng(l.id * 977 + Math.floor(rand() * 1e6));
    grow(tr, T, () => l.id * 100 + 90 + T.length, p, { base: [w * 0.25, -0.1 - tr() * 0.45], dir: (tr() - 0.5) * 1.4, len: 0.45 + tr() * 0.25, d0: 0, tip: 'leaf', depth: 1, noBloom: true });
    l.tend = T.filter(e => e.t === 'stem').slice(0, 1);
  }
  function genEnd(l, rel) {
    const r = rng(l.ws + l.wi * 31 + Math.floor(rand() * 1e6)), p = wordParams(l.ws), E = [];
    let k0 = 50; const nid = () => l.id * 100 + (k0++);
    const w = mw(l.ch), n = 1 + Math.floor(r() * 2.5); p.w = w;
    for (let i = 0; i < n; i++) {
      const dir = -Math.PI / 2 + 0.6 + (i - (n - 1) / 2) * 0.9 + (r() - 0.5) * 0.4;
      grow(r, E, nid, p, { base: [(r() - 0.2) * w * 0.6, -r() * 0.5], dir, len: 0.4 + r() * 0.45, d0: rel + 40 + i * 90, depth: 1, tip: i === 0 || r() < 0.5 ? 'cam' : 'plum' });
    }
    l.endEls = E;
  }

  // ---------- pointer lean ----------
  function near() { return mx != null ? [mx, my] : null; }
  function faceTurn(e, x, y) {
    let wx = 0, wy = 0;
    const A = near();
    if (A) {
      const dx = A[0] - x, dy = A[1] - y, d = Math.hypot(dx, dy), reach = 300;
      if (d < reach && d > 0.001) { const w = 1 - d / reach, s = w * w * (3 - 2 * w) * Math.min(1, d / 40); wx = dx / d * s; wy = dy / d * s; }
    }
    const c = fa[e.id] || [0, 0];
    c[0] += (wx - c[0]) * 0.09; c[1] += (wy - c[1]) * 0.09;
    fa[e.id] = c;
    return c;
  }
  // springy wobble right after a letter is born + lean toward the pointer, stronger higher up the stem
  function wpt(st, l, x, y) {
    if (l.birth != null) {
      const t = (nowG - l.birth) * st.speed / 1000;
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

  // ---------- render ----------
  function mainState() { return { S: Sd, boil: !REDUCE, recoil: 20, speed: SPEED, wither: 260, face: true }; }
  function drawStem(e, l, age, kk, st, f, amp, layer, frO) {
    const S = st.S, fr = frO != null ? frO : eo((age - e.d0) / e.dur) * kk; if (fr <= 0) return;
    const j = jit(e.id, f, amp);
    const P = e.pts.map(p => wpt(st, l, l.x + p[0] * S + j[0], l.y + p[1] * S + j[1]));
    const base = S * 0.074 * (e.w || 1), tipW = S * 0.007, ph = e.id * 0.37;
    const wf = u => {
      let w = e.bamboo ? base * 0.66 * (1 - 0.22 * u) : base * Math.pow(1 - u, 0.85) * 0.92 + tipW;
      w *= 1 + 0.13 * Math.sin(u * 17 + ph) + 0.06 * Math.sin(u * 41 + ph * 2);
      return Math.max(0.6, w * Math.min(1, (fr - u) / 0.1 + 0.18)); // pointed growing tip
    };
    const rimW = Math.max(1, S * 0.0085);
    for (const sg of e.segs) {
      if (sg.layer !== layer) continue;
      const b = Math.min(sg.u1, fr); if (b <= sg.u0) continue;
      brush(P, sg.u0, b, wf, e.bamboo ? C.bamboo : C.ink, C.rim, !e.bamboo, e.id, rimW, layer === 1 && C.halo ? Math.max(2, S * 0.022) : 0);
    }
    for (const u of e.knots) if (fr > u + 0.04 && layerAt(e.segs, u) === layer) {
      const [p, a] = at(P, u), w = wf(u) * 0.62;
      g.save(); g.translate(p[0], p[1]); g.rotate(a);
      g.fillStyle = C.ink; g.beginPath(); g.ellipse(0, 0, w * 1.15, w * 1.12, 0, 0, 7); g.fill();
      if (C.rim) { g.strokeStyle = C.rim; g.lineWidth = rimW; g.beginPath(); g.arc(0, 0, w * 1.1, -2.4, -0.9); g.stroke(); }
      g.restore();
    }
    for (const u of e.nodes) if (fr > u && layerAt(e.segs, u) === layer) {
      const [p, a] = at(P, u), w = wf(u) * 0.6, nx = -Math.sin(a), ny = Math.cos(a), tx = Math.cos(a), ty = Math.sin(a);
      g.lineCap = 'round';
      g.strokeStyle = C.ink; g.lineWidth = Math.max(1.2, S * 0.013);
      g.beginPath(); g.moveTo(p[0] + nx * w, p[1] + ny * w); g.lineTo(p[0] - nx * w, p[1] - ny * w); g.stroke();
      if (C.rim) { const o = S * 0.009; g.strokeStyle = C.rim; g.lineWidth = rimW; g.beginPath(); g.moveTo(p[0] + nx * w * 0.8 - tx * o, p[1] + ny * w * 0.8 - ty * o); g.lineTo(p[0] - nx * w * 0.2 - tx * o, p[1] - ny * w * 0.2 - ty * o); g.stroke(); }
    }
    for (const t of e.thorns) if (fr > t.u + 0.03 && layerAt(e.segs, t.u) === layer) { // short ume twigs, some ending in a bud
      const k = eo((fr - t.u) / 0.25); if (k <= 0) continue;
      const [p, a] = at(P, t.u), d = a + t.s * (0.7 + 0.3 * h(t.u * 99)), Lx = S * 0.075 * t.L * k * (e.w || 1);
      const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8, bd = t.s * 0.25 * u * u; pts.push([p[0] + Math.cos(d + bd) * Lx * u, p[1] + Math.sin(d + bd) * Lx * u]); }
      const w0 = S * 0.022 * (e.w || 1);
      brush(pts, 0, 1, u => Math.max(0.5, w0 * (1 - u * 0.85)), C.ink, C.rim, false, 0, rimW);
      if (t.bud && k > 0.85) bud(pts[8][0], pts[8][1], S * 0.016 * (0.5 + 0.5 * (k - 0.85) / 0.15));
    }
  }
  function drawEl(e, l, age, kk, st, f, amp) {
    const S = st.S, j = jit(e.id, f, amp), wx = (x, y) => wpt(st, l, l.x + x * S + j[0], l.y + y * S + j[1]);
    if (e.t === 'leaf') {
      const sc = spr((age - e.d0) / 1000, 7, 15) * kk; if (sc <= 0) return;
      const p = wx(e.x, e.y); leaf(p[0], p[1], e.a + j[2], e.L * S * sc, e.bend, S);
    } else if (e.t === 'cam') {
      if (l.dead) return; // it already fell
      const a = age - e.d0; if (a < 0) return;
      const p = wx(e.x, e.y), tl = st.face ? faceTurn(e, p[0], p[1]) : null;
      if (st.face && a > 700) perch.push({ id: e.id, x: p[0], y: p[1], R: e.R * S });
      camellia(p[0], p[1], e.R * S, e.rot + j[2] + (tl ? tl[0] * 0.22 : 0), e, a, tl);
    } else if (e.t === 'plum') {
      const a = age - e.d0, s = spr(a / 1000, 9, 16) * kk; if (s <= 0) return;
      const p = wx(e.x, e.y);
      if (e.bud) bud(p[0], p[1], e.R * S * s * 0.42); else plum(p[0], p[1], e.R * S, e.rot + j[2] * 3, s);
    }
  }
  function render(st, now, L) {
    const S = st.S, act = L.filter(l => !l.dead);
    nowG = now;
    if (st.face) for (const l of L) {
      let tx = 0, ty = 0;
      const A = !l.dead && l.ch !== ' ' ? near() : null;
      if (A) {
        const dx = A[0] - l.x, dy = A[1] - (l.y - S * 0.6), d = Math.hypot(dx, dy), reach = Math.max(260, S * 3.2);
        if (d < reach && d > 1) { const w = 1 - d / reach, s = w * w * (3 - 2 * w); tx = dx / d * s; ty = dy / d * s; }
      }
      const c = l.lean || (l.lean = [0, 0]);
      c[0] += (tx - c[0]) * 0.07; c[1] += (ty - c[1]) * 0.07;
    }
    const f = st.boil ? Math.floor(now / 120) : 0, amp = st.boil ? Math.max(0.8, S * 0.01) : 0;
    const kd = l => l.dead ? 1 - eo((now - l.dead) / st.wither) : 1;
    const draw = layer => {
      for (const l of L) {
        if (l.ch === ' ' || !l.els) continue;
        const age = (now - l.birth) * st.speed, kk = kd(l);
        const each = e => { if (e.t === 'stem') drawStem(e, l, age, kk, st, f, amp, layer); else if (e.layer === layer) drawEl(e, l, age, kk, st, f, amp); };
        l.els.forEach(each);
        if (l.endEls) l.endEls.forEach(each);
        const i = act.indexOf(l), nx = i >= 0 ? act[i + 1] : null;
        if (l.tend && (l.dead || !nx || nx.ch === ' ')) {
          let fr = eo(((now - l.tb) * st.speed - 150) / 450);
          if (l.cut != null) fr *= 1 - eo((now - l.cut) * st.speed / 150) * Math.min(0.85, st.recoil / (0.6 * S));
          for (const e of l.tend) drawStem(e, l, age, kk, st, f, amp, layer, fr * kk);
        }
      }
    };
    draw(0);
    g.font = `${FW} ${S}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const so = Math.max(1, S * 0.028);
    g.fillStyle = C.shadow; for (const l of L) if (l.ch !== ' ' && !l.dead) g.fillText(l.ch, l.x + so, l.y + so);
    g.fillStyle = C.text; for (const l of L) if (l.ch !== ' ' && !l.dead) g.fillText(l.ch, l.x, l.y);
    draw(1);
  }

  // ---------- effects: falling heads, sword cuts, wipe, petals ----------
  function dropHeads(l, now) {
    if (!l.els || REDUCE) return;
    const st = mainState(), age = (now - l.birth) * st.speed; nowG = now;
    for (const e of [...l.els, ...(l.endEls || [])]) {
      if (e.t !== 'cam' || age - e.d0 < 200) continue;
      const p = wpt(st, l, l.x + e.x * st.S, l.y + e.y * st.S);
      falls.push({ x: p[0], y: p[1], R: e.R * st.S, rot: e.rot, e, a: age - e.d0, vx: (Math.random() - 0.5) * 0.12, vy: -0.04 - Math.random() * 0.12, vr: (Math.random() - 0.5) * 0.007 });
    }
  }
  function spawnSlash(l, now) {
    if (REDUCE) return;
    slashes.push({ l, t0: now, S: Sd, ang: -1.05 + (Math.random() - 0.5) * 0.25 });
    flash = { t: now, a: 0.07 };
  }
  function drawSlashes(now) {
    slashes = slashes.filter(s => now - s.t0 < 420);
    for (const s of slashes) {
      const t = now - s.t0, S = s.S, k = eo(t / 70), al = t < 110 ? 1 : 1 - (t - 110) / 310;
      const x = s.l.x + (s.l.tw || 0) / 2 + 0.12 * S, y = s.l.y - 0.4 * S, L = 0.72 * S;
      const dx = Math.cos(s.ang), dy = Math.sin(s.ang);
      const ax = x - dx * L, ay = y - dy * L, bx = ax + dx * 2 * L * k, by = ay + dy * 2 * L * k;
      g.save(); g.lineCap = 'round';
      g.globalAlpha = Math.max(0, al) * 0.35; g.strokeStyle = C.glow; g.lineWidth = Math.max(4, S * 0.04);
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.globalAlpha = Math.max(0, al); g.strokeStyle = C.blade; g.lineWidth = Math.max(1.4, S * 0.011);
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.restore();
    }
  }
  function clearAll(now) {
    const live = letters.filter(l => !l.dead);
    if (live.length && !REDUCE) { wipe = { t0: now, list: letters, S: Sd }; flash = { t: now, a: 0.16 }; }
    letters = []; layout(); changed();
  }
  const WIPE_MS = 520;
  function drawWipe(now, st) {
    if (!wipe) return;
    const t = (now - wipe.t0) / WIPE_MS;
    if (t > 1.3) { wipe = null; return; }
    const e = eio(Math.min(1, t)), dx = 0.86, dy = 0.51, pad = 80, span = W * dx + H * dy + 2 * pad, front = -pad + e * span;
    const ox = dx * front, oy = dy * front, ang = Math.atan2(dy, dx), B = 4 * (W + H);
    g.save();
    g.translate(ox, oy); g.rotate(ang); g.beginPath(); g.rect(0, -B, B, 2 * B);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clip();
    render(Object.assign({}, st, { S: wipe.S, face: false }), now, wipe.list);
    g.restore();
    if (t < 1.15) { // the blade riding the cut edge
      const al = t < 1 ? 1 : 1 - (t - 1) / 0.15, px = -dy, py = dx;
      g.save(); g.lineCap = 'butt';
      g.globalAlpha = al * 0.35; g.strokeStyle = C.glow; g.lineWidth = 10;
      g.beginPath(); g.moveTo(ox - px * B, oy - py * B); g.lineTo(ox + px * B, oy + py * B); g.stroke();
      g.globalAlpha = al; g.strokeStyle = C.blade; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(ox - px * B, oy - py * B); g.lineTo(ox + px * B, oy + py * B); g.stroke();
      g.restore();
    }
  }
  function drawFalls(dt) {
    const G = 0.0016 * Math.max(0.7, H / 900);
    falls = falls.filter(f => {
      f.vy += G * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      camellia(f.x, f.y, f.R, f.rot, f.e, f.a + 5000, null);
      return f.y - f.R * 1.5 < H;
    });
  }
  function spawnPetals(x, y, now) {
    if (REDUCE) return;
    for (let i = 0; i < 7; i++) {
      let tgt = null;
      if (perch.length && Math.random() < 0.7) { const s = perch.slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)); tgt = s[Math.floor(Math.random() * Math.min(3, s.length))].id; }
      petals.push({ x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 0.3, vy: -0.08 - Math.random() * 0.18, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.008,
        t0: now, tgt, sit: null, s: Math.max(4, Sd * 0.03) * (0.7 + Math.random() * 0.6), seed: Math.random() * 100, col: Math.random() < 0.3 ? C.p2 : C.blossom });
    }
    if (petals.length > 60) petals.splice(0, petals.length - 60);
  }
  function drawPetals(now, dt) {
    const byId = {}; for (const p of perch) byId[p.id] = p;
    petals = petals.filter(p => {
      const t = (now - p.t0) / 1000;
      if (t > 7) return false;
      const tg = p.tgt != null ? byId[p.tgt] : null;
      if (p.sit && tg) { p.x = tg.x + p.sit[0]; p.y = tg.y + p.sit[1]; }
      else if (tg && t > 0.5) {
        const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy);
        p.vx += (dx / (d || 1) * 0.12 - p.vx) * 0.04 * dt / 16; p.vy += (dy / (d || 1) * 0.12 - p.vy) * 0.04 * dt / 16;
        p.x += p.vx * dt + Math.sin(t * 5 + p.seed) * 0.4; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (d < tg.R * 0.5) p.sit = [p.x - tg.x, p.y - tg.y];
      } else {
        p.vy += 0.00012 * dt; p.vx += Math.sin(t * 2 + p.seed) * 0.0005 * dt; p.vx *= 0.995;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      }
      g.save(); g.globalAlpha = t > 6 ? 7 - t : 1;
      petal(p.x, p.y, p.s, p.rot, p.col);
      g.restore();
      return p.y < H + 30;
    });
  }

  // ---------- frame ----------
  function frame() {
    const now = performance.now(), dt = Math.min(64, now - (lt || now)); lt = now;
    demoStep(now);
    const k = 1 - Math.exp(-dt / 80);
    Sd += (St - Sd) * k;
    cx += (ctx_ - cx) * k; cy += (cty - cy) * k;
    for (const l of letters) if (!l.dead && l.tx != null) { l.x += (l.tx - l.x) * k; l.y += (l.ty - l.y) * k; }
    letters = letters.filter(l => !(l.dead && now - l.dead > 300));
    paint(now, dt);
  }
  function paint(now, dt) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (C.bg) { g.fillStyle = C.bg; g.fillRect(0, 0, W, H); } else g.clearRect(0, 0, W, H);
    const st = mainState();
    perch = [];
    render(st, now, letters);
    drawWipe(now, st);
    drawFalls(dt);
    drawPetals(now, dt);
    drawSlashes(now);
    const S = Sd, on = now - lastKey < 500 || Math.floor(now / 530) % 2 === 0, hf = eo((now - t0) / 600);
    if (showCaret && on && hf > 0 && !wipe && (focused || demo.on)) { const hh = 0.8 * S * hf, w = Math.max(2, S * 0.03); g.fillStyle = C.p2 === '#C9A24A' ? '#E2401C' : C.p2; g.fillRect(cx - w / 2, cy - hh / 2, w, hh); }
    const fl = now - flash.t;
    if (fl < 90) { g.globalAlpha = flash.a * (1 - fl / 90); g.fillStyle = C.blade; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  }
  function loop() {
    raf = 0;
    if (dead || !active) return;
    frame();
    raf = requestAnimationFrame(loop);
  }

  // ---------- typing ----------
  const changed = () => { if (onChange) onChange(text()); };
  function live() { return letters.filter(l => !l.dead); }
  function text() { return live().map(l => l.ch).join('').trim(); }
  function add(ch, now) {
    const A = live(), last = A[A.length - 1];
    if (ch === ' ') {
      if (last && last.ch !== ' ') { last.cut = now; genEnd(last, (now - last.birth) * SPEED); spawnSlash(last, now); }
      letters.push({ ch: ' ', id: uid++, birth: now, els: [] });
      layout(); changed(); return;
    }
    const same = last && last.ch !== ' ';
    const l = { ch, id: uid++, birth: now, tb: now, ws: same ? last.ws : Math.floor(rand() * 1e9), wi: same ? last.wi + 1 : 0, prev: same ? last : null };
    gen(l);
    letters.push(l);
    layout(); changed();
  }
  function wither(now) {
    const A = live(), last = A[A.length - 1];
    if (!last) return;
    dropHeads(last, now);
    last.dead = now;
    const pv = A[A.length - 2];
    if (pv && pv.ch !== ' ') { pv.cut = null; pv.endEls = null; pv.tb = now; }
    layout(); changed();
  }
  function mark() { lastKey = performance.now(); kdFlag = true; setTimeout(() => { kdFlag = false; }, 0); }
  const maxLen = opts.maxLength || 140;
  function key(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const printable = e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter';
    if (!printable) return;
    if (demo.on) setMode('type');
    const now = performance.now();
    if (e.key === 'Backspace') { e.preventDefault(); mark(); wither(now); return; }
    if (e.key === 'Enter') { e.preventDefault(); mark(); if (opts.onEnter) opts.onEnter(text()); else clearAll(now); return; }
    e.preventDefault(); mark();
    if (live().length < maxLen) add(e.key, now);
  }
  // phone keyboards often skip real key events and write into the field instead: mirror the field and apply the difference
  function inputDiff(el) {
    const S = SENT;
    if (kdFlag) { iv = composing ? el.value : S; if (!composing) el.value = S; return; }
    if (demo.on) setMode('type');
    const old = iv == null ? S : iv, cur = el.value;
    let p = 0; while (p < old.length && p < cur.length && old[p] === cur[p]) p++;
    let dels = old.length - p;
    if (p === 0 && old[0] === S && old.length > 1) dels -= 1; // the sentinel is not a letter
    const now = performance.now(); lastKey = now;
    for (let i = 0; i < dels; i++) wither(now);
    for (const ch of cur.slice(p)) {
      if (ch === S) continue;
      if (ch.charCodeAt(0) === 10) clearAll(now); else if (live().length < maxLen) add(ch, now);
    }
    if (composing) iv = cur; else { el.value = S; iv = S; }
  }

  // ---------- loop (auto-typing) ----------
  const demo = { on: false, text: (opts.demoText || 'NAZAR AKANOV'), i: 0, phase: 'type', next: 0, cycle: 0 };
  function demoStep(now) {
    if (!demo.on || now < demo.next) return;
    switch (demo.phase) {
      case 'type':
        if (demo.i < demo.text.length) { const ch = demo.text[demo.i++]; add(ch, now); lastKey = now; demo.next = now + (ch === ' ' ? 360 : 140 + Math.random() * 90); }
        else { demo.phase = 'hold'; demo.next = now + (REDUCE ? 1e9 : opts.hold || 6500); }
        break;
      case 'hold': demo.phase = demo.cycle % 2 ? 'wipe' : 'drop'; demo.next = now; break;
      case 'drop':
        if (live().length) { wither(now); lastKey = now; demo.next = now + 105; }
        else { demo.phase = 'rest'; demo.next = now + 1100; }
        break;
      case 'wipe': clearAll(now); demo.phase = 'rest'; demo.next = now + 1000; break;
      case 'rest': demo.i = 0; demo.cycle++; demo.phase = 'type'; demo.next = now; break;
    }
  }
  function setMode(m) {
    const lp = m === 'loop';
    if (lp !== demo.on || lp) {
      demo.on = lp; demo.i = 0; demo.cycle = 0; demo.phase = 'type'; demo.next = performance.now() + (opts.startDelay || 300);
      letters = []; falls = []; wipe = null; layout(); changed();
    }
  }
  // reduced motion: lay the whole phrase down at once, fully grown
  function seedStatic(str) {
    const now = performance.now() - 20000;
    for (const ch of str) add(ch, now);
  }

  // ---------- wiring ----------
  let focused = false;
  const onResize = () => resize();
  const rel = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onMove = e => { const p = rel(e); mx = p[0]; my = p[1]; };
  const onLeave = () => { mx = null; };
  const onDown = e => {
    ptype = e.pointerType || 'mouse';
    if (!opts.interactive) return;
    const p = rel(e); spawnPetals(p[0], p[1], performance.now());
    if (ptype === 'mouse' && inp) { e.preventDefault(); inp.focus({ preventScroll: true }); }
  };
  const onClick = () => { if (opts.interactive && ptype !== 'mouse' && inp) inp.focus({ preventScroll: true }); };
  const onInput = e => inputDiff(e.target);
  const onCS = () => { composing = true; };
  const onCE = () => { composing = false; setTimeout(() => { if (!composing && inp) inputDiff(inp); }, 0); };
  const onFocus = () => { focused = true; if (demo.on) setMode('type'); if (opts.onFocusChange) opts.onFocusChange(true); };
  const onBlur = () => { focused = false; if (opts.onFocusChange) opts.onFocusChange(false); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;

  if (ro) ro.observe(cv); else window.addEventListener('resize', onResize);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerleave', onLeave);
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('click', onClick);
  if (inp && opts.interactive) {
    inp.value = SENT;
    inp.addEventListener('keydown', key);
    inp.addEventListener('input', onInput);
    inp.addEventListener('compositionstart', onCS);
    inp.addEventListener('compositionend', onCE);
    inp.addEventListener('focus', onFocus);
    inp.addEventListener('blur', onBlur);
  }
  resize();
  const fontReady = document.fonts ? document.fonts.load(`${FW} 100px ${FONT}`).catch(() => {}) : Promise.resolve();
  fontReady.then(() => {
    if (dead) return;
    cache = {}; layout(true);
    if (REDUCE && opts.demoText && opts.mode === 'loop') seedStatic(opts.demoText);
    else if (opts.mode === 'loop') setMode('loop');
  });
  raf = requestAnimationFrame(loop);

  return {
    setMode,
    text,
    clear() { clearAll(performance.now()); },
    focus() { if (inp) inp.focus({ preventScroll: true }); },
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on && !raf && !dead) { lt = performance.now(); raf = requestAnimationFrame(loop); }
    },
    destroy() {
      dead = true; if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerleave', onLeave);
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('click', onClick);
      if (inp) {
        inp.removeEventListener('keydown', key);
        inp.removeEventListener('input', onInput);
        inp.removeEventListener('compositionstart', onCS);
        inp.removeEventListener('compositionend', onCE);
        inp.removeEventListener('focus', onFocus);
        inp.removeEventListener('blur', onBlur);
      }
    },
  };
}
