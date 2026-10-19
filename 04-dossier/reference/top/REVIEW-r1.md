# REVIEW r1: CASE FILE (hybrid/, commit d88cf96 + this round's uncommitted polish)

I reviewed the build the way an Awwwards jury would, against `reference/top/DIRECTION.md` (§2 diagnosis, §3A brief), and fixed what I found.

**Not committed.** Copy in `src/content/site.ts` is untouched.

**Verification:**
- `npm run lint` and `npx tsc --noEmit` are clean.
- `node scripts/casefile-flow.mjs` passes. It covers keyboard, Back, Esc, next file, the header hide/focus/return, and sound.
- `node scripts/review-shots.mjs`: 0 console errors or warnings on desktop 1440x900, phone 390x844, reduced motion and every sequence.

**Shots:** in `hybrid/shots/casefile-r2/`.

| Folder | Contents |
|---|---|
| `before/`, `after/` | `d-walk-*` / `m-walk-*`: a still every 0.6 viewport, wheel-scrolled, plus `*-walk-up` after a short scroll up |
| | `seq-coldopen`, `seq-hover`, `seq-open`, `seq-close`: 120 ms screencast frames |
| | `x-reduced-*`: reduced motion |
| `after/` only | `seq-open-phone/` and `m-file.png` |
| `pairs/` | before/after pairs and the sequence sheets |

## Scorecard against the DIRECTION numbers

| Check (DIRECTION §2) | Target | r1 build | Now |
|---|---|---|---|
| Type contrast | ≥ 15:1 | Name ≈ 234 px vs 11 px mono = **21:1** ✓ | Same |
| Glow budget | 1 element per screen | Only the typing caption line glows ✓ | Same |
| Layers / movers | ≤ 3 layers, ≤ 1 mover | Hero has footage + name + mono (+ caption). The footage is the one mover ✓ | Same. The header slide is chrome, and only happens on scroll. |
| Grid | 12 columns, 40–56 px | ✓ (`--m`/`--g` clamp to 32–56) | Same |
| Name legible | < 2 s | Hard cut at 1.44 s, hero at 1.56 s ✓ (`before/seq-coldopen`) | Same |
| Real work on screen | ≥ 40% vp | Recordings in the strip and in the file ✓ | Same |
| Fixed chrome never collides | — | ✗ The difference-blend header sat over 200 px display type, recordings and stack rows | ✓ Fixed (below) |
| Transitions carry one element | 0.6–1.4 s | ✓ strip→plate FLIP, 1.5 s | ✓ bracket→iris, 1.6 s, plus the eye motif |
| No empty bands | — | ✗ Contact's last screen had ~160 px, ~100 px and ~130 px black bands | ✓ Tightened |
| Sharp imagery | — | ✗ Contact eye strip was a 540 px poster crop shown at ~660 px (≈2.4x on retina) | ✓ New 2x asset, capped at 600 px |
| IP / own material | Own material | ✗ Still the @pzxepitsu / MAPPA footage (credited as "demo only") | ✗ Unchanged. See "Left". |

## What I changed

### 1. Header: hides on scroll-down, returns as a solid band on scroll-up
Files: `Header.tsx`, `globals.css`

**Problem.** The fixed 11 px mono line used `mix-blend-mode: difference` and sat on top of everything:
- "NISCOURSES" and "OPEN FILE"
- the stack rows
- the phone's "AKANOV"

See `pairs/pair_header_scrolldown.jpg` and `pairs/pair_header_phone.jpg`.

**Now.** The header has three states, set on `data-state` from one rAF-throttled window scroll listener. Lenis drives window scroll, so this works with and without Lenis.

| State | When | Look and motion |
|---|---|---|
| **top** | at the top of the page | transparent, over the hero's empty top band |
| **hidden** | scrolling down past 2 bar heights | slides up in 220 ms on the slam curve |
| **band** | any scroll up | solid `--ink` band with a 1 px hairline inside the margins; comes back in 320 ms, expo out |

