// Full end-to-end verification of the portfolio page
const { chromium } = require("playwright");

const SHOT_DIR = "/home/z/my-project/shots3";
const results = { consoleWarnings: [], consoleErrors: [], pageErrors: [], failedRequests: [], checks: [] };
const ok = (name, pass, extra = "") => {
  results.checks.push(`${pass ? "PASS" : "FAIL"} — ${name}${extra ? " (" + extra + ")" : ""}`);
};

(async () => {
  require("fs").mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch();

  /* ───────── Desktop pass ───────── */
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on("console", (m) => {
    if (m.type() === "warning") results.consoleWarnings.push(m.text().split("\n")[0]);
    if (m.type() === "error") results.consoleErrors.push(m.text().split("\n")[0]);
  });
  page.on("pageerror", (e) => results.pageErrors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) results.failedRequests.push(`${r.status()} ${r.url()}`);
  });

  await page.goto("http://localhost:3000/", { waitUntil: "load" });
  await page.waitForTimeout(3200); // preloader (first visit) + intro

  // 1 — hero rendered
  const heroTitle = await page.textContent("h1");
  ok("Hero renders", heroTitle && heroTitle.includes("طراحِ لوگو"));

  // 2 — preloader gone
  const preloaderGone = (await page.locator('[role="status"]').count()) === 0;
  ok("Preloader dismissed", preloaderGone);

  await page.screenshot({ path: `${SHOT_DIR}/01-hero.png` });

  // 3 — cursor: move mouse, check dot & ring transforms update
  await page.mouse.move(800, 400);
  await page.mouse.move(900, 500);
  await page.waitForTimeout(400);
  const ringT = await page.evaluate(() => {
    const rings = document.querySelectorAll("[aria-hidden] .rounded-full.border");
    for (const r of rings) {
      const t = r.style.transform;
      if (t.includes("translate3d")) return t;
    }
    return "";
  });
  ok("Cursor ring tracks pointer", ringT.includes("translate3d"), ringT.slice(0, 60));

  // cursor velocity stretch after fast flick
  await page.mouse.move(200, 200);
  await page.mouse.move(1400, 700, { steps: 8 });
  const stretchT = await page.evaluate(() => {
    const els = document.querySelectorAll('div[style*="will-change"]');
    for (const r of els) {
      if (r.className.includes("border-brass")) return r.style.transform;
    }
    return "";
  });
  ok("Cursor velocity stretch", /scale\([\d.]+,/.test(stretchT), stretchT.slice(0, 80));

  // 4 — island hover: veil opacity rises on hover (CSS-driven now)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const island = page.locator(".island-landmass").first();
  await island.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const veilBefore = await page.evaluate(() => getComputedStyle(document.querySelector(".island-veil")).opacity);
  await island.hover();
  await page.waitForTimeout(1600);
  const veilAfter = await page.evaluate(() => getComputedStyle(document.querySelector(".island-veil")).opacity);
  ok("Island hover → veil awakens", parseFloat(veilAfter) > parseFloat(veilBefore) + 0.2, `${veilBefore} → ${veilAfter}`);

  // 5 — mark surfaces on hover
  const markOp = await page.evaluate(() => getComputedStyle(document.querySelector(".island-mark")).opacity);
  ok("Island hover → mark surfaces", parseFloat(markOp) > 0.9, `opacity ${markOp}`);

  await page.screenshot({ path: `${SHOT_DIR}/02-island-hover.png` });

  // 6 — scroll to MoodReel, verify layers + image decode
  await page.evaluate(() => document.querySelector('[aria-label="مودبوردها — فضای پیش از هر نشان"]').scrollIntoView());
  await page.waitForTimeout(1200);
  const reelImgs = await page.evaluate(() => {
    const layers = document.querySelectorAll(".reel-layer");
    return Array.from(layers).map((l) => {
      const img = l.querySelector("img");
      return img ? img.complete && img.naturalWidth > 0 : false;
    });
  });
  ok("MoodReel frames load", reelImgs.filter(Boolean).length >= 1, `${reelImgs.filter(Boolean).length}/7 decoded`);

  // 7 — scroll through Variations, check parallax writes
  await page.evaluate(() => document.querySelector("#variations").scrollIntoView());
  await page.waitForTimeout(800);
  const paraBefore = await page.evaluate(() => document.querySelector(".var-logo").style.transform);
  await page.mouse.wheel(0, 2400);
  await page.waitForTimeout(900);
  const paraAfter = await page.evaluate(() => {
    const logos = document.querySelectorAll(".var-logo");
    return logos[logos.length - 1].style.transform;
  });
  ok("Variations parallax writes transforms", paraAfter.includes("translate3d"), paraAfter.slice(0, 50));

  // 8 — velocity band reacts to scroll
  const velX = await page.evaluate(() => document.querySelector('[aria-label="حوزه‌های تخصصی"] > div').style.transform);
  ok("VelocityBand translating", velX.includes("translate3d") || velX.includes("translate"), velX.slice(0, 50));

  // 9 — progress bar updates
  const prog = await page.evaluate(() => document.querySelector(".origin-right.fixed").style.transform);
  ok("Scroll progress hairline active", /scaleX\((0|[0-9.]+)\)/.test(prog), prog);

  // 10 — craft + footer render
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView());
  await page.waitForTimeout(1200);
  const footerText = await page.textContent("footer#contact");
  ok("Footer renders", footerText.includes("نشانِ شما را بسازیم"));
  await page.screenshot({ path: `${SHOT_DIR}/03-footer.png` });

  // 11 — image reveal classes applied
  const revealed = await page.evaluate(() => document.querySelectorAll(".img-reveal.is-loaded").length);
  ok("Images revealed on load", revealed > 0, `${revealed} revealed`);

  // 12 — smooth scroll length (runway heights applied)
  const runway = await page.evaluate(() => document.querySelector("#variations").style.height);
  ok("Variations runway height set", runway.includes("calc"), runway);

  /* ───────── Mobile pass ───────── */
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mob.on("pageerror", (e) => results.pageErrors.push("MOBILE: " + String(e)));
  await mob.goto("http://localhost:3000/", { waitUntil: "load" });
  await mob.waitForTimeout(3000);
  await mob.screenshot({ path: `${SHOT_DIR}/04-mobile-hero.png` });
  // touch: islands awake without hover
  const mobVeil = await mob.evaluate(() => getComputedStyle(document.querySelector(".island-veil")).opacity);
  ok("Mobile: islands awake by default", parseFloat(mobVeil) > 0.5, `veil ${mobVeil}`);
  const mobMark = await mob.evaluate(() => getComputedStyle(document.querySelector(".island-mark")).opacity);
  ok("Mobile: marks visible", parseFloat(mobMark) > 0.8, `mark ${mobMark}`);
  await mob.evaluate(() => document.querySelector("#archipelago").scrollIntoView());
  await mob.waitForTimeout(1000);
  await mob.screenshot({ path: `${SHOT_DIR}/05-mobile-island.png` });

  /* ───────── Repeat visit (preloader skip) ───────── */
  const revisit = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await revisit.goto("http://localhost:3000/", { waitUntil: "load" });
  await revisit.evaluate(() => sessionStorage.setItem("atelier-intro-seen", "1"));
  await revisit.goto("http://localhost:3000/", { waitUntil: "load" });
  await revisit.waitForTimeout(700);
  const preSkipped = (await revisit.locator('[role="status"]').count()) === 0;
  ok("Repeat visit skips preloader", preSkipped);

  await browser.close();

  /* ───────── Report ───────── */
  const realWarnings = results.consoleWarnings.filter(
    (w) => !w.includes("Download the React DevTools") && !w.includes("[HMR]")
  );
  console.log("\n══════════ CHECKS ══════════");
  results.checks.forEach((c) => console.log(c));
  console.log("\n══════════ CONSOLE ══════════");
  console.log("warnings:", realWarnings.length ? realWarnings : "none");
  console.log("errors:", results.consoleErrors.length ? results.consoleErrors : "none");
  console.log("page errors:", results.pageErrors.length ? results.pageErrors : "none");
  console.log("failed requests:", results.failedRequests.length ? results.failedRequests : "none");
  const failed = results.checks.filter((c) => c.startsWith("FAIL"));
  console.log(`\n${results.checks.length - failed.length}/${results.checks.length} checks passed`);
  process.exit(failed.length || results.pageErrors.length || results.consoleErrors.length ? 1 : 0);
})();
