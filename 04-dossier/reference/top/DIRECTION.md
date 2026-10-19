# DIRECTION: what top-tier looks like, and three ways to rebuild

Research date: 2026-10-18. This document is opinionated by design.

**Where the files are.** All paths are relative to `/Users/nazarakanov/development/dossier/`. Screenshots live in `reference/top/shots/` (git-ignored).

**What each site folder holds:**

| File | What it is |
|---|---|
| `d0_loaded.jpg` | the page right after load (1440x900) |
| `d0.jpg … d7.jpg` | 7 scroll stops, each about 720 px further down |
| `d_hover.jpg`, `d_project*.jpg` | hovering a work link, then the project page it opens |
| `m0.jpg`, `m1.jpg` | phone, 390x844 (iPhone 13) |
| `seq_intro/`, `seq_scroll/`, `seq_click/` (and `seq_flip/`) | CDP screencast frames sampled every 120 ms over 2.2–3.6 s, for load, a scroll step, and a project click |
| `sheet_*.jpg` | contact sheets of the above |
| `report.json` | computed fonts and sizes, gutters, libraries, cursor, sound, canvas |

**Mood boards:** `reference/top/shots/_boards/`.

**Scripts:** `reference/top/_scripts/` (`cap.mjs`, `flip.mjs`, `sheet.py`, `multi.py`). To re-run one site: `node reference/top/_scripts/cap.mjs <slug> <url> [settleMs] [steps]`. Setting `OLDGL=1` uses SwiftShader; some sites only finish loading that way.

**Sites opened: 37.**
- **Dead or unusable:**
  - igloo.inc: the loader never completes, even in a headed browser.
  - onnujonuson.com: the domain no longer resolves.
  - chainsawman.dog/movie_reze: stuck on its splash screen.
  - basement.studio: OffscreenCanvas crash.
- **Off-brief:** baigie.me (a corporate site).

The ranked list below keeps 16. The earlier round's captures in `reference/web/` still apply: Black Dog, homunculus, lhbzr, Aristide Benoist, Look Back. See `reference/web-refs.md`.

---

## 1. Ranked references

Type figures come from `report.json`: the largest and smallest computed font-size seen on the page, and the left edge of the first column (the gutter), all at 1440 px.

