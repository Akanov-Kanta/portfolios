import { useSyncExternalStore } from "react";
import { PHONE_MQ, STANDALONE_MQ, isPhone, isStandalone } from "@/components/world/phone";

/**
 * Install offer state, one per page. Never interrupts: the offer only renders where InstallHint is placed
 * (the contact station, the Index sheet). PWA_BOOT (boot.ts) captures beforeinstallprompt into
 * window.__pwaPrompt and announces changes with the window "pwa:change" event.
 *   "android"  Chrome & co. handed us a prompt: a real [ Install app ] button calls it (once, from a click)
 *   "ios"      iPhone / iPad Safari, CriOS, EdgiOS, FxiOS: Share, then Add to Home Screen (no API exists)
 *   "none"     installed / standalone, not a phone, dismissed < 30 days ago, in-app webviews, Firefox Android
 */
export type InstallKind = "none" | "android" | "ios";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
type PwaWindow = Window & { __pwaPrompt?: BeforeInstallPromptEvent | null; __pwaInstalled?: boolean };

const KEY = "pwa.install.dismissed";
const QUIET_MS = 30 * 24 * 60 * 60 * 1000;
const IN_APP = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|GSA\/|Telegram/;

/** "Not now" timestamp; read once per page (try/catch: storage can be blocked), then kept in memory */
let dismissedAt: number | null = null;
function dismissedRecently(): boolean {
  if (dismissedAt === null) {
    try {
      dismissedAt = Number(localStorage.getItem(KEY)) || 0;
    } catch {
      dismissedAt = 0;
    }
  }
  return Date.now() - dismissedAt < QUIET_MS;
}

function iosInstallable(): boolean {
  const ua = navigator.userAgent;
  const apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return apple && /Safari\//.test(ua) && !IN_APP.test(ua);
}

export function kind(): InstallKind {
  if (typeof window === "undefined") return "none";
  const w = window as PwaWindow;
  if (isStandalone() || w.__pwaInstalled) return "none";
  if (!isPhone() || dismissedRecently()) return "none";
  if (w.__pwaPrompt) return "android";
  return iosInstallable() ? "ios" : "none";
}

const emit = () => window.dispatchEvent(new Event("pwa:change"));

/** Android: show the browser's install dialog. Only ever from a click; a prompt event can be used once.
 *  Resolves with the user's choice (null when there was no prompt or it failed). */
export async function promptInstall(): Promise<"accepted" | "dismissed" | null> {
  const w = window as PwaWindow;
  const e = w.__pwaPrompt;
  if (!e) return null;
  w.__pwaPrompt = null;
  emit();
  let outcome: "accepted" | "dismissed" | null = null;
  try {
    await e.prompt();
    ({ outcome } = await e.userChoice);
    if (outcome === "dismissed") dismiss();
  } catch {}
  emit();
  return outcome;
}

/** "Not now": no offer on this device for 30 days */
export function dismiss(): void {
  dismissedAt = Date.now();
  try {
    localStorage.setItem(KEY, String(dismissedAt));
  } catch {}
  emit();
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("pwa:change", cb);
  const media = [STANDALONE_MQ, PHONE_MQ].map((q) => window.matchMedia(q));
  media.forEach((m) => m.addEventListener("change", cb));
  return () => {
    window.removeEventListener("pwa:change", cb);
    media.forEach((m) => m.removeEventListener("change", cb));
  };
}

/** "none" on the server and during hydration, so no install DOM is ever server-rendered */
export const useInstallKind = () => useSyncExternalStore(subscribe, kind, () => "none" as InstallKind);
