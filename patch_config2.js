const fs = require('fs');

let content = fs.readFileSync('js/config.js', 'utf8');

const getConfigDiffRegex = /        const changedConfig = \{\};\n        for \(const key in Config\) \{\n            \/\/ Skip runtime-only keys\n            if \(key\.startsWith\('API_KEY'\)\) continue;\n\n            \/\/ Save if it's a known config key AND it's different from default OR it's a new user setting\n            if \(Config\.hasOwnProperty\(key\)\) \{\n                \/\/ If present in defaults, check if changed\n                if \(allDefaults\.hasOwnProperty\(key\)\) \{\n                    if \(JSON\.stringify\(Config\[key\]\) !== JSON\.stringify\(allDefaults\[key\]\)\) \{\n                        changedConfig\[key\] = Config\[key\];\n                    \}\n                \}\n                \/\/ If it's a user setting loaded from storage \(not in static defaults but valid config\)\n                else if \(\['API_URL_CUSTOM', 'MODEL_NAME_GEMINI', 'MODEL_NAME_OPENROUTER', 'MODEL_NAME_CUSTOM', 'API_ENDPOINT', 'CUSTOM_SYSTEM_PROMPT', 'CUSTOM_SUGGEST_PROMPT', 'CUSTOM_TEMPLATE_PROMPT', 'PREFERRED_VIEW',\n                    'MODEL_TEMPERATURE', 'MODEL_MAX_TOKENS', 'MODEL_TOP_P', 'MODEL_TOP_K', 'MODEL_FREQUENCY_PENALTY', 'MODEL_PRESENCE_PENALTY', 'MODEL_REPETITION_PENALTY', 'MODEL_MIN_P', 'MODEL_TOP_A', 'MODEL_SEED',\n                    'MODEL_REASONING_EFFORT', 'MODEL_REASONING_MAX_TOKENS',\n                    'MINDMAP_FONT_SIZE_CATEGORY', 'MINDMAP_FONT_SIZE_LIST', 'MINDMAP_FONT_SIZE_WILDCARD',\n                    'DEFAULT_WILDCARDS_VISIBLE', 'ENABLE_ANIMATIONS', 'COMPACT_CARD_MODE', 'AUTO_SAVE_INTERVAL', 'STORAGE_PROFILE', 'CARD_HEIGHT',\n                    'DEFAULT_WILDCARDS_VISIBLE', 'ENABLE_ANIMATIONS', 'COMPACT_CARD_MODE', 'AUTO_SAVE_INTERVAL', 'STORAGE_PROFILE',\n                    'USE_HYBRID_ENGINE', 'TEMPLATE_MODE',\n                    'ENABLE_PROMPT_CACHING', 'CACHE_TTL',\n                    'LOG_MAX_ENTRIES', 'LOG_AUTO_DELETE_DAYS'\n                \]\.includes\(key\)\) \{\n                    changedConfig\[key\] = Config\[key\];\n                \}\n            \}\n        \}/;

const diffFunctionString = `
/**
 * Returns an object containing all config settings that differ from their default values.
 * Useful for debugging and building a concise save payload.
 * @returns {Object} The configuration differences
 */
export function getConfigDiff() {
    const changedConfig = {};
    for (const key in Config) {
        // Skip runtime-only keys entirely
        if (key.startsWith('API_KEY')) continue;

        if (Config.hasOwnProperty(key)) {
            // Include if the value differs from ALL_DEFAULTS
            if (ALL_DEFAULTS.hasOwnProperty(key)) {
                if (JSON.stringify(Config[key]) !== JSON.stringify(ALL_DEFAULTS[key])) {
                    changedConfig[key] = Config[key];
                }
            } else {
                 // For safety: if there's a setting in Config that isn't in ALL_DEFAULTS, include it
                 changedConfig[key] = Config[key];
            }
        }
    }
    return changedConfig;
}

/**
 * Builds a debug payload including config diff, user-agent, and a timestamp.
 * Filters out sensitive keys like API keys.
 * @returns {string} JSON string of the debug config
 */
export function exportConfigForDebug() {
    const diff = getConfigDiff();

    // Safety check to ensure no API keys leak
    for (const key of Object.keys(diff)) {
        if (key.includes('API_KEY')) {
            delete diff[key];
        }
    }

    const payload = {
        _comment: "Wildcards Generator Debug Config",
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        configDiff: diff
    };

    return JSON.stringify(payload, null, 2);
}
`;


content = content.replace(getConfigDiffRegex, '        const changedConfig = getConfigDiff();');
content += diffFunctionString;

fs.writeFileSync('js/config.js', content);
