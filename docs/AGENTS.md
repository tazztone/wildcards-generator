# Instructions for AI Agents

This file contains context and rules for AI agents working on this repository.

## 📌 Project Overview
**Wildcards Generator** is a client-side SPA for managing and generating dynamic prompt lists ("wildcards") for AI image generation. It features a hierarchical list view, a mindmap visualization, and LLM-powered generation.

The application runs entirely in the browser, relying on standard ES Modules and modern browser APIs without any build tools (Webpack/Vite) or backend servers.

## 🛠️ Technology Stack
*   **Core**: Vanilla JavaScript (ES Modules), HTML5, CSS3.
*   **No Build Step**: Works directly in the browser. No Webpack/Vite/Babel.
*   **Styling**: 
    *   Tailwind CSS (via CDN) for utility classes.
    *   `wildcards.css` for custom component styles.
    *   **Prompt Caching**: Enabled for OpenRouter (via `api.js` multipart messages).
    *   Theming: Dark/Light mode supported via `dark` class on `html` element.
*   **Libraries (Global Scope)**:
    *   `mind-elixir` (Mindmap visualization)
    *   `YAML` (Data parsing/stringifying)
    *   `JSZip` (Exporting ZIP archives)
*   **Testing**: Playwright (`tests/`)

## 📝 Development Standards

### Code Style
- **JavaScript**: Modern ES6+. Keep logic modular (in `js/` folder).
- **CSS**: Use Tailwind CSS utility classes where possible. Use `wildcards.css` for custom components.
- **HTML**: Keep structure semantic.

### Contribution Workflow
1.  **Tests**: Ensure all Playwright tests pass (`npm test`) before confirming a task complete.
2.  **Repo Structure**: Do not create new top-level folders unless explicitly instructed. Keep all logic in `js/`.


## ⚡ Core Directives

1.  **No Build Tools**: **NEVER** introduce a build step or npm-only dependencies that require bundling. Use CDNs in `index.html` if a library is absolutely needed.
2.  **Type Safety**: The project uses JSDoc for checks. See `jsconfig.json`. Fix type errors if you cause them.
3.  **Event Delegation**: 
    *   The application uses a **MVC-like** pattern.
    *   `app.js` is the controller handling event delegation on the main container.
    *   Avoid `event.stopPropagation()` unless absolutely necessary.
4.  **Modular Logic**: Keep concerns separated in `js/`.
5.  **Testing**: Run tests to verify changes:
    *   `npm test` (Runs all Playwright tests)
    *   `npm run dev` (Starts local server)

## 📂 Project Structure

```text
├── index.html           # Entry point (CDNs, Layout)
├── wildcards.css        # Custom component styling
├── js/                  # ES Modules
│   ├── app.js           # Main controller
│   ├── state.js         # Reactive state (Proxy)
│   ├── ui.js            # DOM manipulation
│   ├── api.js           # API Logic
│   ├── logger.js        # IndexedDB Logging Wrapper
│   ├── config.js        # Default configuration
│   ├── modules/         # Feature modules (mindmap, drag-drop)
├── data/                # Initial wildcard data (YAML)
├── tests/               # Playwright spec files (.spec.js)
├── verification/        # Manual/automated verification scripts & screenshots
├── test-results/        # Test run outputs & reports
└── docs/                # Architecture, guides, & agent rules
    ├── AGENTS.md        # This file
    ├── TESTING.md       # Testing guide (moved from tests/)
    ├── LLM_API_docs.md  # API integration details
    └── mind_elixir.md   # Mindmap library notes
```

### Core Module Responsibilities

