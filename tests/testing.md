# Testing Guide

## Quick Start
```bash
# Install dependencies
npm install -D @playwright/test serve
npx playwright install chromium

# Run all tests
npx playwright test
```

## Overview
*   **Framework**: Playwright (E2E & Integration)
*   **Browser**: Chromium
*   **Location**: `tests/`
*   **Target**: `http://localhost:3000`

## Core Test Files
*   **`e2e.spec.js`**: Main system flows (UI, Categories, Wildcards).
*   **`*_logic.spec.js`**: Unit logic for State, API, Search, and UI rules.
*   **`bug_*.spec.js`**: Regression tests for specific fixes.
*   **`mindmap_e2e.spec.js`**: Mindmap specific interactions.

## Troubleshooting & Tips
| Issue | Solution |
|-------|----------|
| **Timeouts** | API mocks or animations might be slow. Increase timeout. |
| **Flaky Tests** | Use `await page.waitForFunction(() => window.Api)` to ensure modules load. |
| **State** | Tests share local storage. Use `localStorage.clear()` in `beforeEach` if needed. |

## Developer Notes
*   **Global Access**: Internal modules (`State`, `Api`, `UI`) are exposed to `window` for `page.evaluate()`.
*   **Mocking**: Use `page.route()` to mock API calls (e.g., LLM generation) to avoid costs/delays.
*   **Selectors**: Prefer `data-path` attributes over generic CSS selectors for stability.

## Session Summary: Resolving YAML Load Failures
*   **Problem**: Persistent `TimeoutError` in Playwright tests due to race conditions where tests asserted UI state before `data/initial-data.yaml` was fully loaded and processed.
*   **Diagnosis**:
    *   Identified that individual `beforeEach` blocks lacked robust waiting logic for the asynchronous data load.
    *   Traced initialization flow via granular logging, fixing a syntax error in `js/app.js` that blocked `App.init()`.
    *   Added a visual "Loading..." overlay to `index.html` as a synchronization anchor.
*   **Solution**:
    *   Created a shared test fixture `tests/fixtures.js` that extends Playwright's `test` object.
    *   This fixture handles first-run logic, navigates to `/`, and crucially waits for `State._rawData.wildcards` to be populated.
    *   Rolled out this fixture to all 28+ spec files, replacing disparate setup logic.
*   **Result**: 203/203 tests passed.

### Roadblocks & Resolutions
1.  **Race Conditions**: Tests were flaky because they simply waited for `domcontentloaded`, which fired before YAML fetch completed.
    *   *Resolution*: Implemented `await page.waitForFunction(() => window.State._rawData.wildcards ...)` in the global fixture.
2.  **Mock Data vs. Fixture Conflict**: In `breadcrumbs_focus.spec.js`, `addInitScript` logic ran *after* the fixture had already navigated, meaning the mock data wasn't applied during the initial load.
    *   *Resolution*: Added an explicit `await page.reload()` inside the test's `beforeEach` to force a reload with the mock data applied.
3.  **Global Timeouts**: Widespread timeouts occurred as the suite grew and resource contention increased.
    *   *Resolution*: Increased global test timeout to 30s and fixture wait timeouts to 20s.

### Key Takeaways
1.  **Shared Fixtures are Critical**: For any app with async initialization (like fetching config/data), a shared Playwright fixture is the only reliable way to guarantee a consistent "ready" state across hundreds of tests.
2.  **Explicit > Implicit Waiting**: Waiting for specific application state (like a data object being populated) is far superior to waiting for UI elements or arbitrary timeouts.
3.  **`page.reload()` Pattern**: When using `addInitScript` to mock `localStorage` or other window globals in a test that uses a fixture which auto-navigates, you likely need to `reload()` to ensure the mock takes effect for that specific test context.
