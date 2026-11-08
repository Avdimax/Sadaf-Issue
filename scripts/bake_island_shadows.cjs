// Bake soft drop-shadows INTO the island mark PNGs.
// A runtime CSS drop-shadow re-rasterizes the animated (logo-bob) subtree
// every frame; a pre-baked shadow costs literally nothing at runtime and
// looks identical. Output: /work/<name>-island.png (original + shadow).
const sharp = require("/home/z/my-project/node_modules/sharp");

const JOBS = [
  { src: "/work/hoor-color.png", out: "/work/hoor-island.png", rgb: [30, 22, 15], alpha: 0.42 },
  { src: "/work/northpeak-color.png", out: "/work/northpeak-island.png", rgb: [16, 32, 24], alpha: 0.44 },
  { src: "/work/soha-color.png", out: "/work/soha-island.png", rgb: [20, 30, 18], alpha: 0.42 },
];

const ROOT = "/home/z/my-project/public";
const BLUR = 9;      // gaussian sigma
const OFFSET_Y = 10; // shadow sits slightly below the mark
const PAD = 40;      // canvas padding for the shadow spread

(async () => {
  for (const job of JOBS) {
    const src = `${ROOT}${job.src}`;
    const meta = await sharp(src).metadata();
    const W = meta.width, H = meta.height;

    // blurred alpha mask of the mark
    const mask = await sharp(src).ensureAlpha().extractChannel(3).blur(BLUR).raw().toBuffer();

    // build the shadow RGBA layer (rgb constant, a = blurred alpha × opacity)
    const shadow = Buffer.alloc(W * H * 4);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
      shadow[p] = job.rgb[0];
      shadow[p + 1] = job.rgb[1];
      shadow[p + 2] = job.rgb[2];
      shadow[p + 3] = Math.round((mask[i] / 255) * job.alpha * 255);
    }

    const CW = W + PAD * 2, CH = H + PAD * 2;
    const out = await sharp({
      create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        {
          input: shadow,
          raw: { width: W, height: H, channels: 4 },
          left: PAD,
          top: PAD + OFFSET_Y,
        },
        { input: src, left: PAD, top: PAD },
      ])
      .png({ compressionLevel: 9 })
      .toFile(`${ROOT}${job.out}`);

    console.log(`✓ ${job.out} (${CW}x${CH}, ${Math.round(out.size / 1024)}KB)`);
  }
})();
