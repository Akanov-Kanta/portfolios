# Context — what we're building

A personal portfolio for **Nazar Akanov** (`nazarakanov`) that recreates the *feel* of
[igloo.inc](https://www.igloo.inc): an **endless, scroll-driven journey** where the page scroll
flies a camera through a 3D world, station by station, with glitch/chromatic transitions between
them and a **seamless wrap** back to the start.

## The core idea

igloo is not a scrolling document — it's a WebGL experience with no DOM text, a closed shadow root,
and a virtual scroll value. We deliberately do **the accessible version of the same feeling**:

- The home page is a **real HTML document** (SEO, screen readers, Tab, text selection, Ctrl-F all work).
- On desktop, **Lenis `infinite`** wraps the scroll; the last section is a client-only, `aria-hidden` +
  `inert` **clone of the hero**, so the bottom frame is pixel-identical to the top and the loop seam is
  invisible.
- **One persistent React Three Fiber `<Canvas>`** flies a camera along a **closed Catmull–Rom curve**
  through the stations; the final segment ends exactly on the hero pose, so `t = 1 ≡ 0`.
- Everything textual is DOM; the 3D is the atmosphere behind it.

## The world (theme: a night developer's room)

| Station | DOM content | 3D scene |
|---|---|---|
| **hero** | name, role, manifesto | a low-poly dev room at night — desk, glowing monitors, lamp, shelves, plant |
| **about** | bio, skills, "currently" | camera dollies in through the room |
| **projects** | one article per project | camera "enters the monitor" into a void; one floating device (monitor/laptop/TV) per project, screen textured, stacked downward like igloo's ice blocks |
| **contact** | one pinned screen: "Let's talk", email, social carousel | a portal ride (ring gates → tunnel) into a **server room**: the selected social's **logo as an orb solid** floating over a plinth (igloo's footer object), orbs flee the cursor, the solid bursts and reassembles into the next logo on change; blinking racks |
| → *hero clone* | inert copy of the hero | camera rises out and lands back on the hero — the seamless wrap |

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · TypeScript (strict) · Tailwind v4
- **three 0.186** · **@react-three/fiber 9** · **@react-three/drei 10** · **@react-three/postprocessing 3** / **postprocessing 6**
- **Lenis 1.3** (infinite scroll) · **zustand 5** (state) · **maath** (damping)
- 3D models: **CC0 kits** (Kenney Furniture Kit, KayKit Furniture Bits), composed procedurally; the project
  devices are CC0 **Poly Haven** models (Television 02, Classic Laptop, Television 01). The footer
  orb logos are built at runtime from the brand SVGs (rasterised, then sampled into an extruded orb solid).
- Deployed on **Vercel** with GitHub auto-deploy (`Akanov-Kanta/Akanov-portfolio`, push to `main` → production).
  Live: https://portfolio-alpha-sandy-krad8msap8.vercel.app

## Non-negotiables (what makes this "the accessible igloo")

- The H1 is real text and is the LCP element — **never gated on WebGL**.
- Works with **reduced motion** (static tier: camera cuts, no loop), **no WebGL2** (CSS fallback, all
  content readable), **touch** (native scroll with an invisible wrap), and **keyboard/screen readers**
  (focus never enters the clone; footer links always reachable).
- Adaptive quality tiers (high/medium/low/static) + adaptive DPR; three.js is lazy, never in the first-load JS.

## Phones and the installed app

- A **phone** is touch-primary and narrow (portrait) or short (landscape): `PHONE_MQ` in
  `src/components/world/phone.ts`, mirrored by the `phone:` Tailwind variants. Nothing phone-only runs or
  shows outside it: desktops (any size), touch laptops and tablets keep the desktop experience exactly.
- On a phone the page is the same document with a different shell and runtime: a labelled Dock and an Index
  sheet instead of the desktop HUD, no intro or loading overlay (the world mounts at idle and at rest, then
  develops at the hero), a lighter 3D profile (`quality.PHONE`, culling, lens-shifted framing into DOM
  slots) and a render policy that holds the last frame at rest.
- It is an **installable PWA** on phones: `app/manifest.ts`, `public/sw.js` (never masks a deploy; kill
  switch = the self-destruct worker together with `NEXT_PUBLIC_SW=off`, see README), install / share UI.

## How to run & verify

See `README.md`. Content lives in `src/content/site.ts`; models rebuild with `node scripts/models.mjs`.
Verification scripts live in `scripts/` (loop/seam, modes, a11y, perf, intro, orb cursor + morph, carousel, start).
