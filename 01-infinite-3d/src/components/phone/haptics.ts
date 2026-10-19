import { isPhone } from "@/components/world/phone";

const KEY = "portfolio.haptics";
export const canVibrate = (): boolean => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
export function hapticsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}
export function setHaptics(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}
/** Android tick for one discrete user action (tab, social pick, copy, lap). iOS has no vibrate: its only haptics come from native <input switch> taps. */
export function haptic(ms = 8): void {
  if (!canVibrate() || !isPhone() || !hapticsEnabled()) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const act = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (act && !act.hasBeenActive) return;
  try {
    navigator.vibrate(ms);
  } catch {}
}
