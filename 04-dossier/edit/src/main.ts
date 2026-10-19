import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { brief, file, hero, outro, pause, question, site, ui, type Caption as Cap, type Segment, type ZonedCaption } from './content';
import { FrameStore } from './frames';
import { Renderer } from './renderer';
import { Caption, captionMarkup } from './type';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 760;
document.documentElement.classList.toggle('reduced', reduced);
document.title = site.title;

/* ------------------------------------------------------------------ markup */

const cap = (c: Cap, cls = '') => captionMarkup(c.label, c.lines, cls);

/** A zoned caption; project captions get their links (new tab) and tags under the typed lines. */
const zoned = (c: ZonedCaption, i: number) => {
  const p = c.project;
  const primary = p?.links[0];
  // bottom-right sits on the light burst in both chapters: white type with the edit's dark halo
  const typed = cap(c, `zc__tc${c.zone === 'br' ? ' tc--halo' : ''}`);
  return `<div class="zc zc--${c.zone}" data-step="${i}">
    ${primary ? `<a class="zc__hit" href="${primary.href}" target="_blank" rel="noopener" aria-label="${c.label}: ${primary.label.toLowerCase()} (opens in a new tab)">${typed}</a>` : typed}
    ${
      p
        ? `<p class="zc__meta"><span class="zc__tags">${p.tags.join(' · ')}</span>${p.links
            .map((l) => `<a class="zc__link" href="${l.href}" target="_blank" rel="noopener">${l.label}<span aria-hidden="true"> ↗</span></a>`)
            .join('')}</p>`
        : ''
    }
  </div>`;
};

const zones = (list: ZonedCaption[], base = 0) =>
  (['tl', 'br'] as const)
    .map(
      (z) =>
        `<div class="zone zone--${z}">${list
          .map((c, i) => (c.zone === z ? zoned(c, base + i) : ''))
          .join('')}</div>`,
    )
    .join('');

const letters = (word: string) => [...word].map((c) => `<span class="l">${c}</span>`).join('');

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="poster" aria-hidden="true"></div>
  <canvas id="stage" aria-hidden="true"></canvas>
  <div class="scrim" aria-hidden="true"></div>

  <div class="intro" aria-hidden="true">
    <div class="intro__inner">
      <p class="intro__label">${ui.loading}</p>
      <p class="intro__pct"><span>000</span>%</p>
      <div class="intro__bar"><i></i></div>
    </div>
  </div>

  <header class="hud hud--top">
    <a class="brand" href="#hero" aria-label="Nazar Akanov, back to top">${site.first} ${site.last}</a>
    <p class="hud__section"><span class="hud__idx">01</span><span class="hud__sep"></span><span class="hud__name">${hero.label}</span></p>
    <button class="sound" type="button" aria-pressed="false" aria-label="Sound of the edit">
      <span class="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="sound__label">${ui.soundOff}</span>
    </button>
  </header>

  <div class="hud hud--bottom" aria-hidden="true">
    <p class="tc-code"><span class="tc-code__k">TC</span> <span class="tc-code__v">00:00:00:00</span></p>
    <div class="rail"><i class="rail__fill"></i></div>
    <p class="coords">${site.coords}</p>
  </div>

  <main>
    <section id="hero" class="sec sec--hero" data-sec="0">
      <div class="pin">
        <div class="hero__block">
          ${cap(hero.caption, 'hero__cap')}
          <h1 class="hero__name" aria-label="${site.first} ${site.last}">
            <span class="hero__row">${letters(site.first)}</span>
            <span class="hero__row">${letters(site.last)}</span>
          </h1>
        </div>
        <div class="hero__cue"><span>${hero.scrollCue}</span><i></i></div>
      </div>
    </section>

    <section id="brief" class="sec sec--brief" data-sec="1">
      <div class="pin">
        <div class="zone zone--tl">${cap(brief.caption, 'brief__cap tc--duo')}</div>
      </div>
    </section>

    <section id="pause" class="sec sec--pause" data-sec="2">
      <div class="pin">
        <div class="zone zone--br">${cap(pause.caption, 'pause__cap')}</div>
      </div>
    </section>

    <section id="file" class="sec sec--file" data-sec="3">
      <div class="pin">
        ${zones(file.steps)}
      </div>
    </section>

    <section id="question" class="sec sec--question" data-sec="4">
      <div class="pin">
        <p class="qword" aria-live="polite"><span class="qword__q" aria-hidden="true">&#96;</span><span class="qword__w">${question.words[0]}</span><span class="qword__q" aria-hidden="true">´</span></p>
        ${zones(question.captions, 100)}
      </div>
    </section>

    <section id="contact" class="sec sec--contact" data-sec="5">
      <div class="contact__inner">
        <p class="handle"><span>${site.handle}</span></p>
        <a class="contact__mail" href="mailto:${outro.email}" aria-label="Email ${outro.email}">${cap(outro.caption, 'contact__cap')}</a>
        <ul class="links">
          ${outro.links.map((l) => `<li><a href="${l.href}" target="_blank" rel="noopener">${l.label}<span aria-hidden="true"> ↗</span></a></li>`).join('')}
        </ul>
      </div>
      <footer class="foot">
        <p>${site.copyright}</p>
        <p class="foot__credit">${site.credit}</p>
      </footer>
    </section>
  </main>
  <audio class="snd" preload="none" loop></audio>
