# Style spec: "@pzxepitsu" Makima edit, turned into a website direction

Source: https://www.tiktok.com/@pzxepitsu/video/7696783557477305618
Downloaded: `/Users/nazarakanov/.claude/jobs/02eab43c/tmp/video/v.mp4` (960x720, 4:3, 60 fps, 11.76 s, AAC stereo) + `v.info.json`
Frames: `/Users/nazarakanov/.claude/jobs/02eab43c/tmp/frames/`
- `t_SS.SS.jpg`: full-res frames every 0.5 s (named by timestamp)
- `d_S.SS.jpg`: extra full-res detail frames
- `f4_NNN.jpg`: 4 fps, 480 px wide (frame N is at (N-1)*0.25 s)
- `scene_NNN.jpg`: scene-change frames (cuts at 1.87, 1.90-2.20, 3.10-3.25, 3.45-3.58, 3.88-4.00, 4.68, 5.72, 8.57, 8.75, 8.98, 9.57, 9.78 s)
- `sheet_01..03.jpg`: 4 fps contact sheets (4x4, 4 s each)
- `dense_01..06.jpg`: 15 fps contact sheets (6x5, 2 s each, read left to right)

## 0. Important caveat: this is not a website

The video is not a screen recording of a site. It is a short anime **fan edit** ("AMV / edit") of Makima from *Chainsaw Man*.
- Caption: "the eye transition isn't perfect, but it's alright | song: binary data by HDN | #chainsawman #makima #makimaedit #anime #animeedit #edit #editingnews ・ Upload Method → @editingnews.com"
- No URL, browser chrome, cursor, scrollbar or UI shows up at any point. The only on-screen "link" is the creator handle **@PZXEPITSU** (a corner watermark and the end card). "@editingnews.com" is a TikTok repost/upload-service tag, not a site.
- Music: "binary data" by HDN. It is a dark phonk/electronic track with a hard drop. There is a near-silent gap at 4.10–4.55 s, then strong hits at 4.60, 4.90, 5.60, 6.90, 7.60, 7.90, 9.60 and 10.90 s.
- Likely made with After Effects or Alight Motion/CapCut, using deep glow, displacement or turbulent warp, shake, an ink/fur-burst matte, a typewriter text preset and invert flashes.

So everything below describes the **visual and motion language of the edit**, with each element translated into a web equivalent ("how this would behave on a site"). There was no live site to open, so there are no computed styles. Fonts and colors are estimated from pixels. Pixel sampling shows **zero chroma in every frame**: the edit is pure grayscale.

## 1. Concept / vibe (one paragraph)

It is a monochrome, manga-ink "psychological dossier" on one character. The edit opens in total black with a swarm of hand-drawn, glowing, spiral-pupil eyes ("she is watching you"). It then smashes through high-contrast, posterized and liquid-warped manga cuts, and settles into an editorial composition: a cut-out figure, a white ink/feather burst blooming behind her, a horizontal letterbox "evidence strip" of eye close-ups, and small glowing uppercase annotations that type themselves out ("THE EYES: …", "THE RED HAIR: …", "THE SMILE: …", "THE CHAIN: …"). The whole thing then flips polarity (white becomes black) on the beat and asks "HUMAN?" / "DEVIL?". It feels cold, clinical, hypnotic and slightly unhinged: Swiss-sparse captions sit on top of chaotic ink texture. On the web this maps to a dark, scroll-driven character or portfolio story. Each "chapter" is a labeled trait with a typewriter caption, revealed through ink-burst masks, with hard invert flashes and glitchy strip panels.

## 2. Scene-by-scene breakdown (timestamps, best frames)

