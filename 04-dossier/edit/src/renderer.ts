// Fullscreen footage renderer. WebGL path: cover-crops the 960x572 frames, cross-blends adjacent frames
// for sub-frame smooth scrubbing, and adds the edit's look, strictly grayscale: luminance only,
// highlights crushed to #F0F0F0, true black floor, slice glitch + jitter + a one-frame flash on cuts,
// a luminance ghost on fast scrolls, fine grain and a vignette on the dark shots. Falls back to 2D.

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
  fade: number;
  flash: number;
  zoom: number;
  focusX: number;
  focusY: number;
  vignette: number;
};

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D uA;
uniform sampler2D uB;
uniform float uMix;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uTime;
uniform float uGlitch;
uniform float uShift;
uniform float uExposure;
uniform float uFade;
uniform float uFlash;
uniform float uZoom;
uniform vec2 uFocus;
uniform float uVig;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  scale /= uZoom;
  vec2 offset = (1.0 - scale) * uFocus;
  vec2 p = uv * scale + offset;
  return vec2(p.x, 1.0 - p.y);
}

float lum(vec2 uv) {
  vec3 c = mix(texture2D(uA, uv).rgb, texture2D(uB, uv).rgb, uMix);
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec2 uv = vUv;
  float g = uGlitch;

  // horizontal slice displacement on cuts (the edit's RGB-less glitch: 5-20 px for 2-3 frames)
  float tick = floor(uTime * 24.0);
  float row = floor(uv.y * 18.0);
  float n = hash(vec2(row, tick));
  float slice = step(1.0 - 0.55 * g, n) * (hash(vec2(row + 3.1, tick)) - 0.5);
  uv.x += slice * 0.12 * g;
  // camera shake on hits
  uv += (vec2(hash(vec2(tick, 9.0)), hash(vec2(tick, 4.0))) - 0.5) * 0.012 * g;

  vec2 st = cover(uv);
  float l = lum(st);
  // luminance ghost on fast scrolls (no colour fringes: the edit has zero chroma)
  float ghost = lum(st + vec2(0.004 + 0.012 * uShift, 0.0));
  l = mix(l, max(l, ghost), clamp(uShift * 0.5 + g * 0.4, 0.0, 0.6));

  // grade: exposure, gentle S-curve, true black floor, highlights crushed to #F0F0F0
  l *= uExposure;
  l = mix(l, l * l * (3.0 - 2.0 * l), 0.25);

  // vignette (dark shots only)
  vec2 q = vUv - 0.5;
  q.x *= uRes.x / uRes.y * 0.75;
  float vig = smoothstep(0.95, 0.2, length(q));
  l *= mix(1.0, mix(0.4, 1.0, vig), uVig);

  // fine grain, shows on mid-tones, leaves flat black alone
  float grain = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 100.0) - 0.5;
  l += grain * (0.05 + 0.06 * g) * smoothstep(0.0, 0.12, l);

  l = mix(l, 0.94, uFlash);
  l *= 1.0 - uFade;
  l = clamp(l, 0.0, 0.94);
  gl_FragColor = vec4(vec3(l), 1.0);
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
    for (const name of ['uA', 'uB', 'uMix', 'uRes', 'uImg', 'uTime', 'uGlitch', 'uShift', 'uExposure', 'uFade', 'uFlash', 'uZoom', 'uFocus', 'uVig']) {
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
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
    this.dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 2 : 1.5);
    const w = Math.round(window.innerWidth * this.dpr);
    const h = Math.round(window.innerHeight * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (this.gl) {
      this.gl.viewport(0, 0, w, h);
      this.gl.uniform2f(this.u.uRes, w, h);
    }
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
    gl.uniform1f(this.u.uFade, s.fade);
    gl.uniform1f(this.u.uFlash, s.flash);
    gl.uniform1f(this.u.uZoom, s.zoom);
    gl.uniform2f(this.u.uFocus, s.focusX, s.focusY);
    gl.uniform1f(this.u.uVig, s.vignette);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private render2D(s: RenderState) {
    const ctx = this.ctx2d;
    if (!ctx) return;
    const { width: W, height: H } = this.canvas;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (!s.a) return;
    this.hasFrame = true;
    const scale = Math.max(W / this.imgW, H / this.imgH) * s.zoom;
    const dw = this.imgW * scale;
    const dh = this.imgH * scale;
    const dx = (W - dw) * s.focusX;
    const dy = (H - dh) * (1 - s.focusY);
    ctx.globalAlpha = 1;
    ctx.filter = `grayscale(1) brightness(${s.exposure * (1 - s.fade)})`;
    ctx.drawImage(s.a, dx, dy, dw, dh);
    if (s.b && s.mix > 0.01) {
      ctx.globalAlpha = s.mix;
      ctx.drawImage(s.b, dx, dy, dw, dh);
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    if (s.flash > 0.01) {
      ctx.fillStyle = `rgba(240,240,240,${s.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
