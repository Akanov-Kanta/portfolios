# ink-portfolio

Four variants of a portfolio landing styled after a TikTok anime edit (red ink vortex, veins, sumi-ink blots, white ink-burst wipes).

| Folder | Approach | Dev URL |
|---|---|---|
| `shader/` | All visuals generated with WebGL shaders, no footage | http://localhost:3201 |
| `video/` | Scroll-scrubbed frames from the original edit | http://localhost:3202 |
| `crt/` | Scroll-scrubbed frames from a second edit on a WebGL CRT tube | http://localhost:3205 |
| `hybrid/` | `shader/`'s engine with footage from `video/` (hero) and `crt/` (outro) sampled inside its scenes, eaten by its ink transitions | http://localhost:3207 |

```bash
cd shader && npm install && npm run dev
cd video  && npm install && npm run dev
cd crt    && npm install && npm run dev
cd hybrid && npm install && npm run dev
```

Copy for all lives in `src/content.ts`. Screenshots: `npm run shots` (dev server must be running).

> `video/` uses footage from a Tokyo Ghoul fan edit by @pzxepitsu (TikTok); `crt/` uses one by @.maisamu (TikTok); `hybrid/` uses both. Local demo only — do not publish without permission.

## Deploy

Pushing to `main` auto-deploys via Vercel (two projects from this one repo):

| Project | Root directory | Production |
|---|---|---|
| `ink-portfolio-shader` | `shader/` | https://ink-portfolio-shader.vercel.app |
| `ink-portfolio-video` | `video/` | https://ink-portfolio-video.vercel.app |
| `ink-portfolio-hybrid` | `hybrid/` | https://nazar-akanov.vercel.app (also https://ink-portfolio-hybrid.vercel.app) |

Each project skips its build when the push didn't change its folder (`git diff --quiet HEAD^ HEAD -- .`).
