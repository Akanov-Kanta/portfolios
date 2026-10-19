# ONI — late-night ramen bar / izakaya

A one-page landing in the "Program" style (Animatrix × ukiyo-e): flat posterized fields,
hard offset shadows, diagonals, a giant moon, gold-leaf screens, paper grain, slash-wipe cuts.
Stack: Next.js 16 (App Router, TS), Tailwind v4, GSAP + ScrollTrigger (`@gsap/react`).

## Palette / type
- Tokens from STYLE.md: `ink #0B1622`, `ink-2 #16283A`, `crimson #9E1B1B`, `vermilion #E2401C`,
  `gold #C9A24A`, `rice #ECE6D8`, `steel #5FA8D3`. Max ~4 per screen.
- Display: Shippori Mincho B1 (next/font). UI/body: Barlow Condensed (narrow grotesk), tracked small caps labels.
- Vertical kanji labels via `writing-mode: vertical-rl`. Red hanko seal used as a recurring mark.

## Sections
1. **Intro cut** — full-screen ink cover with the oni mask; a blade line draws diagonally, a red flash
   frame (~80ms), then the cover splits along the diagonal and the two halves slide apart.
2. **Nav** — oni-mask logo + ONI wordmark, section links, vermilion "Reserve" button with hard shadow.
   Turns solid ink with a gold rule after scroll. Mobile: slash-wipe full-screen menu.
3. **Hero** — crimson sky, giant steel moon with flat crater patches, stylised ukiyo-e clouds,
   rooftops + utility wires, a diagonal string of chōchin lanterns with flat (hard-edged) glow rings,
   izakaya front with noren and warm doorway light, brush-stroke steam, foreground tiled-roof diagonal,
   flying ash/petals. Giant "ONI" title with hard shadow, vertical kanji, hanko, CTAs.
   Parallax per layer, lantern sway, steam drawing loop.
4. **Ticker** — tilted vermilion band, marquee of dishes / hours.
5. **Menu (品書き)** — a gold-leaf folding screen (byōbu): 4 tall panels with alternating fold shading,
   kirikane grid, ink-line clouds/waves and a faint dragon spanning the panels. Tabs (hanging plaques)
   for Ramen / Small plates / Sake. Each panel = one dish: ink+vermilion illustration, name,
   kanji, description, price. Screen "unfolds" on scroll; tab switch = slash wipe.
6. **Story / atmosphere** — rice-paper section, big sumi brush stroke, noren curtain illustration
   swaying in a lit doorway, three beats numbered 一 二 三, stats strip.
7. **Chef** — ink + crimson diagonal split, chef silhouette mid-flick of the noodle strainer
   (a "yukiri" slash arc with flying droplets) against a giant vermilion disc, steel rim light. Quote.
8. **Visit** — hours plaque (today highlighted client-side), address/contact, illustrated map
   (river with seigaiha waves, rail bridge, station, shrine torii, park pines, walking route, pulsing pin).
9. **Reserve (予約)** — rice-paper form card with hard shadow beside a large oni mask.
   Fields: name, phone, email, date, time (slots depend on day), guests (1–8), seating, notes.
   Validation (required, formats, closed Mondays, ≤30 days ahead, seating vs party size),
   inline errors + focus management, fake submit → flash frame + hanko stamp success state with a reference code.
10. **Footer** — ink, rising moon segment, rooftops, logo, links, vertical "夜はこれから".

## Illustrations (all inline SVG)
OniMask, Hanko, Lantern, HeroScene, Steam, Cloud/Wave/Dragon ornaments, dish art (4 ramen, 4 plates, 4 drinks),
Noren, ChefArt, MapArt, rooftops.

## Motion
- Global `Motion` client component: `[data-reveal=slash]` diagonal clip-path wipes, `[data-parallax]` scrub,
  `[data-glint]` blade glint sweep, section-edge slash lines.
- Hero intro timeline, lantern sway, steam, menu unfold + tab wipe, success stamp flash.
- `gsap.matchMedia` gates everything behind `prefers-reduced-motion: no-preference`; CSS disables keyframes
  under `reduce`. Content is visible without JS (intro cover auto-hides via CSS fallback).

## Constraints
- Responsive to 375px, no horizontal scroll (`overflow-x: clip`).
- No `Date` reads during render (cacheComponents prerender) — only in `useSyncExternalStore` snapshots / handlers.
