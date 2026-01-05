
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

        await connBtn.screenshot({ path: 'verification/1-conn-btn-idle.png' });

        // Mock the API response to be slow so we can capture the loading state
        // We can do this by intercepting the network request
        await page.route('**/api/v1/auth/key', async route => {
            console.log('Intercepted /auth/key request, delaying...');
            await new Promise(r => setTimeout(r, 2000)); // Delay 2 seconds
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ key: { name: 'Test Key' } })
            });
        });

         // Also intercept the models call which happens after auth
        await page.route('**/api/v1/models', async route => {
            console.log('Intercepted /models request, delaying...');
             await new Promise(r => setTimeout(r, 2000)); // Delay 2 seconds
             await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: [{ id: 'test-model', name: 'Test Model' }] })
             });
        });


        console.log('Clicking button...');
        // We set a dummy key to ensure it tries to connect
        await page.fill('#openrouter-api-key', 'sk-or-test-key-dummy');

        // Click and immediately check
        await connBtn.click();

        // Wait a tiny bit for UI update
        await page.waitForTimeout(100);

        console.log('Checking loading state...');
        const btnText = connBtn.locator('.btn-text');
        const loader = connBtn.locator('.loader');

        // Verify text is hidden
        const isTextVisible = await btnText.isVisible();
        console.log('Text visible?', isTextVisible);

        // Verify loader is visible
        const isLoaderVisible = await loader.isVisible();
        console.log('Loader visible?', isLoaderVisible);

        if (!isTextVisible && isLoaderVisible) {
             console.log('Taking screenshot of loading state...');
             await connBtn.screenshot({ path: 'verification/2-conn-btn-loading.png' });
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
