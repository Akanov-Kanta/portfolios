"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ProceduralCrop } from "./ProceduralCrop";

/**
 * Owner photo → manga print (reference/web-refs.md §T10). One raw-WebGL1 quad, no libraries:
 * grayscale, crushed blacks / blown highlights, posterize into `levels + 1` tones with an ordered (Bayer
 * 4×4) dither across each band edge, or 1-bit Bayer, or halftone dots; Sobel ink outlines on top;
 * a little grain; highlights capped at #F0F0F0. `object-fit: cover` is done in the shader.
 *
 * Fallbacks: no WebGL / shader failure → the <img> through an SVG posterize filter; image fails to
 * load → the procedural crop.
 */
export type MangaMode = "posterize" | "dither" | "halftone";

const VERT = `attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const FRAG = `precision highp float;
uniform sampler2D uTex; uniform vec2 uTexel; uniform vec2 uScale; uniform vec2 uOffset;
uniform float uLevels; uniform float uMode; uniform float uCell; uniform float uSeed;
varying vec2 vUv;
float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
float L(vec2 uv){ return luma(texture2D(uTex, uv).rgb); }
float B2(vec2 a){ a = floor(a); return fract(dot(a, vec2(.5, a.y * .75))); }
float B4(vec2 a){ return B2(.5 * a) * .25 + B2(a); }
void main(){
  vec2 uv = uOffset + vUv * uScale;
  float l = clamp((L(uv) - .08) * 1.35, 0., 1.);
  vec2 p = uTexel;
  float tl = L(uv + vec2(-p.x, p.y)), t = L(uv + vec2(0., p.y)), tr = L(uv + p);
  float ml = L(uv - vec2(p.x, 0.)), mr = L(uv + vec2(p.x, 0.));
  float bl = L(uv - p), b = L(uv - vec2(0., p.y)), br = L(uv + vec2(p.x, -p.y));
  float gx = -tl - 2. * ml - bl + tr + 2. * mr + br;
  float gy = -bl - 2. * b - br + tl + 2. * t + tr;
  float edge = smoothstep(.22, .65, length(vec2(gx, gy)));
  vec2 cell = gl_FragCoord.xy / uCell;
  float v;
  if (uMode < .5) {
    float q = l * uLevels;
    v = (floor(q) + step(B4(cell), fract(q))) / uLevels;
  } else if (uMode < 1.5) {
    v = step(B4(cell), l);
  } else {
    vec2 g = mod(gl_FragCoord.xy, 3. * uCell) - 1.5 * uCell;
    v = length(g) < 1.6 * uCell * sqrt(1. - l) ? 0. : 1.;
  }
  v = mix(v, 0., edge * .9);
  v -= (fract(sin(dot(gl_FragCoord.xy + uSeed, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .06;
  gl_FragColor = vec4(vec3(clamp(v, 0., .94)), 1.);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/** Sets up the program and returns a draw(width, height) function, or null if anything fails. */
function setup(canvas: HTMLCanvasElement, img: HTMLImageElement, mode: MangaMode, levels: number) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  } catch {
    return null; // e.g. a cross-origin image without CORS
  }
  if (gl.getError() !== gl.NO_ERROR) return null;

  const u = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform1i(u("uTex"), 0);
  gl.uniform1f(u("uLevels"), levels);
  gl.uniform1f(u("uMode"), mode === "posterize" ? 0 : mode === "dither" ? 1 : 2);
  gl.uniform1f(u("uSeed"), Math.random() * 100);

  return (w: number, h: number, dpr: number) => {
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    // object-fit: cover
    const ac = w / h;
    const ai = img.naturalWidth / img.naturalHeight;
    const sx = ai > ac ? ac / ai : 1;
    const sy = ai > ac ? 1 : ai / ac;
    gl.uniform2f(u("uScale"), sx, sy);
    gl.uniform2f(u("uOffset"), (1 - sx) / 2, (1 - sy) / 2);
    // Sobel step ≈ one output pixel in texture space, at least one texel
    gl.uniform2f(u("uTexel"), Math.max(1 / img.naturalWidth, sx / canvas.width) * 1.5, Math.max(1 / img.naturalHeight, sy / canvas.height) * 1.5);
    gl.uniform1f(u("uCell"), Math.max(1, Math.round(dpr * 1.5)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}

interface MangaPhotoProps {
  src: string;
  /** used for the procedural fallback crop */
  variant?: number;
  mode?: MangaMode;
  /** posterize steps; levels + 1 tones (4 → 5 tones) */
  levels?: number;
  className?: string;
  alt?: string;
}

export function MangaPhoto({ src, variant = 0, mode = "posterize", levels = 4, className = "", alt = "" }: MangaPhotoProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"webgl" | "svg" | "none">("webgl");
  const filterId = `manga-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let alive = true;
    let ro: ResizeObserver | null = null;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!alive) return;
      const draw = setup(el, img, mode, levels);
      if (!draw) {
        setState("svg");
        return;
      }
      const redraw = () => {
        const r = el.getBoundingClientRect();
        if (r.width && r.height) draw(r.width, r.height, Math.min(2, window.devicePixelRatio || 1));
      };
      ro = new ResizeObserver(redraw);
      ro.observe(el);
      redraw();
    };
    img.onerror = () => alive && setState("none");
    img.src = src;
    return () => {
      alive = false;
      ro?.disconnect();
    };
  }, [src, mode, levels]);

  if (state === "none") return <ProceduralCrop variant={variant} className={className} />;
  if (state === "svg") {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 .22 .55 .8 .94" />
              <feFuncG type="discrete" tableValues="0 .22 .55 .8 .94" />
              <feFuncB type="discrete" tableValues="0 .22 .55 .8 .94" />
            </feComponentTransfer>
          </filter>
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element -- filtered art, not a content image */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          style={{ filter: `url(#${filterId}) contrast(1.4)` }}
          onError={() => setState("none")}
        />
      </div>
    );
  }
  return <canvas ref={canvas} role={alt ? "img" : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true} className={`block h-full w-full ${className}`} />;
}
