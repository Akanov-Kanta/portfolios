# Review, round 3 (Reference): ch3 DROP + ch4 DOSSIER detail pass, shared systems

**Files touched (Reference ownership only):**

| Area | Files |
|---|---|
| Art | `art/ink-burst.ts`, `art/strip-fx.ts`, `art/Eye.tsx`, `art/eye-geometry.ts` |
| Effects / UI | `fx/TypeCaption.tsx`, `ui/SoundToggle.tsx` |
| Chapters | `chapters/Title.tsx` |
| Styles | `styles/tokens.css`, `app/globals.css` (outside the ch3-4 / ch5-6 blocks) |

`npx tsc --noEmit` and `npx eslint` are clean. No build and no commit. The 3241 dev server is left running (shared).

**Shots** are in `reference/shots/round3-ref/` (git-ignored). They are captured at 960×720 so they line up with the frames.
- **Sets:** `before/` (round 2 state), `after/`, `mobile/` (390×844, touch), `reduced/`, `after_ch12/` (intro and title)
- **Pairs:** frame left, site right, `_before` / `_after`:

| Pair | What it compares |
|---|---|
| `pair_t04.50_breath` | the breath |
| `pair_t05.50_drop` | after the hit |
| `pair_t06.50_dossier0` | step 1 layout |
| `pair_d7.60_burst` | burst vs the HUMAN? frame |
| `pair_f4_008_tiltcut` | strip micro-cut |
| `pair_t10.00_invert_after` | invert grammar |
| `pair_t01.00_intro_after` | asymmetric eyes |
| `pair_d2.40_title_after` / `_landed_after` | extruded title |

- **Contact sheets:** `_sheet_tiltcut.jpg` (16/33/50/83 ms after a step cut), `_sheet_mobile_reduced.jpg`, `_sheet_invert.jpg`
- **Re-run:** `node reference/web/_scripts/shoot3.mjs <tag> [w h] [reduce]`, then `pairs3.py <tag>`

## Changes

