// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Settings Logic', () => {

    test.describe('verifyStoredApiKeys', () => {
        test('updates UI to verified on successful connection', async ({ page }) => {
            const verifiedText = await page.evaluate(async () => {
                // Setup mock DOM
                const container = document.createElement('div');
                container.innerHTML = `
                    <div id="settings-openrouter" class="api-settings-panel">
                        <input type="text" class="api-key-input" value="dummy-key-openrouter">
                        <button class="test-conn-btn bg-indigo-600 hover:bg-indigo-700">🔌 Test</button>
                    </div>
                `;
                document.body.appendChild(container);

                // Mock API and UI
                const originalTestConnection = window.Api.testConnection;
                const originalPopulateModelList = window.UI.populateModelList;

                try {
                    window.Api.testConnection = async () => ['model1', 'model2'];
                    window.UI.populateModelList = () => {};

                    // Call the method
                    await window.Settings.verifyStoredApiKeys();

                    // Wait a bit for async operations if any (testConnection resolves immediately but it's an async fn)
                    await new Promise(resolve => setTimeout(resolve, 50));

                    const btn = container.querySelector('.test-conn-btn');
                    const text = btn.textContent;
                    const classList = Array.from(btn.classList);

                    return { text, classList };
                } finally {
                    // Cleanup
                    document.body.removeChild(container);
                    window.Api.testConnection = originalTestConnection;
                    window.UI.populateModelList = originalPopulateModelList;
                }
            });

            expect(verifiedText.text).toBe('✓ Verified');
            expect(verifiedText.classList).toContain('bg-green-600');
            expect(verifiedText.classList).not.toContain('bg-indigo-600');
        });

        test('updates UI to invalid on failed connection', async ({ page }) => {
            const result = await page.evaluate(async () => {
                // Setup mock DOM
                const container = document.createElement('div');
                container.innerHTML = `
                    <div id="settings-openrouter" class="api-settings-panel">
                        <input type="text" class="api-key-input" value="invalid-key">
                        <button class="test-conn-btn bg-indigo-600 hover:bg-indigo-700">🔌 Test</button>
                    </div>
                `;
                document.body.appendChild(container);

                const originalTestConnection = window.Api.testConnection;

                try {
                    window.Api.testConnection = async () => { throw new Error('Invalid key'); };

                    // Prevent console.warn from muddying test output
                    const originalConsoleWarn = console.warn;
                    console.warn = () => {};

                    // Call the method
                    await window.Settings.verifyStoredApiKeys();

                    console.warn = originalConsoleWarn;

                    // Wait a bit for microtasks
                    await new Promise(resolve => setTimeout(resolve, 50));

                    const btn = container.querySelector('.test-conn-btn');
                    return {
                        text: btn.textContent,
                        classList: Array.from(btn.classList)
                    };
                } finally {
                    // Cleanup
                    document.body.removeChild(container);
                    window.Api.testConnection = originalTestConnection;
                }
            });

            expect(result.text).toBe('⚠️ Invalid');
            expect(result.classList).toContain('bg-red-600');
        });

        test('resets button state on input change after failure', async ({ page }) => {
            const result = await page.evaluate(async () => {
                // Setup mock DOM
                const container = document.createElement('div');
                container.innerHTML = `
                    <div id="settings-openrouter" class="api-settings-panel">
                        <input type="text" class="api-key-input" value="invalid-key">
                        <button class="test-conn-btn bg-indigo-600 hover:bg-indigo-700">🔌 Test</button>
                    </div>
                `;
                document.body.appendChild(container);

                const originalTestConnection = window.Api.testConnection;

                try {
                    window.Api.testConnection = async () => { throw new Error('Invalid key'); };

                    const originalConsoleWarn = console.warn;
                    console.warn = () => {};

                    // Call method and fail
                    await window.Settings.verifyStoredApiKeys();

                    console.warn = originalConsoleWarn;

                    await new Promise(resolve => setTimeout(resolve, 50));

                    const input = container.querySelector('.api-key-input');
                    const btn = container.querySelector('.test-conn-btn');

                    const textAfterFail = btn.textContent;

                    // Trigger input event
                    input.value = 'new-key';
                    input.dispatchEvent(new Event('input'));

                    const textAfterInput = btn.textContent;
                    const classListAfterInput = Array.from(btn.classList);

                    return {
                        textAfterFail,
                        textAfterInput,
                        classListAfterInput
                    };
                } finally {
                    // Cleanup
                    document.body.removeChild(container);
                    window.Api.testConnection = originalTestConnection;
                }
            });

            expect(result.textAfterFail).toBe('⚠️ Invalid');
            expect(result.textAfterInput).toBe('🔌 Test');
            expect(result.classListAfterInput).toContain('bg-indigo-600');
            expect(result.classListAfterInput).not.toContain('bg-red-600');
        });
    });
});
