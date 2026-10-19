import { VERT, SCENE_FRAG, POST_FRAG } from './shaders';

export interface Uniforms {
  time: number;
  mouse: [number, number];
  stir: number;
  scene: number;
  zoom: number;
  wipe: number;
  blots: number;
  flood: number;
  work: number;
  flash: number;
  outro: number;
  reduced: number;
  glitch: number;
  /** outro: black ink eats the footage (0..1) */
  eat: number;
  /** stack -> outro halftone bleach (0..1) */
  bleach: number;
  /** way back to the hero: 0 = handle on the void, 1 = the T = 0 hero */
  ret: number;
  /** work: a card's dossier opening (0..1) and that card's centre (screen uv, y up) */
  open: number;
  openC: [number, number];
  foot: Foot;
  /** hero text block (centre xy + half size zw, screen uv, y up) and scrim strength */
  scrim: [number, number, number, number];
  scrimAmt: number;
  bloom: number;
  ca: number;
  edge: number;
  grain: number;
  vig: number;
  lift: number;
}

/** Footage layer, sampled inside the scene shader (hero + outro). */
export interface Foot {
  /** current frame and its neighbour (blended by `mix`); keys skip re-uploads */
  a: TexImageSource | null;
  aKey: string;
  b: TexImageSource | null;
  bKey: string;
  mix: number;
  /** 0 = no footage yet (pure shader), 1 = footage visible */
  on: number;
  /** visible fraction of the image (kx, ky; >1 = image smaller than the screen) and offset (ox, oy) */
  k: [number, number, number, number];
  /** mip bias: softens the halftone dot screen when the frame is minified (phones) */
  lod: number;
}

type Loc = WebGLUniformLocation | null;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile failed: ' + log);
  }
  return sh;
}

