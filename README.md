# Wildcards Generator (AI-Powered)

A powerful, standalone **Single Page Application (SPA)** for organizing, managing, and generating dynamic "wildcards" for AI image generation prompts. Built with a modern **Glassmorphism UI**, smooth animations, and direct **LLM Integration**.

![screenshot](assets/image.png)

> **What are Wildcards?**
> Wildcards are dynamic lists of terms (e.g., `__colors__`, `__styles__`) used to randomize image prompts. This tool helps you organize thousands of terms into a clean hierarchy and uses AI to generate new ideas automatically.

## ✨ Core Features

### Hierarchical Organization
- **Nested Categories**: Create unlimited levels of folders and subfolders to organize your wildcards.
- **Drag & Drop**: Reorder items or move them between categories anywhere in the hierarchy.
- **Stable Identity**: Every category has a persistent `_id`, ensuring tags and metadata stay safe even when moving folders.

### AI Generation
- **LLM Integration**: Connect to powerful AI models via **OpenRouter**, **Google Gemini**, or any **OpenAI-compatible** API.
- **Context-Aware**: The AI understands the context of the folder structure (e.g., `Characters > Fantasy > Orcs`) to generate relevant items.
- **Custom Instructions**: Add specific instructions to categories or wildcard lists to guide the generation (e.g., "fantasy style", "sci-fi names").
- **Hybrid Template Generation**: Semantic analysis engine identifies category roles (Subject, Location, etc.) to generate structured, natural prompts.

### Wildcard Management
- **Manual Editing**: Add, edit, or delete wildcard items manually. Double-click to rename.
- **Batch Operations**: Select multiple items or categories to delete, move, or generate content in bulk.
- **Search**: Instantly search through all your wildcards with match highlighting.
- **Mindmap View**: Visualize and manage your collection as an interactive mindmap.
- **Deduplication**: Smart search and deduplication tools to keep your lists clean.
- **Responsive**: Runs entirely in the browser (PWA-ready).

## 🔄 Import & Export

- **YAML Support**: Import and export your entire collection or specific parts in YAML format.
- **ZIP Export**: Download your entire collection as a ZIP file, preserving the folder structure as directories.
- **Config Export**: Share or backup your application settings (excluding API keys).

## 🚀 Quick Start

### 1. Run Locally
Since this app uses ES Modules, it must be served via a local web server (not opened directly as a file).

**Using Node (Recommended)**:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### 2. Configure AI Provider
To unlock AI generation features:
1. Click **Global Settings** (bottom-left or top toolbar).
2. Choose your provider:
   - **OpenRouter**: Best for access to hundreds of models (Claude, GPT-4, Llama 3).
   - **Google Gemini**: Great free tier and high speed.
   - **Custom / Local**: Connect to LM Studio or Ollama running locally.
