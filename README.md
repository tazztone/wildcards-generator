# AI-Powered Wildcard Generator (Web Version)

A standalone Single Page Application (SPA) for managing and generating "wildcards" (dynamic lists of terms) for AI image generation prompts. Runs directly in your browser.

## Features

### Core
- **Hierarchical Organization** — Nested folders and categories
- **AI Generation** — Use LLMs (Gemini, OpenRouter, or OpenAI-compatible APIs) to expand lists
- **Import/Export** — YAML format, ZIP download with folder structure
- **Search** — Instant search with match highlighting
- **Undo/Redo** — Full history support

### v2.9+
- 🍞 **Toast Notifications** — Non-blocking status messages
- 📱 **PWA/Offline** — Works without internet after first load
- ⚡ **Lazy Loading** — Categories load on expand

### v2.10+
- 🌙/☀️ **Theme Toggle** — Dark/Light mode with persistence
- ⌨️ **Keyboard Navigation** — Arrow keys + Enter + Escape
- 🔍 **Duplicate Detection** — Find duplicates across categories
- 📌 **Favorites/Pinning** — Pin categories to top

### v2.11+
- 📊 **Statistics Dashboard** — Category/wildcard/pinned counts
- ✅ **Batch Operations** — Select and operate on multiple categories
- 🔆 **Search Highlighting** — Visual match highlighting

## Getting Started

Open `index.html` in any modern browser. No installation or server required.

### Configuration

Click **Global Settings** to:
- Enter API keys (Gemini, OpenRouter, etc.)
- Customize system prompts
- Adjust UI settings

You can also use `api-keys.json` (rename `api-keys.json.example`) to preload keys.

## Development

Built with vanilla HTML, CSS, and JavaScript (ES Modules).

| File | Purpose |
|------|---------|
| `index.html` | Entry point |
| `wildcards.js` | Application logic |
| `wildcards.css` | Styling |
| `data/` | Default dataset |
| `tests/` | Playwright E2E tests |

### Testing

```bash
npm install -D @playwright/test http-server
npx playwright install chromium
npx playwright test
```

## For Developers & AI Agents

See `AGENTS.md` for architecture rules and development workflows.

## Contributing

Feel free to open issues or submit pull requests.
