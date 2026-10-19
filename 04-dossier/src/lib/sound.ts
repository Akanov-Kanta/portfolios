"use client";

import { useSyncExternalStore } from "react";
import { setAudioEnabled } from "./audio";

/**
 * Tiny global store for the sound toggle. Off by default. Turning it on creates/resumes the WebAudio
 * engine (lib/audio.ts) synchronously, inside the click, so browsers allow playback.
 */
let on = false;
const listeners = new Set<() => void>();

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSoundOn = () => on;

export function setSoundOn(next: boolean) {
  if (next === on) return;
  on = next;
  setAudioEnabled(next);
  listeners.forEach((l) => l());
}

export const toggleSound = () => setSoundOn(!on);

export function useSound() {
  return useSyncExternalStore(subscribeSound, getSoundOn, () => false);
}
