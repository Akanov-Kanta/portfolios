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
  bloom: number;
  ca: number;
  edge: number;
  grain: number;
  vig: number;
  lift: number;
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
      'uWork', 'uFlash', 'uOutro', 'uReduced', 'uVeins',
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

  uploadVeins(src: HTMLCanvasElement): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.veinTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  render(u: Uniforms): void {
    const gl = this.gl;
    const L = this.sceneLoc;

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
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.generateMipmap(gl.TEXTURE_2D);

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
