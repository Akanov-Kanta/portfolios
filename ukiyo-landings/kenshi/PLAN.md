# KENSHI — build plan

Landing page for a kendo / iaidō / conditioning dojo, drawn in the "Program" style
(Animatrix × ukiyo-e, see `../../STYLE.md`): white-mist bamboo grove, ink silhouettes,
crimson flashes on every strike. Flat fills, hard shadows, diagonals, paper grain.

## Palette per screen

| Section       | Field          | Figures | Accent              |
|---------------|----------------|---------|---------------------|
| Hero          | rice + mist    | ink     | crimson moon, steel glint, vermilion flash |
| The Way       | ink            | rice    | steel moon, gold rules / gold-leaf panel |
| Disciplines   | rice           | ink     | crimson discs       |
| Schedule      | crimson        | ink     | rice table, vermilion |
| Senseis       | ink            | ink-2   | steel / crimson / gold panels |
| Membership    | rice           | ink     | crimson featured tier |
| Free trial    | ink / crimson split diagonal | rice | vermilion CTA, hanko |
| Footer        | ink            | rice    | gold                |

## Sections

1. **Nav** — fixed; wordmark + hanko; links; "Free class" CTA; mobile slash-wipe menu.
2. **Hero** — layered SVG stage (separate layers for parallax):
   rice field → drifting mist bands → far bamboo (pale, re-coloured dark crimson where it
   crosses the moon via clipPath) → giant crimson moon → mid bamboo → two fighters mid-clash
   (kendōka in men/hakama vs. white-haired rōnin; blades crossing in an X, steel rim-light) →
   foreground ink bamboo incl. one stalk sliced on the diagonal → falling leaves.
   Headline "One cut. A lifetime of practice." + vertical 剣士 + CTAs.
3. **The Way (道)** — ink field, giant steel moon with bamboo branch silhouette, three
   precepts (Ki-ken-tai-itchi, Zanshin, Mushin) with vertical labels; gold-leaf panel with
   seigaiha ink pattern carrying the dojo kun.
4. **Disciplines** — Kendō / Iaidō / MMA conditioning, each a pictogram SVG built from a
   shared skeletal-pose helper (Olympic-pictogram look, ink on a crimson disc).
5. **Schedule** — interactive table: day filter (All, Mon–Sun) + level filter; grouped by day
   with vertical kanji day labels (月火水木金土日); live count; empty state; "Book" on a row
   pre-fills the trial form (custom DOM event).
6. **Senseis** — 3 tall panels, profile-bust silhouettes (topknot + beard, high ponytail,
   shaved head) on flat moon/sun discs, vertical kanji names, ranks.
7. **Membership** — 3 tiers (Kōhai / Deshi / Senpai), hard offset shadows, featured crimson.
8. **Free trial** — front-end form: name, email, phone (opt.), discipline, day, experience,
   note, consent. Inline validation (aria-invalid / aria-describedby, focus first error),
   fake submit, success state with red flash + hanko stamp.
9. **Footer** — address, hours, giant wordmark, vertical kanji.

## Art system (`components/art`)

- `geometry.ts` — seeded RNG, `limb()` tapered-capsule polygons, joint circles.
- `Bamboo.tsx` — deterministic stalk + node + leaf-cluster generator.
- `Fighters.tsx`, `HeroArt.tsx`, `Pictograms.tsx`, `Portraits.tsx`, `Hanko.tsx`.
- Rim-light trick: the silhouette is drawn twice — steel copy offset a few px behind ink.

## Motion

- CSS (runs before hydration): intro slash-wipe cover, fighters snap together, ~80ms
  vermilion flash frame on contact, glint burst, looping blade-glint (stroke-dash sweep),
  mist drift, falling leaves.
- GSAP + ScrollTrigger (`Motion.tsx`): hero layer parallax (scrub), section headings
  revealed with diagonal clip-path slash wipes, red slash lines cutting across section tops,
  staggered card reveals.
- `prefers-reduced-motion: reduce` → no CSS animation, GSAP `matchMedia` skips everything,
  final states shown.

## Constraints

- Inline SVG/CSS only, no images. Responsive to 375px, no horizontal scroll.
- Fonts via next/font: Shippori Mincho (display), Barlow Condensed (UI).
