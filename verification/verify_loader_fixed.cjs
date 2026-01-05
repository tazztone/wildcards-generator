const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    try {
        console.log('Navigating...');
        await page.goto('http://localhost:8083');
        await page.waitForLoadState('networkidle');

        console.log('Opening settings...');
        await page.click('#settings-btn');
        await page.waitForSelector('#settings-dialog[open]');

        console.log('Locating button...');
        const connBtn = page.locator('#settings-openrouter .test-conn-btn');
        await connBtn.waitFor({ state: 'visible' });
        await connBtn.scrollIntoViewIfNeeded();

        await connBtn.screenshot({ path: 'verification/3-conn-btn-idle-fixed.png' });

        // Mock API
        await page.route('**/api/v1/auth/key', async route => {
            await new Promise(r => setTimeout(r, 2000));
            await route.fulfill({ status: 200, body: JSON.stringify({ key: { name: 'Test Key' } }) });
        });
        await page.route('**/api/v1/models', async route => {
             await new Promise(r => setTimeout(r, 2000));
             await route.fulfill({ status: 200, body: JSON.stringify({ data: [{ id: 'test', name: 'Test' }] }) });
        });

        console.log('Clicking button...');
        await page.fill('#openrouter-api-key', 'sk-test');
        await connBtn.click();

        await page.waitForTimeout(100);

        console.log('Checking states...');
        const btnText = connBtn.locator('.btn-text');
        const loader = connBtn.locator('.loader');

        // Text should be visible now
        const isTextVisible = await btnText.isVisible();
        const isLoaderVisible = await loader.isVisible();

        console.log('Text visible?', isTextVisible);
        console.log('Loader visible?', isLoaderVisible);

        if (isTextVisible && isLoaderVisible) {
             await connBtn.screenshot({ path: 'verification/4-conn-btn-loading-fixed.png' });
             console.log('VERIFICATION SUCCESSFUL');
        } else {
             console.error('VERIFICATION FAILED: Invalid state');
        }

    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
