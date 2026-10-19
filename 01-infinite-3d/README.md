# nazarakanov — infinite 3D portfolio

An igloo.inc-style endless scroll: a real HTML page whose scroll drives a camera through a low-poly
developer room, a floating stack of project "devices", a portal dive and a server room where the
selected social logo floats as a cursor-reactive orb solid,
then wraps seamlessly back to the start. Built with Next.js 16, React Three Fiber, Lenis and postprocessing.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

## Edit the content

Everything textual lives in `src/content/site.ts` (name, role, manifesto, bio, skills, projects, socials,
credits). Project screenshots go to `public/projects/<slug>.webp` (≈1280×800, ≤150 KB) and are referenced by
`screenshot: "/projects/<slug>.webp"`; without one, a procedural card with the project name is drawn on the
device screen. `device` picks the 3D device (`monitor` | `laptop` | `tv`). The station count and camera path
adapt to the number of projects.

## How the loop works

- `src/components/world/scroll/ScrollLoopProvider.tsx` picks a mode per route: `loop` (desktop: Lenis
  `infinite`), `touch-wrap` (phones: native scroll, instant jump to the top when resting on the clone),
  `finite` (inner pages) or `static` (reduced motion, `?loop=0`, or the "Loop: Off" toggle).
- The last section of the home page is a client-only, `aria-hidden` + `inert` clone of the hero
  (`LoopClone.tsx`), so the bottom frame is pixel-identical to the top frame.
- `scroll/anchors.ts` maps document scroll to a parameter `t` on a closed CatmullRom camera curve
  (`path/stations.ts`, `path/curves.ts`); `scroll/driver.ts` runs on one shared rAF ticker before R3F.
- `post/GlitchCutEffect.ts` is the station-transition effect (tech displacement + chromatic aberration +
  scanlines), driven by the transition bell and scroll velocity.
- `useAutoCenter.ts` never lets you rest mid-transition and centres on the nearest project device.

Query flags: `?q=high|medium|low|static` forces a quality tier, `?loop=0` disables the loop,
`?freeze=1` freezes idle animation (used by the pixel tests), `?probe=1` exposes `window.__cam / __cull / __fx`
to the probes, `?cull=0` disables the phone station culling, `?msaa=0` disables phone MSAA.

## Phones and the installed app (PWA)

One gate decides everything phone-only: `PHONE_MQ` in `src/components/world/phone.ts` (touch-primary and
narrow, or touch-primary and short), mirrored by the `phone:` / `phone-land:` / `phone-app:` Tailwind variants in
`globals.css` (`phone.test.ts` keeps them identical). Desktops (any size), touch laptops and tablets never match
it and behave exactly as before. On a phone: a labelled Dock (landscape: a right rail) and an Index sheet replace
the desktop HUD, there is no intro or loader (the world mounts at idle and at rest, then "develops" at the hero),
the scene runs a lighter profile (`quality.PHONE`, station culling, a 60 / 30 / held-frame render policy), and
`public/sw.js` is registered after load + idle. Phone-only styles live in `src/app/phone-*.css`, every rule inside
the gate.

```bash
npm run pwa:assets                                   # icons, maskable icons, apple-icon, 12 iOS splash images
npm run pwa:assets -- --shots http://localhost:3112  # + the 3 manifest screenshots (from a running `next start`)
npm run phone:probe -- http://localhost:3112 --engine both   # the phone checks P1–P21 (never :3111)
npm run pwa:probe                                    # PWA sections A–M: builds and serves on :3116–3119 itself,
                                                     # rebuilds .next 4 times: stop any `next start` first and
                                                     # run `next build` again afterwards
npm run desktop:baseline -- http://localhost:3112    # desktop + iPad pixel reference (serve the reference tree);
npm run desktop:baseline -- http://localhost:3112 --compare  # later: this tree against it
```

Reports and screenshots go to `test-results/phone-probe`, `test-results/pwa-probe` and
`test-results/desktop-baseline` (`--out=<dir>`, or `--art=<dir>` for the baseline's reference, noise and diffs).
`pwa:probe -- --art=<dir>` also compares first-load JS with `<dir>/step0/build-before.json` when that file exists.

The service worker is network-first for HTML, never caches RSC, and caches only content-hashed static files
cache-first, so a deploy is never masked and needs no worker update. Bump `VERSION` in `public/sw.js` only when
its logic changes, then rerun `pwa:probe` sections E–J. `next dev` always unregisters any worker a local
production run left behind.

**Kill switch** (a worker bug has shipped): ship BOTH in the same deploy:
1. `public/sw.js` replaced by the self-destruct worker:
   ```js
   self.addEventListener("install", () => self.skipWaiting());
   self.addEventListener("activate", (e) => e.waitUntil((async () => { for (const k of await caches.keys()) await caches.delete(k); await self.registration.unregister(); for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url); })()));
   ```
2. the build env `NEXT_PUBLIC_SW=off`: the phone chunk (`PhoneHud` → `register.ts` `scheduleRegister`) stops
   registering, and `PwaRegister` unregisters every worker and deletes the app's own `core|pages|static|assets-*`
   caches, on every device.

Never ship the self-destruct worker alone: the phone chunk would re-register it at idle on every phone load, and
it navigates its clients on activation, so phones would reload in a loop.

## 3D models

The room is composed from CC0 kits (Kenney Furniture Kit, KayKit Furniture Bits); the three project
devices are CC0 Poly Haven models (`devices.glb`). See `public/models/CREDITS.md`. Raw downloads live in
`assets-src/` (git-ignored; missing Poly Haven sources are fetched by the script). Rebuild the optimised GLBs with:

```bash
npm run models
```

Room dressing is a data table in `src/components/world/scenes/layout.ts`.

## Checks

```bash
npm test                               # mapping / curve / flight unit tests
npm run typecheck                      # route types + tsc
node scripts/loop-probe.mjs            # one lap + seam pixel diff (needs a dev server on :3111)
node scripts/modes-probe.mjs           # reduced motion, iPhone touch-wrap, no WebGL, inner route
node scripts/a11y-probe.mjs            # axe + Tab order
node scripts/world-perf.mjs            # headed fps / frame time / long tasks
node scripts/glass-probe.mjs           # monitor-dive window: fps, GPU ms, mid-flight shader links / uploads
node scripts/mascot-probe.mjs          # footer orb logo reacts to the cursor
node scripts/icon3d-probe.mjs          # footer orb logo morphs on platform change
node scripts/carousel-probe.mjs        # social carousel labels + icons cycle
node scripts/intro-probe.mjs           # intro descent + loader
node scripts/start-probe.mjs           # contact screen start state
node scripts/jitter-probe.mjs          # camera jitter (FREEZE=1 for frozen frames)
node scripts/footer-shot.mjs           # contact screen screenshots
```
