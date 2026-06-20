import { UI } from './ui.js';
import { encrypt, decrypt } from './crypto.js';
import { validate } from './schema-validator.js';

// TODO: Implement config versioning with automatic migration on version bumps

// Hardcoded defaults as Single Source of Truth for structure and prompts
const CONFIG_CONSTANTS = {
    CONFIG_STORAGE_KEY: "wildcardGeneratorConfig_v1",
    STORAGE_KEY: "wildcardGeneratorState_v12",
    HISTORY_KEY: "wildcardGeneratorHistory_v12",
    HISTORY_LIMIT: 50,
    SEARCH_DEBOUNCE_DELAY: 700,
    DEFAULT_SYSTEM_PROMPT: "You are a creative assistant for generating wildcards for AI image prompts. You will be given a category path, a list of existing wildcards, and optional custom instructions. Your task is to generate {count} more diverse and creative wildcards that fit the category. Do not repeat any from the existing list. Follow all custom instructions. Return ONLY the new wildcards as a JSON array of strings. Ensure that your response is a valid JSON array of strings, containing exactly {count} unique entries relevant to the category provided.",
    DEFAULT_SUGGEST_ITEM_PROMPT: "You are an expert creative assistant. Your task is to suggest {count} new, unique, and descriptive sub-category names for a parent category called '{parentPath}'.\n\n**RULES:**\n1. The names must be suitable for use as filenames. Use underscores_between_words.\n2. The names must be specific and creative.\n3. **CRITICAL:** Do NOT include the parent category name ('{parentPath}') in your suggestions.\n4. **CRITICAL:** Do NOT use generic placeholders like \"new_item\", \"category_name\", or similar variations.\n5. The output MUST be ONLY a valid JSON array of objects. Each object must have a \"name\" and an \"instruction\" key.\n\nFor context, you will be given the existing items that are siblings to the one you are suggesting for. Do not suggest items that already exist in the provided structure.",
    DEFAULT_TEMPLATE_PROMPT: "You are a Template Architect for AI image prompts.\n\nCreate prompt TEMPLATES using ~~CategoryName~~ syntax that reference the provided wildcard categories.\n\nYou will receive a list of AVAILABLE WILDCARD CATEGORIES wrapped in ~~tildes~~.\n\n**RULES:**\n1. Use ONLY the provided category names in ~~CategoryName~~ format\n2. Each template MUST have at least 2 different categories\n3. Use natural English connectors between categories (doing, at, in, with, near, etc.)\n4. Create varied, semantically coherent scene compositions\n5. Combine subjects, actions, and environments creatively\n\nReturn ONLY a valid JSON array of {count} template strings.",
    DEFAULT_DEDUPLICATE_PROMPT: "You are an expert at organizing data. For each duplicate wildcard, determine which category path is the BEST semantic fit based on the category names. Choose the category that most naturally represents the wildcard's meaning.\n\nReturn a JSON array with your decisions. For each item, include:\n- \"wildcard\": the normalized wildcard text\n- \"keep_path\": the full path to the category that should keep this wildcard",
    SHOW_GUIDANCE_STEP: true,
    ENABLE_PROMPT_CACHING: true,
    CACHE_TTL: '1h'
};


