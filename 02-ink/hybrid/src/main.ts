import 'lenis/dist/lenis.css';
import './style.css';
import gsap from 'gsap';
import Lenis from 'lenis';
import { content } from './content';
import { buildDOM } from './dom';
import { Typed } from './type';
import { Veins } from './veins';
import { Renderer, type Foot, type Uniforms } from './gl/renderer';
import { Footage, type ClipName } from './footage';
import { scramble } from './scramble';
import { Garden, type GardenOpts } from './garden';
import { Soundtrack } from './sound';
import { Dossier } from './dossier';
import { Slams } from './stack';

const params = new URLSearchParams(location.search);
const reduced =
  matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');
// ?freeze=1 (tests): no clock, no idle glitches, no cursor, CSS animations settled, so two
// screenshots of the same scroll state are pixel-identical (seam diff in scripts/loop-probe.mjs)
const freeze = params.has('freeze');
const root = document.documentElement;
root.classList.toggle('reduced', reduced);
root.classList.toggle('freeze', freeze);
document.title = content.meta.title;

const refs = buildDOM(content);

// ------------------------------------------------------------------ timeline map (scroll units, 100 = 1 viewport)
const CUT = { about: 200, work: 405, stack: 640, outro: 860 };
// stack -> outro: halftone dots of paper grow out of the red until they are the paper (1.2 viewports)
const BLEACH = { start: 860, end: 980 };
// outro beats: footage scrub, black ink eats it, handle types on the void
const OUTRO = { foot0: 960, footEnd: 1095, eat0: 1070, eat1: 1145, text: 1133 };
// the way back: after the handle, A's vortex swirls in from the dark and brings the hero footage
// back; from RET.full to LAP the frame is exactly the T = 0 frame, which is where the scroll wraps
const RET = { start: 1215, full: 1315 };
const LAP = 1345;
// loop: Lenis infinite (desktop). touch-wrap: native scroll + jump to the top at rest on the end
// (identical frame). static: reduced motion, a normal finite page that ends on the handle.
type LoopMode = 'loop' | 'touch-wrap' | 'static';
const coarse = matchMedia('(pointer: coarse)').matches;
const loopMode: LoopMode = reduced || params.get('loop') === '0' ? 'static' : coarse ? 'touch-wrap' : 'loop';
root.dataset.loop = loopMode;
const TOTAL = loopMode === 'static' ? RET.start : LAP;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const SCENE_KEYS = ['hero', 'about', 'work', 'stack', 'outro'] as const;

// ------------------------------------------------------------------ renderer (WebGL2, else CSS fallback)
const canvas = document.createElement('canvas');
canvas.id = 'gl';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
let renderer: Renderer | null = null;
try {
  if (!params.has('nogl')) renderer = new Renderer(canvas);
} catch (e) {
  console.warn('[ink] WebGL unavailable, using CSS fallback.', e);
}
if (!renderer) {
  canvas.remove();
  root.classList.add('no-webgl');
}

const footage = new Footage(matchMedia('(max-width: 699px)').matches ? 48 : 96);
const veins = new Veins(content.work.projects.length);
if (!renderer) refs.scenes[2].prepend(veins.canvas);

// ------------------------------------------------------------------ typed subtitles
const typed = {
  heroKicker: new Typed(refs.heroKicker, [content.hero.kicker], { speed: 30, delay: 300 }),
  heroSub: new Typed(refs.heroSub, [content.hero.subtitle], { speed: 38, delay: 900 }),
  about: new Typed(refs.aboutNarr, [content.about.label, ...content.about.lines], { speed: 24, delay: 500 }),
  work: new Typed(refs.workNarr, [content.work.label, ...content.work.lines], { speed: 26, delay: 150 }),
  stack: new Typed(refs.stackNarr, [content.stack.label, ...content.stack.lines], { speed: 26, delay: 100 }),
  outroNarr: new Typed(refs.outroNarr, [content.outro.label, ...content.outro.lines], { speed: 26, delay: 200 }),
};
// ------------------------------------------------------------------ Type Garden words (src/garden.ts)
// the hero name and the outro handle are typed letter by letter on a 2D canvas that sits inside the
// word's element (so it follows its transforms), and stems, thorns, leaves and roses grow out of them
const SITE_RED = '#ff3d2e'; // Type Garden "Rose noir" #FF1400, pulled toward the site's coral
const SITE_STEM = '#5a5cff'; // #3257FF, pulled toward the post pass's blue/violet edge glint
const gardenBase = { red: SITE_RED, blue: SITE_STEM, line: '#ffbcae', text: '#ffffff' };
function makeGarden(host: HTMLElement, o: Partial<GardenOpts> & Pick<GardenOpts, 'family' | 'weight' | 'glows' | 'palette'>): Garden | null {
  try {
    return new Garden(host, { density: 0.8, pace: 125, caretStays: false, still: reduced || !renderer, frozen: freeze, ...o });
  } catch (e) {
    console.warn('[ink] Type Garden unavailable, plain text instead.', e);
    return null;
  }
}
const heroGarden = makeGarden(refs.heroName, {
  family: "'Unbounded', 'Arial Black', sans-serif",
  weight: 200,
  // the hero name's CSS text-shadow, in em
  glows: [
    { color: 'rgba(0,0,0,0.75)', blur: 0.46, y: 0.063 },
    { color: 'rgba(255,90,67,0.55)', blur: 0.74 },
    { color: 'rgba(255,255,255,0.4)', blur: 0.23 },
    { color: 'rgba(255,255,255,0.9)', blur: 0.021 },
  ],
  palette: { ...gardenBase, vein: '#140607' },
  // moderate in the hero: it must not cost the name its contrast
  density: 0.7,
  pace: 130,
});
const handleGarden = makeGarden(refs.handle, {
  family: "'Lexend Exa', 'Helvetica Neue', Arial, sans-serif",
  weight: 300,
  glows: [
    { color: 'rgba(255,255,255,0.28)', blur: 1.43 },
    { color: 'rgba(255,255,255,0.5)', blur: 0.54 },
    { color: 'rgba(255,255,255,0.85)', blur: 0.19 },
    { color: '#ffffff', blur: 0.048 },
  ],
  palette: { ...gardenBase, vein: '#07060a' },
  density: 0.9,
  pace: 115,
  caretStays: true,
});
// work cards: each title is typed the same way, and stems + roses grow around the card's frame,
// in a darker red-black palette so they read as a different bloom from the coral vein flowers
const CARD_PALETTE = { red: '#a3000f', blue: '#2a0306', rim: SITE_RED, line: '#0b0000', text: '#ffffff', vein: SITE_RED };
const cardGardens = refs.cards.map((el) =>
  makeGarden(el.querySelector<HTMLElement>('.card-in')!, {
    textEl: el.querySelector<HTMLElement>('.card-title')!,
    family: "'Unbounded', 'Arial Black', sans-serif",
    weight: 300,
    // a dark halo first, so the stems behind a letter never touch its strokes
    glows: [
      { color: 'rgba(0,0,0,0.9)', blur: 0.3 },
      { color: 'rgba(255,255,255,0.35)', blur: 0.62 },
    ],
    palette: CARD_PALETTE,
    density: 0.5,
    pace: 85,
    // the titles are small type: a bit bigger growth than the letters, and the letters stay on top
    scale: 1.25,
    textOnTop: true,
    // the frame's corner roses are the big ones
    frame: window.innerWidth < 700 ? 1.7 : 2.1,
  }),
);
const gardens = [heroGarden, handleGarden, ...cardGardens].filter((g): g is Garden => !!g);

