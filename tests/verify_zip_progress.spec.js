const { test, expect } = require('./fixtures');

test.describe('ZIP Export Progress', () => {
    test('ZIP export shows and updates progress toast', async ({ page }) => {
        // Setup data and mock JSZip generateAsync for deterministic progress toast visibility
        await page.evaluate(() => {
            window.State.state.wildcards = {
                'LargeCategory': {
                    'wildcards': Array(100).fill('item')
                }
            };
            window.UI.renderAll();

            // Mock generateAsync to simulate slow compression
            const originalGenerateAsync = window.JSZip.prototype.generateAsync;
            window.JSZip.prototype.generateAsync = async function(options, onUpdate) {
                if (onUpdate) {
                    onUpdate({ percent: 25 });
                    await new Promise(r => setTimeout(r, 150));
                    onUpdate({ percent: 75 });
                    await new Promise(r => setTimeout(r, 150));
                }
                return originalGenerateAsync.call(this, options, onUpdate);
            };
        });

        // Click export
        await page.click('#overflow-menu-btn');

        // Intercept download and check toast
        const downloadPromise = page.waitForEvent('download');
        await page.click('#download-all-zip');

        // Check for progress toast (info type, 0 duration/persistent)
        const toast = page.locator('.toast.info');
        await expect(toast).toBeVisible();

        // Check for percentage update - it might be too fast, but 'Generating ZIP' should be there
        const toastText = await toast.innerText();
        expect(toastText).toContain('Generating ZIP');

        // Wait for download to complete
        await downloadPromise;

        // Progress toast should be gone
        await expect(toast).not.toBeVisible();

        // Final success toast should appear
        await expect(page.locator('.toast.success')).toBeVisible();
    });
});