`;

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));

/* ----------------------------------------------------------------- footage */

const store = new FrameStore(isMobile() ? 48 : 96);
const canvas = $<HTMLCanvasElement>('#stage');
let renderer: Renderer | null = null;

type SecInfo = { el: HTMLElement; seg: Segment; start: number; end: number; cuts: number[] };
const secEls = $$<HTMLElement>('.sec');
const segs: Segment[] = [hero.segment, brief.segment, pause.segment, file.segment, question.segment, outro.segment];
const secs: SecInfo[] = secEls.map((el, i) => ({ el, seg: segs[i], start: 0, end: 0, cuts: [] }));
const labels = [hero, brief, pause, file, question, outro].map((s) => ({ idx: s.index, name: s.label }));
const Q = 4; // index of the question section

function measure() {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  secs.forEach((s, i) => (s.start = i === 0 ? 0 : s.el.offsetTop - vh * 0.5));
  secs.forEach((s, i) => {
    s.end = i < secs.length - 1 ? secs[i + 1].start : Math.max(max, s.start + 1);
    // hard cuts inside a section (between pieces), as scroll positions
    let acc = 0;
    s.cuts = s.seg.pieces.slice(0, -1).map((pc) => {
      acc += pc.span;
      return s.start + (s.end - s.start) * acc;
    });
  });
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Which piece of a segment is on screen at section progress p, and how far into it. */
function pieceAt(seg: Segment, p: number) {
  let acc = 0;
  for (let k = 0; k < seg.pieces.length; k++) {
    const pc = seg.pieces[k];
    if (p <= acc + pc.span || k === seg.pieces.length - 1) return { pc, k, local: clamp((p - acc) / pc.span) };
    acc += pc.span;
  }
  return { pc: seg.pieces[0], k: 0, local: 0 };
}

// playback state
let autoplay = !reduced;
let loopT = hero.loop.from;
let heroAnchor = hero.loop.from;
let lastT = 0;
let pulse = 0; // extra glitch, decays
let activeSec = -1;
let lastFrameId = 0;
let clock = 0;
const scrubStats = { frames: 0, exact: 0 };

function progressOf(i: number, y: number) {
  const s = secs[i];
  return clamp((y - s.start) / (s.end - s.start));
}

function computeTime(y: number): { t: number; sec: number; p: number; piece: number; local: number } {
  let i = secs.findIndex((s) => y >= s.start && y < s.end);
  if (i < 0) i = y < 0 ? 0 : secs.length - 1;
  const p = progressOf(i, y);
  const { pc, k, local } = pieceAt(secs[i].seg, p);
  if (reduced) return { t: pc.poster, sec: i, p, piece: k, local };
  if (i === 0) {
    if (autoplay) return { t: loopT, sec: 0, p, piece: 0, local };
    return { t: heroAnchor + (pc.to - heroAnchor) * p, sec: 0, p, piece: 0, local };
  }
  return { t: pc.from + (pc.to - pc.from) * local, sec: i, p, piece: k, local };
}

function cutGlitch(y: number) {
  if (reduced) return 0;
  const vh = window.innerHeight;
  let g = 0;
  const near = (c: number) => {
    const d = Math.abs(y - c) / (vh * 0.1);
    if (d < 1) g = Math.max(g, 1 - d);
  };
  for (let i = 1; i < secs.length; i++) near(secs[i].start);
  secs.forEach((s) => s.cuts.forEach(near));
  return Math.pow(g, 1.4);
}

const tcEl = $('.tc-code__v');
const railFill = $('.rail__fill');
const hudIdx = $('.hud__idx');
const hudName = $('.hud__name');
const poster = $('.poster');

function fmtTC(t: number) {
  const s = Math.floor(t);
  const f = Math.floor((t - s) * 60);
  return `00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

