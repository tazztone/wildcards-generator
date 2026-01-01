const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Go to local server
    await page.goto('http://localhost:8080');

    // Wait for the wildcard container to populate
    await page.waitForSelector('.category-item');

    // Get the first category details element
    const details = page.locator('#wildcard-container details.category-item').first();

    // Get the summary specific to THIS details element
    // Using > summary to be more specific to direct child
    const summary = details.locator('> summary');

    // Ensure it's visible before clicking
    await summary.waitFor({ state: 'visible' });

    // We don't necessarily need to click it if the delete button is always visible in the summary
    // But expanding it might be good for the screenshot context
    // Check if open
    const open = await details.getAttribute('open');
    if (open === null) {
        await summary.click();
    }

    // The delete button is inside the summary
    const deleteBtn = summary.locator('.delete-btn');
    await deleteBtn.waitFor({ state: 'visible' });
    await deleteBtn.hover();

    // Take a screenshot focusing on the category header area
    await page.screenshot({
        path: 'verification/delete_button_fix.png',
        clip: { x: 0, y: 0, width: 800, height: 600 }
    });

    await browser.close();
})();
