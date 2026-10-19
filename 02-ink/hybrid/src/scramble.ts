// Glyph scramble from variant B: the text resolves left to right into `final`.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>[]{}?!░▒▓';
const scrambling = new WeakMap<HTMLElement, number>();

export function scramble(el: HTMLElement, final: string, ms = 650): void {
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
