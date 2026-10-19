import 'lenis/dist/lenis.css';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { content } from './content';
import { buildDOM } from './dom';
import { Typed } from './type';
import { Veins } from './veins';
import { Renderer, type Uniforms } from './gl/renderer';

gsap.registerPlugin(ScrollTrigger);

const params = new URLSearchParams(location.search);
const reduced =
  matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced');
const root = document.documentElement;
root.classList.toggle('reduced', reduced);
document.title = content.meta.title;

const refs = buildDOM(content);

// ------------------------------------------------------------------ timeline map (scroll units, 100 = 1 viewport)
const TOTAL = 880;
const CUT = { about: 200, work: 405, stack: 640, outro: 780 };
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
  handle: new Typed(refs.handle, [content.handle], { speed: 70, delay: 900 }),
};
const sceneTyped: Typed[][] = [
  [typed.heroKicker, typed.heroSub],
  [typed.about],
  [typed.work],
  [typed.stack],
  [typed.outroNarr, typed.handle],
];

// ------------------------------------------------------------------ state driven by the scrubbed timeline
const P = { zoom: 0, wipe: 0, blots: 0, flood: 0, work: 0, stack: 0, outro: 0 };
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
  .to(P, { stack: 1, duration: 120 }, CUT.stack)
  .set(sStack, { autoAlpha: 0 }, CUT.outro)
  .set(sOutro, { autoAlpha: 1 }, CUT.outro)
  .to(P, { outro: 1, duration: 50 }, CUT.outro)
  .to({}, { duration: 1 }, TOTAL - 1);

function sceneAt(T: number): number {
  if (T < CUT.about) return 0;
  if (T < CUT.work) return 1;
  if (T < CUT.stack) return 2;
  if (T < CUT.outro) return 3;
  return 4;
}

// ------------------------------------------------------------------ smooth scroll
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
}
gsap.ticker.lagSmoothing(0);

function sizeTrack() {
  refs.track.style.height = `${Math.round(((TOTAL + 100) / 100) * window.innerHeight)}px`;
}
sizeTrack();
const st = ScrollTrigger.create({
  trigger: refs.track,
  start: 'top top',
  end: 'bottom bottom',
  animation: tl,
  scrub: reduced ? true : 0.3,
});

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
  });
}
placeCards();

