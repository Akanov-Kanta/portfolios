// Soundtrack: "Binary Data" (HDN) from B's edit, rebuilt into a seamless bar-aligned loop.
// Measured offline (scratch analysis of B's audio): the track is 120 BPM, the drop lands at 4.6633 s and
// its 2-bar phrase repeats every 4.000 s. The intro plays once, then phrase A + phrase B loop forever.
// B's audio runs out 0.19 s before its phrase ends, so B is spliced back into A's tail at an offset
// where both phrases are quiet (−23 dB). Web Audio loops sample-accurately; <audio loop> leaves a gap.

const DROP = 4.6633; // drop downbeat
const PHRASE = 4.0; // 2 bars at 120 BPM
const SPLICE = 3.2474; // offset into the phrase where A and B are both quiet
const XF_SPLICE = 0.04;
const XF_WRAP = 0.06;
const LEVEL = 0.8;

type Ctor = typeof AudioContext;

export const LOOP = { drop: DROP, phrase: PHRASE, splice: SPLICE };

export function buildLoop(ctx: BaseAudioContext, src: AudioBuffer): AudioBuffer {
  const sr = src.sampleRate;
  const s = Math.round(DROP * sr);
  const p = Math.round(PHRASE * sr);
  const sp = Math.round(SPLICE * sr);
  const xs = Math.round(XF_SPLICE * sr);
  const xw = Math.round(XF_WRAP * sr);
  const out = ctx.createBuffer(src.numberOfChannels, s + 2 * p, sr);
  const fadeIn = (t: number) => Math.sin(t * Math.PI * 0.5);
  const fadeOut = (t: number) => Math.cos(t * Math.PI * 0.5);
  for (let ch = 0; ch < src.numberOfChannels; ch++) {
    const a = src.getChannelData(ch);
    const o = out.getChannelData(ch);
    // intro + phrase A + phrase B up to the splice, then A's tail completes phrase B
    o.set(a.subarray(0, s + p + sp));
    o.set(a.subarray(s + sp, s + p), s + p + sp);
    // splice: B fades into A's tail (equal power, both sides are quiet here)
    for (let i = 0; i < xs; i++) {
      const t = (i + 0.5) / xs;
      o[s + p + sp + i] = a[s + p + sp + i] * fadeOut(t) + a[s + sp + i] * fadeIn(t);
    }
    // wrap: the loop ends on A's tail, whose natural continuation is B's downbeat; start the loop on it
    // and fade into A's downbeat, so the jump from the last sample back to loopStart has no seam
    for (let i = 0; i < xw; i++) {
      const t = (i + 0.5) / xw;
      o[s + i] = a[s + p + i] * fadeOut(t) + a[s + i] * fadeIn(t);
    }
  }
  return out;
}

export class Soundtrack {
  private ctx?: AudioContext;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode;
  private ready?: Promise<boolean>;
  private startedAt = 0;
  private loopStart = 0;
  private loopEnd = 0;
  private wanted = false;
  private useFallback = false;

  constructor(
    private url: string,
    private fallback: HTMLAudioElement,
  ) {
    document.addEventListener('visibilitychange', () => {
      if (!this.wanted) return;
      if (document.hidden) this.fade(0, 0.3, true);
      else void this.resume();
    });
  }

  /** Call from the click handler: the context has to be created/resumed inside the user gesture. */
  async play(): Promise<boolean> {
    this.wanted = true;
    if (this.useFallback) return this.playFallback();
    const AC: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!AC) return this.playFallback();
    this.ctx ??= new AC();
    const resumed = this.ctx.resume();
    this.ready ??= this.load();
    if (!(await this.ready)) return this.playFallback();
    await resumed;
    if (!this.wanted) return false;
    this.fade(LEVEL, 1.2);
    return true;
  }

  stop(): void {
    this.wanted = false;
    if (this.useFallback) {
      const a = this.fallback;
      const from = a.volume;
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 400);
        a.volume = from * (1 - k);
        if (k < 1 && !this.wanted) requestAnimationFrame(step);
        else if (!this.wanted) a.pause();
      };
      requestAnimationFrame(step);
      return;
    }
    this.fade(0, 0.4, true);
  }

  /**
   * Seconds to the next grid line of `step` seconds on the track's beat grid (the drop's downbeat,
   * 120 BPM: 0.5 = a beat, 0.25 = an 8th), or null when the music is not playing. The 8 s loop is a
   * whole number of beats, so the grid runs on unbroken across the wrap.
   */
  untilGrid(step: number): number | null {
    if (!this.wanted) return null;
    const s = this.state();
    if (s.paused || s.volume < 0.05) return null;
    const ph = (((s.time - DROP) % step) + step) % step;
    return step - ph;
  }

  /** For scripts/shots.mjs: playing state, position in the source track, gain. */
  state(): { paused: boolean; time: number; volume: number } {
    if (this.useFallback) return { paused: this.fallback.paused, time: this.fallback.currentTime, volume: this.fallback.volume };
    const ctx = this.ctx;
    if (!ctx || !this.source || !this.gain) return { paused: true, time: 0, volume: 0 };
    let t = ctx.currentTime - this.startedAt;
    if (t > this.loopEnd) t = this.loopStart + ((t - this.loopStart) % (this.loopEnd - this.loopStart));
    return { paused: ctx.state !== 'running', time: t, volume: this.gain.gain.value };
  }

  private async load(): Promise<boolean> {
    const ctx = this.ctx!;
    try {
      const res = await fetch(this.url);
      const raw = await ctx.decodeAudioData(await res.arrayBuffer());
      const buf = buildLoop(ctx, raw);
      this.gain = ctx.createGain();
      this.gain.gain.value = 0;
      this.gain.connect(ctx.destination);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      this.loopStart = Math.round(DROP * buf.sampleRate) / buf.sampleRate;
      this.loopEnd = buf.duration;
      src.loopStart = this.loopStart;
      src.loopEnd = this.loopEnd;
      src.connect(this.gain);
      this.startedAt = ctx.currentTime + 0.02;
      src.start(this.startedAt);
      this.source = src;
      return true;
    } catch (e) {
      console.warn('soundtrack: falling back to <audio loop>', e);
      this.useFallback = true;
      return false;
    }
  }

  private async resume(): Promise<void> {
    if (this.useFallback || !this.ctx) return;
    await this.ctx.resume();
    if (this.wanted) this.fade(LEVEL, 0.6);
  }

  /** Ramp the gain; when silencing, suspend the context so the loop keeps its place and costs nothing. */
  private fade(to: number, secs: number, suspend = false): void {
    const ctx = this.ctx;
    const g = this.gain?.gain;
    if (!ctx || !g) return;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + secs);
    if (suspend) {
      window.setTimeout(() => {
        if (!this.wanted || document.hidden) void ctx.suspend();
      }, secs * 1000 + 40);
    }
  }

  private async playFallback(): Promise<boolean> {
    this.useFallback = true;
    const a = this.fallback;
    if (!a.src) a.src = this.url;
    a.volume = 0;
    try {
      await a.play();
    } catch {
      return false;
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 1200);
      a.volume = LEVEL * (1 - (1 - k) * (1 - k));
      if (k < 1 && this.wanted) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return true;
  }
}
