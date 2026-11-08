// Trace GSAP "target not found" warnings with call stacks
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on("console", async (msg) => {
    const text = msg.text();
    if (text.includes("GSAP target") || text.includes("STACKTRACE")) {
      console.log("=== FULL:", text);
    }
  });

  // Inject instrumentation before any page script runs
  await page.addInitScript(() => {
    const origWarn = console.warn;
    console.warn = function (...args) {
      if (String(args[0]).includes("GSAP target")) {
        origWarn("[STACKTRACE]", new Error().stack);
      }
      origWarn.apply(console, args);
    };
  });

  await page.goto("http://localhost:3000/", { waitUntil: "load" });
  await page.waitForTimeout(3500);
  await browser.close();
})();
