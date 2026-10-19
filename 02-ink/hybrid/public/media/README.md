# Footage (not included)

The hero and the outro sample frames from two TikTok fan edits (@pzxepitsu and @.maisamu), and the
soundtrack is the first edit's audio. Those files aren't in the repo because they belong to other people.
`work/` (my own project screenshots) is included.

To run it with your own clips (macOS, needs Xcode command line tools for Swift):

1. Put the hero clip at `../video/public/media/edit.mp4` and the outro clip at `../crt/source/edit.mp4`
   (or change `SRC_B` / `SRC_C` and the ranges in `scripts/build-frames.mjs`).
2. `npm run frames` writes `frames/hero.bin`, `frames/outro.bin`, `frames/manifest.json`,
   `poster-hero.jpg`, `poster-outro.jpg` and `audio.m4a` here.

`src/sound.ts` has the loop points (drop, BPM, phrase length) tuned to the original track; retune them
for yours.
