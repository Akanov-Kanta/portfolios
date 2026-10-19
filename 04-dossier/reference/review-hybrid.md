# Review: hybrid variant, Reference detail pass

**Scope:** `hybrid/` only (the root `src/` and `edit/` are untouched). The running dev server on :3270 was used as-is: no extra server, no build, no commit. `npx tsc --noEmit` and `npx eslint` in `hybrid/` are clean.

**Shots** are in `reference/shots/hybrid-ref/` (git-ignored), at 960×720 so they line up with the frames.
- **Sets:** `before/` (63319da), `after/`, `mobile/` (390×844, touch), `reduced/`
- **Pairs:** frame left, site right, `_before` / `_after` / `_mobile`:

| Pair | Frame vs site |
|---|---|
| `pair_t01.00_intro_*` | intro swarm |
| `pair_d2.40_title_*` | title |
| `pair_t04.50_breath_*` | drop breath |
| `pair_t05.50_drop_*` | drop window |
| `pair_t06.50_dropend_*` | end of the drop |
| `pair_t06.50_dossier0_*`, `pair_t05.50_dossier1_*`, `pair_t06.50_dossier2_*`, `pair_t05.50_dossier3_*`, `pair_t06.50_dossier4_*` | dossier steps 0–4 |

- **Contact sheets:**
  - `_cut_sheet.jpg`: drop end → dossier cut, 33/100 ms after the cut, then typed
  - `_mobile_sheet.jpg`, `_reduced_sheet.jpg`
- **Footage reference** (decoded from the .bin chunks, labelled with source times):
  - `_footage_a.jpg`, `_footage_b.jpg`, `_footage_c.jpg`
  - `_crops1.jpg`: the curated crop candidates
- **Scripts:** `reference/web/_scripts/shooth.mjs <tag> [w h] [reduce]`, `pairsh.py`, `footage_sheet.mjs <chunk> <every> <out>`, `crop_preview.mjs`

## Fixes, in the order asked

### 1. Drop → Dossier continuity
- **DOSSIER's burst is now the same footage window as DROP's.** It uses `BurstWindow` with the same `BURST` options plus a `FootageCanvas` on `REELS.drop` with the same focus and exposure.
- The drop's window now scrubs 4.70 → **`DROP_WINDOW_END` = 6.55**. DOSSIER step 0 starts at exactly 6.55, so the cut lands on the same frame (`_cut_sheet.jpg`).
- **Per-step window times** (`WINDOW_STEPS` in `content/footage.ts`, picked from the decoded chunk-c sheet). Step 0 scrubs on from where the drop stopped; later steps hard-cut on their beat to a curated stretch of the collage and drift with scroll inside the step:

  | Step | Window (s) | What's in it |
  |---|---|---|
  | 0 | 6.55 → 6.95 | the t_06.50 scene |
  | 1 | 5.42 → 5.62 | figure left, top-right strip, spiral rings (t_05.50) |
  | 2 | 5.95 → 6.20 | the spiral eye under the left strip |
  | 3 | 5.18 → 5.38 | figure, spiky burst, strip arriving |
  | 4 | 6.62 → 6.92 | back to t_06.50 |

- **Caption legibility on every step:**
  - Each caption slot now has a feathered patch. Dark bottom-right captions (and the carried "THE SUBJECT") get the **paper** patch, as in the drop.
  - Light top-left captions get an **ink** patch, where a burst tongue or bright footage reaches up.
  - The slots isolate, so the patch sits under its caption but over the window.
  - On phones the paper patch is a horizontal band, because the radial version let the left edge go grey on full-width captions.
  - Checked crops: `after/_br_caps.png`, `mobile/_br_caps.png`.
- **Giant ghost eye** at `--giant-o: .32`. The window already contains the edit's own spiral eye (5.4–6.2 s), so at .85 the procedural eye doubled it.

