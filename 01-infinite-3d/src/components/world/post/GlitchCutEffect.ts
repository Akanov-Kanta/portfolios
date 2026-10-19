import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Color, SRGBColorSpace, Uniform, Vector2, type Texture, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { frame, isCalm, worldStore, type StationId } from "../state/world-store";
import { DUR, EASE, PALETTE, bezier, fx } from "../theme";
import { dive } from "../scenes/dive";
import { shock } from "./shock";

/**
 * Our own station-transition post effect (single convolution pass), in the spirit of igloo's
 * "chromatic aberration + tech displacement + frost" cut. One shared spine for every boundary:
 *  - a diagonal tear (slope 0.2 * aspect) sweeping the screen with the transition, its edge
 *    broken by blocky noise, the two sides shearing apart; row tearing + a bright accent edge
 *  - chromatic aberration tinted with the red/cyan fringe pair (PALETTE.fringeR / fringeC)
 * plus one flavour per boundary, as damped weights picked from frame.segFrom -> segTo:
 *  - hero -> about       uGlitch  tech blocks flicker sideways (half strength)
 *  - about -> projects   uFrost   Voronoi ice cells offset the sampling, ice-blue cell edges
 *                                 (high tier: dual-render diagonal to the next pose, see IceCutRender)
 *  - projects -> contact uStreak  light-speed columns stretched toward the centre + wide split
 *  - contact -> hero     uBlocks  the frame materialises from a coarse 16 px grid down to 1 px
 * Extras: uRing (portal ring swirl, fx.ring), uRouteFrost (enter-project frost, fx.frost),
 * uDive / uDivePulse (high-tier monitor dive: the tear stands down and a shard pulse marks the
 * portal flip, see scenes/dive.ts), uShock* (intro shockwave from the H1, post/shock.ts, DUR.boot).
 * Strength = bell(transition) + 0.35 * normalised scroll velocity. Calm (reduced motion / static /
 * ?freeze): no displacement at all; a boundary only gets a <=150 ms accent veil blip.
 */
