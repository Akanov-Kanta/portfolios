# RŌNIN — landing page plan

Fictional indie samurai action/fighting game by the fictional studio **Kagerō Works**.
Style: The Animatrix "Program" × ukiyo-e (see `../../STYLE.md`). Flat posterized fields, solid
silhouettes, hard offset shadows, diagonal cuts, giant moon, paper grain, Japanese serif display.

## Stack
Next.js 16 (App Router, TS) · Tailwind v4 (`@theme` tokens) · GSAP 3 + ScrollTrigger (`gsap.matchMedia`)
Fonts via `next/font/google`: **Shippori Mincho B1** (display, 500/800) + **Barlow Condensed** (UI/body).

## Architecture
- Sections are Server Components that render static markup + inline SVG art.
- One client `MotionDirector` runs every GSAP effect through `data-*` hooks
  (`data-parallax`, `data-cut`, `data-glint`, `data-stagger`, the slash stage…), all inside
  `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`. With reduced motion (or no JS)
  everything renders static and fully visible.
- Small client islands only where state is needed: `Nav` (scrolled state), `TrailerFrame` (play click).

## Sections
1. **Nav** — hanko logo + wordmark, anchors, vermilion "Wishlist" button (hard shadow).
2. **Hero** (crimson sky) — giant two-tone steel moon with flat craters, rōnin silhouette (kasa hat,
   streaming cloak, katana with steel edge) standing on a diagonal temple roof (tile channels, ridge cap,
   onigawara), flying ink shards. Title RŌNIN, vertical 浪人, tagline, "Add to wishlist" + "Watch trailer".
3. **Slash stage** — hero is pinned; scrolling drags a diagonal `clip-path` cut across it revealing a
   rice-paper panel (斬 / "Every cut is final."). A bright blade line rides the cut edge, a 1-frame
   white flash fires at impact, hero art recoils.
4. **Story / premise** (rice paper) — vertical chapter label, headline, copy; sumi-e illustration:
   layered ink-wash mountains, burning castle with vermilion flame tongues, crimson sun, bamboo.
5. **Characters** (ink) — 4 cards with flat color art fields and hand-built silhouettes:
   Hayato (the rōnin), Kaede (white-haired swordswoman), Gōzan (red oni-mask warlord, cross spear with
   vermilion trail), Ganryū (warrior-monk archer). Name / clan / weapon, vertical kanji, blade glint on hover.
6. **Gameplay** — byōbu folding screen of 4 gold-leaf panels (leaf-square pattern + ink-line ornaments:
   clouds, waves, pine, dragon coil), kanji numerals, feature copy.
7. **Trailer** — letterboxed 16:9 frame: duel on a bridge under the moon; vermilion hanko play button;
   click shows a "premieres soon" card (no real video).
8. **Release** (crimson) — date, platforms as flat tiles, CTA, seigaiha wave band.
9. **Footer** (ink) — hanko, links, credits, vertical motto.

## Motion
- Intro: red flash frame → moon/warrior/title cut in on diagonals (hard, fast).
- Hero parallax (moon slow, warrior/roof faster, shards drift).
- Slash stage wipe (scrubbed) + blade line + flash.
- `data-cut`: headings/blocks revealed by fast diagonal clip-path wipes on enter.
- `data-glint`: thin bright line sweeps along diagonal section seams on enter.
- Gold panels unfold like a screen (staggered clip wipes); bamboo/mountains parallax.
- Reduced motion: no pin, no wipes, no drift; all content visible.

## Global look
Palette tokens (`--ink`, `--ink-2`, `--crimson`, `--vermilion`, `--gold`, `--rice`, `--steel`), SVG
feTurbulence paper grain overlay, diagonal section edges with `clip-path`, solid offset shadows only,
no rounded cards, no blur, max ~4 colors per screen.
