// Generate knocked-out WHITE (reversed) logo variants.
// Takes each brand's primary mark and maps every pixel's RGB to pure white
// while preserving the alpha channel — the classic reversed-logo treatment
// that sits on dark grounds in brand guideline sheets.
const sharp = require("/home/z/my-project/node_modules/sharp");
const fs = require("fs");

const SRC = "/home/z/my-project/public/work";
const OUT = "/home/z/my-project/public/work";

const JOBS = [
  // source (full-detail primary) → white variant
  { from: "oxin-gradient.png", to: "oxin-white.png" },
  { from: "hoor-color.png", to: "hoor-white.png" },
  { from: "northpeak-color.png", to: "northpeak-white.png" },
  { from: "soha-color.png", to: "soha-white.png" },
];

// Boost alpha slightly so fine strokes stay visible when recolored
const alphaBoost = (a) => Math.min(255, Math.round(Math.pow(a / 255, 0.82) * 255));

(async () => {
  for (const job of JOBS) {
    const from = `${SRC}/${job.from}`;
    const to = `${OUT}/${job.to}`;
    const { data, info } = await sharp(from)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const out = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += info.channels) {
      const a = data[i + 3];
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = alphaBoost(a);
    }

    await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .png({ compressionLevel: 9, palette: false })
      .toFile(to);

    const kb = Math.round(fs.statSync(to).size / 1024);
    console.log(`✓ ${job.to} (${info.width}x${info.height}, ${kb}KB) ← ${job.from}`);
  }
})();
