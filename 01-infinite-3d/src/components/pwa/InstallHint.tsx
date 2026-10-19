"use client";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { site } from "@/content/site";
import { usePhone, useStandalone } from "@/components/world/phone";
import { dismiss, promptInstall, useInstallKind } from "./install-store";
import { ShareButton, ShareGlyph, useCanShare } from "./ShareButton";

/** Splits the iOS step text after its first "Share", where the share glyph goes. */
function splitAfter(text: string, word: string): [string, string] {
  const i = text.indexOf(word);
  return i < 0 ? ["", ` ${text}`] : [text.slice(0, i + word.length), text.slice(i + word.length)];
}

/** What the row says once it has been acted on (it can't be offered again on this page). */
const NOTE = {
  hidden: "Install offer hidden for 30 days",
  prompt: "Follow your browser's install dialog",
  installed: "Installing the app",
} as const;
type Note = keyof typeof NOTE;

/**
 * The install offer. Never a popup: it lives where it is placed, on phones only (THE gate).
 *   contact  below the social grid; phone-pwa.css hides it when the viewport is under 700 px tall
 *   sheet    a row in the Index sheet (a modal, so two offers are never on screen together)
 * Android: [ Install app ] (the browser's own dialog, once) + Not now. iOS: the Share, then Add to Home
 * Screen steps + Not now (30 days). The installed app: [ Share ]. Desktops, tablets, the server render
 * and hydration: nothing, so no install DOM exists there.
 * Acting on it (Install, Not now) spends the offer: the row gives way to a short status line in the same
 * place ([data-install-note]: not an offer), which takes the focus when the row had it, so a keyboard or
 * screen-reader user never drops to <body> (inside the open sheet, outside the dialog).
 */
export function InstallHint({ placement }: { placement: "contact" | "sheet" }) {
  const phone = usePhone();
  const standalone = useStandalone();
  const kind = useInstallKind();
  const share = useCanShare();
  const [note, setNote] = useState<Note | null>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const refocus = useRef(false);

  useLayoutEffect(() => {
    if (!note || !refocus.current) return;
    refocus.current = false;
    noteRef.current?.focus({ preventScroll: true });
  }, [note]);

  if (!phone) return null;

  const act = (e: MouseEvent<HTMLButtonElement>, next: Note) => {
    refocus.current = e.currentTarget.contains(document.activeElement);
    setNote(next);
  };

  if (note) {
    return (
      <p ref={noteRef} data-install-note={placement} role="status" tabIndex={-1}>
        <span aria-hidden="true">{"// "}</span>
        {NOTE[note]}
      </p>
    );
  }

  if (standalone) {
    if (!share) return null;
    return (
      <div data-install-hint={placement} data-kind="share">
        <ShareButton />
      </div>
    );
  }

  if (kind === "android") {
    return (
      <div data-install-hint={placement} data-kind="android">
        <button
          type="button"
          data-pwa-pill
          onClick={(e) => {
            act(e, "prompt");
            void promptInstall().then((outcome) => outcome && setNote(outcome === "accepted" ? "installed" : "hidden"));
          }}
        >
          <span className="bracket">{site.phone.install}</span>
        </button>
        <button
          type="button"
          data-pwa-quiet
          onClick={(e) => {
            act(e, "hidden");
            dismiss();
          }}
        >
          {site.phone.notNow}
        </button>
      </div>
    );
  }

  if (kind === "ios") {
    const [lead, rest] = splitAfter(site.phone.installIos, "Share");
    return (
      <div data-install-hint={placement} data-kind="ios">
        <p data-pwa-steps>
          {lead}
          <ShareGlyph />
          <span className="sr-only"> (Share button)</span>
          {rest}
        </p>
        <p data-pwa-note>{site.phone.installIosCompact}</p>
        <button
          type="button"
          data-pwa-quiet
          onClick={(e) => {
            act(e, "hidden");
            dismiss();
          }}
        >
          {site.phone.notNow}
        </button>
      </div>
    );
  }

  return null;
}
