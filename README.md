# Wildcards Generator

[![Version](https://img.shields.io/badge/version-2.21-blue)](https://github.com/tazztone/wildcards-generator)
[![JavaScript](https://img.shields.io/badge/vanilla-JS-f7df1e)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA](https://img.shields.io/badge/PWA-ready-green)](#)

A powerful, standalone Single Page Application (SPA) for organizing, managing, and AI-generating dynamic wildcard prompt libraries for image generation tools. Built with vanilla JavaScript — no framework, no build step.

> **What are wildcards?** Wildcards are dynamic text lists (e.g., `__colors__`, `__styles__`) used to randomize prompts in Stable Diffusion, ComfyUI, and similar tools. This app lets you organize thousands of terms into a clean hierarchy and uses LLMs to generate new ideas automatically.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (ES Modules), no framework |
| Styling | Custom CSS — glassmorphism + dark/light theme |
| AI Integration | OpenRouter / Google Gemini / OpenAI-compatible APIs |
| Visualization | Mind Elixir (mindmap view) |
| Data | In-browser localStorage + YAML import/export + ZIP export |
| Testing | Playwright |
| Dev Server | Node.js (for ES Module serving) |

## Architecture

```
/
├── index.html              # Single entry point
├── js/
│   ├── app.js              # Core state manager and orchestrator
│   ├── ui.js               # DOM rendering and event binding
│   ├── llm.js              # LLM provider abstraction (OpenRouter/Gemini/OpenAI)
│   ├── mindmap.js          # Mind Elixir integration
│   ├── yaml.js             # YAML serialization / deserialization
│   └── templates.js        # Hybrid prompt template engine
├── docs/
│   ├── AGENTS.md           # Architecture deep-dive and developer guidelines
│   ├── TESTING.md          # Playwright test suite instructions
│   └── LLM_API_docs.md     # OpenRouter API reference
└── assets/
```

Every category has a persistent `_id` so that metadata and tags survive drag-and-drop reorganization. The template engine performs a two-stage semantic analysis (heuristics + AI) to classify category roles (Subject, Location, Style, Modifier) and generate cohesive combinatorial prompts.

## Key Features

- **Hierarchical organization** — unlimited nested folders with drag-and-drop reordering
- **AI generation** — context-aware generation using the full folder path as prompt context; supports OpenRouter, Gemini, and local models (LM Studio / Ollama)
- **3 view modes** — List, Mindmap (Mind Elixir), Dual Pane
- **Hybrid template engine** — semantic category analysis generates structured, natural combinatorial prompts
- **Batch operations** — bulk generate, bulk delete, select-all across the hierarchy
- **Deduplication** — visual duplicate finder with "Keep Shortest / Keep Longest" cleanup
- **Import / Export** — YAML per-category, full ZIP archive preserving folder structure, config backup
- **Undo / Redo** — diff-based high-performance history (deepDiff)
- **PWA** — offline capable, installable

## Quick Start

```bash
git clone https://github.com/tazztone/wildcards-generator.git
cd wildcards-generator
npm install
npm run dev
# → http://localhost:3000
```

To enable AI generation, open **Global Settings** and configure an API provider (OpenRouter recommended — access to hundreds of models with a single key).

## Ecosystem

This app is the **expansion** half of the wildcard workflow. Use [wildcards-gen](https://github.com/tazztone/wildcards-gen) to generate structured skeleton YAML files, then import them here for AI-powered population.

## Documentation

- **[Architecture & Developer Guide](docs/AGENTS.md)**
- **[Testing](docs/TESTING.md)**
- **[LLM API Reference](docs/LLM_API_docs.md)**

## Contributing

Contributions are welcome. Converting to a framework is not a goal — the project intentionally stays vanilla and lightweight. See [AGENTS.md](docs/AGENTS.md) for strict architectural rules.
