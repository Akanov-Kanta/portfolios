# crt — variant C

Scroll-scrubbed frames from a Tokyo Ghoul fan edit by @.maisamu (TikTok), set to "Binary Data" by HDN, shown on a WebGL CRT tube (bezel, barrel, RGB split, halftone, scanlines, power on/off). Copy lives in `src/content.ts`.

```bash
npm install && npm run dev   # http://localhost:3205
npm run frames               # rebuild public/media from source/edit.mp4 (Swift + AVFoundation, macOS)
npm run shots                # screenshots + checks (dev server must be running)
node scripts/slow-net.mjs    # .bin delayed 40 s: page must open with the poster
```

The edit burns "tiktok.com/@.maisamu" into its ring segment (~3.60–4.25 s); `scripts/build-frames.mjs` skips that range.
