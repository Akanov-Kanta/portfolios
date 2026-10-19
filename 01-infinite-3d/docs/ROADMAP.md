# Roadmap — making it more visually appealing

Ordered by impact-to-effort. Each item keeps the non-negotiables in `CONTEXT.md`
(accessibility, reduced-motion, no-WebGL fallback, perf budget). Nothing here should push
three.js into the first-load bundle or drop below ~55 fps on integrated GPUs.

## Tier 1 — biggest visual wins, low/medium effort

- [x] **Lighting & mood pass on the room.** The room reads a bit flat. Add: a soft key/rim on the
      hero object, gentle contact shadows under furniture (baked AO texture or a cheap blurred
      shadow-catcher plane, not real-time shadow maps), and a warmer lamp bloom. Goal: the hero
      frame should look like a rendered still, not a game asset. Done (web-research build): moon rim, lamp glow 0.8, blob contact shadows (`ContactShadows.tsx`).
- [x] **Volumetric light shafts** through the window (screen-space god-rays or a couple of additive
      cone meshes) + drifting fog layers. This is the single biggest "premium" cue igloo has. Done: `LightShafts.tsx` cones, floor mist in the fog chunks, `SmokeRibbons.tsx`.
- [x] **Post-processing polish.** Add subtle film grain, a slow vignette breathing, and depth-of-field
      that focuses the current station (drei `Bloom` is in; add `DepthOfField` on high tier only, or
      fake it with a radial blur so it stays cheap). Tune bloom threshold per scene. Done except DoF: `GradeEffect` grain + breathing vignette; bloom threshold follows the mood.
- [x] **Color grade / LUT per station.** igloo shifts the palette between scenes. Give each station a
      subtle grade (warm room → cold void → electric server room) via a cheap tone/curve in the
      composite. Keeps the journey feeling like distinct "rooms". Done: `theme.MOODS` interpolated along the lap, applied by `Atmosphere` + `GradeEffect`.
- [x] **Richer transitions.** The GlitchCut is good; add per-boundary variety — e.g. an ice/frost wipe
      into projects, a light-speed streak into the portal, a "materialize from particles" into the
      server room. Drive intensity from scroll velocity so flicks feel powerful. Done: one flavour per boundary in `GlitchCutEffect` (glitch / frost / streak / blocks).

## Tier 2 — scene content & interactivity

- [ ] **Real project screenshots** on the device screens (drop `public/projects/<slug>.webp`) with a
      subtle scanline/CRT shader and a parallax hover. Right now they're procedural cards.
- [ ] **Hover/pointer reactivity everywhere.** Devices tilt toward the cursor; the hero monitors'
      "code" reacts to the pointer; gate particles already scatter — extend that language. Partial: cursor states, magnetic controls, hover replay; device tilt still open.
- [ ] **Constellation / product-star moment.** igloo has a strong "look up" beat. Add a brief camera
      tilt to a star field with the project names as a constellation between projects and contact.
- [x] **Footer object.** Done as igloo's orb logo: cursor push with a wake, morph between platforms.
      Next: a per-orb spring so pushed orbs overshoot on return (needs a CPU or GPGPU sim), and a
      soft contact shadow of the solid on the plinth.
- [ ] **Anchored labels with live data** feel — typewriter reveal, occasional glitch, and connect more
      of them (desk items, portal rings, each project's tech). Partial: typewriter + glitch done; more anchors still open.

## Tier 3 — typography, HUD, identity

- [ ] **Hero typography treatment.** Bigger, more designed name lockup; a tagline that scrambles in;
      maybe a thin animated underline or a masked reveal. This is the first thing visitors judge.
- [x] **HUD refinement.** Turn the corner HUD into a cohesive system: a live "system status" line, a
      minimap of the lap, a station progress bar that fills as you scroll, consistent bracket motifs. Done: `LapMap`, `StatusLine`, `Odometer`, `//` and `[ ]` grammar.
- [x] **A real logo / monogram** for `nazarakanov` (currently plain text) + a matching favicon set and
      OG image (render the hero to a static share image). Done: `Monogram.tsx`, `icon.svg`, `opengraph-image.tsx`.
- [x] **Loading choreography.** The ASCII loader works; make the reveal more theatrical (letters of the
      name assemble, HUD boots up module by module). Done: loader letters over the H1, HUD boot module by module.

## Tier 4 — sound, motion feel, extras

- [x] **Better ambient audio.** Layer per-station beds (room tone, void hum, server whirr), a soft
      "whoosh" on transitions, and a UI tick on the carousel. Keep it off by default and gesture-gated. Done: four crossfaded beds + sfx-bus one-shots (`audio/sfx.ts`).
- [x] **Scroll feel.** Tune Lenis lerp/velocity and the runaway clamp so flicks feel weighty; add a
      tiny rubber-band at the very top/bottom on touch. Done except the touch rubber-band: lerp 0.075 + a second smoothing stage, `--vel`.
- [x] **Level-2 "ice cut" transition** (igloo's dual-render-target diagonal cut) on the high tier only,
      as a stretch — render two camera poses to FBOs and composite. Done on high tier, about->projects only (`IceCutRender.tsx`).
- [x] **Cursor-following light** in the void so moving the mouse subtly relights nearby particles. Done: `CursorLight.tsx`, tinted by the mood accent.

## Tier 5 — content depth

- [ ] Project detail pages (`/projects/[slug]`) get their own mini 3D moment and richer layout.
- [ ] An "about" beat with a photo/portrait integrated into the room (framed picture that fills in).
- [ ] i18n if needed (EN + KK), since the DOM-first architecture already supports it.

## Guardrails while polishing
- Re-run `scripts/world-perf.mjs` after each visual change — hold ≥55 fps on integrated GPU, 0 long tasks.
- Re-run `scripts/loop-probe.mjs` (seam < 1%), `scripts/a11y-probe.mjs` (0 serious violations),
  and `scripts/modes-probe.mjs` (reduced-motion / touch / no-WebGL) before shipping.
- Every new effect needs a reduced-motion path and must not appear in the first-load JS bundle.