let lastScrollY = 0;
function frame(dtMs: number) {
  if (!renderer) return;
  const dt = Math.min(0.05, dtMs / 1000);
  clock += dt;
  const y = lenis ? lenis.scroll : window.scrollY;

  // hero autoplay loop before the first scroll; resumes at the very top
  if (!reduced) {
    if (y > 2 && autoplay) {
      autoplay = false;
      heroAnchor = loopT;
    } else if (y <= 2 && !autoplay) {
      autoplay = true;
      loopT = clamp(lastT, hero.loop.from, hero.loop.to);
    }
    if (autoplay) {
      loopT += dt;
      if (loopT > hero.loop.to) loopT = hero.loop.from;
    }
  }

  const { t, sec, p, piece, local } = computeTime(y);
  lastT = t;
  if (sec !== activeSec) setActive(sec);
  choreograph(y);

  const f = store.frameAt(t);
  const dir = Math.sign(f - lastFrameId) || 1;
  lastFrameId = f;
  store.prefetch(f, dir, isMobile() ? 6 : 10);
  const a = Math.floor(f);
  const near = store.nearest(a);
  const bExact = store.get(a + 1);
  const exactA = near && near.id === a;
  scrubStats.frames++;
  if (exactA) scrubStats.exact++;

  const vel = lenis ? Math.abs(lenis.velocity) : Math.abs(y - lastScrollY) / Math.max(dt * 60, 1);
  lastScrollY = y;
  pulse = Math.max(0, pulse - dt * 3.2);
  const g = Math.max(cutGlitch(y), pulse);
  const seg = secs[sec].seg;
  const fade = sec === secs.length - 1 ? smooth(0.0, 0.5, p) : 0;
  let zoom = 1.02;
  if (!reduced) {
    if (sec === 0 && autoplay) zoom += 0.02 * Math.sin(clock * 0.5) + 0.02;
    else if (sec === Q && piece === 0) zoom += 0.14 * smooth(0, 1, local) + 0.01 * Math.sin(clock * 3.3); // push into the held burst, breathing
    else zoom += p * 0.05;
  }
  const mobile = isMobile();

  renderer.render({
    a: near?.bmp ?? null,
    aId: near?.id ?? -1,
    b: exactA && bExact ? bExact : null,
    bId: a + 1,
    mix: f - a,
    time: reduced ? 1 : clock,
    glitch: g,
    shift: reduced ? 0 : clamp(vel / 70),
    exposure: seg.exposure,
    fade,
    flash: reduced ? 0 : Math.max(0, g - 0.7) * 2.2,
    zoom,
    focusX: mobile ? seg.focusMobile : 0.5,
    focusY: 0.5,
    vignette: seg.vignette,
  });

  if (renderer.hasFrame && !poster.classList.contains('gone')) {
    poster.classList.add('gone');
    canvas.classList.add('live');
  }
  tcEl.textContent = fmtTC(t);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  railFill.style.transform = `scaleX(${clamp(y / Math.max(1, max))})`;
}

function setActive(i: number) {
  activeSec = i;
  hudIdx.textContent = labels[i].idx;
  hudName.textContent = labels[i].name;
  document.documentElement.dataset.sec = String(i);
}

/* ------------------------------------------------------------ smooth scroll */

let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); // until the intro finishes
}
gsap.ticker.add((_t, dt) => frame(dt));

$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!;
    const target = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
    e.preventDefault();
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView();
  }),
);

/* ------------------------------------------------------------------- sound */
// The edit's own soundtrack, only after an explicit click. Off by default.

