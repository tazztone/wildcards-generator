const fs = require('fs');

let content = fs.readFileSync('js/config.js', 'utf8');

// Remove TODO
content = content.replace('// TODO: Add config diff/export for debugging user issues\n', '');

// Add USER_DEFAULTS and ALL_DEFAULTS
const userDefaultsCode = `const USER_DEFAULTS = {
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

export const Config = {};`;

content = content.replace('export const Config = {};', userDefaultsCode);

// Remove userDefaults definition inside loadConfig
const loadConfigRegex = /        \/\/ Define defaults for user settings that are no longer in config\.json\n        const userDefaults = \{[\s\S]*?        \};\n\n\n/;
content = content.replace(loadConfigRegex, '\n\n');

// Replace Object.assign in loadConfig
content = content.replace('Object.assign(Config, defaultConfig, userDefaults, parsedConfig);', 'Object.assign(Config, ALL_DEFAULTS, parsedConfig);');

// Remove defaultConfig initialization inside loadConfig as it's no longer used if we use ALL_DEFAULTS
content = content.replace('        const defaultConfig = { ...CONFIG_CONSTANTS };\n\n        const savedConfig = localStorage.getItem(defaultConfig.CONFIG_STORAGE_KEY);', '        const savedConfig = localStorage.getItem(ALL_DEFAULTS.CONFIG_STORAGE_KEY);');

fs.writeFileSync('js/config.js', content);
