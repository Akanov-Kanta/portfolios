# Footage (not included)

This experiment uses frames from a TikTok fan edit by @pzxepitsu. The frames, posters and the eye-strip
crop aren't in the repo because they belong to other people. `../projects/` (my own screen recordings)
is included.

To run it with your own clip:

1. Build frames in `../edit` (see `../edit/public/media/README.md`) and copy `../edit/public/media/frames/`
   to `public/media/frames/`.
2. `node scripts/posters.mjs` (uses Playwright, no server needed) writes `posters/p-<time>.jpg` for the key
   times listed in `src/lib/footage.ts`.
3. Save a 832x220 crop of your clip as `eye-strip@2x.jpg` (used by the contact section, see
   `src/content/footage.ts`).
