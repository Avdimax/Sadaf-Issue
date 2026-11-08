#!/usr/bin/env python3
"""Extract dominant colors from mood boards + build contact sheet of screenshots."""
from PIL import Image
import os

RAW = '/home/z/my-project/assets_raw'
OUT = '/home/z/my-project/assets_work'
os.makedirs(OUT, exist_ok=True)

# ---- 1. Dominant color extraction (mood boards) ----
def dominant_colors(path, n=6):
    img = Image.open(path).convert('RGB')
    img.thumbnail((200, 200))
    q = img.quantize(colors=n, method=Image.MEDIANCUT)
    pal = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)
    out = []
    for cnt, idx in counts[:n]:
        r, g, b = pal[idx*3:idx*3+3]
        out.append((f'#{r:02X}{g:02X}{b:02X}', round(cnt/ (img.size[0]*img.size[1])*100, 1)))
    return out

print('=== MOOD BOARD PALETTES ===')
for f in ['moodboard_img.jpg', 'moodboard_pexels_lux.jpg', 'moodboard_shot1.jpg',
          'moodboard_shot2.jpg', 'moodboard_shot3.jpg', 'moodboard_shot4.jpg', 'moodboard_shot5.jpg']:
    cols = dominant_colors(f'{RAW}/{f}')
    print(f'\n{f}:')
    for hexc, pct in cols:
        print(f'  {hexc}  {pct}%')

# ---- 2. Contact sheet of the 5 phone screenshots ----
shots = ['moodboard_shot1.jpg', 'moodboard_shot2.jpg', 'moodboard_shot3.jpg', 'moodboard_shot4.jpg', 'moodboard_shot5.jpg']
thumb_w = 280
thumbs = []
for f in shots:
    img = Image.open(f'{RAW}/{f}').convert('RGB')
    ratio = img.size[1] / img.size[0]
    t = img.resize((thumb_w, int(thumb_w * ratio)))
    thumbs.append((f, t))

sheet_h = max(t.size[1] for _, t in thumbs) + 30
sheet = Image.new('RGB', (thumb_w * len(thumbs) + 10 * (len(thumbs)+1), sheet_h), (30, 30, 34))
x = 10
for f, t in thumbs:
    sheet.paste(t, (x, 25))
    x += thumb_w + 10
sheet.save('/home/z/my-project/contact_sheet.jpg', quality=80)
print('\nContact sheet saved:', sheet.size)