### 2. Curated strip crops
- New `CUTS` / `CUT_CYCLE` / `STEP_STRIPS` in `content/footage.ts`. All were chosen from decoded sheets, and previewed in `_crops1.jpg`:
  - the top-right eye strip (5.5)
  - the left eye strip (6.5)
  - eyes under dark hair (6.1)
  - the spiral iris (5.95)
  - the dark face with ringed eyes (3.1, brightened ×1.3)
  - the framing hands (3.55, 3.65)
  - the figure's face (6.7)
  - the posterized ringed eye (2.0)
- **New `components/footage/CutReel.tsx`.** When the strip nears the viewport, it decodes each curated still once via new `footage.snapshot(t, region)`. That returns cropped copies outside the shared LRU, so a 2-frame cut always paints instantly and never shows a dark or random frame.
- On a step change it cuts through 6 stills at 2 frames each, with the start rotated per step, then hides. Underneath, the strip has already settled on its own `STEP_STRIPS[k]` crop and drifts with scroll.
- DROP's strip runs 5 cuts as it slams in.
- Strips now load chunks b + c, because the hands and face live at 3.1–3.65 s. Chunk b is already loaded by the title.

### 3. Intro
- **Loop:** the footage tier now **ping-pongs** through its densest stretch (0.45 ↔ 1.22 s), with smoothstep-eased turnarounds and scroll added to the phase.
  - Before, `mod` jumped from the late defocused frames (1.38) back to the sparse early ones (0.30), and that was the visible restart.
- **Brightness:** opacity .55 → **.82**, blur 1.2 → 0.7 px, exposure stays .94 (#F0F0F0 cap). The procedural front eyes still dominate (`pair_t01.00_intro_after.jpg`).

### 4. Phones (390×844)
- **Title:** the tilted build-up frame is now `.title-reel`. Desktop is unchanged (`min(80vw,125svh)`, 960:572). Phones get **100vw at 4:5 portrait** instead of an 80vw letterbox; the cover crop keeps each frame's centre (`mobile/title_settled.png`).
- **Burst window:** on phones the burst box is `max(100vw,110svh)`, about 2.4 screens wide, so a full-box canvas showed only its middle slice. The footage canvas now spans exactly the visible column (`.burst-reel`) and cover-crops around the subject (focusX .62 / focusY .35). The face and figure read in the window (`mobile/drop_window.png`, `dossier_*`).

### 5. Other things the pairs showed
- **Case-file and stack strips:** the footage under the panels went from exposure .3 to .8 (×1.3 for the dark face cut) with a scrim.
  - CaseFile steps: a left-weighted gradient (82 % → 12 %), so the text stays legible on the left and the footage reads on the right.
  - The stack: a flat 58 % scrim, because its text spans the full width.
  - See `after/dossier_2_typed.png` (eyes under GLASSBOX) and `dossier_3_typed.png` (spiral under BARIWEB).

## Still open
1. **Window cuts vs strip cuts.** The burst window and the strip cut together on each dossier step: two simultaneous hard cuts plus the slice glitch. That's busy but on-grammar. If it reads as too much, delay the window cut by one beat (≈0.29 s).
2. **Ink patch** under the top-left captions reads as a soft dark haze over the burst tongues. That's fine on footage, but on the INVERT chapter's light ground the patch would be wrong. INVERT isn't changed here: it uses its own captions, and its patch behaviour was not reviewed this round.
3. **Mobile title frame** opacity is still the builder's 0.5 (autoAlpha). On a portrait frame it could go to ~0.6 now that it fills the width.
4. **Intro footage** is cover-scaled ×1.47 at 960×720 (inset −3 % / −14 %), so its eyes look larger and softer than the frame's. A `zoom` < 1 isn't supported by `drawCover`; a smaller inset (−3 % all round) would bring them closer to frame scale.

## Verification
- **Desktop 960×720, phone 390×844, reduced motion:** 0 console errors and 0 warnings (`*/errors.txt`).
- **Reduced motion:** posters only, no CutReel (it is inert under reduced motion), no patches, captions fully shown (`_reduced_sheet.jpg`).
- **Files changed** in `hybrid/`:
  - `src/app/globals.css`
  - `src/components/chapters/{Dossier,Drop,Intro,Title}.tsx`
  - `src/content/footage.ts`
  - `src/lib/footage.ts`
  - new `src/components/footage/CutReel.tsx`
