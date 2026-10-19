"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { Camera, Vector3 } from "three";
import { frame, worldStore } from "../state/world-store";
import { addTick } from "../ticker";
import { labelsState } from "./labels-registry";
import { emitSfx } from "../sfx-bus";
import { glyphAt } from "./Scramble";
import { usePhone } from "../phone";

interface Typing {
  lines: string[];
  /** characters typed so far (fractional) */
  typed: number;
  /** last line index that played its 'type' sound */
  line: number;
  key: string;
  glitch: number;
  glitchUntil: number;
  /** side in use: the preferred one, flipped when it would collide with DOM copy or another label */
  side: "left" | "right";
}
/** typing speed, characters per second */
const CPS = 55;
/** full-text box estimate (.marker: 12px mono, 0.02em tracking, 1.55 line height, px-1) so a label
 *  picks its side before it has typed on, and never jumps sides mid-type */
const CHAR_W = 7.45, LINE_H = 18.6, PAD_X = 8;
/** clearance kept around keep-out rects (DOM copy marked [data-label-avoid]) */
const GAP = 12;
type Rect = [number, number, number, number];
const hits = (r: Rect, list: Rect[]) => list.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]);
const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** NDC of a world point: Vector3.project without importing three (this overlay is in first-load JS). */
const v = { x: 0, y: 0, z: 0 };
function project(p: Vector3, cam: Camera) {
  const a = cam.matrixWorldInverse.elements, b = cam.projectionMatrix.elements;
  const x = a[0]! * p.x + a[4]! * p.y + a[8]! * p.z + a[12]!;
  const y = a[1]! * p.x + a[5]! * p.y + a[9]! * p.z + a[13]!;
  const z = a[2]! * p.x + a[6]! * p.y + a[10]! * p.z + a[14]!;
  const w = 1 / (b[3]! * x + b[7]! * y + b[11]! * z + b[15]!);
  v.x = (b[0]! * x + b[4]! * y + b[8]! * z + b[12]!) * w;
  v.y = (b[1]! * x + b[5]! * y + b[9]! * z + b[13]!) * w;
  v.z = (b[2]! * x + b[6]! * y + b[10]! * z + b[14]!) * w;
}
const subscribe = (l: () => void) => {
  labelsState.listeners.add(l);
  return () => {
    labelsState.listeners.delete(l);
  };
};

/**
 * DOM labels with leader lines, projected from 3D anchors every frame. Decorative (aria-hidden).
 * Lines type on character by character behind a block caret (one 'type' sound per line), glitch
 * a character now and then once settled, and erase with the transition dissolve.
 * Reduced motion / static: shown whole, no typing, no glitch.
 * Phones: none at all (no overlay, no ticks); the wrapper keeps the overlay's hook order valid.
 */
export function AnchoredLabels() {
  const phone = usePhone();
  return phone ? null : <LabelsOverlay />;
}

