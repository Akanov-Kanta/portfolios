import { frame, worldStore } from "../state/world-store";
import { STATION_T } from "../path/stations";
import { addTick } from "../ticker";
import { fx } from "../theme";
import { emitSfx, onSfx } from "../sfx-bus";
import { playSfx } from "./sfx";
import { smoothstep } from "../math";
import { isPhone } from "../phone";

/**
 * Synthesised sound, no assets. Off by default; the AudioContext is created on the first
 * toggle (a user gesture, which unlocks it). Four continuous beds crossfade by curve position:
 *   room tone (brown noise, LP 420 Hz) · void hum (55 / 55.4 Hz beating sines)
 *   portal whoosh (band-passed noise; centre + Q follow scroll speed) · server whirr (noise → comb
 *   → high-shelf, with rare relay clicks)
 * plus a velocity layer (attack 0.2 / release 0.05) and the sfx-bus one-shots (audio/sfx.ts).
 * A +30 ticker sets the gains and writes fx.audio (smoothed master RMS, 0 when muted).
 */
const MASTER = 0.9;
/** bed levels at full weight */
const LEVEL = { room: 0.32, hum: 0.07, portal: 0.1, server: 0.06, vel: 0.07 };

/** 0 → 1 crossfade between a and b (smoothstep) */
const fit = (t: number, a: number, b: number) => smoothstep(a, b, t);
/** bell around c with half-width w on the unit loop */
const bell = (t: number, c: number, w: number) => {
  const d = Math.abs(((t - c + 1.5) % 1) - 0.5);
  return 1 - fit(d, 0, w);
};

/** Bed weights at curve param t (pure; the stations sit at STATION_T, the portal gate at 5/9). */
export function bedWeights(t: number) {
  const g = 1 / 9;
  const a = STATION_T.about, p = STATION_T.projects, c = STATION_T.contact;
  // the room holds from the ascent through about, then gives way inside the monitor dive
  const room = t < 0.5 ? 1 - fit(t, a + 0.5 * g, p - 0.5 * g) : fit(t, c + 1.2 * g, 1 - 0.4 * g);
  const hum = fit(t, a + 0.7 * g, p) * (1 - fit(t, p + 0.4 * g, p + 1.1 * g));
  const portal = bell(t, 5 * g, 0.8 * g);
  const server = fit(t, 5.3 * g, c) * (1 - fit(t, c + 0.5 * g, c + 1.4 * g));
  return { room, hum, portal, server };
}

interface Graph {
  ctx: AudioContext;
  master: GainNode;
  analyser: AnalyserNode;
  sfx: GainNode;
  room: GainNode;
  hum: GainNode;
  portal: GainNode;
  portalBp: BiquadFilterNode;
  server: GainNode;
  vel: GainNode;
}
let g: Graph | null = null;
let offTick: (() => void) | null = null;
let offSfx: (() => void) | null = null;
let offDom: (() => void) | null = null;
let stopTimer = 0;
const reducedMq = typeof window !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)") : null;

function noiseBuffer(ctx: AudioContext, seconds: number, brown: boolean) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

function loop(ctx: AudioContext, buf: AudioBuffer) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.start(0, Math.random() * buf.duration);
  return s;
}

function gain(ctx: AudioContext, v = 0) {
  const n = ctx.createGain();
  n.gain.value = v;
  return n;
}

function build(): Graph {
  const ctx = new AudioContext();
  const master = gain(ctx, 0);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  master.connect(analyser).connect(ctx.destination);
  const white = noiseBuffer(ctx, 3, false);

  // room tone: brown noise through a low-pass
  const room = gain(ctx);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  loop(ctx, noiseBuffer(ctx, 4, true)).connect(lp).connect(room).connect(master);

  // void hum: two detuned sines beat slowly (0.4 Hz)
  const hum = gain(ctx);
  for (const f of [55, 55.4]) {
    const o = ctx.createOscillator();
    o.frequency.value = f;
    o.connect(hum);
    o.start();
  }
  hum.connect(master);

  // portal whoosh: band-passed noise, centre + Q follow scroll speed
  const portal = gain(ctx);
  const portalBp = ctx.createBiquadFilter();
  portalBp.type = "bandpass";
  portalBp.frequency.value = 320;
  portalBp.Q.value = 0.8;
  loop(ctx, white).connect(portalBp).connect(portal).connect(master);

  // server whirr: noise → feedback comb (≈150 Hz fan tone) → high-shelf air
  const server = gain(ctx);
  const comb = ctx.createDelay(0.05);
  comb.delayTime.value = 1 / 150;
  const fb = gain(ctx, 0.62);
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 2500;
  shelf.gain.value = 6;
  const slp = ctx.createBiquadFilter();
  slp.type = "lowpass";
  slp.frequency.value = 5200;
  const src = loop(ctx, white);
  const inGain = gain(ctx, 0.35);
  src.connect(inGain).connect(comb);
  comb.connect(fb).connect(comb);
  comb.connect(shelf).connect(slp).connect(server).connect(master);

  // velocity layer: airy band of noise that swells with scroll speed
  const vel = gain(ctx);
  const vbp = ctx.createBiquadFilter();
  vbp.type = "bandpass";
  vbp.frequency.value = 900;
  vbp.Q.value = 0.8;
  loop(ctx, white).connect(vbp).connect(vel).connect(master);

  // one-shots
  const sfx = gain(ctx, 1);
  sfx.connect(master);

  // one graph per page (never torn down), so this listener lives as long as the page
  document.addEventListener("visibilitychange", () => {
    if (!g) return;
    if (document.hidden) g.ctx.suspend().catch(() => {});
    else if (worldStore.getState().sound) g.ctx.resume().catch(() => {});
  });
  return { ctx, master, analyser, sfx, room, hum, portal, portalBp, server, vel };
}

