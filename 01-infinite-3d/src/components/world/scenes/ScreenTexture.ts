import { CanvasTexture, SRGBColorSpace, LinearFilter } from "three";

/**
 * Procedural "code editor" texture: coloured monospace tokens scrolling upward.
 * Redrawn at ~8 fps from the owner's useFrame. No assets.
 */
export interface ScreenTex {
  texture: CanvasTexture;
  tick: (dt: number) => void;
  dispose: () => void;
}

const PALETTE = ["#6cf2ff", "#7c8cff", "#e8e9f0", "#8b90a8", "#ffb86b", "#7ee787"];
const WORDS = ["const", "await", "return", "useFrame", "scroll", "lenis", "camera", "=>", "frame.t", "if (", "}", "curve", "shader", "uniform", "vec3", "float", "export", "import", "map(", "stations", "clone", "mix(", "sin(", "dt", "0.85", "for (", "async", "render", "loop", "seam"];

export function createScreenTexture(title: string, w = 512, h = 320, seed = 1): ScreenTex {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  let rnd = seed * 9301 + 49297;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280), rnd / 233280);
  const LINE = 18;
  const lines: { tokens: { w: string; c: string }[]; indent: number }[] = [];
  const mkLine = () => {
    const n = 1 + Math.floor(rand() * 6);
    const tokens = Array.from({ length: n }, () => ({ w: WORDS[Math.floor(rand() * WORDS.length)], c: PALETTE[Math.floor(rand() * PALETTE.length)] }));
    return { tokens, indent: Math.floor(rand() * 4) };
  };
  for (let i = 0; i < 40; i++) lines.push(mkLine());
  let offset = 0, acc = 0, cursor = 0;
  // token widths in the (fixed, system) 13px mono font: measured once per word, not per redraw
  const widths = new Map<string, number>();
  const measure = (s: string) => {
    let v = widths.get(s);
    if (v === undefined) widths.set(s, (v = ctx.measureText(s).width));
    return v;
  };

  const draw = () => {
    ctx.fillStyle = "#0b0e18";
    ctx.fillRect(0, 0, w, h);
    // title bar
    ctx.fillStyle = "#141a2b";
    ctx.fillRect(0, 0, w, 24);
    ctx.font = "12px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "#8b90a8";
    ctx.fillText(title, 12, 16);
    ctx.font = "13px ui-monospace, Menlo, monospace";
    for (let i = 0; i < 18; i++) {
      const l = lines[(i + Math.floor(offset)) % lines.length];
      const y = 44 + i * LINE - (offset % 1) * LINE;
      ctx.fillStyle = "#3a4158";
      ctx.fillText(String(i + Math.floor(offset) + 1).padStart(3, " "), 8, y);
      let x = 44 + l.indent * 14;
      for (const t of l.tokens) {
        ctx.fillStyle = t.c;
        ctx.fillText(t.w, x, y);
        x += measure(t.w) + 9;
      }
    }
    // cursor
    cursor += 1;
    if (cursor % 2 === 0) {
      ctx.fillStyle = "#6cf2ff";
      ctx.fillRect(44, h - 30, 7, 14);
    }
    texture.needsUpdate = true;
  };
  draw();
  return {
    texture,
    tick(dt) {
      acc += dt;
      if (acc < 0.12) return;
      acc = 0;
      offset += 0.5;
      if (offset > lines.length * 4) offset = 0;
      draw();
    },
    dispose() {
      texture.dispose();
    },
  };
}

/** Static "project card" texture used when no screenshot is provided. */
export function createPlaceholderShot(name: string, tagline: string, w = 640, h = 400): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#111629");
  g.addColorStop(1, "#0a0b10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(124,140,255,0.25)";
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#e8e9f0";
  ctx.font = "600 44px system-ui, sans-serif";
  ctx.fillText(name, 40, 190);
  ctx.fillStyle = "#8b90a8";
  ctx.font = "20px ui-monospace, Menlo, monospace";
  ctx.fillText(tagline, 40, 230);
  ctx.fillStyle = "#6cf2ff";
  ctx.fillRect(40, 250, 120, 3);
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}
