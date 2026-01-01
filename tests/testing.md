# Testing Documentation

This document describes the testing strategy and framework for the Wildcard Generator application.

## Overview

| Aspect | Details |
|--------|---------|
| Framework | Playwright |
| Test Type | End-to-End (E2E) |
| Browsers | Chromium |
| Test Location | `tests/e2e.spec.js` |
| **Status** | **42 passed** ✅ |

## Quick Start

```bash
# Install dependencies
npm install -D @playwright/test http-server
npx playwright install chromium

# Run all tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# Run specific test
npx playwright test -g "page loads"

# View HTML report
npx playwright show-report
```

## Test Categories (42 total)

### 1. Core UI (5 tests)
- Page loading and title
- Search input functionality
- Undo/redo buttons visible
- Export buttons present
- Help dialog opens

### 2. Category Operations (5 tests)
- Category expands on click
- Category collapses when clicked again
- Pin button toggles pinning
- Add category shows dialog
- Delete button shows confirmation

### 3. Wildcard Management (4 tests)
- Copy button shows toast
- Add wildcard input works
- Generate more button exists
- Select all/deselect all toggles

### 4. Batch Operations (4 tests)
- Batch operations bar visible
- Select all checkbox enables buttons
- Batch expand works
- Batch collapse works

### 5. Theme & Settings (5 tests)
- Theme toggle visible
- Theme toggle switches modes
- Global settings panel toggles
- API dropdown has options
- Switching API shows different panel

### 6. Search & Statistics (4 tests)
- Statistics dashboard shows counts
- Search shows result count
- Check duplicates works
- Clear search resets view

### 7. Import/Export (5 tests)
- YAML export triggers download
- ZIP export triggers download
- Config export triggers download
- Import YAML button functional
- Import config button functional

### 8. Keyboard Shortcuts (4 tests)
- Ctrl+S shows auto-save message
- Ctrl+Z triggers undo
- Escape collapses all categories
- Arrow keys navigate categories

### 9. Dialogs & Popups (3 tests)
- Notification dialog closes
- Suggest popup elements exist
- Generate popup elements exist

### 10. Accessibility (3 tests)
- ARIA live region exists
- Toast container has aria-live
- Dialogs have proper roles

## Configuration

Test config in `playwright.config.js`:

```javascript
module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npx http-server . -p 8080 -c-1',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
    },
});
```

## CI/CD Integration

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | Increase timeout, check network |
| Elements not found | Add explicit waits, check selectors |
| Server not starting | Verify port 8080 is available |
| Flaky tests | Use `.first()`, add waits, use JS evaluate |

## Test Artifacts

After running:
- **Reports**: `playwright-report/index.html`
- **Screenshots**: `test-results/` (on failure)
- **Traces**: `test-results/` (on first retry)