// ------------------------------------------------------------------ project dossier (src/dossier.ts)
// a click on a card bursts ink out of it and the dossier types in; the page holds still meanwhile
const dossier = new Dossier(document.getElementById('app')!, {
  projects: content.work.projects,
  reduced,
  gl: !!renderer,
  makeGarden,
  palette: CARD_PALETTE,
  now: () => gardenNow(),
  pause: () => {
    if (lenis) lenis.stop();
    else root.style.overflow = 'hidden';
  },
  resume: () => {
    if (lenis) lenis.start();
    else root.style.overflow = '';
  },
  glitch: (a) => glitch(a),
});
refs.cards.forEach((el, i) => {
  el.querySelector('.card-in')!.addEventListener('click', (e) => {
    e.preventDefault();
    if (cardOn[i]) dossier.show(i, el);
  });
});
const layoutGardens = () => gardens.forEach((g) => g.layout());
layoutGardens();
document.fonts?.ready.then(layoutGardens);
const gardenNow = () => (freeze ? 100000 : performance.now());

const sceneTyped: Typed[][] = [
  [typed.heroKicker, typed.heroSub],
  [typed.about],
  [typed.work],
  [typed.stack],
  [], // outro text types after the ink has eaten the footage (see updateOutroText)
];

// ------------------------------------------------------------------ state driven by the scrubbed timeline
const P = { zoom: 0, wipe: 0, blots: 0, flood: 0, work: 0, stack: 0, outro: 0, foot: 0, eat: 0, bleach: 0, ret: 0 };
const fx = { glitch: 0, flash: 0 };

const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
const [sHero, sAbout, sWork, sStack, sOutro] = refs.scenes;
const heroBits = refs.heroInner;

tl.set(refs.scenes, { autoAlpha: 0 }, 0)
  .set(sHero, { autoAlpha: 1 }, 0)
  .to(P, { zoom: 1, duration: 200 }, 0)
  .to(heroBits, { scale: 1.18, duration: 130, ease: 'power1.in' }, 0)
  .to(heroBits, { autoAlpha: 0, filter: 'blur(6px)', duration: 30 }, 95)
  .to('.scroll-hint', { autoAlpha: 0, duration: 20 }, 10)
  .to(P, { wipe: 1, duration: 100, ease: 'power1.in' }, 100)
  .set(sHero, { autoAlpha: 0 }, CUT.about)
  .fromTo(sAbout, { autoAlpha: 0 }, { autoAlpha: 1, duration: 14 }, CUT.about - 14)
  .fromTo(refs.aboutQuote, { scale: 0.92 }, { scale: 1.06, duration: 130 }, CUT.about - 10)
  .to(P, { blots: 1, duration: 125 }, CUT.about)
  .to(sAbout, { autoAlpha: 0, duration: 16 }, 318)
  .to(P, { flood: 1, duration: 80, ease: 'power1.in' }, 325)
  .fromTo(sWork, { autoAlpha: 0 }, { autoAlpha: 1, duration: 12 }, CUT.work - 6)
  .to(P, { work: 1, duration: 200 }, CUT.work + 5)
  .set(sWork, { autoAlpha: 0 }, CUT.stack)
  .set(sStack, { autoAlpha: 1 }, CUT.stack)
  .to(P, { stack: 1, duration: 205 }, CUT.stack)
  .to(sStack, { autoAlpha: 0, duration: 30 }, BLEACH.start + 4)
  .set(sOutro, { autoAlpha: 1 }, CUT.outro)
  .to(P, { bleach: 1, duration: BLEACH.end - BLEACH.start }, BLEACH.start)
  .to(P, { foot: 1, duration: OUTRO.footEnd - OUTRO.foot0 }, OUTRO.foot0)
  .to(P, { eat: 1, duration: OUTRO.eat1 - OUTRO.eat0, ease: 'power1.in' }, OUTRO.eat0)
  .to(P, { outro: 1, duration: 50 }, OUTRO.eat1 - 30)
  .fromTo(refs.outroFade, { autoAlpha: 0 }, { autoAlpha: 1, duration: 10 }, OUTRO.text - 4)
  // the way back to the start (loop modes only reach it)
  .to(refs.outroFade, { autoAlpha: 0, duration: 16 }, RET.start)
  .set(sOutro, { autoAlpha: 0 }, RET.start + 16)
  .set(sHero, { autoAlpha: 1 }, RET.start)
  .to(P, { ret: 1, duration: RET.full - RET.start, ease: 'sine.inOut' }, RET.start)
  .fromTo(
    heroBits,
    { autoAlpha: 0, scale: 0.9, filter: 'blur(6px)' },
    { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 45, immediateRender: false },
    RET.full - 55,
  )
  .fromTo('.scroll-hint', { autoAlpha: 0 }, { autoAlpha: 1, duration: 20, immediateRender: false }, RET.full - 25)
  .to({}, { duration: 1 }, LAP - 1);

function sceneAt(T: number): number {
  if (T >= RET.start) return 0;
  if (T < CUT.about) return 0;
  if (T < CUT.work) return 1;
  if (T < CUT.stack) return 2;
  if (T < CUT.outro) return 3;
  return 4;
}