1. **Ink burst (`ink-burst.ts`)**. API unchanged: `renderBurst`, `burstObjectURL` and `BurstOptions` are stable for the ch5 mask. Prototype: `reference/proto/burst2.html` / `burst2_compare.png`.
   - **Envelope:** a dome with narrow rounded flame "tongues", 70 % of them in the upper ±56° (d_7.60's fingers), plus a slow wobble. This replaces the cos⁶ star lobes.
   - **Body:** blurred wide (S/38) so the edge is a soft gradient. The core is re-filled so the canvas bottom doesn't fade.
   - **Fur:** short soft bent bristles straddling the edge, each a faint wide stroke plus a brighter narrow core. These replace the long straight spikes.
   - **Texture:** dark strands between bristles near the edge give the fur definition. Faint interior dry-brush streaks are reduced.
   - **Size:** effective radius ×1.22, so the visible burst is ~75–85 % of the frame wide, as in t_05.50 / t_06.50.
2. **Tilted-frame micro-cut (`strip-fx.ts`, new `tiltCut(el, opts)`)**.
   - The frame snaps to −4° at scale .9 so black shows at the corners, then shakes in hard sets at 18 Hz (±10 px, ±1.5°).
   - The content micro-cuts between related crops every 2 frames (scale 1.08 / 1.22 / 1.38 plus an offset), then snaps square.
   - All `set`s, returned as a timeline.
   - `stripGlitch` = 2 frames of slice bands → tiltCut 0.17 s. `stripSlam` = 150 ms clip wipe + tiltCut 0.25 s.
   - The builder's existing calls pick it up with no change to Drop/Dossier (`_sheet_tiltcut.jpg`, `drop_hit_120ms`).
3. **Giant eye**.
   - `Eye.tsx` now tags its fills with `.eye-fill`.
   - `globals.css` (my section) ghosts `.ch34-giant` (fills hidden, `--giant-o: .85`, `blur(.7px)`). With the builder's difference blend this gives white pencil lines over black and dark lines over the burst (t_05.50 / t_10.00), not a pale almond.
4. **Strip vs SOUND toggle**. The toggle moved to the right edge: vertical (`writing-mode: vertical-rl`, reads bottom-to-top), centred, `mix-blend-mode: difference`, so it reads on black and on the burst.
   - It sits at `.35 × gutter` from the edge, outside the strip's x ≤ 96 %. On phones it is 2 px from the edge at y 62 %, clear of both strips and both caption slots.
   - It is `data-tone-lock`ed against the invert theme. The measured strip zones are untouched.
5. **Caption size**.
   - Desktop: `--caption-size: clamp(12px, calc(0.6vw + 1.5vh), 20px)`, which is 16.6 px at 960×720 (the frame shows 17.9–19.5 px) and the 20 px cap at ≥1280×800.
   - Phones: `clamp(11px, 3.1vw, 13px)` (12.1 px at 390).
   - Caption lines no longer re-wrap at ≥768 px (`.tc-line { white-space: nowrap }`; the lines are pre-broken). Without that, GLASSBOX's 44-char line wrapped inside the 46 % slot at 960 px.
6. **Invert theme** (`<html data-theme="invert">`, verified on the builder's INVERT: `vignette: none`, grain normal blend, captions `rgb(34,34,34)`):
   - Post layer: `--vignette: none` (the edit's white sections have bright edges, d_8.60). Grain switches to a normal-blend speckle at .07, because overlay vanishes on near-white.
   - Captions: every `.tc-root` and `.caption` switches to the dark look (500, `#222`) and the bloom clones are hidden.
   - The core gets a **light halo**, invisible on the light ground, so lines that cross the black burst stay legible. Before this, "ASTANA…" vanished where it overlapped the burst; see `after/_inv_br.png`.
   - Opt out per caption with `toneLock` (TypeCaption prop) or `data-tone-lock`.
7. **Type ticks**. TypeCaption dispatches `window` `"dossier:tick"` once per forward crossing of a whole character, at most one per update. Jumps of more than 3 chars (resets, `setProgress` leaps) stay silent. Verified: 111 events across title + drop typing, 0 on scroll-back reset.
8. **Eyes less symmetric** (`eye-geometry.ts`). Per seed:
   - where the arch peaks (inner ↔ outer corner)
   - openness .82–1.12
   - outer-corner lift −6…+14
   - lower-lid sag ±
   - jittered corners

   No two eyes mirror (`pair_t01.00_intro_after.jpg`).
9. **Title glyphs** (`--title-weight: 400`, `--title-shadow`). Still Quicksand, but with a stepped em-based dark extrusion down-right (5 steps #b8 → #24) under a blown-out face, plus bloom. It reads as puffy 3D letters next to d_2.40's blobs (`pair_d2.40_title_landed_after.jpg`). The entry smear is unchanged.

## Remaining deltas / patches for the builder (files I don't own)

1. **Giant eye, cleaner than my CSS hook.** In `Drop.tsx` and `Dossier.tsx`, use `<Eye seed={GIANT_EYE_SEED} glow variant="ghost" className="block h-auto w-full" />`. Then the `.ch34-giant .eye-fill` rule in my globals section can go. Optionally also drop `glow` on the giant: its bloom becomes a dark smudge over the burst under the difference blend.
2. **Caption slot width** (ch3-4 block). The edit's TL block spans to ~51 % and our lines are longer. Now that lines are `nowrap` on desktop, they may overflow the 46 % `max-width` slightly, which is harmless. To make it explicit:
   - In `.cap-slot-tl`, `max-width: 46%` → `max-width: 60%`
   - Keep copy lines ≤ 44 chars so the BR slot (starting at 50.8 %) never reaches the viewport edge at 960 px (44 chars ≈ 46 % there)
3. **INVERT, BR caption over the burst.** Even with the light halo, the start of "THE PLACE:" lines sits on the black burst edge. In t_10.00 the BR caption sits on the light ground right of the burst. Nudge the invert BR slot right (`left: 54%`), or shift the inverted burst left ~4 %.
4. **Burst look, still open.**
   - The edit's tongues are longer and more flame-like, and the side fur is darker-streaked.
   - Ours is softer and more uniform.
   - The fur's interior radial texture still reads slightly "sunburst" at 1440 px.
   - Next step: a second, sparser pass of long flame strokes inside the top tongues.
5. **Strip content** (PhotoPlaceholder / CaseFile). Under the tilt-cut, the crop jumps work best on image-like content. CaseFile text gets cropped for 2–3 frames, which is fine as a cut but could skip `content` for text panels (`tiltCut(el, { content: null })`). That is a one-line choice in `stripGlitch` if you prefer it. Tell me and I'll gate it on `el.matches("a")` or a `data-tilt="frame"` attribute.
6. **Bright-eye bloom pools** in the intro are still smaller than t_01.00's (unchanged this round).

## Verification
- 960×720, 390×844 (touch) and reduced motion: 0 console errors or warnings (`*/errors.txt`).
- Reduced motion: no pin, no tilt-cut (it is only called from motion branches), captions full, burst static.
- Phones: burst, strips, captions (12 px) and the vertical toggle all clear of each other (`_sheet_mobile_reduced.jpg`).
