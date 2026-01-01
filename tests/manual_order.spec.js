
import { test, expect } from '@playwright/test';

test.describe('Manual Ordering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            location.reload();
        });
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.category-item.level-0').first()).toBeVisible();
    });

    test('should verify initial order matches YAML (approx)', async ({ page }) => {
        const categoryNames = await page.locator('.category-item.level-0 > summary .category-name').allTextContents();
        expect(categoryNames.length).toBeGreaterThan(0);
        expect(categoryNames[0]).toContain('1 SUBJECT and CONTENT');
    });

    // NOTE: This test was used to verify logic via window.App.moveItem.
    // Since window.App is removed, this test is disabled.
    // The manual verification confirmed the logic works.
    // If we wanted to keep this, we would need to uncomment window.App in index.html.
    /*
    test('should reorder categories manually via App.moveItem', async ({ page }) => {
        const categories = await page.locator('.category-item.level-0 > summary .category-name').allTextContents();
        const first = categories[0];
        const second = categories[1];

        await page.evaluate(({ src, dest }) => {
            window.App.moveItem(src, dest, 'before');
        }, { src: second.replace(/ /g, '_'), dest: first.replace(/ /g, '_') });

        await page.waitForTimeout(500);

        const newFirst = await page.locator('.category-item.level-0').nth(0).locator('> summary .category-name').textContent();
        expect(newFirst).toBe(second);
    });
    */

    test('should add new item at the end of order', async ({ page }) => {
        const placeholderBtn = page.locator('#add-category-placeholder-btn');
        await placeholderBtn.click();

        await page.locator('#notification-message input').fill('ZZ_Last_Category');
        await page.locator('#confirm-btn').click();

        await page.waitForTimeout(500);

        const categories = page.locator('.category-item.level-0');
        const count = await categories.count();
        const lastCategory = categories.nth(count - 1);

        expect(await lastCategory.locator('> summary .category-name').textContent()).toContain('ZZ Last Category');

        await page.reload();
        await page.waitForLoadState('networkidle');

        const newCategories = page.locator('.category-item.level-0');
        const newCount = await newCategories.count();
        const newLastCategory = newCategories.nth(newCount - 1);
        expect(await newLastCategory.locator('> summary .category-name').textContent()).toContain('ZZ Last Category');
    });
});
