// Stack scene: the tools slam in one at a time, full screen, like the edit's hard cuts (a red flash
// frame, glitch slices, a shake), and end on a collage of all of them. Scroll picks which word is
// due; with the soundtrack playing the cut waits for the next 8th note (<= 0.25 s at 120 BPM), so
// the hits land on the beat. Each word lists the projects that use it; those open their dossier.

export interface SlamDeps {
  reduced: boolean;
  /** seconds to the next 8th note of the playing soundtrack, or null (no music: cut now) */
  untilBeat: () => number | null;
  /** a cut landed on screen: k = word index, or `collage` */
  hit: (k: number, collage: boolean) => void;
}

// P.stack at which word k is due; the collage after the last word
const AT = (k: number) => 0.04 + k * 0.125;
const COLLAGE = 0.8;

export class Slams {
  private items: HTMLElement[];
  private collage: HTMLElement;
  private d: SlamDeps;
  /** what is on screen: -1 nothing, 0..n-1 a word, n the collage */
  shown = -1;
  private due = -1;
  private timer = 0;
  /** tests: when the last cut landed and how long it waited for the beat */
  last = { k: -1, at: 0, waited: 0 };

  constructor(items: HTMLElement[], collage: HTMLElement, deps: SlamDeps) {
    this.items = items;
    this.collage = collage;
    this.d = deps;
  }

  /** Fit each word to the screen (long words get smaller type). */
  layout(): void {
    const mobile = window.innerWidth < 700;
    const maxW = window.innerWidth * (mobile ? 0.9 : 0.84);
    const maxH = window.innerHeight * (mobile ? 0.13 : 0.3);
    for (const el of this.items) {
      const w = el.querySelector<HTMLElement>('.slam-word')!;
      w.style.fontSize = '100px';
      const width = w.scrollWidth || 1;
      w.style.fontSize = `${Math.floor(Math.min((maxW / width) * 100, maxH))}px`;
    }
  }

  /** p = P.stack; `live` false (scene not on screen): state follows silently, no cut. */
  update(p: number, live: boolean): void {
    const n = this.items.length;
    let due = -1;
    if (p >= COLLAGE) due = n;
    else for (let k = 0; k < n; k++) if (p >= AT(k)) due = k;
    if (due === this.due) return;
    this.due = due;
    window.clearTimeout(this.timer);
    if (!live || this.d.reduced) {
      this.show(due, live && !this.d.reduced, 0);
      return;
    }
    const wait = this.d.untilBeat();
    if (wait == null || wait < 0.012) this.show(due, true, 0);
    else {
      const t0 = performance.now();
      // a fast scroll replaces the pending word: whatever is due when the beat comes is shown
      this.timer = window.setTimeout(() => this.show(this.due, true, performance.now() - t0), wait * 1000);
    }
  }

  private show(k: number, cut: boolean, waited: number): void {
    if (k === this.shown) return;
    const n = this.items.length;
    this.shown = k;
    this.items.forEach((el, i) => {
      el.classList.toggle('on', i === k);
      if (i === k && cut) this.restart(el);
    });
    this.collage.classList.toggle('on', k === n);
    if (k === n && cut) this.restart(this.collage);
    if (cut && k >= 0) {
      this.last = { k, at: performance.now(), waited: Math.round(waited) };
      this.d.hit(k, k === n);
    }
  }

  private restart(el: HTMLElement): void {
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
    // the glitch slices run while .hit is on: one burst per cut
    window.setTimeout(() => el.classList.remove('hit'), 460);
  }
}