function LabelsOverlay() {
  const version = useSyncExternalStore(subscribe, () => labelsState.version, () => 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the registry's change counter
  const ids = useMemo(() => [...labelsState.defs.keys()], [version]);
  const els = useRef(new Map<string, { box: HTMLDivElement; line: SVGPolylineElement; text: HTMLDivElement }>());
  /** last full text per label, how many characters are typed and shown, and the glitch state */
  const typed = useRef(new Map<string, Typing>());
  const textAt = useRef(0);

  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let avoidEls: Element[] = [];
    // viewport size cached on resize: innerWidth/innerHeight reads can flush layout mid-frame
    let w = window.innerWidth, h = window.innerHeight;
    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
    };
    addEventListener("resize", onResize);
    /** last measured keep-out rects (DOM copy only), reused while every label is invisible, and
     *  the scroll they were measured at */
    let domRects: Rect[] = [];
    let rectsAt = 0;
    /** the draw tick's last visibility, so the read tick knows whether any label can be seen */
    let lastVis = 0;
    // Keep-out rects are read FIRST in the frame (priority -100), while last frame's layout is still
    // clean and before Lenis scrolls: a read after the scroll (at +10) recalculates the scroll-driven
    // caption styles synchronously. The draw tick shifts them by the scroll since instead of reading
    // layout. Reads are only taken while some label for this station can actually be seen.
    const offRead = addTick(() => {
      const s = worldStore.getState();
      if (!labelsState.camera || !s.webglReady || s.intro !== "done" || w < 640 || lastVis <= 0.001) return;
      let anyOn = false;
      for (const def of labelsState.defs.values()) if (def.station.includes(s.station)) anyOn = true;
      if (!anyOn) return;
      domRects = [];
      for (const a of avoidEls) {
        const r = a.getBoundingClientRect();
        if (r.width > 0 && r.bottom > -h && r.top < 2 * h) domRects.push([r.left - GAP, r.top - GAP, r.right + GAP, r.bottom + GAP]);
      }
      // the scroll these rects belong to: the live one (native scroll already moved before this frame's
      // rAF, while frame.scrollY is written later, at -10); layout is clean after the reads above
      rectsAt = window.scrollY;
    }, -100);
    const offDraw = addTick((time, dt) => {
      const cam = labelsState.camera;
      const s = worldStore.getState();
      const instant = calm || s.tier === "static" || s.loopMode === "static";
      const refreshText = time - textAt.current > 400;
      if (refreshText) {
        textAt.current = time;
        avoidEls = [...document.querySelectorAll("[data-label-avoid]")];
      }
      const hidden = !s.webglReady || s.intro !== "done" || w < 640;
      // igloo: captions dissolve as you scroll into a transition, and come back as you settle
      const fade = Math.max(0, 1 - frame.transition / 0.4);
      const vis = fade * fade * (3 - 2 * fade);
      lastVis = hidden ? 0 : vis;
      // keep-out rects from the read tick, shifted by this frame's scroll (no layout reads here);
      // placed labels are appended so two labels never stack either
      const avoid: Rect[] = [];
      if (!hidden && cam) {
        const dy = rectsAt - frame.scrollY;
        for (const r of domRects) if (r[3] + dy > 0 && r[1] + dy < h) avoid.push([r[0], r[1] + dy, r[2], r[3] + dy]);
      }
      for (const [id, def] of labelsState.defs) {
        const el = els.current.get(id);
        if (!el) continue;
        const on = !hidden && cam && def.station.includes(s.station);
        if (!on) {
          el.box.style.opacity = "0";
          // retype from scratch next time the label shows
          const tp = typed.current.get(id);
          if (tp) tp.typed = 0;
          continue;
        }
        const p = typeof def.world === "function" ? def.world() : def.world;
        project(p, cam);
        if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) {
          el.box.style.opacity = "0";
          continue;
        }
        const ax = (v.x * 0.5 + 0.5) * w, ay = (-v.y * 0.5 + 0.5) * h;
        let tp = typed.current.get(id);
        if (!tp) {
          tp = { lines: def.lines(), typed: 0, line: -1, key: "", glitch: -1, glitchUntil: 0, side: def.side };
          typed.current.set(id, tp);
        } else if (refreshText) tp.lines = def.lines();
        // collision rule: keep the side in use unless its box hits DOM copy or a placed label; then
        // try the other side; if both hit, hide the label rather than print over text
        const ey = ay - 34, ly = ey; // elbow and label baseline
        const tw = PAD_X + CHAR_W * tp.lines.reduce((n, l) => Math.max(n, l.length), 0);
        const th = LINE_H * tp.lines.length;
        const boxFor = (side: "left" | "right"): Rect => {
          const lx = ax + (side === "left" ? -116 : 116);
          const x0 = side === "left" ? lx - tw : lx;
          return [x0, ly - th + 4, x0 + tw, ly + 4];
        };
        let box = boxFor(tp.side);
        if (tp.side !== def.side) {
          // drift back to the preferred side once it is clear by a margin (hysteresis, no flicker)
          const pref = boxFor(def.side);
          if (!hits([pref[0] - GAP, pref[1] - GAP, pref[2] + GAP, pref[3] + GAP], avoid)) {
            tp.side = def.side;
            box = pref;
          }
        }
        if (hits(box, avoid)) {
          const other = tp.side === "left" ? "right" : "left";
          const alt = boxFor(other);
          if (hits(alt, avoid)) {
            el.box.style.opacity = "0";
            continue;
          }
          tp.side = other;
          box = alt;
        }
        avoid.push([box[0] - GAP, box[1] - GAP, box[2] + GAP, box[3] + GAP]);
        const dir = tp.side === "left" ? -1 : 1;
        const ex = ax + dir * 46; // elbow
        const lx = ex + dir * 70; // label edge
        el.line.setAttribute("points", `${ax},${ay} ${ex},${ey} ${lx},${ly}`);
        // % resolves against the label's own box: anchored bottom-left/right without reading layout
        el.text.style.transform = `translate(${lx}px, ${ly + 4}px) translate(${tp.side === "left" ? "-100%" : "0"}, -100%)`;
        el.box.style.opacity = vis.toFixed(3);
        const total = tp.lines.reduce((n, l) => n + l.length, 0);
        // type on at CPS; one 'type' sound per line as its first character lands
        tp.typed = instant ? total : Math.min(total, tp.typed + dt * CPS);
        let lineNow = -1;
        for (let i = 0, acc = 0; i < tp.lines.length; acc += tp.lines[i]!.length, i++) if (tp.typed > acc) lineNow = i;
        if (!instant && lineNow > tp.line) emitSfx("type", { pan: dir * 0.4 });
        tp.line = lineNow;
        // erase from the end as the label fades: characters drop off in step with the dissolve
        const shown = Math.floor(vis >= 0.999 ? tp.typed : Math.min(tp.typed, total * vis));
        const typing = !instant && tp.typed < total;
        // occasional glitch once settled: one character flips to a glyph for ~90 ms
        if (!instant && !typing && tp.glitch < 0 && Math.random() < dt * 0.25) {
          tp.glitch = Math.floor(Math.random() * total);
          tp.glitchUntil = time + 90;
        }
        if (tp.glitch >= 0 && time > tp.glitchUntil) tp.glitch = -1;
        const key = `${shown}|${typing ? 1 : 0}|${tp.glitch}|${refreshText ? time : tp.key}`;
        if (key !== tp.key) {
          tp.key = key;
          let left = shown;
          let at = 0;
          el.text.innerHTML = tp.lines
            .map((l, i) => {
              let part = l.slice(0, Math.max(0, left));
              if (tp.glitch >= at && tp.glitch < at + part.length) {
                const g = tp.glitch - at;
                part = part.slice(0, g) + glyphAt(g, time) + part.slice(g + 1);
              }
              const caret = typing && left > 0 && left <= l.length ? '<span class="caret"></span>' : "";
              left -= l.length;
              at += l.length;
              return `<div class="${i ? "marker-muted" : ""}">${esc(part) || (caret ? "" : "&nbsp;")}${caret}</div>`;
            })
            .join("");
        }
      }
    }, 10);
    return () => {
      offRead();
      offDraw();
      removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10" aria-hidden="true" data-hud>
      {ids.map((id) => (
        <div
          key={id}
          className="label3d"
          style={{ opacity: 0, position: "absolute", inset: 0 }}
          ref={(box) => {
            if (!box) {
              els.current.delete(id);
              return;
            }
            els.current.set(id, { box, line: box.querySelector("polyline")!, text: box.querySelector("[data-text]")! });
          }}
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <polyline fill="none" stroke="rgba(232,233,240,0.7)" strokeWidth="1" points="0,0 0,0 0,0" />
            <circle r="2" fill="#6cf2ff">
              <animate attributeName="r" values="2;3.5;2" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
          <div data-text className="marker absolute left-0 top-0 whitespace-nowrap px-1" style={{ textShadow: "0 1px 10px rgba(10,11,16,0.9)" }} />
        </div>
      ))}
    </div>
  );
}
