
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Serve index.html via http-server if possible, or assume file protocol works.
    // However, JS modules usually don't work with file:// protocol due to CORS.
    // This is likely why it fails - the app logic in main.js/ui.js is not loading.

    console.log('Checking if http-server is available...');
    // We'll try to use a minimal express server or http-server if available
    // For now let's try to verify if modules failed to load

    const filePath = 'file://' + path.resolve('index.html');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    console.log('Navigating to:', filePath);
    await page.goto(filePath);

    // Check if UI object exists on window (it should if modules loaded, but they won't on file://)
    const uiExists = await page.evaluate(() => typeof window.UI !== 'undefined');
    console.log('UI Global Exists:', uiExists);

    if (!uiExists) {
        console.error('Modules failed to load (likely due to file:// protocol restriction). Need a server.');
    }

    await browser.close();
})();
