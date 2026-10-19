import sys, os, glob
from PIL import Image, ImageDraw
# usage: sheet.py <slugdir>  -> writes sheet_pages.jpg (desktop stops + phone) and sheet_seq_<name>.jpg
d = sys.argv[1]

def grid(files, out, W=480, H=300, cols=4):
    if not files: return
    rows = (len(files) + cols - 1) // cols
    s = Image.new('RGB', (W * cols, (H + 16) * rows), (120, 0, 0))
    dr = ImageDraw.Draw(s)
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB'); im.thumbnail((W, H))
        x = (i % cols) * W; y = (i // cols) * (H + 16)
        s.paste(im, (x, y + 16)); dr.text((x + 4, y + 2), os.path.basename(f)[:60], fill=(255, 255, 0))
    s.save(out, quality=72)

pages = [os.path.join(d, n) for n in ['d0_loaded.jpg', 'd0.jpg', 'd1.jpg', 'd2.jpg', 'd3.jpg', 'd4.jpg', 'd5.jpg', 'd6.jpg', 'd7.jpg', 'd_hover.jpg', 'd_project.jpg', 'd_project2.jpg'] if os.path.exists(os.path.join(d, n))]
grid(pages, os.path.join(d, 'sheet_pages.jpg'))
ph = [os.path.join(d, n) for n in ['m0.jpg', 'm1.jpg'] if os.path.exists(os.path.join(d, n))]
grid(ph, os.path.join(d, 'sheet_phone.jpg'), W=260, H=563, cols=2)
for sq in sorted(glob.glob(os.path.join(d, 'seq_*'))):
    fs = sorted(glob.glob(os.path.join(sq, '*.jpg')))
    grid(fs, os.path.join(d, 'sheet_' + os.path.basename(sq) + '.jpg'), W=360, H=225, cols=6)
print('ok', d)
