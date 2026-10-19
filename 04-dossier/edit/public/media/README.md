# Footage (not included)

This experiment scroll-scrubs frames from a TikTok fan edit by @pzxepitsu. The clip, its frames and its
poster aren't in the repo because they belong to other people.

To run it with your own clip (macOS, needs Xcode command line tools for Swift):

1. Put a video at `public/media/edit.mp4` (the code expects 960x720; change `CROP` and the ranges in
   `scripts/build-frames.mjs` for other clips).
2. `npm run frames` writes `frames/*.bin`, `frames/manifest.json` and `poster.jpg` here.
