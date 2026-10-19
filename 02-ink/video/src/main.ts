import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { about, hero, outro, site, stack, ui, work, type Segment } from './content';
import { FrameStore } from './frames';
import { Renderer } from './renderer';
import { charMarkup, scramble, typeIn, typeOut } from './type';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 760;
document.documentElement.classList.toggle('reduced', reduced);
document.title = site.title;

/* ------------------------------------------------------------------ markup */

const sub = (title: string, lines: string[], cls = '') =>
  `<div class="sub ${cls}" data-sub>
     <p class="sub__title">${charMarkup(title)}</p>
     ${lines.map((l) => `<p class="sub__line">${charMarkup(l)}</p>`).join('')}
   </div>`;

const letters = (word: string) => [...word].map((c) => `<span class="l">${c}</span>`).join('');

const corners = '<i class="tick tl"></i><i class="tick tr"></i><i class="tick bl"></i><i class="tick br"></i>';

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
    <a class="brand" href="#hero" aria-label="Nazar Akanov, back to top">
      <span class="brand__mark">N/A</span>
      <span class="brand__meta">PORTFOLIO<br />2026</span>
    </a>
    <p class="hud__section"><span class="hud__idx">01</span><span class="hud__sep"></span><span class="hud__name">HERO</span></p>
    <button class="sound" type="button" aria-pressed="false" aria-label="Toggle sound">
      <span class="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="sound__label">${ui.soundOff}</span>
    </button>
  </header>

  <div class="hud hud--bottom" aria-hidden="true">
    <p class="tc"><span class="tc__k">TC</span> <span class="tc__v">00:00:00:00</span></p>
    <div class="rail"><i class="rail__fill"></i></div>
    <p class="coords">51.16°N&nbsp;&nbsp;71.47°E</p>
  </div>

  <main>
    <section id="hero" class="sec sec--hero" data-sec="0">
      <div class="pin">
        <div class="hero__block">
          ${sub(hero.kicker, [], 'hero__kicker')}
          <h1 class="hero__name" aria-label="${hero.first} ${hero.last}">
            <span class="hero__row">${letters(hero.first)}</span>
            <span class="hero__row hero__row--2">${letters(hero.last)}</span>
          </h1>
          <div class="hero__subwrap">${sub('', [hero.subtitle], 'hero__sub')}</div>
        </div>
        <div class="hero__cue"><span>${hero.scrollCue}</span><i></i></div>
      </div>
    </section>

    <section id="about" class="sec sec--about" data-sec="1">
      <div class="pin">
        <p class="quote" aria-live="polite"><span class="quote__q">“</span><span class="quote__w">${about.quote[0]}</span><span class="quote__q">”</span></p>
        <div class="about__subs">
          ${about.blocks.map((b) => sub(b.title, b.lines, 'about__sub')).join('')}
        </div>
        <p class="sec__index"><span>${about.index}</span> ${about.label}</p>
      </div>
    </section>

    <section id="work" class="sec sec--work" data-sec="2">
      <header class="work__head">
        ${sub(work.kicker, [], 'work__kicker')}
        <h2 class="work__title"><span>${work.heading[0]}</span><span>${work.heading[1]}</span></h2>
      </header>
      <ol class="cards">
        ${work.projects
          .map(
            (p, i) => `
          <li class="card card--${i % 2 ? 'r' : 'l'}">
            ${corners}
            <p class="card__idx"><span>${String(i + 1).padStart(2, '0')}</span> / ${String(work.projects.length).padStart(2, '0')}</p>
            <h3 class="card__name" data-final="${p.name}">${p.name}</h3>
            <p class="card__blurb">${p.blurb}</p>
            <ul class="card__tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
            <a class="card__link" href="${p.href}">VIEW PROJECT <span aria-hidden="true">↗</span></a>
          </li>`,
          )
          .join('')}
      </ol>
    </section>

    <section id="stack" class="sec sec--stack" data-sec="3">
      <div class="pin">
        <div class="stack__side">
          ${sub(stack.kicker, stack.caption, 'stack__sub')}
        </div>
        <ul class="stack__list">
          ${stack.items
            .map(
              (s, i) =>
                `<li class="stack__item"><span class="stack__n">${String(i + 1).padStart(2, '0')}</span><span class="stack__w" data-final="${s}">${s}</span></li>`,
            )
            .join('')}
        </ul>
      </div>
    </section>

    <section id="contact" class="sec sec--contact" data-sec="4">
      <div class="contact__inner">
        ${sub(outro.kicker, [outro.line], 'contact__sub')}
        <p class="handle"><span>${site.handle}</span></p>
        <ul class="links">
          ${outro.links
            .map(
              (l) =>
                `<li><a href="${l.href}"${l.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${l.label}<span aria-hidden="true">↗</span></a></li>`,
            )
            .join('')}
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

