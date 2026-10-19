/**
 * The wind shader: draws one frame of a sprite strip into a WebGL canvas, rippling the pixels a soft mask
 * allows (the scarf, trailing cloth) with travelling sine waves, so cloth flows between the drawn frames.
 * Returns null when WebGL isn't available; the caller keeps the plain CSS sprite then.
 */

const VS = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FS = `
precision mediump float;
varying vec2 uv;
uniform sampler2D tex;
uniform sampler2D msk;
uniform float frame;
uniform float n;
uniform float t;
uniform float amp;
vec2 cell(vec2 u) {
  return vec2((frame + clamp(u.x, 0.002, 0.998)) / n, clamp(u.y, 0.002, 0.998));
}
void main() {
  float w = texture2D(msk, cell(uv)).r;
  // the wind blows left to right: waves travel along the cloth, a faster ripple rides on a slow swell
  vec2 d = vec2(
    sin(uv.y * 17.0 - t * 5.1 + uv.x * 7.0) + 0.45 * sin(uv.y * 43.0 - t * 9.3 + uv.x * 11.0),
    0.7 * sin(uv.x * 13.0 - t * 4.3) + 0.3 * sin(uv.x * 31.0 - t * 7.7 + uv.y * 5.0)
  ) * amp * w;
  gl_FragColor = texture2D(tex, cell(uv - d));
}`;

export interface Wind {
  draw(frame: number, t: number): void;
  resize(w: number, h: number): void;
  destroy(): void;
}

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function texture(gl: WebGLRenderingContext, unit: number, img: TexImageSource) {
  const tx = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tx;
}

export function createWind(canvas: HTMLCanvasElement, img: HTMLImageElement, mask: HTMLImageElement, n: number, amp: number): Wind | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (img.naturalWidth > max) return null;

  const vs = shader(gl, gl.VERTEX_SHADER, VS);
  const fs = shader(gl, gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const t0 = texture(gl, 0, img);
  const t1 = texture(gl, 1, mask);
  const u = (k: string) => gl.getUniformLocation(prog, k);
  gl.uniform1i(u("tex"), 0);
  gl.uniform1i(u("msk"), 1);
  gl.uniform1f(u("n"), n);
  gl.uniform1f(u("amp"), amp);
  const uFrame = u("frame");
  const uT = u("t");
  gl.clearColor(0, 0, 0, 0);

  return {
    draw(frame, t) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uFrame, frame);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    resize(w, h) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    },
    destroy() {
      gl.deleteTexture(t0);
      gl.deleteTexture(t1);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
