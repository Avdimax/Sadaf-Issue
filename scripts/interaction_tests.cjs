// Remaining interaction tests: reduced-motion + navbar click navigation
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();

  // 4 — reduced motion: no crash, preloader skipped, native scroll, content visible
  const rm = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const rmErrors = [];
  rm.on("pageerror", (e) => rmErrors.push(String(e)));
  await rm.emulateMedia({ reducedMotion: "reduce" });
  await rm.goto("http://localhost:3000/", { waitUntil: "load" });
  await rm.waitForTimeout(1500);
  const rmState = await rm.evaluate(() => ({
    preloaderGone: !document.querySelector('[role="status"]'),
    lenisActive: !!window.__lenis,
    heroTitleOpacity: getComputedStyle(document.querySelector(".hero-title-1")).opacity,
    canScroll: document.body.style.overflow !== "hidden",
  }));
  console.log("4. reduced motion:", JSON.stringify(rmState), "| page errors:", rmErrors.length ? rmErrors : "none");

  // 5 — navbar click navigation (Lenis scrollTo path)
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "load" });
  await page.waitForTimeout(3200);
  await page.evaluate(() => window.__lenis.scrollTo(0, { duration: 0.2 }));
  await page.waitForTimeout(1200);
  await page.locator("nav button", { hasText: "آثار" }).first().click();
  await page.waitForTimeout(2400);
  const y = await page.evaluate(() => window.scrollY);
  const archTop = await page.evaluate(() => document.querySelector("#archipelago").getBoundingClientRect().top + window.scrollY);
  console.log("5. navbar click → archipelago:", Math.round(y), "target ≈", Math.round(archTop), Math.abs(y - archTop) < 400 ? "PASS" : "FAIL");

  // 6 — velocity band direction flip on scroll up
  await page.evaluate(() => window.__lenis.scrollTo(6000, { duration: 0.4 }));
  await page.waitForTimeout(800);
  const ts1 = await page.evaluate(() => {
    const track = document.querySelector('[aria-label="حوزه‌های تخصصی"] > div');
    return track && track.style.transform;
  });
  await page.mouse.wheel(0, -2000);
  await page.waitForTimeout(600);
  const ts2 = await page.evaluate(() => {
    const track = document.querySelector('[aria-label="حوزه‌های تخصصی"] > div');
    return track && track.style.transform;
  });
  console.log("6. velocity band responds (before/after):", (ts1 || "n/a").slice(0, 34), "|", (ts2 || "n/a").slice(0, 34));

  await browser.close();
})();
