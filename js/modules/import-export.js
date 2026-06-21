/**
 * Import/Export Module
 * Handles file I/O operations for YAML, ZIP, and Settings files.
 */

// TODO: Add support for importing/exporting JSON format as alternative to YAML
// TODO: Add import validation with preview before applying changes


import { State } from '../state.js';
import { UI } from '../ui.js';
import { Config, saveConfig } from '../config.js';

export const ImportExport = {
    /**
     * Downloads content as a file.
     * @param {string} content - File content
     * @param {string} filename - Filename with extension
     * @param {string} mimeType - MIME type
     */
    _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Recursively builds YAML string with inline instruction comments.
     * @param {object} data - Internal data object with instruction/wildcards properties
     * @param {number} indent - Current indentation level
     * @returns {string} YAML string
     */
    _buildExportYaml(data, indent = 0) {
        const spaces = '  '.repeat(indent);
        let yaml = '';

        for (const [key, value] of Object.entries(data)) {
            if (key === 'instruction') continue; // Skip instruction property

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Check if this is a leaf node (has wildcards array)
                if (Array.isArray(value.wildcards)) {
                    // Build inline comment if instruction exists
                    const comment = value.instruction ? ` # instruction: ${value.instruction}` : '';
                    yaml += `${spaces}${key}:${comment}\n`;
                    // Add wildcards as array items
                    for (const wildcard of value.wildcards) {
                        yaml += `${spaces}  - ${wildcard}\n`;
                    }
                } else {
                    // Nested category - add key with optional inline comment
                    const comment = value.instruction ? ` # instruction: ${value.instruction}` : '';
                    yaml += `${spaces}${key}:${comment}\n`;
                    // Recurse for nested content
                    yaml += this._buildExportYaml(value, indent + 1);
                }
            }
        }

        return yaml;
    },

    /**
     * Exports all wildcards to a YAML file in the original comment-based format.
     * Note: System prompts are NOT included in the export - they are separate settings.
     */
    async handleExportYAML() {
        try {
            // Build YAML string manually to preserve inline comment format
            const yamlContent = this._buildExportYaml(State.state.wildcards);

            this._downloadFile(yamlContent, 'wildcards.yaml', 'application/x-yaml');
            UI.showToast('YAML exported successfully', 'success');
        } catch (e) {
            console.error('Export YAML failed:', e);
            UI.showToast('Export failed', 'error');
        }
    },


    /**
     * Exports all wildcards as a ZIP archive with individual text files.
     */
    async handleExportZIP() {
        try {
            // Use globally loaded JSZip
            const zip = new window.JSZip();
            const wildcards = State.state.wildcards;

            /**
             * Recursively adds wildcard data to ZIP.
             * @param {object} data - Category/wildcard data
             * @param {string} prefix - File path prefix
             */
            const addToZip = (data, prefix = '') => {
                if (data.wildcards && Array.isArray(data.wildcards)) {
                    const content = data.wildcards.join('\n');
                    zip.file(`${prefix || 'root'}.txt`, content);
                }
                // Handle nested categories
                Object.keys(data).filter(k => k !== 'instruction' && k !== 'wildcards').forEach(key => {
                    const item = data[key];
                    if (typeof item === 'object' && item !== null) {
                        addToZip(item, prefix ? `${prefix}/${key}` : key);
                    }
                });
            };

            for (const [key, data] of Object.entries(wildcards)) {
                addToZip(data, key);
            }

            const progressToast = UI.showToast('Generating ZIP: 0%', 'info', 0);
            const messageEl = progressToast.querySelector('.toast-message');

            try {
                const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
                    if (messageEl) {
                        messageEl.textContent = `Generating ZIP: ${metadata.percent.toFixed(0)}%`;
                    }
                });

                // TODO: Support custom folder structure templates for different SD flavors
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'wildcard_collection.zip';
                a.click();
                URL.revokeObjectURL(url);
                UI.showToast('ZIP exported successfully', 'success');
            } finally {
                progressToast.remove();
            }
        } catch (e) {
            console.error('Export ZIP failed:', e);
            UI.showToast('Export failed', 'error');
        }
    },

    /**
     * Exports application settings to a JSON file (excluding API keys for security).
     */
    handleExportSettings() {
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
    },

    /**
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
    },

    /**
     * Processes files for import.
     * @param {FileList|File[]} files - The files to process
     */
    async processImportFiles(files) {
        if (!files || files.length === 0) return;

        // Warn user if the total file size exceeds 1MB limit
        const maxSize = 1024 * 1024; // 1MB
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
        }

        if (totalSize > maxSize) {
            const sizeInMB = (totalSize / maxSize).toFixed(2);
            const confirm = await UI.showConfirmDialog(
                'Large Files Warning',
                `The selected files total ${sizeInMB} MB. Importing them may take a long time or cause the browser to freeze. Do you want to continue?`,
                { confirmText: 'Continue', cancelText: 'Cancel', danger: true }
            );
            if (!confirm) return;
        }

        let combinedProcessedData = {};
        let combinedSimpleParsed = {};
        let validFilesCount = 0;

        try {
            // @ts-ignore
            const YAML = (await import('https://cdn.jsdelivr.net/npm/yaml@2.8.2/browser/index.js')).default;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const text = await file.text();

                    // Use parseDocument to preserve comments (for # instruction: format)
                    const doc = YAML.parseDocument(text);
                    if (doc.errors && doc.errors.length > 0) {
                        console.error(`YAML Parse Errors in ${file.name}:`, doc.errors);
                        throw new Error('YAML parsing failed');
                    }

                    // Process with State.processYamlNode to extract comment-based instructions
                    let processedData = State.processYamlNode(doc.contents);

                    // Also try simple parse for pre-processed YAML (exported format)
                    const simpleParsed = YAML.parse(text);

                    // Validate schema before proceeding
                    this._validateImportSchema(simpleParsed);

                    // If simple parse has wildcards property with instructions, use that instead
                    if (simpleParsed && simpleParsed.wildcards && typeof simpleParsed.wildcards === 'object') {
                        // Check if it looks like already-processed format (has instruction properties)
                        const firstKey = Object.keys(simpleParsed.wildcards)[0];
                        if (firstKey && simpleParsed.wildcards[firstKey] &&
                            (simpleParsed.wildcards[firstKey].instruction !== undefined ||
                                simpleParsed.wildcards[firstKey].wildcards !== undefined)) {
                            processedData = simpleParsed.wildcards;
                        }
                    }

                    if (!processedData || typeof processedData !== 'object') {
                        throw new Error('Invalid YAML structure');
                    }

                    this._deepMerge(combinedProcessedData, processedData);
                    if (simpleParsed && simpleParsed.systemPrompt) combinedSimpleParsed.systemPrompt = simpleParsed.systemPrompt;
                    if (simpleParsed && simpleParsed.suggestItemPrompt) combinedSimpleParsed.suggestItemPrompt = simpleParsed.suggestItemPrompt;

                    validFilesCount++;
                } catch (err) {
                    console.error(`Import YAML failed for ${file.name}:`, err);
                    UI.showToast(`Import failed for ${file.name}: ${err.message}`, 'error');
                }
            }

            if (validFilesCount === 0) {
                return; // No valid files to import
            }

            const displayFilename = files.length === 1 ? files[0].name : `${validFilesCount} files`;

            // Check if merging is needed
            const hasExisting = Object.keys(State.state.wildcards).length > 0;
            if (hasExisting) {
                // Show Replace/Merge/Cancel dialog
                UI.showNotification(`How would you like to import ${displayFilename}?`, false, null, false, [
                    {
                        text: 'Replace All',
                        class: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded',
                        onClick: () => {
                            UI.elements.dialog.close();
                            this._applyProcessedData(combinedProcessedData, combinedSimpleParsed, displayFilename, 'replaced');
                        }
                    },
                    {
                        text: 'Merge',
                        class: 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded',
                        onClick: () => {
                            UI.elements.dialog.close();
                            this._mergeProcessedData(combinedProcessedData, combinedSimpleParsed, displayFilename);
                        }
                    },
                    {
                        text: 'Cancel',
                        class: 'bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded',
                        onClick: () => UI.elements.dialog.close()
                    }
                ]);
            } else {
                this._applyProcessedData(combinedProcessedData, combinedSimpleParsed, displayFilename, 'imported');
            }
        } catch (err) {
            console.error('Import process failed:', err);
            UI.showToast(`Import process failed: ${err.message}`, 'error');
        }
    },

    /**
     * Validates the schema of an imported YAML file.
     * @param {object} parsedData - The parsed YAML object.
     * @returns {boolean} - True if valid, throws error otherwise.
     */
    _validateImportSchema(parsedData) {
        if (!parsedData || typeof parsedData !== 'object') {
            throw new Error('Root must be an object');
        }

        // Check if it's the exported layout format
        if ('wildcards' in parsedData) {
            if (typeof parsedData.wildcards !== 'object' || parsedData.wildcards === null || Array.isArray(parsedData.wildcards)) {
                throw new Error('The "wildcards" property must be an object of categories');
            }
            // Check that values are arrays or structured objects
            for (const category in parsedData.wildcards) {
                const val = parsedData.wildcards[category];
                if (!Array.isArray(val) && (typeof val !== 'object' || val === null)) {
                    throw new Error(`Category "${category}" must be an array of strings or an object with wildcards property`);
                }
            }
        } else {
            // Check if it's a direct dictionary of categories format
            for (const category in parsedData) {
                const val = parsedData[category];
                if (!Array.isArray(val) && (typeof val !== 'object' || val === null)) {
                    throw new Error(`Invalid category "${category}": must be an array or object`);
                }
            }
        }
        return true;
    },

    /**
     * Opens a file picker to import YAML wildcard data.
     */
    handleImportYAML() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.yaml,.yml';
        input.title = 'Select YAML files to import wildcards';
        input.onchange = async (e) => {
            const files = /** @type {HTMLInputElement} */ (e.target).files;
            this.processImportFiles(files);
        };
        input.click();
    },

    /**
     * Deep merges source object into target object.
     * @param {object} target - Target object
     * @param {object} source - Source object
     */
    _deepMerge(target, source) {
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this._deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                // Merge arrays (wildcards), avoiding duplicates
                const combined = [...new Set([...target[key], ...source[key]])];
                target[key] = combined;
            } else {
                target[key] = source[key];
            }
        }
    },

    /**
     * Deep merges processed YAML data with existing state.
     * @param {object} processedData - Data processed by State.processYamlNode
     * @param {object} simpleParsed - Simple YAML.parse result for prompts
     * @param {string} filename - Original filename for toast
     */
    _mergeProcessedData(processedData, simpleParsed, filename) {
        State.saveStateToHistory();

        this._deepMerge(State.state.wildcards, processedData);
        if (simpleParsed && simpleParsed.systemPrompt) State.state.systemPrompt = simpleParsed.systemPrompt;
        if (simpleParsed && simpleParsed.suggestItemPrompt) State.state.suggestItemPrompt = simpleParsed.suggestItemPrompt;

        UI.renderAll(); // FORCE REFRESH to ensure merged data is visible
        UI.showToast(`Merged ${filename}`, 'success');
    },

    /**
     * Applies processed YAML data to state.
     * @param {object} processedData - Data processed by State.processYamlNode  
     * @param {object} simpleParsed - Simple YAML.parse result for prompts
     * @param {string} filename - Original filename for toast message
     * @param {string} action - 'replaced' or 'imported' for toast
     */
    _applyProcessedData(processedData, simpleParsed, filename, action) {
        State.saveStateToHistory();
        State.state.wildcards = processedData;
        if (simpleParsed && simpleParsed.systemPrompt) State.state.systemPrompt = simpleParsed.systemPrompt;
        if (simpleParsed && simpleParsed.suggestItemPrompt) State.state.suggestItemPrompt = simpleParsed.suggestItemPrompt;

        UI.renderAll(); // FORCE REFRESH to ensure replaced data is visible
        UI.showToast(`Imported ${filename} (${action})`, 'success');
    },

    /**
     * Loads settings from a JSON file.
     * @param {Event} e - File input change event
     */
    /**
     * @param {Event & { target: HTMLInputElement }} e
     */
    async handleLoadSettings(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const config = JSON.parse(text);

            // Apply config values (with validation)
            if (config.apiEndpoint && typeof config.apiEndpoint === 'string') {
                Config.API_ENDPOINT = config.apiEndpoint;
            }
            if (config.modelNameGemini) Config.MODEL_NAME_GEMINI = config.modelNameGemini;
            if (config.modelNameOpenrouter) Config.MODEL_NAME_OPENROUTER = config.modelNameOpenrouter;
            if (config.modelNameCustom) Config.MODEL_NAME_CUSTOM = config.modelNameCustom;
            if (config.apiUrlCustom) Config.API_URL_CUSTOM = config.apiUrlCustom;
            if (typeof config.historyLimit === 'number' && config.historyLimit > 0) {
                Config.HISTORY_LIMIT = config.historyLimit;
            }
            if (typeof config.searchDebounceDelay === 'number' && config.searchDebounceDelay >= 0) {
                Config.SEARCH_DEBOUNCE_DELAY = config.searchDebounceDelay;
            }

            // Persist to storage
            saveConfig();

            // Update UI
            const endpointSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('api-endpoint'));
            if (endpointSelect) endpointSelect.value = Config.API_ENDPOINT;
            UI.updateSettingsVisibility(Config.API_ENDPOINT);
            UI.renderApiSettings();

            // Reload page to ensure all settings take effect
            UI.showNotification('Settings loaded. Reloading page...', false);
            setTimeout(() => window.location.reload(), 1000);

        } catch (err) {
            console.error('Load Settings failed:', err);
            UI.showToast(`Import failed: ${err.message}`, 'error');
        }
        // Clear input so same file can be selected again
        /** @type {HTMLInputElement} */ (e.target).value = '';
    },

    /**
     * Resets all settings to defaults (preserves wildcard data).
     */
    handleResetSettings() {
        UI.showNotification('Reset all settings and API keys? Wildcard data will stay.', true, () => {
            localStorage.removeItem(Config.CONFIG_STORAGE_KEY);
            localStorage.removeItem('wildcards_api_key_openrouter');
            localStorage.removeItem('wildcards_api_key_gemini');
            localStorage.removeItem('wildcards_api_key_custom');

            UI.showNotification('Settings reset. Reloading...', false);
            setTimeout(() => window.location.reload(), 1000);
        });
    }
};
