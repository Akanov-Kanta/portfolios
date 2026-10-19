import type { SfxName, SfxOpts } from "../sfx-bus";

/**
 * One-shot UI sounds, synthesised (no assets). Everything is quiet (peaks 0.03–0.06 before the
 * 0.9 master) and every envelope uses setTargetAtTime, so there are no clicks.
 * Rate limits: tick 30 ms, type 60 ms, blip 400 ms (DUR.sfxCooldown).
 */
const LIMIT: Partial<Record<SfxName, number>> = { tick: 30, type: 60, blip: 400, whoosh: 250, morph: 300, press: 40 };
const last: Partial<Record<SfxName, number>> = {};

let noiseBuf: AudioBuffer | null = null;
function noise(ctx: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  const len = ctx.sampleRate; // 1 s of white noise, shared
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** gain envelope: attack to `peak` then decay, both exponential (setTargetAtTime) */
function env(ctx: AudioContext, t: number, peak: number, attack: number, decay: number, dest: AudioNode): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.setTargetAtTime(peak, t, attack / 3);
  g.gain.setTargetAtTime(0, t + attack, decay / 4);
  g.connect(dest);
  return g;
}

function out(ctx: AudioContext, dest: AudioNode, pan = 0): AudioNode {
  if (!pan) return dest;
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(dest);
  return p;
}

function tone(ctx: AudioContext, dest: AudioNode, t: number, type: OscillatorType, f0: number, f1: number, peak: number, attack: number, decay: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + attack + decay * 0.6);
  o.connect(env(ctx, t, peak, attack, decay, dest));
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

function burst(ctx: AudioContext, dest: AudioNode, t: number, type: BiquadFilterType, freq: number, q: number, peak: number, attack: number, decay: number) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  f.Q.value = q;
  src.connect(f).connect(env(ctx, t, peak, attack, decay, dest));
  src.start(t, Math.random() * 0.8);
  src.stop(t + attack + decay + 0.05);
  return f;
}

const jitter = (k: number) => 1 + (Math.random() * 2 - 1) * k;

/** Play a named one-shot into `dest` (already gated: only called while sound is on). */
export function playSfx(ctx: AudioContext, dest: AudioNode, name: SfxName, opts: SfxOpts = {}) {
  const now = performance.now();
  const lim = LIMIT[name];
  if (lim && now - (last[name] ?? -1e9) < lim) return;
  last[name] = now;
  const t = ctx.currentTime + 0.005;
  const k = opts.gain ?? 1;
  const o = out(ctx, dest, opts.pan);
  switch (name) {
    case "tick": {
      // 12 ms glassy click, ±3 % pitch
      tone(ctx, o, t, "triangle", 2400 * jitter(0.03), 2400, 0.03 * k, 0.002, 0.012);
      break;
    }
    case "press": {
      tone(ctx, o, t, "sine", 520, 300, 0.05 * k, 0.003, 0.06);
      burst(ctx, o, t, "highpass", 3000, 0.7, 0.012 * k, 0.001, 0.015);
      break;
    }
    case "blip": {
      const v = [
        [880, 880],
        [660, 990],
        [990, 740],
      ][Math.floor(Math.random() * 3)]!;
      tone(ctx, o, t, "sine", v[0]!, v[1]!, 0.05 * k, 0.008, 0.12);
      break;
    }
    case "type": {
      burst(ctx, o, t, "bandpass", 3600 * jitter(0.08), 6, 0.03 * k, 0.001, 0.01);
      break;
    }
    case "whoosh": {
      // band-passed noise swept up then down, panned toward the travel direction
      const f = burst(ctx, out(ctx, o, (opts.dir ?? 0) * 0.3), t, "bandpass", 380, 1.4, 0.05 * k, 0.22, 0.5);
      f.frequency.setTargetAtTime(2200, t, 0.12);
      f.frequency.setTargetAtTime(520, t + 0.3, 0.18);
      break;
    }
    case "morph": {
      // ~1.1 s: a sweep in the direction of travel, then a soft chime as the logo reassembles
      const up = (opts.dir ?? 1) >= 0;
      tone(ctx, o, t, "sine", up ? 220 : 660, up ? 660 : 220, 0.035 * k, 0.25, 0.75);
      const f = burst(ctx, o, t, "bandpass", up ? 500 : 2000, 2, 0.02 * k, 0.3, 0.6);
      f.frequency.exponentialRampToValueAtTime(up ? 2000 : 500, t + 0.8);
      tone(ctx, o, t + 0.85, "sine", 1320, 1320, 0.03 * k, 0.005, 0.5);
      tone(ctx, o, t + 0.88, "sine", 1980, 1980, 0.018 * k, 0.005, 0.4);
      break;
    }
    case "boot": {
      // three rising blips on the HUD module step (120 ms)
      [0, 1, 2].forEach((i) => tone(ctx, o, t + i * 0.12, "sine", 660 * Math.pow(1.26, i), 660 * Math.pow(1.26, i), 0.04 * k, 0.004, 0.08));
      break;
    }
  }
}