| # | Time (s) | What happens | Best frames |
|---|---|---|---|
| 1 | 0.00–0.35 | Pure black. A faint large eye fades up from about 0 to 15% (ghost outline). | `f4_001.jpg`, `dense_01.jpg` row 1 |
| 2 | 0.35–1.30 | **Eye swarm.** About 8–10 hand-sketched eyes with concentric spiral irises float on black at three depth tiers: (a) bright foreground eyes with white bloom/glow, (b) a huge dim center eye (about 30% opacity), (c) blurred far eyes. New small eyes pop in on the right at about 0.75–1.1 s (fade plus scale-up from 0.8). Very slow drift/zoom (about 2–4% scale over 1 s), with slight lateral parallax between tiers. | `t_01.00.jpg` (best), `f4_004.jpg`, `f4_005.jpg` |
| 3 | 1.30–1.55 | Eyes **defocus out**: blur rises to about 8–12 px, opacity drops to about 40%, the bright tier dims first. Ends near black. | `f4_006.jpg`, `dense_01.jpg` row 4 |
| 4 | 1.55–2.20 | **"Eye transition"** (the one the caption apologizes for). Hard cut to a posterized/thresholded manga frame of Makima with ringed eyes. The image is **liquid-warped** (turbulent displacement, wavy edges), sits inside a **tilted frame** (rotated about 3–6°, black corners exposed) and shakes. Several micro-cuts in 0.3 s (scene detector fires every 2 frames). Ends on a posterized hand gesture with an eye visible. | `f4_007.jpg`, `f4_008.jpg`, `f4_009.jpg`, `scene_001..010.jpg` |
| 5 | 2.20–2.65 | **Speed-line title.** Black frame with thin white horizontal light streaks shooting across (motion-blurred, 1–3 px, slightly curved). A short distorted word made of extruded, glossy, jittering letters (reads roughly "angjo"; glyphs pop in one by one, about 60 ms each), then smears out with motion blur. | `d_2.40.jpg`, `f4_010.jpg`, `dense_02.jpg` rows 1–2 |
| 6 | 2.65–3.05 | **Rain shot.** Dark scene with dense diagonal rain streaks overlaid (grain-like texture); camera pans; a figure emerges at the left edge. | `f4_011.jpg`, `f4_012.jpg` |
| 7 | 3.05–3.20 | Dark close-up of Makima's face with ringed eyes, held briefly, about 25% brightness. | `dense_02.jpg` row 3 |
| 8 | 3.20–4.10 | **Hands.** Over-exposed white close-ups of a hand and shirt cuff, rotating and pushing in. A second hand enters (spread-fingers "framing" pose). Heavy contrast and crushed highlights. At 3.9–4.1 a **radial zoom blur** whips into the next cut. | `d_3.30.jpg`, `f4_014..016.jpg`, `dense_02.jpg` rows 4–5 |
| 9 | 4.10–4.55 | **Breath / drop gap** (music near silent). Static, dark three-quarter shot of Makima's torso (black suit, tie, braid) on black, with soft glow on the edges and a slight vignette. Barely moves (about 1% push-in). The caption "THE" starts typing bottom-right at about 4.45 s. | `f4_017.jpg`, `t_04.50.jpg` |
| 10 | 4.60 | **Drop hit.** The background **flashes to white**. Shattered-glass shards and white streaks burst in from the edges; a huge pale hand silhouette appears on the left. The figure stays as a cut-out in front. | `f4_020.jpg`, `scene_025.jpg` |
| 11 | 4.70–5.40 | **Ink burst + eye + strip.** A feathered **radial ink/fur splash** (white, brush-bristle edges) grows from the bottom-center/right behind the figure (about 300 ms, ease-out). A giant ringed eye with spiky lashes **zooms in** mid-right. A **horizontal letterbox strip** (about 58% width x 21% height, top-right, hard rectangular edges) slides in showing a close-up of eyes; it jitters and swaps content. Caption types: "THE RED HAIR: / BORN FROM HER HUMAN FORM. / IT HIDES THE DEVIL BENEATH THE WOMAN." | `t_05.50.jpg` (best), `f4_022.jpg`, `f4_023.jpg` |
| 12 | 5.40–6.60 | **Two-caption editorial layout.** Background returns to black. The strip panel jumps to the left (x about 2–55%, y about 29–45%). The figure moves to the right half, and the white burst fills the lower center. A second caption types top-left: "THE EYES: / SHE SEES THE WORLD THROUGH CONTROL. / THEY REPRESENT THE POWER TO MAKE OTHERS OBEY." The bottom-right caption stays fully typed. Small hard cuts and position jumps on beats. | `t_06.50.jpg` (best layout reference), `f4_024..f4_028.jpg` |
| 13 | 6.60–6.85 | Everything **dissolves out** except the white ink burst on black (about 150 ms cross-fade). | `f4_029.jpg`, `t_07.00.jpg` |
| 14 | 6.85–8.00 | **"HUMAN?" / "DEVIL?" flicker.** One word at center, dark-grey text on the white burst, inside skewed quote marks (`ˋHUMAN?ˊ`). The word **swaps on the beat** (about every 250–330 ms). Each swap fades/blurs in with a slight scale (1.05 to 1.0) and letter jitter. Text is soft (about 1 px blur plus a dark halo). | `d_7.60.jpg` (best), `f4_030..f4_032.jpg` |
| 15 | 8.00–8.50 | The burst becomes a **mask/window** showing the Makima torso inside it (white-washed, high-key). | `f4_033.jpg`, `f4_034.jpg` |
| 16 | 8.55–8.75 | **Polarity inversion.** Hard cut on the beat: the background goes white and the ink burst goes **black** (an inverted version of the same matte). | `d_8.60.jpg` (best), `f4_035.jpg`, `scene_027.jpg` |
| 17 | 8.75–9.50 | Repeat of the scene 10–11 grammar, inverted: shards, figure, and the caption "THE SMILE: / IT NEVER REVEALS WHAT SHE TRULY WANTS." typing bottom-right. | `f4_036..f4_038.jpg` |
| 18 | 9.50–10.40 | Repeat of the scene 11–12 grammar on a light-grey/white ground with a black burst: a giant spiral-iris eye, the strip panel top-left, and the caption top-left "THE CHAIN: / IT REPRESENTS HER DESIRE TO CONTROL. / EVERYONE BECOMES A TOOL IN HER HANDS." | `t_10.00.jpg` (best), `f4_039..f4_044.jpg` |
| 19 | 10.40–10.75 | Washes to mid-grey (about #6E6E6E) and then to black (fade about 300 ms). | `dense_06.jpg` row 3 |
| 20 | 10.75–11.76 | **End card**: "@PZXEPITSU" small, centered horizontally at about 58% height, white with a soft glow, on pure black. Static. | `f4_046.jpg`, `f4_047.jpg` |

Corner watermark: from about 3.3 s onward, "@PZXEPITSU" sits bottom-right (about 18 px from the edges at 960 px width), cap height about 14 px, white at about 35–50% opacity with a soft glow. It is sometimes cropped by the frame edge.

## 3. Layout and grid

- **Canvas**: 4:3 (960x720). For web, think full-viewport sections (100svh) with a fixed 16:12 "stage" feel, or edge-to-edge.
- **Composition is collage-like over an implicit 12-column grid**, with three recurring zones:
  1. **Top-left caption block**: x 1–50%, y 5–15%. Left-aligned, 3 lines.
  2. **Bottom-right caption block**: left-aligned text anchored at about x 51%, y 80–90%. It is *not* right-aligned; it starts at the center line and runs to about 92%.
  3. **Horizontal "evidence strip"**: a full-bleed-ish rectangle, height about 16–21% of the viewport, width about 55–60%. It alternates between the top-right (y about 5–32%) and the left (y about 29–45%). It has hard edges and no radius, and shows a cropped close-up (eyes). It sometimes has a 1 px light edge and a slight drop shadow onto what is behind.
- **Hero subject**: a cut-out character (alpha PNG) occupying one half (left in scene 11, right in scene 12), cropped at the frame bottom, with the head near the top edge.
- **Focal burst**: a feathered radial ink shape, about 70–90% of viewport width, centered in the lower half and bleeding off the bottom edge.
- Lots of negative space in black. Text never sits in a box; it floats directly over the image.
- Layering order (back to front): background (black/white) → giant faint eye/texture → ink burst → strip panel → figure cut-out → shards/streaks → captions → watermark.

## 4. Typography

- **Caption face**: a geometric, monoline, slightly rounded sans in light/regular weight, set in ALL CAPS with wide-ish tracking. It has round O, Q and C; a pointed but light M and N; and an R with a straight leg.
  - Closest Google Fonts: **Quicksand** (weight 400–500), then **Comfortaa** (300–400, rounder), **Josefin Sans** (300–400, more geometric), **Questrial**. The "Glacial Indifference" look (a common edit font, not on Google) is also very close.
  - Size: small. Cap height is about 13–15 px at 960 px width, so roughly 1.4–1.6% of viewport width. On web, about `clamp(11px, 1.25vw, 15px)`.
  - Tracking: +0.04 to +0.08em. Line height about 1.45 (lines about 25 px apart at 14 px caps).
  - Structure: line 1 is the **label with a colon** ("THE EYES:", "THE RED HAIR:", "THE SMILE:", "THE CHAIN:"). Lines 2–3 are short declarative sentences ending in a period. Label and body share size and weight; hierarchy comes only from position.
  - Color: #F0F0F0 with an outer glow (white, about 4–10 px blur, 40–60% opacity) on dark ground. On white ground it is black/#1A1A1A with a soft dark halo, so it stays legible against busy textures.
- **Statement word** ("HUMAN?" / "DEVIL?"): same family, set much larger. Cap height is about 11% of viewport height (about 80 px at 720 px tall), weight about 300–400, tracking +0.06em. Color is dark grey #2A2A2A to #4A4A4A at about 80% opacity over the white burst, with a slight blur and an inner fade at the letter edges. Quote marks are skewed backtick/acute style (`ˋ…ˊ`) set high at cap height.
- **Speed-line title** (scene 5): not typeset. It is distorted 3D/extruded glossy glyphs; treat it as an image or WebGL text.
- **Handle/watermark**: same family, uppercase, about 2% of viewport width on the end card, with glow.

## 5. Color palette (pure grayscale; measured chroma = 0)

| Token | Hex | Use |
|---|---|---|
| `--ink-0` | `#000000` | Main background (eye swarm, end card, gaps) |
| `--ink-1` | `#080808` | Near-black areas, vignette core |
| `--ink-2` | `#1A1A1A` | Dark textures, caption color on light ground |
| `--ink-3` | `#373737` | Shadowed paper in the inverted sections |
| `--mid` | `#6E6E6E` to `#8A8A8A` | Dim, not-yet-revealed characters; the grey wash at 10.4 s |
| `--paper-2` | `#ACACAC` to `#B7B7B7` | Light-grey grounds in the inverted sections |
| `--paper-1` | `#ECECEC` | Ink burst body |
| `--paper-0` | `#F0F0F0` to `#F7F7F7` | Brightest highlights. Highlights are **crushed slightly below pure white** (95th percentile is about 238–240), which gives a printed, xerox feel |
| `--glow` | `rgba(255,255,255,.55)` | Text glow and bloom on the eyes |

There is no accent color at all. Contrast comes from black/white polarity flips. If a site wants one accent, an oxblood or "Makima red" (about `#7A1E1E`) used only on a single word would be on-brand, but the source has none.

## 6. Textures, grain, imagery

- **Ink/fur burst**: a white radial splash with long bristle/feather strokes radiating outward (dry-brush texture with tiny dark specks). Used as a background element, as a mask/window (scene 15) and inverted (black, scene 16). This is the key texture asset.
- **Hand-drawn eyes**: sketchy outlines, spiky lashes, and irises made of concentric rings (Makima's spiral eyes). They appear in a swarm (scene 2) and as a single giant eye (scenes 11 and 18).
- **Shattered glass shards**: thin white angular fragments and streak lines that burst in on hits.
- **Posterization / threshold**: anime frames are crushed to 3–5 tones with blown highlights and liquid warping (scenes 4 and 8).
- **Rain streaks**: diagonal fine lines overlaid as a texture layer (scene 6).
- **Speed lines**: thin horizontal light streaks (scene 5).
- **Bloom/glow** on all bright elements (eyes, text, white edges): soft, about 6–20 px radius.
- **Grain**: mild. There is fine luminance noise in the flat blacks and mid-tones, plus video compression. A subtle film-grain overlay (about 3–6% opacity, animated per frame) matches it. A **vignette** appears in the darker shots.
- **Imagery style**: manga panels and anime screenshots, fully desaturated, high-key or low-key with no middle ground. The figure is always a clean cut-out.

## 7. Motion (most important)

Overall rhythm: **cut-driven and beat-locked**. Most transitions are hard cuts on drum hits. Continuous motion between cuts is subtle (drift, slow push-in), so the cuts, flashes and text-typing carry the energy. At 60 fps every movement is smooth; there is no frame-rate stutter, except deliberate 2-frame micro-cuts in scene 4.

### 7.1 Opening "loader": eye swarm (0–1.55 s)
- Fade from black. Eyes come up from 0 to their target opacity over about 300–500 ms, ease-out (`power2.out`), staggered about 80–150 ms, with the brightest first.
- Depth tiers: foreground eyes at 100% opacity with bloom, mid eyes at about 30%, far eyes at about 15% with 6–10 px blur. Each tier drifts at a different speed (parallax ratio about 1 : 0.6 : 0.3). The total scale drift is about +3% over 1 s (slow push-in).
- Late pop-ins on the right at about 0.75–1.1 s: scale 0.85 to 1, opacity 0 to 1, 200 ms, `back.out(1.4)`-ish but subtle.
- The irises seem to pulse slightly (glow intensity breathing at about ±10%).
- Exit: blur 0 to about 12 px plus opacity to about 30% over about 250 ms, `power2.in`, then a hard cut.
- Web: use this as a **preloader or hero intro**. Eyes could subtly **track the cursor** (iris offset 2–4 px toward the pointer). That is not in the video, but it fits the "watching" concept.

### 7.2 "Eye transition" / liquid warp (1.55–2.2 s)
- The image appears with **turbulent displacement**: noise-driven warp, amplitude about 20–40 px decaying to about 5 px, with a noise frequency that gives large blobby waves.
- The frame is **rotated about 3–6°** and **scaled about 0.9** so black corners show, and it shakes (random translate ±8–15 px, rotate ±1–2°, at about 15–20 Hz).
- **Posterize/threshold** filter on the image.
- Micro-cuts every 2–3 frames (33–50 ms) between related crops.
- Web: WebGL fragment shader (noise displacement + threshold + rotate), or SVG `feTurbulence` + `feDisplacementMap` on a section transition, triggered on scroll snap.

### 7.3 Speed-line title (2.2–2.65 s)
- White hairlines streak horizontally across black, about 1–3 px thick, with motion blur, crossing the frame in about 150–250 ms and slightly curved.
- Glyphs appear one by one (about 60 ms stagger) with **jitter/shake** (±3 px, ±4° per frame), then smear out with horizontal motion blur.

### 7.4 Rain and dark face (2.65–3.2 s)
- A rain overlay layer moves diagonally (fast, about 1 viewport per 300 ms) over a slow pan of the background (about 5% of width in 0.4 s).

### 7.5 Hands push and zoom-blur exit (3.2–4.1 s)
- Continuous push-in (scale 1 to 1.15 over about 0.8 s) plus rotation (about 5–8°), with over-exposure.
- Exit: **radial/zoom blur** ramping from 0 to heavy over about 120 ms, plus a scale-up, as a "whip" into the next cut.

### 7.6 The breath before the drop (4.1–4.55 s)
- Almost static. Push-in of about 1%. Edges glow softly.
- **The first caption characters begin typing here**, before the visual hit, to build anticipation.
- Web: a section "rest" state, pinned, where scroll progress only types the caption.

### 7.7 The drop: white flash, shards, burst (4.6–5.4 s)
- **Flash**: the background goes from black to white instantly (0 frames, a hard cut). No fade.
- **Shards**: a dozen thin white angular shards and lines fly in from the left and right edges toward the center over about 200 ms (ease-out), with slight rotation, then hang and drift.
- **Ink burst grow**: scale about 0.3 to 1.0 from the bottom-center origin over about 300–400 ms, `expo.out`. The bristle edges feel like they "spray" outward. Subsequent beats re-pulse it (scale 1 to 1.04 and back, 120 ms).
- **Giant eye**: zooms in from scale about 1.6 to 1.0 with blur 10 to 0 px, about 250 ms, `power3.out`. Rings may rotate slowly.
- **Strip panel**: enters as a hard-edged rectangle. It wipes in horizontally (clip-path inset from right 100% to 0% over about 150 ms) or just cuts in. Its **content changes** on beats (hard swap) and it **jumps position** between zones on beats (no tween, a teleport cut). Small RGB-less glitch: horizontal slice offsets of 5–20 px for 2–3 frames.
- The **figure** holds position, with a subtle 1–2% scale bounce on hits.

### 7.8 Typewriter captions (the signature micro-interaction)
- Character-by-character reveal at about **35–45 characters per second** (about 25 ms per char). "BORN FROM HER HUMAN FORM." (25 chars) appears in about 0.6–0.7 s.
- **Two-stage opacity per character**: a character first appears dim (about 30–45% opacity, #8A8A8A, see "OTHERS" in `t_06.50.jpg` and "HIDES" in `t_05.50.jpg`), then ramps to 100% plus glow over about 150–250 ms. The visible "leading edge" is therefore a soft gradient about 6–10 characters wide sweeping left to right, not a hard cursor.
- **No blinking cursor** and no sound. Line breaks are fixed (pre-broken lines).
- A label line ("THE EYES:") types first, then the body lines continue without a pause.
- Captions persist through cuts once typed. They cross-fade out (about 200 ms) only at section ends.
- Web: SplitText (GSAP) or manual spans. Tween each char `opacity: 0 → 0.35` (instant, staggered 25 ms), then `0.35 → 1` with `text-shadow` glow (200 ms, staggered 25 ms with a ~150 ms offset). Tie to scroll progress in pinned sections, or to time when in view.

### 7.9 "HUMAN?" / "DEVIL?" flicker (6.85–8.0 s)
- One word in the center that **swaps on each beat** (intervals of about 250–330 ms).
- Each new word: opacity 0 to 0.8, blur 6 to 1 px, scale 1.06 to 1.0 over about 120 ms, plus 1–2 frames of per-letter jitter (±2 px). The old word cuts out instantly.
- The burst behind breathes slightly (scale ±2%).
- Web: a looping "identity question" hero word with text rotation on a fixed interval or tied to scroll ticks.

### 7.10 Burst as mask (8.0–8.5 s)
- The ink burst shape becomes an **alpha mask** revealing the figure image inside it, high-key. The mask grows slightly (scale 1 to 1.1).
- Web: CSS `mask-image: url(burst.png)` with `mask-size` animated, or a WebGL alpha-texture mask.

### 7.11 Polarity inversion (8.55 s and after)
- A **hard invert** on the beat. White becomes black (burst turns black, background white). The next section reuses the exact same layout grammar in the inverted palette.
- Web: toggle `filter: invert(1)` on the stage, or `mix-blend-mode: difference` with a white layer, at section boundaries. Optionally flash for 1–2 frames (50 ms) before settling.

### 7.12 Outro (10.4–11.76 s)
- Everything cross-fades to flat mid-grey (about 150 ms), then to black (about 200 ms), `power1.inOut`.
- End card: the handle fades in (about 200 ms) with glow and stays static for about 1 s. The glow could "breathe" subtly.

### 7.13 Global micro-details
- **Camera shake** on hits: a 2–4 frame translate jitter of ±4–10 px plus rotate ±0.5–1°, decaying.
- **Hard cuts dominate**. Cross-dissolves are used only for exits (scenes 3, 13 and 19).
- **Glow everywhere bright**: text, eye outlines, white edges.
- **No UI chrome, no cursor, no borders** except the hard rectangle edge of the strip panel (sometimes a hairline lighter edge).
- **Sound**: the visuals are locked to the track ("binary data", HDN). A silent gap (4.10–4.55 s) precedes the drop. On a website, optional opt-in ambient audio with a mute toggle could replicate this; by default animate to an internal BPM of about 100–110, which matches the observed hit spacing of about 0.3 s and 0.6 s.

### 7.14 Scroll mapping suggestion (web translation)
- Smooth scroll (Lenis, lerp about 0.08–0.1) with **pinned full-screen chapters**: Intro (eye swarm) → Transition (liquid warp) → Chapter "THE RED HAIR" → "THE EYES" → Question "HUMAN?/DEVIL?" → Inverted chapters "THE SMILE", "THE CHAIN" → Outro handle.
- Inside each pinned chapter, scroll progress drives: burst scale → giant eye zoom → strip panel entry → caption typing. Section boundaries snap with hard cuts or inversions rather than slow scroll-tweened transitions, so it keeps the edit's "cut on beat" energy. Use `ScrollTrigger` with `snap` and `onEnter` that fires instant state changes.
- Parallax: the eye swarm tiers (1 : 0.6 : 0.3), the figure versus the burst (figure 1.0, burst 0.85, giant eye 1.15).
- Hover (none shown in the video, but consistent with it): on captions, re-run the dim-to-bright char sweep. On images, a brief liquid warp (displacement amplitude 0 to 10 px to 0, 400 ms). Cursor: a small ringed-iris custom cursor or plain crosshair, white with `mix-blend-mode: difference`.
- `prefers-reduced-motion`: disable shake, warp, flicker and invert flashes; keep fades and static captions.

## 8. Probable tech

**For the video itself**: After Effects (or Alight Motion/CapCut on mobile, which is common in the #editingnews scene). Typical layers: Deep Glow (bloom), Turbulent Displace or displacement maps (liquid warp), S_Shake or Wiggle (shake), a Posterize/Threshold or curves crush, CC Radial Blur (zoom whip), a typewriter text animator preset with an opacity range selector (which produces the dim-to-bright leading edge), stock ink-burst/fur-splash and glass-shatter overlays, and an Invert effect keyed to beats. The caption admits the "eye transition isn't perfect", which points to a hand-built warp/mask morph.

**To rebuild on the web**:
- **GSAP + ScrollTrigger** for pinned chapters, timelines, staggered char reveals (SplitText) and beat-like hard state changes.
- **Lenis** for smooth scroll (heavy, cinematic feel).
- **WebGL** (OGL, three.js or a single fullscreen shader via `curtains.js`/raw) for: noise displacement, threshold/posterize, zoom blur, invert, bloom and film grain. Alternatively, CSS/SVG filters for the cheaper parts (`feTurbulence` + `feDisplacementMap`, `filter: blur() contrast() invert()`, `mix-blend-mode`).
- **CSS masks** (`mask-image`) with a high-res PNG/WebP ink-burst alpha (or a short alpha video, WebM VP9 or HEVC with alpha) for the burst and the burst-as-window.
- **Pre-rendered short loops** (MP4/WebM) for rain, speed lines and shard bursts are the cheapest faithful route.
- Fonts: Quicksand (or Josefin Sans/Comfortaa) from Google Fonts.

## 9. Signature details (must-haves)

1. **Strict grayscale.** No color at all, highlights capped around #F0F0F0, true black grounds.
2. **Spiral-iris eyes motif.** A swarm of glowing hand-drawn eyes as the intro, and a giant ringed eye zooming in behind the subject.
3. **Feathered ink/fur-burst shape** behind the subject, reused as background, mask and inverted (black) version.
4. **Small uppercase, glowing, rounded-geometric captions** in a "LABEL: / sentence. / sentence." dossier format, placed top-left and bottom-right (starting at the center line).
5. **Typewriter reveal with a soft dim-to-bright leading edge** (characters appear at about 35% then brighten), with no cursor.
6. **Horizontal hard-edged "evidence strip"** of an eye close-up that jumps between zones and swaps content on beats.
7. **Hard polarity inversion** (black ↔ white) at a chapter boundary, reusing the same layout.
8. **White flash plus shattered-glass shards on the "drop"**, preceded by a near-static "breath" where the caption starts typing.
9. **Liquid displacement and posterize** on transitional imagery, inside a slightly rotated, shaking frame.
10. **"HUMAN?" / "DEVIL?" beat-swapping center word** in skewed quotes on the white burst.
11. Bloom/glow on everything bright, a subtle vignette and grain.
12. A **cut-driven rhythm**: hard cuts and instant state changes on beats; slow drift and push-in in between; cross-fades only for exits.
13. Minimal sign-off: a small glowing handle centered on black.

## 10. Copy seen on screen (verbatim, for tone reference)
- "THE RED HAIR: / BORN FROM HER HUMAN FORM. / IT HIDES THE DEVIL BENEATH THE WOMAN."
- "THE EYES: / SHE SEES THE WORLD THROUGH CONTROL. / THEY REPRESENT THE POWER TO MAKE OTHERS OBEY."
- "HUMAN?" / "DEVIL?"
- "THE SMILE: / IT NEVER REVEALS WHAT SHE TRULY WANTS."
- "THE CHAIN: / IT REPRESENTS HER DESIRE TO CONTROL. / EVERYONE BECOMES A TOOL IN HER HANDS."
- "@PZXEPITSU"
