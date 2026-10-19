# IREZUMI — build plan

Landing page for a (fictional) Japanese tattoo studio in Tokyo, drawn in the "Program" style
(The Animatrix × ukiyo-e): flat posterized fields, ink silhouettes, giant moon, diagonals, hard cuts.

Stack: Next.js 16 (App Router, TS) · Tailwind v4 · GSAP + ScrollTrigger · next/font (Shippori Mincho,
Barlow Condensed, Archivo Narrow). All imagery is inline SVG authored in code.

## Palette (tokens in `app/globals.css`)
`--ink #0B1622` · `--ink-2 #16283A` · `--crimson #9E1B1B` · `--vermilion #E2401C` · `--gold #C9A24A` ·
`--rice #ECE6D8` · `--steel #5FA8D3`. Max ~4 per screen. No blur shadows — solid offset blocks only.

## Section rhythm (each section cuts into the previous one on a diagonal `clip-path`)
| # | Section | Field | Dominant element |
|---|---------|-------|------------------|
| 0 | Nav | transparent → ink | hanko seal + wordmark, mobile menu with slash wipe |
| 1 | Hero | crimson sky | giant steel moon, ink dragon coiling around it (front/behind layering), tiled roof diagonal, flying debris, vertical 入れ墨 |
| 2 | Philosophy 哲学 | rice paper | big serif statement, brushed ensō with 彫, three tenets 一二三, ink bamboo grove (parallax) |
| 3 | Artists 彫師 | ink | three gold-leaf folding-screen cards, crimson sun + ink profile silhouette per artist |
| 4 | Flash 下絵 | crimson | 6 tattoo-flash SVGs (dragon, koi, tiger, hannya, peony, wave); duotone slash-wipe hover; `<dialog>` lightbox w/ prev/next/keys |
| 5 | Process 工程 | ink | katana blade that unsheathes with scroll; 4 steps 相談 → 下絵 → 施術 → 養生 (pinned horizontal track on desktop) |
| 6 | Pricing 値段 | rice | price board with hard-shadow rows, deposit + hourly notes |
| 7 | Booking 予約 | ink + crimson moon | validated front-end form, motif chips, success state with hanko stamp |
| 8 | FAQ 問答 | rice | accessible accordion |
| 9 | Footer | ink | seigaiha wave band, giant outlined wordmark, address/hours |

## Illustrations (`components/art/*`)
- `lib/serpent.ts` — pure math: Catmull-Rom spline → tapered body outline, dorsal spines, scale arcs,
  belly plates, leg anchors. Used for hero dragon, flash dragon, koi body, brushed ensō.
- Hero dragon: body drawn once behind the moon, front sub-segments re-drawn on top so it coils
  (front-bottom → behind-middle → front-top). Hand-drawn head (horns, mane, open jaw, whiskers,
  vermilion eye/tongue), claws, steel rim-light.
- Flash pieces use CSS variables (`--line --paper --c1..--c5 --detail`) so a second copy can be
  re-coloured to duotone (ink + vermilion) and revealed with a diagonal clip-path wipe on hover.
- Artist portraits: 3 profile silhouettes (topknot + beard, bun + kanzashi, shaved head + hachimaki).
- Hanko seal (rough stamp edge via SVG displacement filter), ensō, bamboo, roof tiles, seigaiha.

## Motion (`components/Motion.tsx`, GSAP)
- Intro: ink curtain, 80ms white flash frame, steel slash line, curtain splits along the diagonal.
- `[data-reveal="slash"]` — diagonal clip-path wipe on scroll; `[data-parallax]` — layered parallax.
- Blade glint sweep on buttons/cards (CSS), whisker sway / debris drift (CSS keyframes).
- Process: pinned horizontal scroll + blade unsheathe (desktop only, via `gsap.matchMedia`).
- `prefers-reduced-motion: reduce` → no GSAP timelines, no keyframes, everything rendered in final state.

## Components
`Nav`, `Hero`, `Philosophy`, `Artists`, `Gallery` (+ `Lightbox` client), `Process`, `Pricing`,
`Booking` (client), `Faq` (client), `Footer`, `Hanko`, `SectionLabel`, `Motion`, `lib/flash.ts`.

## Verification
`npm run lint`, `npm run build`, Playwright CLI screenshots at 1440×900 and 390×844.