type SecInfo = { el: HTMLElement; seg: Segment | null; start: number; end: number; focus: [number, number] };
const secEls = $$<HTMLElement>('.sec');
const segs: (Segment | null)[] = [hero.segment, about.segment, work.segment, stack.segment, null];
const secs: SecInfo[] = secEls.map((el, i) => ({ el, seg: segs[i], start: 0, end: 0, focus: [0.5, 0.5] }));
const labels = [hero, about, work, stack, outro].map((s) => ({ idx: s.index, name: s.label }));

function measure() {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  secs.forEach((s, i) => {
    s.start = i === 0 ? 0 : s.el.offsetTop - vh * 0.5;
    s.focus = isMobile() ? [0.5, 0.5] : [0.5, 0.5];
  });
  secs.forEach((s, i) => (s.end = i < secs.length - 1 ? secs[i + 1].start : Math.max(max, s.start + 1)));
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// playback state
let autoplay = !reduced;
let loopT = hero.loop.from;
let heroAnchor = hero.loop.from;
let lastT = 0;
let pulse = 0; // extra glitch, decays
let activeSec = 0;
let lastFrameId = 0;
let clock = 0;
const scrubStats = { frames: 0, exact: 0 };
let burstLevel = 0; // about section ink burst, driven by its ScrollTrigger

function computeTime(y: number): { t: number; sec: number; p: number } {
  let i = secs.findIndex((s) => y >= s.start && y < s.end);
  if (i < 0) i = y < 0 ? 0 : secs.length - 1;
  const s = secs[i];
  const p = clamp((y - s.start) / (s.end - s.start));
  const seg = s.seg;
  if (!seg) return { t: lastT, sec: i, p };
  if (reduced) return { t: seg.poster, sec: i, p };
  if (i === 0) {
    if (autoplay) return { t: loopT, sec: 0, p };
    return { t: heroAnchor + (seg.to - heroAnchor) * p, sec: 0, p };
  }
  return { t: seg.from + (seg.to - seg.from) * p, sec: i, p };
}

function cutGlitch(y: number) {
  if (reduced) return 0;
  const vh = window.innerHeight;
  let g = 0;
  for (let i = 1; i < secs.length; i++) {
    const d = Math.abs(y - secs[i].start) / (vh * 0.1);
    if (d < 1) g = Math.max(g, 1 - d);
  }
  return Math.pow(g, 1.4);
}

const tcEl = $('.tc__v');
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
      if (loopT > hero.loop.to) {
        loopT = hero.loop.from;
        pulse = 0.7;
      }
    }
  }

  const { t, sec, p } = computeTime(y);
  lastT = t;
  if (sec !== activeSec) setActive(sec);

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
  const exposure = seg ? seg.exposure : 0.6;
  const fade = sec === secs.length - 1 ? smooth(0.0, 0.32, p) : 0;
  const zoom = reduced ? 1.02 : 1.02 + (sec === 0 && autoplay ? 0.02 * Math.sin(clock * 0.5) + 0.02 : p * 0.07);

  renderer.render({
    a: near?.bmp ?? null,
    aId: near?.id ?? -1,
    b: exactA && bExact ? bExact : null,
    bId: a + 1,
    mix: f - a,
    time: reduced ? 1 : clock,
    glitch: g,
    shift: reduced ? 0 : clamp(vel / 70),
    exposure,
    fade,
    flash: reduced ? 0 : Math.max(0, g - 0.72) * 1.6,
    zoom,
    focusX: secs[sec].focus[0],
    focusY: secs[sec].focus[1],
    burst: sec === 1 ? burstLevel : 0,
    // white-paper frames are flipped to white-ink-on-black so the section stays dark
    invert: seg?.invert && store.luma(near?.id ?? a) > 0.47 ? 1 : 0,
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
  if (i !== 1) document.documentElement.classList.remove('on-light');
  if (!reduced) {
    scramble(hudIdx, labels[i].idx, 260);
    scramble(hudName, labels[i].name, 420);
  } else {
    hudIdx.textContent = labels[i].idx;
    hudName.textContent = labels[i].name;
  }
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
    if (id.length < 2) {
      e.preventDefault();
      return;
    }
    const target = document.querySelector<HTMLElement>(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView();
  }),
);

