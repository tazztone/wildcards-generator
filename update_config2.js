const fs = require('fs');

let content = fs.readFileSync('js/config.js', 'utf8');

// Replace saveConfig
const saveConfigRegex = /    try \{\n        \/\/ Build complete defaults from CONFIG_CONSTANTS \+ user defaults\n        const userDefaults = \{[\s\S]*?        const allDefaults = \{ \.\.\.CONFIG_CONSTANTS, \.\.\.userDefaults \};\n\n/;

content = content.replace(saveConfigRegex, '    try {\n        const allDefaults = ALL_DEFAULTS;\n\n');

fs.writeFileSync('js/config.js', content);
