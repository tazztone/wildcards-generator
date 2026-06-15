const fs = require('fs');

// Patch js/app.js
let appContent = fs.readFileSync('js/app.js', 'utf8');
appContent = appContent.replace(
    "if (target.matches('#export-settings-btn')) {\n                ImportExport.handleExportSettings();\n            }",
    "if (target.matches('#export-settings-btn')) {\n                ImportExport.handleExportSettings();\n            }\n            if (target.matches('#export-debug-config-btn')) {\n                ImportExport.handleExportDebugConfig();\n            }"
);
fs.writeFileSync('js/app.js', appContent);

// Patch js/modules/import-export.js
let importExportContent = fs.readFileSync('js/modules/import-export.js', 'utf8');
const handleExportSettingsStr = `    handleExportSettings() {
        try {
            const settings = {
                _comment: "User settings for Wildcards Generator",
                apiEndpoint: Config.API_ENDPOINT,
                modelNameGemini: Config.MODEL_NAME_GEMINI,
                modelNameOpenrouter: Config.MODEL_NAME_OPENROUTER,
                modelNameCustom: Config.MODEL_NAME_CUSTOM,
                apiUrlCustom: Config.API_URL_CUSTOM,
                historyLimit: Config.HISTORY_LIMIT,
                searchDebounceDelay: Config.SEARCH_DEBOUNCE_DELAY
                // API Keys are intentionally NOT exported for security
            };
            const jsonContent = JSON.stringify(settings, null, 2);
            this._downloadFile(jsonContent, 'settings.json', 'application/json');
            UI.showToast('Settings exported successfully', 'success');
        } catch (e) {
            console.error('Export Settings failed:', e);
            UI.showToast('Export failed', 'error');
        }
    },`;

const handleExportDebugConfigStr = `    /**
     * Exports a debug configuration diff for troubleshooting user issues.
     */
    handleExportDebugConfig() {
        try {
            const jsonContent = Config.exportConfigForDebug();
            this._downloadFile(jsonContent, 'debug-config.json', 'application/json');
            UI.showToast('Debug config exported successfully', 'success');
        } catch (e) {
            console.error('Export Debug Config failed:', e);
            UI.showToast('Export failed', 'error');
        }
    },`;

importExportContent = importExportContent.replace(handleExportSettingsStr, handleExportSettingsStr + '\n\n' + handleExportDebugConfigStr);
fs.writeFileSync('js/modules/import-export.js', importExportContent);
