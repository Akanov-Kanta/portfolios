"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { InstallHint } from "@/components/pwa/InstallHint";

/**
 * The phone-only home wiring, mounted by PhoneHud (a lazy chunk, phones only) while the home route shows,
 * so none of it is in any route's first-load JS:
 *  - the touch-wrap settle after scrollend and the whole-pixel loop clone (touch-settle.ts);
 *  - the contact stage's behaviour (OrbStage: orb gestures, social-grid selection, the copy tick);
 *  - the install offer below the social grid: a portal into the server-rendered stage, where it is the
 *    stage's last child (phone-pwa.css hides it under 700 px of height).
 * Each home visit mounts it again (a new page, a new stage).
 */
export function PhoneHome() {
  // client-only (PhoneHud is ssr:false) and mounted once the home page is committed: the stage exists
  const [stage] = useState(() => document.querySelector<HTMLElement>("#contact [data-slot-root]"));

  useEffect(() => {
    const offs: (() => void)[] = [];
    let alive = true;
    import("@/components/world/scroll/touch-settle").then((m) => {
      if (alive) offs.push(m.installTouchSettle(), m.installCloneAlign());
    }, () => {});
    if (stage)
      import("@/components/home/OrbStage").then((m) => {
        if (alive) offs.push(m.wireContact(stage));
      }, () => {});
    return () => {
      alive = false;
      offs.forEach((off) => off());
    };
  }, [stage]);

  return stage ? createPortal(<InstallHint placement="contact" />, stage) : null;
}
