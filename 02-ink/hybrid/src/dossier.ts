// Project dossier: a click on a work card bursts red-black ink out of it (scene shader: uOpen /
// uOpenC), the page holds still, and the project's dossier types in on the ink: the title grows
// Type Garden roses, the text types like the subtitles, the screenshots glitch in inside a rose
// frame. Close (the button, Esc, the browser's back, a click on the bare ink) pulls the ink back
// into the card and the page scrolls again.
import gsap from 'gsap';
import type { Project } from './content';
import type { Garden, GardenOpts } from './garden';
import { Typed } from './type';

type MakeGarden = (host: HTMLElement, o: Partial<GardenOpts> & Pick<GardenOpts, 'family' | 'weight' | 'glows' | 'palette'>) => Garden | null;

export interface DossierDeps {
  projects: Project[];
  reduced: boolean;
  /** the shader draws the ink; without WebGL a CSS backdrop stands in */
  gl: boolean;
  makeGarden: MakeGarden;
  palette: GardenOpts['palette'];
  now: () => number;
  pause: () => void;
  resume: () => void;
  glitch: (amount: number) => void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export class Dossier {
  readonly el: HTMLElement;
  /** ink coverage for the shader, 0..1 */
  open = 0;
  /** the opened card's centre, screen uv (y up) */
  origin: [number, number] = [0.5, 0.5];
  phase: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
  index = -1;
  private d: DossierDeps;
  private q: Record<string, HTMLElement> = {};
  private title: Garden | null;
  private frame: Garden | null;
  private typed: Typed | null = null;
  private card: HTMLElement | null = null;
  private tween?: gsap.core.Tween;
  private revealT = 0;
  private pushed = false;

  constructor(app: HTMLElement, deps: DossierDeps) {
    this.d = deps;
    const el = document.createElement('div');
    el.className = `dossier${deps.gl ? '' : ' dossier--css'}`;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'd-title');
    el.hidden = true;
    el.innerHTML = `
      <div class="d-scroll" data-lenis-prevent>
        <div class="d-in">
          <header class="d-head">
            <p class="d-hud"><span class="d-idx"></span> — DOSSIER</p>
            <h2 class="d-title" id="d-title"><span class="d-tw"></span></h2>
            <p class="d-kind"></p>
          </header>
          <div class="d-shots">
            <figure class="shot shot--a"><img alt="" decoding="async" /><span class="shot-scan" aria-hidden="true"></span></figure>
            <figure class="shot shot--b"><img alt="" decoding="async" /><span class="shot-scan" aria-hidden="true"></span></figure>
          </div>
          <div class="d-body">
            <div class="d-desc"></div>
            <dl class="d-meta">
              <div><dt>STACK</dt><dd class="d-stack"></dd></div>
              <div><dt>YEAR</dt><dd class="d-year"></dd></div>
              <div><dt>STATUS</dt><dd class="d-status"></dd></div>
              <div><dt>ROLE</dt><dd class="d-role"></dd></div>
            </dl>
            <nav class="d-links" aria-label="Project links"></nav>
          </div>
        </div>
      </div>
      <button class="d-close gl" type="button" data-text="✕ CLOSE">✕ CLOSE</button>`;
    app.appendChild(el);
    this.el = el;
    for (const k of ['scroll', 'in', 'idx', 'title', 'tw', 'kind', 'desc', 'stack', 'year', 'status', 'role', 'links', 'close']) {
      this.q[k] = el.querySelector(`.d-${k}`)!;
    }
    this.q.shotA = el.querySelector('.shot--a')!;
    this.q.shotB = el.querySelector('.shot--b')!;

    this.title = deps.makeGarden(this.q.title, {
      textEl: this.q.tw,
      family: "'Unbounded', 'Arial Black', sans-serif",
      weight: 200,
      glows: [
        { color: 'rgba(0,0,0,0.85)', blur: 0.3 },
        { color: 'rgba(255,90,67,0.35)', blur: 0.6 },
        { color: 'rgba(255,255,255,0.5)', blur: 0.12 },
      ],
      palette: deps.palette,
      density: 0.75,
      pace: 95,
      caretStays: false,
    });
    // the main screenshot gets the cards' rose frame (no text: a frame-only garden)
    const none = document.createElement('span');
    this.q.shotA.appendChild(none);
    this.frame = deps.makeGarden(this.q.shotA, {
      textEl: none,
      family: "'Unbounded', sans-serif",
      weight: 300,
      glows: [],
      palette: deps.palette,
      density: 0.6,
      frame: window.innerWidth < 700 ? 1.6 : 2.4,
    });

    this.q.close.addEventListener('click', () => this.requestClose());
    // a click on the bare ink (not on the dossier's content) closes too
    this.q.scroll.addEventListener('click', (e) => {
      if (e.target === this.q.scroll || e.target === this.q.in) this.requestClose();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.requestClose();
      } else if (e.key === 'Tab') this.trap(e);
      // keys inside the dialog are its own (the outro's any-key skip listens on window)
      e.stopPropagation();
    });
    window.addEventListener('popstate', () => {
      if (this.pushed) {
        this.pushed = false;
        this.close();
      }
    });
  }

  /** Open project i, the ink bursting out of `card` (a work card, or a project name in the stack). */
  show(i: number, card: HTMLElement): void {
    if (this.phase !== 'closed') return;
    const p = this.d.projects[i];
    if (!p) return;
    this.index = i;
    this.card = card;
    this.fill(p);
    const r = card.getBoundingClientRect();
    this.origin = [(r.left + r.width / 2) / window.innerWidth, 1 - (r.top + r.height / 2) / window.innerHeight];
    this.phase = 'opening';
    this.d.pause();
    document.documentElement.classList.add('d-open');
    card.classList.add('hit');
    window.setTimeout(() => card.classList.remove('hit'), 420);
    this.d.glitch(0.45);
    this.el.hidden = false;
    this.el.classList.remove('show');
    this.layout();
    history.pushState({ dossier: p.id }, '');
    this.pushed = true;
    const fast = this.d.reduced;
    this.tween?.kill();
    this.tween = gsap.to(this, {
      open: 1,
      duration: fast ? 0.25 : 1.05,
      ease: fast ? 'none' : 'power1.in',
      onComplete: () => {
        this.phase = 'open';
      },
    });
    // the content arrives while the last of the ink spreads
    this.revealT = window.setTimeout(() => this.reveal(), fast ? 200 : 720);
    this.q.close.focus({ preventScroll: true });
  }

  /** Close via the UI: through history when the dossier pushed an entry (keeps back/forward sane). */
  requestClose(): void {
    if (this.phase === 'closed' || this.phase === 'closing') return;
    if (this.pushed && history.state?.dossier) history.back();
    else this.close();
  }

  private close(): void {
    if (this.phase === 'closed' || this.phase === 'closing') return;
    this.phase = 'closing';
    window.clearTimeout(this.revealT);
    const now = this.d.now();
    this.el.classList.remove('show');
    this.title?.wither(now);
    this.frame?.wither(now);
    this.typed?.reset();
    this.d.glitch(0.3);
    const fast = this.d.reduced;
    this.tween?.kill();
    this.tween = gsap.to(this, {
      open: 0,
      duration: fast ? 0.2 : 0.85,
      delay: fast ? 0 : 0.18,
      ease: fast ? 'none' : 'power2.inOut',
      onStart: () => document.documentElement.classList.remove('d-open'),
      onComplete: () => {
        this.phase = 'closed';
        this.el.hidden = true;
        this.d.resume();
        // back to what opened it: a work card's link, or a project name in the stack
        (this.card?.querySelector<HTMLElement>('.card-in') ?? this.card)?.focus({ preventScroll: true });
      },
    });
  }

  private reveal(): void {
    const now = this.d.now();
    this.el.classList.add('show');
    this.title?.layout();
    this.title?.start(now, 120);
    this.frame?.layout();
    this.frame?.start(now, 420);
    this.typed?.play();
  }

  private fill(p: Project): void {
    const d = p.dossier;
    this.q.idx.textContent = `${p.id} / ${String(this.d.projects.length).padStart(2, '0')}`;
    this.q.tw.textContent = p.title;
    this.q.title.setAttribute('aria-label', p.title);
    this.q.kind.textContent = p.kind;
    this.typed = new Typed(this.q.desc, d.about.length ? d.about : [p.desc], { speed: 7, delay: 380, lineGap: 200 });
    this.q.stack.innerHTML = (d.stack.length ? d.stack : p.stack).map((s) => `<span>${esc(s)}</span>`).join('');
    this.q.year.textContent = d.year || '—';
    this.q.status.textContent = d.status || '—';
    this.q.role.textContent = d.role || '—';
    this.q.links.innerHTML = d.links
      .map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener" class="gl" data-text="${esc(l.label)} ↗">${esc(l.label)} ↗</a>`)
      .join('');
    const shots = [this.q.shotA, this.q.shotB];
    shots.forEach((f, k) => {
      const s = d.shots[k];
      const img = f.querySelector('img')!;
      f.hidden = !s;
      if (s) {
        img.src = s.src;
        img.alt = s.alt;
      } else img.removeAttribute('src');
    });
    this.el.classList.toggle('no-shots', !d.shots.length);
  }

  /** Fetch + decode every screenshot ahead of time (called once the cards are on screen), so an
   * open never waits on the network or stalls a frame decoding a 1200 px JPEG. */
  preload(): void {
    if (this.preloaded) return;
    this.preloaded = true;
    for (const p of this.d.projects) {
      for (const s of p.dossier.shots) {
        const img = new Image();
        img.src = s.src;
        img.decode().catch(() => {});
        this.keep.push(img);
      }
    }
  }
  private preloaded = false;
  private keep: HTMLImageElement[] = [];

  /** Re-measure the title / frame (resize while open). */
  layout(): void {
    if (this.phase === 'closed') return;
    this.title?.layout();
    this.frame?.layout();
  }

  /** Per frame, from the main loop. */
  tick(now: number): void {
    if (this.phase === 'closed') return;
    if (!this.d.gl) this.el.style.setProperty('--open', this.open.toFixed(3));
    this.title?.frame(now, true);
    this.frame?.frame(now, true);
  }

  get isOpen(): boolean {
    return this.phase !== 'closed';
  }

  private trap(e: KeyboardEvent): void {
    const f = Array.from(this.el.querySelectorAll<HTMLElement>('a[href], button')).filter((x) => !x.closest('[hidden]'));
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
