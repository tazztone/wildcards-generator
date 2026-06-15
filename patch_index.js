const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const exportSettingsBtnStr = `<button id="export-settings-btn"
                                    class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                                    📤 Export Settings
                                </button>`;

const newButtonsStr = `<button id="export-settings-btn"
                                    class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center gap-2">
                                    📤 Export Settings
                                </button>
                                <button id="export-debug-config-btn"
                                    class="bg-gray-700 hover:bg-gray-600 text-indigo-300 text-sm font-medium py-2 px-4 rounded-md transition-colors flex items-center gap-2 border border-indigo-500/30">
                                    🐞 Export Debug Config
                                </button>`;

content = content.replace(exportSettingsBtnStr, newButtonsStr);

fs.writeFileSync('index.html', content);
