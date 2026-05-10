from playwright.sync_api import sync_playwright
import time
import subprocess
import os

def verify_batch_generate():
    # Start server
    server = subprocess.Popen(["python", "-m", "http.server", "8082"])
    time.sleep(3) # Wait for server to be ready

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to http://localhost:8082/index.html")
            page.goto("http://localhost:8082/index.html", timeout=60000)

            page.wait_for_selector("#wildcard-container", timeout=30000)
            print("App loaded. Injecting mocks...")

            page.evaluate("""async () => {
                window.Api.generateWildcards = async () => ['Item 1', 'Item 2'];
                window.State.state.wildcards = {
                    'Test': {
                        'List1': { _id: '1', wildcards: ['A'] },
                        'List2': { _id: '2', wildcards: ['B'] }
                    }
                };
                window.UI.renderAll();
                window.App.toggleBatchSelectMode(true);
                const selectAll = document.getElementById('batch-select-all');
                if (selectAll) {
                    selectAll.checked = true;
                    selectAll.dispatchEvent(new Event('change', { bubbles: true }));
                }
                const batchGenBtn = document.getElementById('batch-generate');
                if (batchGenBtn) batchGenBtn.click();
            }""")

            page.wait_for_selector("#confirm-btn", timeout=10000)
            page.click("#confirm-btn")
            print("Confirmed batch generate.")

            page.wait_for_function("""() => {
                const w = window.State.state.wildcards.Test;
                return w && w.List1 && w.List1.wildcards.length > 1 && w.List2 && w.List2.wildcards.length > 1;
            }""", timeout=30000)

            print("VERIFICATION_SUCCESS: Batch generate completed successfully.")
            page.screenshot(path="/home/jules/verification/batch_generate_success.png")

        except Exception as e:
            print(f"VERIFICATION_FAILED: {e}")
            try:
                page.screenshot(path="/home/jules/verification/batch_generate_failed.png")
            except:
                pass
            raise e
        finally:
            browser.close()
            server.terminate()

if __name__ == "__main__":
    if not os.path.exists("/home/jules/verification"):
        os.makedirs("/home/jules/verification")
    verify_batch_generate()
