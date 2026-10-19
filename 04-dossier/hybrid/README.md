# hybrid — CASE FILE

Direction A from `reference/top/DIRECTION.md`: black, manga-press, hard cuts, one structural idea (the case
file). The figure is the Makima grayscale edit by @pzxepitsu (TikTok), credited in the hero and the colophon
("Visuals: edit by @pzxepitsu (TikTok) — demo only"); this variant is a demo, not for production.
Self-contained Next 16 app; the root app ignores this folder.

```bash
npm install && npm run dev            # http://localhost:3270
npm run lint && npx tsc --noEmit
node scripts/casefile-shots.mjs [dir] # desktop 1440x900 + phone 390x844 + deep link + reduced motion into shots/
node scripts/casefile-flow.mjs        # keyboard / Back / Esc / next-file / header / sound checks
node scripts/review-shots.mjs <dir> [desktop|phone|seq|reduced|all]  # page walk + 120 ms transition sequences
node scripts/record-projects.mjs      # re-record the live projects (then transcode, see below)
node scripts/posters.mjs              # re-extract public/media/posters/p-<t>.jpg from the frame chunks
```

The header is the only fixed chrome: transparent at the top, it slides away on scroll-down and returns as a solid
black band on scroll-up (focus inside it always shows it).

Sections: 00 cold open (000→100 counter where the name lands, one typed caption, 50 ms white frame, hard
cut; skipped on repeat visits, deep links, reduced motion) · 01 subject (the collage loop as a poster on the
12-column grid, the name spanning the grid) · 02 files (giant names on hairlines; hover/focus slams the
evidence strip in, with viewfinder brackets; click closes the brackets into a ring that opens as an iris onto
the recording, then cuts to the paper FILE view, `?file=<slug>`, Esc/Back close) · 03 profile (mono columns) · 04 contact (the email spanning the grid, socials, colophon).

Project recordings: `public/projects/rec/<slug>.{mp4,webm,jpg}`, recorded with Playwright at 1280x800,
10.4 s, grayscale at encode (`format=gray`), H.264 crf 24 + VP9 crf 31, muted.

## Footage

`public/media/frames/` is copied from `../edit/public/media/frames/` (do not edit there): five .bin chunks of
concatenated AVIF frames, 960x572 at 60 fps, plus `manifest.json` with byte offsets. Burned-in text never shows:
the frames are the edit's crop (drops every bottom-right caption and the watermark), the edit's top-left
captions are covered by a baked black patch in 5.65–7.0 s and 9.56–11.2 s, and the HUMAN?/DEVIL? and end-card
ranges were never extracted. `public/media/posters/` holds one JPEG per key time.

- `src/lib/footage.ts`: one shared store. Chunks download per range when a chapter gets close, compressed
  bytes stay in memory, frames decode on demand (`createImageBitmap`) into a 24-frame LRU with
  direction-aware prefetch. `drawCover()` cover-crops a frame (or a sub-region of it) into a canvas, with
  optional invert / exposure, grayscale, highlights at about #F0F0F0.
- `src/components/footage/FootageCanvas.tsx`: a canvas with `ref.setTime(seconds)`. Paints the nearest poster
  first, starts downloading its range within 1.5 viewports, draws the nearest decoded frame while the exact one
  decodes. Under `prefers-reduced-motion` it only ever shows the poster.
- `src/components/footage/CollageLoop.tsx`: the hero's footage, block 4 (4.95–6.95 s) at real time, looping
  with a 0.4 s crossfade; plays only after the hit, while visible and while the tab is visible.
- `src/content/footage.ts`: the hero loop range, its portrait focus per shot, and the contact's eye-strip crop.

Sound stays the procedural WebAudio engine (off by default; SOUND toggle). The edit's soundtrack is not used.

Reduced motion: no cold open, no Lenis, no transitions; the footage shows its static poster and every caption is fully shown.
