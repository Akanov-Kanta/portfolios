# Progress — what's done

Status as of the latest deploy. Each item is live and verified (screenshots + scripted probes).

## Foundations
- [x] Next.js 16 / React 19 / TS / Tailwind v4 scaffold; strict typecheck + ESLint clean.
- [x] Content model in `src/content/site.ts` (name, role, manifesto, bio, skills, projects, socials,
      credits) — placeholders, editable in one place.
- [x] Shared state: `world-store.ts` (discrete zustand values) + a mutable per-frame `frame` object;
      one rAF **ticker** (`ticker.ts`) drives Lenis (−10) → driver (−5) → R3F (0) → DOM labels (+10).

## The infinite loop (accessible)
- [x] `ScrollLoopProvider` picks a mode per route: **loop** (desktop Lenis infinite), **touch-wrap**
      (phones: native scroll + invisible jump at rest), **finite** (inner pages), **static** (reduced
      motion / `?loop=0` / Loop-off).
- [x] `LoopClone` — inert, `aria-hidden` clone of the hero as the last section → seam is invisible
      (seam pixel diff ~0.01%).
- [x] `anchors.ts` maps document scroll → curve parameter `t`, transition bell, station, device index
      (unit-tested); `useAutoCenter` never rests you mid-transition and snaps to the nearest project.
- [x] Closed Catmull–Rom camera path (`stations.ts`, `curves.ts`, `CameraRig.tsx`) with pointer
      parallax, damping, hand-held noise, portrait zoom; route flights take the shortest way round.
- [x] `history.scrollRestoration = "manual"` + reset to top on load → the page always **opens at the
      hero room** (fixed a reload-restores-footer regression).

## The 3D world
- [x] Persistent `<Canvas frameloop="never">`, advanced by the ticker; `compileAsync` warm-up, 700ms
      fade-in, distance culling, adaptive DPR (drei `PerformanceMonitor`), context-loss remount.
- [x] Quality tiers high/medium/low/static; three.js lazy-loaded (not in first-load JS).
- [x] Scenes: **Room** (kit pieces from a data table, emissive procedural "code" screens, lamp dust),
      **Devices** (one floating device per project with its screen texture), **Portal** (ring gates +
      tunnel), **ServerRoom** (plinth, orb logo, blinking racks), **Sky** (stars), **Gates** (particle rings),
      **GlyphRain** (falling mono glyphs in the void).
- [x] Model pipeline `scripts/models.mjs`: Kenney + KayKit → Draco-compressed `kit.glb` (~93 KB), Poly Haven
      devices → `devices.glb` (~485 KB, WebP + Draco; metal-roughness maps at 512); credits in `public/models/CREDITS.md` and `site.credits`
      (not rendered on the page yet).

## Motion & polish (igloo-level)
- [x] **Intro sequence**: ASCII loader → camera descends while the room **assembles** piece by piece;
      scroll locked until it lands.
- [x] **Full-page loading screen** (desktop): up from the first paint (SSR, `html[data-loading]`, scroll
      locked) until the document + fonts, the world (models preloaded from the head, shaders compiled),
      late assets (`holdLoad`: screenshots, orb logos) and 20 warm-up frames are done; then the intro
      plays. Staged label (`LOADING PAGE / WORLD / ASSETS / WARMING UP n/4`), 20 s cap. ~1.0 s locally.
- [x] **GlitchCut** post effect: rising diagonal tear + block displacement + chromatic aberration +
      scanlines + bright edge, driven by transition progress and scroll velocity. Bloom + vignette.
- [x] **Anchored data labels** with leader lines (MON_01, LAMP, FICUS, per-project TEMP, UNIT_07,
      RACK_A) projected from 3D points onto DOM.
- [x] **Scramble text** on manifesto, headings, project titles, HUD counter (re-scrambles on view).
- [x] **Custom crosshair cursor** (fine pointers); **synth ambient sound** (off by default, Web Audio,
      per-station drone + blips).