- `:focus-within` always shows it, so keyboard users never lose it.
- Reduced motion: state changes are instant.
- The blend is gone.
- See `pairs/pair_header_scrollup.jpg`.

### 2. Bracket-to-iris file open (and the reverse on close)
Files: `FileRow.tsx`, `FileView.tsx`, `globals.css`. This was the missing piece from the brief.

**Row brackets.**
- On hover or focus the row's evidence strip now gets **viewfinder brackets**: four 12 px corners just outside the strip.
- They cut in as the 180 ms slam lands, with no extra motion.
- On phones and coarse pointers they are always on, with the static strip.

**Open (measured in `after/seq-open`, `pairs/after_seq_open.jpg`).** One mover at a time:

| Time | What happens |
|---|---|
| 0–280 ms | The brackets close onto the strip's centre (power3.in) |
| 280 ms | Cut to a ring 40–72 px across |
| 280–980 ms | The ring is an iris: a circular `clip-path` opens over the black page and reveals the recording full screen (power4.inOut). The 1 px ring rides the mask edge. |
| ≈1.08 s | Hard cut to paper |
| ≈1.08–1.6 s | The plate settles into its slot (600 ms, expo out, unchanged) |

**Close (`pairs/after_seq_close.jpg`).**

| Time | What happens |
|---|---|
| 0–400 ms | The plate grows to full screen (unchanged) |
| 400 ms | Cut to black |
| 400 ms–1.0 s | The iris closes onto the row's strip |
| 1.0–1.24 s | The ring opens back into its brackets |

**Phone:** same choreography, measured in `after/seq-open-phone`.

**Bug fixed along the way.** Making the page `inert` blurred the row, which hard-cut the strip away *while the file was opening*: the old FLIP grew from an already-empty box. Now:
- `file-open` is set before `inert`.
- `deactivate()` ignores blur while a file is open.

### 3. Index hover: scrambles no longer leak across rows
Files: `scramble.ts` (new `unscramble`), `FileRow.tsx`

Sweeping the pointer across the index left every row it passed scrambling its metadata for 450 ms; see `before/seq-hover/01_120ms.jpg`, where all three rows are scrambling. Leaving a row now kills its scramble and restores the text at once, a hard cut.

### 4. Contact eye strip: sharp
Files: `public/media/eye-strip@2x.jpg` (new), `content/footage.ts`, `Contact.tsx`

- **Source.** The strip now comes from the full-quality edit frame (`reference/frames/t_06.50.jpg`, 82 kB JPEG at 960x720) instead of the 38 kB poster.
- **Processing:**
  - cropped to the eyes (x 150–566, y 212–322), dropping the dead white left third
  - median 3
  - Lanczos 2x to 832x220
  - unsharp (r 1.4, 80%)
  - mean-neutral film grain
  - whites capped at #F0F0F0
- **Display.** It is a plain `<img>` with intrinsic size, at grid columns 1–5, `max-width: 600px`. That keeps it near native at 1x, and the grain hides retina softness.
- See `pairs/pair_eye_strip_1to1.jpg`.
- The source is still a soft 960 px edit, so this is as sharp as it can get. The real fix is the owner's own macro shot; see "Left".

### 5. Empty black: contact and section rhythm
Files: `tokens.css` (`--sec-gap`), `globals.css`

| Spacing | Before | After |
|---|---|---|
| Profile and contact `padding-top` | `clamp(120px, 20vh, 220px)` | `--sec-gap: clamp(96px, 14vh, 150px)` |
| Contact, eye strip to email | `clamp(48px, 7vw, 120px)` | `clamp(40px, 5vw, 80px)` |
| Contact, email to socials | 32–56 px | 24–40 px |
| Contact, before colophon | `clamp(96px, 14vh, 160px)` | `clamp(56px, 8vh, 96px)` |

