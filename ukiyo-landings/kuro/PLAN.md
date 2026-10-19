# KURO — plan

Premium launch page for a fictional sake house, drawn in the "Program" style (Animatrix x ukiyo-e),
taken in its most restrained register: night indigo, gold leaf, one pale moon, lots of empty space.
One element dominates each screen. Motion is quiet and slow on scroll, sharp on interaction.

## Palette per screen (max ~4)

| Section     | Field              | Accents                        |
|-------------|--------------------|--------------------------------|
| Age gate    | ink                | gold, rice, hanko vermilion    |
| Hero        | ink                | rice moon, gold, steel glint   |
| Heritage    | rice paper         | ink, gold, hanko               |
| Range       | ink + sake accent  | steel / crimson / gold         |
| Craft       | ink-2              | gold-leaf folding screen, ink  |
| Press       | crimson            | ink silhouettes, rice, gold    |
| Buy         | ink                | gold, rice                     |
| Newsletter  | rice paper         | ink, vermilion hanko           |
| Footer      | ink                | gold                           |

## Sections

1. **Age gate** (modal, `sessionStorage['kuro:age'] = 'ok'`) — gold half-moon, hanko, "Are you of legal
   drinking age?" Yes → red flash frame + diagonal slash wipe off; No → polite refusal state.
   Inline `<head>` script sets `html[data-age="ok"]` before paint so returning visitors never see a flash.
2. **Nav** — thin fixed bar, wordmark + hanko, anchors, "Find a bottle"; mobile: slash-wipe menu sheet.
3. **Hero** — giant moon (flat rice disc with flat crater shapes), ink bottle silhouette with carved hard
   shadow and gold rim-light, gold kasumi cloud bands, pine branch cutting the moon diagonally, distant
   crane flight, falling gold-leaf flakes. Giant "KURO" in Shippori Mincho + vertical kanji 黒.
4. **Heritage** — rice paper, diagonal top edge; kura storehouse with namako-kabe lattice + hanging
   sugidama cedar ball; vertical timeline drawn as a sumi brush line (1789 → 2026) that draws on scroll.
5. **The Range** — three sakes as tabs: 月 Tsuki (steel), 緋 Hi (crimson), 金 Kin (gold). Each: own accent
   field, circle, bottle, tasting notes, pairing, specs. Switching = diagonal slash wipe + glint.
6. **How it's made** — four-panel gold-leaf byōbu (folding screen). Panels alternate fold angle, unfold
   with scroll on desktop. Ink-line illustrations: rice stalks, polishing (grain 100%→35%), kioke vat with
   koji steam curls, aging in the cellar beneath the moon. Seigaiha waves along the screen foot.
7. **Press** — crimson field, ink cranes crossing a huge ink circle, one large quote + two small, gold seal
   medallions for (fictional) awards.
8. **Where to buy** — ink; masu cup holding a reflected moon; stockist ledger by city with gold rules.
9. **Newsletter** — rice paper "Night Ledger" signup, front-end validation, hanko stamp on success.
10. **Footer** — giant gold-outline 黒, links, drink responsibly, fictional-brand note.

## Global effects

- Paper grain: fixed SVG `feTurbulence` overlay (multiply / soft-light), plus gold-leaf tile pattern.
- Diagonal section edges with `clip-path: polygon(...)`.
- `[data-reveal]` slash-wipe reveals (clip-path from a diagonal), `[data-parallax]` layered parallax,
  `[data-draw]` brush strokes (DrawSVG), blade glint sweep on buttons and the hero bottle.
- Hard offset shadows only (`box-shadow: 6px 6px 0 ...`), no blur, no gradients for volume.
- `prefers-reduced-motion`: all GSAP skipped, content rendered in final state; CSS animations disabled.

## Components

- `app/layout.tsx` — fonts (Shippori Mincho, Barlow Condensed, Barlow Semi Condensed), age inline script, grain.
- `app/page.tsx` — server composition.
- `components/` — `AgeGate`, `Nav`, `Motion` (GSAP registrar), `RangeTabs`, `Newsletter`,
  section components, and `art/` (Moon, Bottle, Clouds, Pine, Cranes, Kura, ScreenArt, Masu, Medal, Hanko, Waves).
