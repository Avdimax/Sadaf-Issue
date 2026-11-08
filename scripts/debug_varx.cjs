// Focused debug: variations hover cycling + precise brand scroll
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on("console", (m) => console.log("  [console]", m.type(), m.text().split("\n")[0].slice(0, 120)));
  page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 200)));

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3500);

  // scroll precisely to the START of #variations
  await page.evaluate(() => document.querySelector("#variations").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1500);

  const readState = () =>
    page.evaluate(() => {
      const layers = [...document.querySelectorAll(".varx-layer")];
      const active = layers.find((l) => l.style.opacity === "1");
      const meta = document.querySelector(".varx-meta-in h3");
      const name = document.querySelector(".varx-name-in");
      return {
        brand: meta ? meta.textContent : "",
        variantName: name ? name.textContent.trim().slice(0, 40) : "",
        src: active ? (active.querySelector("img")?.getAttribute("src") || "").split("/").pop() : "",
        layerCount: layers.length,
      };
    });

  console.log("state at section start:", JSON.stringify(await readState()));

  // probe: does pointerenter fire on the stage?
  await page.evaluate(() => {
    window.__enterFired = 0;
    window.__moveFired = 0;
    const stage = document.querySelector(".varx-stage");
    stage.addEventListener("pointerenter", () => window.__enterFired++);
    stage.addEventListener("pointermove", () => window.__moveFired++);
  });

  const sbox = await page.locator(".varx-stage").boundingBox();
  console.log("stage box:", JSON.stringify(sbox));

  await page.mouse.move(sbox.x + sbox.width / 2, sbox.y + sbox.height / 2, { steps: 5 });
  await page.waitForTimeout(700);
  console.log("enter fired:", await page.evaluate(() => window.__enterFired), "— move fired:", await page.evaluate(() => window.__moveFired));
  console.log("state +700ms:", JSON.stringify(await readState()));

  await page.waitForTimeout(2000);
  console.log("state +2700ms:", JSON.stringify(await readState()));

  await page.waitForTimeout(1500);
  console.log("state +4200ms:", JSON.stringify(await readState()));

  // check what element sits at the stage centre
  const hit = await page.evaluate(() => {
    const r = document.querySelector(".varx-stage").getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el ? el.className.toString().slice(0, 80) : "none";
  });
  console.log("element at stage centre:", hit);

  await browser.close();
})();
