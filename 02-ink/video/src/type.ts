// Typed, flickering subtitle text in the style of the edit, plus a glyph scramble.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Build markup for a subtitle line: every char is a span, words never break, *x* is highlighted. */
export function charMarkup(text: string): string {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let html = '';
  for (const part of parts) {
    const hot = part.startsWith('*') && part.endsWith('*');
    const body = hot ? part.slice(1, -1) : part;
    const words = body.split(/(\s+)/);
    for (const w of words) {
      if (!w) continue;
      if (/^\s+$/.test(w)) {
        html += '<span class="ch sp"> </span>';
        continue;
      }
      html += `<span class="w${hot ? ' hot' : ''}">${[...w].map((c) => `<span class="ch">${esc(c)}</span>`).join('')}</span>`;
    }
  }
  return html;
}

type Typer = { cancel: () => void };

// One blinking cursor for the whole page: it follows whatever is being typed.
let caretEl: HTMLElement | null = null;
const sharedCaret = () => (caretEl ??= Object.assign(document.createElement('span'), { className: 'caret' }));
const running = new WeakMap<HTMLElement, Typer>();

/** Reveal all .ch inside el one by one with a flicker. */
export function typeIn(el: HTMLElement, opts: { cps?: number; delay?: number; instant?: boolean } = {}) {
  running.get(el)?.cancel();
  const chars = Array.from(el.querySelectorAll<HTMLElement>('.ch'));
  el.classList.add('typing');
  if (opts.instant) {
    chars.forEach((c) => c.classList.add('on'));
    el.classList.remove('typing');
    el.classList.add('typed');
    return;
  }
  const cps = opts.cps ?? 38;
  let i = 0;
  let timer = 0;
  let cancelled = false;
  const caret = sharedCaret();
  const tick = () => {
    if (cancelled) return;
    // type 1-2 chars per tick, with an occasional hesitation like a real typist
    const burst = Math.random() < 0.25 ? 2 : 1;
    for (let k = 0; k < burst && i < chars.length; k++, i++) {
      const c = chars[i];
      c.classList.add('on');
      c.after(caret);
    }
    if (i < chars.length) {
      const hesitate = chars[i - 1]?.classList.contains('sp') && Math.random() < 0.18 ? 120 : 0;
      timer = window.setTimeout(tick, 1000 / cps + hesitate + Math.random() * 18);
    } else {
      el.classList.remove('typing');
      el.classList.add('typed');
    }
  };
  timer = window.setTimeout(tick, opts.delay ?? 0);
  running.set(el, {
    cancel: () => {
      cancelled = true;
      clearTimeout(timer);
      if (el.contains(caret)) caret.remove();
    },
  });
}

export function typeOut(el: HTMLElement) {
  running.get(el)?.cancel();
  if (caretEl && el.contains(caretEl)) caretEl.remove();
  el.classList.remove('typing', 'typed');
  el.querySelectorAll('.ch.on').forEach((c) => c.classList.remove('on'));
}

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>[]{}?!░▒▓';
const scrambling = new WeakMap<HTMLElement, number>();

/** Scramble el's text into `final`, resolving left to right. */
export function scramble(el: HTMLElement, final: string, ms = 650) {
  cancelAnimationFrame(scrambling.get(el) ?? 0);
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    const fixed = Math.floor(p * final.length);
    let s = '';
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      s += i < fixed || ch === ' ' || ch === '.' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = s;
    if (p < 1) scrambling.set(el, requestAnimationFrame(step));
  };
  scrambling.set(el, requestAnimationFrame(step));
}
