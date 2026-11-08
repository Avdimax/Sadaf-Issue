// Diagnostic: current island-1 (nabavi) hover state
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "load" });
  await page.waitForTimeout(2600); // preloader skip (session) + intro

  // scroll to first island
  const island = page.locator(".island-landmass").first();
  await island.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  // move mouse onto the island centre and hold hover
  const box = await island.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(1400);
  }
  await page.screenshot({ path: "/home/z/my-project/shots4/diag-island1-hover.png" });

  // rest state for comparison
  await page.mouse.move(80, 60, { steps: 6 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: "/home/z/my-project/shots4/diag-island1-rest.png" });

  // second island (hoor) hover for the "glaring glow" complaint
  const island2 = page.locator(".island-landmass").nth(1);
  await island2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const box2 = await island2.boundingBox();
  if (box2) {
    await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 6 });
    await page.waitForTimeout(1400);
  }
  await page.screenshot({ path: "/home/z/my-project/shots4/diag-island2-hover.png" });

  await browser.close();
  console.log("done");
})();