- [x] Fixed a unit bug where `advance()` got milliseconds → per-frame random jitter (now seconds).

## Footer (the "contact" station)
- [x] **Orb logo on the plinth** (`IconCloud.tsx`, igloo's footer object): the selected social's brand SVG
      is rasterised once and sampled into a fixed-count set of orbs on the front/back faces and the
      extruded rim (`icon-cloud-geometry.ts`). Drawn as shaded sphere impostors (points with a
      per-fragment sphere normal, real depth), lit ice/slate with cyan + brand accents.
- [x] **Cursor field**: orbs flee the pointer (projected to the object's depth) and a slower trailing
      point leaves a wake; scroll velocity loosens the solid. Idle: slow turn, bob, surface shimmer.
- [x] **Morph on change**: every logo shares one buffer, so a platform change freezes the orbs where
      they are, aims them at the next logo, and each orb leaves on its own schedule with a burst
      mid-flight (~1.1 s). Carousel changes only on input (arrows, dots, keys); no timer.
- [x] **Contact is one pinned screen** (150svh section, sticky 100svh stage), framed like igloo:
      heading + email + status top-left, a large orb logo (3.3 units, 80k orbs on high) just above the
      plinth, thin line-and-tick arrows about a quarter in from each side, platform label in the ring.
      No footer strip; Sound and Loop live in the HUD corner. Nothing sits in the stage's top 15%.
- [x] **Captions dissolve like igloo**: as a block scrolls off, its captions are held nearly in place
      (counter-translate, ~10svh net drift) and dissolve bottom-up: a mask edge sweeps upward while the
      text blurs, smears into a red/cyan fringe and fades. Pure CSS (`@property --dz` driven by the
      block's `view()` timeline), staggered per caption, reduced-motion exempt, seam-neutral. The 3D data
      labels type themselves off character by character as the transition starts.
- [x] DOM keeps the accessible controls (arrows, bracketed scrambled label, dimmed neighbours, dots,
      real links); the DOM icon is the no-WebGL fallback. The robot model and its credit are gone.

## One world, one night (web-research build, 4 lanes + integration)
- [x] **Shared art direction** in `world/theme.ts` (palette, per-station `MOODS`, `EASE`, `DUR`, `fx`
      per-frame values) and `world/sfx-bus.ts`; CSS mirrors the tokens on `:root`.
- [x] **Atmosphere**: mood interpolated along the lap (`Atmosphere.tsx`, useFrame -40), diagonal
      fog + floor mist baked into three's fog chunks, smoke ribbons, window light shafts, blob contact
      shadows, void bokeh + text cylinder, accent-tinted devices, velocity-stretched stars/glyphs.
      `fx.featureLevel` trims atmosphere before DPR drops.
- [x] **Post**: `GradeEffect` (lift/gain/gamma, saturation, diagonal multiply, moon glare, breathing
      vignette, grain) merged into the single effect pass; per-boundary GlitchCut flavours; portal
      ring swirl; enter-project frost; high-tier dual-render ice cut (about→projects).
- [x] **HUD / DOM**: two-front scramble reveal + hover replay, masked caption reveal, `LapMap`,
      `StatusLine`, `Odometer`, `[NA]` monogram + icon + OG image, loader→H1 handoff and HUD boot,
      project lockups/accents, `NextProject`, mood-band no-WebGL fallback, `--vel` skew on display type.
- [x] **Feel**: Lenis lerp 0.075 + second smoothing stage, fBm steadicam, velocity FOV, cursor light,
      cursor states (`data-cursor`), magnetic controls, four crossfaded audio beds + one-shots,
      curl-noise orb morph, carousel impulse (`fx.impulse`).
- [x] **Integration**: `labels-registry.ts` no longer imports R3F at runtime (`LabelsBridge` moved into
      `WorldCanvas`), so three/R3F left first-load JS (home ~208 KB gz of JS, was ~437 KB with
      three in it). Cursor-none widened to `label`/`[role=button]`/`[data-cursor]`; stray hard-coded
      easings moved to theme tokens; carousel/modes probes updated to the new DOM.
## UI pass from references (magicui, threlte, jitter, componentry, motion)
- [x] **Particle-typography hero name** (componentry): the H1 is drawn as a dot matrix sampled from
      its own glyphs; dots scatter from the cursor and spring back. The real text stays in the DOM (LCP,
      SEO, selection) and turns transparent only after the canvas draws; reduced motion keeps text.
      The loop sleeps when idle; rest positions are a fixed grid, so the loop clone matches.
- [x] **Glass pill nav** (top-centre; phones top-right with numbers) replaces the "01 / 04 HOME"
      counter; active station pops in on a spring-shaped curve.
- [x] **About**: Jitter-style word scrub on the bio (CSS view() timeline per word) and a gapless
      2-column bento (Stack / Now / Based in) of Magic UI spotlight cards (cursor-lit fill + border).
- [x] **CTAs**: solid "Email me" pill with a shimmer sweep (primary), glass "Open project" pill
      (secondary), both with a magnetic spring pull. One radius scale: cards 14px, pills full.
- [x] No Motion dependency shipped: springs are hand-written; first-load JS +1.8 KB.

## Integration of the research polish + deferred items
- [x] **Merge**: research polish (branched before the UI pass) merged with main. The [NA] monogram
      replaces the wordmark, the nav pill carries the active station, LapMap replaces the progress ring;
      the particle name, bento and pills keep the research `data-cursor` / `data-sfx` hooks.
- [x] **3D labels avoid DOM text**: `data-label-avoid` keep-out zones (manifesto, name, nav, LapMap);
      a label flips side or hides instead of overlapping (LAMP vs manifesto at 1280/1440).
- [x] **Phones**: `.station { overflow-x: clip }` stops the particle canvas bleed from widening the
      viewport (it pushed the nav pill off-screen at 375); monogram stays closed under 640px.
- [x] **metadataBase** always set (NEXT_PUBLIC_SITE_URL, then Vercel system URLs, then localhost).
- [x] **Contact**: letter-roll on copy-email and carousel side labels; arrow roll on the side arrows.
- [x] **View Transitions** (React `<ViewTransition>`, no config): project title morphs home <-> detail,
      page crossfade 260ms; off under reduced motion; canvas persists.
- [x] **Cursor-trail re-scramble**: fast pointer passes flip the Scramble letters under it for ~160ms.
- [x] **Server room**: high-tier planar reflection floor (reflection layer only, renders only near
      contact), cursor-revealed cyan floor grid, the 56 rack LEDs as one InstancedMesh (-55 draw calls).
- [x] **Orbs**: per-orb underdamped springs on the morph settle and the cursor flee (GPU, no allocation).
- [x] **Ice-cut pop fixed**: weighted blend of the two renders plus camera convergence, no hard switch.
- [x] **Enter-the-monitor dive** (high): the right monitor shows a live render of the void; the camera
      flies into the screen and comes out in the void. Replaces the ice cut on high for about->projects.
- [x] **Intro shockwave**: radial lens push + red/cyan split from the H1 when the intro ends (not on
      reduced motion or static; never gates the H1).
- [x] **loop-probe**: the seam frame is now captured with the clone exactly at 0 (Lenis' immediate
      scrollTo sometimes landed 1px short, which the dot-matrix name turned into ~1.9% false diffs).

## Phone profile + installable app (branch mobile-pwa: Step 0 contract, 5 lanes + integration)
- [x] **One gate**: `PHONE_MQ` (`world/phone.ts`) = the `phone:` / `phone-land:` / `phone-app:` Tailwind variants
      (`phone.test.ts` keeps them identical); every phone rule lives in `app/phone-*.css` inside the gate.
      Desktops, touch laptops and tablets are unchanged (pixel baseline at 1440, 1280 and iPad within noise).
- [x] **Shell**: labelled Dock (HOME / ABOUT / WORK / CONTACT + Menu; landscape: a right rail) that recedes
      on fast flicks, a full-screen Index sheet (stations, projects, socials, Sound / Still / Haptics /
      Load 3D world, install row, telemetry), adjacent tabs as native smooth scrolls, far ones through a
      150 ms veil + camera cut, a settle after scrollend instead of CSS snap, Back to the project's stop.
- [x] **Runtime**: no intro or loader on phones; the world mounts at idle and at rest (never under a
      finger), Save-Data / 2G wait for 'Load 3D world', and the room "develops" at the hero; a 60 / 30 fps /
      held-frame render policy with a virtual clock and a DPR ladder; 0 draw calls and ~16 ms/s of main
      thread at rest; a CSS GlowPoster fills the first screen before WebGL.
- [x] **3D profile**: DOM frame slots + a projection-only lens shift, devices centred, station culling,
      a constant 5-light rig, the static kit merged per material (hero 21 draws), MSAA where supported.
- [x] **Stations**: phone type scale, caption-lite (opacity / transform only), one-screen project stops with
      DeviceCard stand-ins, a contact stage with the orb slot (tap / hold / flick) and a 2x2 social grid.
- [x] **PWA**: manifest, maskable icons, 12 iOS splash images, `public/sw.js` (network-first HTML, RSC never
      cached, hashed statics cache-first), registered on phones only after load + idle; install offer on
      Android, instructions on iOS, Share when installed; offline page; kill switch (README).
- [x] **Integration fixes**: the rest gate counts a finger from its pointerdown (which precedes touchstart
      and is itself a mount intent: the world used to mount under the first touch); the closed Index sheet
      first renders at rest too; WebKit scroll anchoring disabled on phones (it chased the scroll-driven
      caption transforms and slid a released scroll onward); the phone scroll position read once per scroll
      event, none in rAF (rest cost 60 → 16 ms/s), and no time-based CSS animation running while the page
      scrolls (the Dock's recede eased on the Dock tick, the Email shimmer held while moving; P6 style
      recalcs per scrolling frame); the loop clone aligned to whole device pixels and the particle name
      on its own layer (seam 1.6 % → 0.2 % at DPR 2.625); finite hint breath and Email shimmer on phones;
      the phone mount and SW registration moved into lazy chunks. Probes: `npm run phone:probe`,
      `npm run pwa:probe`.
- [x] **Route changes on phones cut, never fly**: a project page cuts to that project's own device (it used
      to park at device 0, and Next's scroll-to-top read as the hero sent the camera up into the room for
      ~2 s); the Dock's inner-page tabs, '← Back to projects' and the monogram cut to the stop the page
      lands on (a project page shows only its device: the server room is culled there). The Dock and the
      monogram ride their own view-transition layers, so a route's page fade never draws over them. The
      world mounts offline only from cached assets, or once a HEAD to the origin answers (navigator.onLine
      lies with the server down), and only once its own JS chunk has loaded (else the poster stays and
      'online' retries). A phone lazy chunk that can't load (offline, uncached) never takes the route down:
      the Dock / sheet just stay away until it can.

## Quality bar currently met
- 60 fps idle & scrolling (Apple M4), world ready ~0.6 s, 0 long tasks.
- Lighthouse mobile: performance ~98, a11y 100, best-practices 100, SEO 100; LCP ~2.3 s, CLS 0.
- axe: 0 violations; Tab never enters the clone; footer links reachable.
- All modes verified: reduced motion, iPhone touch-wrap, no-WebGL, inner routes with persistent canvas.

## Still placeholder (content, not code)
- Real name/bio/projects/screenshots/socials/city — edit `src/content/site.ts` + drop
  `public/projects/<slug>.webp`. The scene count adapts to the number of projects.