// ------------------------------------------------------------------ pointer
const mouse = { x: 0, y: 0, tx: 0, ty: 0, stir: 0, vel: 0 };
window.addEventListener(
  'pointermove',
  (e) => {
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
  if (reduced) return;
  fx.glitch = Math.max(fx.glitch, amount);
}

let scene = -1;
function setScene(s: number) {
  if (s === scene) return;
  const prev = scene;
  scene = s;
  root.dataset.scene = SCENE_KEYS[s];
  refs.hudScene.textContent = `0${s + 1} / 05 — ${content.scenes[s]}`;
  refs.hudScene.dataset.text = refs.hudScene.textContent;
  sceneTyped.forEach((list, i) => list.forEach((t) => (i === s ? t.play() : t.reset())));
  // hard cuts glitch hard; ink transitions only flicker
  if (prev !== -1) glitch(s >= 3 || prev >= 3 ? 1 : 0.45);
  // the cut into the stack lands on one full-red frame, like the edit
  if (prev === 2 && s === 3 && !reduced) fx.flash = 1;
  if (!renderer) {
    document.querySelectorAll<HTMLElement>('.fb').forEach((el, i) => el.classList.toggle('on', i === s));
  }
}

// cards + stack words reveal as growth passes their thresholds
const cardOn = refs.cards.map(() => false);
const techOn = refs.techs.map(() => false);
function updateReveals() {
  refs.cards.forEach((el, i) => {
    const a = veins.anchors[i];
    const on = reduced ? true : !!a && P.work >= a.reach - 0.005;
    if (on !== cardOn[i]) {
      cardOn[i] = on;
      el.classList.toggle('on', on);
      if (on && scene === 2) glitch(0.3);
    }
  });
  const n = refs.techs.length;
  refs.techs.forEach((el, i) => {
    const on = reduced ? true : P.stack >= (i + 1) / (n + 1.2);
    if (on !== techOn[i]) {
      techOn[i] = on;
      el.classList.toggle('on', on);
      if (on && scene === 3) {
        fx.flash = 1;
        glitch(0.55);
        el.classList.add('hit');
        window.setTimeout(() => el.classList.remove('hit'), 380);
      }
    }
  });
}

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
const mixPost = (a: Post, b: Post, t: number): Post => ({
  bloom: a.bloom + (b.bloom - a.bloom) * t,
  ca: a.ca + (b.ca - a.ca) * t,
  edge: a.edge + (b.edge - a.edge) * t,
  grain: a.grain + (b.grain - a.grain) * t,
  vig: a.vig + (b.vig - a.vig) * t,
  lift: a.lift + (b.lift - a.lift) * t,
});

// ------------------------------------------------------------------ frame loop (single RAF via gsap.ticker)
let time = 0;
const fixedQuality = params.has('fixedq');
let slowFrames = 0;
let lastKey = '';

function frame(_t: number, dtMs: number) {
  const dt = Math.min(0.1, dtMs / 1000);
  const T = tl.time();
  setScene(sceneAt(T));
  updateReveals();
  refs.hudBar.style.transform = `scaleY(${(T / TOTAL).toFixed(4)})`;

  if (!reduced) {
    time += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    mouse.stir += mouse.vel * dt * 2.2;
    mouse.vel *= Math.pow(0.04, dt);
    fx.glitch *= Math.pow(0.0008, dt);
    fx.flash *= Math.pow(0.002, dt);
    if (fx.glitch < 0.004) fx.glitch = 0;
    nextIdle -= dt;
    if (nextIdle <= 0) {
      if (scene === 0 || scene === 3 || scene === 2) glitch(0.22 + Math.random() * 0.25);
      nextIdle = 2.2 + Math.random() * 3.5;
    }
    root.classList.toggle('is-glitch', fx.glitch > 0.28);
    if (scene === 0) {
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

  if (!renderer) return;

  // reduced motion: render on demand only
  if (reduced) {
    const key = `${scene}|${P.wipe.toFixed(3)}|${P.blots.toFixed(3)}|${P.flood.toFixed(3)}|${window.innerWidth}x${window.innerHeight}`;
    if (key === lastKey && !veinsDirty) return;
    lastKey = key;
  }
  if (veinsDirty) renderer.uploadVeins(veins.canvas);

  let post: Post = POST[scene];
  if (scene === 0) post = mixPost(POST[0], POST[1], Math.min(1, P.wipe * 1.15));
  if (scene === 1) post = mixPost(POST[1], POST[2], P.flood);

  renderer.render({
    time,
    mouse: [mouse.x, mouse.y],
    stir: mouse.stir,
    scene,
    zoom: P.zoom,
    wipe: P.wipe,
    blots: reduced ? 0.7 : P.blots,
    flood: P.flood,
    work: reduced ? 1 : P.work,
    flash: fx.flash,
    outro: P.outro,
    reduced: reduced ? 1 : 0,
    glitch: fx.glitch,
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
    placeCards();
    sizeTrack();
    ScrollTrigger.refresh();
    lastKey = '';
  }, 120);
});

// ------------------------------------------------------------------ boot
document.fonts?.ready.then(() => ScrollTrigger.refresh());
gsap.to(refs.boot, {
  autoAlpha: 0,
  duration: reduced ? 0.3 : 0.9,
  delay: 0.15,
  ease: 'steps(6)',
  onStart: () => glitch(0.9),
});

// hooks for scripts/shots.mjs
declare global {
  interface Window {
    __ink: { toUnit: (u: number) => void; total: number; cuts: typeof CUT; ready: boolean; webgl: boolean };
  }
}
window.__ink = {
  toUnit(u: number) {
    const y = st.start + ((st.end - st.start) * u) / TOTAL;
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    ScrollTrigger.update();
  },
  total: TOTAL,
  cuts: CUT,
  ready: true,
  webgl: !!renderer,
};
