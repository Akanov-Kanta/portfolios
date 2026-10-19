# hybrid — variant A + footage

Variant A's engine (one WebGL2 canvas, scroll-unit timeline, scene FBO + post pass, veins) with real footage sampled inside the scene shader: the hero is B's edit (@pzxepitsu) under A's vortex, the white ink burst eats it; the stack dissolves into the outro through growing halftone dots; the outro is C's halftone centipede (@.maisamu), graded to A's palette and eaten by black sumi ink before the handle. The hero name and the handle are typed with a port of Type Garden by Akshat Agarwal (`src/garden.ts`: stems, thorns, leaves and roses grow out of each letter); the work cards' titles are typed the same way, with red-black roses growing along each card's frame; a click on a card bursts red-black ink out of it and opens the project's dossier (`src/dossier.ts`, screenshots in `public/media/work`); the stack's tools slam in one at a time like the edit's hard cuts, on the soundtrack's 8th notes when it plays, and end on a collage (`src/stack.ts`), and forward scrolling holds at the outro until the details have typed (click, tap or any key skips). Then A's vortex swirls back in and the page loops (Lenis `infinite` on desktop, a jump at rest on touch, a normal finite page under reduced motion). Copy and footage ranges live in `src/content.ts`.

```bash
npm install && npm run dev        # http://127.0.0.1:3207
npm run frames                    # rebuild public/media from ../video and ../crt sources (Swift + AVFoundation, macOS)
npm run shots                     # screenshots + checks (dev server must be running); add --reduced / --nogl
npm run slow-net                  # .bin delayed 40 s: page must open with the poster
node scripts/loop-probe.mjs       # seam pixel diff, 2 laps forward + 1 back, fps at the seam, touch-wrap
node scripts/contrast.mjs         # hero type + HUD contrast, measured from the pixels behind them
node scripts/transition-luma.mjs  # stack -> outro brightness curve in 2% steps
node scripts/garden-probe.mjs     # Type Garden words: mid-growth / space cut / grown shots, fps
node scripts/lock-probe.mjs       # the hold at the outro: wheel + touch, backward, release, skip
node scripts/cards-probe.mjs      # work cards' gardens: mid-growth / grown shots, fps, wither + regrow
node scripts/dossier-probe.mjs    # project dossier: ink burst, open / close (Esc, button, back), focus, fps
node scripts/stack-probe.mjs      # stack slams: cut order, fps, cuts on the beat with music, project links
```
