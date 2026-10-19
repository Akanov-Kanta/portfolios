# Review, round 2 (Reference): chapters 1–2 + shared systems

**Scope:**
- `src/styles/*`
- `src/app/globals.css` (above the `/* ch3-4 */` block)
- `src/components/fx/*`
- `src/components/art/Eye.tsx` and `eye-geometry.ts`
- `src/components/chapters/Intro.tsx` and `Title.tsx`

**Checks:** `npx tsc --noEmit` and `npx eslint` both pass with no output. Dev server: `next dev -p 3241`. No build and no commit.

**Shots** are in `reference/shots/round2-ref/` (git-ignored, local). They were captured at 960×720, the edit's own frame size, so pairs compare pixel for pixel. The `before/` set is the builder's round 1 and `after/` is this round. There are also `mobile/` (390×844, touch) and `reduced/` (`prefers-reduced-motion`) sets. Each set has:
- `intro_*s`: time after load
- `scroll_*vh`: scroll position
- `title_*ms`: time after reaching the title
- `title_exit_*`

Pairs are frame on the left, site on the right:

| Pair | What it compares |
|---|---|
| `pair_intro_t01.00_before.jpg` / `_after.jpg` | eye swarm |
| `pair_eye_zoom_before.jpg` / `_after.jpg` | one front eye vs the frame eye (x3) |
| `pair_f4_006_defocus.jpg` | intro defocus-out |
| `pair_d2.40_title_entry.jpg` | title entry (smear + streaks) |
| `pair_t06.50_dossier.jpg`, `pair_caption_tl_zoom.jpg` | typed caption vs `t_06.50` (in the builder's DOSSIER) |

Contact sheets: `_sheet_seq.jpg` (scroll 0.4→1.2 vh, then title entry and exit), `_sheet_mobile.jpg` (phone, then reduced motion).

## What changed

### 1. TypeCaption: `--p` system, 3-layer glow, scrubbing (`src/components/fx/TypeCaption.tsx`, `tokens.css .tc-*`)
- **One CSS variable drives everything.** `--p` (characters typed, a float) is set on the root. Each char span carries `--i`. CSS computes: a char cuts in at `dim` once `--p > --i`, holds for `lag·cps` chars, then ramps to 1 over `brighten·cps` chars. The glow clones' chars light up only as the core brightens, so the dim leading edge has no glow (measured in `t_06.50`: "OTHERS"). GSAP tweens a single number, with no per-char tweens and no SplitText.
- **Glow:** three blurred clones (`blur .26em / .82em + .077em stroke / 2.26em + .26em stroke`) under a sharp core. This is the calibrated stack from round 1, now in em so it scales with the caption. On phones (≤767px) the two wide clones are dropped and a cheaper text-shadow bloom is used.
- **Tones:** `light` (default) is #f0f0f0 at weight 400 with bloom. `dark` is `--caption-ink` #222 at weight 500 with a soft dark halo.
- **Tokens:** line-height **1.26**, tracking **+0.035em**, `--caption-size: clamp(12px, calc(0.55vw + 1.1vh), 20px)`. `next/font` now uses `display: "block"`.
- **API kept:** props `label/lines/trigger/start/cps/dim/brighten/lag/tone/className/style/onComplete`; ref `play/reset/hide/timeline`; exported `typeOn()`.
- **API added:**
  - `trigger="scrub"` with `scrub={{ trigger?, start?, end?, smooth? }}`
  - `ref.setProgress(0..1)` and `ref.progress()`
  - `glow` prop
  - The full API is documented at the top of the file.
- **Fixed** a reset bug that was present in round 1 too. `reset()` and `setProgress()` now always re-apply `--p`. GSAP's `pause(0)` suppresses `onUpdate`, so a replayed caption used to stay fully visible until it re-typed (see `before/title_*`).
- The builder's `Dossier.tsx` already feature-detects `setProgress`, so its scrubbed steps now work. `after/later_3.0vh.png` shows "THE SUBJECT:" mid-type with the dim edge.
- **Reduced motion:** CSS forces `--p: 100000`, so captions are fully visible and static. The old `data-ready` visibility guard is gone; nothing flashes, because `--p` starts at 0.

### 2. Grain / post layer (`Grain.tsx`, `globals.css .fx-grain`, `FxLayer.tsx`)
- The noise tile is generated once in JS and set as `--noise`. A 200% layer jumps through 8 offsets with `steps(1)` (CSS animation at ~10 fps) instead of a `setInterval`, so there is no per-frame JS.
- **Blend changed to `overlay`.** Round 1's normal-blend grain lifted pure black to mean 6.4/255 with a standard deviation of 5.7, and the screen read grey. The edit's flat blacks measure 0.1/255 with a standard deviation of 0.4. Overlay leaves #000 untouched (now 0.0) and puts texture on mid-tones: irises, the burst, photos. `--grain-opacity: .22`.
- `FxLayer` now also mounts `EyeDefs` (iris gradient and eye bloom), so `<Eye>` works in any chapter. The builder's Drop and Dossier use it.
- There is still no `filter` on any wrapper in the post layer. The vignette is unchanged and checked: fine on black.

### 3. Eyes (`eye-geometry.ts`, `Eye.tsx`, `Intro.tsx`)
- **Sketchier geometry:**
  - The upper lid is now five pen passes with low-frequency hand wobble and overshoot: one heavy, a second lid line set ~5 units off, and partial passes.
  - The lower lid has three passes plus a two-line under-eye band with 11–16 hatch strokes (the frame's "teeth").
  - Hooked inner corner; 24–30 longer tapered lashes plus 22–30 fine hair strokes; drooping outer-corner lashes; lower lashes hang from the band.
- **Iris:** a larger mid-grey iris (#c8 → #5e) set high so the lid cuts it. Two interleaved wobbling spirals (light and dark), dashed rings, and a light-grey pupil instead of the round-1 white target.
- **Bloom:** new `#eye-glow`, with tight 1.6 + 3.5 blurs stacked over a 16-unit halo. Front eyes also get a static radial light pool behind them, which costs nothing per frame. This is the frame's halo.
- **`variant="ghost"`** (lines only, no fills) is used for the huge dim eye and two far eyes. They read as pencil under-drawing, like the frame. The back tier blur dropped from 7 to 3.5 px so outlines survive.
- **Blinks:** `scaleY 1→.06` (70 ms), hold, then →1 (130 ms), every 2.5–7 s per eye, double-blink 18 % of the time. Front and mid eyes only. Verified: 57 blink frames in 6 s.
- **Iris tracking:** `gsap.quickTo`, with the look vector rotated by each eye's static tilt plus its current drift rotation, so "left" is left on screen.
- **Idle glances:** on touch, and on desktop after 3.5 s without pointer movement, all eyes glance together every 1.4–3.4 s (25 % of the time back to centre). Verified on iPhone 13 emulation: irises are offset after 5 s idle. Cursor checks: bottom-left gives (−3…−10, +3…+6) and top-right gives (+7…+11, −1…−4).

### 4. Intro → Title
- **Black gap killed.** The intro now pins for exactly its own height (`end: +=offsetHeight`), and the defocus-out happens *inside* the pin:
  - 0.50–0.72: front tier dims to .35
  - 0.50–0.85: blur 0 → 12 px
  - 0.80–1.00: fade to black
- `Title` has `.title-overlap` (`margin-top: -100svh`, motion only), so it starts exactly where the intro's pin releases. Its background is now transparent.
- **Streak hand-off:** streaks start at title "top 22%", which falls during the defocus (`scroll_0.8vh`). The name pops at "top 4%". Before: 1.4–1.6 vh of empty screen. After: none (`_sheet_seq.jpg`).
- **Title entry smear:** the name arrives with an x-only gaussian blur (`stdDeviation 18 → 0`) and `xPercent −4 → 0` while glyphs pop at 60 ms (`title_100ms`, `pair_d2.40_title_entry.jpg`). The exit smear is unchanged (now `fromTo`, so entry and exit don't fight over `smear.v`).
- **Streaks per `d_2.40`.** Measured in the frame: 3–6 px FWHM at 960 px, peak ~100–125/255, plus soft 15–20 px bands, 20–70 % of the width. Now:
  - lines are 3–6 px × (vw/960), with a soft glow `box-shadow`
  - 18 % are 12–20 px blurred bands at opacity .25–.4
  - shapes are tapered at both ends (`border-radius: 50%`)
  - they cross in 0.18–0.34 s, fired in bursts of 2–4 on the beat (`--bpm` 104), with a stray streak on 55 % of off-beats
  - there are 28 pooled elements

## Before → after (key numbers)

| Check | Before | After | Frame |
|---|---|---|---|
| Flat black luminance (mean / std) | 6.4 / 5.7 | 0.0 / 0.0 | 0.1 / 0.4 |
| Empty screen between intro and title | ~0.6 vh of scroll | none | n/a (hard cut) |
| Caption line-height / tracking | 1.5 / 0.1em | 1.26 / 0.035em | 1.26 / 0.035em |
| Caption glow falloff | text-shadow 4/10 px | calibrated 3-layer bloom | `t_06.50` |
| Eye construction | clean almond, white-target iris | multi-pass sketch, hatched band, grey spiral iris | `t_01.00` |
| Iris behaviour | cursor only, ignores tilt | tilt-aware cursor + idle glances + blinks | n/a |

## Remaining deltas (next round)
1. **Caption scale at 960×720 is smaller than the frame.** The clamp gives 13.2 px there, while the frame caption is 19.5 px (2.7 vh). That was deliberate for desktop (17.8 px at 1440×900) so captions stay "tiny" on a big screen. If we want TikTok-faithful proportions, raise the vh term to about `calc(0.4vw + 1.6vh)` (22 px at 1440×900). Owner's call. See `pair_caption_tl_zoom.jpg`: proportions and glow shape match, only the scale differs.
2. **Eye vs `t_01.00`.**
   - The frame's interior has more grey haze, and its shapes are more irregular (asymmetric almonds, a sharper inner corner); ours are still fairly symmetric.
   - The frame's lashes are fewer, longer and brighter at the base.
   - A per-eye random skew or squash of the almond would help.
   - The frame swarm also clusters bright eyes on the left half; ours is spread more evenly. Composition is the builder's, unchanged.
3. **The giant ghost eye** is a bit too legible (crisp spiral). The frame's giant eye is dimmer and softer. Try mid-layer opacity .25 and blur 1.5 px for the giant only.
4. **Title glyphs.** `d_2.40`'s glyphs are fat, glossy, extruded blobs; ours are Quicksand 300 hairlines. The smear sells the motion, but a pseudo-extrusion stack (web-refs T9) would get closer during the entry beat only.
5. **Streak curvature.** The frame's streaks bend slightly. Ours are straight with ±1.2° rotation. An SVG path version would cover that, but it's low priority.
6. **Vignette on light grounds** (for the builder's inverted chapters). `--vignette` darkens the edges to 78 % black. The frame's white sections (`d_8.60`) have no dark edges, so drop or invert the vignette in the INVERT state.
7. **Seen in the dev log (builder's code):** `GSAP target #fx-flash not found` from `Drop.tsx:56`. `flash()` resolves the element at call time, so it is being called before FxLayer's DOM exists, probably at timeline-build time in an effect that runs before the layout's FxLayer commits. Resolve lazily (e.g. `tl.call(() => flash())`) or move FxLayer above `{children}` in the layout. The layout is not a Reference file.

## Verification
- **Desktop at 960×720 and mobile at 390×844:** no page errors or console errors (`*/errors.txt` empty).
- **Reduced motion:** intro static, title and caption fully visible, no pin and no overlap (`reduced/*`).
- **Phones:** the composition holds; streaks scale down (k ≥ .55); captions use the 1-layer glow fallback.