const soundBtn = $<HTMLButtonElement>('.sound');
const audio = $<HTMLAudioElement>('.snd');
let soundOn = false;
const setSoundUI = (on: boolean) => {
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.classList.toggle('on', on);
  $('.sound__label', soundBtn).textContent = on ? ui.soundOn : ui.soundOff;
};
soundBtn.addEventListener('click', async () => {
  soundOn = !soundOn;
  setSoundUI(soundOn);
  if (soundOn) {
    if (!audio.src) audio.src = `${import.meta.env.BASE_URL}media/edit.mp4`;
    audio.volume = 0;
    try {
      await audio.play();
      gsap.to(audio, { volume: 0.8, duration: 1.2, ease: 'power1.out' });
    } catch {
      soundOn = false;
      setSoundUI(false);
    }
  } else {
    gsap.to(audio, { volume: 0, duration: 0.4, onComplete: () => audio.pause() });
  }
});

/* ------------------------------------------------------------- choreography */
// Everything is driven from the frame loop by section progress (the same numbers that drive the
// footage), so captions and cuts stay locked to the picture.

const caps = new Map<Element, Caption>();
const C = (el: Element) => {
  let c = caps.get(el);
  if (!c) caps.set(el, (c = new Caption(el as HTMLElement)));
  return c;
};

const heroCap = C($('.hero__cap'));
const briefCap = C($('.brief__cap'));
const pauseCap = C($('.pause__cap'));
const contactCap = C($('.contact__cap'));

type Step = { at: number; zone: 'tl' | 'br'; box: HTMLElement; cap: Caption };
const stepsOf = (sel: string, list: ZonedCaption[], base: number): Step[] =>
  list.map((c, i) => {
    const box = $(`${sel} [data-step="${base + i}"]`);
    return { at: c.at, zone: c.zone, box, cap: C($('.tc', box)) };
  });
const fileSteps = stepsOf('#file', file.steps, 0);
const qSteps = stepsOf('#question', question.captions, 100);

/** Show, per zone, the latest step that has been reached; hide the rest. */
function runSteps(steps: Step[], p: number, live: boolean) {
  for (const z of ['tl', 'br'] as const) {
    const zs = steps.filter((s) => s.zone === z);
    let cur: Step | null = null;
    for (const s of zs) if (live && p >= s.at) cur = s;
    for (const s of zs) {
      const on = s === cur;
      s.box.classList.toggle('is-current', on);
      if (on && !s.cap.on) s.cap.play(0, reduced);
      else if (!on && s.cap.on) s.cap.hide(reduced);
    }
  }
}

/** Fire a one-shot caption when progress crosses `at` (and reset it when scrolled back above). */
function gate(c: Caption, on: boolean, delay = 0) {
  if (on && !c.on) c.play(delay, reduced);
  else if (!on && c.on) c.hide(reduced);
}

const qWordEl = $('.qword__w');
const qEl = $('.qword');
let qIdx = -1;
let qVisible = false;
let qFlipped = false;

function choreograph(y: number) {
  if (!ready) return;
  const pBrief = progressOf(1, y);
  const pPause = progressOf(2, y);
  const pFile = progressOf(3, y);
  const pQ = progressOf(Q, y);
  const pOut = progressOf(5, y);
  const vis = (i: number) => y >= secs[i].start - window.innerHeight * 0.6 && y < secs[i].end + window.innerHeight * 0.4;

  gate(briefCap, vis(1) && pBrief > 0.16);
  gate(pauseCap, vis(2) && pPause > 0.12);
  runSteps(fileSteps, pFile, vis(3) && pFile > 0);
  runSteps(qSteps, pQ, vis(Q) && pQ > 0);
  gate(contactCap, pOut > 0.42, 0.4);
  $('#contact').classList.toggle('in', pOut > 0.42);

  // the question word: flips on scroll ticks over the burst, inverts with the ground, then gives way
  const showQ = vis(Q) && pQ > 0.06 && pQ < 0.6;
  if (showQ !== qVisible) {
    qVisible = showQ;
    qEl.classList.toggle('on', showQ);
  }
  const flipped = pQ >= 0.5;
  if (flipped !== qFlipped) {
    qFlipped = flipped;
    qEl.classList.toggle('flip', flipped);
    if (!reduced) pulse = Math.max(pulse, 0.9);
  }
  if (showQ) {
    const idx = Math.floor(pQ * 16) % 2;
    if (idx !== qIdx) {
      qIdx = idx;
      qWordEl.textContent = question.words[idx];
      if (!reduced) {
        gsap.fromTo(
          qEl,
          { opacity: 0, filter: 'blur(6px)', scale: 1.06 },
          { opacity: 1, filter: 'blur(0.7px)', scale: 1, duration: 0.12, ease: 'power2.out', overwrite: true },
        );
        gsap.fromTo(qWordEl, { x: () => (Math.random() - 0.5) * 6 }, { x: 0, duration: 0.07, ease: 'steps(2)', overwrite: true });
      }
    }
  }
}

