# 浪人 — Nazar Akanov, ronin developer

One-page developer portfolio in the "Program" style (Animatrix × ukiyo-e): flat posterized fields, an ink
silhouette against a giant moon, gold-leaf screens, diagonal sword-cut transitions. See `PLAN.md`.

```bash
npm install
npm run dev -- -p 3106     # http://localhost:3106
npm run lint && npm run build
node scripts/shots.mjs     # screenshots (desktop, 390px mobile, reduced motion) → screenshots/ (needs a running server on :3106)
```

All copy (bio, projects, techniques, the path, socials) lives in `src/content.ts`; search it for `TODO`.
Project screenshots are in `public/projects/`. Stack: Next.js 16 (App Router), Tailwind CSS 4, GSAP + ScrollTrigger.
