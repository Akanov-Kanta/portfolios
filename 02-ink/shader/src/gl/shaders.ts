// GLSL for the single shared canvas.
// Pass 1 (scene): draws whichever scene is active, including the ink transitions.
// Pass 2 (post): chromatic aberration, edge glints, bloom (mip taps), glitch, grain.

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = ROT * p; a *= 0.5; }
  return s / 0.97;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = ROT * p; a *= 0.5; }
  return s / 0.875;
}
`;

export const SCENE_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;      // -1..1, smoothed
uniform float uStir;      // accumulated cursor energy
uniform float uScene;     // 0 hero, 1 about, 2 work, 3 stack, 4 outro
uniform float uZoom;      // hero scroll push-in
uniform float uWipe;      // white ink-bleed burst
uniform float uBlots;     // sumi blots growth
uniform float uFlood;     // black ink flood
uniform float uWork;      // vein growth
uniform float uFlash;     // stack hard-cut flash
uniform float uOutro;
uniform float uReduced;
uniform sampler2D uVeins;

${NOISE}

const vec3 CORAL = vec3(1.0, 0.353, 0.263);
const vec3 CORAL_D = vec3(0.91, 0.263, 0.184);
const vec3 BLOOD = vec3(0.42, 0.05, 0.04);
const vec3 VOID = vec3(0.027, 0.024, 0.039);

// ---------------------------------------------------------------- HERO
// Red brush-stroke vortex. Strokes live on a log spiral so they shear as they spin.
vec3 hero(vec2 p, float t, float zoom) {
  vec2 c = uMouse * vec2(0.05, 0.035);
  vec2 d = (p - c) * (1.0 - 0.32 * zoom);
  float r = length(d);
  float a = atan(d.y, d.x);
  vec2 ring0 = vec2(cos(a), sin(a));

  float spin = t * 0.42 + uStir + zoom * 2.2;
  float sw = a + 2.1 * log(r + 0.03) - spin;
  vec2 dir = vec2(cos(sw), sin(sw));

  // stroke field: slow along the spiral, fast across it
  float n2 = fbm(dir * 5.5 + vec2(-r * 9.0, r * 7.0 + t * 0.25) + 9.1);
  float n = fbm(dir * 3.3 + vec2(r * 3.0, -r * 2.0) + 1.7) + (n2 - 0.5) * 0.22;

  float edgeN = fbm3(ring0 * 2.2 + vec2(t * 0.12, -t * 0.08));
  float lumps = vnoise(dir * 9.0 + 3.0);
  float outer = 0.42 + 0.13 * edgeN + 0.07 * lumps + 0.05 * (n - 0.5);
  float inner = 0.235 + 0.05 * fbm3(dir * 3.0 + 5.0);
  float inMask = smoothstep(inner - 0.04, inner + 0.05, r);
  float outMask = 1.0 - smoothstep(outer - 0.012, outer + 0.012, r);
  float ring = inMask * outMask;

  float s = smoothstep(0.40, 0.60, n);
  vec3 ringCol = mix(BLOOD, CORAL, s);
  ringCol = mix(ringCol, vec3(1.0, 0.56, 0.46), smoothstep(0.62, 0.82, n2) * s * 0.75);
  float gap = 1.0 - smoothstep(0.0, 0.035, abs(n - 0.43));
  ringCol *= 1.0 - 0.85 * gap;
  float gap2 = 1.0 - smoothstep(0.0, 0.02, abs(n2 - 0.5));
  ringCol *= 1.0 - 0.45 * gap2 * s;
  // radial shading: stroke crests near the outer lip catch light
  ringCol *= 0.65 + 0.55 * smoothstep(inner, outer, r);

  // interior: deep red cavity with bright crackle filaments
  float fil = abs(fbm(d * 7.0 + vec2(t * 0.05, -t * 0.04)) - 0.5);
  float filM = 1.0 - smoothstep(0.0, 0.018, fil);
  float cavityR = smoothstep(0.0, inner, r);
  vec3 interior = mix(vec3(0.02, 0.006, 0.01), vec3(0.2, 0.025, 0.025), cavityR * cavityR);
  interior += CORAL * filM * (0.18 + 0.5 * cavityR * cavityR);

  // outside: void with a red haze and white-hot wing rays
  vec3 bg = VOID + vec3(0.06, 0.008, 0.01) * exp(-max(r - outer, 0.0) * 3.0);
  float outside = smoothstep(outer - 0.02, outer + 0.1, r);
  float rays = pow(vnoise(ring0 * 11.0 + vec2(0.0, t * 0.6)), 5.0);
  rays += 0.6 * pow(vnoise(ring0 * 23.0 - vec2(t * 0.4, 0.0)), 7.0);
  float wing = pow(abs(ring0.x), 2.5);
  float rayFall = exp(-max(r - outer, 0.0) * 2.6) * outside;
  vec3 rayCol = mix(CORAL, vec3(1.0, 0.94, 0.92), clamp(rays * 1.4, 0.0, 1.0));
  bg += rayCol * rays * rayFall * wing * 2.2;
  bg += CORAL * 0.22 * exp(-max(r - outer, 0.0) * 9.0) * outside;

  vec3 col = mix(interior, bg, smoothstep(inner, inner + 0.01, r));
  col = mix(col, ringCol, ring);
  // white-hot stroke crests
  float hot = smoothstep(0.74, 0.86, n2) * s * ring;
  col = mix(col, vec3(1.0, 0.95, 0.92), hot * 0.55);
  // slow pulse, deeper with push-in
  col *= 0.92 + 0.08 * sin(t * 1.3) + zoom * 0.2;
  return col;
}

// ---------------------------------------------------------------- WHITE BURST
float burstMask(vec2 p, float w, float t) {
  vec2 q = p * vec2(0.86, 1.0);
  float r = length(q);
  float a = atan(q.y, q.x);
  vec2 dir = vec2(cos(a), sin(a));
  float lobes = fbm3(dir * 1.7 + vec2(3.1, t * 0.05));
  float fur = vnoise(dir * 46.0) * 0.6 + vnoise(dir * 110.0 + 7.0) * 0.4;
  float R = w * 1.45 - 0.06;
  float dist = r - R - 0.22 * (lobes - 0.5) * (0.4 + w) - 0.07 * fur * w;
  float feather = 0.006 + 0.045 * fur * fur;
  return 1.0 - smoothstep(-feather, feather, dist);
}

// ---------------------------------------------------------------- ABOUT (sumi ink on white)
float blot(vec2 p, vec2 c, float rad, float g, float seed, float t, out float wash) {
  wash = 0.0;
  vec2 q = p - c;
  float rr = length(q);
  // cheap cull: far outside this blot's reach (spikes + wash included)
  if (g < 0.001 || rr > rad * g * 3.4 + 0.24) return 0.0;
  float aa = atan(q.y, q.x);
  vec2 dd = vec2(cos(aa), sin(aa));
  float edge = fbm(q * 3.2 + seed * 7.3 + vec2(0.0, t * 0.02));
  float spikes = pow(vnoise(dd * 6.0 + seed * 3.1), 3.0);
  float fine = vnoise(dd * 30.0 + seed);
  float R = rad * g;
  float d = rr - R * (0.55 + 0.75 * edge + 1.6 * spikes * g + 0.12 * fine);
  wash = (1.0 - smoothstep(0.0, 0.05 + 0.16 * g, d)) * g;
  return 1.0 - smoothstep(-0.003, 0.004 + 0.01 * fine, d);
}

float spatter(vec2 p, vec2 c, float rad, float g, float seed) {
  if (g < 0.01) return 0.0;
  vec2 q = (p - c) * 38.0;
  vec2 cell = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash12(cell + seed * 13.1);
  float h2 = hash12(cell + seed * 7.7 + 3.0);
  float dist = length(p - c);
  float zone = smoothstep(rad * 2.3 * g, rad * 1.0 * g, dist);
  float rr = 0.08 + 0.26 * h2;
  vec2 o = (vec2(h, h2) - 0.5) * 0.45;
  return (1.0 - smoothstep(rr - 0.05, rr, length(f - o))) * zone * step(0.88, h);
}

vec3 about(vec2 p, float aspect, float t, float g, float flood) {
  vec3 paper = vec3(0.958, 0.955, 0.95);
  paper *= 1.0 - 0.10 * dot(p, p);
  float hw = 0.5 * aspect;
  float ink = 0.0;
  float wash = 0.0;
  float w;
  float grow = mix(1.0, 3.2, flood * flood) * clamp(aspect * 1.15, 0.6, 1.0);
  float pt = step(aspect, 1.0);
  // blots hug the frame edges; the centre (quote) and lower right (narration) stay clear
  vec2 c1 = mix(vec2(-hw * 0.92, 0.36), vec2(-hw * 1.0, 0.40), pt);
  vec2 c2 = mix(vec2(hw * 0.97, 0.06), vec2(hw * 1.0, 0.24), pt);
  vec2 c3 = mix(vec2(hw * 0.6, 0.53), vec2(hw * 0.55, 0.54), pt);
  vec2 c4 = mix(vec2(-hw * 0.74, -0.5), vec2(-hw * 1.05, -0.06), pt);
  vec2 c5 = mix(vec2(-hw * 0.12, 0.6), vec2(hw * 1.0, -0.56), pt);
  vec2 c6 = mix(vec2(-hw * 0.22, -0.62), vec2(-hw * 0.3, 0.6), pt);
  ink = max(ink, blot(p, c1, 0.20 * grow, smoothstep(0.0, 0.55, g), 1.0, t, w)); wash = max(wash, w);
  ink = max(ink, blot(p, c2, 0.17 * grow, smoothstep(0.08, 0.7, g), 2.0, t, w)); wash = max(wash, w);
  ink = max(ink, blot(p, c3, 0.11 * grow, smoothstep(0.25, 0.85, g), 3.0, t, w)); wash = max(wash, w);
  ink = max(ink, blot(p, c4, 0.16 * grow, smoothstep(0.35, 0.95, g), 4.0, t, w)); wash = max(wash, w);
  ink = max(ink, blot(p, c5, 0.09 * grow, smoothstep(0.5, 1.0, g), 5.0, t, w)); wash = max(wash, w);
  ink = max(ink, blot(p, c6, 0.08 * grow, smoothstep(0.6, 1.0, g), 6.0, t, w)); wash = max(wash, w);
  ink = max(ink, spatter(p, c1, 0.20 * grow, smoothstep(0.0, 0.55, g), 1.0));
  ink = max(ink, spatter(p, c2, 0.17 * grow, smoothstep(0.08, 0.7, g), 2.0));
  ink = max(ink, spatter(p, c4, 0.16 * grow, smoothstep(0.35, 0.95, g), 4.0));

  // flood: one huge bleed rising from the bottom
  vec2 fq = (p - vec2(0.08, -0.95)) * vec2(0.75, 1.0);
  float fr = length(fq);
  float fa = atan(fq.y, fq.x);
  vec2 fd = vec2(cos(fa), sin(fa));
  float fR = flood * 2.1;
  float fdist = fr - fR * (0.7 + 0.45 * fbm(fq * 2.4 + 2.0) + 0.5 * pow(vnoise(fd * 8.0), 3.0));
  float fInk = 1.0 - smoothstep(-0.004, 0.008, fdist);
  wash = max(wash, (1.0 - smoothstep(0.0, 0.2, fdist)) * flood);

  float gran = 0.55 + 0.7 * fbm(p * 16.0);
  vec3 col = mix(paper, vec3(0.58, 0.58, 0.6), clamp(wash * 0.6 * gran, 0.0, 1.0));
  // pooled darker rim where wash meets paper
  col = mix(col, vec3(0.04, 0.04, 0.05), max(ink, fInk));
  return col;
}

// ---------------------------------------------------------------- WORK (veins live in a texture)
vec3 workBg(vec2 p, float t, float w) {
  vec3 col = VOID;
  float n = fbm(p * 2.2 + vec2(t * 0.015, 0.0));
  float n2 = fbm(p * 6.0 - vec2(0.0, t * 0.02) + 4.0);
  col += vec3(0.0, 0.035, 0.04) * smoothstep(0.42, 0.85, n) * (0.6 + 0.6 * n2);
  col += vec3(0.38, 0.04, 0.03) * w * 0.25 * exp(-length((p - vec2(0.0, 0.55)) * vec2(1.4, 0.7)) * 2.2);
  return col;
}

// ---------------------------------------------------------------- STACK (red flesh strata)
vec3 stackBg(vec2 p, float t, float flash) {
  vec2 q = vec2(p.x * 2.0, p.y * 7.5) + vec2(t * 0.05, 0.0);
  float warp = fbm3(q * vec2(0.5, 0.35) + vec2(0.0, t * 0.04));
  float n = fbm(q + vec2(warp * 2.2, warp * 0.6));
  float d = fbm3(q * 2.6 + 3.0 + warp);
  // cel-shaded flesh strata: shadow / mid / light
  vec3 c = vec3(0.26, 0.03, 0.03);
  c = mix(c, vec3(0.78, 0.2, 0.15), smoothstep(0.44, 0.46, n));
  c = mix(c, vec3(1.0, 0.4, 0.31), smoothstep(0.56, 0.58, n + (d - 0.5) * 0.3));
  float seam = 1.0 - smoothstep(0.0, 0.012, abs(n - 0.45 + (d - 0.5) * 0.05));
  c *= 1.0 - 0.75 * seam;
  // blue voids
  float hole = smoothstep(0.645, 0.655, fbm(p * vec2(2.6, 1.6) + vec2(4.0, t * 0.03)));
  c = mix(c, vec3(0.12, 0.36, 0.95) * (0.6 + 0.5 * d), hole);
  float dim = mix(0.2, 1.0, flash);
  return VOID + c * dim;
}

void main() {
  vec2 frag = vUv * uRes;
  float aspect = uRes.x / uRes.y;
  // height-normalised coords for most scenes
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  // min-dimension coords keep the vortex whole on portrait screens
  float m = min(uRes.x, uRes.y) * (aspect < 1.0 ? 1.18 : 1.0);
  vec2 ph = (frag - 0.5 * uRes) / m;
  float t = uTime;
  vec3 col;

  if (uScene < 0.5) {
    col = hero(ph, t, uZoom);
    if (uWipe > 0.001) {
      float mk = uReduced > 0.5 ? uWipe : burstMask(ph, uWipe, t);
      if (mk > 0.001) {
        vec3 a = about(p, aspect, t, 0.0, 0.0);
        // faint grey bloom just inside the burst edge
        float inner = uReduced > 0.5 ? 0.0 : (1.0 - burstMask(ph, uWipe * 0.9, t)) * 0.12;
        col = mix(col, a - inner, mk);
      }
    }
  } else if (uScene < 1.5) {
    if (uReduced > 0.5) {
      col = mix(about(p, aspect, t, uBlots, 0.0), VOID, uFlood);
    } else {
      col = about(p, aspect, t, uBlots, uFlood);
    }
  } else if (uScene < 2.5) {
    col = workBg(p, t, uWork);
    vec4 v = texture(uVeins, vec2(vUv.x, 1.0 - vUv.y));
    col = col * (1.0 - v.a) + v.rgb;
  } else if (uScene < 3.5) {
    col = stackBg(p, t, uFlash);
  } else {
    // outro: the vortex survives as an ember behind the handle
    vec3 ember = hero(ph * 1.25, t * 0.5, 0.0);
    col = VOID + ember * 0.07 * uOutro;
    col += vec3(0.5, 0.06, 0.04) * 0.1 * exp(-length((p - vec2(0.0, -0.75)) * vec2(0.8, 1.6)) * 2.0);
    col += vec3(1.0) * 0.035 * exp(-length(p * vec2(0.6, 2.2)) * 3.0) * uOutro;
  }

  outColor = vec4(col, 1.0);
}`;