function program(gl: WebGL2RenderingContext, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(p));
  }
  return p;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private sceneProg: WebGLProgram;
  private postProg: WebGLProgram;
  private sceneLoc: Record<string, Loc> = {};
  private postLoc: Record<string, Loc> = {};
  private fbo: WebGLFramebuffer;
  private fboTex: WebGLTexture;
  private veinTex: WebGLTexture;
  private footTex: [WebGLTexture, WebGLTexture];
  private footKey: [string, string] = ['', ''];
  /** true once a real footage frame (not only a poster) has been uploaded */
  hasFrame = false;
  // async readback of a tiny mip of the scene (PBO + fence, never stalls): how bright the picture
  // is under each HUD corner, so the HUD can switch to dark ink over paper-white frames
  private probeFb: WebGLFramebuffer;
  private probePx = new Uint8Array(4);
  private probeSize = [0, 0];
  private probeTick = 0;
  private probeDirty = false;
  /** mean sRGB brightness (0..1) under: top-left, top-right, bottom-right, left-middle */
  probe: { tl: number; tr: number; br: number; ml: number } | null = null;
  private fw = 1;
  private fh = 1;
  private w = 1;
  private h = 1;
  /** Fraction of canvas resolution used for the noisy scene pass. Adapted at runtime. */
  sceneScale = 0.72;
  readonly dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.sceneProg = program(gl, SCENE_FRAG);
    this.postProg = program(gl, POST_FRAG);
    const sceneNames = [
      'uRes', 'uTime', 'uMouse', 'uStir', 'uScene', 'uZoom', 'uWipe', 'uBlots', 'uFlood',
      'uWork', 'uFlash', 'uOutro', 'uReduced', 'uVeins', 'uEat',
      'uFootA', 'uFootB', 'uFootMix', 'uFootOn', 'uFootK', 'uFootLod', 'uScrim', 'uScrimAmt', 'uBleach', 'uReturn',
      'uOpen', 'uOpenC',
    ];
    for (const n of sceneNames) this.sceneLoc[n] = gl.getUniformLocation(this.sceneProg, n);
    const postNames = ['uScene', 'uRes', 'uTime', 'uGlitch', 'uBloom', 'uCA', 'uEdge', 'uGrain', 'uVig', 'uLift'];
    for (const n of postNames) this.postLoc[n] = gl.getUniformLocation(this.postProg, n);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.fboTex = gl.createTexture()!;
    this.fbo = gl.createFramebuffer()!;
    this.veinTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.veinTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));

    const mkFoot = () => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([7, 6, 10, 255]));
      gl.generateMipmap(gl.TEXTURE_2D);
      return t;
    };
    this.footTex = [mkFoot(), mkFoot()];
    this.probeFb = gl.createFramebuffer()!;

    this.resize();
  }

  resize(): void {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    this.w = Math.max(1, Math.round(cw * this.dpr));
    this.h = Math.max(1, Math.round(ch * this.dpr));
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.allocFbo();
  }

  setSceneScale(s: number): void {
    if (Math.abs(s - this.sceneScale) < 0.01) return;
    this.sceneScale = s;
    this.allocFbo();
  }

  private allocFbo(): void {
    const gl = this.gl;
    this.fw = Math.max(1, Math.round(this.w * this.sceneScale));
    this.fh = Math.max(1, Math.round(this.h * this.sceneScale));
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.fw, this.fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** last readback cost in ms (diagnostics) */
  probeMs = 0;
  private probeBuf: WebGLBuffer | null = null;
  private probeFence: WebGLSync | null = null;
  private probeWait = 0;

  /**
   * How bright the scene is under each HUD corner. Async: readPixels of a tiny mip (~48 x 30 px)
   * into a pixel-pack buffer + a fence; the bytes are collected a few frames later, so the GPU is
   * never stalled.
   */
  private startProbe(): void {
    const gl = this.gl;
    const level = Math.max(0, Math.floor(Math.log2(Math.max(this.fw, this.fh) / 48)));
    const w = Math.max(1, this.fw >> level);
    const h = Math.max(1, this.fh >> level);
    this.probeBuf ??= gl.createBuffer()!;
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.probeBuf);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, w * h * 4, gl.STREAM_READ);
    if (this.probeSize[0] !== w || this.probeSize[1] !== h) {
      this.probePx = new Uint8Array(w * h * 4);
      this.probeSize = [w, h];
    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.probeFb);
    gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, level);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    this.probeFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    this.probeWait = 0;
  }

  /** Call every frame (also when nothing is rendered): collects a finished probe. */
  pollProbe(): void {
    if (!this.collectProbe() && this.probeDirty) {
      this.probeDirty = false;
      this.startProbe();
    }
  }

  /** Collect a finished probe; returns true while one is still in flight. */
  private collectProbe(): boolean {
    const gl = this.gl;
    const f = this.probeFence;
    if (!f) return false;
    if (gl.getSyncParameter(f, gl.SYNC_STATUS) !== gl.SIGNALED) return true;
    // give the browser a couple more frames to land its readback copy before reading
    if (++this.probeWait < 3) return true;
    const t0 = performance.now();
    const [w, h] = this.probeSize;
    const px = this.probePx;
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.probeBuf);
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.deleteSync(f);
    this.probeFence = null;
    // GL rows start at the bottom; regions in 0..1 screen fractions (y from the top)
    const mean = (x0: number, x1: number, y0: number, y1: number) => {
      const xa = Math.floor(x0 * w), xb = Math.max(xa + 1, Math.ceil(x1 * w));
      const ya = Math.floor((1 - y1) * h), yb = Math.max(ya + 1, Math.ceil((1 - y0) * h));
      let sum = 0;
      let n = 0;
      for (let y = ya; y < yb; y++) {
        for (let x = xa; x < xb; x++) {
          const k = (y * w + x) * 4;
          sum += (0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2]) / 255;
          n++;
        }
      }
      return n ? sum / n : 0;
    };
    const top = Math.min(0.09, 72 / window.innerHeight);
    this.probe = {
      tl: mean(0, 0.32, 0, top),
      tr: mean(0.45, 1, 0, top),
      br: mean(0.6, 1, 1 - top, 1),
      ml: mean(0, 0.05, 0.35, 0.65),
    };
    this.probeMs = performance.now() - t0;
    return false;
  }

  uploadVeins(src: HTMLCanvasElement): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.veinTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  /** Per-frame texture upload into this context (no second WebGL context). Mipmaps keep minified halftone clean. */
  private uploadFoot(slot: 0 | 1, src: TexImageSource, key: string): void {
    if (this.footKey[slot] === key) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE2 + slot);
    gl.bindTexture(gl.TEXTURE_2D, this.footTex[slot]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.footKey[slot] = key;
    if (!key.startsWith('poster')) this.hasFrame = true;
  }

  render(u: Uniforms): void {
    const gl = this.gl;
    const L = this.sceneLoc;
    const f = u.foot;
    let mix = 0;
    if (f.on > 0.001 && f.a) {
      this.uploadFoot(0, f.a, f.aKey);
      if (f.b && f.mix > 0.002) {
        this.uploadFoot(1, f.b, f.bKey);
        mix = f.mix;
      }
    }

    // pass 1: scene -> fbo
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.fw, this.fh);
    gl.useProgram(this.sceneProg);
    gl.uniform2f(L.uRes, this.fw, this.fh);
    gl.uniform1f(L.uTime, u.time);
    gl.uniform2f(L.uMouse, u.mouse[0], u.mouse[1]);
    gl.uniform1f(L.uStir, u.stir);
    gl.uniform1f(L.uScene, u.scene);
    gl.uniform1f(L.uZoom, u.zoom);
    gl.uniform1f(L.uWipe, u.wipe);
    gl.uniform1f(L.uBlots, u.blots);
    gl.uniform1f(L.uFlood, u.flood);
    gl.uniform1f(L.uWork, u.work);
    gl.uniform1f(L.uFlash, u.flash);
    gl.uniform1f(L.uOutro, u.outro);
    gl.uniform1f(L.uReduced, u.reduced);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.veinTex);
    gl.uniform1i(L.uVeins, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.footTex[0]);
    gl.uniform1i(L.uFootA, 2);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.footTex[1]);
    gl.uniform1i(L.uFootB, 3);
    gl.uniform1f(L.uFootMix, mix);
    gl.uniform1f(L.uFootOn, f.a ? f.on : 0);
    gl.uniform4f(L.uFootK, f.k[0], f.k[1], f.k[2], f.k[3]);
    gl.uniform1f(L.uFootLod, f.lod);
    gl.uniform1f(L.uEat, u.eat);
    gl.uniform4f(L.uScrim, u.scrim[0], u.scrim[1], u.scrim[2], u.scrim[3]);
    gl.uniform1f(L.uScrimAmt, u.scrimAmt);
    gl.uniform1f(L.uBleach, u.bleach);
    gl.uniform1f(L.uReturn, u.ret);
    gl.uniform1f(L.uOpen, u.open);
    gl.uniform2f(L.uOpenC, u.openC[0], u.openC[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.generateMipmap(gl.TEXTURE_2D);
    // one probe in flight at a time; an on-demand (reduced) render queues a fresh one
    if (this.probeFence) this.probeDirty = this.probeDirty || u.reduced > 0.5;
    else if (this.probeTick++ % 4 === 0 || u.reduced > 0.5) this.startProbe();


    // pass 2: post -> screen
    const P = this.postLoc;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.postProg);
    gl.uniform1i(P.uScene, 0);
    gl.uniform2f(P.uRes, this.w, this.h);
    gl.uniform1f(P.uTime, u.time);
    gl.uniform1f(P.uGlitch, u.glitch);
    gl.uniform1f(P.uBloom, u.bloom);
    gl.uniform1f(P.uCA, u.ca);
    gl.uniform1f(P.uEdge, u.edge);
    gl.uniform1f(P.uGrain, u.grain);
    gl.uniform1f(P.uVig, u.vig);
    gl.uniform1f(P.uLift, u.lift);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
