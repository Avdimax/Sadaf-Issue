// Full end-to-end verification of the v4 portfolio page
const { chromium } = require("playwright");

const SHOT_DIR = "/home/z/my-project/shots4";
const results = { consoleWarnings: [], consoleErrors: [], pageErrors: [], failedRequests: [], checks: [] };
const ok = (name, pass, extra = "") => {
  results.checks.push(`${pass ? "PASS" : "FAIL"} — ${name}${extra ? " (" + extra + ")" : ""}`);
};

(async () => {
  require("fs").mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const log = (m) => console.log(`▸ ${m}`);

  /* ───────── Desktop pass ───────── */
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.setDefaultTimeout(9000);

  page.on("console", (m) => {
    if (m.type() === "warning") results.consoleWarnings.push(m.text().split("\n")[0]);
    if (m.type() === "error") results.consoleErrors.push(m.text().split("\n")[0]);
  });
  page.on("pageerror", (e) => results.pageErrors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) results.failedRequests.push(`${r.status()} ${r.url()}`);
  });

  log("goto");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3500); // preloader (first visit) + intro

  // 1 — new hero: atelier placeholder
  log("hero checks");
  const heroText = await page.textContent("h1");
  ok("BrandStage hero renders", heroText && heroText.includes("آتلیه صدف"), heroText?.slice(0, 40));
  const badge = await page.locator("text=نشانِ آتلیه — در دستِ ساخت").count();
  ok("Placeholder badge present", badge > 0);
  await page.screenshot({ path: `${SHOT_DIR}/01-hero-placeholder.png` });

  // 2 — no old designer info in hero (moved to last section)
  const heroSrc = await page.evaluate(() => document.querySelector("#top")?.innerText || "");
  ok("Designer info NOT in hero", !heroSrc.includes("۲۵ ساله"));

  // 3 — island 1 hover: softened veil + contained glow
  log("island hover");
  const island = page.locator(".island-landmass").first();
  await island.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  const veilBefore = await page.evaluate(() => getComputedStyle(document.querySelector(".island-veil")).opacity);
  const box = await island.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(1500);
  }
  const veilAfter = await page.evaluate(() => getComputedStyle(document.querySelector(".island-veil")).opacity);
  ok("Island hover → veil gentle (≤0.6)", parseFloat(veilAfter) > parseFloat(veilBefore) + 0.2 && parseFloat(veilAfter) <= 0.6, `${veilBefore} → ${veilAfter}`);
  const markOp = await page.evaluate(() => getComputedStyle(document.querySelector(".island-mark")).opacity);
  ok("Island hover → mark surfaces", parseFloat(markOp) > 0.9, `opacity ${markOp}`);
  await page.screenshot({ path: `${SHOT_DIR}/02-island1-hover-fixed.png` });

  // rim has no glow shadow (quiet hairline)
  const rimShadow = await page.evaluate(() => {
    const rim = document.querySelector(".island-rim > div");
    return rim ? getComputedStyle(rim).boxShadow : "";
  });
  ok("Island rim is a quiet hairline (no 48px glow)", !rimShadow.includes("48px"), rimShadow.slice(0, 50));

  // 4 — variations theater: brand switching on scroll
  log("variations");
  await page.evaluate(() => document.querySelector("#variations").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOT_DIR}/03-variations-oxin.png` });
  const brand1 = await page.evaluate(() => {
    const meta = document.querySelector(".varx-meta-in h3");
    return meta ? meta.textContent : "";
  });
  ok("Variations starts with اکسین", brand1 === "اکسین", brand1 || "none");

  // hover the stage → variation cycles
  const stage = page.locator(".varx-stage");
  const sbox = await stage.boundingBox();
  const srcBefore = await page.evaluate(() => {
    const layers = [...document.querySelectorAll(".varx-layer")];
    const active = layers.find((l) => l.style.opacity === "1");
    return active ? active.querySelector("img")?.getAttribute("src") : "";
  });
  if (sbox) {
    await page.mouse.move(sbox.x + sbox.width / 2, sbox.y + sbox.height / 2, { steps: 5 });
    await page.waitForTimeout(750); // read between the first and second switch
  }
  const srcAfter = await page.evaluate(() => {
    const layers = [...document.querySelectorAll(".varx-layer")];
    const active = layers.find((l) => l.style.opacity === "1");
    return active ? active.querySelector("img")?.getAttribute("src") : "";
  });
  ok("Hover cycles variations", srcBefore !== srcAfter && Boolean(srcAfter), `${(srcBefore || "").split("/").pop()} → ${(srcAfter || "").split("/").pop()}`);
  await page.screenshot({ path: `${SHOT_DIR}/04-variations-hover-cycle.png` });

  // scroll to the end of the runway → last brand (سُها)
  await page.evaluate(() => {
    const el = document.querySelector("#variations");
    el.scrollIntoView({ block: "end" });
  });
  await page.waitForTimeout(1300);
  const brandLast = await page.evaluate(() => {
    const meta = document.querySelector(".varx-meta-in h3");
    return meta ? meta.textContent : "";
  });
  ok("Scroll walks to last brand سُها", brandLast === "سُها", brandLast || "none");
  await page.screenshot({ path: `${SHOT_DIR}/05-variations-soha.png` });
  await page.mouse.move(60, 60);

  // 5 — designer section is LAST content section
  log("designer");
  const order = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("main > section, main > div")].map((s) => s.id || s.className.slice(0, 30));
    const designer = document.getElementById("designer");
    const contact = document.getElementById("contact");
    return { designerAfterCraft: !!designer && !!document.querySelector("#craft"), pos: designer && contact ? designer.compareDocumentPosition(contact) : 0 };
  });
  ok("Designer section after craft, before footer", order.designerAfterCraft && order.pos === 4);
  await page.locator("#designer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const designerText = await page.evaluate(() => document.querySelector("#designer")?.innerText || "");
  ok("Designer info lives in last section", designerText.includes("۲۵ ساله") && designerText.includes("دانشگاه اصفهان"));
  await page.screenshot({ path: `${SHOT_DIR}/06-designer-section.png` });

  // 6 — footer order section + theater opens
  log("footer + theater");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const cta = page.locator("text=شروعِ سفارش").first();
  ok("Order CTA present in footer", await cta.count() > 0);
  await page.screenshot({ path: `${SHOT_DIR}/07-footer-order.png` });
  await cta.click();
  await page.waitForTimeout(900);
  const dialogVisible = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  ok("OrderTheater opens", dialogVisible);
  await page.screenshot({ path: `${SHOT_DIR}/08-theater-act1.png` });

  // 7 — walk the five acts
  log("five acts");
  // act 1: brand name + industry chip
  await page.fill("input[placeholder='مثلاً: اکسین']", "قهوه‌خانه‌ی الماس");
  await page.click("text=کافه و رستوران");
  await page.click("button:has-text('ادامه')");
  await page.waitForTimeout(700);

  // act 2: audience
  const act2 = await page.evaluate(() => document.querySelector('[role="dialog"] h3')?.textContent);
  ok("Act 2 — مخاطب و رقبا", act2 === "مخاطب و رقبا", act2 || "");
  await page.fill("input[placeholder='سن، سلیقه، شهر، سبکِ زندگی…']", "جوانانِ ۲۰ تا ۳۵ سالِ اصفهان");
  await page.click("button:has-text('ادامه')");
  await page.waitForTimeout(700);

  // act 3: spirit — personality chips + colors
  const act3 = await page.evaluate(() => document.querySelector('[role="dialog"] h3')?.textContent);
  ok("Act 3 — روحِ نشان", act3 === "روحِ نشان", act3 || "");
  await page.click('[role="dialog"] button:has-text("صمیمی")');
  await page.click('[role="dialog"] button:has-text("مدرن")');
  await page.click('[role="dialog"] button:has-text("قهوه‌ایِ اسپرسو")');
  await page.click("button:has-text('ادامه')");
  await page.waitForTimeout(700);

  // act 4: field — usage, concepts, timeline, budget
  const act4 = await page.evaluate(() => document.querySelector('[role="dialog"] h3')?.textContent);
  ok("Act 4 — زمینِ بازی", act4 === "زمینِ بازی", act4 || "");
  await page.click('[role="dialog"] button:has-text("تابلو و ویترین")');
  await page.click('[role="dialog"] button:has-text("۲ کانسپت")');
  await page.click('[role="dialog"] button:has-text("حدودِ یک ماه")');
  await page.click('[role="dialog"] button:has-text("۱۵ تا ۳۰ میلیون")');
  await page.screenshot({ path: `${SHOT_DIR}/09-theater-act4.png` });
  await page.click("button:has-text('ادامه')");
  await page.waitForTimeout(700);

  // act 5: contact + submit
  const act5 = await page.evaluate(() => document.querySelector('[role="dialog"] h3')?.textContent);
  ok("Act 5 — تماس", act5?.includes("تماس"), act5 || "");
  await page.fill("input[placeholder='نام و نام‌خانوادگی']", "آرش تست");
  await page.fill("input[placeholder='example@mail.com — ۰۹۱۲…']", "arash@test.com");
  await page.click("button:has-text('ارسالِ بریف')");
  await page.waitForTimeout(2500);
  const doneText = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText || "");
  ok("Brief submitted → success screen", doneText.includes("بریفِ شما رسید"), doneText.slice(0, 60));
  const refCode = (doneText.match(/SD-[A-Z0-9]+/) || [])[0];
  ok("Tracking code issued", Boolean(refCode), refCode || "none");
  await page.screenshot({ path: `${SHOT_DIR}/10-theater-success.png` });

  // close via button
  await page.click("text=بستنِ پرده");
  await page.waitForTimeout(800);
  const dialogClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  ok("Theater closes", dialogClosed);

  // 8 — navbar CTA also opens the theater
  await page.click("nav >> text=سفارش طراحی");
  await page.waitForTimeout(800);
  const navOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
  ok("Navbar CTA opens theater", navOpen);

  // esc closes
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  const escClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
  ok("Escape closes theater", escClosed);

  // 9 — validation: empty brand name blocks advance
  await page.click("nav >> text=سفارش طراحی");
  await page.waitForTimeout(800);
  await page.click("button:has-text('ادامه')");
  await page.waitForTimeout(500);
  const stillAct1 = await page.evaluate(() => document.querySelector('[role="dialog"] h3')?.textContent);
  const hintShown = await page.evaluate(() => document.querySelector('[role="dialog"]')?.innerText.includes("نامِ برند برای شروع لازم است"));
  ok("Validation blocks empty brand name", stillAct1 === "برندِ شما" && hintShown);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // 10 — final visual: back to top full page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOT_DIR}/11-final-hero.png` });

  /* ───────── Mobile pass ───────── */
  log("mobile pass");
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  mobile.setDefaultTimeout(9000);
  mobile.on("pageerror", (e) => results.pageErrors.push("MOBILE: " + String(e)));
  await mobile.goto("http://localhost:3000/", { waitUntil: "load" });
  await mobile.waitForTimeout(3000);
  await mobile.screenshot({ path: `${SHOT_DIR}/12-mobile-hero.png` });
  await mobile.locator(".island-landmass").first().scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(1200);
  const touchVeil = await mobile.evaluate(() => getComputedStyle(document.querySelector(".island-veil")).opacity);
  ok("Mobile: islands permanently awake", parseFloat(touchVeil) > 0.3, `veil ${touchVeil}`);
  await mobile.screenshot({ path: `${SHOT_DIR}/13-mobile-island.png` });
  // variations on touch: auto-cycling
  await mobile.locator("#variations").scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(1000);
  const touchSrc1 = await mobile.evaluate(() => {
    const layers = [...document.querySelectorAll(".varx-layer")];
    const active = layers.find((l) => l.style.opacity === "1");
    return active ? active.querySelector("img")?.getAttribute("src") : "";
  });
  await mobile.waitForTimeout(2600);
  const touchSrc2 = await mobile.evaluate(() => {
    const layers = [...document.querySelectorAll(".varx-layer")];
    const active = layers.find((l) => l.style.opacity === "1");
    return active ? active.querySelector("img")?.getAttribute("src") : "";
  });
  ok("Mobile: variations auto-cycle on touch", touchSrc1 !== touchSrc2);
  await mobile.screenshot({ path: `${SHOT_DIR}/14-mobile-variations.png` });
  // order theater on mobile
  await mobile.locator("#contact").scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(900);
  await mobile.tap("text=شروعِ سفارش");
  await mobile.waitForTimeout(900);
  const mobileDialog = await mobile.evaluate(() => !!document.querySelector('[role="dialog"]'));
  ok("Mobile: theater opens", mobileDialog);
  await mobile.screenshot({ path: `${SHOT_DIR}/15-mobile-theater.png` });

  await browser.close();

  console.log("\n════════ RESULTS ════════");
  results.checks.forEach((c) => console.log(c));
  console.log("\nconsole warnings:", results.consoleWarnings.length, results.consoleWarnings.slice(0, 5));
  console.log("console errors:", results.consoleErrors.length, results.consoleErrors.slice(0, 5));
  console.log("page errors:", results.pageErrors.length, results.pageErrors.slice(0, 5));
  console.log("failed requests:", results.failedRequests.length, results.failedRequests.slice(0, 5));
  const fails = results.checks.filter((c) => c.startsWith("FAIL")).length;
  console.log(`\n${results.checks.length - fails}/${results.checks.length} checks passed`);
})();
