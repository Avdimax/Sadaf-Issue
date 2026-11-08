// Mobile hero with settled animation
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await mobile.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await mobile.waitForTimeout(6000); // preloader + intro fully settled
  await mobile.screenshot({ path: "/home/z/my-project/shots4/12b-mobile-hero-settled.png" });
  // full hero section (may exceed viewport)
  await mobile.locator("#top").screenshot({ path: "/home/z/my-project/shots4/12c-mobile-hero-full.png" }).catch(() => {});
  await browser.close();
  console.log("done");
})();