// ------------------------------------------------------------------ smooth scroll + the loop
// (ported from the 3D portfolio's ScrollLoopProvider / touch-wrap: Lenis `infinite` on desktop,
// native scroll + a jump at rest on touch, nothing for reduced motion)
function sizeTrack() {
  refs.track.style.height = `${Math.round(((TOTAL + 100) / 100) * window.innerHeight)}px`;
}
sizeTrack();
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.1,
    anchors: true,
    infinite: loopMode === 'loop',
  });
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
}
gsap.ticker.lagSmoothing(0);
window.scrollTo(0, 0);

// 100 units = 1 viewport; the scrollable range is exactly TOTAL units, so scroll -> T is linear
// and on the wrap (limit -> 0) T goes LAP -> 0, two identical frames (sizeTrack above)
const unitPx = () => window.innerHeight / 100;
const scrollPos = () => (lenis ? lenis.scroll : window.scrollY);
const targetT = () => Math.min(TOTAL - 0.01, Math.max(0.01, scrollPos() / unitPx()));
// the scrubbed playhead follows the scroll with a short ease (what ScrollTrigger's scrub did),
// taking the short way round the lap so the wrap never rewinds through the whole timeline
let playhead = 0.01;
function stepPlayhead(dt: number): number {
  const target = targetT();
  if (!Number.isFinite(target)) return playhead;
  if (reduced || !Number.isFinite(playhead)) playhead = target;
  else {
    let d = target - playhead;
    if (loopMode !== 'static' && Math.abs(d) > TOTAL / 2) d -= Math.sign(d) * TOTAL;
    playhead += d * (1 - Math.exp(-dt / 0.07));
    if (Math.abs(target - playhead) < 0.002) playhead = target;
    if (playhead >= TOTAL) playhead -= TOTAL;
    if (playhead < 0) playhead += TOTAL;
    playhead = Math.min(TOTAL - 0.01, Math.max(0.01, playhead));
  }
  tl.time(playhead);
  return playhead;
}
tl.time(playhead);

// touch-wrap: when native scroll comes to rest at the very end, jump to the identical top frame
let laps = 0;
if (loopMode === 'touch-wrap') {
  let timer = 0;
  // never while a finger is on the glass: only a scroll that has come to rest wraps
  let touches = 0;
  window.addEventListener('touchstart', (e) => (touches = e.touches.length), { passive: true });
  const lift = (e: TouchEvent) => {
    touches = e.touches.length;
    window.clearTimeout(timer);
    timer = window.setTimeout(check, 160);
  };
  window.addEventListener('touchend', lift, { passive: true });
  window.addEventListener('touchcancel', lift, { passive: true });
  const check = () => {
    if (touches > 0 || locked) return;
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    if (limit > 0 && window.scrollY >= limit - 2) {
      // a fling that ran into the bottom edge can still be alive on the compositor: pinning
      // overflow for a frame cancels it, so the jump lands exactly on the top frame
      root.style.overflow = 'hidden';
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.setTimeout(() => (root.style.overflow = ''), 350);
      lenis?.scrollTo(0, { immediate: true, force: true });
      playhead = 0.01;
      laps++;
    }
  };
  // scrollend where it exists, plus a settle timer: a fling that ends on the page's bottom edge
  // doesn't always fire scrollend
  window.addEventListener('scrollend', check);
  window.addEventListener('scroll', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(check, 160);
  }, { passive: true });
}
if (lenis && loopMode === 'loop') {
  let prev = lenis.scroll;
  lenis.on('scroll', (l: Lenis) => {
    if (Math.abs(prev - l.scroll) > l.limit * 0.5) laps += prev > l.scroll ? 1 : -1;
    prev = l.scroll;
  });
}

// ------------------------------------------------------------------ cards follow the vein anchors
function placeCards() {
  const mobile = window.innerWidth < 700;
  const cardW = mobile ? Math.min(260, window.innerWidth - 110) : Math.min(340, window.innerWidth * 0.24);
  root.style.setProperty('--card-w', `${cardW}px`);
  refs.cards.forEach((el, i) => {
    const a = veins.anchors[i];
    if (!a) return;
    el.classList.toggle('card--l', a.side === 'left');
    el.classList.toggle('card--r', a.side === 'right');
    el.style.left = `${a.x}px`;
    el.style.top = `${a.y}px`;
    const g = cardGardens[i];
    if (g) {
      g.tick = a.side === 'left' ? 'r' : 'l';
      g.layout();
    }
  });
}
placeCards();

// ------------------------------------------------------------------ pointer
const mouse = { x: 0, y: 0, tx: 0, ty: 0, stir: 0, vel: 0 };
window.addEventListener(
  'pointermove',
  (e) => {
    if (freeze) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    mouse.vel += Math.min(0.6, Math.hypot(nx - mouse.tx, ny - mouse.ty) * 2.2);
    mouse.tx = nx;
    mouse.ty = ny;
  },
  { passive: true },
);

// ------------------------------------------------------------------ glitch + scene changes
function glitch(amount: number) {
  if (reduced || freeze) return;
  fx.glitch = Math.max(fx.glitch, amount);
}

let scene = -1;
let opened = false; // intro overlay gone
function setScene(s: number) {
  if (s === scene) return;
  const prev = scene;
  scene = s;
  root.dataset.scene = SCENE_KEYS[s];
  refs.hudScene.textContent = `0${s + 1} / 05 — ${content.scenes[s]}`;
  refs.hudScene.dataset.text = refs.hudScene.textContent;
  if (opened) sceneTyped.forEach((list, i) => list.forEach((t) => (i === s ? t.play() : t.reset())));
  // hard cuts glitch hard; ink transitions (and the halftone bleach, and the way back) only flicker
  if (prev !== -1) glitch(prev === 3 && s === 4 ? 0.25 : prev === 4 && s === 0 ? 0.35 : s >= 3 || prev >= 3 ? 1 : 0.45);
  // the cut into the stack lands on one full-red frame, like the edit
  if (prev === 2 && s === 3 && !reduced) fx.flash = 1;
  if (!renderer) {
    document.querySelectorAll<HTMLElement>('.fb').forEach((el, i) => el.classList.toggle('on', i === s));
  }
}

