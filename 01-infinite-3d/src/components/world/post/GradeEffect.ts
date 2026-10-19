import { BlendFunction, Effect } from "postprocessing";
import { Uniform, Vector3, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { frame, isCalm } from "../state/world-store";
import { PALETTE, fx, hexToRgb } from "../theme";

/**
 * The per-station colour grade ("one world, one night"), a plain per-pixel effect so it merges
 * into the same EffectPass as GlitchCut + Bloom. Reads the interpolated fx.mood every frame, so
 * colour never cuts at a boundary or at the loop seam. Graded in display space (≈ sRGB):
 *  - ASC-CDL lift / gain / gamma, saturation around Rec.709 luma, a mild split-tone
 *  - igloo's diagonal multiply mix(0.8, 1.0, (x+y)/2) and a faint moon-blue top-right glare
 *  - vignette from mood.vignette with a very slow breath (replaces drei's <Vignette>)
 *  - hash grain: mood.grain * 0.5 + 0.04 * velocity (the CSS .grain layer stays as the base)
 * Calm (reduced motion / static / ?freeze): the grade holds, time-based noise freezes, velocity is 0.
 */
const fragmentShader = /* glsl */ `
uniform vec3 uLift;
uniform vec3 uGain;
uniform float uGamma;
uniform float uSat;
uniform float uVignette;
uniform float uGrain;
uniform float uTime;
uniform vec3 uMoon;
uniform float uDevelop;

const vec3 GR_LUMA = vec3(0.2126, 0.7152, 0.0722);

float grHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float grNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(grHash(i), grHash(i + vec2(1.0, 0.0)), u.x), mix(grHash(i + vec2(0.0, 1.0)), grHash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 c = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));

  // ASC-CDL: slope (gain) + offset (lift, shadows only) + power (gamma)
  c = pow(max(c * uGain + uLift * (1.0 - c), 0.0), vec3(1.0 / uGamma));
  float l = dot(c, GR_LUMA);
  c = max(mix(vec3(l), c, uSat), 0.0);

  // split-tone: shadows lean toward the lift hue, highlights toward the gain hue (luma-neutral tints)
  vec3 lt = uLift / max(1e-3, dot(uLift, GR_LUMA));
  vec3 gt = uGain / max(1e-3, dot(uGain, GR_LUMA));
  c = mix(c, c * lt, 0.16 * (1.0 - smoothstep(0.0, 0.45, l)));
  c = mix(c, c * gt, 0.10 * smoothstep(0.55, 1.0, l));

  // igloo diagonal: bottom-left a touch darker than top-right
  c *= mix(0.8, 1.0, (uv.x + uv.y) * 0.5);

  // top-right moon glare, slowly breathing
  float glare = uv.x * uv.y; glare *= glare;
  c += uMoon * glare * (0.6 + 0.4 * grNoise(vec2(uTime * 0.07, 1.3))) * 0.06;

  // vignette (same curve as the old drei Vignette at offset .25), breath ±3 %
  float v = uVignette * (1.0 + 0.03 * sin(uTime * 0.35));
  c *= smoothstep(0.8, 0.25 * 0.799, distance(uv, vec2(0.5)) * (v + 0.25));

  // phone develop: the frame comes up from 0.55 as the world arrives (1.0 everywhere else: identity)
  c *= uDevelop;

  // grain (display space so it reads evenly in the shadows)
  c += (grHash(uv * resolution + fract(uTime * 7.31) * 173.0) - 0.5) * uGrain;

  outputColor = vec4(pow(max(c, 0.0), vec3(2.2)), inputColor.a);
}`;

const MOON = hexToRgb(PALETTE.moon);
/** the phone develop's starting gain (display space) */
const DEVELOP_FROM = 0.55;

export class GradeEffect extends Effect {
  constructor() {
    super("GradeEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uLift", new Uniform(new Vector3())],
        ["uGain", new Uniform(new Vector3(1, 1, 1))],
        ["uGamma", new Uniform(1)],
        ["uSat", new Uniform(1)],
        ["uVignette", new Uniform(0.75)],
        ["uGrain", new Uniform(0.015)],
        ["uTime", new Uniform(0)],
        ["uMoon", new Uniform(new Vector3(...MOON))],
        ["uDevelop", new Uniform(1)],
      ]),
    });
  }
  override update(_r: WebGLRenderer, _i: WebGLRenderTarget, dt = 1 / 60) {
    const m = fx.mood;
    const u = this.uniforms;
    // mood colours are sRGB 0..1 and the grade runs in display space: no linear conversion
    (u.get("uLift")!.value as Vector3).set(m.lift[0], m.lift[1], m.lift[2]);
    (u.get("uGain")!.value as Vector3).set(m.gain[0], m.gain[1], m.gain[2]);
    u.get("uGamma")!.value = m.gamma;
    u.get("uSat")!.value = m.saturation;
    u.get("uVignette")!.value = m.vignette;
    // gain = mix(0.55, 1, fx.develop): identity on desktop, where fx.develop never leaves 1
    u.get("uDevelop")!.value = fx.develop >= 1 ? 1 : DEVELOP_FROM + (1 - DEVELOP_FROM) * fx.develop;
    const calm = isCalm();
    u.get("uGrain")!.value = m.grain * 0.5 + (calm ? 0 : 0.04 * frame.vNorm);
    if (!calm) u.get("uTime")!.value += dt;
  }
}