const configSchema = {
    type: 'OBJECT',
    properties: {
        API_URL_CUSTOM: { type: 'STRING' },
        MODEL_NAME_GEMINI: { type: 'STRING' },
        MODEL_NAME_OPENROUTER: { type: 'STRING' },
        MODEL_NAME_GROQ: { type: 'STRING' },
        MODEL_NAME_CUSTOM: { type: 'STRING' },
        API_ENDPOINT: { type: 'STRING' },
        CUSTOM_SYSTEM_PROMPT: { type: 'STRING' },
        CUSTOM_SUGGEST_PROMPT: { type: 'STRING' },
        CUSTOM_TEMPLATE_PROMPT: { type: 'STRING' },
        PREFERRED_VIEW: { type: 'STRING' },
        MODEL_TEMPERATURE: { type: 'NUMBER' },
        MODEL_MAX_TOKENS: { type: 'NUMBER' },
        MODEL_TOP_P: { type: 'NUMBER' },
        MODEL_TOP_K: { type: 'NUMBER' },
        MODEL_FREQUENCY_PENALTY: { type: 'NUMBER' },
        MODEL_PRESENCE_PENALTY: { type: 'NUMBER' },
        MODEL_REPETITION_PENALTY: { type: 'NUMBER' },
        MODEL_MIN_P: { type: 'NUMBER' },
        MODEL_TOP_A: { type: 'NUMBER' },
        MODEL_SEED: { type: 'NUMBER' },
        MODEL_REASONING_EFFORT: { type: 'STRING' },
        MODEL_REASONING_MAX_TOKENS: { type: 'NUMBER' },
        MINDMAP_FONT_SIZE_CATEGORY: { type: 'NUMBER' },
        MINDMAP_FONT_SIZE_LIST: { type: 'NUMBER' },
        MINDMAP_FONT_SIZE_WILDCARD: { type: 'NUMBER' },
        DEFAULT_WILDCARDS_VISIBLE: { type: 'BOOLEAN' },
        ENABLE_ANIMATIONS: { type: 'BOOLEAN' },
        COMPACT_CARD_MODE: { type: 'BOOLEAN' },
        AUTO_SAVE_INTERVAL: { type: 'NUMBER' },
        CARD_HEIGHT: { type: 'NUMBER' },
        STORAGE_PROFILE: { type: 'STRING' },
        USE_HYBRID_ENGINE: { type: 'BOOLEAN' },
        TEMPLATE_MODE: { type: 'STRING' },
        SHOW_GUIDANCE_STEP: { type: 'BOOLEAN' },
        LOG_MAX_ENTRIES: { type: 'NUMBER' },
        LOG_AUTO_DELETE_DAYS: { type: 'NUMBER' },
        ENABLE_PROMPT_CACHING: { type: 'BOOLEAN' },
        CACHE_TTL: { type: 'STRING' },
        MINDMAP_CATEGORY_FONT_SIZE: { type: 'NUMBER' },
        MINDMAP_NODE_FONT_SIZE: { type: 'NUMBER' },
        UNKNOWN_KEY: { type: 'STRING' }
    }
};

const USER_DEFAULTS = {
    API_URL_CUSTOM: "http://127.0.0.1:1234/v1",
    MODEL_NAME_GEMINI: "",
    MODEL_NAME_OPENROUTER: "",
    MODEL_NAME_GROQ: "",
    MODEL_NAME_CUSTOM: "",
    API_ENDPOINT: "openrouter",
    CUSTOM_SYSTEM_PROMPT: null,  // null = use default from config.json
    CUSTOM_SUGGEST_PROMPT: null,  // null = use default from config.json
    CUSTOM_TEMPLATE_PROMPT: null, // null = use default from config.json
    // View Mode Preference
    PREFERRED_VIEW: 'list',  // 'list', 'mindmap', or 'dual'
    // Advanced Model Defaults
    MODEL_TEMPERATURE: 0.7,
    MODEL_MAX_TOKENS: 1000,
    MODEL_TOP_P: 1.0,
    MODEL_TOP_K: 0,
    MODEL_FREQUENCY_PENALTY: 0.0,
    MODEL_PRESENCE_PENALTY: 0.0,
    MODEL_REPETITION_PENALTY: 1.0,
    MODEL_MIN_P: 0.0,
    MODEL_TOP_A: 0.0,
    MODEL_SEED: 0,
    MODEL_REASONING_EFFORT: 'default', // default, high, medium, low, none
    MODEL_REASONING_MAX_TOKENS: 0, // 0 = disabled
    // Mindmap Configuration
    MINDMAP_FONT_SIZE_CATEGORY: 96, // Bold, Outlined
    MINDMAP_FONT_SIZE_LIST: 64,     // Filled background
    MINDMAP_FONT_SIZE_WILDCARD: 20, // Basic
    // Display & UI Settings
    DEFAULT_WILDCARDS_VISIBLE: true,
    ENABLE_ANIMATIONS: true,
    COMPACT_CARD_MODE: false,
    AUTO_SAVE_INTERVAL: 0, // 0 = disabled, ms between auto-saves
    CARD_HEIGHT: 54, // User-adjustable height for wildcard cards
    // Storage Profile
    STORAGE_PROFILE: 'default',
    // Hybrid Template Engine
    USE_HYBRID_ENGINE: false,
    TEMPLATE_MODE: 'wildcard',  // 'wildcard' | 'strict' | 'hybrid'
    SHOW_GUIDANCE_STEP: true,
    // Logging
    LOG_MAX_ENTRIES: 5000,
    LOG_AUTO_DELETE_DAYS: 0, // 0 = disabled, delete logs older than X days
    // Prompt Caching
    ENABLE_PROMPT_CACHING: true,
    CACHE_TTL: '1h'
};

const ALL_DEFAULTS = { ...CONFIG_CONSTANTS, ...USER_DEFAULTS };

export const Config = {};

