// Inspect work logo PNGs: size + channel stats to plan white/black variant generation
const sharp = require("/home/z/my-project/node_modules/sharp");
const fs = require("fs");
const dir = "/home/z/my-project/public/work";

(async () => {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
  for (const f of files) {
    const p = `${dir}/${f}`;
    const img = sharp(p);
    const meta = await img.metadata();
    const stats = await img.stats();
    // dominant-ish tone: mean of RGB where alpha high
    const [r, g, b, a] = stats.channels.map((c) => Math.round(c.mean));
    console.log(
      `${f.padEnd(22)} ${String(meta.width).padStart(5)}x${String(meta.height).padStart(5)} alpha-mean=${(a ?? 255) / 255 < 0.05 ? "opaque" : (a / 255).toFixed(2)} rgb=(${r},${g},${b})`
    );
  }
})();