// cards + stack words reveal as growth passes their thresholds
const cardOn = refs.cards.map(() => false);
// the stack's tools slam in under the scroll (src/stack.ts), on the beat when the music plays
let hitGrid: number | null = null; // tests: time to the next 8th note when the last cut landed
const slams = new Slams(refs.slams, refs.collage, {
  reduced,
  untilBeat: () => soundtrack.untilGrid(0.25),
  hit: (_k, collage) => {
    hitGrid = soundtrack.untilGrid(0.25);
    fx.flash = 1;
    glitch(collage ? 0.8 : 0.55);
    sStack.classList.remove('shake');
    void sStack.offsetWidth;
    sStack.classList.add('shake');
  },
});
slams.layout();
document.fonts?.ready.then(() => slams.layout());
refs.slams.forEach((el) =>
  el.querySelectorAll<HTMLElement>('.slam-p').forEach((b) =>
    b.addEventListener('click', () => {
      const i = content.work.projects.findIndex((p) => p.id === b.dataset.p);
      if (i >= 0) dossier.show(i, b);
    }),
  ),
);
function updateReveals() {
  refs.cards.forEach((el, i) => {
    const a = veins.anchors[i];
    const on = reduced ? true : !!a && P.work >= a.reach - 0.005;
    if (on !== cardOn[i]) {
      cardOn[i] = on;
      el.classList.toggle('on', on);
      if (on) dossier.preload();
      if (on && scene === 2) glitch(0.3);
    }
  });
}

// the big quoted word: "STUDENT?" scrambles into "BUILDER." as the ink spreads (B's scramble)
let quoteStage = 0;
function updateQuote() {
  const stage = P.blots >= 0.52 ? 1 : 0;
  if (stage === quoteStage) return;
  quoteStage = stage;
  const word = content.about.quote[stage];
  if (reduced || scene !== 1) refs.quoteWord.textContent = word;
  else {
    scramble(refs.quoteWord, word, 520);
    glitch(0.45);
  }
}

// outro copy types on only once the ink has eaten the footage: narration, then the handle grows
// its garden, then the links arrive. Forward scrolling is held until that is done (see the lock).
let outroText = false;
let outroDone = false;
let narrDoneAt = 0;
let skipPending = false; // skipped before the outro copy had started (the hold engages a bit earlier)
function updateOutroText(T: number) {
  // no WebGL: there is no footage to eat, the outro copy is simply there
  const on = scene === 4 && (T >= OUTRO.text || !renderer);
  if (on !== outroText && opened) {
    outroText = on;
    const now = gardenNow();
    if (on) {
      typed.outroNarr.play();
      narrDoneAt = performance.now() + typed.outroNarr.total + 200;
      handleGarden?.start(now, 650);
      outroDone = false;
      root.classList.add('outro-typing');
      if (reduced || freeze || !renderer || skipPending) finishOutro();
      skipPending = false;
    } else {
      typed.outroNarr.reset();
      handleGarden?.wither(now);
      outroDone = false;
      root.classList.remove('outro-typing');
    }
  }
  if (outroText && !outroDone) {
    const handleIn = handleGarden ? handleGarden.done : true;
    if (handleIn && performance.now() >= narrDoneAt) {
      outroDone = true;
      root.classList.remove('outro-typing');
      // the links take 0.45 s to arrive; release the hold when they are there
      window.setTimeout(() => outroDone && releaseLock(), reduced || freeze ? 0 : 450);
    }
  }
}
/** Click / tap / any key: everything typed and grown now, and the hold released. */
function finishOutro() {
  typed.outroNarr.finish();
  handleGarden?.finish(gardenNow());
  narrDoneAt = 0;
  outroDone = true;
  root.classList.remove('outro-typing');
  releaseLock();
}

// hero name: types when it is shown (first open, the way back each lap, scrolling back up),
// withers when it has gone
let firstHero = true;
function updateHeroGarden() {
  if (!heroGarden || !opened) return;
  const op = heroBits.style.opacity === '' ? 1 : parseFloat(heroBits.style.opacity);
  const shown = scene === 0 && op > 0.01;
  // the first time, wait for the intro overlay to lift
  if (shown && heroGarden.state === 'idle') heroGarden.start(gardenNow(), firstHero ? 700 : 140);
  if (shown) firstHero = false;
  else if (!shown && heroGarden.state !== 'idle') heroGarden.wither(gardenNow());
}