export async function loadConfig() {
    try {
        // Use CONFIG_CONSTANTS as the single source of truth for defaults
        const savedConfig = localStorage.getItem(ALL_DEFAULTS.CONFIG_STORAGE_KEY);



        let parsedConfig = {};
        if (savedConfig) {
            try {
                parsedConfig = JSON.parse(savedConfig);
                const { isValid, errors } = validate(parsedConfig, configSchema);
                if (!isValid) {
                    console.warn("Config validation failed, falling back to defaults:", errors);
                    if (UI && UI.showNotification) {
                        UI.showNotification("Corrupted configuration detected. Falling back to defaults.", "warning");
                    }
                    parsedConfig = {}; // Reset to defaults
                }
            } catch (e) {
                console.warn("Failed to parse saved config, falling back to defaults:", e);
                parsedConfig = {};
            }
        }

        Object.assign(Config, ALL_DEFAULTS, parsedConfig);


        // Migration: Port old keys to new keys if they exist in Config (merged from saved) but new keys are default
        // Old: MINDMAP_CATEGORY_FONT_SIZE -> New: MINDMAP_FONT_SIZE_CATEGORY
        // Old: MINDMAP_NODE_FONT_SIZE     -> New: MINDMAP_FONT_SIZE_LIST
        // Note: Check Config directly as it contains the merged result
        if (Config.MINDMAP_CATEGORY_FONT_SIZE && !savedConfig?.includes('MINDMAP_FONT_SIZE_CATEGORY')) {
            Config.MINDMAP_FONT_SIZE_CATEGORY = Config.MINDMAP_CATEGORY_FONT_SIZE;
            delete Config.MINDMAP_CATEGORY_FONT_SIZE;
        }
        if (Config.MINDMAP_NODE_FONT_SIZE && !savedConfig?.includes('MINDMAP_FONT_SIZE_LIST')) {
            Config.MINDMAP_FONT_SIZE_LIST = Config.MINDMAP_NODE_FONT_SIZE;
            delete Config.MINDMAP_NODE_FONT_SIZE;
        }

        // Initialize empty API keys - users enter keys via Settings panel
        // Check for persisted keys
        const loadKey = async (keyName) => {
            const saved = localStorage.getItem(`wildcards_api_key_${keyName}`);
            if (saved) {
                try {
                    // Try to parse as JSON (new encryption format)
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.iv && parsed.encrypted) {
                        try {
                            const iv = Uint8Array.from(atob(parsed.iv), c => c.charCodeAt(0));
                            const encrypted = Uint8Array.from(atob(parsed.encrypted), c => c.charCodeAt(0));
                            const decrypted = await decrypt({ iv, encrypted });
                            return decrypted || '';
                        } catch (decryptError) {
                            console.error(`Failed to decrypt key for ${keyName}:`, decryptError);
                            return '';
                        }
                    }
                } catch (e) {
                    // Not JSON, fall back to simple base64 (legacy)
                    try {
                        return atob(saved);
                    } catch (base64Error) {
                        return '';
                    }
                }
            }
            return '';
        };

        Config.GEMINI_API_KEY = await loadKey('gemini');
        Config.OPENROUTER_API_KEY = await loadKey('openrouter');
        Config.GROQ_API_KEY = await loadKey('groq');
        Config.CUSTOM_API_KEY = await loadKey('custom');

    } catch (error) {
        console.error("Failed to load configuration:", error);
        // Fallback to constants
        Object.assign(Config, CONFIG_CONSTANTS);
    }
}


let lastSaveToastTime = 0;

export async function saveConfig() {
    try {
        const changedConfig = getConfigDiff();

        localStorage.setItem(Config.CONFIG_STORAGE_KEY, JSON.stringify(changedConfig));

        if (UI && UI.showToast) {
            const now = Date.now();
            if (now - lastSaveToastTime > 1000) {
                UI.showToast('Configuration saved.', 'success');
                lastSaveToastTime = now;
            }
        }
    } catch (error) {
        console.error("Failed to save config:", error);
        if (UI && UI.showNotification) UI.showNotification(`Error saving configuration: ${error.message}`);
    }
}

export function updateConfigValue(key, value) {
    if (typeof value === 'number' && isNaN(value)) return;
    if (typeof value === 'string' && value.trim() === '') return;

    if (Config.hasOwnProperty(key)) {
        if (typeof Config[key] === 'number') {
            const parsed = Number(value);
            if (!isNaN(parsed)) {
                Config[key] = parsed;
            } else {
                return; // Do not update or save if invalid number
            }
        } else {
            Config[key] = value;
        }
        saveConfig();
    }
}

// Helper function to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Validate API key format for supported providers
 * @param {string} provider - The provider ID (openrouter, gemini, groq)
 * @param {string} key - The API key string
 * @returns {{isValid: boolean, error: string|null}}
 */
