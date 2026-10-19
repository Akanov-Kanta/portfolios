// Builds the footage layers for the hybrid from the two sibling sources (read-only):
//   hero  <- ../video/public/media/edit.mp4  (@pzxepitsu edit, 960x720, 60 fps)
//   outro <- ../crt/source/edit.mp4          (@.maisamu edit, 1280x720 HEVC, 30 fps)
// 1. Swift + AVFoundation extracts frames (no ffmpeg).
//    hero:  0-1.5 s, cropped to the top 960x560 so the burned-in subtitles and the TikTok
//           watermark in the bottom band are gone (same as variant B).
//    outro: 8.8-11.134 s (halftone centipede -> red spiral). The edit has a CRT bezel and a strong
//           radial vignette burned in: the vignette is divided out (flat-field) and the frame is
//           cropped inside the rounded corners. The "tiktok.com/@.maisamu" text in this edit only
//           runs 3.60-4.25 s, nowhere near this range.
// 2. Each clip is packed into one .bin (concatenated AVIF) + byte offsets in manifest.json.
// 3. JPEG posters (first paint / slow network / reduced motion) and the audio track of B.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cache = path.join(root, '.cache/frames');
const media = path.join(root, 'public/media');
const out = path.join(media, 'frames');
const swift = (file, args, stdio = ['ignore', 'inherit', 'ignore']) =>
  execFileSync('swift', [path.join(root, 'scripts', file), ...args], { stdio });

const SRC_B = path.join(root, '../video/public/media/edit.mp4');
const SRC_C = path.join(root, '../crt/source/edit.mp4');

const CLIPS = [
  { name: 'hero', src: SRC_B, fps: 60, t0: 0, t1: 1.5, crop: [0, 0, 960, 560], outW: 960, q: 0.6, poster: 0.32 },
  {
    name: 'outro', src: SRC_C, fps: 30, t0: 8.8, t1: 11.134,
    crop: [80, 45, 1120, 630], outW: Number(process.env.OUTRO_W ?? 1120), q: Number(process.env.OUTRO_Q ?? 0.18),
    flat: '0.49,0.26,2.4', poster: 10.6, posterQ: 0.5,
  },
];

fs.mkdirSync(out, { recursive: true });
const manifest = { clips: [] };
let total = 0;
for (const c of CLIPS) {
  const dir = path.join(cache, c.name);
  fs.rmSync(dir, { recursive: true, force: true });
  const common = [...c.crop.map(String), String(c.outW)];
  swift('extract-frames.swift', [c.src, dir, String(c.fps), String(c.t0), String(c.t1), ...common, 'avif', String(c.q), ...(c.flat ? [c.flat] : [])]);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.avif')).sort();
  const bufs = files.map((f) => fs.readFileSync(path.join(dir, f)));
  const offsets = [0];
  for (const b of bufs) offsets.push(offsets[offsets.length - 1] + b.length);
  const file = `${c.name}.bin`;
  fs.writeFileSync(path.join(out, file), Buffer.concat(bufs));
  const luma = JSON.parse(fs.readFileSync(path.join(dir, 'luma.json'), 'utf8'));
  const height = Math.round((c.crop[3] * c.outW) / c.crop[2]);
  manifest.clips.push({ name: c.name, file, fps: c.fps, t0: c.t0, count: files.length, width: c.outW, height, offsets, luma });
  total += offsets[offsets.length - 1];
  console.log(`${file}: ${files.length} frames, ${(offsets.at(-1) / 1024 / 1024).toFixed(2)} MB`);

  // poster: one JPEG frame of the same crop
  const pdir = path.join(cache, `${c.name}-poster`);
  fs.rmSync(pdir, { recursive: true, force: true });
  swift('extract-frames.swift', [c.src, pdir, '1', String(c.poster), String(c.poster + 0.01), ...common, 'jpg', String(c.posterQ ?? 0.7), ...(c.flat ? [c.flat] : [])], 'ignore');
  fs.copyFileSync(path.join(pdir, 'f0000.jpg'), path.join(media, `poster-${c.name}.jpg`));
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest));

// Sound toggle source: the audio track of B's edit.
swift('extract-audio.swift', [SRC_B, path.join(media, 'audio.m4a')]);
console.log(`total frames: ${(total / 1024 / 1024).toFixed(2)} MB`);