const fragmentShader = /* glsl */ `
uniform float uTransition;
uniform float uVelocity;
uniform float uTime;
uniform float uLocal;
uniform float uAspect;
uniform vec3 uTint;
uniform vec3 uFringeR;
uniform vec3 uFringeC;
uniform vec3 uIce;
uniform float uGlitch;
uniform float uFrost;
uniform float uStreak;
uniform float uBlocks;
uniform float uRing;
uniform float uRouteFrost;
uniform float uRouteP;
uniform float uCalm;
uniform sampler2D tScene2;
uniform float uIceCut;
uniform float uDive;
uniform float uDivePulse;
uniform float uShockAmp;
uniform float uShockR;
uniform float uShockW;
uniform vec2 uShockC;

const vec3 GC_LUMA = vec3(0.2126, 0.7152, 0.0722);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// one side of the ice cut: the live frame blended toward the half-res next-pose render by w
// (w = step past the cut * uIceCut, so the cut fades out continuously: no hard switch while it is on)
vec3 side(float w, vec2 p) {
  vec3 a = texture2D(inputBuffer, p).rgb;
  return w > 0.001 ? mix(a, texture2D(tScene2, p).rgb, w) : a;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // the monitor dive (high tier) replaces the sweeping tear with a shard pulse at the portal flip
  float bandT = uTransition * (1.0 - uDive);
  float k = clamp(bandT + 0.5 * uDivePulse + 0.35 * uVelocity, 0.0, 1.0);
  if (k < 0.002 && uRing < 0.002 && uRouteFrost < 0.002 && uIceCut < 0.002 && uShockAmp < 0.001) { outputColor = inputColor; return; }

  if (uCalm > 0.5) {
    // reduced motion: nothing moves; a faint accent veil marks the boundary, route changes fade
    vec3 cc = inputColor.rgb + uTint * 0.10 * uTransition;
    outputColor = vec4(mix(cc, cc * 0.15, uRouteFrost), inputColor.a);
    return;
  }

  // shared spine: the diagonal cut sweeps the screen as the transition progresses, its edge broken
  // by blocky noise; the two sides shear apart vertically like a page turn
  float lineY = (1.0 - uLocal) * 1.4 - 0.2 + (uv.x - 0.5) * 0.2 * uAspect;
  float edgeNoise = (vnoise(vec2(floor(uv.x * 40.0) / 40.0 * 9.0, uTime * 2.0)) - 0.5) * 0.12;
  float dist = uv.y - (lineY + edgeNoise);
  float band = clamp(1.0 - abs(dist) * 7.0, 0.0, 1.0) * bandT;
  vec2 uv0 = uv;
  float shear = 0.035 * bandT * bandT;
  uv0.y += dist > 0.0 ? shear : -shear;

  // contact -> hero: materialise from a coarse pixel grid (16 px -> 1 px), coarser ahead of the cut
  float bk = uBlocks * k;
  float blockOff = 0.0;
  if (bk > 0.001) {
    float px = floor(1.0 + 15.0 * bk * (dist > 0.0 ? 1.0 : 0.45));
    vec2 bs = px / resolution;
    vec2 bid = floor(uv0 / bs);
    uv0 = (bid + 0.5) * bs;
    blockOff = step(1.0 - 0.45 * bk, hash(bid + floor(uTime * 10.0)));
  }

  // portal ring: swirl around the screen centre (jittered per 2 px cell) + small displaced cells
  vec2 c = uv0 - 0.5;
  if (uRing > 0.001) {
    float r = length(c * vec2(uAspect, 1.0));
    float jit = 0.85 + 0.3 * hash(floor(uv * resolution * 0.5));
    float a = 0.3 * uRing * jit * (1.0 - smoothstep(0.0, 0.9, r));
    float s = sin(a), co = cos(a);
    c = mat2(co, -s, s, co) * c;
    uv0 = c + 0.5;
  }

  vec2 d = vec2(0.0);
  vec3 add = vec3(0.0);
  float caK = 0.018 * k + 0.03 * band;

  // hero -> about (and a trace everywhere): tech blocks, 64x36 cells, a random subset shifts sideways
  vec2 cell = floor(uv * vec2(64.0, 36.0));
  float wisp = smoothstep(0.35, 0.9, vnoise(uv * 5.0 + vec2(0.0, uTime * 0.15)));
  float gk = uGlitch * k;
  if (gk > 0.001) {
    float block = step(1.0 - 0.35 * k - 0.4 * band, hash(cell + floor(uTime * 12.0)));
    d.x += ((vnoise(uv * 9.0 + uTime) - 0.5) * 0.03 * wisp + (hash(cell) - 0.5) * 0.05 * block) * gk * 2.0;
  }
  d.x += (hash(vec2(cell.y, floor(uTime * 20.0))) - 0.5) * 0.10 * band; // row tearing along the cut

  // about -> projects: frost crystallisation, Voronoi cells offset the sampling, ice-blue edges
  float fk = uFrost * k;
  if (fk > 0.001) {
    vec2 p = vec2(uv.x * uAspect, uv.y) * 11.0;
    vec2 ip = floor(p), fp = fract(p);
    float d1 = 8.0, d2 = 8.0;
    vec2 best = vec2(0.5);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = vec2(hash(ip + g), hash(ip + g + 17.31));
        vec2 rr = g + o - fp;
        float dd = dot(rr, rr);
        if (dd < d1) { d2 = d1; d1 = dd; best = o; } else if (dd < d2) { d2 = dd; }
      }
    }
    float cellEdge = 1.0 - smoothstep(0.0, 0.1, sqrt(d2) - sqrt(d1));
    d += (best - 0.5) * 0.07 * fk;
    add += uIce * cellEdge * 0.30 * fk;
    caK += 0.01 * fk;
  }

  // projects -> contact: light-speed columns (5 per screen) stretched toward the centre
  float sk = uStreak * k;
  if (sk > 0.001) {
    float colN = hash(vec2(floor(uv.x * 5.0), 3.1));
    float st = sk * (0.35 + 0.65 * colN);
    uv0.y = mix(uv0.y, 0.5, 0.55 * st);
    uv0 = mix(uv0, vec2(0.5), 0.12 * st);
    caK += 0.03 * sk;
    add += uTint * 0.06 * st * (1.0 - abs(uv.x * 2.0 - 1.0));
  }

  // portal ring: displaced square cells ride the swirl
  if (uRing > 0.001) {
    vec2 rc = floor(uv * resolution / 12.0);
    float on = step(1.0 - 0.3 * uRing, hash(rc + floor(uTime * 24.0)));
    d += (vec2(hash(rc + 3.7), hash(rc + 9.1)) - 0.5) * 0.02 * uRing * on;
    caK += 0.012 * uRing;
  }

  // enter-project frost: value noise that coarsens to nothing as it completes, slight RGB split
  if (uRouteFrost > 0.001) {
    float fq = 5.0 * (1.0 - uRouteP) + 0.5;
    vec2 n = vec2(vnoise(uv * fq * vec2(uAspect, 1.0)), vnoise(uv * fq * vec2(uAspect, 1.0) + 7.13)) - 0.5;
    d += n * 0.1 * uRouteFrost;
    caK += 0.008 * uRouteFrost;
    add += uIce * 0.10 * uRouteFrost * smoothstep(0.4, 0.8, vnoise(uv * 9.0 * vec2(uAspect, 1.0)));
  }

  // dual-render ice cut (high tier, frost boundary): the side past the cut shows the next pose,
  // each side drifts with a power2-in parallax; bands from the cut: CA blur 2.0, tech 0.9, ice edge 0.2
  float nextSide = 0.0;
  float cutDist = 1.0;
  if (uIceCut > 0.001) {
    float jag = (vnoise(vec2(uv.x * uAspect * 7.0, uv.y * 3.0 + uTime * 0.3)) - 0.5) * 0.4 * 0.1;
    float sc = dist + jag;
    float past = step(0.0, sc);
    nextSide = past * uIceCut;
    cutDist = abs(sc) / 0.05; // in band units
    float l2 = uLocal * uLocal, r2 = (1.0 - uLocal) * (1.0 - uLocal);
    uv0.y += (past > 0.5 ? -0.04 * r2 : 0.04 * l2) * uIceCut;
    float tech = (1.0 - smoothstep(0.2, 0.9, cutDist)) * uIceCut;
    d.x += (hash(vec2(floor(uv.y * 90.0), floor(uTime * 16.0))) - 0.5) * 0.04 * tech;
    caK += 0.02 * (1.0 - smoothstep(0.9, 2.0, cutDist)) * uIceCut;
    add += uIce * (1.0 - smoothstep(0.0, 0.2, cutDist)) * 0.8 * uIceCut;
  }

  // intro shockwave: one ring expands from the H1, a lens push with a radial red/cyan split
  vec2 shockCA = vec2(0.0);
  if (uShockAmp > 0.001) {
    vec2 sd = (uv - uShockC) * vec2(uAspect, 1.0);
    float r = length(sd);
    float x = (r - uShockR) / uShockW;
    float ring = exp(-x * x * 3.0);
    vec2 dirUv = (sd / max(r, 1e-4)) / vec2(uAspect, 1.0);
    d -= dirUv * x * exp(-x * x * 1.5) * 0.03 * uShockAmp;
    shockCA = dirUv * ring * 0.014 * uShockAmp;
    add += uIce * ring * 0.08 * uShockAmp;
  }

  // chromatic aberration, stronger toward the edges and near the cut, fringed red / cyan
  vec2 ca = (uv0 - 0.5) * caK * (0.35 + 2.0 * dot(c, c)) + shockCA;
  vec2 q = uv0 + d;
  vec3 b = side(nextSide, q);
  vec3 ra = side(nextSide, q + ca);
  vec3 cb = side(nextSide, q - ca);
  if (uIceCut > 0.001 && cutDist < 2.0) {
    // 5-tap CA blur in the band, dithered by hash
    float dj = hash(uv * resolution + fract(uTime) * 61.0);
    ra = mix(ra, side(nextSide, q + ca * (1.6 + dj)), 0.5 * uIceCut);
    cb = mix(cb, side(nextSide, q - ca * (1.6 + dj)), 0.5 * uIceCut);
  }
  vec3 col = vec3(ra.r, b.g, cb.b);
  col += uFringeR * max(dot(ra - b, GC_LUMA), 0.0) * 1.5 + uFringeC * max(dot(cb - b, GC_LUMA), 0.0) * 1.5;

  // bright accent edge on the cut
  col += uTint * smoothstep(0.02, 0.0, abs(dist)) * bandT * 0.9;

  // materialising blocks: a few still dark
  col *= 1.0 - 0.6 * blockOff;

  // scanlines + veil
  float scan = 0.5 + 0.5 * sin(uv.y * 900.0 + uTime * 30.0);
  col *= 1.0 - 0.12 * k * scan;
  col += uTint * (0.05 * wisp * bandT + 0.10 * band) + add;

  // ring rush: a touch more saturation and value
  if (uRing > 0.001) {
    float l = dot(col, GC_LUMA);
    col = mix(vec3(l), col, 1.0 + 0.05 * uRing) * (1.0 + 0.075 * uRing);
  }
  outputColor = vec4(col, inputColor.a);
}`;

