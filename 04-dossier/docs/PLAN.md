# DOSSIER — plan

A personal portfolio for Nazar Akanov (@nazarakanov) built as a cold, hypnotic "dossier", in the visual and
motion language of a grayscale anime edit (reference: `reference/style-spec.md`, frames in
`reference/frames/`, video in `reference/video/v.mp4` — local only, never committed, never shipped).

We copy the *language*, not the content: no anime art, no audio from the edit. All imagery is procedural
(SVG / canvas / shaders) or the owner's own photos (`public/photos/`, optional — a procedural placeholder
stands in until they exist).

## Signature details (must-haves)

- Strict grayscale. Blacks #000–#080808, brightest white ≈ #F0F0F0 (never #FFF).
- Spiral-iris hand-drawn eye motif (procedural SVG).
- Feathered white ink splash: background shape, mask/window, and inverted shape.
- Tiny glowing ALL-CAPS captions in a thin rounded geometric sans (Quicksand 400–500), "LABEL:" + two lines,
  top-left and bottom-right (bottom-right block starts at the centre line).
- Type-on reveal: ~35–45 chars/s, each char appears at ~35% opacity then brightens + glows over ~200 ms. No cursor.
- Hard-edged horizontal "strip" panel (~58vw × 20vh) that jumps position and swaps content on beats.
- Quiet pause → drop: white flash, glass shards fly in, splash grows (300–400 ms), giant eye zooms.
- Hard black/white invert; the centre word flips between two questions every 250–330 ms.
- Glow, vignette, light film grain over everything. Hard cuts on beats, slow drift between, cross-fades only on exits.
- Minimal glowing sign-off with the handle.

## Chapters (scroll-driven, pinned)

1. **INTRO** — swarm of glowing spiral eyes on black, 3 depth layers (parallax 1 : 0.6 : 0.3), staggered
   fade-in, eyes' irises track the cursor. "SOUND ON" toggle (off by default). Blur-out exit.
2. **TITLE** — "NAZAR AKANOV" in jittering letters with white streaks across black; small "SOFTWARE ENGINEER".
3. **DROP** — near-silent pause while the first caption starts typing → white flash, shards, splash grows,
   strip panel slams in with the owner photo (manga-processed) or the procedural placeholder.
4. **DOSSIER** — one pinned step per item, captions in the edit's format:
   "THE CODE:", "THE STACK:", then each project (GLASSBOX, BARIWEB, NISCOURSES). Strip panel jumps per step;
   clicking a project step opens its link.
5. **INVERT** — hard B/W flip, layout repeats inverted; centre word flips "ENGINEER?" / "ARTIST?".
6. **OUTRO** — fade to grey → black, glowing "@NAZARAKANOV" + socials + email.

## Tech

- Next.js 16 (App Router; read `node_modules/next/dist/docs/` before using APIs), TypeScript, Tailwind 4.
- GSAP 3.15 (ScrollTrigger, SplitText — all plugins are free) + `@gsap/react` `useGSAP`; Lenis smooth scroll
  wired to `gsap.ticker`.
- One full-screen post layer for grain / vignette / glow / invert flash (CSS + SVG filters first; a small WebGL
  canvas only where CSS can't do it, e.g. the photo manga shader and liquid warp).
- WebAudio-synthesised sound (drone, drop hits, faint type ticks), off by default, toggled by a button.
- `prefers-reduced-motion`: no pinning/jitter/flash, captions shown fully, still readable top to bottom.
- Phones: same chapters, simplified layers, no cursor tracking, captions sized for legibility (≥11px).

## Content

`src/content/site.ts` — derived from the main portfolio (`reference/portfolio-site.ts`).

## Team

- **Builder** — structure, chapters, animation timelines, content.
- **Reference** — owns visual fidelity: compares Playwright captures of the site against the edit frames and
  web references (`reference/web-refs.md`), tunes tokens/effects (`src/styles/`, `src/components/fx/`),
  writes `reference/review-*.md` with side-by-side shots in `reference/shots/`.
- Work goes in rounds per chapter; one commit per round.
