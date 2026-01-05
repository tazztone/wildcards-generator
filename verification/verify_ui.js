
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to http://localhost:8080');
    await page.goto('http://localhost:8080');

    page.on('console', msg => {
        if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
    });

    // Wait for page to load and modules to initialize
    await page.waitForLoadState('networkidle');

    // Check for settings button
    await page.waitForSelector('#settings-btn');

    console.log('Clicking settings button...');
    await page.click('#settings-btn');

    // Wait for dialog
    await page.waitForSelector('#settings-dialog[open]');
    console.log('Settings dialog open.');

    // Wait for Test buttons to be rendered
    // They are in #api-settings-container > .api-settings-panel
    // Specifically test-conn-btn
    await page.waitForSelector('.test-conn-btn');

    // Take screenshot of the entire settings dialog
    const dialog = await page.locator('#settings-dialog');
    await dialog.screenshot({ path: 'verification/settings-panel.png' });
    console.log('Screenshot saved to verification/settings-panel.png');

    await browser.close();
    process.exit(0);
})();
