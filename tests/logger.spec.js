const { test, expect } = require('@playwright/test');

/**
 * Logger & Persistent Storage Tests
 * 
 * These tests verify the IndexedDB-based logging system functionality.
 * Note: Tests interact with the Logger module directly via page.evaluate
 * and verify UI rendering in the Settings > Logs tab.
 */
test.describe('Logger & Persistent Storage', () => {

    // Helper to open the Settings Dialog and navigate to the Logs tab
    async function openLogsTab(page) {
        await page.click('#settings-btn');
        await expect(page.locator('#settings-dialog')).toBeVisible({ timeout: 5000 });

        // Click the logs tab - force click to bypass potential visibility issues
        const logsTab = page.locator('[data-tab="logs"]');
        await logsTab.click({ force: true });

        // Wait for the logs container to be visible
        await expect(page.locator('#api-logs-container')).toBeVisible({ timeout: 5000 });
    }

    test.beforeEach(async ({ page }) => {
        // Disable help dialog by pre-seeding the visited flag
        await page.addInitScript(() => {
            localStorage.setItem('wildcards-visited', 'true');
        });

        await page.setViewportSize({ width: 1600, height: 1200 });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        // Wait for app to be ready
        await page.waitForSelector('#settings-btn', { state: 'visible', timeout: 5000 });

        // Clear logs before each test (Logger auto-initializes on first call)
        await page.evaluate(async () => {
            // @ts-ignore - dynamic import in browser context
            const { Logger } = window;
            await Logger.clear();
        });
    });

    test('should persist logs across reloads', async ({ page }) => {
        // Generate a complete log entry with all required fields
        await page.evaluate(async () => {
            // @ts-ignore
            const { Logger } = window;
            await Logger.logRequest({
                id: 'test-persist-1',
                url: 'https://api.example.com/persist',
                method: 'POST',
                timestamp: new Date().toLocaleTimeString(),
                startTime: performance.now(),
                createdAt: Date.now(),
                payload: { foo: 'bar' },
                status: 'success',  // Required for UI rendering
                duration: 100,
                response: { result: 'ok' },
            });
        });

        // Open logs tab and verify it appears
        await openLogsTab(page);
        await page.click('#refresh-logs-btn');

        // Wait for logs to render
        await expect(page.locator('.log-entry')).toHaveCount(1, { timeout: 10000 });
        await expect(page.locator('.log-entry')).toContainText('api.example.com');

        // Reload page and verify persistence
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        await openLogsTab(page);

        // Should still have 1 log entry after reload
        await expect(page.locator('.log-entry')).toHaveCount(1, { timeout: 10000 });
        await expect(page.locator('.log-entry')).toContainText('api.example.com');
    });

    test('should filter logs by date range', async ({ page }) => {
        // Inject logs with different dates - include all required fields
        await page.evaluate(async () => {
            // @ts-ignore
            const { Logger } = window;
            const now = Date.now();
            const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

            await Logger.logRequest({
                id: 'old-1',
                url: 'https://old.example.com',
                method: 'GET',
                createdAt: twoDaysAgo,
                startTime: 0,
                timestamp: new Date(twoDaysAgo).toLocaleTimeString(),
                status: 'success',
                duration: 50,
                response: 'old response',
            });
            await Logger.logRequest({
                id: 'new-1',
                url: 'https://new.example.com',
                method: 'GET',
                createdAt: now,
                startTime: 1000,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success',
                duration: 100,
                response: 'new response',
            });
        });

        await openLogsTab(page);
        await page.click('#refresh-logs-btn');

        // Should see both logs initially
        await expect(page.locator('.log-entry')).toHaveCount(2, { timeout: 10000 });

        // Filter for today only
        const today = new Date().toISOString().split('T')[0];
        await page.fill('#logs-filter-date-start', today);
        await page.fill('#logs-filter-date-end', today);

        // Click refresh button to apply the date filter
        await page.click('#refresh-logs-btn');

        // Wait for filtering to take effect
        await page.waitForTimeout(500);

        // Should only see today's log
        await expect(page.locator('.log-entry')).toHaveCount(1, { timeout: 10000 });
        await expect(page.locator('.log-entry')).toContainText('new.example.com');
    });

    test('should delete old logs via deleteOlderThan', async ({ page }) => {
        // Create an old log entry with all required fields
        await page.evaluate(async () => {
            // @ts-ignore
            const { Logger } = window;
            const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);

            await Logger.logRequest({
                id: 'old-log',
                url: 'https://old.example.com',
                method: 'GET',
                createdAt: threeDaysAgo,
                startTime: 0,
                timestamp: new Date(threeDaysAgo).toLocaleTimeString(),
                status: 'success',
                duration: 50,
                response: 'old response',
            });
        });

        // Verify it exists
        await openLogsTab(page);
        await page.click('#refresh-logs-btn');
        await expect(page.locator('.log-entry')).toHaveCount(1, { timeout: 10000 });
        await expect(page.locator('.log-entry')).toContainText('old.example.com');

        // Run deletion (delete logs older than 2 days)
        const deletedCount = await page.evaluate(async () => {
            // @ts-ignore
            const { Logger } = window;
            return await Logger.deleteOlderThan(2);
        });

        expect(deletedCount).toBeGreaterThan(0);

        // Refresh and verify it's gone
        await page.click('#refresh-logs-btn');
        await page.waitForTimeout(500);

        // Should show no logs message
        await expect(page.locator('.log-entry')).toHaveCount(0);
    });

    test('badge should show log count', async ({ page }) => {
        // Create some log entries with all required fields
        await page.evaluate(async () => {
            // @ts-ignore
            const { Logger } = window;
            await Logger.logRequest({
                id: 'badge-1',
                url: 'https://a.com',
                method: 'GET',
                createdAt: Date.now(),
                startTime: 0,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success',
                duration: 50,
                response: 'response a',
            });
            await Logger.logRequest({
                id: 'badge-2',
                url: 'https://b.com',
                method: 'GET',
                createdAt: Date.now(),
                startTime: 0,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success',
                duration: 100,
                response: 'response b',
            });
        });

        // Open logs tab - this triggers renderLogs which updates the badge
        await openLogsTab(page);
        await page.click('#refresh-logs-btn');

        // Wait for badge update
        await page.waitForTimeout(500);

        const badge = page.locator('#logs-count-badge');
        await expect(badge).toBeVisible();
        await expect(badge).toHaveText('2');
    });

});
