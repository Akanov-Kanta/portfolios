#!/usr/bin/env python3
"""Build the film's image assets into public/art/.

Run with the tools venv (Pillow + numpy):
  ../../tools/.venv/bin/python scripts/build-art.py

Sources live outside the repo in ../../art:
  shots/  generated anime-cel layers (characters already keyed to RGBA)
  pd/     public-domain ukiyo-e prints (see pd/manifest.json)
"""
import pathlib

import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT.parent.parent / "art"
OUT = ROOT / "public" / "art"

INK, INK2, CRIMSON, GOLD, RICE, STEEL = "#0B1622", "#16283A", "#9E1B1B", "#C9A24A", "#ECE6D8", "#5FA8D3"


def rgb(h: str) -> np.ndarray:
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def save_webp(img: Image.Image, path: pathlib.Path, quality: int = 90) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    kw = {"quality": quality, "method": 6}
    if img.mode == "RGBA":
        kw["alpha_quality"] = 100
    img.save(path, "WEBP", **kw)
    print(f"{path.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {path.stat().st_size // 1024} KB")


def fit(img: Image.Image, long_side: int) -> Image.Image:
    w, h = img.size
    k = long_side / max(w, h)
    if k >= 1:
        return img
    return img.resize((round(w * k), round(h * k)), Image.LANCZOS)


def tritone(img: Image.Image, stops: list[str], contrast: float = 1.25, levels: int = 0) -> Image.Image:
    """Map luminance through a palette ramp (dark → light). Optional posterize keeps it print-flat."""
    a = np.asarray(img.convert("RGB")).astype(np.float32) / 255
    lum = a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114
    lo, hi = np.percentile(lum, 2), np.percentile(lum, 98)
    t = np.clip((lum - lo) / max(1e-3, hi - lo), 0, 1)
    t = np.clip((t - 0.5) * contrast + 0.5, 0, 1)
    if levels:
        t = np.round(t * (levels - 1)) / (levels - 1)
    cols = [rgb(s) for s in stops]
    seg = len(cols) - 1
    x = t * seg
    i = np.clip(np.floor(x).astype(int), 0, seg - 1)
    f = (x - i)[..., None]
    c0 = np.stack(cols)[i]
    c1 = np.stack(cols)[i + 1]
    out = c0 + (c1 - c0) * f
    return Image.fromarray(out.astype(np.uint8))


def shots() -> None:
    src = ART / "shots"
    # background plates: full frame, opaque
    for n in ["s2-bg", "s3-bg", "s4-bg", "s5-bg", "s6-bg"]:
        save_webp(Image.open(src / f"{n}.png").convert("RGB"), OUT / f"{n}.webp", 88)
    # the s1 sky is flat enough to trace: rasterise the vtracer SVG large for crisp edges
    sky_png = ART / "shots" / "s1-sky@2x.png"
    sky = Image.open(sky_png if sky_png.exists() else src / "s1-sky.png").convert("RGB")
    save_webp(fit(sky, 2880), OUT / "s1-sky.webp", 88)
    # foreground layers keep alpha; trim fully transparent margins
    # (the other characters are sprites now: scripts/build-sprites.py; s2-ronin is the meditation still the wind shader animates)
    for n in ["s1-roof", "s2-ronin"]:
        im = Image.open(src / f"{n}.png").convert("RGBA")
        bbox = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        save_webp(im.crop(bbox) if bbox else im, OUT / f"{n}.webp", 90)


def pd() -> None:
    src = ART / "pd"
    jobs = [
        # file, crop box as fractions (l, t, r, b), stops, contrast, levels, out name
        ("aic-236656-ganku-dragon-tiger-gold-screen.jpg", (0.19, 0.175, 0.67, 0.79), [INK, "#7A5E22", GOLD, "#E6CC85"], 1.35, 0, "pd-ganku-tiger"),
        ("met-44918-korin-rough-waves.jpg", (0.025, 0.02, 0.975, 0.985), [INK, INK2, "#8C7A4E", GOLD], 1.3, 0, "pd-korin-waves"),
        ("aic-77333-hokusai-great-wave.jpg", (0.0, 0.0, 1.0, 1.0), [INK, "#1F4A6B", STEEL, RICE], 1.2, 0, "pd-great-wave"),
        ("aic-102617-yoshitoshi-kezori-giant-moon.jpg", (0.0, 0.0, 1.0, 1.0), [INK, "#5A1013", CRIMSON, RICE], 1.15, 0, "pd-giant-moon"),
        ("aic-28302-shunsho-tsuna-vs-rashomon-demon.jpg", (0.0, 0.0, 1.0, 1.0), [INK, CRIMSON, "#E2401C", RICE], 1.3, 6, "pd-tsuna-demon"),
        ("aic-50554-kuniyoshi-chushingura-night-attack.jpg", (0.0, 0.0, 1.0, 1.0), [INK, INK2, STEEL, RICE], 1.25, 0, "pd-night-attack"),
        ("aic-47686-hiroshige-plum-against-moon.jpg", (0.0, 0.0, 1.0, 1.0), [INK, INK2, CRIMSON, RICE], 1.2, 0, "pd-plum-moon"),
    ]
    for f, box, stops, con, lv, name in jobs:
        im = Image.open(src / f).convert("RGB")
        w, h = im.size
        im = im.crop((round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)))
        im = fit(im, 2400)
        save_webp(tritone(im.filter(ImageFilter.MedianFilter(3)), stops, con, lv), OUT / f"{name}.webp", 80)


if __name__ == "__main__":
    shots()
    pd()
