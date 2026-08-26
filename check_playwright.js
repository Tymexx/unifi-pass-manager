const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log("Navigating to http://localhost:3050...");
  await page.goto('http://localhost:3050', { waitUntil: 'networkidle' });
  
  console.log("Done");
  await browser.close();
})();
