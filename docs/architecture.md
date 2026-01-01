# Application Architecture

This document describes the architectural design of the Wildcard Generator application.

## Overview

The application is a **Single Page Application (SPA)** that runs entirely in the browser. It does not use any build tools (like Webpack or Vite) or backend servers. It relies on standard ES Modules and modern browser APIs.

## Core Modules

The application logic is modularized in the `js/` directory:

| Module | File | Responsibilities |
|--------|------|------------------|
| **Entry** | `main.js` | Initializes the app, sets up service workers, and conditionally exposes modules for testing. |
| **Logic** | `app.js` | The "controller" of the MVC pattern. Handles initialization, event delegation, and coordinates interactions between State, UI, and API. |
| **State** | `state.js` | Manages the application data using a deep Proxy pattern. It automatically persists state to localStorage and triggers UI updates on changes. |
| **UI** | `ui.js` | Handles DOM manipulation and rendering. It receives data from the State module and renders the hierarchical category/wildcard structure. |
| **API** | `api.js` | Manages communication with LLM providers (OpenRouter, Gemini, Custom). Handles streaming responses and error parsing. |
| **Config** | `config.js` | Manages configuration settings (history limit, debounce delays, etc.) and provides default values. |
| **Utils** | `utils.js` | Contains helper functions for debouncing, sanitizing strings, and other utility tasks. |

## Data Flow

1.  **User Interaction**: The user interacts with the UI (clicks, typing, etc.).
2.  **Event Handling**: `app.js` catches these events via event delegation on the main container.
3.  **State Update**: `app.js` calls methods in `state.js` to modify the application data (e.g., `State.addCategory()`).
4.  **Reactivity**: The Proxy in `state.js` intercepts the modification, updates the internal data structure, and triggers a callback.
5.  **Rendering**: The callback (registered by `app.js`) triggers `UI.renderAll()` or specific UI update methods in `ui.js`.
6.  **Persistence**: `state.js` automatically saves the updated state to `localStorage`.

## State Management

The application uses a **Deep Proxy** pattern to manage state. This allows for direct mutation of the state object (e.g., `state.categories.push(newItem)`) while still capturing every change to trigger side effects (rendering and saving).

- **`createDeepProxy`**: Wraps the data object and its nested objects recursively.
- **`path`**: The proxy keeps track of the path to the current property (e.g., `categories.characters.subcategories`), allowing for precise updates.

## UI Rendering

- **DOM Replacement**: When a category is updated, `ui.js` often replaces the entire DOM element for that category rather than diffing individual nodes.
- **State Preservation**: To prevent the UI from resetting (e.g., closing folders), `ui.js` manually preserves the `open` state of `<details>` elements during re-renders.
- **Lazy Loading**: Categories are rendered with their content initially hidden or empty until expanded, improving performance for large datasets.

## CSS & Styling

- **Framework**: Tailwind CSS (via CDN) is used for utility classes.
- **Custom Styles**: `wildcards.css` contains custom styles for specific components like the tree view, loaders, and transitions.
- **Theming**: Dark/Light mode is supported via a toggle that adds/removes a `dark` class on the `html` element.

## External Dependencies

All dependencies are loaded via CDN in `index.html`:
- **Tailwind CSS**: Styling.
- **YAML**: Parsing and stringifying YAML for import/export.
- **JSZip**: Creating ZIP archives for export.
