# edit — DOSSIER, cut from the edit

Scroll-scrubbed frames from the Makima (Chainsaw Man) grayscale edit by @pzxepitsu (TikTok), the same
edit the root "style" variant is modelled on. Copy and the video timeline live in `src/content.ts`.
Self-contained Vite project; the root Next.js app ignores this folder.

```bash
npm install && npm run dev   # http://localhost:3260
npm run frames               # rebuild public/media/frames from public/media/edit.mp4 (macOS: Swift + AVFoundation)
npm run shots                # screenshots + checks into shots/ (dev server must be running)
npm run build                # dist/
```

Sections follow the edit's own arc: eye swarm (01) → warp, speed-line title, hands (02) → the pause (03)
→ the drop and the "THE X:" collage with code, stack and projects (04) → clean burst, burst as a window,
black/white flip with ENGINEER?/ARTIST? (05) → wash to black and the handle card (06).

Burned-in text never shows: frames are cropped to 960x572 (drops every bottom-right caption and the
watermark), the edit's top-left captions are covered by a feathered black patch baked into the frames
(`COVER` in `scripts/build-frames.mjs`), and the HUMAN?/DEVIL? and end-card ranges are never extracted.

Sound: the edit's soundtrack, only after clicking SOUND (off by default).
`prefers-reduced-motion`: static poster frame per section, all captions fully shown.