/* ------------------------------------------------------------------- sound */

const soundBtn = $<HTMLButtonElement>('.sound');
const audio = $<HTMLAudioElement>('.snd');
let soundOn = false;
soundBtn.addEventListener('click', async () => {
  soundOn = !soundOn;
  soundBtn.setAttribute('aria-pressed', String(soundOn));
  soundBtn.classList.toggle('on', soundOn);
  $('.sound__label', soundBtn).textContent = soundOn ? ui.soundOn : ui.soundOff;
  if (soundOn) {
    if (!audio.src) audio.src = `${import.meta.env.BASE_URL}media/edit.mp4`;
    audio.volume = 0;
    try {
      await audio.play();
      gsap.to(audio, { volume: 0.8, duration: 1.2, ease: 'power1.out' });
    } catch {
      soundOn = false;
      soundBtn.classList.remove('on');
      soundBtn.setAttribute('aria-pressed', 'false');
      $('.sound__label', soundBtn).textContent = ui.soundOff;
    }
  } else {
    gsap.to(audio, { volume: 0, duration: 0.4, onComplete: () => audio.pause() });
  }
});

/* ------------------------------------------------------------- choreography */

const subs = {
  heroKicker: $('.hero__kicker'),
  heroSub: $('.hero__sub'),
  about: $$('.about__sub'),
  work: $('.work__kicker'),
  stack: $('.stack__sub'),
  contact: $('.contact__sub'),
};

function heroIntro() {
  const ls = $$('.hero__name .l');
  if (reduced) {
    ls.forEach((l) => (l.style.opacity = '1'));
    typeIn(subs.heroKicker, { instant: true });
    typeIn(subs.heroSub, { instant: true });
    return;
  }
  // letters flicker on in a random order, like a bad neon tube
  const order = gsap.utils.shuffle([...ls]);
  order.forEach((l, i) => {
    const d = 0.15 + i * 0.055;
    gsap.fromTo(
      l,
      { opacity: 0, filter: 'blur(12px)' },
      {
        keyframes: [
          { opacity: 1, filter: 'blur(0px)', duration: 0.05 },
          { opacity: 0.15, duration: 0.05 },
          { opacity: 1, duration: 0.06 },
          { opacity: 0.4, duration: 0.04 },
          { opacity: 1, duration: 0.2 },
        ],
        delay: d,
      },
    );
  });
  typeIn(subs.heroKicker, { delay: 300, cps: 30 });
  typeIn(subs.heroSub, { delay: 1100, cps: 26 });
  gsap.fromTo('.hero__cue', { opacity: 0 }, { opacity: 1, delay: 2.2, duration: 1 });
}