export const POST_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTime;
uniform float uGlitch;
uniform float uBloom;
uniform float uCA;
uniform float uEdge;
uniform float uGrain;
uniform float uVig;
uniform float uLift;   // >0 for white scenes (no vignette crush)

${NOISE}

float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 uv = vUv;
  float frame = floor(uTime * 24.0);

  // block-row displacement on glitch hits
  if (uGlitch > 0.01) {
    float row = floor(uv.y * 26.0 + hash12(vec2(frame, 3.0)) * 8.0);
    float h = hash12(vec2(row, frame));
    if (h < 0.45 * uGlitch) uv.x += (hash12(vec2(row, frame + 7.0)) - 0.5) * 0.16 * uGlitch;
    float tear = step(0.92 - 0.1 * uGlitch, hash12(vec2(floor(uv.y * 90.0), frame)));
    uv.x += tear * 0.02 * uGlitch;
  }

  vec2 cdir = uv - 0.5;
  float ca = uCA + uGlitch * 0.018;
  vec2 off = cdir * ca + vec2(uGlitch * 0.006, 0.0);
  float r = texture(uScene, uv + off).r;
  vec3 mid = texture(uScene, uv).rgb;
  float b = texture(uScene, uv - off).b;
  vec3 col = vec3(r, mid.g, b);

  // directional edge glint: blue/violet light catching the upper-left of edges
  vec2 px = 2.0 / uRes;
  float l0 = lum(mid);
  float lA = lum(texture(uScene, uv + vec2(px.x, -px.y) * 1.5).rgb);
  float g = clamp((lA - l0) * 3.0, 0.0, 1.0);
  col += vec3(0.32, 0.38, 1.0) * g * uEdge;

  // bloom from mip taps
  vec3 bl = textureLod(uScene, uv, 2.0).rgb * 0.45
          + textureLod(uScene, uv, 4.0).rgb * 0.4
          + textureLod(uScene, uv, 6.0).rgb * 0.35;
  bl = max(bl - 0.28, 0.0);
  col += bl * uBloom;

  float v = dot(cdir, cdir);
  col *= mix(1.0 - uVig * v * 1.6, 1.0 - 0.25 * v, uLift);

  // grain
  float gr = hash12(uv * uRes + fract(uTime * 7.13) * 400.0) - 0.5;
  col += gr * uGrain;

  // scanline shimmer during glitch
  col *= 1.0 - uGlitch * 0.18 * step(0.5, fract(uv.y * uRes.y * 0.25));

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
