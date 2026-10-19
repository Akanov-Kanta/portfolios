# contact sheet: python sheet.py out.jpg cols cellw img...
import sys
from PIL import Image, ImageDraw
out, cols, cw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); files = sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in files]
ch = int(cw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * (cw + 6), rows * (ch + 22)), "#222"); d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(files, ims)):
    im = im.resize((cw, int(cw * im.height / im.width))); x = (i % cols) * (cw + 6); y = (i // cols) * (ch + 22)
    S.paste(im.crop((0, 0, cw, ch)), (x, y + 20)); d.text((x + 2, y + 4), f.split("/")[-1], fill="#fff")
S.save(out, quality=85)