| # | Site | Award / context | Why it matters for *this* style | Fonts (computed) · scale · gutter | Signature motion (measured) | Shots |
|---|---|---|---|---|---|---|
| 1 | **obys.agency** | Obys (Awwwards SOTM ×2 studio) | **The eye as UI.** A grayscale vertical film strip of project frames runs through a fixed bracket viewfinder `( )` at the centre. Whatever sits in the brackets is "in focus" (the active project). On click the brackets close into a ring, an iris. It is the evidence strip and the eye motif fused into one navigation idea. Everything else on the page is 11 px. | "Obys" grotesk 11/11 px (ratio **1:1**) · gutter **9 px** · WebGL canvas, no cursor, no sound | Scroll moves the strip while the brackets stay fixed. On click: strip fades 0–240 ms, brackets close 360→840 ms into a ~56 px ring, then hold during the load. | `shots/obys/d0.jpg`, `sheet_seq_click.jpg` (`seq_click/05_720ms.jpg`), `sheet_seq_scroll.jpg`, `m0.jpg` |
| 2 | **signal-a.studio** | Awwwards SOTD + Developer Award, 18 Oct 2026 | **Monochrome Swiss done right.** One justified all-caps statement mixes a light mono with a heavy grotesk. Hairline rules everywhere. Case studies are index rows with mono metadata columns ("PROJECT SCOPE / NOTABLE RECOGNITIONS"). The type-on effect lives *only* in the tiny mono lines. | GT America Mono 300 + Neue Haas Grotesk · 100 / 12 px (**8.3:1**, plus a weight contrast of 300 vs 800) · gutter **60 px** | The headline hard-cuts in at 1.8 s. Then the 12 px mono lines **scramble-decode** over 2.28→3.0 s (~700 ms, random glyphs settling left to right). | `shots/signal-a/d0.jpg`, `d2.jpg`, `d3.jpg`, `sheet_seq_intro.jpg`, `m0.jpg` |
| 3 | **locomotive.ca** | Awwwards SOTM Mar 2023 | **Work as a giant type list.** Condensed serif names (110 px) are centred on 1 px hairlines, and a small thumbnail appears inline on hover. The hero is a full-bleed portrait with a **pixel-mosaic bar over the eyes**, a "redacted evidence" image. | LocomotiveNew (condensed serif) + Helvetica Now · 110 / 15 px (7.3:1) · gutter **40 px** · locomotive-scroll, Lenis, GSAP, Barba | Page transition: the title **scrambles** its letters for 0–600 ms ("Lihgtship"→"Lightship"). The project image then resolves from a coarse **pixel mosaic**. | `shots/locomotive/d0_loaded.jpg`, `d2.jpg`, `d3.jpg`, `sheet_seq_click.jpg` |
| 4 | **iamrossmason.com** | Awwwards SOTD + Portfolio Honors, Feb 2024 | **The evidence strip as navigation.** A horizontal strip of numbered tiles ("02. Stella Artois [CLIENT WORK]") runs across the screen. The centred tile grows about 2× and overlaps a giant wordmark. Wheeling moves the strip sideways. It is the edit's letterbox strip, made functional. | "dia" 17.28 px for all text (**1:1**), plus the wordmark as artwork · gutter **48 px** | The strip glides under the wheel. The tile entering the centre scales up over about 300–400 ms, and the neighbours compress. | `shots/rossmason/d0.jpg`, `sheet_seq_scroll.jpg`, `m0.jpg` |
| 5 | **chainsawman.dog** | Official CSM portal (MAPPA) | **The source IP's own grammar.** The logo holds on pure black for **1.3 s**, then there is a **hard cut** (no fade) to a black field of *scanned* ink splatter. A tilted column of key-visual panels (~7°) auto-scrolls through it. A condensed caps title sits left and a round "MOVIE >" button right. The ink is real, not procedural. | Noto Sans/Serif JP + Oswald, 14 / 12 px UI (the art carries everything) · 6 audio files | 0→1.3 s logo hold, then a cut at 1.44 s. The panel column scrolls continuously at about 40 px/s. | `shots/chainsawman/d0.jpg`, `d2.jpg`, `sheet_seq_scroll.jpg`, `m0.jpg` |
| 6 | **immersive-g.com** | Awwwards SOTM Jan 2025 | **A grayscale world where only the work has colour.** The entire site is one bas-relief material (plaster birds and flowers) in WebGL. Projects float in it as the only coloured video windows. Type is quiet: one serif at 28 px. | PS Times 28 px + Helvetica Neue 12 px (**2.3:1**, deliberately quiet) · corner labels at about 40 px | Loader: logo, one serif line and a 00→100 counter, plus a "Click to enable sound" opt-in. Cursor: a 10 px dot with a text-label follower. Audio via Howler. | `shots/immersive-g/d0_loaded.jpg`, `d1.jpg`, `d4.jpg`, `d7.jpg` |
| 7 | **darkroom.engineering** | Darkroom (ex-Studio Freight) | **An engineering studio that looks expensive.** Uppercase condensed display at 200 px against a 10 px mono HUD gives **20:1**. Black with one accent colour, and a hairline frame around the viewport. An "open-source tools we build" section gives real engineer credibility. | therma (condensed) + mono · 200 / 10 px (**20:1**) · gutter 0 (HUD frame) | Full-bleed video bands slide under the fixed display type. Scroll is Lenis. | `shots/darkroom/d0.jpg`, `d5.jpg`, `d6.jpg`, `m0.jpg` |
| 8 | **lusion.co** | Awwwards SOTY studio; Oryzo SOTM Apr 2026 | The **loader and project-open benchmark**. Loader: a giant "000→100" counter (144 px, bottom-left) and a bar assembling into the logo. Opening a project: the clicked tile *becomes* the next page. | Aeonik 144 / 14 px · gutter about 48 px | On click: heading fades 0–720 ms. The tile **scales to full-bleed with about 3° tilt** from 840 to 1200 ms, dims to black by 1440 ms and holds black until about 2000 ms while the route loads. The project then fades up from 2160 to 2640 ms. | `shots/lusion/sheet_seq_flip.jpg` (`seq_flip/09_1200ms.jpg`), `sheet_seq_intro.jpg`, `d_flip_after.jpg` |
| 9 | **garden-eight.com** | Tokyo studio (The Shift SOTM) | **Japanese studio, extreme type contrast.** A 215 px display face against 12 px text. Case names run as a marquee with round thumbnails. | gunsan + lausanne · 215 / 12 px (**18:1**) · gutter **45 px** · custom cursor | On click: the marquee fades over 360–600 ms. The title lines then **rise out of overflow masks** from 840 to 1440 ms, one line after the other. | `shots/garden-eight/d0.jpg`, `d2.jpg`, `sheet_seq_click.jpg` |
| 10 | **aim.obys.agency** | Awwwards SOTM Jan 2024 | **Editorial paragraph as display.** Body copy is set at about 40 px with `[*]` footnote markers. A giant black logotype, and black geometric shapes fall across the copy. The paper is #E7E4DF. It is a model for a "bio as a dossier entry". | Khteka 137 / 13.7 px (10:1) · gutter **15 px** | Shapes fall and stack on scroll. Hard section cuts to black. | `shots/obys-aim/d0.jpg`, `d1.jpg`, `d2.jpg`, `m0.jpg` |
| 11 | **exoape.com** | Awwwards SOTM May 2022 | **The tilt-lift page transition.** The current page lifts and rotates away in 3D, revealing black. A small image window then expands to full-bleed. | Lausanne 300 at 144 px with −5 px tracking / 14 px · 86 px circle cursor | Page tilts away 240–480 ms. The window expands 720–960 ms. About 1 s in total. | `shots/exoape/d2.jpg`, `sheet_seq_click.jpg`, `d_project.jpg` |
| 12 | **siena.film** | Awwwards SOTM Mar 2025 | **Film-foundation cinematic.** A black ENTER gate with a condensed logotype, then a poster-like film hero with grain. Micro labels go down to **6 px**. | Neue Brucke 90 / NB International 6 px (15:1) · Howler audio | Enter gate (about 1 s), then the poster stack. | `shots/siena-film/d0_loaded.jpg`, `d0.jpg`, `m0.jpg` |
| 13 | **huyml.co** | Awwwards SOTD + DEV, 14 Oct 2026 | **Index numerals as display.** "01/19" is set at 180 px over a 3D stack of tilted project cards. Shows how to present *many* projects with one counter. | BT Grotesk 180 / 10 px (18:1) · audio toggle | Cards fly through on scroll and the counter flips digits. | `shots/huyml/d0.jpg`, `d2.jpg`, `d_project.jpg` |
| 14 | **davidwhyte.com/experience** | Awwwards SOTM Dec 2024 (Immersive Garden) | **Poetry on the web.** Poem lines float in a painterly WebGL landscape. Relevant to GLASSBOX (Kazakh poetry). | Canela Text 100 at 86 px / Roobert 9 px · circle cursor | Lines fade in per line (about 600 ms) as the camera drifts. | `shots/davidwhyte/d0.jpg`, `d1.jpg` |
| 15 | **dennissnellenberg.com** | Long-time Awwwards dev-portfolio benchmark | **The baseline to beat, not to copy.** A marquee name at 216 px, a work list with a floating hover thumbnail, and magnetic round buttons. This is what "competent developer portfolio" means in 2026, and it is now generic. | Dennis Sans 216 / 10.4 px (**21:1**) · gutter 43 px | List hover: the thumbnail follows the cursor with lerp. | `shots/dennis/d0.jpg`, `d3.jpg`, `sheet_seq_click.jpg` |
| 16 | **activetheory.net** | Awwwards SOTM Feb 2024 | **A dark WebGL world with mono UI and an audio toggle.** Shows the ceiling, and the cost: about 25 s to load headless. | nbarchitekt mono 10–16 px | Camera flies through particles. Audio via "Toggle Audio". | `shots/activetheory/d5.jpg`, `d0.jpg` |

