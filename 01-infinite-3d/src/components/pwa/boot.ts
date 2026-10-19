import { PHONE_MQ } from "@/components/world/phone";

/**
 * pwaBoot(): the PWA_BOOT inline <script> text, the first child of <body> (rendered by PwaBoot in PwaRegister.tsx).
 * It runs during HTML parse, so a beforeinstallprompt that fires before hydration is not lost.
 * Phones only (THE gate, inlined from PHONE_MQ): it stores the event in window.__pwaPrompt (preventDefault
 * also keeps Chrome's mini-infobar off the Dock) and marks appinstalled; both dispatch "pwa:change" for
 * install-store.ts. Other touch-primary devices (Android tablets) only get the preventDefault: the manifest
 * is new, so without it Chrome's automatic install banner would now appear over a page that must look as
 * before; the browser menu's install stays. Fine-pointer devices (desktops, touch laptops) return at once.
 */
export const pwaBoot = () =>
  `(function(){try{if(!matchMedia("(pointer: coarse)").matches)return;var q=${JSON.stringify(PHONE_MQ)};addEventListener("beforeinstallprompt",function(e){e.preventDefault();if(!matchMedia(q).matches)return;window.__pwaPrompt=e;dispatchEvent(new Event("pwa:change"))});addEventListener("appinstalled",function(){if(!matchMedia(q).matches)return;window.__pwaPrompt=null;window.__pwaInstalled=true;dispatchEvent(new Event("pwa:change"))})}catch(_){}})();`;
