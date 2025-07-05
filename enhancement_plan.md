# Enhancement Plan for Wildcards Generator

This document outlines the plan for enhancing the 'wildcards.html' file as per the user's request. The goal is to address critical fixes, performance optimizations, accessibility and UX improvements, security hardening, code quality enhancements, and optional features while maintaining the monolithic structure of the file.

## 1. Critical Fixes
- **Global `AbortController` Reuse**: Wrap each `generateMoreWildcards` call in a `try/finally` block to ensure `activeAIController` is reset to `null` after each request, preventing race conditions. Add a check for `if (activeAIController?.signal.aborted)` before any UI updates to avoid interference from aborted requests.
- **`innerHTML` Injection for Icons**: Replace direct `innerHTML` usage for SVG icons with `createElementNS` to create SVG elements safely, mitigating potential XSS risks.
- **Missing `await` in History Load**: Modify `loadHistory()` to return the parsed state and ensure it's called before UI build, or mark it as `async` and `await` it where necessary to guarantee data availability.
- **`prompt()` for New Sub-Categories**: Replace the blocking `prompt()` with a custom modal integrated into the existing notification system, ensuring non-blocking interaction and input validation.

## 2. Performance Optimizations
- **Move Blocking Scripts**: Add the `defer` attribute to script tags and move them to the end of the body to improve initial page load performance.
- **Virtual-Scroll the Chip List**: Implement a simple virtualization function for the chip list within `chip-container` elements, rendering only visible chips based on `scrollTop`, `clientHeight`, and `offsetHeight` calculations.
- **Batch DOM Writes**: Update `renderChipsInContainer` to use a `DocumentFragment` for appending chips, inserting them all at once to minimize layout thrashing.
- **Cache Heavy Selectors**: Cache repeated DOM queries like `document.getElementById` and `querySelector` in local variables within loops to reduce lookup overhead.
- **Font & CSS Hints**: Add `<link rel="preload">` tags for fonts and critical CSS to eliminate late-loaded text flashes.

## 3. Accessibility & UX Improvements
- **`details/summary` Keyboard Focus**: Ensure `summary` elements have native toggling without custom `tabindex` unless custom click handling is added, improving screen-reader support.
- **Live-Region Status**: Add `role="alertdialog"` to the notification modal and implement focus on the first button when opened for immediate screen-reader perception.
- **Chip Check-Boxes**: Add `aria-label="Select wildcard ‹text›"` to checkboxes for better accessibility.
- **Color Contrast**: Adjust text and button color combinations (e.g., gray-400 on gray-800) to meet WCAG AA standards by lightening foreground or darkening background colors.

## 4. Security Hardening
- **No Secrets in `localStorage`**: Modify API key storage to keep it in memory only, or prompt users to input it each session, removing any persistence in `localStorage`.
- **Content-Security-Policy (CSP)**: Add a CSP meta tag to limit XSS vectors, allowing only necessary external APIs.

## 5. Code Quality & Maintainability
- **Module Pattern**: Wrap all variables and functions in an Immediately Invoked Function Expression (IIFE) to prevent global namespace pollution, exposing only a minimal public API.
- **Config Constants**: Create a `const CONFIG = { … }` object for magic numbers and settings like `HISTORY_LIMIT` for easier maintenance.
- **Typed JSDoc**: Annotate key functions with JSDoc for better code documentation and editor IntelliSense support.
- **Prefer `const` over `let`**: Update variable declarations to use `const` where reassignment isn't needed to clarify intent.
- **Single Event Delegation**: Consolidate multiple event listeners on `wildcard-container` into a single `click` handler with class-based branching for efficiency.

## 6. Optional Enhancements
- **Progressive Web App Wrapper**: Add a small inline service-worker to cache Tailwind, JSZip, and the HTML for offline capability, if desired by the user.
- **Theme Switcher**: Implement a toggle for Tailwind's dark mode using a `data-theme` attribute with persistence, based on user preference.
- **Import Auto-Merge**: Add an option during state import to merge with existing data instead of overwriting, contingent on user approval.

## Implementation Approach
The changes will be implemented in a prioritized order: critical fixes first, followed by performance and security enhancements, then accessibility and UX improvements, and finally code quality and optional features. All modifications will be made within the single 'wildcards.html' file to maintain its monolithic structure as per the user's instructions. The user has specified not to run or open the file after edits, which will be adhered to during the implementation phase.

This plan will guide the subsequent updates to 'wildcards.html', ensuring all requested enhancements are addressed systematically and efficiently.
