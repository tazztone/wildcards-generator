import sys

def patch():
    with open('js/app.js', 'r') as f:
        content = f.read()

    search = """            // Wait for remaining tasks to complete
            await Promise.all(activeTasks);

            if (batchStopped) {
                UI.showToast('Batch generation stopped by user', 'info');
            } else {
                UI.showToast('Batch generation complete!', 'success');
            }"""

    replace = """            // Wait for remaining tasks to complete
            await Promise.all(activeTasks);

            // Cleanup Progress UI
            if (progressContainer && progressContainer.parentNode) {
                progressContainer.parentNode.removeChild(progressContainer);
            }

            if (batchStopped) {
                UI.showToast('Batch generation stopped by user', 'info');
            } else {
                UI.showToast('Batch generation complete!', 'success');
            }"""

    if search in content:
        content = content.replace(search, replace)
        with open('js/app.js', 'w') as f:
            f.write(content)
        print("Patched cleanup successfully")
    else:
        print("Could not find cleanup search block")

if __name__ == "__main__":
    patch()
