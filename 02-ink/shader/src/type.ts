// Letter-by-letter subtitle typing with a flicker on each character.
// The animation is pure CSS (per-char delay); JS only starts/resets it.

export class Typed {
  readonly el: HTMLElement;
  private running = false;
  total = 0;

  constructor(el: HTMLElement, lines: string[], opts: { speed?: number; delay?: number; lineGap?: number } = {}) {
    this.el = el;
    const speed = opts.speed ?? 26;
    const lineGap = opts.lineGap ?? 140;
    let t = opts.delay ?? 0;
    el.classList.add('typed');
    el.setAttribute('aria-label', lines.join(' '));
    el.textContent = '';
    lines.forEach((line, li) => {
      const row = document.createElement('span');
      row.className = 'typed-line';
      row.setAttribute('aria-hidden', 'true');
      for (const ch of line) {
        const s = document.createElement('span');
        s.className = ch === ' ' ? 'ch sp' : 'ch';
        s.textContent = ch;
        s.style.setProperty('--d', `${Math.round(t)}ms`);
        row.appendChild(s);
        t += ch === ' ' ? speed * 0.6 : speed * (0.7 + Math.random() * 0.6);
      }
      el.appendChild(row);
      if (li < lines.length - 1) t += lineGap;
    });
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    caret.style.setProperty('--d', `${Math.round(t)}ms`);
    el.lastElementChild?.appendChild(caret);
    this.total = t;
  }

  play(): void {
    if (this.running) return;
    this.running = true;
    this.el.classList.remove('run');
    void this.el.offsetWidth;
    this.el.classList.add('run');
  }

  reset(): void {
    this.running = false;
    this.el.classList.remove('run');
  }
}
