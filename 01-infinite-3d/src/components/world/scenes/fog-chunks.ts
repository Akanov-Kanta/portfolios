import { ShaderChunk, ShaderLib } from "three";

/**
 * igloo-style atmospheric fog for every built-in material, installed once by overriding three's
 * fog ShaderChunks (Canvas onCreated, before Warmup compiles anything):
 *   density = linear(near, far) distance term
 *           + mist · height falloff below the station floor y0 · (0.75 + 0.25 · value noise)
 *   colour  = mix(fog, fogHigh, pow((sx + sy) / 2, 2))   (screen-space diagonal, igloo's gradient)
 *
 * The extra uniforms are plain {x,y,z(,w)} objects shared BY REFERENCE: three's cloneUniforms only
 * deep-copies Color/Vector/Texture instances, so every material's program reads these same objects
 * and the MoodDriver updates them once per frame without touching materials.
 */
export const fogShared = {
  /** fogHigh, linear working space */
  high: { x: 0, y: 0, z: 0 },
  /** x mist, y time (s, frozen in static/freeze), z y0 (floor the mist hugs), w noise on (0/1) */
  params: { x: 0, y: 0, z: 0, w: 1 },
  /** drawing-buffer size in px (gl_FragCoord space) */
  res: { x: 1, y: 1 },
};

/** For a custom ShaderMaterial with `fog: true` that includes the fog chunks: spread into its uniforms. */
export const fogUniforms = () => ({
  uFogHigh: { value: fogShared.high },
  uFogP: { value: fogShared.params },
  uFogRes: { value: fogShared.res },
});

const PARS_VERTEX = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorldPos;
#endif
`;

// view matrices are rigid: world = R^T · view + cameraPosition. Works for every shader
// (instanced, points, sprites) because it only needs mvPosition.
const VERTEX = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorldPos = cameraPosition + transpose( mat3( viewMatrix ) ) * mvPosition.xyz;
#endif
`;

const PARS_FRAGMENT = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform vec3 uFogHigh;
  uniform vec4 uFogP;
  uniform vec2 uFogRes;
  varying float vFogDepth;
  varying vec3 vFogWorldPos;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  float fogHash( vec3 p ) {
    p = fract( p * 0.3183099 + 0.1 );
    p *= 17.0;
    return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
  }
  float fogNoise( vec3 x ) {
    vec3 i = floor( x ), f = fract( x );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix(
      mix( mix( fogHash( i ), fogHash( i + vec3( 1, 0, 0 ) ), f.x ), mix( fogHash( i + vec3( 0, 1, 0 ) ), fogHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
      mix( mix( fogHash( i + vec3( 0, 0, 1 ) ), fogHash( i + vec3( 1, 0, 1 ) ), f.x ), mix( fogHash( i + vec3( 0, 1, 1 ) ), fogHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ),
      f.z );
  }
#endif
`;

const FRAGMENT = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = clamp( ( vFogDepth - fogNear ) / max( fogFar - fogNear, 1e-3 ), 0.0, 1.0 );
  #endif
  float fogN = 0.875;
  if ( uFogP.w > 0.5 ) fogN = 0.75 + 0.25 * fogNoise( vFogWorldPos * 0.15 + uFogP.y * 0.02 );
  float fogMist = uFogP.x * exp( - max( vFogWorldPos.y - uFogP.z, 0.0 ) * 0.9 ) * fogN * ( 1.0 - exp( - vFogDepth * 0.08 ) );
  fogFactor = clamp( fogFactor + fogMist * ( 1.0 - fogFactor ), 0.0, 1.0 );
  vec2 fogS = gl_FragCoord.xy / max( uFogRes, vec2( 1.0 ) );
  float fogD = clamp( ( fogS.x + fogS.y ) * 0.5, 0.0, 1.0 );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, mix( fogColor, uFogHigh, fogD * fogD ), fogFactor );
#endif
`;

let installed = false;

/** Idempotent. Must run before the first program compiles (programs bake the chunk source in). */
export function installFogChunks(): void {
  if (installed) return;
  installed = true;
  ShaderChunk.fog_pars_vertex = PARS_VERTEX;
  ShaderChunk.fog_vertex = VERTEX;
  ShaderChunk.fog_pars_fragment = PARS_FRAGMENT;
  ShaderChunk.fog_fragment = FRAGMENT;
  // every built-in material that supports fog gets the shared uniforms (cloned per material by
  // reference, see fogShared)
  for (const shader of Object.values(ShaderLib) as { uniforms: Record<string, { value: unknown }> }[]) {
    if (shader.uniforms && "fogColor" in shader.uniforms) Object.assign(shader.uniforms, fogUniforms());
  }
}
