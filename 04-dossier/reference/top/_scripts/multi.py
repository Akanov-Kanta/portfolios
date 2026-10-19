import sys,os
from PIL import Image, ImageDraw
out=sys.argv[1]; slugs=sys.argv[2:]; names=['d0.jpg','d1.jpg','d2.jpg','d3.jpg','d5.jpg','m0.jpg']
W,H=400,250; s=Image.new('RGB',(W*len(names),(H+16)*len(slugs)),(90,0,0)); d=ImageDraw.Draw(s)
for r,sl in enumerate(slugs):
  for c,n in enumerate(names):
    p=os.path.join(sl,n)
    if not os.path.exists(p): continue
    im=Image.open(p).convert('RGB'); im.thumbnail((W,H)); s.paste(im,(c*W,r*(H+16)+16)); d.text((c*W+4,r*(H+16)+2),sl+'/'+n,fill=(255,255,0))
s.save(out,quality=72)