// ------------------------------------------------------------------ the hold at the end
// When the outro is reached going forward, forward scrolling stops at HOLD until the details have
// typed (every lap). Backward is free; a click, tap or key finishes the typing and releases it.
const HOLD = OUTRO.eat1; // the handle centred on the void
const lockOn = !reduced && !freeze && !!renderer;
let locked = false;
let lockDone = false; // this lap's hold has been served
let programmaticUntil = 0;
const holdPx = () => HOLD * unitPx();
const lapPos = (y: number) => {
  const lim = TOTAL * unitPx();
  return ((y % lim) + lim) % lim;
};
function engageLock() {
  if (!lockOn || lockDone || locked) return;
  locked = true;
  root.classList.add('locked');
}
function releaseLock() {
  if (locked) root.classList.remove('locked');
  locked = false;
  lockDone = true;
}
function clampToHold() {
  // a fling may still be running on the compositor: pin overflow for a moment to stop it there
  if (coarse) {
    root.style.overflow = 'hidden';
    window.setTimeout(() => (root.style.overflow = ''), 120);
  }
  programmaticUntil = performance.now() + 60;
  if (lenis) lenis.scrollTo(holdPx(), { immediate: true, force: true });
  else window.scrollTo(0, holdPx());
}
// every new approach to the outro (another lap, or coming back from earlier) holds again
function updateLockLap(T: number) {
  if (T < OUTRO.eat0 - 20 && !locked) {
    lockDone = false;
    skipPending = false;
  }
  // left backward while held: the hold waits for the next approach
  if (locked && T < OUTRO.eat0 - 20) {
    locked = false;
    root.classList.remove('locked');
  }
}
if (lockOn) {
  // wheel / trackpad through Lenis: forward deltas are trimmed at HOLD (and crossing it engages)
  if (lenis) {
    const lim = () => TOTAL * unitPx();
    (lenis.options as { virtualScroll?: (d: { deltaY: number; event: Event }) => boolean }).virtualScroll = (d) => {
      if (d.deltaY <= 0 || lockDone || !opened) return true;
      const pos = lapPos(lenis!.targetScroll);
      const hold = holdPx();
      if (!locked && pos <= hold + 1 && pos + d.deltaY > hold && pos > hold - lim() * 0.3) engageLock();
      if (!locked) return true;
      const allowed = Math.max(0, hold - pos);
      if (allowed < 0.5) {
        if (d.event.cancelable) d.event.preventDefault();
        return false;
      }
      d.deltaY = Math.min(d.deltaY, allowed);
      return true;
    };
  }
  // native scrolling (touch, scrollbar): crossing engages, and while held nothing goes past HOLD
  let prevY = -1;
  window.addEventListener(
    'scroll',
    () => {
      const y = lenis ? lenis.scroll : window.scrollY;
      const smooth = lenis && lenis.isScrolling === 'smooth';
      if (performance.now() < programmaticUntil || smooth || !opened) {
        prevY = y;
        return;
      }
      const hold = holdPx();
      if (!lockDone && prevY >= 0 && prevY <= hold + 1 && y > hold && prevY > hold - TOTAL * unitPx() * 0.3) engageLock();
      if (locked && y > hold + 1 && y < hold + TOTAL * unitPx() * 0.3) clampToHold();
      prevY = lenis ? lenis.scroll : window.scrollY;
    },
    { passive: true },
  );
  // a finger pushing forward at the hold is simply not scrolled
  let ty = 0;
  window.addEventListener('touchstart', (e) => (ty = e.touches[0]?.clientY ?? 0), { passive: true });
  window.addEventListener(
    'touchmove',
    (e) => {
      const y = e.touches[0]?.clientY ?? ty;
      const forward = y < ty;
      ty = y;
      if (locked && forward && window.scrollY >= holdPx() - 2 && e.cancelable) e.preventDefault();
    },
    { passive: false },
  );
  // skip: a click / tap (not a drag) or any key finishes the typing and releases the hold
  const skip = () => {
    if (outroText && !outroDone) finishOutro();
    else if (locked) {
      skipPending = true;
      releaseLock();
    }
  };
  window.addEventListener('click', skip);
  window.addEventListener('keydown', skip);
}

// light (paper) frames: each HUD corner switches to dark ink while the picture under it is light.
// With WebGL the renderer measures it (async readback of a tiny mip), so it follows the ink edges
// through every transition; the CSS fallback only has one light scene (About).
const LIGHT_KEYS = ['tl', 'tr', 'br', 'ml'] as const;
const light: Record<(typeof LIGHT_KEYS)[number], boolean> = { tl: false, tr: false, br: false, ml: false };
function updateLight() {
  const pr = renderer?.probe;
  for (const k of LIGHT_KEYS) {
    // hysteresis so a ragged ink edge under a corner doesn't make it flicker
    const on = pr ? (light[k] ? pr[k] > 0.42 : pr[k] > 0.56) : scene === 1;
    if (on !== light[k]) {
      light[k] = on;
      root.classList.toggle(`light-${k}`, on);
    }
  }
  // smoked plate behind the top HUD groups when the picture under them is bright but not paper
  for (const k of ['tl', 'tr'] as const) {
    const a = pr ? Math.min(0.72, Math.max(0, (pr[k] - 0.18) * 2.0)) : 0;
    if (Math.abs(a - plate[k]) > 0.02 || (a === 0 && plate[k] !== 0)) {
      plate[k] = a;
      root.style.setProperty(`--plate-${k}`, a.toFixed(2));
    }
  }
}
const plate = { tl: 0, tr: 0 };

// idle glitch frames, like the edit's quick RGB-split cuts
let nextIdle = 2.5;

// ------------------------------------------------------------------ post settings per scene
type Post = Pick<Uniforms, 'bloom' | 'ca' | 'edge' | 'grain' | 'vig' | 'lift'>;
const POST: Post[] = [
  { bloom: 0.95, ca: 0.0065, edge: 0.9, grain: 0.07, vig: 0.85, lift: 0 },
  { bloom: 0.0, ca: 0.0025, edge: 0.2, grain: 0.05, vig: 0.0, lift: 1 },
  { bloom: 0.9, ca: 0.005, edge: 0.4, grain: 0.065, vig: 0.9, lift: 0 },
  { bloom: 0.7, ca: 0.006, edge: 0.6, grain: 0.085, vig: 0.9, lift: 0 },
  { bloom: 0.6, ca: 0.003, edge: 0.25, grain: 0.055, vig: 0.9, lift: 0 },
];
// outro footage (halftone on paper): like the About paper, with the grain of the dark scenes
const POST_PAPER: Post = { bloom: 0.15, ca: 0.003, edge: 0.15, grain: 0.065, vig: 0.0, lift: 1 };
const mixPost = (a: Post, b: Post, t: number): Post => ({
  bloom: a.bloom + (b.bloom - a.bloom) * t,
  ca: a.ca + (b.ca - a.ca) * t,
  edge: a.edge + (b.edge - a.edge) * t,
  grain: a.grain + (b.grain - a.grain) * t,
  vig: a.vig + (b.vig - a.vig) * t,
  lift: a.lift + (b.lift - a.lift) * t,
});

// ------------------------------------------------------------------ footage layer (B's scrub logic, A's renderer)
const FALLBACK_DIMS: Record<ClipName, [number, number]> = { hero: [960, 560], outro: [1120, 630] };
const HERO = content.footage.hero;
const OUTRO_CLIP = content.footage.outro;
const heroLoop = HERO.loop ?? [HERO.from, HERO.to];
let autoplay = !reduced;
let loopT = heroLoop[0];
let heroAnchor = heroLoop[0];
let lastHeroT = heroLoop[0];
const lastFid: Record<ClipName, number> = { hero: 0, outro: 0 };
const footOn: Record<ClipName, number> = { hero: 0, outro: 0 };
const scrubStats = { frames: 0, exact: 0 };
let loopPulse = 0;
const isPhone = () => window.innerWidth < 700;

