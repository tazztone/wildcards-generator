const fs = require('fs');

let content = fs.readFileSync('js/config.js', 'utf8');

content = content.replace('        const allDefaults = ALL_DEFAULTS;\n\n', '');

fs.writeFileSync('js/config.js', content);
