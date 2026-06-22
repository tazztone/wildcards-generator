const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('benchmark context menu', async ({ page }) => {
    await page.setContent(`
        <ul id="menu"></ul>
        <script>
            const container = document.getElementById('menu');
            for (let i = 0; i < 20; i++) {
                const el = document.createElement('li');
                el.textContent = "Action " + i + " Some other text here for testing string includes parent";
                container.appendChild(el);
            }

            window.testSearch = function() {
                const items = container.querySelectorAll('li');
                const start = performance.now();
                for (let iter = 0; iter < 10000; iter++) {
                    items.forEach(item => {
                        const text = item.textContent?.toLowerCase().trim() || '';

                        if (text.includes('child') || text.includes('summary')) {
                        }
                        if (text.includes('add child')) {
                        }
                        if (text.includes('parent') || text.includes('sibling') || text.includes('remove') || text.includes('up') || text.includes('down') || text.includes('cut') || text.includes('copy')) {
                        }
                        if (text.includes('generate wildcards')) {
                        }
                        if (text.includes('suggest subcategories')) {
                        }
                        if (text.includes('focus mode') && !text.includes('cancel')) {
                        }
                        if (text.includes('cancel focus mode')) {
                        }
                    });
                }
                const end = performance.now();
                return end - start;
            };

            window.testSearchOptimized = function() {
                const items = container.querySelectorAll('li');
                const start = performance.now();
                for (let iter = 0; iter < 10000; iter++) {
                    items.forEach(item => {
                        let text = item._cachedLowerText;
                        if (text === undefined) {
                            text = item.textContent?.toLowerCase().trim() || '';
                            item._cachedLowerText = text;
                        }

                        if (text.includes('child') || text.includes('summary')) {
                        }
                        if (text.includes('add child')) {
                        }
                        if (text.includes('parent') || text.includes('sibling') || text.includes('remove') || text.includes('up') || text.includes('down') || text.includes('cut') || text.includes('copy')) {
                        }
                        if (text.includes('generate wildcards')) {
                        }
                        if (text.includes('suggest subcategories')) {
                        }
                        if (text.includes('focus mode') && !text.includes('cancel')) {
                        }
                        if (text.includes('cancel focus mode')) {
                        }
                    });
                }
                const end = performance.now();
                return end - start;
            };
        </script>
    `);

    const origTime = await page.evaluate(() => window.testSearch());
    const optTime = await page.evaluate(() => window.testSearchOptimized());

    console.log("Original time:", origTime);
    console.log("Optimized time:", optTime);
});
