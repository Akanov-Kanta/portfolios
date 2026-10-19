import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { about, hero, outro, site, stack, ui, work, type Segment } from './content';
import { FrameStore } from './frames';
import { Renderer, type ScreenRect } from './renderer';
import { charMarkup, scramble, typeIn, typeOut } from './type';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.innerWidth < 760;
document.documentElement.classList.toggle('reduced', reduced);
document.title = site.title;

/* ------------------------------------------------------------------ markup */

const sub = (title: string, lines: string[], cls = '') =>
  `<div class="sub ${cls}" data-sub>
     ${title ? `<p class="sub__title">${charMarkup(title)}</p>` : ''}
     ${lines.map((l) => `<p class="sub__line">${charMarkup(l)}</p>`).join('')}
   </div>`;

const letters = (word: string) => [...word].map((c) => `<span class="l">${c}</span>`).join('');
const corners = '<i class="tick tl"></i><i class="tick tr"></i><i class="tick bl"></i><i class="tick br"></i>';
const pad = (n: number) => String(n).padStart(2, '0');
const sections = [hero, about, work, stack, outro];
const bars = ['#c9c9c9', '#c9c437', '#37c3c9', '#35c43a', '#c235c4', '#d7262e', '#2f3fc9'];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="poster" aria-hidden="true"></div>
  <canvas id="stage" aria-hidden="true"></canvas>
  <div class="scrim" aria-hidden="true"></div>

  <div class="osd" aria-hidden="true">
    <i class="vf tl"></i><i class="vf tr"></i><i class="vf bl"></i><i class="vf br"></i>
    <p class="osd__side">FEED A <b>//</b> 1152×648 <b>//</b> 30 FPS <b>//</b> SRC: TOKYO GHOUL EDIT</p>
    <p class="osd__side osd__side--r">SIG <span class="osd__sig"><i></i><i></i><i></i><i></i><i></i></span> <b>//</b> GAIN +3.0dB</p>
    <div class="track">
      ${corners}
      <span class="track__label">SUBJ_01 <b>·</b> FACE LOCK</span>
      <span class="track__id">ID 0x4E41 <b>·</b> CONF 0.97</span>
      <i class="track__line"></i>
    </div>
  </div>

  <div class="intro" aria-hidden="true">
    <div class="intro__inner">
      <p class="intro__label"><span class="intro__dot"></span>${ui.loading}</p>
      <div class="intro__bars">${bars.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
      <p class="intro__pct"><span>000</span>%</p>
      <div class="intro__bar"><i></i></div>
      <p class="intro__meta"><span>CH 01</span><span>${site.coords}</span></p>
    </div>
  </div>

  <header class="hud hud--top">
    <a class="brand" href="#hero" aria-label="Nazar Akanov, back to top">
      <span class="brand__mark">N/A</span>
      <span class="brand__meta">PORTFOLIO<br />2026 · CRT</span>
    </a>
    <p class="chan"><span class="chan__k">CH</span><span class="chan__idx">01</span><span class="chan__sep"></span><span class="chan__name">HERO</span></p>
    <button class="sound" type="button" aria-pressed="false" aria-label="Toggle sound">
      <span class="sound__bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      <span class="sound__label">${ui.soundOff}</span>
    </button>
  </header>

  <div class="hud hud--bottom" aria-hidden="true">
    <p class="rec"><i></i>REC</p>
    <p class="tc"><span class="tc__k">TC</span> <span class="tc__v">00:00:00:00</span></p>
    <div class="rail"><i class="rail__fill"></i>${sections.map(() => '<b class="rail__tick"></b>').join('')}</div>
    <p class="coords">${site.coords}</p>
    <p class="clock">AST <span class="clock__v">--:--:--</span></p>
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
          <div class="hero__subwrap"><span class="hero__tag">LIVE</span>${sub('', [hero.subtitle], 'hero__sub')}</div>
        </div>
        <div class="hero__cue"><span>${hero.scrollCue}</span><i></i></div>
      </div>
    </section>

    <section id="about" class="sec sec--about" data-sec="1">
      <div class="pin">
        <p class="quote" aria-live="polite"><span class="quote__w">${about.quote[0]}</span></p>
        <div class="panel about__panel">
          ${corners}
          <header class="panel__bar"><span><i class="panel__dot"></i>${about.file}</span><span>${about.index} / 05</span></header>
          <div class="about__subs">
            ${about.blocks.map((b) => sub(b.title, b.lines, 'about__sub')).join('')}
          </div>
        </div>
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
            <div class="card__screen">
              <div class="card__bar">
                <span>CAM ${pad(i + 1)}</span>
                <span class="card__live"><i></i>LIVE</span>
                <span class="card__tc">00:0${i + 1}:${pad(12 + i * 17)}:${pad(4 + i * 7)}</span>
              </div>
              <div class="card__body">
                <p class="card__idx"><span>${pad(i + 1)}</span> / ${pad(work.projects.length)}</p>
                <h3 class="card__name" data-final="${p.name}">${p.name}</h3>
                <p class="card__blurb">${p.blurb}</p>
                <ul class="card__tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
                <a class="card__link" href="${p.href}">OPEN FEED <span aria-hidden="true">↗</span></a>
              </div>
            </div>
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
        <ol class="stack__list">
          ${stack.items
            .map(
              (s, i) =>
                `<li class="stack__item"><span class="stack__n">${pad(i + 1)}</span><span class="stack__w" data-final="${s}">${s}</span><span class="stack__lead"></span><span class="stack__st" data-off="STANDBY" data-on="ONLINE" data-hot="ON AIR">STANDBY</span></li>`,
            )
            .join('')}
        </ol>
      </div>
    </section>

    <section id="contact" class="sec sec--contact" data-sec="4">
      <div class="contact__track">
      <div class="pin">
        <div class="contact__end">
          <div class="panel contact__panel">
            ${corners}
            ${sub(outro.kicker, [outro.line], 'contact__sub')}
          </div>
        </div>
        <div class="contact__inner">
          <p class="contact__pre">SIGNAL ENDS HERE <b>//</b> TRANSMIT TO</p>
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
          <p class="foot__credit">${site.credit}<span class="foot__sep">·</span>${site.music}</p>
        </footer>
      </div>
      </div>
    </section>
  </main>
  <audio class="snd" preload="none" loop></audio>
`;

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));

/* ------------------------------------------------------------- screen rect */

const root = document.documentElement;
let screen: ScreenRect = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight, r: 0 };

/** The CRT screen fills the viewport inside a thin housing. */
function layoutScreen() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const m = isMobile() ? 6 : Math.round(Math.min(18, Math.max(10, w * 0.009)));
  const r = isMobile() ? 22 : Math.round(Math.min(44, Math.max(20, Math.min(w, h) * 0.04)));
  screen = { x: m, y: m, w: w - 2 * m, h: h - 2 * m, r };
  root.style.setProperty('--sx', `${screen.x}px`);
  root.style.setProperty('--sy', `${screen.y}px`);
  root.style.setProperty('--sw', `${screen.w}px`);
  root.style.setProperty('--sh', `${screen.h}px`);
  root.style.setProperty('--sr', `${screen.r}px`);
  renderer?.setScreen(screen);
}

/* ----------------------------------------------------------------- footage */

const store = new FrameStore(isMobile() ? 48 : 96);
const canvas = $<HTMLCanvasElement>('#stage');
let renderer: Renderer | null = null;

type SecInfo = { el: HTMLElement; seg: Segment; start: number; end: number };
const secEls = $$<HTMLElement>('.sec');
const segs: Segment[] = [hero.segment, about.segment, work.segment, stack.segment, outro.segment];
const secs: SecInfo[] = secEls.map((el, i) => ({ el, seg: segs[i], start: 0, end: 0 }));
const labels = sections.map((s) => ({ idx: s.index, name: s.label }));
const railTicks = $$('.rail__tick');

function measure() {
  const vh = window.innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  secs.forEach((s, i) => (s.start = i === 0 ? 0 : s.el.offsetTop - vh * 0.5));
  secs.forEach((s, i) => (s.end = i < secs.length - 1 ? secs[i + 1].start : Math.max(max, s.start + 1)));
  secs.forEach((s, i) => (railTicks[i].style.left = `${(Math.max(0, s.start) / Math.max(1, max)) * 100}%`));
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
let noise = 0; // channel-switch static, decays
let activeSec = 0;
let lastFrameId = 0;
let clock = 0;
const scrubStats = { frames: 0, exact: 0 };
const boot = { power: reduced ? 1 : 0 }; // CRT power-on at reveal

function computeTime(y: number): { t: number; sec: number; p: number } {
  let i = secs.findIndex((s) => y >= s.start && y < s.end);
  if (i < 0) i = y < 0 ? 0 : secs.length - 1;
  const s = secs[i];
  const p = clamp((y - s.start) / (s.end - s.start));
  const seg = s.seg;
  if (reduced) return { t: seg.poster, sec: i, p };
  if (i === 0) {
    if (autoplay) return { t: loopT, sec: 0, p };
    return { t: heroAnchor + (seg.to - heroAnchor) * p, sec: 0, p };
  }
  const q = clamp(p / (seg.scrubEnd ?? 1));
  return { t: seg.from + (seg.to - seg.from) * q, sec: i, p };
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
const chanIdx = $('.chan__idx');
const chanName = $('.chan__name');
const poster = $('.poster');
const track = $('.track');
const contact = $('#contact');

function fmtTC(t: number) {
  const s = Math.floor(t);
  const f = Math.floor((t - s) * 30);
  return `00:00:${pad(s)}:${pad(f)}`;
}

/** Map a point of the 16:9 frame (u,v from top-left) to CSS px, same cover math as the shader. */
function frameToScreen(u: number, v: number, zoom: number, focusX: number) {
  const rs = screen.w / screen.h;
  const ri = store.width / store.height;
  let kx = rs > ri ? 1 : rs / ri;
  let ky = rs > ri ? ri / rs : 1;
  kx /= zoom;
  ky /= zoom;
  const ox = (1 - kx) * focusX;
  const oy = (1 - ky) * 0.5;
  const sx = (u - ox) / kx;
  const sy = (1 - v - oy) / ky;
  return { x: screen.x + sx * screen.w, y: screen.y + (1 - sy) * screen.h };
}

let lastScrollY = 0;
let contactState = '';
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
        pulse = 0.6;
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
  noise = Math.max(0, noise - dt * 3.5);
  const g = Math.max(cutGlitch(y), pulse);
  const seg = secs[sec].seg;
  const zoom = reduced ? 1.06 : 1.06 + (sec === 0 && autoplay ? 0.015 * Math.sin(clock * 0.5) + 0.015 : p * 0.06);

  // outro: the set powers off after the spiral, the handle glows on the black tube
  let power = boot.power;
  if (sec === 4) {
    const [p0, p1] = outro.powerOff;
    power *= reduced ? (p < (p0 + p1) / 2 ? 1 : 0) : 1 - smooth(p0, p1, p);
    const state = p > p1 - 0.03 ? 'off' : p > 0.02 ? 'end' : '';
    if (state !== contactState) setContactState(state);
  } else if (contactState) setContactState('');

  renderer.render({
    a: near?.bmp ?? null,
    aId: near?.id ?? -1,
    b: exactA && bExact ? bExact : null,
    bId: a + 1,
    mix: f - a,
    time: reduced ? 1.3 : clock,
    glitch: g,
    shift: reduced ? 0 : clamp(vel / 70),
    exposure: seg.exposure,
    flash: reduced ? 0 : Math.max(0, g - 0.75) * 1.4,
    zoom,
    focusX: isMobile() ? seg.focusX : 0.5,
    focusY: 0.5,
    power,
    halftone: seg.halftone,
    noise: reduced ? 0 : noise,
    motion: reduced ? 0 : 1,
  });

  if (renderer.hasFrame && !poster.classList.contains('gone')) {
    poster.classList.add('gone');
    canvas.classList.add('live');
  }

  // tracking box follows the figure during the hero
  if (sec === 0) {
    const tr = hero.track;
    const p0 = frameToScreen(tr.u0, tr.v0, zoom, isMobile() ? seg.focusX : 0.5);
    const p1 = frameToScreen(tr.u1, tr.v1, zoom, isMobile() ? seg.focusX : 0.5);
    track.style.transform = `translate3d(${p0.x.toFixed(1)}px, ${p0.y.toFixed(1)}px, 0)`;
    track.style.width = `${(p1.x - p0.x).toFixed(1)}px`;
    track.style.height = `${(p1.y - p0.y).toFixed(1)}px`;
    track.style.opacity = String(1 - smooth(0.1, 0.4, p));
  }

  tcEl.textContent = fmtTC(t);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  railFill.style.transform = `scaleX(${clamp(y / Math.max(1, max))})`;
}

function setActive(i: number) {
  activeSec = i;
  if (!reduced) {
    scramble(chanIdx, labels[i].idx, 260);
    scramble(chanName, labels[i].name, 420);
    noise = Math.max(noise, 0.55);
  } else {
    chanIdx.textContent = labels[i].idx;
    chanName.textContent = labels[i].name;
  }
  root.dataset.sec = String(i);
}

const contactSub = () => $('.contact__sub');
function setContactState(s: string) {
  const prev = contactState;
  contactState = s;
  contact.classList.toggle('end', s === 'end' || s === 'off');
  contact.classList.toggle('off', s === 'off');
  root.classList.toggle('tube-off', s === 'off');
  if (s && !prev) typeIn(contactSub(), { delay: 200, cps: 40, instant: reduced });
  if (!s) typeOut(contactSub());
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

/* ------------------------------------------------------------- hud clock */

const clockEl = $('.clock__v');
const tickClock = () => {
  // Astana local time (UTC+5)
  clockEl.textContent = new Date(Date.now() + 5 * 3600e3).toISOString().slice(11, 19);
};
tickClock();
setInterval(tickClock, 1000);

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
    if (!audio.src) audio.src = `${import.meta.env.BASE_URL}media/audio.m4a`;
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
};

function heroIntro() {
  const ls = $$('.hero__name .l');
  if (reduced) {
    ls.forEach((l) => (l.style.opacity = '1'));
    typeIn(subs.heroKicker, { instant: true });
    typeIn(subs.heroSub, { instant: true });
    return;
  }
  // letters tune in one by one, like a channel locking on
  const order = gsap.utils.shuffle([...ls]);
  order.forEach((l, i) => {
    const d = 0.35 + i * 0.05;
    gsap.fromTo(
      l,
      { opacity: 0, x: () => gsap.utils.random(-30, 30), filter: 'blur(6px)' },
      {
        keyframes: [
          { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.06 },
          { opacity: 0.2, x: 4, duration: 0.05 },
          { opacity: 1, x: 0, duration: 0.05 },
          { opacity: 0.5, duration: 0.04 },
          { opacity: 1, duration: 0.2 },
        ],
        delay: d,
      },
    );
  });
  typeIn(subs.heroKicker, { delay: 500, cps: 30 });
  typeIn(subs.heroSub, { delay: 1300, cps: 26 });
  gsap.fromTo('.hero__cue', { opacity: 0 }, { opacity: 1, delay: 2.4, duration: 1 });
}

function buildScroll() {
  // hero exit: name tracks out and dissolves as the footage scrubs on
  if (!reduced) {
    gsap
      .timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__row', { letterSpacing: '0.18em', ease: 'none', duration: 1 }, 0.25)
      .to('.hero__block', { opacity: 0, filter: 'blur(8px)', yPercent: -8, ease: 'power1.in', duration: 0.55 }, 0.45)
      .to('.hero__cue', { opacity: 0, duration: 0.2 }, 0);
  }

  // about: subtitles type in one after another, then the quote swaps as the eye turns red
  const aboutTypes = subs.about.map(() => false);
  let quoteStage = -1;
  const quoteW = $('.quote__w');
  const quote = $('.quote');
  const panel = $('.about__panel');
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top center',
    end: 'bottom bottom',
    onUpdate: (st) => {
      const p = st.progress;
      panel.classList.toggle('in', p > 0.03 && p < 0.6);
      subs.about.forEach((el, i) => {
        const on = p > 0.06 + i * 0.16;
        if (on !== aboutTypes[i]) {
          aboutTypes[i] = on;
          if (on) typeIn(el, { cps: 46, instant: reduced });
          else typeOut(el);
        }
        el.classList.toggle('dim', p > 0.06 + (i + 1) * 0.16 + 0.02 && i < subs.about.length - 1);
      });
      const stage = p < 0.64 ? -1 : p < 0.82 ? 0 : 1;
      if (stage !== quoteStage) {
        quoteStage = stage;
        quote.classList.toggle('on', stage >= 0);
        quote.classList.toggle('red', stage === 1);
        if (stage >= 0) {
          const word = about.quote[stage];
          if (reduced) quoteW.textContent = word;
          else {
            scramble(quoteW, word, 520);
            pulse = Math.max(pulse, 0.45);
          }
        }
      }
    },
  });

  // work: header + monitor cards reveal
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
      gsap.fromTo(card, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  // stack: each channel goes on air as the tunnel scrubs
  const items = $$('.stack__item');
  const lit = items.map(() => false);
  const hot = items.map(() => false);
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
        const isHot = on && p < 0.1 + (i + 1) * 0.12;
        const status = $('.stack__st', it);
        if (on !== lit[i]) {
          lit[i] = on;
          it.classList.toggle('lit', on);
          const w = $('.stack__w', it);
          if (on && !reduced) {
            scramble(w, w.dataset.final!, 480);
            pulse = Math.max(pulse, 0.3);
          }
        }
        if (isHot !== hot[i] || status.dataset.state !== (isHot ? 'hot' : on ? 'on' : 'off')) {
          hot[i] = isHot;
          it.classList.toggle('hot', isHot);
          const key = isHot ? 'hot' : on ? 'on' : 'off';
          status.dataset.state = key;
          const label = status.dataset[key]!;
          if (reduced) status.textContent = label;
          else scramble(status, label, 300);
        }
      });
    },
  });

  ScrollTrigger.addEventListener('refresh', measure);
  ScrollTrigger.refresh();
}

/* ------------------------------------------------------------------- boot */

async function start() {
  const pctEl = $('.intro__pct span');
  const bar = $('.intro__bar i');
  const intro = $('.intro');
  const t0 = performance.now();
  timing.start = Math.round(t0);

  layoutScreen();
  try {
    await store.init();
  } catch (e) {
    console.warn('frames manifest failed', e);
  }
  renderer = new Renderer(canvas, store.width, store.height);
  renderer.setScreen(screen);
  window.addEventListener('resize', () => {
    renderer?.resize();
    layoutScreen();
    measure();
  });

  const show = (p: number) => {
    pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0');
    bar.style.transform = `scaleX(${p})`;
  };
  // hero chunk first (it is all the first screen needs), the rest in background
  const heroChunk = store.load('a', show).catch((e) => console.warn(e));
  // on slow networks never hold the intro longer than ~7.6 s after navigation start — the poster
  // covers the tube until frames land
  const deadline = new Promise((r) => setTimeout(r, Math.max(1500, 7600 - performance.now())));
  await Promise.race([heroChunk, deadline]);
  if (!reduced) {
    // decode the first frames so the reveal never shows an empty tube
    await Promise.race([Promise.all([0, 1, 2, 3, 4, 5].map((i) => store.request(i))), deadline]);
  } else {
    await Promise.race([store.loadAll(), deadline]);
  }
  await Promise.race([document.fonts.ready, deadline]);
  const minIntro = reduced ? 0 : 1100;
  const wait = Math.max(0, minIntro - (performance.now() - t0));
  await new Promise((r) => setTimeout(r, wait));

  void store.loadAll();
  buildScroll();
  measure();

  if (reduced) {
    intro.remove();
    timing.open = Math.round(performance.now());
  } else {
    gsap.to(intro, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.out',
      onComplete: () => {
        intro.remove();
        timing.open = Math.round(performance.now());
      },
    });
    // CRT power-on: a dot widens into a line, the line opens into the picture
    gsap.to(boot, { power: 1, duration: 1.15, ease: 'power3.out', delay: 0.1 });
    gsap.delayedCall(0.75, () => {
      noise = 0.5;
      pulse = 0.5;
    });
  }
  root.classList.add('ready');
  timing.ready = Math.round(performance.now());
  lenis?.start();
  heroIntro();
  setActive(0);
}

const timing = { start: 0, ready: 0, open: 0 };

// small hook for scripts/shots.mjs (screenshots + render checks)
(window as unknown as { __app: unknown }).__app = {
  scrollTo: (y: number) => (lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)),
  sections: () => secs.map((s) => ({ id: s.el.id, top: s.el.offsetTop, height: s.el.offsetHeight, start: s.start, end: s.end })),
  state: () => ({ mode: renderer?.mode, hasFrame: renderer?.hasFrame, t: lastT, sec: activeSec, autoplay, power: boot.power }),
  scrubStats: (reset = false) => {
    const r = { ...scrubStats };
    if (reset) scrubStats.frames = scrubStats.exact = 0;
    return r;
  },
  timing: () => ({ ...timing }),
  audio: () => ({ paused: audio.paused, time: audio.currentTime, muted: audio.muted, volume: audio.volume }),
};

void start();
