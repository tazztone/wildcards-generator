
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();

    // Set viewport to a typical desktop size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Start server (assuming serve is running on 3000 or I can file://)
    /*
    const server = spawn('npx', ['serve', '-l', '3000']);
    console.log('Server started');
    // Give it time to start
    await new Promise(r => setTimeout(r, 2000));
    */
    // Since I don't have a server running in background easily via this script without blocking,
    // I'll rely on the existing setup or use file:// if possible, but the app uses modules so file:// might block CORS.
    // The previous tests ran on localhost, so I assume there is a way.
    // Actually, I can just use the same base URL as the tests if I knew it.
    // But better: I'll use serve in this script or assume one is running.
    // Wait, I can use the existing `tests/ui_ux.spec.js` logic but adapted for screenshot.

    // Let's try to start a server briefly or just use the playwright webServer config if I can invoke it? No.
    // I'll try to spawn a server process in background in bash before running this.

    try {
        await page.goto('http://localhost:3000'); // Assuming standard serve port

        // Reset
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
        await page.reload();

        // Create category and list
        await page.click('#add-category-placeholder-btn');
        await page.waitForSelector('#notification-dialog[open]');
        await page.fill('#notification-message input', 'Screenshot Category');
        await page.click('#confirm-btn');

        const category = page.locator('details[data-path="Screenshot_Category"]');
        await category.evaluate(el => el.open = true);

        const addWildcardBtn = category.locator('.add-wildcard-list-btn');
        await addWildcardBtn.click();
        await page.waitForSelector('#notification-dialog[open]');
        await page.fill('#notification-message input', 'Screenshot List');
        await page.click('#confirm-btn');

        // Add Item
        const card = page.locator('.wildcard-card[data-path="Screenshot_Category/Screenshot_List"]');
        await card.locator('.add-wildcard-input').fill('Item 1');
        await card.locator('.add-wildcard-btn').click();

        // Click Copy
        const copyBtn = card.locator('.copy-btn');
        await copyBtn.click();

        // Wait for visual feedback
        await page.waitForTimeout(100); // Give it a moment to render the checkmark

        // Take Screenshot of the card
        const screenshotPath = path.join(__dirname, 'copy_feedback.png');
        await card.screenshot({ path: screenshotPath });
        console.log('Screenshot taken: ' + screenshotPath);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
