# Roadblocks & Key Takeaways

## Issues Faced

1.  **Proxy Identity & Collision Checks**:
    - **Issue:** The `moveItem` function implemented a check to prevent moving an item into a destination where a key with the same name already exists (`if (destParent[srcKey])`). However, when reordering items *within the same parent*, `srcParent` and `destParent` should be the same.
    - **Complication:** Due to the implementation of `createDeepProxy`, accessing `state.wildcards` multiple times (or via different paths like `getParentObjectByPath`) returns **new Proxy instances** each time. Thus, `srcParent === destParent` evaluated to `false`.
    - **Result:** The collision check incorrectly flagged the move as a collision (since the item already exists in the parent) and aborted the operation silently.
    - **Solution:** Instead of relying on object reference equality (`===`), I compared the calculated path strings (`srcParentPath === destParentPath`) to correctly identify if the source and destination parents were the same.

2.  **Array Mutation & Reactivity**:
    - **Issue:** Mutating the `__sort_order__` array using `splice` on the proxy was intended to trigger state updates. While this usually works with proxies, the specific interaction with the recursive proxy handler and the `state-updated` event listener in `ui.js` seemed fragile or was not triggering the *specific* update path expected by the UI handler for a full re-render.
    - **Solution:** I changed the implementation to **reassign** the `__sort_order__` property with a new array (`srcParent.__sort_order__ = newOrder`). This ensures a clear `set` operation on the parent object, triggering a robust `state-updated` event for the `__sort_order__` property, which the UI handler now specifically listens for to trigger a re-render.

3.  **Playwright Test Selectors (Strict Mode)**:
    - **Issue:** Tests failed with "strict mode violation" because selectors like `locator('summary .category-name')` matched multiple elements in nested `details` structures.
    - **Solution:** Updated tests to use the direct child combinator (`> summary .category-name`) to scope the selection to the intended element.

## Key Takeaways

-   **Proxy Equality:** Never assume two proxies wrapping the same target are equal (`===`) unless you are certain they are the exact same instance. When working with state trees where proxies are generated on access, use unique identifiers (like paths or IDs) for comparison.
-   **Reactivity Triggers:** For critical state changes (like reordering), replacing the data structure (immutable-style update) is often more reliable and easier to debug than in-place mutation, especially when dealing with complex proxy handlers.
-   **Test Robustness:** When testing UI interactions like Drag and Drop, verifying the underlying state change (via `page.evaluate`) provides a good fallback/confirmation when the visual interaction is flaky or hard to simulate perfectly.
