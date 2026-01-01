
const { chromium } = require('@playwright/test');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');

    // Wait for content
    await page.waitForSelector('.category-item');

    // Expand using open attribute instead of click to be sure
    await page.evaluate(() => {
        const details = document.querySelector('details.category-item');
        if (details) details.open = true;
    });

    // Wait for a bit
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'verification/verification.png' });

    await browser.close();
})();
