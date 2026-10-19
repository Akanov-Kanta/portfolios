# Footage (not included)

This variant scroll-scrubs frames from a TikTok fan edit by @.maisamu on a CRT tube. The clip, its frames,
poster and audio aren't in the repo because they belong to other people.

To run it with your own clip (macOS, needs Xcode command line tools for Swift):

1. Put a video at `source/edit.mp4` (the code expects 1280x720; change `CROP` and the ranges in
   `scripts/build-frames.mjs` for your clip).
2. `npm run frames` writes `frames/*.bin`, `frames/manifest.json`, `poster.jpg` and `audio.m4a` here.