function buildScroll() {
  // hero exit: name tracks out and dissolves as the footage scrubs on
  if (!reduced) {
    gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__row', { letterSpacing: '0.32em', ease: 'none', duration: 1 }, 0.25)
      .to('.hero__block', { opacity: 0, filter: 'blur(10px)', yPercent: -8, ease: 'power1.in', duration: 0.55 }, 0.45)
      .to('.hero__cue', { opacity: 0, duration: 0.2 }, 0);
  }

  // about: subtitles type in one after another, then the quote word burst
  const aboutTypes = subs.about.map(() => false);
  let quoteStage = -1;
  const quoteW = $('.quote__w');
  const quote = $('.quote');
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top center',
    end: 'bottom bottom',
    onUpdate: (st) => {
      const p = st.progress;
      subs.about.forEach((el, i) => {
        const on = p > 0.06 + i * 0.17;
        if (on !== aboutTypes[i]) {
          aboutTypes[i] = on;
          if (on) typeIn(el, { cps: 46, instant: reduced });
          else typeOut(el);
        }
        el.classList.toggle('dim', p > 0.06 + (i + 1) * 0.17 + 0.02 && i < subs.about.length - 1);
      });
      const stage = p < 0.64 ? -1 : p < 0.8 ? 0 : 1;
      if (stage !== quoteStage) {
        quoteStage = stage;
        quote.classList.toggle('on', stage >= 0);
        if (stage >= 0) {
          const word = about.quote[stage];
          if (reduced) quoteW.textContent = word;
          else {
            scramble(quoteW, word, 520);
            pulse = Math.max(pulse, 0.45);
          }
        }
      }
      burstLevel = smooth(0.6, 0.71, p);
      $('.about__subs').style.opacity = String(1 - smooth(0.54, 0.6, p));
      document.documentElement.classList.toggle('on-light', burstLevel > 0.55);
    },
  });

  // work: header + cards reveal
  ScrollTrigger.create({
    trigger: '.work__head',
    start: 'top 75%',
    onEnter: () => {
      typeIn(subs.work, { instant: reduced });
      $('.work__head').classList.add('in');
    },
    onLeaveBack: () => {
      typeOut(subs.work);
      $('.work__head').classList.remove('in');
    },
  });
  $$('.card').forEach((card) => {
    const name = $('.card__name', card);
    ScrollTrigger.create({
      trigger: card,
      start: 'top 82%',
      onEnter: () => {
        card.classList.add('in');
        if (!reduced) scramble(name, name.dataset.final!, 700);
      },
      onLeaveBack: () => card.classList.remove('in'),
    });
    if (!reduced) {
      gsap.fromTo(card, { yPercent: 10 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  // stack: each word ignites as the dark segment scrubs
  const items = $$('.stack__item');
  const lit = items.map(() => false);
  let stackTyped = false;
  ScrollTrigger.create({
    trigger: '#stack',
    start: 'top center',
    end: 'bottom bottom',
    onUpdate: (st) => {
      const p = st.progress;
      if (p > 0.04 !== stackTyped) {
        stackTyped = p > 0.04;
        if (stackTyped) typeIn(subs.stack, { instant: reduced });
        else typeOut(subs.stack);
      }
      items.forEach((it, i) => {
        const on = p > 0.1 + i * 0.12;
        if (on !== lit[i]) {
          lit[i] = on;
          it.classList.toggle('lit', on);
          const w = $('.stack__w', it);
          if (on && !reduced) {
            scramble(w, w.dataset.final!, 480);
            pulse = Math.max(pulse, 0.3);
          }
        }
        it.classList.toggle('hot', on && p < 0.1 + (i + 1) * 0.12);
      });
    },
  });

  // outro
  ScrollTrigger.create({
    trigger: '#contact',
    start: 'top 35%',
    onEnter: () => {
      $('#contact').classList.add('in');
      typeIn(subs.contact, { delay: 500, cps: 40, instant: reduced });
    },
    onLeaveBack: () => {
      $('#contact').classList.remove('in');
      typeOut(subs.contact);
    },
  });

  ScrollTrigger.addEventListener('refresh', measure);
  ScrollTrigger.refresh();
}

/* ------------------------------------------------------------------- boot */

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
    // decode the first few frames so the reveal never shows an empty stage
    await Promise.race([Promise.all([0, 1, 2, 3, 4, 5].map((i) => store.request(i))), deadline]);
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
    gsap.to(intro, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => intro.remove(),
    });
  }
  document.documentElement.classList.add('ready');
  lenis?.start();
  heroIntro();
  setActive(0);
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
