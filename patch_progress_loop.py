import sys

def patch():
    with open('js/app.js', 'r') as f:
        content = f.read()

    search = """                    if (!batchStopped) {
                        completedCount++;
                        UI.showToast(`Generated for "${cleanName}" (${completedCount}/${tasks.length})...`, 'info');
                    }"""

    replace = """                    if (!batchStopped) {
                        completedCount++;

                        // Update Progress UI
                        const pct = Math.round((completedCount / tasks.length) * 100);
                        if (progressBar) progressBar.style.width = `${pct}%`;
                        if (progressCount) progressCount.textContent = `${completedCount} / ${tasks.length} items`;

                        const elapsedMs = Date.now() - startTime;
                        const rate = completedCount / (elapsedMs / 1000);
                        if (progressRate) progressRate.textContent = `${rate.toFixed(1)} items/sec`;

                        if (progressEta) {
                            const remaining = tasks.length - completedCount;
                            const etaSeconds = rate > 0 ? Math.ceil(remaining / rate) : 0;
                            if (etaSeconds > 60) {
                                progressEta.textContent = `ETA: ${Math.ceil(etaSeconds / 60)}m ${etaSeconds % 60}s`;
                            } else {
                                progressEta.textContent = `ETA: ${etaSeconds}s`;
                            }
                        }
                    }"""

    if search in content:
        content = content.replace(search, replace)
        with open('js/app.js', 'w') as f:
            f.write(content)
        print("Patched loop successfully")
    else:
        print("Could not find loop search block")

if __name__ == "__main__":
    patch()
