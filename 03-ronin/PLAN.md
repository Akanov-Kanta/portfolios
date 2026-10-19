# v2 — the film (branch `film`)

The portfolio is now a short anime film in six shots, end credits and a loop
(plan: ../../PORTFOLIO-PLAN.md). One fixed stage, one GSAP timeline scrubbed by the page's scroll
(`src/components/film/Film.tsx`), Lenis in infinite mode so scrolling past the credits lands seamlessly
on shot 1 again. Without JS or with reduced motion the shots are plain stacked frames.

- Shots: `src/components/film/Shot{1..6}*.tsx`, `Credits.tsx` (credits + loop wave), `Overlays.tsx` (cold open, letterbox, flash, blade, counter)
- Art: `scripts/build-art.py` → `public/art/` (generated layers from ../../art/shots, public-domain prints from ../../art/pd); manifest + credits in `src/art.ts`
- Ink Garden (hero loop + contact letter): `src/lib/ink-garden.js`, after Type Garden by Akshat Agarwal
- Fonts: Shippori Mincho subset to used glyphs, `scripts/subset-fonts.py` (re-run when new kanji appear in the copy)
- Visual check: `npx next start -p 3106` then `node scripts/film-shots.mjs` → screenshots/film/

---

# 浪人 — Nazar Akanov, ronin developer

A one-page developer portfolio in the "Program" style (Animatrix × ukiyo-e, see `../../STYLE.md`).
Flat posterized fields, solid ink silhouettes, a giant moon, gold-leaf screens, diagonal sword-slash cuts.

## Content inventory (from `/Users/nazarakanov/development/portfolio`, branch `main`, read-only)

| What | Source |
|---|---|
| Name "Nazar Akanov", handle, role "Software engineer", manifesto, bio (2 paragraphs), "currently", location (Astana, Kazakhstan · open to remote), email, skills list | `src/content/site.ts` |
| Socials: GitHub, LinkedIn, Instagram, Telegram | `src/content/site.ts` |
| Projects GLASSBOX (10.2026), BARIWEB (03.2026), NISCOURSES (06.2023): taglines, descriptions, tags, live/repo links | `src/content/site.ts` |
| Project screenshots `glassbox.webp`, `bariweb.webp`, `niscourses.webp`, `niscourses-phones.webp` | `public/projects/` (copied) |
| 4th project: the 3D "infinite scroll" portfolio itself (description, stack, live URL, repo, first commit 09.2026) | `README.md`, `docs/CONTEXT.md`, `public/pwa/screen-wide-hero.jpg` (copied as `portfolio-3d.jpg`), git log |
| Timeline milestones: AI olympiad medals, a hackathon win, FLEX year in Georgia (USA) | bio text in `site.ts` — dates/names missing → TODO in `src/content.ts` |

Everything editable lives in **`src/content.ts`**.

## Sections

1. **Hero — 月下の浪人** · crimson sky, giant steel moon with flat crater blotches, the ronin silhouette
   (kasa hat, haori, drawn katana with glint, vermilion scarf streaming) on a diagonal temple-roof ridge,
   flying ink debris. Name in huge Shippori Mincho, vertical kanji label `浪人開発者` + katakana name,
   hanko seal "NA", role + manifesto.
2. **About — 一 · 序** · rice-paper field, sumi bamboo silhouettes, bio in large serif, vertical "now / based in" column.
3. **Projects — 二 · 作品** · ink night hall with a row of gold-leaf byōbu panels (seigaiha waves + Rinpa cloud
   ornaments in ink line). Each panel frames a duotone screenshot; hover = blade glint + full color.
   Click → details scroll (native `<dialog>`) opening with a red flash frame and diagonal slash wipe.
4. **Techniques — 三 · 技の巻** · white bamboo-mist field, a makimono scroll that unrolls right-to-left on scroll;
   each technique is a vertical column (kanji numeral, name, brush stroke).
5. **Path — 四 · 道** · indigo roof-tile field, a brush-stroke timeline that draws itself on scroll.
6. **Contact — 五 · 便り** · crimson field, vermilion spear-trail diagonal, big email, social seals.
7. **Footer** · ink, colophon, seal.

## Illustrations (all inline SVG / CSS, hand-built)

Moon, RoninSilhouette, TempleRoof, Bamboo grove, Seigaiha + cloud patterns (gold-leaf), Hanko seal,
BrushStroke, Debris shards, paper-grain overlay (feTurbulence), scroll rollers.

## Motion (GSAP + ScrollTrigger, `gsap.matchMedia` gates everything on `prefers-reduced-motion: no-preference`)

- Intro: crimson flash frame → two ink panels split along a diagonal slash → name wipes in.
- Hero parallax: moon slow, roof/figure medium, debris fast; idle debris drift + scarf sway.
- Section reveal: diagonal `clip-path` slash wipe on enter; a thin blade-glint line sweeps across.
- Projects: staggered slash-in; hover glint (CSS); dialog flash + wipe.
- Scroll of techniques: scrubbed `clip-path` unroll right→left.
- Path: scrubbed stroke-dashoffset brush line, items cut in.
- Reduced motion: no intro, no parallax, no flash; all content visible statically.

## Components

`src/content.ts` · `app/layout.tsx` (fonts) · `app/page.tsx` ·
`components/{Nav,Hero,About,Projects,ProjectDialog,Techniques,Path,Contact,Footer,Grain,Hanko,SectionLabel,Motion}.tsx` ·
`components/art/{Moon,Ronin,Roof,Bamboo,GoldLeaf,Brush,Debris}.tsx`.