type Flavour = { glitch: number; frost: number; streak: number; blocks: number };
const TRACE = 0.15; // glitch trace on every boundary / fast scroll
const FLAVOURS: Partial<Record<`${StationId}>${StationId}`, Flavour>> = {
  "hero>about": { glitch: 0.5, frost: 0, streak: 0, blocks: 0 },
  "about>projects": { glitch: TRACE, frost: 1, streak: 0, blocks: 0 },
  "projects>contact": { glitch: TRACE, frost: 0, streak: 1, blocks: 0 },
  "contact>hero": { glitch: TRACE, frost: 0, streak: 0, blocks: 1 },
};
const ROUTE_FLIGHT: Flavour = { glitch: 0.5, frost: 0, streak: 0, blocks: 0 };

const BLIP_MS = 150;
const shockGrow = bezier(EASE.sineOut);
const shockFade = bezier(EASE.inOut);

export class GlitchCutEffect extends Effect {
  /** damped flavour weights */
  private w: Flavour = { ...ROUTE_FLIGHT };
  private blipAt = -1e9;
  private blipKey = "";
  /** drawing-buffer size from setSize (phones read the aspect from it, not from the window) */
  private size = { w: 0, h: 0 };
  constructor() {
    super("GlitchCutEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION, // samples inputBuffer at offsets (max one per EffectPass)
      uniforms: new Map<string, Uniform>([
        ["uTransition", new Uniform(0)],
        ["uVelocity", new Uniform(0)],
        ["uTime", new Uniform(0)],
        ["uLocal", new Uniform(0)],
        ["uAspect", new Uniform(1.6)],
        ["uTint", new Uniform(new Color(PALETTE.screen))],
        ["uFringeR", new Uniform(new Color(PALETTE.fringeR))],
        ["uFringeC", new Uniform(new Color(PALETTE.fringeC))],
        ["uIce", new Uniform(new Color(PALETTE.ice))],
        ["uGlitch", new Uniform(0.5)],
        ["uFrost", new Uniform(0)],
        ["uStreak", new Uniform(0)],
        ["uBlocks", new Uniform(0)],
        ["uRing", new Uniform(0)],
        ["uRouteFrost", new Uniform(0)],
        ["uRouteP", new Uniform(0)],
        ["uCalm", new Uniform(0)],
        ["tScene2", new Uniform<Texture | null>(null)],
        ["uIceCut", new Uniform(0)],
        ["uDive", new Uniform(0)],
        ["uDivePulse", new Uniform(0)],
        ["uShockAmp", new Uniform(0)],
        ["uShockR", new Uniform(0)],
        ["uShockW", new Uniform(0.08)],
        ["uShockC", new Uniform(new Vector2(0.5, 0.5))],
      ]),
    });
  }
  /** IceCutRender hands over its half-res next-pose render; weight 0 disables the cut. */
  setIceCut(tex: Texture | null, weight: number) {
    this.uniforms.get("tScene2")!.value = tex;
    this.uniforms.get("uIceCut")!.value = tex ? weight : 0;
  }
  /** enter-project frost envelope (fx.frost) and its overall progress 0..1 */
  setRouteFrost(value: number, progress: number) {
    this.uniforms.get("uRouteFrost")!.value = value;
    this.uniforms.get("uRouteP")!.value = progress;
  }
  override setSize(width: number, height: number) {
    this.size.w = width;
    this.size.h = height;
  }
  override update(_r: WebGLRenderer, _i: WebGLRenderTarget, dt = 1 / 60) {
    const u = this.uniforms;
    const s = worldStore.getState();
    const calm = isCalm();
    u.get("uCalm")!.value = calm ? 1 : 0;
    (u.get("uTint")!.value as Color).setRGB(fx.mood.accent[0], fx.mood.accent[1], fx.mood.accent[2], SRGBColorSpace);
    u.get("uLocal")!.value = frame.local;
    // phones: the canvas is 100lvh (not the window) and no layout read per frame; desktop reads the window as before
    u.get("uAspect")!.value =
      s.profile === "phone" && this.size.h > 0 ? this.size.w / this.size.h : window.innerWidth / Math.max(1, window.innerHeight);

    // flavour weights, damped toward the current boundary's targets (instant when calm)
    const target = (frame.segFrom === frame.segTo ? ROUTE_FLIGHT : FLAVOURS[`${frame.segFrom}>${frame.segTo}`]) ?? ROUTE_FLIGHT;
    const a = calm ? 1 : 1 - Math.exp(-8 * dt);
    const w = this.w;
    w.glitch += (target.glitch - w.glitch) * a;
    w.frost += (target.frost - w.frost) * a;
    w.streak += (target.streak - w.streak) * a;
    w.blocks += (target.blocks - w.blocks) * a;
    u.get("uGlitch")!.value = w.glitch;
    u.get("uFrost")!.value = w.frost;
    u.get("uStreak")!.value = w.streak;
    u.get("uBlocks")!.value = w.blocks;

    this.updateShock(calm, u.get("uAspect")!.value as number);
    // dive: damped presence (the tear eases back in after it) + the shard pulse at the portal flip
    const dw = u.get("uDive")!;
    const dv = dw.value as number;
    dw.value = dv + ((dive.on ? 1 : 0) - dv) * (calm ? 1 : 1 - Math.exp(-6 * dt));
    // the screen glass shatters as the camera passes it (a function of the camera's distance to the
    // flip, so it rises before and falls after the switch, in either scroll direction)
    u.get("uDivePulse")!.value = calm || !dive.on ? 0 : dive.near;

    if (calm) {
      // the camera cuts; the boundary is only a short, low accent blip when the station flips
      const key = frame.local < 0.5 ? frame.segFrom : frame.segTo;
      const now = performance.now();
      if (this.blipKey && key !== this.blipKey) this.blipAt = now;
      this.blipKey = key;
      const age = now - this.blipAt;
      const blip = age < BLIP_MS ? 1 - age / BLIP_MS : 0;
      if (blip > 0) frame.dirty = Math.max(frame.dirty, 2);
      u.get("uTransition")!.value = 0.15 * blip;
      u.get("uVelocity")!.value = 0;
      u.get("uRing")!.value = 0;
      return;
    }
    this.blipKey = "";
    u.get("uTransition")!.value = frame.transition;
    u.get("uVelocity")!.value = frame.vNorm;
    // portal ring swirl: high + medium only, and only on the full feature level
    u.get("uRing")!.value = (s.tier === "high" || s.tier === "medium") && fx.featureLevel > 0 ? fx.ring : 0;
    u.get("uTime")!.value += dt;
  }
  /** intro shockwave: radius on EASE.sineOut, amplitude held then released on EASE.inOut, over DUR.boot */
  private updateShock(calm: boolean, aspect: number) {
    const u = this.uniforms;
    const p = shock.t0 < 0 ? 1 : (performance.now() - shock.t0) / DUR.boot;
    if (calm || p >= 1) {
      u.get("uShockAmp")!.value = 0;
      return;
    }
    const cx = shock.x, cy = shock.y;
    // reach past the farthest corner (aspect-corrected units)
    const far = Math.max(Math.hypot(cx * aspect, cy), Math.hypot((1 - cx) * aspect, cy), Math.hypot(cx * aspect, 1 - cy), Math.hypot((1 - cx) * aspect, 1 - cy));
    const w = 0.07 + 0.12 * p;
    u.get("uShockR")!.value = shockGrow(p) * (far + 2 * w);
    u.get("uShockW")!.value = w;
    u.get("uShockAmp")!.value = (1 - shockFade(p)) * Math.min(1, p / 0.05);
    (u.get("uShockC")!.value as Vector2).set(cx, cy);
  }
}
