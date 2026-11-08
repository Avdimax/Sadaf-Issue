// Performance audit: network weight, font count, long tasks during scroll, FPS
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  // Track requests
  const seen = new Map();
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes("_next/static") || u.includes("fonts") || u.includes("/work/") || u.includes("/mood/") || u.includes("portrait")) {
      seen.set(u, { type: guessType(u), status: r.status() });
    }
  });
  function guessType(u) {
    if (u.endsWith(".woff2") || u.includes("fonts.googleapis") || u.includes(".woff")) return "font";
    if (u.endsWith(".js")) return "js";
    if (/\.(png|jpg|jpeg|webp|avif|svg)/.test(u)) return "image";
    if (u.endsWith(".css")) return "css";
    return "other";
  }

  await page.goto("http://localhost:3000/", { waitUntil: "load" });
  await page.waitForTimeout(3500);

  const net = await page.evaluate(() => {
    const res = performance.getEntriesByType("resource");
    const fonts = res.filter((r) => r.name.includes("woff2") || r.name.includes(".woff"));
    const imgs = res.filter((r) => /\.(png|jpg|jpeg|webp|avif)/.test(r.name));
    const scripts = res.filter((r) => r.name.endsWith(".js"));
    const total = res.reduce((a, r) => a + r.transferSize, 0);
    return {
      fontCount: fonts.length,
      fontKB: Math.round(fonts.reduce((a, r) => a + r.transferSize, 0) / 1024),
      imgCount: imgs.length,
      imgKB: Math.round(imgs.reduce((a, r) => a + r.transferSize, 0) / 1024),
      jsCount: scripts.length,
      jsKB: Math.round(scripts.reduce((a, r) => a + r.transferSize, 0) / 1024),
      totalKB: Math.round(total / 1024),
      fontURLs: fonts.map((f) => f.name.split("/").pop().split("?")[0]),
    };
  });
  console.log("── Network (first load) ──");
  console.log(JSON.stringify(net, null, 1));

  // Long tasks + FPS during a full scroll pass
  await page.evaluate(() => {
    window.__longTasks = [];
    window.__frames = 0;
    try {
      new PerformanceObserver((l) => {
        l.getEntries().forEach((e) => window.__longTasks.push(Math.round(e.duration)));
      }).observe({ entryTypes: ["longtask"] });
    } catch {}
    let last = performance.now();
    const loop = (t) => {
      if (t - last >= 1000 / 60) { window.__frames++; last = t; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  // Scroll from top to bottom through every runway (wheel = Lenis path)
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1200);

  const perf = await page.evaluate(() => ({
    longTasks: window.__longTasks,
    worstTask: Math.max(0, ...window.__longTasks),
    approxFPS: window.__frames,
  }));
  // frames counted across the whole scroll window (~60 * 160ms + 1200 ≈ 10.8s)
  console.log("\n── Runtime (full scroll pass ~10.8s) ──");
  console.log("long tasks (>50ms):", perf.longTasks.length ? perf.longTasks.join(", ") + " ms" : "none");
  console.log("worst long task:", perf.worstTask + " ms");
  console.log("approx rAF rate:", (perf.approxFPS / 10.8).toFixed(1), "fps target 60");

  // DOM size + layer sanity
  const dom = await page.evaluate(() => ({
    nodes: document.getElementsByTagName("*").length,
    willChange: [...document.querySelectorAll("*")].filter((el) => getComputedStyle(el).willChange !== "auto").length,
  }));
  console.log("\n── DOM ──");
  console.log(JSON.stringify(dom));

  await browser.close();
})();