/** set a param toward v smoothly, skipping sub-audible changes (keeps the event queue short) */
const lastTarget = new WeakMap<AudioParam, number>();
function glide(p: AudioParam, v: number, now: number, tau = 0.08, eps = 0.002) {
  if (Math.abs((lastTarget.get(p) ?? p.value) - v) < eps) return;
  lastTarget.set(p, v);
  p.setTargetAtTime(v, now, tau);
}

/** +30 ticker: bed crossfade, portal filter, velocity layer, whoosh trigger, relay clicks, fx.audio */
function installTick(graph: Graph) {
  const buf = new Float32Array(graph.analyser.fftSize);
  let vel = 0;
  let prevTransition = frame.transition;
  let nextRelay = performance.now() + 3000;
  let rms = 0;
  return addTick((time, dt) => {
    const { ctx } = graph;
    if (ctx.state !== "running") return;
    const now = ctx.currentTime;
    const w = bedWeights(frame.t);
    glide(graph.room.gain, w.room * LEVEL.room, now);
    glide(graph.hum.gain, w.hum * LEVEL.hum, now);
    glide(graph.portal.gain, w.portal * LEVEL.portal, now);
    glide(graph.server.gain, w.server * LEVEL.server, now);
    const v = frame.vNorm;
    glide(graph.portalBp.frequency, 320 + 1500 * v, now, 0.1, 4);
    glide(graph.portalBp.Q, 0.8 + 3 * v, now, 0.1, 0.02);
    // velocity layer: fast attack, slow release; silent under reduced motion
    const target = reducedMq?.matches ? 0 : v;
    const k = target > vel ? 0.2 : 0.05;
    vel += (target - vel) * (1 - Math.pow(1 - k, dt * 60));
    glide(graph.vel.gain, vel * LEVEL.vel, now, 0.03, 0.001);
    // whoosh on entering a transition
    if (prevTransition <= 0.05 && frame.transition > 0.05) {
      playSfx(ctx, graph.sfx, "whoosh", { gain: 0.5 + 0.5 * v, dir: frame.velocityPx < 0 ? -1 : 1 });
    }
    prevTransition = frame.transition;
    // server relays: a rare dry click while the server bed is up
    if (w.server > 0.25 && time > nextRelay) {
      nextRelay = time + 1500 + Math.random() * 4500;
      playSfx(ctx, graph.sfx, "type", { gain: 0.7 * w.server, pan: Math.random() * 1.2 - 0.6 });
    } else if (w.server <= 0.25) nextRelay = Math.max(nextRelay, time + 1500);
    // amplitude for the scene (halo pulse): RMS of the master bus, smoothed
    graph.analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i]! * buf[i]!;
    const level = Math.min(1, Math.sqrt(sum / buf.length) * 6);
    rms += (level - rms) * (1 - Math.exp(-8 * dt));
    fx.audio = worldStore.getState().sound ? rms : 0;
  }, 30);
}

/** Delegated `[data-sfx]` controls: hover / keyboard focus → tick, press → press. */
function installDom() {
  const host = (e: Event) => (e.target as Element | null)?.closest?.<HTMLElement>("[data-sfx]") ?? null;
  const onOver = (e: PointerEvent) => {
    const el = host(e);
    if (!el || el.dataset.sfx !== "tick") return;
    const from = e.relatedTarget as Node | null;
    if (from && el.contains(from)) return;
    emitSfx("tick");
  };
  const onFocus = (e: FocusEvent) => {
    const el = host(e);
    if (el && el.dataset.sfx === "tick" && el.matches(":focus-visible")) emitSfx("tick");
  };
  const onDown = (e: PointerEvent) => {
    if (host(e)) emitSfx("press");
  };
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("focusin", onFocus);
  document.addEventListener("pointerdown", onDown, { passive: true });
  return () => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("focusin", onFocus);
    document.removeEventListener("pointerdown", onDown);
  };
}

/**
 * Phones: an 'ambient' audio session mixes with other apps' audio and obeys the iPhone silent
 * switch (Safari 16.4+). Set before the context first plays; a no-op where the API is missing.
 */
function ambientSession() {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (!nav.audioSession || !isPhone()) return;
  try {
    nav.audioSession.type = "ambient";
  } catch {}
}

export async function setSound(on: boolean) {
  worldStore.getState().set({ sound: on });
  window.clearTimeout(stopTimer);
  if (on) {
    ambientSession();
    g ??= build();
    const graph = g;
    // a refused resume (no user activation) leaves the context suspended; the tick skips until it runs
    await graph.ctx.resume().catch(() => {});
    if (!worldStore.getState().sound) return;
    graph.master.gain.cancelScheduledValues(graph.ctx.currentTime);
    graph.master.gain.setTargetAtTime(MASTER, graph.ctx.currentTime, 0.6);
    offTick ??= installTick(graph);
    offSfx ??= onSfx((name, opts) => {
      if (g && g.ctx.state === "running" && worldStore.getState().sound) playSfx(g.ctx, g.sfx, name, opts);
    });
    offDom ??= installDom();
    playSfx(graph.ctx, graph.sfx, "blip");
  } else if (g) {
    const graph = g;
    // ~5 time constants → silent within 0.3 s
    graph.master.gain.cancelScheduledValues(graph.ctx.currentTime);
    graph.master.gain.setTargetAtTime(0, graph.ctx.currentTime, 0.06);
    offSfx?.();
    offSfx = null;
    offDom?.();
    offDom = null;
    fx.audio = 0;
    stopTimer = window.setTimeout(() => {
      if (worldStore.getState().sound) return;
      offTick?.();
      offTick = null;
      fx.audio = 0;
      graph.ctx.suspend().catch(() => {});
    }, 400);
  }
}
