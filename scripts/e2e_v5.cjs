// ─────────────────────────────────────────────────────────────
// v5 verification — six changes under test:
//  1. Preloader always plays ~2s + smooth handoff
//  2. Hero scroll-away-and-back text bug (incl. mid-intro scroll)
//  3. MoodReel faster runway (464svh, not 695svh)
//  4. North Peak island: deep pine mat under the mark
//  5. Variations workshop: process rail + phases + variant cycle + plaque
//  6. OrderTheater: one question at a time + review + submit
// ─────────────────────────────────────────────────────────────
const { chromium } = require("playwright");

const SHOT_DIR = "/home/z/my-project/shots5";
const results = { consoleWarnings: [], consoleErrors: [], pageErrors: [], failedRequests: [], checks: [] };
const ok = (name, pass, extra = "") => {
  results.checks.push(`${pass ? "PASS" : "FAIL"} — ${name}${extra ? " (" + extra + ")" : ""}`);
  console.log(`${pass ? "✓" : "✗"} ${name}${extra ? " — ${extra}".replace("${extra}", extra) : ""}`);
};

(async () => {
  require("fs").mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const log = (m) => console.log(`\n▸ ${m}`);

  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.setDefaultTimeout(10000);
  page.on("console", (m) => {
    if (m.type() === "warning") results.consoleWarnings.push(m.text().split("\n")[0]);
    if (m.type() === "error") results.consoleErrors.push(m.text().split("\n")[0]);
  });
  page.on("pageerror", (e) => results.pageErrors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) results.failedRequests.push(`${r.status()} ${r.url()}`);
  });

  /* ═══ 1 — Preloader: always plays, ~2s, smooth handoff ═══ */
  log("1 · preloader");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 30000 });
  const t0 = Date.now();
  await page.waitForSelector('[role="status"][aria-label="در حال بارگذاری"]', { timeout: 5000 }).catch(() => {});
  const preloaderSeen = (await page.locator('[role="status"]').count()) > 0;
  ok("Preloader appears on first visit", preloaderSeen);
  await page.screenshot({ path: `${SHOT_DIR}/01-preloader-mid.png` });

  // it should still be visible at 1.0s (counter phase)…
  await page.waitForTimeout(Math.max(0, 1000 - (Date.now() - t0)));
  const stillThere = (await page.locator('[role="status"]').count()) > 0;
  ok("Preloader holds through the ~1s counter", stillThere);

  // …gone by ~3s, with the hero revealed
  await page.waitForTimeout(Math.max(0, 3000 - (Date.now() - t0)));
  const goneBy3s = (await page.locator('[role="status"]').count()) === 0;
  const heroText = await page.textContent("h1").catch(() => "");
  ok("Preloader released by ~3s", goneBy3s);
  ok("Hero headline rendered", (heroText || "").includes("آتلیه صدف"));

  // SECOND load — must play again (no session skip)
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const replay = (await page.locator('[role="status"]').count()) > 0;
  ok("Preloader replays on second visit", replay);
  await page.waitForTimeout(2800);

  /* ═══ 2 — Hero scroll-away-and-back (the reported bug) ═══ */
  log("2 · hero scroll-back");
  const heroState = () => page.evaluate(() => {
    const line = document.querySelector(".brand-title-1");
    const meta = [...document.querySelectorAll(".brand-meta")];
    const emblem = document.querySelector(".brand-emblem");
    const cs = line ? getComputedStyle(line) : null;
    return {
      lineTransform: cs ? cs.transform : "none",
      emblemOpacity: emblem ? getComputedStyle(emblem).opacity : "-1",
      metaOpacities: meta.map((m) => getComputedStyle(m).opacity),
      minMetaOpacity: meta.length ? Math.min(...meta.map((m) => parseFloat(getComputedStyle(m).opacity))) : -1,
      scrollY: Math.round(window.scrollY),
    };
  });

  // case A — scroll away AFTER intro settled, then return
  await page.evaluate(() => window.scrollTo(0, 2600));
  await page.waitForTimeout(900);
  const away = await heroState();
  ok("Scrolling away fades the hero meta", away.minMetaOpacity < 0.35, `minMeta ${away.minMetaOpacity.toFixed(2)}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  const backA = await heroState();
  const identity = backA.lineTransform === "none" || backA.lineTransform === "matrix(1, 0, 0, 1, 0, 0)";
  ok("A · return to top restores headline (identity transform)", identity, backA.lineTransform);
  ok("A · return to top restores meta opacity", backA.minMetaOpacity > 0.95, `minMeta ${backA.minMetaOpacity.toFixed(2)}`);
  ok("A · emblem restored", parseFloat(backA.emblemOpacity) > 0.95, backA.emblemOpacity);
  await page.screenshot({ path: `${SHOT_DIR}/02-hero-returned.png` });

  // case B — the reported killer: scroll DURING the intro, then return.
  // Reload, wait until the curtains are parting (intro mid-flight ~1.7s),
  // scroll immediately, come back and check.
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1700);
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.waitForTimeout(1100);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1100);
  const backB = await heroState();
  const identityB = backB.lineTransform === "none" || backB.lineTransform === "matrix(1, 0, 0, 1, 0, 0)";
  ok("B · mid-intro scroll: return restores headline", identityB, backB.lineTransform);
  ok("B · mid-intro scroll: return restores meta", backB.minMetaOpacity > 0.95, `minMeta ${backB.minMetaOpacity.toFixed(2)}`);
  ok("B · mid-intro scroll: emblem restored", parseFloat(backB.emblemOpacity) > 0.95, backB.emblemOpacity);

  /* ═══ 3 — MoodReel runway is shorter ═══ */
  log("3 · mood reel pace");
  const reel = await page.evaluate(() => {
    const el = document.querySelector('section[aria-label^="مودبوردها"]');
    return { vh: el ? el.offsetHeight / window.innerHeight : 0 };
  });
  ok("MoodReel runway ≈ 4.64 viewports (was 6.95)", Math.abs(reel.vh - 4.64) < 0.35, `${reel.vh.toFixed(2)}vh`);

  /* ═══ 4 — North Peak island: mark sits on a deep pine mat ═══ */
  log("4 · north peak island");
  const islands = page.locator(".island-landmass");
  await islands.nth(2).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1300);
  const npBox = await islands.nth(2).boundingBox();
  if (npBox) {
    await page.mouse.move(npBox.x + npBox.width / 2, npBox.y + npBox.height / 2, { steps: 5 });
    await page.waitForTimeout(1300);
  }
  const npMat = await page.evaluate(() => {
    const stage = document.querySelectorAll(".island-stage")[2]; // 3rd island
    const mat = stage?.querySelector("div");
    const mark = document.querySelectorAll(".island-mark")[2];
    return {
      matBg: mat ? getComputedStyle(mat).backgroundImage.slice(0, 60) : "none",
      matOp: stage ? getComputedStyle(stage).opacity : "-1",
      markOp: mark ? getComputedStyle(mark).opacity : "-1",
    };
  });
  ok("North Peak mat is the snow patch", npMat.matBg.includes("252, 250, 244"), npMat.matBg.slice(0, 48));
  ok("North Peak mark surfaces on hover", parseFloat(npMat.markOp) > 0.9, `mark ${npMat.markOp}`);
  await page.screenshot({ path: `${SHOT_DIR}/03-northpeak-hover.png` });

  /* ═══ 5 — Variations workshop ═══ */
  log("5 · variations workshop");
  const varx = await page.evaluate(() => {
    const el = document.querySelector("#variations");
    return { top: el.offsetTop, h: el.offsetHeight, vh: window.innerHeight };
  });
  const at = (progress) => varx.top + (varx.h - varx.vh) * progress;

  // brand 1 · geometry phase
  await page.evaluate((y) => window.scrollTo(0, y), at(0.02));
  await page.waitForTimeout(900);
  const caption = () => page.evaluate(() => document.querySelector("[data-varx-caption]")?.textContent || "");
  let cap = await caption();
  ok("Workshop opens at the geometry step", cap.includes("هندسه"), cap);
  const gridOp = await page.evaluate(() => {
    const svg = document.querySelector(".varx-stage svg");
    const wrap = svg?.parentElement;
    return wrap ? getComputedStyle(wrap).opacity : "-1";
  });
  ok("Drafting grid visible during geometry", parseFloat(gridOp) > 0.9, `grid ${gridOp}`);
  await page.screenshot({ path: `${SHOT_DIR}/04-varx-geometry.png` });

  // process rail highlights the active step
  const rail = await page.evaluate(() => {
    const active = document.querySelector("[data-step].border-brass\\/60, [data-step] .border-brass\\/60");
    return active ? active.textContent : "none";
  });
  ok("Process rail highlights «هندسه»", (rail || "").includes("هندسه"), rail || "");

  // brand 1 · colour phase
  await page.evaluate((y) => window.scrollTo(0, y), at(0.14));
  await page.waitForTimeout(1100);
  cap = await caption();
  ok("Colour phase arrives", cap.includes("رنگ"), cap);
  const gridOp2 = await page.evaluate(() => {
    const svg = document.querySelector(".varx-stage svg");
    return svg?.parentElement ? getComputedStyle(svg.parentElement).opacity : "-1";
  });
  ok("Grid retired after geometry", parseFloat(gridOp2) < 0.1, `grid ${gridOp2}`);

  // brand 1 · variants phase — auto-cycle runs, plaque flips for white
  await page.evaluate((y) => window.scrollTo(0, y), at(0.235));
  await page.waitForTimeout(1200);
  cap = await caption();
  ok("Variants phase arrives", cap.includes("نسخه"), cap);
  const capBefore = cap;
  await page.waitForTimeout(5800); // > 2 cycles
  const capAfter = await caption();
  ok("Variant auto-cycle advances", capBefore !== capAfter, `${capBefore.slice(-14)} → ${capAfter.slice(-14)}`);

  // manual pick → white → ink plaque on stage
  await page.click("[data-variant='white']");
  await page.waitForTimeout(900);
  const plaque = await page.evaluate(() => {
    const p = document.querySelector("[data-varx-plaque]");
    return p ? getComputedStyle(p).opacity : "-1";
  });
  ok("White variant raises the ink plaque", parseFloat(plaque) > 0.9, `plaque ${plaque}`);
  cap = await caption();
  ok("Caption reads the white-on-dark note", cap.includes("تیره"), cap);
  await page.screenshot({ path: `${SHOT_DIR}/05-varx-white-plaque.png` });

  // brand 2 switch on scroll
  await page.evaluate((y) => window.scrollTo(0, y), at(0.26));
  await page.waitForTimeout(1100);
  const brand2 = await page.evaluate(() => document.querySelector(".varx-meta-in h3")?.textContent || "");
  ok("Scroll reaches the second island (هور)", brand2 === "هور", brand2);
  await page.screenshot({ path: `${SHOT_DIR}/06-varx-hoor.png` });

  // tiles — all three present
  const tiles = await page.evaluate(() => ({
    color: !!document.querySelector("[data-variant='color']"),
    black: !!document.querySelector("[data-variant='black']"),
    white: !!document.querySelector("[data-variant='white']"),
  }));
  ok("Variant sheet shows all three tiles", tiles.color && tiles.black && tiles.white, JSON.stringify(tiles));

  /* ═══ 6 — OrderTheater: one question at a time ═══ */
  log("6 · order theater");
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(900);
  await page.click("text=شروعِ سفارش");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT_DIR}/07-theater-q1.png` });

  const dialogText = () => page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText || "");
  let dt = await dialogText();
  ok("Theater opens on question 1 of 13", dt.includes("پرسش ۱") && dt.includes("از ۱۳"), "");
  ok("One question at a time — only the brand question shown", dt.includes("نامِ برند") && !dt.includes("شخصیتِ برند"), "");

  // type the brand name, Enter → question 2
  await page.keyboard.type("گلخانه‌ی مِهر", { delay: 8 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  dt = await dialogText();
  ok("Enter advances to question 2", dt.includes("پرسش ۲") && dt.includes("زمینه"), "");

  // single-choice chip auto-advances
  await page.click('[role="dialog"] button[aria-pressed]:has-text("کافه و رستوران")');
  await page.waitForTimeout(800);
  dt = await dialogText();
  ok("Chip pick auto-advances to question 3", dt.includes("پرسش ۳"), "");
  await page.screenshot({ path: `${SHOT_DIR}/08-theater-auto-advance.png` });

  // walk the rest of the conversation to the review.
  // (break on «ویرایش» — that text only exists ON the review table;
  // the last question's button also says «مرورِ بریف».)
  const walk = async () => {
    for (let guard = 0; guard < 30; guard++) {
      const t = await dialogText();
      if (t.includes("ویرایش")) return true;
      const hasInput = await page.evaluate(() => {
        const el = document.activeElement;
        return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      });
      if (hasInput) {
        await page.keyboard.type("پاسخِ آزمونی", { delay: 3 });
        await page.keyboard.press("Enter");
        await page.waitForTimeout(320);
      } else {
        const clicked = await page.evaluate(() => {
          const btns = [...document.querySelectorAll('[role="dialog"] button[aria-pressed]')];
          const anyOn = btns.some((b) => b.getAttribute("aria-pressed") === "true");
          if (!anyOn) {
            btns[0]?.click();
            return "chip";
          }
          return "next";
        });
        if (clicked === "next") {
          await page.evaluate(() => {
            const btns = [...document.querySelectorAll('[role="dialog"] button')];
            const next = btns.find((b) => (b.textContent || "").trim() === "ادامه" || (b.textContent || "").includes("مرورِ بریف"));
            next?.click();
          });
          await page.waitForTimeout(320);
        } else {
          await page.waitForTimeout(750); // let the auto-advance fire
        }
      }
    }
    return false;
  };
  const reachedReview = await walk();
  ok("Conversation walks itself to the review", reachedReview, "");
  dt = await dialogText();
  const rowCount = await page.evaluate(
    () => document.querySelectorAll('[role="dialog"] .divide-y > div').length
  );
  ok("Review lists all 13 answers", rowCount === 13, `${rowCount} rows`);
  await page.screenshot({ path: `${SHOT_DIR}/09-theater-review.png` });

  // edit jump — back to question 1
  await page.evaluate(() => {
    const edit = [...document.querySelectorAll('[role="dialog"] button')].find((b) => (b.textContent || "").includes("ویرایش"));
    edit?.click();
  });
  await page.waitForTimeout(600);
  dt = await dialogText();
  ok("«ویرایش» jumps back to the question", dt.includes("پرسش ۱") && dt.includes("نامِ برند"), "");
  await page.keyboard.press("Control+a");
  await page.keyboard.type("گلخانه‌ی مِهر — ویرایش‌شده", { delay: 5 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await walk();
  dt = await dialogText();
  ok("Edited name appears in the review", dt.includes("ویرایش‌شده"), "");

  // submit → success (exercises the API end-to-end)
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('[role="dialog"] button')];
    const send = btns.find((b) => (b.textContent || "").includes("ارسالِ بریف"));
    send?.click();
  });
  await page.waitForTimeout(1600);
  dt = await dialogText();
  ok("Brief submits successfully (ref code returned)", dt.includes("بریفِ شما رسید") && /SD-[A-Z0-9]{5}/.test(dt), "");
  await page.screenshot({ path: `${SHOT_DIR}/10-theater-success.png` });

  /* ═══ Mobile spot check ═══ */
  log("7 · mobile");
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mob.on("pageerror", (e) => results.pageErrors.push("MOBILE " + String(e)));
  await mob.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await mob.waitForTimeout(3200);
  await mob.screenshot({ path: `${SHOT_DIR}/11-mobile-hero.png` });
  await mob.evaluate(() => document.querySelector("#variations").scrollIntoView({ block: "start" }));
  await mob.waitForTimeout(1400);
  await mob.screenshot({ path: `${SHOT_DIR}/12-mobile-varx.png` });
  const mobRail = await mob.evaluate(() => {
    const steps = document.querySelectorAll("[data-step]");
    const overflow = [...steps].some((s) => s.getBoundingClientRect().right > window.innerWidth + 4);
    return { count: steps.length, overflow };
  });
  ok("Mobile process rail wraps without overflow", mobRail.count === 4 && !mobRail.overflow, JSON.stringify(mobRail));

  /* ═══ Report ═══ */
  console.log("\n──────────────────────");
  const fails = results.checks.filter((c) => c.startsWith("FAIL"));
  console.log(`checks: ${results.checks.length - fails.length}/${results.checks.length} passed`);
  if (results.consoleErrors.length) console.log("console errors:", results.consoleErrors.slice(0, 6));
  if (results.pageErrors.length) console.log("page errors:", results.pageErrors.slice(0, 6));
  if (results.failedRequests.length) console.log("failed requests:", results.failedRequests.slice(0, 6));
  if (fails.length) console.log("FAILURES:\n" + fails.join("\n"));
  await browser.close();
})();
