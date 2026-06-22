const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('benchmark mindmap search', async ({ page }) => {
    await page.setContent(`
        <div id="mindmap-container"></div>
        <script>
            const container = document.getElementById('mindmap-container');
            for (let i = 0; i < 5000; i++) {
                const el = document.createElement('me-tpc');
                el.className = 'mind-elixir-topic';
                el.textContent = "Topic " + i + " Some other text here for testing string includes";
                container.appendChild(el);
            }
            window.testSearch = function() {
                const normalizedQuery = "topic 4999".toLowerCase().trim();
                const matchedNodes = [];
                const topicSelector = '.mind-elixir-topic, .me-topic, [class*="topic"], me-tpc';
                const containers = [container];

                const start = performance.now();
                for (let iter = 0; iter < 100; iter++) {
                    containers.forEach(container => {
                        const topics = container.querySelectorAll(topicSelector);
                        for (let i = 0; i < topics.length; i++) {
                            const topic = topics[i];
                            const text = topic.textContent?.toLowerCase() || '';
                            if (text.includes(normalizedQuery)) {
                                matchedNodes.push(topic);
                            }
                        }
                    });
                }
                const end = performance.now();
                return end - start;
            };

            window.testSearchOptimized = function() {
                const normalizedQuery = "topic 4999".toLowerCase().trim();
                const matchedNodes = [];
                const topicSelector = '.mind-elixir-topic, .me-topic, [class*="topic"], me-tpc';
                const containers = [container];

                const start = performance.now();
                for (let iter = 0; iter < 100; iter++) {
                    containers.forEach(container => {
                        const topics = container.querySelectorAll(topicSelector);
                        for (let i = 0; i < topics.length; i++) {
                            const topic = topics[i];
                            // Cache the text to avoid expensive textContent and toLowerCase calls
                            let text = topic.dataset.lowerText;
                            if (text === undefined) {
                                text = topic.textContent?.toLowerCase() || '';
                                topic.dataset.lowerText = text;
                            }
                            if (text.includes(normalizedQuery)) {
                                matchedNodes.push(topic);
                            }
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
