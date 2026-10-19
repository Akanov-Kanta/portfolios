#!/usr/bin/env python3
"""Subset Shippori Mincho to the glyphs this site actually uses.

next/font/google ships every CJK unicode-range slice of the family, and the kanji scattered through the film
pulled ~7 MB of slices. This keeps Latin (basic, Latin-1, Latin Extended-A), punctuation, and only the
kana/kanji found in src/.

  curl -LO https://github.com/google/fonts/raw/main/ofl/shipporimincho/ShipporiMincho-{Regular,SemiBold,ExtraBold}.ttf
  ../../tools/.venv/bin/python scripts/subset-fonts.py <dir with the TTFs>

Re-run whenever new kanji are added to the copy.
"""
import pathlib
import sys

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "fonts"

base = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | set(range(0x2010, 0x2040)) | {0x2190, 0x2192, 0x2197, 0x3000, 0x3001, 0x3002, 0x30FB}
used = set()
for f in (ROOT / "src").rglob("*"):
    if f.suffix in {".ts", ".tsx", ".js", ".css"}:
        used |= {ord(c) for c in f.read_text(encoding="utf-8") if ord(c) > 0x2E80}

src = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
for weight, name in [(400, "Regular"), (600, "SemiBold"), (800, "ExtraBold")]:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "palt", "vert", "vrt2", "vkna"]
    opts.name_IDs = ["*"]
    font = subset.load_font(str(src / f"ShipporiMincho-{name}.ttf"), opts)
    s = subset.Subsetter(opts)
    s.populate(unicodes=sorted(base | used))
    s.subset(font)
    out = OUT / f"shippori-mincho-{weight}.woff2"
    subset.save_font(font, str(out), opts)
    print(f"{out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
print(f"{len(used)} CJK glyphs:", "".join(sorted(chr(u) for u in used)))
