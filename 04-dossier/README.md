# DOSSIER — Nazar Akanov

A personal portfolio told as a cold grayscale "dossier", in the visual and motion language of an anime edit:
a swarm of spiral eyes, a jittering title, a quiet pause and a drop (flash, shards, ink burst), five pinned
case-file steps, a hard black/white inversion and a glowing sign-off.

Next.js 16 · GSAP (ScrollTrigger, SplitText) · Lenis · raw WebGL (photo shader) · WebAudio (procedural sound).

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

## Edit

- Copy: `src/content/site.ts` (bio, dossier captions, projects, invert words and captions, socials).
- Photos: put images in `public/photos/` and list them in `site.photos`; they're rendered through the manga
  shader (`src/components/art/MangaPhoto.tsx`). With none, a procedural crop stands in.
- Font: `src/styles/fonts.ts`. Tokens (palette, caption glow, sizes, easing): `src/styles/tokens.css`.

## Map

- `src/components/chapters/` — Intro, Title, Drop, Dossier, Invert, Outro.
- `src/components/fx/` — grain/vignette/flash layer, `TypeCaption` (dim→bright type-on, scrubbable).
- `src/components/art/` — procedural eye, ink burst, shards, strip panel + tilt-cut, case files, photo shader.
- `src/lib/audio.ts` — WebAudio engine, created only when SOUND is switched on.
- `docs/PLAN.md` — the plan; `reference/` — style spec, web research, prototypes, review notes. The source
  video, its frames and web screenshots are local-only (git-ignored).

`prefers-reduced-motion` turns everything into a static, readable page.
