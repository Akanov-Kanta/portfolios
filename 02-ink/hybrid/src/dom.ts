import type { content as Content } from './content';

type C = typeof Content;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface Refs {
  scenes: HTMLElement[];
  heroInner: HTMLElement;
  heroName: HTMLElement;
  heroKicker: HTMLElement;
  heroSub: HTMLElement;
  aboutNarr: HTMLElement;
  aboutQuote: HTMLElement;
  workNarr: HTMLElement;
  cards: HTMLElement[];
  stackNarr: HTMLElement;
  slams: HTMLElement[];
  collage: HTMLElement;
  outroNarr: HTMLElement;
  handle: HTMLElement;
  outroFade: HTMLElement[];
  hudScene: HTMLElement;
  sound: HTMLButtonElement;
  soundLabel: HTMLElement;
  audio: HTMLAudioElement;
  quoteWord: HTMLElement;
  bootPct: HTMLElement;
  bootBar: HTMLElement;
  hudBar: HTMLElement;
  track: HTMLElement;
  boot: HTMLElement;
}

export function buildDOM(c: C): Refs {
  const app = document.getElementById('app')!;
  const projects = c.work.projects
    .map(
      (p) => `
      <li class="card" data-id="${esc(p.id)}">
        <a class="card-in" href="#work-${esc(p.id)}" role="button" aria-haspopup="dialog">
          <span class="card-idx">${esc(p.id)}</span>
          <h3 class="card-title gl" data-text="${esc(p.title)}">${esc(p.title)}</h3>
          <p class="card-kind">${esc(p.kind)}</p>
          <p class="card-desc">${esc(p.desc)}</p>
          <ul class="chips">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <span class="card-tick" aria-hidden="true"></span>
        </a>
      </li>`,
    )
    .join('');

  const pad = (n: number) => String(n).padStart(2, '0');
  const titleOf = (id: string) => c.work.projects.find((p) => p.id === id)?.title ?? id;
  const slams = c.stack.items
    .map(
      (t, i) => `
      <li class="slam">
        <p class="slam-word gl" data-text="${esc(t.name)}">${esc(t.name)}</p>
        <div class="slam-meta">
          <span class="slam-n">${pad(i + 1)} / ${pad(c.stack.items.length)}</span>
          <span class="slam-note">${esc(t.note)}</span>
          <span class="slam-used"><span class="slam-k">USED IN</span>${t.used
            .map((id) => `<button type="button" class="slam-p gl" data-p="${esc(id)}" data-text="${esc(titleOf(id))}">${esc(titleOf(id))}</button>`)
            .join('<i aria-hidden="true">·</i>')}</span>
        </div>
      </li>`,
    )
    .join('');
  // the end card: every tool at once, pasted up like the edit's final collage
  const collage = c.stack.items.map((t, i) => `<li class="cl cl-${i + 1}"><span class="gl" data-text="${esc(t.name)}">${esc(t.name)}</span></li>`).join('');

  const links = c.outro.links
    .map((l) => {
      const ext = l.href.startsWith('http');
      return `<a class="link gl" data-text="${esc(l.label)}" href="${esc(l.href)}" ${ext ? 'target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`;
    })
    .join('<span class="dot" aria-hidden="true">/</span>');

  app.innerHTML = `
  <div class="fallback" aria-hidden="true">
    <div class="fb fb-0"></div><div class="fb fb-1"></div><div class="fb fb-2"></div><div class="fb fb-3"></div><div class="fb fb-4"></div>
  </div>

  <header class="hud">
    <a class="hud-mark" href="#top" aria-label="Back to top"><b>${esc(c.monogram)}</b><span>${esc(c.hero.first)} ${esc(c.hero.last)}</span></a>
    <div class="hud-r">
      <p class="hud-scene gl" data-text="">01 / 05 — ${esc(c.scenes[0])}</p>
      <button class="sound" type="button" aria-pressed="false" aria-label="Toggle sound">
        <span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="sound-label">${esc(c.ui.soundOff)}</span>
      </button>
    </div>
  </header>
  <div class="hud-bar" aria-hidden="true"><i></i></div>
  <p class="hud-water" aria-hidden="true">${esc(c.handle)}</p>

  <main class="stage">
    <section class="scene s-hero" aria-label="Intro">
      <div class="hero-inner">
        <p class="hero-kicker"></p>
        <h1 class="hero-name" aria-label="${esc(c.hero.first)} ${esc(c.hero.last)}">
          <span class="nm gl" data-text="${esc(c.hero.first)}">${esc(c.hero.first)}</span>
          <span class="nm nm2 gl" data-text="${esc(c.hero.last)}">${esc(c.hero.last)}</span>
        </h1>
        <p class="hero-sub"></p>
      </div>
      <div class="scroll-hint" aria-hidden="true"><span>${esc(c.hero.scrollHint)}</span><i></i></div>
    </section>

    <section class="scene s-about" aria-label="About">
      <p class="about-aside">${esc(c.about.aside)}</p>
      <p class="quote" aria-label="${esc(c.about.quote.join(' '))}"><span class="q-mark">“</span><span class="q-word" aria-hidden="true">${esc(c.about.quote[0])}</span><span class="q-mark">”</span></p>
      <div class="narr narr--br about-narr"></div>
    </section>

    <section class="scene s-work" aria-label="Selected work">
      <div class="narr narr--tl work-narr"></div>
      <ol class="cards">${projects}</ol>
    </section>

    <section class="scene s-stack" aria-label="Stack">
      <div class="narr narr--tl stack-narr"></div>
      <ol class="slams">${slams}</ol>
      <ul class="collage" aria-hidden="true">${collage}</ul>
    </section>

    <section class="scene s-outro" aria-label="Contact">
      <div class="outro-inner">
        <div class="narr outro-narr"></div>
        <h2 class="handle" aria-label="${esc(c.handle)}"><span class="hw" aria-hidden="true">${esc(c.handle)}</span></h2>
        <nav class="links" aria-label="Contact links">${links}</nav>
      </div>
      <p class="lock-cue" aria-hidden="true">${esc(c.outro.typing)}</p>
      <footer class="footer">
        <p>${esc(c.outro.footer)}</p>
        <p class="credit">${esc(c.outro.credit)}</p>
        <p class="credit">${esc(c.outro.credit2)}</p>
      </footer>
    </section>
  </main>
  <div class="track" id="top"></div>
  <div class="boot" aria-hidden="true">
    <div class="boot-in">
      <p class="boot-label">${esc(c.ui.loading)}</p>
      <p class="boot-pct"><span>000</span>%</p>
      <div class="boot-bar"><i></i></div>
    </div>
  </div>
  <audio class="snd" preload="none" loop></audio>
  `;

  const q = <T extends HTMLElement>(s: string) => app.querySelector(s) as T;
  return {
    scenes: Array.from(app.querySelectorAll<HTMLElement>('.scene')),
    heroInner: q('.hero-inner'),
    heroName: q('.hero-name'),
    heroKicker: q('.hero-kicker'),
    heroSub: q('.hero-sub'),
    aboutNarr: q('.about-narr'),
    aboutQuote: q('.quote'),
    workNarr: q('.work-narr'),
    cards: Array.from(app.querySelectorAll<HTMLElement>('.card')),
    stackNarr: q('.stack-narr'),
    slams: Array.from(app.querySelectorAll<HTMLElement>('.slam')),
    collage: q('.collage'),
    outroNarr: q('.outro-narr'),
    handle: q('.handle'),
    outroFade: [q('.outro-inner'), q('.footer')],
    hudScene: q('.hud-scene'),
    sound: q('.sound'),
    soundLabel: q('.sound-label'),
    audio: q('.snd'),
    quoteWord: q('.q-word'),
    bootPct: q('.boot-pct span'),
    bootBar: q('.boot-bar i'),
    hudBar: q('.hud-bar i'),
    track: q('.track'),
    boot: q('.boot'),
  };
}
