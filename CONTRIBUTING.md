# Contributing

We welcome contributions! This project is a standalone Single Page Application (SPA) designed to run without a build step.

## Getting Started

1.  **Fork** the repository.
2.  **Clone** your fork.
3.  **Open** `index.html` in your browser. That's it!

## Development Guidelines

### No Build Tools
This project strictly avoids build tools like Webpack, Vite, or Parcel.
- All code must run natively in modern browsers.
- Use ES Modules (`import`/`export`) with `.js` extensions.
- Do not use npm packages that require bundling. Use CDNs instead.

### Code Style
- **JavaScript**: Modern ES6+. Keep logic modular (in `js/` folder).
- **CSS**: Use Tailwind CSS utility classes where possible. Use `wildcards.css` for custom components.
- **HTML**: Keep structure semantic.

### Testing
We use Playwright for End-to-End (E2E) testing.

1.  **Install Dependencies**:
    ```bash
    npm install -D @playwright/test serve
    npx playwright install chromium
    ```

2.  **Run Tests**:
    ```bash
    npx playwright test
    ```

Please ensure all tests pass before submitting a Pull Request.

## Pull Requests

1.  Create a feature branch.
2.  Make your changes.
3.  Run tests to verify no regressions.
4.  Submit a PR with a clear description of your changes.

## AI Agents
If you are an AI agent, please refer to `AGENTS.md` for specific instructions and architectural constraints.