export function isValidApiKeyFormat(provider, key) {
    if (!key) return { isValid: true, error: null }; // Allow empty keys (resetting)

    const k = key.trim();
    switch (provider.toLowerCase()) {
        case 'openrouter':
            if (!k.startsWith('sk-or-')) {
                return { isValid: false, error: 'OpenRouter keys typically start with "sk-or-"' };
            }
            break;
        case 'gemini':
            if (!k.startsWith('AIzaSy')) {
                return { isValid: false, error: 'Gemini keys typically start with "AIzaSy"' };
            }
            break;
        case 'groq':
            if (!k.startsWith('gsk_')) {
                return { isValid: false, error: 'Groq keys typically start with "gsk_"' };
            }
            break;
    }
    return { isValid: true, error: null };
}

export async function saveApiKey(provider, key, persist) {
    const validation = isValidApiKeyFormat(provider, key);

    const configKey = `${provider.toUpperCase()}_API_KEY`;
    Config[configKey] = key;

    const storageKey = `wildcards_api_key_${provider}`;
    if (persist) {
        const encryptedData = await encrypt(key);
        if (encryptedData) {
            // Store IV and encrypted data together
            const dataToStore = {
                iv: arrayBufferToBase64(encryptedData.iv),
                encrypted: arrayBufferToBase64(encryptedData.encrypted),
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        }
    } else {
        localStorage.removeItem(storageKey);
    }

    return validation;
}

/**
 * Check if a setting is using its default value
 * @param {string} key - The config key to check
 * @returns {boolean} - True if using default, false if custom
 */
export function isUsingDefault(key) {
    if (!key || typeof key !== 'string' || !ALL_DEFAULTS.hasOwnProperty(key)) {
        return false;
    }
    return Config[key] === ALL_DEFAULTS[key];
}

/**
 * Reset a setting to its default value
 * @param {string} key - The config key to reset
 */
export function resetToDefault(key) {
    if (key === 'CUSTOM_SYSTEM_PROMPT') {
        Config.CUSTOM_SYSTEM_PROMPT = null;
        saveConfig();
    } else if (key === 'CUSTOM_SUGGEST_PROMPT') {
        Config.CUSTOM_SUGGEST_PROMPT = null;
        saveConfig();
    } else if (key === 'CUSTOM_TEMPLATE_PROMPT') {
        Config.CUSTOM_TEMPLATE_PROMPT = null;
        saveConfig();
    } else if (key === 'API_ENDPOINT') {
        Config.API_ENDPOINT = 'openrouter';
        saveConfig();
    }
}

/**
 * Get the effective prompt value (custom if set, else default)
 * @param {string} key - 'system' or 'suggest'
 * @returns {string} - The prompt to use
 */
export function getEffectivePrompt(key) {
    if (key === 'system') {
        return Config.CUSTOM_SYSTEM_PROMPT !== null
            ? Config.CUSTOM_SYSTEM_PROMPT
            : Config.DEFAULT_SYSTEM_PROMPT;
    }
    if (key === 'suggest') {
        return Config.CUSTOM_SUGGEST_PROMPT !== null
            ? Config.CUSTOM_SUGGEST_PROMPT
            : Config.DEFAULT_SUGGEST_ITEM_PROMPT;
    }
    if (key === 'template') {
        return Config.CUSTOM_TEMPLATE_PROMPT !== null
            ? Config.CUSTOM_TEMPLATE_PROMPT
            : Config.DEFAULT_TEMPLATE_PROMPT;
    }
    return '';
}

/**
 * Set a custom prompt value
 * @param {string} key - 'system' or 'suggest'
 * @param {string} value - The new prompt value
 */
export function setCustomPrompt(key, value) {
    if (key === 'system') {
        // Check if value matches default
        if (value === Config.DEFAULT_SYSTEM_PROMPT) {
            Config.CUSTOM_SYSTEM_PROMPT = null;
        } else {
            Config.CUSTOM_SYSTEM_PROMPT = value;
        }
    } else if (key === 'suggest') {
        if (value === Config.DEFAULT_SUGGEST_ITEM_PROMPT) {
            Config.CUSTOM_SUGGEST_PROMPT = null;
        } else {
            Config.CUSTOM_SUGGEST_PROMPT = value;
        }
    } else if (key === 'template') {
        if (value === Config.DEFAULT_TEMPLATE_PROMPT) {
            Config.CUSTOM_TEMPLATE_PROMPT = null;
        } else {
            Config.CUSTOM_TEMPLATE_PROMPT = value;
        }
    }
    saveConfig();
}

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
