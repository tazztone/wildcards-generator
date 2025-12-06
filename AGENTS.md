# Instructions for AI Agents

This file contains context and rules for AI agents working on this repository.

## Project Architecture
*   **Type**: Static Single Page Application (SPA).
*   **Languages**: HTML, CSS, JavaScript (ES Modules).
*   **No Build Step**: There is NO `npm build`, `webpack`, `vite`, etc. The code runs directly in the browser. Do not introduce build tools.
*   **No Backend**: There is NO Python or Node.js backend. All logic is client-side.
*   **Entry Point**: `index.html`.
*   **Logic**: `wildcards.js` (uses ES modules, imports `yaml` from CDN).
*   **Styling**: `wildcards.css` (Tailwind CSS is loaded via CDN in `index.html`, plus custom styles).

## Core Rules
1.  **Keep it Simple**: Do not introduce a build system or package manager (npm/yarn) unless explicitly requested and necessary.
2.  **Monolithic Structure**: The project structure is intentionally flat. `index.html`, `wildcards.js`, and `wildcards.css` are the main files. Do not split `wildcards.js` into many small files unless the file size becomes unmanageable.
3.  **No Python**: The project was previously a Python app but has been converted to a pure web app. Do not reintroduce Python files for the application logic.
4.  **Testing**: There are no automated unit tests currently. Verify changes by checking if `index.html` loads and functions correctly in a browser environment (conceptually).
    *   *Note*: Temporary Python Playwright scripts may be used for verification if available in the environment, but they are not part of the deployed application.

## Configuration & Data
*   **`config.json`**: Contains default configuration settings.
*   **`api-keys.json`**: (Git-ignored) Local file for storing API keys. See `api-keys.json.example`.
*   **`data/initial-data.yaml`**: Contains the default wildcard data loaded on first visit or reset.

## External Libraries
*   **Tailwind CSS**: Loaded via CDN.
*   **YAML**: `yaml` library loaded via CDN in `wildcards.js`.

## Documentation
*   See `docs/` for API documentation (e.g., OpenRouter).