// on the way back the hero must be exactly the T = 0 hero: no push-in, no burst
let inRet = false;
const heroZoom = () => (inRet ? 0 : P.zoom);
const heroWipe = () => (inRet ? 0 : P.wipe);
const smooth01 = (a: number, b: number, v: number) => {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

const NO_FOOT: Foot = { a: null, aKey: '', b: null, bKey: '', mix: 0, on: 0, k: [1, 1, 0, 0], lod: 0 };

/** Visible image fraction + offset for the cover crop (outro on portrait: a wider print on paper). */
function footView(clip: ClipName, zoom: number): [number, number, number, number] {
  const [w, h] = (() => {
    const i = footage.info(clip);
    return i ? [i.width, i.height] : FALLBACK_DIMS[clip];
  })();
  const rs = window.innerWidth / window.innerHeight;
  const ri = w / h;
  let kx: number;
  let ky: number;
  if (clip === 'outro' && rs < 1) {
    // a phone would only see a sliver of the 16:9 frame: keep more of the spiral in view and let
    // the frame bleed into the paper above and below it
    kx = 0.66;
    ky = (kx * ri) / rs;
  } else {
    kx = rs > ri ? 1 : rs / ri;
    ky = rs > ri ? ri / rs : 1;
  }
  kx /= zoom;
  ky /= zoom;
  // centre the spiral (frame x 0.44) on the outro, the frame centre on the hero
  const fx = clip === 'outro' ? 0.44 : 0.5;
  let ox = fx - kx * 0.5;
  if (kx <= 1) ox = Math.min(Math.max(ox, 0), 1 - kx);
  // portrait outro: the print sits a little above centre, the blots pool below it
  const oy = 0.5 - ky * (ky > 1 ? 0.57 : 0.5);
  return [kx, ky, ox, oy];
}

function footFrame(dt: number, T: number): Foot {
  const clip: ClipName | null = scene === 0 ? 'hero' : scene === 4 ? 'outro' : null;
  if (!clip || !renderer) return NO_FOOT;
  // source time: hero autoplays (muted loop) at rest at the top and all through the way back (so the
  // frame is the same on both sides of the wrap), and scrubs from where it was once you scroll on
  const atRest = T <= 2 || T >= RET.start;
  let t: number;
  if (clip === 'hero') {
    if (!reduced) {
      if (!atRest && autoplay) {
        autoplay = false;
        heroAnchor = loopT;
      } else if (atRest && !autoplay) {
        autoplay = true;
        loopT = Math.min(Math.max(lastHeroT, heroLoop[0]), heroLoop[1]);
      }
      if (autoplay && opened && !freeze) {
        loopT += dt;
        if (loopT > heroLoop[1]) {
          loopT = heroLoop[0];
          loopPulse = 1;
        }
      }
    }
    const p = Math.min(1, T / 190);
    t = reduced ? HERO.from : autoplay ? loopT : heroAnchor + (HERO.to - heroAnchor) * p;
    lastHeroT = t;
  } else {
    t = reduced ? OUTRO_CLIP.to - 0.52 : OUTRO_CLIP.from + (OUTRO_CLIP.to - OUTRO_CLIP.from) * P.foot;
  }

  let a: TexImageSource | null = null;
  let aKey = '';
  let b: TexImageSource | null = null;
  let mix = 0;
  let bId = -1;
  if (!reduced && footage.isLoaded(clip)) {
    const f = footage.frameAt(clip, t);
    const dir = Math.sign(f - lastFid[clip]) || 1;
    lastFid[clip] = f;
    footage.prefetch(clip, f, dir, isPhone() ? 6 : 10);
    const ai = Math.floor(f);
    const near = footage.nearest(clip, ai);
    const exact = !!near && near.id === ai;
    if (!(clip === 'hero' && autoplay)) {
      scrubStats.frames++;
      if (exact) scrubStats.exact++;
    }
    if (near) {
      a = near.bmp;
      aKey = `${clip}:${near.id}`;
      const nb = exact ? footage.get(clip, ai + 1) : null;
      if (nb) {
        b = nb;
        bId = ai + 1;
        mix = f - ai;
      }
    }
  }
  if (!a) {
    // poster until frames land (slow network) and under reduced motion
    const img = footage.poster(clip);
    if (img) {
      a = img;
      aKey = `poster-${clip}`;
    }
  }
  footOn[clip] = a ? (reduced ? 1 : Math.min(1, footOn[clip] + dt * 2.5)) : 0;
  const zoom = clip === 'hero' ? 1.04 + 0.05 * heroZoom() : 1.02 + 0.05 * P.foot;
  return {
    a,
    aKey,
    b,
    bKey: `${clip}:${bId}`,
    mix,
    // on the way back the vortex comes first, the footage follows it in
    on: footOn[clip] * (clip === 'hero' && inRet ? smooth01(0.35, 0.95, P.ret) : 1),
    k: footView(clip, zoom),
    lod: clip === 'outro' ? (isPhone() ? 0.8 : 0.35) : 0,
  };
}

// the hero type's box on screen, for the shader's text scrim
const NO_SCRIM = { rect: [0.5, 0.5, 0, 0] as [number, number, number, number], amt: 0 };
function heroScrim(): typeof NO_SCRIM {
  if (scene !== 0) return NO_SCRIM;
  const op = heroBits.style.opacity === '' ? 1 : parseFloat(heroBits.style.opacity);
  if (!(op > 0.001)) return NO_SCRIM;
  const r = heroBits.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  return {
    rect: [(r.left + r.width / 2) / W, 1 - (r.top + r.height / 2) / H, r.width / 2 / W, r.height / 2 / H],
    amt: op,
  };
}

// segments load only when their scene is near
function lazyLoad(T: number) {
  if (!renderer) return;
  if (T > CUT.work - 60) {
    void footage.loadPoster('outro');
    if (!reduced && !footage.isRequested('outro')) footage.ensure('outro').catch((e) => console.warn('[ink] outro footage', e));
  }
  if (!reduced && scene === 3 && footage.isLoaded('outro')) footage.prefetch('outro', 0, 1, 8, 0);
  if (!reduced && T < CUT.about && opened && !footage.isRequested('hero')) {
    footage.ensure('hero').catch((e) => console.warn('[ink] hero footage', e));
  }
}

// ------------------------------------------------------------------ frame loop (single RAF via gsap.ticker)
let time = 0;
const fixedQuality = params.has('fixedq');
let slowFrames = 0;
let lastKey = '';

let lastBeatU: number | null = null;
function frame(_t: number, dtMs: number) {
  const dt = Math.min(0.1, dtMs / 1000);
  const T = stepPlayhead(dt);
  inRet = T >= RET.start;
  setScene(sceneAt(T));
  updateReveals();
  slams.update(P.stack, scene === 3 && opened);
  // the stack's flesh pumps on every beat while the music plays
  if (scene === 3 && !reduced) {
    const u = soundtrack.untilGrid(0.5);
    if (u != null && lastBeatU != null && u > lastBeatU + 0.2) fx.flash = Math.max(fx.flash, 0.3);
    lastBeatU = u;
  }
  updateQuote();
  updateOutroText(T);
  updateHeroGarden();
  updateLockLap(T);
  {
    const now = gardenNow();
    const heroOp = heroBits.style.opacity === '' ? 1 : parseFloat(heroBits.style.opacity);
    heroGarden?.frame(now, scene === 0 && heroOp > 0.001);
    handleGarden?.frame(now, outroText);
    cardGardens.forEach((g, i) => {
      if (!g) return;
      if (cardOn[i] && g.state === 'idle') g.start(now, 320);
      else if (!cardOn[i] && g.state !== 'idle') g.wither(now);
      // under a fully open dossier the cards are covered by ink: no need to draw them
      g.frame(now, scene === 2 && cardOn[i] && dossier.open < 0.999);
    });
    dossier.tick(now);
  }
  lazyLoad(T);
  // progress rail: fills over the lap, then drains away on the way back so the wrap matches
  if (T < RET.start) {
    refs.hudBar.style.transformOrigin = 'top';
    refs.hudBar.style.transform = `scaleY(${(T / RET.start).toFixed(4)})`;
  } else {
    refs.hudBar.style.transformOrigin = 'bottom';
    refs.hudBar.style.transform = `scaleY(${(1 - P.ret).toFixed(4)})`;
  }

  if (!reduced) {
    if (!freeze) time += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    mouse.stir += mouse.vel * dt * 2.2;
    mouse.vel *= Math.pow(0.04, dt);
    fx.glitch *= Math.pow(0.0008, dt);
    fx.flash *= Math.pow(0.002, dt);
    if (loopPulse > 0) {
      // the hero loop wraps on a glitch cut, like the edit
      glitch(0.5);
      loopPulse = 0;
    }
    if (fx.glitch < 0.004) fx.glitch = 0;
    nextIdle -= freeze ? 0 : dt;
    if (nextIdle <= 0) {
      if (scene === 0 || scene === 3 || scene === 2) glitch(0.22 + Math.random() * 0.25);
      nextIdle = 2.2 + Math.random() * 3.5;
    }
    root.classList.toggle('is-glitch', fx.glitch > 0.28);
    if (scene === 0 && !freeze) {
      heroBits.style.translate = `${(mouse.x * -14).toFixed(2)}px ${(mouse.y * 10).toFixed(2)}px`;
    }
  } else {
    time = 14.0;
  }

  // vein canvas only redraws while its scene is on screen
  let veinsDirty = false;
  if (scene === 2 || (scene === 1 && P.flood > 0.9)) {
    veinsDirty = veins.draw(reduced ? 1 : P.work);
  }

  renderer?.pollProbe();
  updateLight();
  if (!renderer) return;
  const foot = footFrame(dt, T);
  const scrim = heroScrim();

  // reduced motion: render on demand only
  if (reduced) {
    const key = `${scene}|${P.zoom.toFixed(3)}|${P.bleach.toFixed(3)}|${P.ret.toFixed(3)}|${scrim.amt.toFixed(2)}|${P.wipe.toFixed(3)}|${P.blots.toFixed(3)}|${P.flood.toFixed(3)}|${P.eat.toFixed(3)}|${dossier.open.toFixed(3)}|${foot.aKey}|${window.innerWidth}x${window.innerHeight}`;
    if (key === lastKey && !veinsDirty) return;
    lastKey = key;
  }
  if (veinsDirty) renderer.uploadVeins(veins.canvas);

  let post: Post = POST[scene];
  if (scene === 0) post = inRet ? mixPost(POST[4], POST[0], P.ret) : mixPost(POST[0], POST[1], Math.min(1, P.wipe * 1.15));
  if (scene === 1) post = mixPost(POST[1], POST[2], P.flood);
  // outro footage is paper-white: post settles from the paper look into the dark outro as the ink eats it
  if (scene === 4 && foot.on > 0) post = mixPost(POST[4], POST_PAPER, foot.on * (1 - P.eat));
  // ...and comes in from the stack's look as the paper dots grow
  if (scene === 4 && P.bleach < 1) post = mixPost(POST[3], post, P.bleach);

  renderer.render({
    time,
    mouse: [mouse.x, mouse.y],
    stir: mouse.stir,
    scene,
    zoom: heroZoom(),
    wipe: heroWipe(),
    blots: reduced ? 0.7 : P.blots,
    flood: P.flood,
    work: reduced ? 1 : P.work,
    flash: fx.flash,
    outro: P.outro,
    reduced: reduced ? 1 : 0,
    glitch: fx.glitch,
    eat: P.eat,
    bleach: P.bleach,
    ret: inRet ? P.ret : 1,
    open: dossier.open,
    openC: dossier.origin,
    foot,
    scrim: scrim.rect,
    scrimAmt: scrim.amt,
    ...post,
  });

  if (!fixedQuality && !reduced) {
    // adaptive resolution: drop the noisy pass if frames run long
    if (dtMs > 24) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && renderer.sceneScale > 0.5) {
      renderer.setSceneScale(renderer.sceneScale - 0.1);
      slowFrames = 0;
    }
  }
}
gsap.ticker.add(frame);

