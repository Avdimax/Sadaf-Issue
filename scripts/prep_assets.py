#!/usr/bin/env python3
"""Prepare all web assets: crop screenshots, resize, trim logo padding, optimize."""
from PIL import Image
import os

RAW = '/home/z/my-project/assets_raw'
OUT = '/home/z/my-project/assets_web'
os.makedirs(OUT, exist_ok=True)

# ---- 1. Crop phone screenshots to image content (with small inset margin) ----
crops = {
    'moodboard_shot1.jpg': (0.375, 0.655),   # perfume boutique vitrine
    'moodboard_shot2.jpg': (0.405, 0.565),   # dark gradient gold hairline
    'moodboard_shot3.jpg': (0.405, 0.625),   # burgundy velvet soft
    'moodboard_shot4.jpg': (0.405, 0.625),   # burgundy silk glossy
    'moodboard_shot5.jpg': (0.375, 0.655),   # burgundy satin swirls
}
for f, (top, bot) in crops.items():
    img = Image.open(f'{RAW}/{f}').convert('RGB')
    w, h = img.size
    cropped = img.crop((0, int(h*top), w, int(h*bot)))
    # upscale width a touch for quality, keep aspect
    cropped = cropped.resize((1200, int(cropped.size[1] * 1200 / cropped.size[0])), Image.LANCZOS)
    cropped.save(f'{OUT}/{f[:-4]}.jpg', quality=88)
    print(f'{f} -> {cropped.size}')

# ---- 2. Resize large photos ----
img = Image.open(f'{RAW}/moodboard_pexels_lux.jpg').convert('RGB')  # alpine 4376x2898
img = img.resize((2000, int(img.size[1] * 2000 / img.size[0])), Image.LANCZOS)
img.save(f'{OUT}/moodboard_alpine.jpg', quality=88)
print('moodboard_alpine.jpg', img.size)

img = Image.open(f'{RAW}/moodboard_img.jpg').convert('RGB')  # café 1080x705
img = img.resize((1200, int(img.size[1] * 1200 / img.size[0])), Image.LANCZOS)
img.save(f'{OUT}/moodboard_cafe.jpg', quality=88)
print('moodboard_cafe.jpg', img.size)

# ---- 3. Trim transparent padding from logos ----
def trim(im, pad=24):
    bbox = im.getbbox()
    if bbox:
        l, t, r, b = bbox
        l = max(0, l - pad); t = max(0, t - pad)
        r = min(im.size[0], r + pad); b = min(im.size[1], b + pad)
        return im.crop((l, t, r, b))
    return im

logos = {
    'logo_hoor_original.png': 'logo_hoor_color.png',
    'logo_hoor_bw.png': 'logo_hoor_bw.png',
    'logo_northpeak.png': 'logo_northpeak_color.png',
    'logo_northpeak_dark.png': 'logo_northpeak_black.png',
    'logo_soha.png': 'logo_soha_color.png',
    'logo_soha_black.png': 'logo_soha_black.png',
    'logo_golden_gradient.png': 'logo_nabavi_gradient.png',
    'logo_golden_transparent.png': 'logo_nabavi_gold.png',
    'logo_transparent_a.png': 'logo_nabavi_dark.png',
}
for src, dst in logos.items():
    img = Image.open(f'{RAW}/{src}').convert('RGBA')
    img = trim(img)
    # cap width at 1400px
    if img.size[0] > 1400:
        img = img.resize((1400, int(img.size[1] * 1400 / img.size[0])), Image.LANCZOS)
    img.save(f'{OUT}/{dst}', optimize=True)
    print(f'{dst} {img.size}')

# ---- 4. Stats for reference ----
total = sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT))
print(f'\nTotal size: {total/1024/1024:.2f} MB')
for f in sorted(os.listdir(OUT)):
    print(f'  {f}  {os.path.getsize(f"{OUT}/{f}")//1024} KB')
