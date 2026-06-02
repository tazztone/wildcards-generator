// @ts-check
const { test, expect } = require('./fixtures');

test.describe('New UI Features', () => {

    // Toolbar & Dropdown Tests
    test.describe('Toolbar Dropdown', () => {
        test('dropdown is hidden by default', async ({ page }) => {
            const dropdown = page.locator('#overflow-menu-dropdown');
            await expect(dropdown).toHaveClass(/hidden/);
        });

        test('clicking more actions toggles dropdown', async ({ page }) => {
            const btn = page.locator('#overflow-menu-btn');
            const dropdown = page.locator('#overflow-menu-dropdown');

            await btn.click();
            await expect(dropdown).not.toHaveClass(/hidden/);

            await btn.click();
            await expect(dropdown).toHaveClass(/hidden/);
        });

        test('clicking outside closes dropdown', async ({ page }) => {
            const btn = page.locator('#overflow-menu-btn');
            const dropdown = page.locator('#overflow-menu-dropdown');

            await btn.click();
            await expect(dropdown).not.toHaveClass(/hidden/);

            // Click on body (outside dropdown)
            await page.click('h1');
            await expect(dropdown).toHaveClass(/hidden/);
        });

        test('dropdown items are accessible and clickable', async ({ page }) => {
            const btn = page.locator('#overflow-menu-btn');
            await btn.click();

            const exportBtn = page.locator('#undo-btn');
            await expect(exportBtn).toBeVisible();
        });
    });

    // Multi-Item & Multi-Category Creation Tests
    test.describe('Multi-Item and Multi-Category Creation', () => {
        test('should create multiple top-level categories at once', async ({ page }) => {
            // Click add category button
            const addBtn = page.locator('#add-category-placeholder-btn');
            await addBtn.click();

            // Dialog should appear
            const dialog = page.locator('#notification-dialog');
            await expect(dialog).toBeVisible();

            // Fill input with comma-separated names
            const input = dialog.locator('input[type="text"]');
            await input.fill('Multi Cat 1, Multi Cat 2, Multi Cat 3');
            await page.click('#confirm-btn');

            // Wait for dialog to close
            await expect(dialog).toBeHidden();

            // Check that all three categories exist using their exact data-paths
            await expect(page.locator('details[data-path="Multi_Cat_1"]')).toBeVisible();
            await expect(page.locator('details[data-path="Multi_Cat_2"]')).toBeVisible();
            await expect(page.locator('details[data-path="Multi_Cat_3"]')).toBeVisible();

            // Verification of success toast
            await expect(page.locator('.toast').filter({ hasText: 'Created 3 new categories' }).first()).toBeVisible();
        });

        test('should create multiple lists/wildcards under a category', async ({ page }) => {
            // Expand first category
            const category = page.locator('#wildcard-container > details').first();
            await category.locator(':scope > summary').click();
            await page.waitForTimeout(300);

            // Click add wildcard list button
            const addListBtn = category.locator('.add-wildcard-list-btn');
            await addListBtn.click();

            // Dialog appears
            const dialog = page.locator('#notification-dialog');
            await expect(dialog).toBeVisible();

            // Fill input with comma-separated names
            const input = dialog.locator('input[type="text"]');
            await input.fill('List A, List B');
            await page.click('#confirm-btn');

            // Wait for dialog to close
            await expect(dialog).toBeHidden();

            // Check that both lists exist
            const parentPath = await category.getAttribute('data-path');
            await expect(page.locator(`.wildcard-card[data-path="${parentPath}/List_A"]`)).toBeVisible();
            await expect(page.locator(`.wildcard-card[data-path="${parentPath}/List_B"]`)).toBeVisible();

            // Verify success toast
            await expect(page.locator('.toast').filter({ hasText: 'Created 2 new lists' }).first()).toBeVisible();
        });
    });

});