function heroIntro() {
  const ls = $$('.hero__name .l');
  if (reduced) {
    heroCap.play(0, true);
    return;
  }
  // letters cut in one by one, dim first, then brighten (the caption's own two-stage type-on, bigger)
  ls.forEach((l, i) => {
    gsap.fromTo(
      l,
      { opacity: 0 },
      {
        keyframes: [
          { opacity: 0.35, duration: 0.001 },
          { opacity: 0.35, duration: 0.06 },
          { opacity: 1, duration: 0.22, ease: 'power1.out' },
        ],
        delay: 0.5 + i * 0.07,
      },
    );
  });
  heroCap.play(0.15);
  gsap.fromTo('.hero__cue', { opacity: 0 }, { opacity: 1, delay: 1.8, duration: 0.8 });
}

function buildScroll() {
  // hero exit: the name dissolves as the footage scrubs on
  if (!reduced) {
    gsap
      .timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__block', { opacity: 0, filter: 'blur(10px)', ease: 'power1.in', duration: 0.5 }, 0.3)
      .to('.hero__cue', { opacity: 0, duration: 0.2 }, 0);
  }
  ScrollTrigger.addEventListener('refresh', measure);
  ScrollTrigger.refresh();
}

/* ------------------------------------------------------------------- boot */

let ready = false;

async function boot() {
  const pctEl = $('.intro__pct span');
  const bar = $('.intro__bar i');
  const intro = $('.intro');
  const t0 = performance.now();

  try {
    await store.init();
  } catch (e) {
    console.warn('frames manifest failed', e);
  }
  renderer = new Renderer(canvas, store.width, store.height);
  window.addEventListener('resize', () => {
    renderer?.resize();
    measure();
  });

  const show = (p: number) => {
    pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0');
    bar.style.transform = `scaleX(${p})`;
  };
  // hero chunk first (it is all the first screen needs), the rest in background
  const heroChunk = store.load('a', show).catch((e) => console.warn(e));
  // on slow networks never hold the intro longer than this — the poster covers the stage until frames land
  const deadline = new Promise((r) => setTimeout(r, 8000));
  await Promise.race([heroChunk, deadline]);
  if (!reduced) {
    // decode the first frames of the loop so the reveal never shows an empty stage
    const f0 = Math.round(store.frameAt(hero.loop.from));
    await Promise.race([Promise.all([0, 1, 2, 3, 4, 5].map((i) => store.request(f0 + i))), deadline]);
  } else {
    await Promise.race([store.loadAll(), deadline]);
  }
  await document.fonts.ready;
  const minIntro = reduced ? 0 : 900;
  const wait = Math.max(0, minIntro - (performance.now() - t0));
  await new Promise((r) => setTimeout(r, wait));

  void store.loadAll();
  buildScroll();
  measure();

  if (reduced) intro.remove();
  else {
    pulse = 1;
    gsap.to(intro, { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => intro.remove() });
  }
  document.documentElement.classList.add('ready');
  ready = true;
  lenis?.start();
  heroIntro();
}

// small hook for scripts/shots.mjs (screenshots + render checks)
(window as unknown as { __app: unknown }).__app = {
  scrollTo: (y: number) => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)),
  sections: () => secs.map((s) => ({ id: s.el.id, top: s.el.offsetTop, height: s.el.offsetHeight, start: s.start, end: s.end })),
  state: () => ({ mode: renderer?.mode, hasFrame: renderer?.hasFrame, t: lastT, sec: activeSec, autoplay }),
  scrubStats: (reset = false) => {
    const r = { ...scrubStats };
    if (reset) scrubStats.frames = scrubStats.exact = 0;
    return r;
  },
  audio: () => ({ paused: audio.paused, time: audio.currentTime, muted: audio.muted, volume: audio.volume }),
};

void boot();
