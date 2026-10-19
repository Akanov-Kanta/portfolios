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
  techs: HTMLElement[];
  outroNarr: HTMLElement;
  handle: HTMLElement;
  hudScene: HTMLElement;
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
        <a class="card-in" href="${esc(p.href)}" ${p.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>
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

  const techs = c.stack.items
    .map(
      (t, i) => `
      <li class="tech ${i % 2 ? 'tech--r' : ''}">
        <span class="tech-n">${String(i + 1).padStart(2, '0')}</span>
        <span class="tech-word gl" data-text="${esc(t.name)}">${esc(t.name)}</span>
        <span class="tech-note">${esc(t.note)}</span>
      </li>`,
    )
    .join('');

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
    <p class="hud-scene gl" data-text="">01 / 05 — ${esc(c.scenes[0])}</p>
  </header>
  <div class="hud-bar" aria-hidden="true"><i></i></div>
  <p class="hud-water" aria-hidden="true">${esc(c.handle)}</p>

  <main class="stage">
    <section class="scene s-hero" aria-label="Intro">
      <div class="hero-inner">
        <p class="hero-kicker"></p>
        <h1 class="hero-name">
          <span class="nm gl" data-text="${esc(c.hero.first)}">${esc(c.hero.first)}</span>
          <span class="nm nm2 gl" data-text="${esc(c.hero.last)}">${esc(c.hero.last)}</span>
        </h1>
        <p class="hero-sub"></p>
      </div>
      <div class="scroll-hint" aria-hidden="true"><span>${esc(c.hero.scrollHint)}</span><i></i></div>
    </section>

    <section class="scene s-about" aria-label="About">
      <p class="about-aside">${esc(c.about.aside)}</p>
      <p class="quote" aria-label="${esc(c.about.quote)}"><span class="q-mark">“</span><span class="q-word">${esc(c.about.quote)}</span><span class="q-mark">”</span></p>
      <div class="narr narr--br about-narr"></div>
    </section>

    <section class="scene s-work" aria-label="Selected work">
      <div class="narr narr--tl work-narr"></div>
      <ol class="cards">${projects}</ol>
    </section>

    <section class="scene s-stack" aria-label="Stack">
      <div class="narr narr--tl stack-narr"></div>
      <ul class="techs">${techs}</ul>
    </section>

    <section class="scene s-outro" aria-label="Contact">
      <div class="outro-inner">
        <div class="narr outro-narr"></div>
        <h2 class="handle"></h2>
        <nav class="links" aria-label="Contact links">${links}</nav>
      </div>
      <p class="footer">${esc(c.outro.footer)}</p>
    </section>
  </main>
  <div class="track" id="top"></div>
  <div class="boot" aria-hidden="true"></div>
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
    techs: Array.from(app.querySelectorAll<HTMLElement>('.tech')),
    outroNarr: q('.outro-narr'),
    handle: q('.handle'),
    hudScene: q('.hud-scene'),
    hudBar: q('.hud-bar i'),
    track: q('.track'),
    boot: q('.boot'),
  };
}
