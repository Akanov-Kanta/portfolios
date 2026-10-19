/** Decoupled sound events: any lane emits, only the audio module (lane 4) listens. No-op when nobody listens / sound off. */
export type SfxName = "tick" | "press" | "blip" | "type" | "whoosh" | "morph" | "boot";
export interface SfxOpts { gain?: number; pan?: number; dir?: -1 | 1 }
type Listener = (name: SfxName, opts: SfxOpts) => void;
const listeners = new Set<Listener>();
export function emitSfx(name: SfxName, opts: SfxOpts = {}): void {
  listeners.forEach((l) => l(name, opts));
}
export function onSfx(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
