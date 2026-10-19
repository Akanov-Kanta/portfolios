// CRT footage renderer. WebGL path: draws a rounded, slightly curved CRT screen
// inside the viewport (the dark housing around it is drawn too), cover-crops
// the 1152x648 frames into it, cross-blends adjacent frames for sub-frame
// smooth scrubbing, and adds the broadcast look: barrel distortion, RGB split
// (radial + scroll velocity + glitch), light-dot halftone, scanlines, aperture
// mask, rolling refresh band, channel-switch static, and a power on/off
// collapse. Falls back to a plain 2D canvas.

export type ScreenRect = { x: number; y: number; w: number; h: number; r: number };

export type RenderState = {
  a: ImageBitmap | null;
  aId: number;
  b: ImageBitmap | null;
  bId: number;
  mix: number;
  time: number;
  glitch: number;
  shift: number;
  exposure: number;
  flash: number;
  zoom: number;
  focusX: number;
  focusY: number;
  power: number;
  halftone: number;
  noise: number;
  motion: number;
};

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;
uniform vec2 uImg;
uniform vec4 uScreen;
uniform float uRadius;
uniform float uDpr;
uniform float uTime;
uniform float uGlitch;
uniform float uShift;
uniform float uExposure;
uniform float uFlash;
uniform float uZoom;
uniform vec2 uFocus;
uniform float uPower;
uniform float uHalftone;
uniform float uNoise;
uniform float uBarrel;
uniform float uMotion;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec3 sampleMix(vec2 uv) {
  return mix(texture2D(uA, uv).rgb, texture2D(uB, uv).rgb, uMix);
}