// ------------------------------------------------------------------ resize
let lastW = window.innerWidth;
let lastH = window.innerHeight;
let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // ignore mobile URL-bar height wobble
    if (w === lastW && Math.abs(h - lastH) < 120 && matchMedia('(pointer: coarse)').matches) return;
    lastW = w;
    lastH = h;
    renderer?.resize();
    veins.layout();
    layoutGardens();
    placeCards();
    slams.layout();
    dossier.layout();
    sizeTrack();
    lenis?.resize();
    lastKey = '';
  }, 120);
});

// ------------------------------------------------------------------ sound (off by default; B's edit audio, seamless loop)
const soundtrack = new Soundtrack(`${import.meta.env.BASE_URL}media/audio.m4a`, refs.audio);
let soundOn = false;
refs.sound.addEventListener('click', async () => {
  soundOn = !soundOn;
  const set = (on: boolean) => {
    refs.sound.setAttribute('aria-pressed', String(on));
    refs.sound.classList.toggle('on', on);
    refs.soundLabel.textContent = on ? content.ui.soundOn : content.ui.soundOff;
  };
  set(soundOn);
  if (soundOn) {
    if (!(await soundtrack.play()) && soundOn) {
      soundOn = false;
      set(false);
    }
  } else {
    soundtrack.stop();
  }
});

