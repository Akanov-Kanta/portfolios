"use client";

/**
 * Procedural WebAudio for DOSSIER (reference/web-refs.md §T11). No audio files.
 *
 * The AudioContext is created only inside the user's SOUND toggle click (lib/sound.ts calls
 * `setAudioEnabled` synchronously from the click), which satisfies autoplay rules. Everything here is a
 * silent no-op until then, so chapters can call `sfx.*` freely.
 *
 *   drone    two detuned saws + a sub, lowpassed with a slow LFO, plus a faint high "air" noise
 *   duck()   the breath before the drop: the drone drops to silence in ~100 ms; unduck() brings it back
 *   hit(s)   sub thump (sine 140→38 Hz, tanh grit) + a highpassed noise crack; s = 0..1 strength
 *   tick()   a 3 ms band-passed click, throttled to ≤ 25/s. Also fired by `window` event "dossier:tick".
 *   sweep()  a filtered noise riser/fall for the invert
 *   scene()  "drone" | "outro": the outro fades the drone out over ~2.5 s
 *
 * Master volume is conservative (0.5 of a quiet mix); on/off ramps over ~0.6 s; the context suspends
 * while the tab is hidden.
 */

const MASTER = 0.5;
const DRONE = 0.11;
const TICK_EVENT = "dossier:tick";

interface Engine {
  ctx: AudioContext;
  master: GainNode;
  drone: GainNode;
  noise: AudioBuffer;
  grit: WaveShaperNode;
}

let engine: Engine | null = null;
let enabled = false;
let ducked = false;
let scene: "drone" | "outro" = "drone";
let lastTick = 0;
let offTimer: number | undefined;

function noiseBuffer(ctx: AudioContext) {
  const b = new AudioBuffer({ length: ctx.sampleRate * 2, sampleRate: ctx.sampleRate });
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function tanhCurve(k = 2.5) {
  const n = 1024;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(k * x);
  }
  return c;
}

function build(): Engine | null {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = new GainNode(ctx, { gain: 0.0001 });
  const comp = new DynamicsCompressorNode(ctx, { threshold: -18, ratio: 4, attack: 0.003, release: 0.25 });
  master.connect(comp).connect(ctx.destination);

  // drone
  const drone = new GainNode(ctx, { gain: DRONE });
  drone.connect(master);
  const lp = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 260, Q: 0.7 });
  lp.connect(drone);
  for (const f of [55, 55.35]) {
    const o = new OscillatorNode(ctx, { type: "sawtooth", frequency: f });
    o.connect(lp);
    o.start();
  }
  const sub = new OscillatorNode(ctx, { type: "sine", frequency: 27.5 });
  const subG = new GainNode(ctx, { gain: 0.6 });
  sub.connect(subG).connect(lp);
  sub.start();
  const lfo = new OscillatorNode(ctx, { frequency: 0.05 });
  const lfoG = new GainNode(ctx, { gain: 120 });
  lfo.connect(lfoG).connect(lp.frequency);
  lfo.start();

  const noise = noiseBuffer(ctx);
  // faint "air": highpassed noise under the drone
  const air = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
  const hp = new BiquadFilterNode(ctx, { type: "highpass", frequency: 4000 });
  const airG = new GainNode(ctx, { gain: 0.035 });
  air.connect(hp).connect(airG).connect(drone);
  air.start();

  const grit = new WaveShaperNode(ctx, { curve: tanhCurve(), oversample: "2x" });
  grit.connect(master);

  document.addEventListener("visibilitychange", () => {
    if (!enabled || !engine) return;
    if (document.hidden) void engine.ctx.suspend();
    else void engine.ctx.resume();
  });
  return { ctx, master, drone, noise, grit };
}

function droneTarget() {
  return ducked || scene === "outro" ? 0.0001 : DRONE;
}

/** Called synchronously from the SOUND toggle click. */
export function setAudioEnabled(on: boolean) {
  enabled = on;
  window.clearTimeout(offTimer);
  if (on) {
    engine ??= build();
    if (!engine) return;
    const { ctx, master, drone } = engine;
    void ctx.resume();
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(MASTER, t + 0.6);
    drone.gain.setTargetAtTime(droneTarget(), t, 0.3);
  } else if (engine) {
    const { ctx, master } = engine;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    offTimer = window.setTimeout(() => {
      if (!enabled) void ctx.suspend();
    }, 650);
  }
}

const live = () => (enabled && engine && engine.ctx.state === "running" ? engine : null);

function setDrone(timeConstant: number) {
  const e = live();
  if (!e) return;
  e.drone.gain.setTargetAtTime(droneTarget(), e.ctx.currentTime, timeConstant);
}

export const sfx = {
  /** the breath: drone to silence before the drop */
  duck() {
    ducked = true;
    setDrone(0.04);
  },
  unduck() {
    ducked = false;
    setDrone(0.02);
  },
  /** drop / step-cut hit; strength 0..1 */
  hit(strength = 1) {
    const e = live();
    if (!e) return;
    const { ctx, master, noise, grit } = e;
    const t = ctx.currentTime + 0.005;
    const s = Math.max(0.05, Math.min(1, strength));
    const o = new OscillatorNode(ctx, { type: "sine", frequency: 140 });
    const g = new GainNode(ctx, { gain: 0.9 * s });
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    g.gain.setValueAtTime(0.9 * s, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g).connect(grit);
    o.start(t);
    o.stop(t + 0.5);
    const n = new AudioBufferSourceNode(ctx, { buffer: noise });
    const nhp = new BiquadFilterNode(ctx, { type: "highpass", frequency: 1800 });
    const ng = new GainNode(ctx, { gain: 0.35 * s });
    ng.gain.setValueAtTime(0.35 * s, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.connect(nhp).connect(ng).connect(master);
    n.start(t, Math.random());
    n.stop(t + 0.2);
  },
  /** typewriter click, throttled to ≤ 25/s */
  tick() {
    const e = live();
    if (!e) return;
    const now = performance.now();
    if (now - lastTick < 40) return;
    lastTick = now;
    const { ctx, master, noise } = e;
    const t = ctx.currentTime;
    const n = new AudioBufferSourceNode(ctx, { buffer: noise });
    const bp = new BiquadFilterNode(ctx, { type: "bandpass", frequency: 4800 + Math.random() * 900, Q: 4 });
    const g = new GainNode(ctx, { gain: 0.05 });
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    n.connect(bp).connect(g).connect(master);
    n.start(t, Math.random() * 1.5);
    n.stop(t + 0.035);
  },
  /** filtered noise sweep for the polarity flip */
  sweep() {
    const e = live();
    if (!e) return;
    const { ctx, master, noise } = e;
    const t = ctx.currentTime;
    const n = new AudioBufferSourceNode(ctx, { buffer: noise });
    const bp = new BiquadFilterNode(ctx, { type: "bandpass", frequency: 300, Q: 6 });
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(7000, t + 0.35);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.7);
    const g = new GainNode(ctx, { gain: 0.0001 });
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    n.connect(bp).connect(g).connect(master);
    n.start(t, Math.random());
    n.stop(t + 0.8);
  },
  /** "outro" fades the drone out (~2.5 s); "drone" brings it back */
  scene(next: "drone" | "outro") {
    if (scene === next) return;
    scene = next;
    setDrone(next === "outro" ? 0.8 : 0.3);
  },
};

if (typeof window !== "undefined") {
  window.addEventListener(TICK_EVENT, () => sfx.tick());
}

export { TICK_EVENT };
