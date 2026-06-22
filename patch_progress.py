import sys

def patch():
    with open('js/app.js', 'r') as f:
        content = f.read()

    search = """            // TODO: Show progress bar with estimated time remaining
            const concurrencyLimit = 3;
            const activeTasks = new Set();
            let completedCount = 0;
            let batchStopped = false;"""

    replace = """            const concurrencyLimit = 3;
            const activeTasks = new Set();
            let completedCount = 0;
            let batchStopped = false;

            // Progress UI
            const progressContainer = document.createElement('div');
            progressContainer.id = 'batch-progress-container';
            progressContainer.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] bg-gray-900/95 backdrop-blur border border-gray-700 p-4 rounded-xl shadow-2xl min-w-[350px] space-y-3';
            progressContainer.innerHTML = `
                <div class="flex items-center justify-between text-sm">
                    <span class="text-white font-bold flex items-center gap-2">
                        <div class="loader-small"></div>
                        <span>Batch Generating...</span>
                    </span>
                    <span id="batch-progress-eta" class="text-yellow-400 font-mono text-xs">ETA: --</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div id="batch-progress-bar" class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex gap-4 text-xs text-gray-400">
                        <span id="batch-progress-count">0 / ${tasks.length} items</span>
                        <span id="batch-progress-rate">-- items/sec</span>
                    </div>
                    <button id="batch-progress-stop" class="text-xs bg-red-600/20 text-red-400 hover:bg-red-600/40 px-2 py-1 rounded border border-red-900/50 transition-colors">Stop</button>
                </div>
            `;
            document.body.appendChild(progressContainer);

            const progressBar = document.getElementById('batch-progress-bar');
            const progressCount = document.getElementById('batch-progress-count');
            const progressEta = document.getElementById('batch-progress-eta');
            const progressRate = document.getElementById('batch-progress-rate');
            const stopBtn = document.getElementById('batch-progress-stop');

            if (stopBtn) {
                stopBtn.addEventListener('click', () => {
                    batchStopped = true;
                    stopBtn.textContent = 'Stopping...';
                    stopBtn.disabled = true;
                    UI.showToast('Stopping batch...', 'warning');
                });
            }

            const startTime = Date.now();"""

    if search in content:
        content = content.replace(search, replace)
        with open('js/app.js', 'w') as f:
            f.write(content)
        print("Patched successfully")
    else:
        print("Could not find search block")

if __name__ == "__main__":
    patch()