**Also opened (useful in parts):**
- theshift.tokyo: thin condensed display at 162 px, 13.5:1. `shots/theshift/d0.jpg`
- white-desert.com: Awwwards SOTD + DEV, Sep 2026. Oswald at 256 px over film. `shots/white-desert/d0.jpg`
- malvah.co, rauno.me, getty.edu/tracingart, unseen.co (its "Enter / Enter without audio" gate, with eyes on the gate)

**Counter-references** (official anime sites: jujutsukaisen.jp, anime-dandadan.com, frieren-anime.jp, kaiju-no8.net, bluelock-pr.com, lookback-anime.com).
- These are information portals. Their UI type runs 10–20 px, menus are crammed and banners stack (`shots/dandadan/d2.jpg`, `shots/frieren/d3.jpg`).
- They feel premium *only* where the key art fills the screen.
- **Lesson:** copy the art direction, never the portal layout.

**Board for the top six:** `shots/_boards/top6.jpg`

---

## 2. Diagnosis: amateur vs premium, for this exact style

**Evidence.** Compare our own build (`reference/shots/hybrid-ref/pair_t06.50_dossier2_after.jpg`, `pair_t01.00_intro_after.jpg`) against the 30-odd captures above.

1. **We are re-creating a video, not designing a website.**
   - The edit works because it lasts 11.8 s and the music drives every cut. A site is read at the visitor's pace.
   - Every premium reference turns motion into **one structural idea per site**: Obys has the viewfinder, Ross Mason the strip, Locomotive the type list, Immersive Garden the one-material world.
   - Our build has six chapters, each chasing a frame of the edit.
   - **Rule:** one idea per site, and one idea per screen.

