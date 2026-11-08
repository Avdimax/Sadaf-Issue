// Island hover with island centered in viewport (navbar not overlapping)
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3500);

  const island = page.locator(".island-landmass").first();
  await island.scrollIntoViewIfNeeded();
  // nudge down so the island sits mid-viewport, clear of the navbar
  await page.evaluate(() => window.scrollBy(0, 260));
  await page.waitForTimeout(1200);

  const box = await island.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/home/z/my-project/shots4/02b-island1-hover-centered.png" });
  await browser.close();
  console.log("done");
})();
