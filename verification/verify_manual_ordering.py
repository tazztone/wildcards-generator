
from playwright.sync_api import sync_playwright

def verify_manual_ordering():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate
        page.goto("http://localhost:8080")

        # Wait for load
        page.wait_for_selector(".category-item.level-0")

        # Reset state
        page.evaluate("localStorage.clear(); location.reload();")
        page.wait_for_load_state('networkidle')
        page.wait_for_selector(".category-item.level-0")

        # Selectors
        # Use CSS > combinator to ensure we get the immediate summary of the category
        first = page.locator(".category-item.level-0").nth(0)
        second = page.locator(".category-item.level-0").nth(1)

        second_name_loc = second.locator("> summary .category-name")
        second_name = second_name_loc.inner_text()
        print(f"Dragging {second_name} to top...")

        # Drag second to first
        # Position: Center of first element, slightly offset to top to trigger 'before'
        # Or use explicit targetPosition.
        # Playwright drag_to centers by default on target.
        # To drop BEFORE, we need to target the top half.
        second.drag_to(first, target_position={"x": 50, "y": 5})

        page.wait_for_timeout(2000) # Wait for animation/render

        # Screenshot
        page.screenshot(path="verification/manual_ordering.png")
        print("Screenshot saved to verification/manual_ordering.png")

        browser.close()

if __name__ == "__main__":
    verify_manual_ordering()