2. **Type scale is in the dead middle.**
   - Premium sites sit at one of two poles:
     - **≥10:1** largest to smallest: Darkroom 200/10, Dennis 216/10.4, Garden Eight 215/12, White Desert 256/14, Huy Phan 180/10, The Shift 162/12, AIM 137/13.7.
     - **A deliberate 1:1** where the imagery carries everything: Obys 11/11, Ross Mason 17/17.
   - Ours is Quicksand all-caps at 12–20 px for every caption, with a title of similar weight. That gives about 3–5:1, in **one family, one case and one weight**.
   - **Fix:**
     - one display face at ≥14vw (≈200 px at 1440)
     - one utility face at 11–12 px
     - Quicksand confined to the typed captions, which is the edit's "voice"

3. **Glow is the number-one "TikTok preset" tell.**
   - **None of the ~30 premium captures put glow on running text.**
   - We glow every caption, the eyes, the title and the HUD.
   - **Budget:** one glowing element per screen. That is the line currently typing, and its glow fades out 400 ms after the line completes.

4. **Too many simultaneous effects.**
   - Count the layers that move or are filtered in one viewport:
     - References: 1–2 (Obys 1, Locomotive 1, Immersive 1, Chainsawman 2).
     - Our t06.50 dossier frame: **9** (grain, vignette, glow, burst, figure, giant eye, strip, 2 captions, plus the "FILE 03/05" HUD card).
   - **Budget:** at most 3 visible layers, and at most 1 *moving* at any moment. Grain is exempt but must be static or stepped.

5. **The procedural art reads as clip art.**
   - Our vector eyes are symmetric outlines with uniform-stroke lashes, like a sticker pack.
   - The procedural burst reads as a soft sunburst or a fur gradient.
   - Premium sites use **real material**: Chainsawman's scanned ink, Immersive Garden's sculpted relief, Locomotive's filmed portrait.
   - **Fix:**
     - Scan real sumi ink at 600 dpi. Blow it with a straw on cold-press paper to get feathered tongues.
     - Draw *one* eye by hand, or trace the spiral from a macro photo of the owner's own eye.
     - Threshold the owner's portrait into manga black and white.

6. **There is no real work on screen.**
   - Every top portfolio shows the work (screens or video) at ≥40% of the viewport (Lusion, Locomotive, Darkroom, Immersive).
   - Ours shows projects as captions over anime footage, plus a fake HUD card.
   - **Fix:** grayscale screen recordings at 24 fps, inside the strip:
     - GLASSBOX: tokens streaming, attention maps
     - BARIWEB: the agent driving a real site
     - NISCOURSES: phone flows

7. **There is no grid.**
   - References lock to 12 columns with gutters of 40–60 px (Locomotive 40, Garden Eight 45, Ross Mason 48, Signal-A 60), or a brutalist 9–15 px (Obys, AIM).
   - Our caption slots are percentages copied from a 4:3 TikTok frame (50.8%, 46%), so nothing aligns with anything else.
   - **Fix:** every caption, strip and image edge sits on a column line. Rules are 1 px at 12–20% contrast.