3. Enter your API Key. (Keys are stored safely in your browser's session memory).

## 📖 Usage Guide

### Managing Wildcards
- **Create**: Use the `+` buttons to add categories (folders) or wildcard lists.
- **Edit**: **Double-click** any name to rename it.
- **Drag & Drop**: Move items anywhere in the hierarchy.

### Generating Content
- **Single List**: Click the **Generate** button on any wildcard card.
- **Contextual**: The AI sees the path (e.g., `Characters > Fantasy > Orcs`) and existing items to generate relevant additions.
- **Templates**: Create a folder named `0_TEMPLATES`. Lists created here allow you to select other categories as "sources" to generate complex combinatorial prompts.

### Views
- **List View**: Classic vertical hierarchy.
- **Mindmap View**: Visual node-based graph. Great for brainstorming structure.
- **Focus Mode**: Hides everything except the active category for distraction-free work.

## 📜 Feature History

### v2.21 Features (Current)
- **Hybrid Template Generation**:
  - **Special Folder Discovery**: Lists inside a folder named **`0_TEMPLATES`** are treated as reusable prompt templates.
  - **Semantic Category Analysis**: New two-stage tagger (Heuristics + AI) identifies category roles like Subject, Location, Style, and Modifier.
  - **Stable Node Identity**: Every category now has a persistent `_id`.
  - **Intelligent Template Engine**: Generates cohesive prompts using weighted patterns.
  - **Smart Phrases**: Transparently adds natural language context.
  - **Flexible Generation Modes**: Wildcard syntax (`~~path~~`) vs Strict literal expansion.
  - **Template Generation Toggle**: Local Hybrid Engine or external LLM.
  - **Status Badge Tracking**: "Outdated" badge alerts when structural changes need a new analysis run.

### v2.20 Features
- **UI/UX Polish**:
  - **Glassmorphism Aesthetic**: Modern, semi-transparent frosted-glass design.
  - **Smooth Animations**: Expansion and hover effects.
- **Search Restoration**:
  - **Fixed Search Bar**: Restored missing search input to the toolbar.
  - **Deep Search**: Improved search logic to correctly index content within the new animated DOM structure.

### v2.19 Features
- **Aggressive UI Compaction**:
  - **Compact Header**: Dual-row layout optimizes screen real estate.
  - **Streamlined Cards**: Actions (Generate, Copy, Delete) are now efficient header icons.
  - **Input Collapse**: "Add Wildcard" input is hidden by default.
  - **Select All Toggle**: New ☑/☐ toggle icon.
- **Enhanced Overflow Menu**: Repositioned next to Help button.

### v2.18 Features
- **Template Architect (`0_TEMPLATES`)**:
  - **Special Folder Magic**: Wildcard lists inside `0_TEMPLATES` use special generation mode.
  - **Context-Aware Generation**: Choose which wildcard categories to include as sources.
  - **Semantic Context**: Sends actual category names to AI.
  - **Template Syntax**: Generated templates use `~~category/path~~` syntax.

### v2.17 Features
- **Duplicate Finder Mode**:
  - **Unified "Dupe Finder" Button**: Activates mode, highlights duplicates, filters view.
  - **Floating Action Bar**: Contextual bar with "Clean Up" buttons.
  - **Mindmap Support**: Functional in Mindmap view.
- **Improved Clean Up Dialog**:
  - **Simplified Interface**: "Keep Shortest" / "Keep Longest".
- **UI Refinements**: Icon-Only Toggle for "Show/Hide Wildcards".

### v2.16 Features
- **Mindmap UX Polish**:
  - **Smart Context Menu**: Dynamic actions based on node type.
  - **Unified Terminology**: Consistent "Category" and "Wildcard" terms.
  - **Enhanced Focus Mode**: Dedicated exit button.

### v2.15 Features
- **Mind Elixir Mindmap View**:
  - **Three View Modes**: List, Mindmap, Dual Pane.
  - **AI Context Menu**: "Generate More" / "Suggest Children" in mindmap.
  - **Theme Sync**: Adapts to dark/light theme.

### v2.14 Features
- **Advanced Batch Operations**:
  - **Batch Generate**: Recursive generation for folders.
  - **Batch Suggest**: Aggregated suggestions review.
  - **Granular Selection**: Checkboxes for mixed selection.
- **Improved UX**: Floating Batch Bar.

### v2.13 Features
- **Enhanced Safety**: Double-Click to edit, Edit indicators (pencil icons).
- **Improved Settings UX**: Explicit Save/Discard, Modal Toasts.
- **Advanced API Tools**: Streaming Generation, Test Model Dialog.
- **High-Performance Undo/Redo**: Diff-Based Updates (deepDiff).

### v2.12 Features
- **Import YAML/Settings**: Import buttons for YAML/JSON.
- **Data Management**: Restore Default Wildcards, Factory Reset.
- **Enhanced Duplicate Detection**: Visual highlighting, filter view.
- **Improved Help Dialog**: Shortcuts and tips.

### v2.11 Features
- **Statistics Dashboard**: Real-time counts.
- **Batch Operations**: Select All, Bulk Actions.
- **Search Highlighting**: Visual matches.
- **Secure Settings**: Keys in session memory.

### v2.10 Features
- **Theme Toggle**: Dark/Light modes.
- **Keyboard Navigation**: Arrows, Enter, Escape.
- **Duplicate Detection**: Identify duplicates.
- **Favorites/Pinning**: Pin top items.

### v2.9 Features
- **Toast Notifications**: Status updates.
- **PWA Support**: Offline capable.
- **Lazy Loading**: Performance optimization.

## 📚 Documentation

- **[Architecture](AGENTS.md)**: technical deep dive into modules, state management, and UI logic.
- **[Testing](tests/testing.md)**: running the Playwright test suite.
- **[API Reference](docs/openrouter_API_docs.md)**: OpenRouter integration details.

## 🤝 Contributing

Contributions are welcome! converting to a framework is NOT a goal; we aim to keep this vanilla and lightweight.
See **[AGENTS.md](AGENTS.md)** for developer guidelines.

## 🤖 For AI Agents

See **[AGENTS.md](AGENTS.md)** for strict architectural rules and workflow instructions.
