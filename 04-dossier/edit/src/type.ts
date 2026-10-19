// The edit's tiny glowing ALL-CAPS caption that types itself on: a vanilla port of the dossier site's
// TypeCaption (../src/components/fx/TypeCaption.tsx, calibrated values in ../src/styles/tokens.css).
//
// One CSS variable `--p` (characters typed, a float) drives every character of every layer: a char cuts
// in at `dim` once --p passes its index (no fade, no cursor), holds dim for `lag` seconds' worth of
// chars, then brightens to full over `brighten` seconds' worth of chars. Three blurred clones under the
// sharp core are the "deep glow"; their chars only light up as the core char brightens, so the dim
// leading edge has no glow, as in the edit. GSAP tweens a single number, no per-char tweens.
import gsap from 'gsap';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export type CaptionOpts = {
  /** characters per second (the edit runs ~35-45) */
  cps?: number;
  /** opacity a char appears at before it brightens */
  dim?: number;
  /** seconds a char takes to reach full */
  brighten?: number;
  /** seconds a char stays dim before brightening */
  lag?: number;
};

const DEF = { cps: 40, dim: 0.35, brighten: 0.2, lag: 0.06 };

/** Markup for a caption: "LABEL:" + lines, every char a span with its running index. */
export function captionMarkup(label: string | null, lines: readonly string[], cls = '', o: CaptionOpts = {}) {
  const { cps, dim, brighten, lag } = { ...DEF, ...o };
  const all = label ? [`${label}:`, ...lines] : [...lines];
  let i = 0;
  const body = all
    .map((line) => {
      // words are wrapped so a phone can break between them but never inside one
      const words = line.split(/( )/);
      const html = words
        .map((w) => {
          if (w === ' ') return `<span class="tc-ch" style="--i:${i++}"> </span>`;
          return `<span class="tc-w">${[...w].map((c) => `<span class="tc-ch" style="--i:${i++}">${esc(c)}</span>`).join('')}</span>`;
        })
        .join('');
      return `<span class="tc-line">${html}</span>`;
    })
    .join('');
  const count = i;
  const lagChars = lag * cps;
  const ramp = Math.max(0.5, brighten * cps);
  const vars = `--tc-dim:${dim};--tc-lag:${lagChars.toFixed(2)};--tc-ramp:${ramp.toFixed(2)}`;
  return `<div class="tc ${cls}" style="${vars}" data-count="${count}" data-total="${(count + lagChars + ramp).toFixed(2)}" data-cps="${cps}">
    <span class="sr-only">${esc(all.join(' '))}</span>
    <span class="tc-layer tc-fx tc-g3" aria-hidden="true">${body}</span>
    <span class="tc-layer tc-fx tc-g2" aria-hidden="true">${body}</span>
    <span class="tc-layer tc-fx tc-g1" aria-hidden="true">${body}</span>
    <span class="tc-layer tc-core" aria-hidden="true">${body}</span>
  </div>`;
}

/** Drives one caption's typing. */
export class Caption {
  readonly el: HTMLElement;
  private total: number;
  private cps: number;
  private proxy = { p: 0 };
  private tween: gsap.core.Tween | null = null;
  private hideTween: gsap.core.Tween | null = null;
  /** true once play() was called and not reset since */
  on = false;

  constructor(el: HTMLElement) {
    this.el = el;
    this.total = Number(el.dataset.total);
    this.cps = Number(el.dataset.cps);
    this.apply();
  }

  private apply() {
    this.el.style.setProperty('--p', this.proxy.p.toFixed(2));
  }

  /** Start typing from where it is (or from scratch after reset/hide). */
  play(delay = 0, instant = false) {
    this.on = true;
    this.hideTween?.kill();
    this.el.style.opacity = '1';
    this.el.classList.add('is-on');
    this.tween?.kill();
    if (instant) {
      this.proxy.p = this.total;
      this.apply();
      return;
    }
    const left = this.total - this.proxy.p;
    this.tween = gsap.to(this.proxy, { p: this.total, duration: left / this.cps, delay, ease: 'none', onUpdate: () => this.apply() });
  }

  /** Back to nothing typed. */
  reset() {
    this.on = false;
    this.tween?.kill();
    this.hideTween?.kill();
    this.proxy.p = 0;
    this.apply();
    this.el.classList.remove('is-on');
  }

  /** The edit's only exit: a 200 ms cross-fade, then reset. */
  hide(instant = false) {
    if (!this.on) return;
    this.on = false;
    this.tween?.kill();
    this.el.classList.remove('is-on');
    if (instant) {
      this.el.style.opacity = '0';
      this.proxy.p = 0;
      this.apply();
      return;
    }
    this.hideTween = gsap.to(this.el, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.out',
      onComplete: () => {
        this.proxy.p = 0;
        this.apply();
      },
    });
  }
}
