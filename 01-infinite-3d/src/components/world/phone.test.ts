import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import postcss, { type AtRule, type ChildNode } from "postcss";
import { PHONE_APP_MQ, PHONE_LAND_MQ, PHONE_MQ } from "./phone";

/**
 * The phone gate has one source of truth (phone.ts). Its CSS mirrors must never drift:
 * (a) the three @custom-variant blocks in app/globals.css (and the phone token blocks) use the exact media text,
 * (b) the four lane stylesheets hold only gated @media blocks, ph-* @keyframes and comments,
 * (c) both refinements stay strict subsets of the touch gate.
 */
const APP = (file: string) => fileURLToPath(new URL(`../../app/${file}`, import.meta.url));
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const GATES = [PHONE_MQ, PHONE_LAND_MQ, PHONE_APP_MQ].map(norm);
const parse = (file: string) => postcss.parse(fs.readFileSync(APP(file), "utf8"), { from: APP(file) });
const isAt = (n: ChildNode | undefined, name: string): n is AtRule => n?.type === "atrule" && n.name === name;
const LANE_SHEETS = ["phone-runtime.css", "phone-hud.css", "phone-stations.css", "phone-pwa.css"];

describe("phone gate", () => {
  it("(a) globals.css @custom-variant phone / phone-land / phone-app mirror phone.ts", () => {
    const root = parse("globals.css");
    const want: Record<string, string> = { phone: PHONE_MQ, "phone-land": PHONE_LAND_MQ, "phone-app": PHONE_APP_MQ };
    const seen: Record<string, number> = {};
    root.walkAtRules("custom-variant", (v) => {
      const name = norm(v.params);
      if (!name.startsWith("phone")) return;
      expect(Object.keys(want), `unknown phone variant '${name}'`).toContain(name);
      seen[name] = (seen[name] ?? 0) + 1;
      const kids = (v.nodes ?? []).filter((n) => n.type !== "comment");
      expect(kids, `@custom-variant ${name}: exactly one child`).toHaveLength(1);
      const media = kids[0];
      expect(isAt(media, "media"), `@custom-variant ${name}: the child is an @media`).toBe(true);
      expect(norm((media as AtRule).params), `@custom-variant ${name}: media text`).toBe(norm(want[name]!));
    });
    expect(seen).toEqual({ phone: 1, "phone-land": 1, "phone-app": 1 });
  });

  it("(a) the phone token blocks in globals.css sit inside the exact gates", () => {
    const root = parse("globals.css");
    const tokenMedia = root.nodes.filter((n): n is AtRule => isAt(n, "media") && /--dock-reserve/.test(n.toString()));
    expect(tokenMedia.map((m) => norm(m.params))).toEqual([norm(PHONE_MQ), norm(PHONE_LAND_MQ)]);
  });

  it.each(LANE_SHEETS)("(b) %s holds only gated @media, ph-* @keyframes and comments", (file) => {
    const root = parse(file);
    for (const n of root.nodes) {
      if (n.type === "comment") continue;
      const where = `${file}:${n.source?.start?.line ?? "?"}`;
      if (n.type !== "atrule") {
        expect.fail(`${where}: top-level ${n.type} is outside the phone gate`);
        continue;
      }
      if (n.name === "media") {
        expect(GATES, `${where}: @media must be one of the three gates`).toContain(norm(n.params));
      } else if (n.name === "keyframes") {
        expect(norm(n.params).startsWith("ph-"), `${where}: @keyframes ${n.params} must be named ph-*`).toBe(true);
      } else {
        expect.fail(`${where}: top-level @${n.name} is outside the phone gate`);
      }
    }
  });

  it("(c) the refinements are strict subsets of the touch gate", () => {
    for (const q of [PHONE_LAND_MQ, PHONE_APP_MQ]) {
      expect(q).toContain("(pointer: coarse)");
      for (const branch of q.split(",")) expect(branch).toContain("(pointer: coarse)");
    }
  });
});