// screen-local coords (-1..1, y up) -> texture uv, cover fit with zoom + focus
vec2 cover(vec2 q) {
  vec2 uv = q * 0.5 + 0.5;
  float rs = uScreen.z / uScreen.w;
  float ri = uImg.x / uImg.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  scale /= uZoom;
  vec2 offset = (1.0 - scale) * uFocus;
  vec2 p = uv * scale + offset;
  return vec2(p.x, 1.0 - p.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 c = uScreen.xy + uScreen.zw * 0.5;
  vec2 hs = uScreen.zw * 0.5;

  // power: the picture collapses to a horizontal line, then to a dot
  float off = 1.0 - uPower;
  float sy = mix(1.0, 0.004, smoothstep(0.0, 0.5, off));
  float sx = mix(1.0, 0.01, smoothstep(0.45, 0.85, off));
  vec2 hp = max(hs * vec2(sx, sy), vec2(1.2 * uDpr));
  vec2 d = frag - c;
  float rad = min(uRadius, min(hp.x, hp.y));
  float sd = sdRound(d, hp, rad);
  float inside = 1.0 - smoothstep(-uDpr, uDpr, sd);

  vec2 q = d / hp;
  float g = uGlitch;

  // horizontal slice tearing on cuts / channel switches
  float tick = floor(uTime * 24.0);
  float row = floor((q.y * 0.5 + 0.5) * 22.0);
  float n = hash(vec2(row, tick));
  float slice = step(1.0 - 0.6 * g, n) * (hash(vec2(row + 3.1, tick)) - 0.5);
  q.x += slice * 0.32 * g;
  q.y += (hash(vec2(tick, 9.0)) - 0.5) * 0.02 * g;

  // barrel (bulging glass)
  float r2 = dot(q, q);
  vec2 qb = q * (1.0 + uBarrel * r2) / (1.0 + uBarrel);
  vec2 st = cover(qb);

  // RGB split: radial convergence error + scroll velocity + glitch
  vec2 ca = qb * (0.0012 + 0.0032 * r2) + vec2(uShift * 0.007 + g * 0.02, 0.0);
  ca.y = -ca.y;
  vec3 col;
  col.r = sampleMix(st + ca).r;
  col.g = sampleMix(st).g;
  col.b = sampleMix(st - ca).b;

  // grade: exposure + gentle S-curve, lifted cold blacks
  col *= uExposure;
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.22);

  // light-dot halftone in screen space (bright areas = bigger dots of light)
  float cell = 4.0 * uDpr;
  vec2 hpos = mat2(0.7071, -0.7071, 0.7071, 0.7071) * frag / cell;
  vec2 f = fract(hpos) - 0.5;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float rdot = 0.18 + 0.52 * sqrt(clamp(lum, 0.0, 1.0));
  float dotm = smoothstep(rdot + 0.1, rdot - 0.1, length(f));
  col = mix(col, col * (0.25 + dotm * 1.05), uHalftone);

  // scanlines (3 css px period) + aperture-grille triads
  float sl = 0.5 + 0.5 * cos(6.28318 * frag.y / (3.0 * uDpr));
  col *= (0.78 + 0.22 * sl) * 1.12;
  float m = mod(floor(frag.x / max(1.0, floor(uDpr))), 3.0);
  vec3 mask = m < 1.0 ? vec3(1.0, 0.86, 0.86) : (m < 2.0 ? vec3(0.86, 1.0, 0.86) : vec3(0.86, 0.86, 1.0));
  col *= mix(vec3(1.0), mask, 0.22) * 1.06;

  // rolling refresh band + mains flicker
  float yy = q.y * 0.5 + 0.5;
  float band = exp(-pow((fract(yy * 0.7 - uTime * 0.05) - 0.5) * 10.0, 2.0));
  col += col * band * 0.07 * uMotion + band * 0.008;
  col *= 1.0 - 0.012 * uMotion * sin(uTime * 377.0);

  // channel-switch static
  float sn = hash(floor(frag / (1.5 * uDpr)) + fract(uTime * 13.7) * 91.0);
  col = mix(col, vec3(sn) * vec3(0.92, 0.96, 1.0), clamp(uNoise, 0.0, 1.0) * 0.9);

  // inner bezel shadow + vignette + faint glass reflection
  float edge = smoothstep(0.0, 64.0 * uDpr, -sd);
  col *= mix(0.4, 1.0, edge);
  col *= 1.0 - 0.3 * smoothstep(0.35, 1.7, r2);
  float refl = smoothstep(1.3, 0.0, length((q - vec2(-0.55, 0.7)) * vec2(0.55, 1.1)));
  col += vec3(0.8, 0.9, 1.0) * refl * 0.03;

  // grain
  float grain = hash(frag + fract(uTime * 7.13) * 100.0) - 0.5;
  col += grain * (0.05 + 0.08 * g);

  // power: the beam brightens as it collapses, then the dot fades out
  col = mix(col, vec3(1.0, 0.99, 1.02) * 1.5, smoothstep(0.12, 0.55, off));
  col = mix(col, vec3(1.0, 0.97, 0.95), uFlash);

  // housing around the tube: near-black, a thin rim catching light, screen glow spill
  float sdf = sdRound(d, hs, uRadius);
  vec3 housing = vec3(0.010, 0.012, 0.015);
  float rim = 1.0 - smoothstep(0.0, 1.6 * uDpr, abs(sdf - 2.5 * uDpr));
  housing += vec3(0.11, 0.12, 0.14) * rim * mix(0.5, 1.0, uPower);
  housing += vec3(0.55, 0.7, 0.9) * exp(-max(sdf, 0.0) / (14.0 * uDpr)) * 0.04 * uPower;

  // the dead glass of the tube, seen while the picture collapses / after power-off
  vec2 qf = d / hs;
  vec3 glass = vec3(0.026, 0.030, 0.033);
  glass *= 1.0 - 0.5 * smoothstep(0.3, 1.8, dot(qf, qf));
  glass += vec3(0.6, 0.7, 0.8) * 0.035 * smoothstep(1.2, 0.0, length((qf - vec2(-0.5, 0.62)) * vec2(0.5, 1.2)));
  glass *= mix(0.55, 1.0, smoothstep(0.0, 40.0 * uDpr, -sdf));
  float insideF = 1.0 - smoothstep(-uDpr, uDpr, sdf);
  vec3 base = mix(housing, glass, insideF);

  // beam afterglow halo around the collapsing line / dot
  float beam = smoothstep(0.15, 0.6, off) * (1.0 - smoothstep(0.86, 1.0, off));
  base += vec3(0.75, 0.85, 1.0) * exp(-max(sd, 0.0) / (26.0 * uDpr)) * 0.55 * beam;

  // the last dot of light fades into the dead glass
  gl_FragColor = vec4(mix(base, col, inside * (1.0 - smoothstep(0.86, 1.0, off))), 1.0);
}`;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private ctx2d: CanvasRenderingContext2D | null = null;
  private texA: WebGLTexture | null = null;
  private texB: WebGLTexture | null = null;
  private loadedA = -1;
  private loadedB = -1;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private imgW: number;
  private imgH: number;
  private dpr = 1;
  private screen: ScreenRect = { x: 0, y: 0, w: 1, h: 1, r: 0 };
  hasFrame = false;

  constructor(canvas: HTMLCanvasElement, imgW: number, imgH: number) {
    this.canvas = canvas;
    this.imgW = imgW;
    this.imgH = imgH;
    try {
      this.gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    } catch {
      this.gl = null;
    }
    if (this.gl && !this.setupGL(this.gl)) this.gl = null;
    if (!this.gl) this.ctx2d = canvas.getContext('2d');
    this.resize();
  }

  get mode() {
    return this.gl ? 'webgl' : '2d';
  }

  private setupGL(gl: WebGLRenderingContext) {
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const p = gl.createProgram()!;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    gl.useProgram(p);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const name of [
      'uA', 'uB', 'uMix', 'uImg', 'uScreen', 'uRadius', 'uDpr', 'uTime', 'uGlitch', 'uShift', 'uExposure', 'uFlash',
      'uZoom', 'uFocus', 'uPower', 'uHalftone', 'uNoise', 'uBarrel', 'uMotion',
    ]) {
      this.u[name] = gl.getUniformLocation(p, name);
    }
    const mk = (unit: number) => {
      const t = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([4, 5, 7]));
      return t;
    };
    this.texA = mk(0);
    this.texB = mk(1);
    gl.uniform1i(this.u.uA, 0);
    gl.uniform1i(this.u.uB, 1);
    gl.uniform2f(this.u.uImg, this.imgW, this.imgH);
    return true;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 2 : 1.5);
    const w = Math.round(window.innerWidth * this.dpr);
    const h = Math.round(window.innerHeight * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (this.gl) {
      this.gl.viewport(0, 0, w, h);
      this.gl.uniform1f(this.u.uDpr, this.dpr);
      this.gl.uniform1f(this.u.uBarrel, window.innerWidth < 760 ? 0.045 : 0.06);
    }
    this.setScreen(this.screen);
  }

  /** Screen rectangle in CSS px (top-left origin). */
  setScreen(r: ScreenRect) {
    this.screen = r;
    if (!this.gl) return;
    const d = this.dpr;
    const H = this.canvas.height;
    this.gl.uniform4f(this.u.uScreen, r.x * d, H - (r.y + r.h) * d, r.w * d, r.h * d);
    this.gl.uniform1f(this.u.uRadius, r.r * d);
  }

  private upload(unit: number, tex: WebGLTexture, bmp: ImageBitmap) {
    const gl = this.gl!;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bmp);
  }

  render(s: RenderState) {
    if (this.gl) return this.renderGL(this.gl, s);
    this.render2D(s);
  }

  private renderGL(gl: WebGLRenderingContext, s: RenderState) {
    if (s.a && s.aId !== this.loadedA) {
      this.upload(0, this.texA!, s.a);
      this.loadedA = s.aId;
      this.hasFrame = true;
    }
    const b = s.b ?? s.a;
    const bId = s.b ? s.bId : s.aId;
    if (b && bId !== this.loadedB) {
      this.upload(1, this.texB!, b);
      this.loadedB = bId;
    }
    gl.uniform1f(this.u.uMix, s.b ? s.mix : 0);
    gl.uniform1f(this.u.uTime, s.time);
    gl.uniform1f(this.u.uGlitch, s.glitch);
    gl.uniform1f(this.u.uShift, s.shift);
    gl.uniform1f(this.u.uExposure, s.exposure);
    gl.uniform1f(this.u.uFlash, s.flash);
    gl.uniform1f(this.u.uZoom, s.zoom);
    gl.uniform2f(this.u.uFocus, s.focusX, s.focusY);
    gl.uniform1f(this.u.uPower, s.power);
    gl.uniform1f(this.u.uHalftone, s.halftone);
    gl.uniform1f(this.u.uNoise, s.noise);
    gl.uniform1f(this.u.uMotion, s.motion);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private render2D(s: RenderState) {
    const ctx = this.ctx2d;
    if (!ctx) return;
    const { width: W, height: H } = this.canvas;
    const d = this.dpr;
    ctx.fillStyle = '#030405';
    ctx.fillRect(0, 0, W, H);
    if (!s.a) return;
    this.hasFrame = true;
    const r = this.screen;
    const sx = r.x * d;
    const sy = r.y * d;
    const sw = r.w * d;
    const sh = r.h * d * Math.max(0.004, Math.min(1, s.power * 2));
    const oy = sy + (r.h * d - sh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(sx, oy, sw, sh, Math.min(r.r * d, sh / 2));
    ctx.clip();
    const scale = Math.max(sw / this.imgW, (r.h * d) / this.imgH) * s.zoom;
    const dw = this.imgW * scale;
    const dh = this.imgH * scale;
    const dx = sx + (sw - dw) * s.focusX;
    const dy = sy + (r.h * d - dh) * (1 - s.focusY);
    ctx.filter = `brightness(${s.exposure})`;
    ctx.drawImage(s.a, dx, dy, dw, dh);
    if (s.b && s.mix > 0.01) {
      ctx.globalAlpha = s.mix;
      ctx.drawImage(s.b, dx, dy, dw, dh);
      ctx.globalAlpha = 1;
    }
    ctx.filter = 'none';
    if (s.flash > 0.01) {
      ctx.fillStyle = `rgba(255,248,244,${s.flash})`;
      ctx.fillRect(sx, oy, sw, sh);
    }
    ctx.restore();
  }
}