- The meta now aligns to the top of the strip.
- The page's last screen is now the profile tail plus the whole contact, with no dead bands. Document height went from 3262 to 3050 px on desktop, and from 4044 to 3892 px on phone. See `pairs/pair_contact_end.jpg`.

### 6. Tooling
- `scripts/review-shots.mjs` (new):
  - a wheel-driven page walk to the true bottom, plus a scroll-up still
  - 120 ms CDP screencast sequences of the cold open, hover, open and close
  - reduced-motion stills
- `scripts/casefile-flow.mjs`: now checks header hidden → focus shows it → scroll-up gives the band, before toggling sound (the old click failed once the header hid).
- `README.md` updated.

## Checked, left as built (with reasons)

- **Cold open → hero** (`before/seq-coldopen`).
  - The counter runs 000→100 over 0.12–1.32 s (power2.inOut), in the display face in the name's own box.
  - "SUBJECT: NAZAR AKANOV" is fully typed by ≈1.1 s.
  - Then a 120 ms hold, a 50 ms #F0F0F0 frame, and a hard cut at 1.44 s; the hero is in by 1.56 s.
  - On target.
  - Frame 0 in the sequence is white, but that is Playwright's about:blank, not the site.
- **ENTER / ENTER SILENT gate: not added.**
  - The open is 1.3 s and non-blocking. A choice inside it would vanish before most people read it.
  - A blocking gate would push the name past 2 s, breaking diagnosis #9.
  - The header's SOUND toggle remains the explicit opt-in, and it is off by default.
  - If the owner wants a gate, put it *after* the hit as a one-line mono prompt under the caption, not in front of the name.
- **Hero breathing (1.5% over 6 s): not added.** The hero's one mover is already the footage, which plays at real time. Scaling its frame as well would be a second mover on the same screen.
- **Hover strip.**
  - Slam in 120–240 ms, the ±6 px two-frame jitter, then the recording.
  - The other names drop to `--fg-3` as a hard cut. Good.
  - The recording's first ~0.7 s is the GLASSBOX landing page before it scrolls to "Watch it write". That is the recording itself, not a poster mismatch.
- **Reduced motion.**
  - No cold open, no Lenis, captions fully shown.
  - The file opens instantly.
  - The header changes state with no transition.
  - See `after/x-reduced-*`.
- **Keyboard.**
  - Focusing a row opens its strip.
  - Enter opens the file, and focus lands on Close.
  - The page behind is `inert`.
  - Esc or Back closes it, and focus returns to the row.
- **Header time and sound.** The clock ticks (Astana, UTC+5) and the sound toggle flips `aria-pressed`. Both are verified in `casefile-flow`.

## Left (in priority order)

1. **Own material instead of the edit (the biggest gap to "premium").** The hero loop and the contact still are still @pzxepitsu / MAPPA frames, labelled "demo only".
   - Per DIRECTION §4, before any public launch replace them with:
     - the owner's thresholded portrait cut-out
     - 6–8 scanned ink bursts
     - 10 macro shots of his own eye for the strip
   - The pipeline (`footage.ts`, `CollageLoop`, `EYE_STRIP`) takes new sources without code changes beyond the content files.
2. **NISCOURSES has no recording**, only a still, so its strip and plate never move. Record 10 s of the phone flows (grayscale, like the other two).
3. **Iris on phones.** The full-screen moment cover-crops a 16:10 recording into 390x844, about a 2.6x zoom, for roughly 0.7 s. Consider letterboxing the plate (`object-fit: contain` on a black ground) during the iris on portrait screens.
4. **Copy to confirm with the owner** (not touched):
   - `Profile.tsx` hard-codes a second "Now" line, "Digging into fine-tuning and evaluation.", outside `site.ts`.
   - Contact shows the email twice (meta row plus the display line), by design. Drop the meta row if it reads as redundant.
5. **Performance not measured.** No `next build` this round. Before launch, check LCP ≤ 2.0 s and JS weight with a production build.
