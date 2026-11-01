# shrink the catch pictures (4 greys, about 20 KB) -- the 24 devotional pictures are left as they are
import json, os
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
C = json.load(open(os.path.join(ROOT, 'netlify/functions/lib/catch.json'))); n = 0
for k in C['fish']:
    f = os.path.join(ROOT, 'w/img', k.lower() + '.png'); im = Image.open(f)
    if im.mode == 'P': continue
    im.convert('L').quantize(colors=4).save(f, optimize=True); n += 1
print(n, 'shrunk')