8. **The transitions are effects, not continuity.**
   - Premium transitions carry **one element** through the cut:
     - Lusion's tile becomes the page.
     - Obys's brackets become an iris.
     - Garden Eight's title rises out of a mask.
     - Exo Ape's page tilts away.
   - They last 0.6–1.4 s and use expo or quart easings.
   - Our 18 Hz tilt-shake on every step reads as a glitch preset.
   - **Rule:** hard cuts go on structure (a chapter change, a project open). The shake gets 2 frames, never a loop.

9. **The intro is too slow to identity.**
   - Chainsawman shows content at 1.4 s. Signal-A shows its statement at 1.8 s.
   - Our eye swarm, title and drop take several seconds and screens of scroll before "Nazar Akanov, software engineer" is legible.
   - **Rule:** name and role readable within 2 s of first paint, with no scroll needed.

10. **Sound must be opt-in and explicit.**
    - The sites that have sound are Unseen, Immersive, Huy Phan, Active Theory, Lusion, Siena and The Shift.
    - Every one makes it opt-in: either a two-choice gate (Unseen: "Enter" / "Enter without audio"; Immersive: "Click to enable sound") or a one-word corner toggle.
    - The palette is UI ticks plus one ambient bed.
    - **Never ship the edit's licensed track** ("binary data", HDN).

11. **A custom cursor is optional.**
    - About three quarters of the references keep the default cursor.
    - Where one exists, it is an **8–12 px dot with a contextual label** (Immersive's `cursor__text`, Garden Eight's `ui-cursor`), not a laggy blob.

