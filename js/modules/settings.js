/**
 * Settings Module
 * Handles API key verification and settings-related operations.
 */

// TODO: Show remaining API credits/balance where provider supports it

import { Api } from '../api.js';
import { UI } from '../ui.js';

export const Settings = {
    /**
     * Auto-verifies stored API keys on application startup.
     * Silently tests each provider's key and updates the UI accordingly.
     * Checks are performed periodically (every 24 hours).
     */
    async verifyStoredApiKeys() {
        const lastVerify = localStorage.getItem('wildcards_last_api_verify');
        const now = Date.now();
        // Check if last verification was less than 24 hours ago (24 * 60 * 60 * 1000 = 86400000 ms)
        const skipNetwork = lastVerify && (now - parseInt(lastVerify, 10)) < 86400000;

        const panels = document.querySelectorAll('.api-settings-panel');
        let anyVerified = false;

        for (const panel of panels) {
            const provider = panel.id.replace('settings-', '');

            const input = /** @type {HTMLInputElement} */ (panel.querySelector('.api-key-input'));
            if (!input) continue;
            const key = input.value.trim();

            if (!key) continue;

            const btn = /** @type {HTMLButtonElement} */ (panel.querySelector('.test-conn-btn'));
            if (!btn) continue;

            btn.disabled = true;
            btn.textContent = '⏳ ...';

            try {
                if (skipNetwork) {
                    // Populate from cache or simply mark as verified if we're skipping network
                    // Check if we have models in State to populate, else pass empty to not fail
                    UI.populateModelList(provider, window.State?.state?.availableModels || []);

                    btn.textContent = '✓ Verified';
                    btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                    btn.classList.add('bg-green-600', 'hover:bg-green-700');

                    // Reset after delay
                    setTimeout(() => {
                        btn.textContent = '🔌 Test';
                        btn.disabled = false;
                        btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    }, 2000);

                    this._setupKeyResetListener(input, btn);
                } else {
                    // Silent verification - no toast, just update button state
                    const models = await Api.testConnection(provider, null, key);
                    UI.populateModelList(provider, models);

                    anyVerified = true;

                    btn.textContent = '✓ Verified';
                    btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                    btn.classList.add('bg-green-600', 'hover:bg-green-700');

                    // Reset after delay
                    setTimeout(() => {
                        btn.textContent = '🔌 Test';
                        btn.disabled = false;
                        btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    }, 2000);

                    this._setupKeyResetListener(input, btn);
                }
            } catch (e) {
                console.warn(`Auto-verify failed for ${provider}:`, e);
                btn.textContent = '⚠️ Invalid';
                btn.className = 'test-conn-btn bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm whitespace-nowrap';
                btn.disabled = false;

                // Reset button on input change
                this._setupKeyResetListener(input, btn);
            }
        }

        if (anyVerified && !skipNetwork) {
            localStorage.setItem('wildcards_last_api_verify', now.toString());
        }
    },

    /**
     * Sets up a one-time listener to reset button state when API key input changes.
     * @param {HTMLInputElement} input - API key input element
     * @param {HTMLButtonElement} btn - Test connection button
     */
    _setupKeyResetListener(input, btn) {
        input.addEventListener('input', () => {
            if (btn.textContent === '⚠️ Invalid') {
                btn.textContent = '🔌 Test';
                btn.className = 'test-conn-btn bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm whitespace-nowrap';
            }
        }, { once: true });
    }
};
