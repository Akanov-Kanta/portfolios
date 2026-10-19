# Web references and techniques for DOSSIER

Owner: Reference agent, round 1. Read this together with `reference/style-spec.md` (frames) and `docs/PLAN.md` (chapters).

All captures live under `reference/web/`, which is git-ignored (local only). Each site folder contains:

| File | What it is |
|---|---|
| `intro_0..5.jpg` | First ~3 s after load (motion sequence, 400 ms apart), 1440x900 |
| `desk_0.jpg`, `desk_N.jpg` | After the loader settles, then after each ~900 px of wheel scroll. `desk_N_mid.jpg` is taken 350 ms into the scroll, so it shows motion in progress. |
| `mobile_0..2.jpg` | 390x844 (iPhone 13 UA) |
| `report.json` | Computed text styles (family, size, weight, tracking, color, text-shadow), loaded fonts, canvases (webgl or 2d), blend modes, masks, CSS filters, script URLs, and library keyword hits in the bundles |

Contact sheets are in `reference/web/_probe/sheet_<slug>.jpg`, and post-entry sequences for the click-gated sites are in `i_<slug>.jpg`. The scripts that produced everything are in `reference/web/_scripts/` (`capture.mjs`, `interact.mjs`, `fonts.mjs`, `glow.mjs`, …), so any capture can be re-run with `node reference/web/_scripts/capture.mjs <slug> <url>`.

Verified prototypes (open them in a browser) are in `reference/proto/`:
- `caption.html`: the typewriter caption plus glow, calibrated against `t_06.50`. See `caption_sequence.png`.
- `eye.html`: the procedural spiral-iris eye. See `eye_compare.png`.
- `burst.html`: the procedural feathered ink burst on canvas. See `burst_compare.png`.
- `glow_test.html` and `glow_compare.png`: the glow calibration.

Library notes below come from keyword hits in the downloaded bundles, so treat them as indicative. "gsap" or "three" in a vendor bundle is reliable. Short tokens such as "ogl" and "Tone" give false positives.

---

## 0. Verdicts first

### Font: **Quicksand**, confirmed (with corrected metrics)

Method: I rendered 24 candidates in Playwright. Each was set so its cap height matched the frame (12.5 px at 960 px width, x3). I then solved for the letter-spacing that reproduces the measured width of the line "IT HIDES THE DEVIL BENEATH THE WOMAN." (386 px). After that I compared glyphs at x6 zoom with a matching blur. Outputs:
- `reference/web/fonts/compare_all.png`
- `compare_shortlist.png`
- `compare_zoom.png`
- `compare_human.png`
- `metrics.json`

- **Quicksand** matches the glyph construction. M has vertical stems with the vertex down at the baseline. R's leg leaves straight from the bowl. O is circular, A is pointed, W has its middle apex at full height, and the "?" is round. It also hits the measured width with a natural **+0.035em** tracking. At the same width, "HUMAN FORM." comes out at 770 px versus 775 px in the frame (x6 crop).
- **Glacial Indifference** (the usual edit font, OFL, downloaded to `fonts/_dl_glacial/` for this test) is ruled out. Its M is splayed, with a pointed vertex dipping below the baseline. The frame's M has vertical stems.
- Questrial and Josefin Sans 400 are too heavy and too tight (they need ~0 tracking). Didact Gothic and Jost read too loose and too narrow. Comfortaa is too round, with a single-storey look.

**Tokens (measured on `t_06.50`, then translated to the web):**