| Module | File | Responsibilities |
|--------|------|------------------|
| **Entry** | `main.js` | Initializes the app, sets up service workers, and conditionally exposes modules for testing. |
| **Logic** | `app.js` | The "controller" of the MVC pattern. Handles initialization, event delegation, and coordinates interactions between State, UI, and API. |
| **State** | `state.js` | Manages the application data using a deep Proxy pattern. Automatically persists state to localStorage, tracks history, and triggers granular UI updates via `deepDiff`. |
| **UI** | `ui.js` | Handles DOM manipulation and rendering. Receives data from State and renders the hierarchical category/wildcard structure. |
| **API** | `api.js` | Manages communication with LLM providers (OpenRouter, Gemini, Custom). Handles streaming, error parsing, and prompts. |
| **Config** | `config.js` | Manages configuration settings. Loads static defaults and handles user overrides (persisted to localStorage). |
| **Utils** | `utils.js` | Helper functions for debouncing, sanitizing strings, etc. |

### Feature Modules (`js/modules/`)

| Module | File | Responsibilities |
|--------|------|------------------|
| **Drag & Drop** | `drag-drop.js` | Handles all drag-and-drop functionality for reordering categories and wildcards. |
| **Import/Export** | `import-export.js` | Manages file I/O operations for YAML, ZIP, and Settings JSON files. |
| **Mindmap** | `mindmap.js` | Interactive mindmap visualization. Manages Mind Elixir instance, bidirectional sync with State, smart context menus, and focus mode UI. |
| **Settings** | `settings.js` | Handles API key verification and settings-related operations on startup. |

## 💾 Data & State Patterns

### YAML Handling
The `data/initial-data.yaml` uses a **comment-based instruction format**.
```yaml
Category_Name: # instruction: Description of the category
   - wildcard1
```
> **IMPORTANT**: Use `YAML.parseDocument()` + `State.processYamlNode()` to preserve these. Simple `YAML.parse()` will lose them!

### State Proxy Pattern
The application uses a **Deep Proxy** pattern to manage state (`state.js`). This allows for direct mutation of the state object while capturing every change.

*   **`createDeepProxy`**: Wraps the data object and its nested objects recursively.
*   **`path`**: The proxy keeps track of the path to the current property (e.g., `wildcards.Characters.wildcards.0`), allowing for precise updates.
*   **`deepDiff`**: When navigating history (Undo/Redo), this helper calculates the minimal set of changes between two state snapshots.
*   **`state-patch`**: A custom event used to deliver a batch of granular changes to the UI, improving performance from $O(n)$ to $O(m)$ where $m$ is the number of changes.

**Rules**:
1.  **Mutate `State.wildcards` directly**. The proxy intercepts modification and triggers UI updates.
2.  **Do NOT manually manipulate the DOM for data changes** (e.g. adding a list item). Let the `UI` react.
3.  **Exception**: You MAY manipulate DOM for transient generic UI states (e.g. toggling a detail open/close) to avoid expensive re-renders.

### Persistent Logging (IndexedDB)
API logs are stored persistently in the browser's IndexedDB (`wildcards_db` > `api_logs`).
*   **Access**: Use the `Logger` module (`js/logger.js`) for all log operations.
*   **Persistence**: Logs survive reloads and are automatically pruned (default 5000 entries).

## 🖥️ UI Architecture

*   **Granular Updates**: The UI responds to specific property changes (e.g., updating a single wildcard chip) rather than re-rendering entire categories whenever possible.
*   **DOM Replacement**: For complex changes or top-level category updates, `ui.js` may replace the corresponding DOM element. Full re-renders (`renderAll`) are reserved for structural changes like pinning.
*   **Animations**: Uses a specific DOM structure (`.accordion-wrapper` > `.accordion-inner`) to enable smooth CSS Grid-based transitions (`grid-template-rows`) for category expansion and collapse.
*   **State Preservation**: To prevent the UI from resetting, `ui.js` preserves the `open` state of `<details>` elements.
*   **Lazy Loading**: Categories are rendered with their content initially hidden or empty until expanded, improving performance for large datasets.
*   **View Modes**: Supports **List**, **Mindmap**, and **Dual Pane** views.

## 🔑 Security & API
*   **Storage**: API keys are stored in `localStorage` (encrypted) or memory only.
*   **No Hardcoding**: Never put keys in code.
*   **Settings**: managed via `config.js` and the settings panel.

## 📚 Documentation
*   Update `README.md` if features change.