12. **Mobile: keep the one idea, don't shrink the collage.**
    - Obys keeps its brackets at 390 px, Ross Mason its strip, Darkroom its HUD (compare each site's `m0.jpg`).
    - Recompose vertically: the strip goes full-width at 22vh and the captions stack below it.

13. **Performance is part of "premium".**
    - Targets:
      - 60 fps on a mid laptop
      - LCP ≤ 2.0 s
      - CLS 0
      - JS ≤ 250 kB gzip outside the one WebGL piece
    - Grain is one 256 px tile at 4–6%, stepped at 12 fps.
    - No full-viewport `feTurbulence` or displacement filters per frame.

14. **IP risk.**
    - MAPPA frames plus a licensed track on a hiring site is both a liability and a fan-edit signal.
    - Premium means **your own material in the edit's grammar**.
    - The edit can be credited (an "influences" link to the TikTok) but not re-hosted.

15. **Glyph coverage, a real bug waiting to happen.** Verified in Chromium against Google Fonts.
    - **Quicksand has no Cyrillic at all**, so Kazakh lines for GLASSBOX would fall back to a system font.
    - Fonts that do render all of ӘҒҚҢӨҰҮҺІ: Fira Sans Extra Condensed, Oswald, Inter Tight, Onest, Golos Text, Cormorant, Spectral, Literata, IBM Plex Mono, Geist Mono, M PLUS Rounded 1c and Comfortaa.
    - Fonts that lack the Kazakh-specific letters: Sofia Sans Extra Condensed, Unbounded and Martian Mono.
    - **Fix:** use M PLUS Rounded 1c as a `unicode-range` fallback under Quicksand for any Kazakh caption.

---

## 3. Three directions

All three are strict grayscale (#000–#F0F0F0) and keep the eye and ink motif. Each one follows the rules in §2.

**About the edit footage.** The owner's favourite block is **4.70–6.97 s** (`reference/frames/f4_020.jpg … f4_029.jpg`, `t_05.50.jpg`, `t_06.50.jpg`): a figure, the ink burst and the eye strip. Each direction gives it a different role. In none of them is the footage re-hosted as-is.

### A. CASE FILE (black, manga-press, hard cuts)

**Board:** `shots/_boards/board_B_casefile.jpg`
**References:**
- `reference/frames/t_06.50.jpg`
- `shots/chainsawman/d2.jpg`
- `shots/darkroom/d0.jpg`
- `shots/locomotive/d2.jpg`
- `shots/locomotive/d0_loaded.jpg` (pixel-censored eyes)
- `shots/lusion/seq_flip/09_1200ms.jpg`

**Hero concept.** The edit's collage block *is* the hero, rebuilt from the owner's material.
- **Cold open:** pure black, 1.2 s. A single 15 px caption types "SUBJECT: NAZAR AKANOV".
- **Hit:** a hard cut to the composition:
  - the owner's thresholded cut-out portrait, columns 7–12
  - a **scanned** white ink burst behind him, growing from the bottom-centre
  - the evidence strip across columns 1–7 at y 28–46%, showing macro crops of his own eye cycling with project frames
  - two typed captions, top-left and bottom-right
- **The name:** "NAZAR AKANOV" in the condensed display at 17vw, cropped by the bottom edge of the viewport (as Darkroom and White Desert do).
- **Credibility layer:** a 1 px viewport-frame HUD in 11 px mono (Astana · UTC+5 · local time · "AVAILABLE"). It is the only UI chrome.

**Chapters:**

| # | Chapter | What happens |
|---|---|---|
| 00 | COLD OPEN | Black, one caption, 1.2 s. |
| 01 | DROP | The collage hero. |
| 02 | INDEX | Three files as giant condensed names on hairlines, Locomotive-style. Hovering one opens the strip with a 240 ms preview. Mono columns show year, role, stack and status. |
| 03 | FILE 01 GLASSBOX | Polarity flips once on entry. A giant name, the strip with the real recording, two captions and four mono facts. This is the one place Kazakh text appears (the model's own generated lines). |
| 04 | FILE 02 BARIWEB | Same structure as File 01. |
| 05 | FILE 03 NISCOURSES | Same structure as File 01. |
| 06 | THE QUESTION | "ENGINEER?" / "ARTIST?" flicker on the burst, inverted. About 1.5 screens, no more. |
| 07 | SIGN-OFF | Black. The handle with one soft glow, plus email, CV and GitHub. |

**How projects are shown.**
- An index of giant type, then one "file" per project:
  - The project name at 17vw.
  - The strip at 58vw × 22vh, showing a grayscale screen recording.
  - A metadata grid in 11 px mono: ROLE / STACK / YEAR / STATUS / LINK.
  - At most two Quicksand captions.
- Opening a file: the strip tile does a **FLIP to full-bleed** (Lusion), with polarity flipping at the midpoint.

**Type system.** Every family here renders Kazakh, except Quicksand, which gets a fallback.

| Role | Font | Settings |
|---|---|---|
| Display | **Fira Sans Extra Condensed 800**, uppercase | `clamp(96px, 17vw, 300px)`, tracking −0.01em, line-height 0.82 |
| Utility / metadata | **IBM Plex Mono 400**, uppercase | 11 px, tracking 0.06em, line-height 1.4 |
| Captions (the edit's voice) | **Quicksand 500**, caps | 15 px, tracking 0.04em, line-height 1.3, with `M PLUS Rounded 1c` as a unicode-range fallback for Cyrillic |
| Body (project detail) | **Inter Tight 400** | 16/1.5 |

- Contrast is about 245 / 11 ≈ **22:1**.
- Alternative display font: **Oswald 600**. It is wider, more "poster", and also covers Kazakh.

**Motion language:**

| Element | Timing and easing |
|---|---|
| Chapter changes | **Hard cuts (0 ms).** A one-frame (≈50 ms) white flash is allowed only at DROP and THE QUESTION, so twice per site. |
| Burst | Mask scale 0.55→1 over **320 ms**, `cubic-bezier(.16,1,.3,1)` |
| Strip slam | `clip-path: inset(0 100% 0 0)→inset(0)` over **180 ms**, `cubic-bezier(.7,0,.84,0)`, then 2 frames of ±6 px offset. No loop. |
| Captions | Start 240 ms after the hit, at **32 ms per character**. Each character goes from 35% to 100% opacity over 160 ms. Glow only on the line being typed. At most 60 characters per line and 2 captions per screen. |
| Breathing after the hit | The whole composition scales up 1.5% over 6 s, linear. |
| Strip content swap | Every 2.4 s, as a hard cut. |
| Index hover | The mono metadata **scrambles** over 450 ms (Signal-A). The preview opens over 240 ms, expo.out. |
| Open file | FLIP over **900 ms**, `cubic-bezier(.76,0,.24,1)`. |
| Scroll | Lenis, duration 1.0. Pinned sections are 150vh at most (not 400vh). |
| Sound | Opt-in gate ("ENTER" / "ENTER SILENT"). A tick per typed character at −28 dB, a sub hit on each cut, a low bed. |

**Role of the edit footage.**
- The 4.70–6.97 block becomes the **template for the hero**: same composition, same captions grammar, the owner's own figure, ink and eye.
- The original edit is credited in the sign-off ("visual language after @pzxepitsu") as a link, never embedded.

### B. VIEWFINDER (paper-white Swiss archive; the eye is the interface)

**Board:** `shots/_boards/board_A_viewfinder.jpg`
**References:**
- `shots/obys/d0.jpg`
- `shots/obys/seq_click/05_720ms.jpg`
- `shots/signal-a/d0.jpg`
- `shots/rossmason/d0.jpg`
- `shots/obys-aim/d1.jpg`

**Hero concept.**
- **Ground:** paper #EDEDEB.
- **The statement:** a justified mixed-weight all-caps block on the 12-column grid, for example: NAZAR AKANOV **BUILDS** SYSTEMS YOU CAN **SEE THROUGH**, from a GPT trained on **KAZAKH POETRY** to one script tag that makes **ANY SITE ACCESSIBLE**.
- **The viewfinder:** at the optical centre, a fixed **bracket viewfinder** `( )` about 140 × 90 px. A horizontal strip of 12–16 grayscale frames (owner's eye macros, project frames, ink) slides through it.
- Whatever is inside the brackets is "in evidence", and its metadata decodes in mono on the right.

**Chapters:**

| # | Chapter | What happens |
|---|---|---|
| 00 | STATEMENT + VIEWFINDER | The hero above. |
| 01 | EXHIBITS | The strip *is* the work index. Scroll or drag moves it. The frame that snaps into the brackets shows its exhibit number in 12vw light numerals (Huy Phan), with title and metadata. |
| 02 | EXHIBIT 00 · THE EDIT | One full black flip. Inside the viewfinder, which grows to 58vw, the collage block plays as a 6-frame flipbook of the owner's material. Quicksand captions type here and **only** here. |
| 03 | ABOUT | Bio as a 40 px editorial paragraph with `[*]` footnote markers (AIM). The footnotes are the facts: school, stack, location. |
| 04 | COLOPHON / CONTACT | Fonts, stack, credits and the edit credit, as in a printed catalogue. |

**How projects are shown.**
- Each project contributes 3–5 frames to the strip.
- Clicking a framed exhibit **closes the brackets into a ring (the iris)**. A spiral draws inside it while the route loads. The ring then expands as a circular mask into the project page.
- Project pages are long editorial layouts: full-width recordings and 11 px mono specs.

**Type system:**

| Role | Font | Settings |
|---|---|---|
| Display | **Inter Tight 300 + 800**, mixed weights in one justified block (`text-align: justify; text-align-last: justify`), uppercase | 7.2vw (≈104 px), line-height 0.92, tracking −0.02em |
| Exhibit numerals | Inter Tight 300 | 12vw |
| Utility | **Geist Mono 400**, uppercase | 11 px, tracking 0.04em |
| Captions | Quicksand | Exhibit 00 only |

- Contrast: about 9.5:1 in text, and 17:1 with the numerals.
- Gutter **24 px** on a 12-column grid. Hairlines are 1 px at #000 / 15%.

**Motion language:**

| Element | Timing and easing |
|---|---|
| Strip | Translate with a lerp of 0.08. After the wheel stops (120 ms debounce) the nearest frame snaps into the brackets over **500 ms**, expo.out. |
| Brackets on hover | The gap narrows by 8 px over 200 ms. They have no idle animation. |
| Open | Strip fades over 240 ms. Brackets close into the ring over **600 ms**, `cubic-bezier(.65,0,.35,1)`. The spiral draws (`stroke-dashoffset`) over 400 ms. The circle mask expands over **700 ms**, `cubic-bezier(.87,0,.13,1)`. |
| Metadata | Decodes over 600 ms (3 glyph cycles per character, 10 ms stagger). |
| Display lines | Rise from an overflow mask over **900 ms**, `cubic-bezier(.19,1,.22,1)`, 70 ms stagger. |
| Polarity | Exactly one flip, entering Exhibit 00, as a 0 ms cut. |
| Sound | Corner toggle "SOUND OFF/ON": a shutter click on each snap and a soft thump on the iris close. |

**Role of the edit footage.** The edit's grammar is quarantined in a single **exhibit**. The rest of the site is the calm archive that frames it, so the edit reads as a reference the owner curated rather than a template he copied.

### C. INKWELL (slow, poetic, one material)

**Board:** `shots/_boards/board_C_inkwell.jpg`
**References:**
- `shots/immersive-g/d0_loaded.jpg`
- `shots/immersive-g/d4.jpg`
- `shots/davidwhyte/d1.jpg`
- `shots/exoape/d2.jpg`

**Hero concept.**
- The whole site is **ink in water**: real footage the owner shoots of sumi ink dropped into a glass tank against white, inverted and graded to grayscale.
- The first drop blooms and, scrubbed by scroll, curls into the **spiral iris**. That is the eye, made from the ink itself.
- The name is set in a large light serif. One line of Kazakh verse generated by GLASSBOX types beneath it, in Cyrillic, with the English gloss in 12 px.

**Chapters:**

| # | Chapter | What happens |
|---|---|---|
| 00 | THE DROP | Hero. |
| 01 | GLASSBOX | The poem continues line by line. The model's attention pattern is drawn as ink threads. |
| 02 | BARIWEB | The ink spreads over a website screenshot and "reads" it. |
| 03 | NISCOURSES | Three phone recordings sit as still windows in the ink. |
| 04 | THE EYE | The iris opens fully. Contact sits in its pupil. |

**How projects are shown.** As the only *sharp, lit* windows in a soft gray world (Immersive Garden's rule: the work is the only colour, here the only sharpness). Each window is a 16:10 recording with an 11 px caption under it.

**Type system:**

| Role | Font | Settings |
|---|---|---|
| Display | **Cormorant 300** (italic for verse) | 72–120 px, line-height 1.0, tracking −0.01em |
| Utility | **Inter Tight 400** | 12 px |
| Captions | Quicksand 400 | 13 px, no glow |

- Contrast is about 10:1. Every family covers Kazakh except Quicksand, which gets the fallback.

**Motion language.**
- Nothing faster than **1.2 s**. Easing is sine.inOut, or expo.out for arrivals. Ink video playback is scrubbed by scroll at 0.6× speed.
- Lines fade and rise 12 px over 600 ms, with a 120 ms stagger.
- Exactly **one** hard cut in the whole site: the iris snapping open to black at THE EYE.
- Sound: a water and room-tone bed, plus a single low bell at the iris cut.

**Role of the edit footage.**
- Only its *texture* survives: the feathered burst becomes real ink and the strip becomes three macro frames.
- The figure is dropped entirely.
- This is the furthest from the edit.

---

## 4. Recommendation: **A. CASE FILE**, with B's iris transition

**Why A:**
- **It is the only direction where the 4.70–6.97 collage is the hero.** That is the part of the edit the owner actually loves, so this keeps the owner invested.
- **It directly fixes every amateur tell in §2:**
  - real scanned ink and the owner's own portrait instead of procedural art
  - a 22:1 type contrast instead of uniform Quicksand
  - glow restricted to the typing line
  - a 3-layer, 1-mover effect budget
  - hard cuts tied to chapters instead of an 18 Hz shake
  - real screen recordings in the strip
- **It suits a software engineer.** The Darkroom-style mono metadata grid and the Locomotive-style type index read as "an engineer with taste", not "an editor". The INDEX chapter gives recruiters what they came for in one screen.
- **It is buildable in the current stack** (Next 16, GSAP and Lenis are already there) with CSS masks, `clip-path`, a FLIP helper and one canvas for grain. No heavy WebGL, so it can stay at 60 fps and LCP under 2 s.

**Steal from B.** Use B's **bracket-to-iris** as the project-open transition: the strip's brackets close into the spiral iris, then expand into the file. It ties the eye motif to an actual interaction, which A otherwise lacks.

**Risk and guard-rail.** A can slide back into fan-edit. Enforce the budgets from §2 as code review checks:
- type ratio ≥ 15:1
- 1 glowing element per screen
- ≤ 3 layers per screen
- 2 white flashes per site
- no anime frames shipped
- name readable within 2 s

**First assets to make before any code:**
1. Scan 6–8 real ink bursts at 600 dpi.
2. Take one high-contrast portrait of the owner against a seamless background, then cut it out and threshold it.
3. Shoot 10 macro photos of his eye (phone macro lens, ring light), for the strip.
4. Record a 20–40 s grayscale screen recording per project.
5. Draw the spiral iris by hand, once, then vectorise it.