// ------------------------------------------------------------------ boot
// Hero footage first (all the first screen needs); on slow networks the intro is never held longer
// than ~7.6 s after navigation start: the hero poster (or the pure shader vortex) shows until frames land.
const timing = { start: 0, open: 0 };

async function boot() {
  const t0 = performance.now();
  timing.start = Math.round(t0);
  lenis?.stop();
  const deadline = new Promise((r) => setTimeout(r, Math.max(1500, 7600 - performance.now())));
  const show = (p: number) => {
    refs.bootPct.textContent = String(Math.round(p * 100)).padStart(3, '0');
    refs.bootBar.style.transform = `scaleX(${p})`;
  };
  try {
    await Promise.race([footage.init(), deadline]);
  } catch (e) {
    console.warn('[ink] footage manifest failed', e);
  }
  if (renderer) {
    const poster = footage.loadPoster('hero');
    if (!reduced) {
      const heroChunk = footage.ensure('hero', show).catch((e) => console.warn('[ink] hero footage', e));
      await Promise.race([heroChunk, deadline]);
      // decode the first frames so the reveal never shows an empty stage
      await Promise.race([Promise.all([0, 1, 2, 3, 4, 5].map((i) => footage.request('hero', i))), deadline]);
    } else {
      await Promise.race([poster, deadline]);
      show(1);
    }
  } else show(1);
  await Promise.race([document.fonts?.ready, deadline]);
  const wait = Math.max(0, (reduced ? 0 : 700) - (performance.now() - t0));
  await new Promise((r) => setTimeout(r, wait));

  opened = true;
  timing.open = Math.round(performance.now());
  lenis?.start();
  sceneTyped[scene]?.forEach((t) => t.play());
  root.classList.add('ready');
  gsap.to(refs.boot, {
    autoAlpha: 0,
    duration: reduced ? 0.3 : 0.9,
    delay: 0.05,
    ease: 'steps(6)',
    onStart: () => glitch(0.9),
  });
}
void boot();

// hooks for scripts/shots.mjs
declare global {
  interface Window {
    __ink: {
      toUnit: (u: number) => void;
      total: number;
      lap: number;
      ret: typeof RET;
      bleach: typeof BLEACH;
      mode: LoopMode;
      laps: () => number;
      scrollInfo: () => { scroll: number; limit: number; unitPx: number };
      cuts: typeof CUT;
      outro: typeof OUTRO;
      ready: boolean;
      webgl: boolean;
      opened: () => boolean;
      state: () => Record<string, unknown>;
      scrubStats: (reset?: boolean) => { frames: number; exact: number };
      timing: () => { start: number; open: number };
      garden: () => Record<string, { state: string; letters: number } | null>;
      stack: () => { shown: number; last: { k: number; at: number; waited: number }; p: number; hitGrid: number | null };
      dossier: { show: (i: number) => void; close: () => void; state: () => { phase: string; open: number; index: number } };
      gardenText: (on: boolean) => void;
      gardenHold: (k: 'hero' | 'handle', n: number | null) => void;
      lock: () => { locked: boolean; lockDone: boolean; outroText: boolean; outroDone: boolean; hold: number };
      audio: () => { paused: boolean; time: number; volume: number };
    };
  }
}
window.__ink = {
  toUnit(u: number) {
    programmaticUntil = performance.now() + 120;
    const y = Math.max(0, Math.min(TOTAL, u)) * unitPx();
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  },
  total: TOTAL,
  lap: LAP,
  ret: RET,
  bleach: BLEACH,
  mode: loopMode,
  laps: () => laps,
  scrollInfo: () => ({ scroll: scrollPos(), limit: lenis ? lenis.limit : document.documentElement.scrollHeight - window.innerHeight, unitPx: unitPx() }),
  cuts: CUT,
  outro: OUTRO,
  ready: true,
  webgl: !!renderer,
  opened: () => opened,
  state: () => ({
    T: tl.time(),
    scene,
    autoplay,
    heroT: lastHeroT,
    footOn: { ...footOn },
    hasFrame: renderer?.hasFrame ?? false,
    loaded: { hero: footage.isLoaded('hero'), outro: footage.isLoaded('outro') },
    requested: { hero: footage.isRequested('hero'), outro: footage.isRequested('outro') },
    light: { ...light },
    probe: renderer?.probe ?? null,
    probeMs: renderer?.probeMs ?? 0,
    quote: refs.quoteWord.textContent,
  }),
  scrubStats(reset = false) {
    const r = { ...scrubStats };
    if (reset) scrubStats.frames = scrubStats.exact = 0;
    return r;
  },
  timing: () => ({ ...timing }),
  stack: () => ({ shown: slams.shown, last: slams.last, p: P.stack, hitGrid }),
  dossier: {
    show: (i: number) => dossier.show(i, refs.cards[i]),
    close: () => dossier.requestClose(),
    state: () => ({ phase: dossier.phase, open: dossier.open, index: dossier.index }),
  },
  garden: () => ({
    hero: heroGarden ? { state: heroGarden.state, letters: heroGarden.count } : null,
    handle: handleGarden ? { state: handleGarden.state, letters: handleGarden.count } : null,
    ...Object.fromEntries(cardGardens.map((g, i) => [`card${i + 1}`, g ? { state: g.state, letters: g.count } : null])),
  }),
  gardenHold(k: 'hero' | 'handle', n: number | null) {
    const g = k === 'hero' ? heroGarden : handleGarden;
    if (g) g.holdAt = n;
  },
  gardenText(on: boolean) {
    gardens.forEach((g) => {
      g.hideText = !on;
      g.touch();
    });
  },
  lock: () => ({ locked, lockDone, outroText, outroDone, hold: HOLD }),
  audio: () => soundtrack.state(),
};
