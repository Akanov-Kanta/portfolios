// Builds the scroll-scrub image sequence from public/media/edit.mp4 (the @pzxepitsu Makima edit).
// 1. Swift + AVFoundation extracts frames (60 fps, cropped to 960x572). The crop drops the bottom band of
//    the 960x720 source, which is where every bottom-right burned-in caption ("THE RED HAIR:",
//    "THE SMILE:") and the @PZXEPITSU corner watermark live (all at y >= 585).
// 2. The top-left captions ("THE EYES:", "THE CHAIN:") sit on dark ground, so they are covered with a
//    feathered black patch baked into the frames (COVER). Our own top-left captions sit on that patch.
// 3. Frames of each range are packed into one .bin (concatenated AVIF files) plus a manifest with byte
//    offsets, so the browser fetches 5 files, not 600.
// The "HUMAN?/DEVIL?" frames (7.15-7.97 s) and the end card handle (11.20 s on) are never extracted.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const video = path.join(root, 'public/media/edit.mp4');
const cache = path.join(root, '.cache/frames');
const out = path.join(root, 'public/media/frames');
const FPS = 60;
const CROP = [0, 0, 960, 572]; // x y w h in source pixels (source is 960x720)
const QUALITY = process.env.Q ?? '0.55';
// top-left caption block of the edit ("THE EYES:" / "THE CHAIN:"): x 0-570 ("...OTHERS OBEY."), y 30-120 incl. glow
const TL = '-200,-200,800,322,34';

// Only the ranges the page actually uses (see src/content.ts). Times are multiples of 1/60 s.
const RANGES = [
  { name: 'a', t0: 0, t1: 1.4 }, //       eye swarm (hero); 1.40 is the cut to the warp
  { name: 'b', t0: 1.4, t1: 4.7 }, //     warp, speed-line title, rain, hands, the pause; 4.70 is the drop
  { name: 'c', t0: 4.7, t1: 6.98, cover: `${TL},5.65,7` }, // drop + "THE X:" collage
  { name: 'd', t0: 7.0167, t1: 7.1334 }, // the clean ink burst, just before "HUMAN?" types in (7.15)
  { name: 'e', t0: 8.0, t1: 11.1834, cover: `${TL},9.56,11.2` }, // burst-as-window, polarity flip, inverted collage, wash to black
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const manifest = { fps: FPS, width: CROP[2], height: CROP[3], chunks: [] };
let total = 0;
for (const r of RANGES) {
  const dir = path.join(cache, r.name);
  fs.rmSync(dir, { recursive: true, force: true });
  execFileSync('swift', [
    path.join(root, 'scripts/extract-frames.swift'), video, dir,
    String(FPS), String(r.t0), String(r.t1), ...CROP.map(String), String(CROP[2]), 'avif', QUALITY,
  ], { stdio: ['ignore', 'inherit', 'ignore'], env: { ...process.env, COVER: r.cover ?? '' } });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.avif')).sort();
  const bufs = files.map((f) => fs.readFileSync(path.join(dir, f)));
  const offsets = [0];
  for (const b of bufs) offsets.push(offsets[offsets.length - 1] + b.length);
  const file = `${r.name}.bin`;
  fs.writeFileSync(path.join(out, file), Buffer.concat(bufs));
  const luma = JSON.parse(fs.readFileSync(path.join(dir, 'luma.json'), 'utf8'));
  manifest.chunks.push({ name: r.name, file, t0: r.t0, count: files.length, offsets, luma });
  total += offsets[offsets.length - 1];
  console.log(`${file}: ${files.length} frames, ${(offsets.at(-1) / 1024 / 1024).toFixed(2)} MB`);
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));

// Poster for first paint (JPEG, shown before the frames arrive): the eye swarm at full strength.
const pdir = path.join(cache, 'poster');
fs.rmSync(pdir, { recursive: true, force: true });
execFileSync('swift', [path.join(root, 'scripts/extract-frames.swift'), video, pdir, '1', '0.9', '0.91', ...CROP.map(String), '960', 'jpg', '0.7'], { stdio: 'ignore' });
fs.copyFileSync(path.join(pdir, 'f0000.jpg'), path.join(root, 'public/media/poster.jpg'));
console.log(`total frames: ${(total / 1024 / 1024).toFixed(2)} MB`);