| Use | Family / weight | Size | Tracking | Line-height | Color |
|---|---|---|---|---|---|
| Caption on dark (TL block) | Quicksand **400** + glow stack (§T2) | 19.5 px at 960 px wide. Web: `clamp(12px, calc(0.55vw + 1.1vh), 20px)`, which gives ≈17.8 px at 1440x900 and 12 px on phones | `0.035em` | **1.26** (24.5 px pitch at 19.5 px) | `#F0F0F0` |
| Caption on light (BR block on the burst) | Quicksand **500**, no glow, soft dark halo `0 0 6px rgba(0,0,0,.25)` | 17.9 px at 960 px wide (same clamp) | `0.035em` | 1.26 (22.5 px pitch) | `#1A1A1A`–`#2E2E2E` (measured core ≈ #2D2D2D) |
| Statement word "HUMAN?" | Quicksand **400** (300 also works) | cap ≈ 11 % of vh → `clamp(56px, 15vh, 160px)` | `0.04em` | 1 | `#3A3A3A` at 85 %, `filter: blur(.6px)` |
| Watermark / end-card handle | Quicksand 400 + glow | watermark `clamp(11px, 1.1vw, 16px)` at 40 % opacity. End card `clamp(18px, 2.4vw, 34px)` | `0.06em` | 1 | `#F0F0F0` |

> **Correction to style-spec §4.** The measured line-height is about **1.26**, not 1.45. The frame's "cap 13–15 px" is cap height, not font-size, so the font-size is about cap ÷ 0.70.
>
> Quicksand has no `ˋ ˊ` (U+02CB/02CA), and the fallback looks wrong. Draw the skewed quote ticks as `::before`/`::after` bars: 0.30em × 0.07em, `rotate(±18deg)`, top aligned to cap height.

**Loading.** Use `next/font/google` → `Quicksand({ subsets:['latin'], weight:['300','400','500'], display:'block' })`. Use `display: block` (not `swap`) so the typewriter never reflows mid-type.

**Dim characters (the leading edge).** Measured in the frame, "OTHERS" peaks at 195/255 while bright text peaks at 255, and the dim characters carry roughly a third of the glow pixels. So the dim stage is about **opacity 0.55–0.6 with no glow**, and the glow arrives only as the character brightens. The spec's "35 %" is fine as the *first* frame. Ramp from 0.35 through ~0.6 to 1.

### Top references (ranked by usefulness)

1. **Black Dog**: https://blackdogstory.com. Black→white polarity flip, plus an ink blob that grows on scroll into a text window. This is the closest live analogue to "burst-as-mask" and to the INVERT chapter.
2. **homunculus Inc.**: https://homunculus.jp. Grayscale WebGL, an "Enter with Sound / without Sound" gate, tiny captions on a hairline, a ring-glyph grid like the eye swarm, and readable shaders (grain, tilt-shift blur, mask warp).
3. **Bizarro (Luis Henrique)**: https://www.lhbzr.com. A string-art **spiral iris** on pure black, glowing hairline type, and a `mix-blend-mode: difference` cursor. This is the eye-motif reference.
4. **Aristide Benoist**: https://aristidebenoist.com. Grayscale horizontal image **strips** (the evidence-strip grammar), tiny two-line uppercase corner captions, and a 001→100 counter loader.
5. **Trip in the dark**: https://tripinthedark.ru/en. A blinking-eye loader, a "use headphones" gate, letter-by-letter title reveal, and circle mask windows on #161616.

Also captured: Chainsaw Man portal (ink splatter, tilted frame), Peter Lindbergh/Obys (grain, grayscale editorial), Lumon (CRT glow text), ertdfgcvb (mono ASCII, scramble type-on), Look Back (manga-panel strips), and the Codrops Dithering Shader (photo → 1-bit).

---

## 1. Reference sites

### 1.1 Black Dog (검은 개): https://blackdogstory.com
Screens: `web/blackdogstory/` (`hold_*`, `after_*` = entry sequence; `scroll_*` = story). Sheet: `_probe/i_blackdog.jpg`.
- **What it does:** It opens on pure black #000 with a thin serif title and a small concentric-ring button ("CLICK"). Clicking dissolves the title into noise (`after_02`), then the page **flips to white**. A single black dot sits at the centre. On scroll the dot grows into a **wobbly ink blob (metaball)** and becomes a **window**: the story text appears inside the blob, white on black, while the page stays white (`scroll_3`, `scroll_5`). A one-line English subtitle sits bottom-centre in grey, about 9 px.
- **Tech:** a webgl2 full-screen canvas, with GSAP + ScrollTrigger and three.js strings in the vendor bundle. Font: Roboto Slab. CSS keyframes `scaleOut 3s infinite` (ring pulse) and `fadeInOut 1s alternate`.
- **Borrow:**
  - (a) The **polarity flip as a hard cut** on entry, the exact grammar of INVERT (ch. 5).
  - (b) **Mask growth tied to scroll** (scrub) with a noisy edge. Our burst should do the same with `mask-size` scrubbed from 30 % to 110 %.
  - (c) The ring-pulse "click" affordance, for the SOUND ON toggle (ring `scale 1→1.6`, `opacity .6→0`, 3 s, three staggered rings 1 s apart).
  - (d) Subtitles as tiny grey bottom-centre lines, the mobile fallback for captions.

### 1.2 homunculus Inc.: https://homunculus.jp
Screens: `web/homunculus/` (`enter_*`, `scroll_*`). Sheet: `_probe/i_homu.jpg`.
- **What it does:** A thin 32 px progress bar on #111, then a **sound gate**: "homunculus Inc." / white pill "Enter" / "with Sound", plus underlined "without Sound" lower down. Faint glowing arcs (a ring) drift around the gate. After entry, a grayscale WebGL head fades up from black (~1.5 s). Behind it sits a **grid of hiragana inside dim rings** (eye-swarm-like), randomly cycling. A hairline rule runs across the vertical centre with tiny labels ("Policy #1", "Attitude #2", with superscript numbers). Other elements: a circular "Inside" button bottom-right and a tiny "Sound" label bottom-left.
- **Tech:**
  - Custom WebGL with readable shader files in `/assets/shader/*.js`, Howler (global), and GSAP + ScrollTrigger + Splitting strings.
  - Images use `filter: grayscale(.9)`.
  - `mask-image: url(detailMask.webp)` for detail panels.
  - Type: Google Sans 10.5–16 px, tracking 0.3 px (≈0.02em), white.
  - `display_frg.js` is worth reading:
    - grain = `color -= noiseTex(uv*.4).r * 0.16`
    - **tilt-shift**: `mix(sharp, blurred, clamp(abs(uv.y-.5)*2.5,0,1))`
    - **mask-driven radial warp transition**: uv pulled toward `center(0.5,0.7)` by `maskTex.r * 0.6`
    - a tiny RGB offset that we would drop, since we are grayscale.
- **Borrow:**
  - (a) The **"ENTER WITH SOUND / WITHOUT SOUND" gate** pattern for chapter 1. It solves the autoplay rule, because the AudioContext is created on that click.
  - (b) **Labels on a hairline**: `font-size 11px; letter-spacing .03em; border-top 1px solid rgba(240,240,240,.25)`, with superscript `#1` at 0.7em. Good for project indices in DOSSIER.
  - (c) **Edge blur** (top and bottom 20 % softly blurred) to make the stage feel filmed.
  - (d) The **radial mask warp** as the drop transition (shader idea, §T7).

### 1.3 Bizarro / Luis Henrique Bizarro: https://www.lhbzr.com
Screens: `web/lhbzr/`. Sheet: `_probe/sheet_lhbzr.jpg`. A desktop Chrome UA is required, otherwise you get "Unsupported Browser".
- **What it does:** On pure black, a **string-art iris** of ~120 white hairlines forms a twisted ring (a rotating polygon of chords) around a dark pupil disc. The intro assembles it from scattered triangles (`intro_0`) into the ring (`intro_3`) in ~1.5 s. A thin vertical "LHBZR" logotype sits inside. Small nav labels hang on hairline brackets left and right. A dot-grid background is barely visible. The cursor is a **10 px white disc with `mix-blend-mode: difference`**.
- **Tech:** a WebGL canvas, three.js + GSAP + ScrollTrigger strings, font "Borda" 14 px.
- **Borrow:**
  - (a) The **line-art ring construction**. Our spiral iris can add an outer ring of 60–120 chords (lines from angle θ to θ+k) at 0.08 opacity for the "hypnotic" depth. This is cheap in SVG or canvas.
  - (b) The **difference cursor**: `.cursor{width:10px;height:10px;border-radius:50%;background:#F0F0F0;mix-blend-mode:difference;pointer-events:none;position:fixed;transform:translate(-50%,-50%)}`.
  - (c) The intro "assemble from shards" motion, useful for the eye swarm fade-in.

### 1.4 Aristide Benoist: https://aristidebenoist.com
Screens: `web/aristidebenoist/`. Sheet: `_probe/sheet_aristidebenoist.jpg`.
- **What it does:**
  - A loader counter "001 → 100" sits top-left in a condensed face; the bar fills, then hard-cuts.
  - The home view is a horizontal **row of tall grayscale image slices** in WebGL. They drift and parallax on wheel, and individual slices flash to colour on hover (we stay gray).
  - Corner captions: bottom-left "INDEPENDENT DEVELOPER / AVAILABLE APR 2023" (two lines, uppercase), and bottom-right "EMAIL / INSTAGRAM / TWITTER".
- **Type:** custom "jws" font at 10–12 px, tracking 0–0.2 px, colour `rgb(186,196,184)` (a slightly green grey; we use pure #B7B7B7). Line-height is ~1.0, very tight.
- **Borrow:**
  - (a) **Two-line uppercase corner captions** at 10–12 px are the exact frame grammar. Use them for chapter metadata ("FILE 03 / NISCOURSES", bottom-left).
  - (b) **Strip as a sequence of slices**: when the evidence strip swaps content, cut it into 8–12 vertical slices that swap on a 20 ms stagger. That reads as a "hard swap" but feels designed.
  - (c) A **counter loader** in the INTRO before the eyes appear ("000"→"100" in Quicksand 400 11 px, top-left, glowing).

### 1.5 Trip in the dark: https://tripinthedark.ru/en
Screens: `web/tripinthedark/` (`hold_*`, `enter_*`, `scroll_*`). Sheet: `_probe/i_trip.jpg`. You must press the big white "proceed" circle to enter.
- **What it does:**
  - A small white **almond eye that blinks** (the lid closes to a line, `desk_1`) sits on #161616.
  - Tiny centred copy: "experience" (white, 10 px, 500), then "use headphones / for better experience" (grey #6E6E6E, 9 px).
  - A white disc "proceed" rises from the bottom edge.
  - After entry, dots drift, then the title "trip / in / the / dark" **types letter by letter** ("tri…" in `enter_09`) in a bold geometric sans scattered on a loose grid.
  - A **circle mask window** reveals a single-line face drawing.
- **Tech:** three.js + Howler globals, SVG `mask: url(#mask-N)` on many elements (circle windows), font "TT Norms" 500.
- **Borrow:**
  - (a) The **blinking eye loader**: scaleY of the lid `1 → .08 → 1` over 160 ms every 2.5–4 s at random. Give our swarm eyes an occasional blink (not in the edit, but it sells "watching").
  - (b) "use headphones" micro copy under the SOUND toggle: grey #6E6E6E, 10–11 px, two lines.
  - (c) SVG `<mask>` circles for the strip/burst windows when `mask-image` with a data URL isn't enough.

### 1.6 Chainsaw Man official portal: https://chainsawman.dog
Screens: `web/chainsawman-dog/`. Sheet: `_probe/sheet_chainsawman-dog.jpg`. Colour content; we take only structure and texture.
- **What it does:**
  - A black page with **grey ink-splatter texture** (big spray blots at ~15–25 % grey) and a dot-screen pattern (`bg_dots.svg`).
  - A **tilted column of key visuals** (rotated ~4°, hard edges, black corners exposed) auto-cycles vertically. This matches the edit's scene-4 "tilted frame" exactly.
  - The title is condensed caps (Oswald 500 ≈ 40 px) with a dimmed sub-title in outline.
  - Round "MOVIE >" disc button. Mobile keeps the tilted column full-height.
- **Tech:** jQuery + Swiper, static PNG/SVG textures, `mask-image` for icon tinting. No WebGL.
- **Borrow:**
  - (a) The **tilted hard-edged frame on black** for the scene-4 style transition inside DROP: `transform: rotate(-4deg) scale(.9)` with a black stage, and shake on top.
  - (b) **Dot-screen texture** at 4–6 % as a second grain layer on light (inverted) sections. Halftone dots read "manga" instantly.
  - (c) The splatter texture idea, done procedurally with the burst generator at low alpha (§T4).

### 1.7 Peter Lindbergh (Obys): https://peterlindbergh.obys.agency
Screens: `web/peterlindbergh-obys/`. Sheet: `_probe/sheet_peterlindbergh-obys.jpg`. Built on Readymag.
- **What it does:**
  - A loader of huge thin serif caps "PETER / LINDBERGH" with "LOADING— / 1944—2007…2019" ticking: the year counter is the progress readout.
  - The page sits on a **dark warm grey (#2B2B2B) with visible film grain**. Grayscale photos drop in at different sizes and scroll speeds (parallax 0.8–1.2). Giant caps slide horizontally across the screen on scroll (`desk_3`, `desk_4`).
  - Nav is 9 px uppercase, weight 300.
- **Borrow:**
  - (a) **Counter as narrative** ("FILE 001→003", or years "2019→2026") in the DOSSIER chapter header.
  - (b) **Grain over flat grey** proves the 4–6 % grain level reads fine on large flat areas.
  - (c) **Photo parallax mix** (one big, two small offset, at different speeds), if owner photos exist.

### 1.8 Lumon Industries (MDR terminal): https://lumon-industries.com
Screens: `web/lumon/`. Sheet: `_probe/sheet_lumon.jpg`.
- **What it does:** A CRT "Macrodata Refinement" screen built in p5.js. It has a barrel-distorted bezel, numbers in a grid that **swell under the cursor**, a glowing outline header, and "0% Complete" bins. Cyan on navy (#010A13), so take only the glow and CRT behaviour.
- **Borrow:**
  - (a) **Cursor-proximity swell**: number or eye scale = `1 + 0.8 * smoothstep(120px, 0, dist)`. Use it for the INTRO eyes: those near the cursor open wider (scale 1.15) and their iris tracks harder.
  - (b) The **"classified terminal" feel** for the stack chapter ("THE STACK:" could render its items as a dim grid where the hovered one swells and glows).

### 1.9 ertdfgcvb: https://ertdfgcvb.xyz
Screens: `web/ertdfgcvb/`. A monospace ASCII studio site on pure black.
- **What it does:** It types on with a **scramble** (random glyphs settle into the final text, `intro_0`). Text is "Simple Console" 16/19 px, `#BEBEBE` on #000, laid out in narrow columns with an ASCII-art field below.
- **Borrow:** Only as an *alternative* micro-interaction for hover. On hovering a project name, the last 3–5 characters scramble for 120 ms before settling (glyph pool `"░▒▓/\\|-_=+*#"` is too techy; use the label's own letters shuffled). Keep the main captions on the edit's dim→bright type-on.

### 1.10 Look Back (film): https://lookback-anime.com
Screens: `web/lookback-anime/`. Colour manga film site on paper tone.
- **What it does:** **Manga panels used as layout windows**: thin black-bordered rectangles of different crops float around the hero, and the key visual is cut by a hard panel edge. Section titles are Outfit 500 with very wide tracking (`動画` at 17 px with 6 px tracking, ≈0.35em). Images use `filter: grayscale(1) blur(10px)` → `grayscale(0) blur(0)` on reveal.
- **Borrow:**
  - (a) **Panel-crop windows** for the strip's alternate content: several hard-edged crops of the *same* photo or eye at different zooms, which is literally the edit's evidence strip.
  - (b) The **blur(10px)→0 reveal** (in grayscale for us) as the giant-eye zoom-in: `blur 10→0, scale 1.6→1, 250 ms, power3.out`.

### 1.11 Codrops Dithering Shader demo: https://tympanus.net/Development/DitheringShader/
Screens: `web/codrops-dithering/`. React Three Fiber post-processing by niccolofanton that turns a 3D head into a 1-bit Bayer-dithered image.
- **Borrow:** Proof that a **1-bit / ordered-dither post pass** reads as "printed manga" at full screen. Use it on owner photos as one of two looks (posterize or dither, §T10).

Other sites considered and dropped, because they were off-palette or wouldn't render headless: Garden Eight, Igloo Inc., Obys main, Evangelion, Kojima Productions, MAPPA, Monogatari, psycho-pass.com (Cloudflare wall).

---

## 2. Techniques (with sources and code-level notes)

### T1. Typewriter caption: dim → bright → glow, one CSS variable, no per-char tweens. **Verified** (`proto/caption.html`)

One custom property `--p` (number of characters typed, a float) on the caption root drives every character in every glow layer. GSAP tweens or scrubs a single value, and CSS does the per-char math. This matches the frame: chars appear at 35 %, reach ~0.6 a few chars later, and reach full with glow ~8 chars behind the head (≈200 ms at 40 cps). There is no cursor.

```css
.cap{ --p:0; position:relative; font:400 var(--cap-size)/1.26 var(--font-quicksand);
      letter-spacing:.035em; text-transform:uppercase; color:#F0F0F0; white-space:pre; }
.cap .layer{ position:absolute; inset:0 } .cap .core{ position:relative }
.ch{ --d: calc(var(--p) - var(--i));
     opacity: calc(clamp(0, var(--d) * 1000, 1) * clamp(.35, .35 + var(--d) * .08125, 1)); }
.cap .layer:not(.core) .ch{ opacity: clamp(0, calc((var(--d) - 1) / 8), 1); } /* glow trails the head */
```
- In React, render the same lines four times (`g3, g2, g1, core`). Each char is `<span class="ch" style={{'--i': n}}>`. Mark the glow layers `aria-hidden`, and put `aria-label` (the full text) on `.cap`.
- With SplitText instead: `SplitText.create(el, { type:'chars', charsClass:'ch', propIndex:true })` gives each char `--char: n`. Use `var(--char)` in place of `--i`. (`propIndex`, `mask`, `autoSplit` and `onSplit` are new in 3.13; docs: https://gsap.com/docs/v3/Plugins/SplitText/.)
- Time-driven: `gsap.to(cap, { '--p': n + 10, duration: (n + 10) / 40, ease: 'none' })` (40 cps).
- Scroll-driven, in a pinned chapter: `gsap.to(cap, { '--p': n + 10, ease:'none', scrollTrigger:{ trigger, start:'top top', end:'+=60%', scrub:true } })`.
- Exit: cross-fade the whole `.cap` with `opacity → 0` over 200 ms. Never "untype".
- Reduced motion: set `--p` to `n + 10` immediately.
- Cost: one style recalc of ~100 spans per frame. That is fine. Don't animate `text-shadow` per char, because it repaints.

### T2. Caption glow ("deep glow"). **Calibrated** against `t_06.50` (`proto/glow_compare.png`)

Plain `text-shadow` stacks are far too weak. Even with four shadows up to 48 px, the luminance 4 px below the text was 22/255, while the frame has 81/255. The frame has a broad bloom: about 58/255 at 14 px and 21/255 at 40 px from the glyphs. The match is **three blurred clones under a sharp core**:

```css
.cap .g3{ filter:blur(44px); -webkit-text-stroke:5px #F0F0F0; }   /* wide haze  */
.cap .g2{ filter:blur(16px); -webkit-text-stroke:1.5px #F0F0F0; } /* mid bloom  */
.cap .g1{ filter:blur(5px);  opacity:.9; }                        /* tight halo */
.cap .core{ text-shadow:0 0 1.5px rgba(240,240,240,.9); }
```
Measured falloff 1→30 px below the line: frame `97 91 81 74 70 65 58 50 41`. This stack with Quicksand 400 gives `103 92 83 75 69 64 57 48 35`.
- On light ground (inverted chapters), drop the clones and use `color:#1A1A1A; text-shadow:0 0 6px rgba(0,0,0,.25)`.
- Cheaper fallback for phones: `filter: drop-shadow(0 0 1.5px #F0F0F0e6) drop-shadow(0 0 6px #F0F0F099) drop-shadow(0 0 20px #F0F0F073)`. That is about two thirds of the bloom with one element.
- Blurred clones are static layers. Only their char opacities change, so this stays cheap. Add `will-change: opacity` only on `.cap` while it types.

### T3. Procedural hand-drawn spiral-iris eye (SVG). **Prototype** (`proto/eye.html`, `eye_compare.png`)
`eyeSVG(seed, {size, tilt, lashes})` returns an SVG string. Geometry lives in a −1..1 box:
- **Lids:** an almond made from two `sin(π·t^k)` arcs between the corners (upper −0.62, lower +0.42). Each lid is drawn **3 times with ±0.018 jitter**, random stroke width 0.012–0.024 and opacity 0.6–1. That repetition is the "sketched" look.
- **Iris:** a disc r = 0.46 offset upward (−0.2), so the upper lid cuts it as in the frame. It is filled `#7A7A7A` at 45 % and **clipped to the almond** with a `clipPath`.
- **Spiral:** Archimedean, `r = 0.015 + 0.92·R·i/steps + 0.012·sin(0.37θ + seed)`, 7 turns × 48 steps, stroke 0.011 at 55 %. Add 3 dashed concentric rings at 35 %.
- **Lashes:** 54 tapered quadratic spikes along the upper lid, built from the normal leaning outward (`-0.35t`). Most are short (0.05–0.12). 18 % are long (0.2–0.38). Lower lid: a second "bag" line, 14 hatch strokes and 22 short lower lashes.
- **Glow:** an SVG filter that merges `blur(.05)` twice + `blur(.012)` + source (≈ "Deep Glow").
- **Next tuning:**
  - Add `<feTurbulence baseFrequency="2.5" numOctaves="2"/><feDisplacementMap scale=".015"/>` for line wobble.
  - Make lashes lean more to the outer corner.
  - Iris fill should be a radial gradient (`#9a9a9a` → `#5a5a5a`).
  - Add a 60–120 chord string-art outer ring at 0.08 opacity (lhbzr) for the giant eye.
- **Cursor tracking:** translate only the iris group by `clamp(dist, 0, 0.06)` toward the pointer (2–4 px at swarm size). Ease with `gsap.quickTo(irisG, 'x', {duration:.6, ease:'power3'})`.
- **Swarm:** generate 10–14 eyes with different seeds in 3 tiers. Use opacity 1 / .3 / .15 and blur 0 / 2 / 8 px (the far tier gets CSS `filter: blur(8px)` on the tier wrapper, not per eye). Parallax 1 : .6 : .3. Blink at random (lid `scaleY` 1→.08→1, 160 ms, from Trip in the dark).
- Render each eye once to an `<img src="data:image/svg+xml,…">` or an `<svg><use>` sprite. Don't re-render SVG per frame.

### T4. Feathered ink/fur burst + mask + inverted. **Prototype** (`proto/burst.html`, `burst_compare.png`)
Canvas 2D, about 60 lines:
- The envelope is `1 + Σ ampₖ·max(0,cos(a·m+φₖ))⁶` with 7 lobes (flame tongues).
- (1) A **solid body** fills the envelope at 0.8× radius under `ctx.filter = blur(S/45)`.
- (2) **3,200 feather strokes** run from 0.45–0.8× to 0.82–1.02× of the envelope. They are tapered in 5 segments (width 3–10 px → 30 %, alpha .35 → 5 %) under `blur(S/700)`.
- (3) **Dry-brush texture:** 500 faint grey strokes drawn with `source-atop`, plus 180 tiny `destination-out` specks.
- Colour `#ECECEC` (`--paper-1`), never #FFF.
- **Remaining work:** lobes are still too pointed. Use exponent 3–4 instead of 6 and 9–11 lobes with smaller amplitude, then `filter: blur(.6px)` on display. Optionally pass the result through `feTurbulence`/`feDisplacementMap scale≈12` once at generation to wobble the bristles.
- **Generate once** at about 1600×1200 on mount (or at build time to `public/fx/burst.webp`). Then reuse it in three roles:
  - **Background:** `<img>` / `<canvas>` layer. Grow with `scale .3→1, transform-origin: 50% 100%, 350 ms, expo.out`, then re-pulse on beats with `scale 1→1.04→1, 120 ms`.
  - **Mask / window** (ch. 3/4/5): `mask-image: url(${dataURL}); mask-repeat:no-repeat; mask-position:50% 100%; mask-size:auto 120%;` (also set `-webkit-` for older Safari). Scrub `mask-size` to grow it. That is the Black Dog grammar.
  - **Inverted (black) burst:** `filter: invert(1)` on the burst layer (`#ECECEC` → `#131313`), or rely on the global invert layer (§T6).
- A sprite-sheet ink reveal is the classic alternative: CodyHouse "Ink Transition", 25-frame PNG strip, `steps(24)` over 0.8 s (https://codyhouse.co/gem/ink-transition-effect; Codrops "Transition Effect with CSS Masks": https://tympanus.net/codrops/?p=28121). It's only worth it if we pre-render a growth sequence from the generator.

### T5. Cheap film grain + vignette (global post layer)
- Generate a 256×256 grayscale noise tile once in JS (`ImageData` with random luma). Pass it to `canvas.toDataURL()` and use it as the background of a fixed `::before` that is **200 % of the viewport**. Animate it with a CSS keyframe at **steps(1)**, jumping `transform: translate(x%,y%)` to 8 random offsets over 0.8 s (≈10 fps grain, compositor-only, zero JS per frame):
  ```css
  .grain::before{content:"";position:fixed;inset:-50%;background:var(--noise) repeat; /* set --noise: url(data:…) from JS; url(var()) is invalid CSS */opacity:.055;
    pointer-events:none;animation:grain .8s steps(1) infinite;}
  @keyframes grain{0%{transform:translate(0,0)}12%{transform:translate(-7%,4%)}25%{transform:translate(5%,-9%)}
    37%{transform:translate(-11%,-2%)}50%{transform:translate(9%,7%)}62%{transform:translate(-3%,10%)}
    75%{transform:translate(12%,-5%)}87%{transform:translate(-8%,-10%)}}
  ```
  - On black, `opacity .05` reads like the edit's fine luminance noise. On white, `mix-blend-mode:multiply` at .08 works better. Toggle with the invert state.
- An SVG `feTurbulence` grain alternative (CSS-Tricks "Grainy Gradients": https://css-tricks.com/grainy-gradients/) uses `baseFrequency .65, numOctaves 3, stitchTiles stitch` plus a `contrast(170%) brightness(1000%)` crush. It's fine as a static texture, but don't animate `seed`, because it re-rasterises.
- Homunculus does grain in-shader: `col -= noise(uv*.4)*.16`. Do the same inside any WebGL photo pass.
- Vignette: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)` on a fixed layer, plus edge blur from homunculus (optional `backdrop-filter: blur(6px)` masked to the top and bottom 15 % with `mask-image: linear-gradient(#000, transparent 15%, transparent 85%, #000)`).

### T6. Hard invert + white flash, synced to ScrollTrigger
- **Do not put `filter: invert(1)` on the page or stage wrapper.** Any `filter` creates a containing block, so `position:fixed` descendants (pinned sections, the post layer, the cursor) break. Use a **fixed overlay with a blend mode** instead:
  ```css
  .invert-layer{position:fixed;inset:0;background:#F0F0F0;mix-blend-mode:difference;pointer-events:none;
    z-index:90;visibility:hidden} /* #F0F0F0 not #FFF: |F0-00|=F0 keeps the highlight cap, |F0-F0|=0 */
  .flash-layer{position:fixed;inset:0;background:#F0F0F0;pointer-events:none;z-index:91;opacity:0}
  ```
- Place the grain and vignette *above* the invert layer (z 92+) so they don't invert. Captions inside will invert automatically. Swap the glow clones off in the inverted state, because inverted glow becomes a dark halo, which is actually what the frame shows on white.
- Hard state toggles with no tween:
  ```js
  ScrollTrigger.create({ trigger:'#invert', start:'top top',
    onEnter:()=>{ gsap.set('.flash-layer',{opacity:1}); gsap.delayedCall(.05,()=>{ gsap.set('.flash-layer',{opacity:0});
                   gsap.set('.invert-layer',{visibility:'visible'}); }); shake(); },
    onLeaveBack:()=>gsap.set('.invert-layer',{visibility:'hidden'}) });
  ```
  The flash is 1–3 frames (50 ms) and the invert is instant. For the DROP white flash: `gsap.set(flash,{opacity:1})`, then hold 60–90 ms, then `set` 0. It is never faded.
- Fallback with the same effect: `backdrop-filter: invert(1)` on a fixed layer. It is heavier on GPU, so use it only if the blend causes artifacts.
- **Shake:** `gsap.fromTo(stage,{x:0,y:0,rotation:0},{keyframes:[{x:8,y:-5,rotation:.6},{x:-6,y:4,rotation:-.5},{x:3,y:-2,rotation:.2},{x:0,y:0,rotation:0}],duration:.12,ease:'none'})`.

### T7. Liquid warp + posterize + tilted shaking frame (DROP transition, scene-4 style), CSS/SVG only
```html
<svg width="0" height="0" style="position:absolute"><filter id="warp" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="turbulence" baseFrequency="0.008 0.012" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="posterize"><feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncR type="discrete" tableValues="0 .22 .55 .94"/><feFuncG type="discrete" tableValues="0 .22 .55 .94"/>
  <feFuncB type="discrete" tableValues="0 .22 .55 .94"/></feComponentTransfer></filter></svg>
```
- Use `filter: url(#posterize) url(#warp)` on the image. Tween the displacement with `gsap.to('#warp feDisplacementMap',{attr:{scale:5},duration:.6,ease:'power2.out'})` (40 → 5 px, as in the spec). Change `seed` every 33–50 ms for the micro-cut feel.
- Frame: `rotate(-4deg) scale(.9)` on black (Chainsaw Man portal), with shake at 15–20 Hz (`gsap.ticker` callback, ±10 px, ±1.5°).
- SVG filters on HTML run largely on the CPU in Chrome. Keep the filtered element ≤ 60vw and the effect ≤ 600 ms, then remove the filter.
- Sources: Codrops "SVG Filter Effects: Creating Texture with feTurbulence" (https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/) and "Image Distortion Effects with SVG Filters" (https://tympanus.net/codrops/2019/03/12/image-distortion-effects-with-svg-filters/).
- WebGL version: the homunculus `display_frg` radial warp, `uv = center + polar(θ, r·(1 − mask.r·0.6))`. With our burst texture as `mask`, the image gets "sucked" into the ink as the burst grows. This is the best "eye transition" if a WebGL canvas exists anyway.

### T8. Glass-shard burst (on the drop)
- Use 12–16 thin SVG polygons (3–4 points), generated once:
  - Pick a long axis length `L = 40–220 px`, a width `w = 3–14 px`, and a slight kink on one side.
  - Fill `#F0F0F0` at 0.6–0.95 plus a `stroke: rgba(240,240,240,.9) .5px` hairline.
  - Add 6 white streak lines (`<line>` 1 px, gradient alpha).
- Animate: `gsap.fromTo(shards, {x: i=>side(i)*vw*0.7, y: rand(-80,80), rotation: rand(-90,90), opacity:0}, {x: target, y: target, rotation: '+=rand(-25,25)', opacity:1, duration:.2, ease:'power3.out', stagger:{each:.008, from:'edges'}})`. Then let them drift with `x += 6px/s` and slow rotation, and fade them out at chapter exit.
- For true broken-glass geometry, Voronoi on a rect with `d3-delaunay` (https://github.com/d3/d3-delaunay). Keep only cells with aspect > 3. Not needed for the look.

### T9. Jitter title + light streaks (TITLE chapter, `d_2.40`)
- **Glyph pop-in:** chars appear every 60 ms (`stagger:.06`, `opacity 0→1` with `set`, not a tween).
- **Jitter:** a 16 Hz loop with `gsap.quickSetter(char,'x','px')`. Each tick, set `x/y ±3px` and `rotation ±4°` per char. Drive it with `gsap.ticker.add` throttled with an accumulator (`if ((acc += dt) > 62) {…}`).
- **Extruded / glossy look without WebGL:** stack 6 copies offset `(i*1.2px, i*0.8px)` with `color: rgb(20+i*12…)` behind the face. Give the face a `linear-gradient(#F0F0F0, #8A8A8A)` with `background-clip:text`.
- **Smear-out exit:** an SVG directional blur. `<feGaussianBlur stdDeviation="0 0"/>` tweened to `"24 0"` (**x-only stdDeviation = horizontal motion blur**), plus `x: 40px`, `opacity → 0`, over 200 ms.
- **Streaks:** absolutely positioned 1–3 px tall divs, `background: linear-gradient(90deg, transparent, rgba(240,240,240,.9) 70%, transparent)`, `filter: blur(.6px)`, 30–60 vw wide. Fly them `x: -60vw → 110vw` in 150–250 ms, `ease:'power2.in'`, with a slight `rotation ±1.5°` for the curve. Spawn 3–6 per beat.

### T10. Photo → manga (posterize / halftone / dither) shader for owner photos
A WebGL fragment pass on one textured quad (OGL or raw WebGL, ~3 KB). It compiles in WebGL1 and WebGL2 (checked with `_scripts/verify_snippets.mjs`). The look is not yet tuned on real photos:
```glsl
precision highp float; uniform sampler2D uTex; uniform vec2 uRes; uniform float uLevels, uMode, uTime; varying vec2 vUv;
float luma(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
float B2(vec2 a){ a = floor(a); return fract(dot(a, vec2(.5, a.y*.75))); }   // closed-form Bayer (no dynamic matrix indexing,
float B4(vec2 a){ return B2(.5*a)*.25 + B2(a); }                         //  which GLSL ES rejects: 'Index expression can only contain const')
void main(){
  vec2 px = 1./uRes; float l = luma(texture2D(uTex,vUv).rgb);
  l = clamp((l-.08)*1.35,0.,1.);                                // crush blacks, blow highlights
  // Sobel ink lines
  float gx = luma(texture2D(uTex,vUv+vec2(px.x,0)).rgb)-luma(texture2D(uTex,vUv-vec2(px.x,0)).rgb);
  float gy = luma(texture2D(uTex,vUv+vec2(0,px.y)).rgb)-luma(texture2D(uTex,vUv-vec2(0,px.y)).rgb);
  float edge = smoothstep(.08,.25,length(vec2(gx,gy)));
  float v;
  if(uMode < .5){ v = floor(l*uLevels + .5)/uLevels; }                                   // posterize 4 tones
  else if(uMode < 1.5){ v = step(B4(gl_FragCoord.xy), l); }                                // 1-bit ordered (Bayer 4x4)
  else { vec2 g = mod(gl_FragCoord.xy, 6.) - 3.; v = step(length(g), 3.2*sqrt(1.-l)) < .5 ? 1. : 0.; } // halftone dots
  v = mix(v, 0., edge);                                                                 // ink outlines
  v -= (fract(sin(dot(gl_FragCoord.xy+uTime, vec2(12.9898,78.233)))*43758.5453)-.5)*.06; // grain
  gl_FragColor = vec4(vec3(clamp(v,0.,.94)), 1.);                                         // cap at #F0F0F0
}
```
- Sources: Maxime Heckel, "The Art of Dithering and Retro Shading for the Web" (https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/), which covers Bayer, quantise `floor(c*(n-1)+.5)/(n-1)` and blue noise. Also the Codrops Dithering Shader (https://tympanus.net/Development/DitheringShader/) and Codrops "Distortion and Grain Effects on Scroll" (https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/).
- **No-WebGL fallback** (also the reduced-motion path): the `#posterize` SVG filter from T7 plus `contrast(1.4)`.

### T11. WebAudio: procedural drone, drop hit, type ticks (off by default). The snippet runs without errors in Chromium (`verify_snippets.mjs`)
Patterns are from MDN "Advanced techniques" (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques): an oscillator with a GainNode envelope, an AudioBuffer white noise into a `BiquadFilterNode` bandpass, and a lookahead scheduler (a 25 ms timer queueing 100 ms ahead on `ctx.currentTime`).
```js
const ctx = new AudioContext();                // create/resume ONLY inside the SOUND ON click
const master = new GainNode(ctx,{gain:.0001}); master.connect(ctx.destination);
// drone: 2 detuned saws + sub, lowpass with slow LFO
const lp = new BiquadFilterNode(ctx,{type:'lowpass',frequency:260,Q:.7}); lp.connect(master);
const osc=[55,55.35].map(f=>{const o=new OscillatorNode(ctx,{type:'sawtooth',frequency:f});o.connect(lp);o.start();return o});
const sub=new OscillatorNode(ctx,{type:'sine',frequency:27.5}); sub.connect(lp); sub.start();
const lfo=new OscillatorNode(ctx,{frequency:.05}), lfoG=new GainNode(ctx,{gain:120}); lfo.connect(lfoG).connect(lp.frequency); lfo.start();
master.gain.exponentialRampToValueAtTime(.08, ctx.currentTime+2);                 // fade in
const noiseBuf=(()=>{const b=new AudioBuffer({length:ctx.sampleRate,sampleRate:ctx.sampleRate});const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b})();
function hit(t=ctx.currentTime){                                                   // DROP: kick + noise crack
  const o=new OscillatorNode(ctx,{type:'sine',frequency:140}), g=new GainNode(ctx,{gain:.9});
  o.frequency.exponentialRampToValueAtTime(38,t+.25); g.gain.exponentialRampToValueAtTime(.001,t+.45);
  o.connect(g).connect(ctx.destination); o.start(t); o.stop(t+.5);
  const n=new AudioBufferSourceNode(ctx,{buffer:noiseBuf}), hp=new BiquadFilterNode(ctx,{type:'highpass',frequency:1800}), ng=new GainNode(ctx,{gain:.35});
  ng.gain.exponentialRampToValueAtTime(.001,t+.18); n.connect(hp).connect(ng).connect(ctx.destination); n.start(t); n.stop(t+.2);
}
function tick(t=ctx.currentTime){                                                  // typewriter: 3 ms filtered click, every 2nd char
  const n=new AudioBufferSourceNode(ctx,{buffer:noiseBuf}), bp=new BiquadFilterNode(ctx,{type:'bandpass',frequency:5200,Q:4}), g=new GainNode(ctx,{gain:.025});
  g.gain.exponentialRampToValueAtTime(.0001,t+.03); n.connect(bp).connect(g).connect(ctx.destination); n.start(t,Math.random()); n.stop(t+.03);
}
// "breath" before the drop: master.gain.setTargetAtTime(.0001, now, .04); then hit(now+.45); master.gain.setTargetAtTime(.08, now+.45, .02)
```
Optionally add a WaveShaper (tanh curve) on the hit for phonk grit, plus a 4 kHz highpassed noise "air" at gain .004 under the drone. Respect `prefers-reduced-motion`: sound still allowed, but no hits on flashes that don't happen.

### T12. Lenis + ScrollTrigger (from the Lenis README, verified)
```js
const lenis = new Lenis({ lerp: .09 });        // npm "lenis"; React adapter "lenis/react"
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
- With `lenis/react`, use `<ReactLenis root options={{ lerp:.09, autoRaf:false }} ref={…}>` and add the same ticker hookup in an effect.
- `prevent: node => node.closest('[data-lenis-prevent]')` for any scrollable panel.
- Hard cuts between chapters: `ScrollTrigger.create({ onEnter/onLeave/onEnterBack/onLeaveBack })` with `gsap.set`. Don't use scrub for state changes; reserve scrub for `--p` typing, burst `mask-size`, and drift.

### T13. Evidence strip: jump + slice glitch
- Position zones come from the frames:
  - top-right: `left 37.5%, top 4%, width 58.5%, height 28%` (`t_05.50`)
  - left: `left 2.3%, top 28.5%, width 59%, height 17%` (`t_06.50`)
- Both have hard edges, `border-top:1px solid rgba(240,240,240,.35)`, and `box-shadow: 0 12px 30px rgba(0,0,0,.6)`.
- **Jump** = `gsap.set` (a teleport), never a tween.
- **Entry** = `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` over 150 ms, `power4.out`.
- **Glitch for 2–3 frames on swap:** 3 absolutely stacked clones with `clip-path: inset(a% 0 b% 0)` (random horizontal bands 4–12 % tall), each `x: ±(5–20)px`. Show them for 33 ms, then 33 ms with new bands, then remove.
- Swap content behind the glitch. Optionally apply Aristide-style vertical slices with a 20 ms stagger.
- The Codrops "CSS Glitch Effect" (https://tympanus.net/codrops/2017/12/21/css-glitch-effect/) uses the same clip-path slicing. Drop its RGB channel split, because we are grayscale.

### T14. Cursor
Use a 10 px `#F0F0F0` disc with `mix-blend-mode: difference` (lhbzr), or a 22 px ring with a 4 px dot in the INTRO (a tiny iris). Drive it with `gsap.quickTo` (duration .35, `power3`). Hide it on touch devices (`(hover: none)`).

---

## 3. Apply to DOSSIER: prioritized

| # | Idea → implementation | Chapter (PLAN.md) | Source |
|---|---|---|---|
| 1 | **Caption system**: Quicksand 400/500, `.035em`, line-height 1.26, `--p`-driven dim→bright typing (T1) with the calibrated 3-clone bloom (T2). Build this first, because every chapter uses it. | 3, 4, 5 (+ watermark, 6) | frames, proto |
| 2 | **Global post layer**: steps(1) grain tile at .05 (T5), vignette, fixed `#F0F0F0` difference **invert layer** + flash layer (T6). No `filter` on wrappers. | all, 5 | Black Dog, Obys |
| 3 | **Spiral-iris eye generator** (T3): swarm of 10–14 seeded eyes in 3 tiers, iris `quickTo` cursor tracking, random blinks. The giant eye adds a string-art outer ring and zooms in with `blur 10→0, scale 1.6→1, 250 ms`. | 1, 3, 5 | lhbzr, Trip in the dark, Look Back |
| 4 | **Burst generator** (T4) → one bitmap used as background (grow `.3→1` `expo.out` 350 ms), **mask window** with scrubbed `mask-size` (Black Dog), and inverted. | 3, 4, 5 | Black Dog, CodyHouse ink |
| 5 | **Sound gate**: "ENTER WITH SOUND / ENTER WITHOUT SOUND" with the grey "use headphones" line. Create the AudioContext on click (T11 drone fades in over 2 s). Ring-pulse affordance. | 1 | homunculus, Trip in the dark, Black Dog |
| 6 | **Drop sequence**: caption starts typing in the silent "breath" (master gain → 0), then **flash 60–90 ms**, `hit()`, shards (T8, 200 ms `power3.out` from the edges), burst grow, strip **clip-path wipe 150 ms**, shake 120 ms. | 3 | spec §7.7, T6–T8 |
| 7 | **Evidence strip**: two exact zones, teleport with `gsap.set`, 2–3-frame clip-path slice glitch on swap (T13). Each project step jumps zone and swaps crops (Look Back panel crops). | 3, 4 | Aristide, Look Back |
| 8 | **Owner photo look**: WebGL posterize/dither + Sobel ink + grain shader (T10). SVG `#posterize` fallback. Procedural placeholder until photos exist. | 3, 4 | Codrops Dithering, Maxime Heckel |
| 9 | **Title**: 60 ms glyph pop, 16 Hz jitter via `quickSetter`, pseudo-extrusion stack, x-only `feGaussianBlur` smear-out, 3–6 white streaks per beat (T9). | 2 | frame `d_2.40` |
| 10 | **"ENGINEER?" / "ARTIST?" flicker**: Quicksand 400, `15vh`, `#3A3A3A`/.85, `blur(.6px)`, CSS-drawn skewed ticks. Swap every 250–330 ms with `opacity 0→.85, blur 6→1px, scale 1.06→1` over 120 ms. The old word cuts instantly. | 5 | frame `d_7.60` |
| 11 | **Liquid warp + tilted shaking frame** for the transition into DROP (T7: feTurbulence/feDisplacementMap 40→5 px, `rotate(-4deg) scale(.9)`, 15–20 Hz shake). Or the homunculus radial mask-warp if a WebGL canvas exists. | 2→3 | Chainsaw Man portal, homunculus |
| 12 | **Corner metadata**: two-line uppercase 11 px captions bottom-left ("FILE 0X / PROJECT"), a hairline + `#1` superscript index (homunculus), and a counter loader `000→100` (Aristide, Obys). | 1, 4 | Aristide, homunculus, Obys |
| 13 | **Cursor**: difference disc (T14). Lumon-style proximity swell on swarm eyes and stack items. | 1, 4 | lhbzr, Lumon |
| 14 | **Outro**: wash to `#6E6E6E` (150 ms) → `#000` (200 ms, `power1.inOut`). Handle in Quicksand 400 `clamp(18px,2.4vw,34px)`, `.06em`, with the T2 bloom breathing (`g2/g3` opacity .8↔1, 3 s yoyo). | 6 | frame `f4_046` |
| 15 | **Reduced motion / phones**: `--p` = full, no flash/invert flicker/shake/jitter, drop-shadow glow fallback (T2), grain static (no animation), eye swarm single tier without blur, no cursor. | all | PLAN |

### Measured layout numbers to reuse (from frames, 960×720)
- **TL caption:** left 1.1 %, first baseline ≈ 7.6 % from the top.
- **BR caption:** left edge at x 50.8 %, lines at y 81.8 / 84.9 / 88.1 %. It starts at the centre line and is left-aligned.
- **Strip zones:** top-right `37.5/4/58.5/28 %` (x/y/w/h), left `2.3/28.5/59/17 %`.
- **End-card handle:** centred, ≈ 54 % from the top.
- **Watermark:** bottom-right, inset ≈ 1.9 % of width, opacity .35–.5.
