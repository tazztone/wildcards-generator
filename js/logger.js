import { Config } from './config.js';

const DB_NAME = 'wildcards_db';
const STORE_NAME = 'api_logs';
const DB_VERSION = 2;

/**
 * IndexedDB Wrapper for API Logging
 */
export const Logger = {
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                const target = /** @type {IDBOpenDBRequest} */ (event.target);
                console.error("Logger: Database error", target.error);
                reject(target.error);
            };

            request.onsuccess = (event) => {
                this.db = /** @type {IDBOpenDBRequest} */ (event.target).result;
                resolve();
                this._pruneLogs(); // Run pruning on startup
            };

            request.onupgradeneeded = (event) => {
                const db = /** @type {IDBOpenDBRequest} */ (event.target).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('startTime', 'startTime', { unique: false });
                    objectStore.createIndex('created_at', 'createdAt', { unique: false });
                } else {
                    // Version 2 upgrade: Add created_at index if missing
                    const store = /** @type {IDBOpenDBRequest} */ (event.target).transaction.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('created_at')) {
                        store.createIndex('created_at', 'createdAt', { unique: false });
                    }
                }
            };
        });
    },

    /**
     * Add a new request log entry
     * @param {Object} entry 
     */
    async logRequest(entry) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(entry);

            request.onsuccess = () => {
                // Fire and forget pruning occasionally (e.g. 10% chance) to avoid blocking every write
                if (Math.random() < 0.1) this._pruneLogs();
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Update an existing log entry with response data
     * @param {string} id 
     * @param {Object|string} response 
     * @param {string|null} error 
     */
    async logResponse(id, response, error = null) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // First get the existing entry
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const entry = getReq.result;
                if (entry) {
                    // Update fields
                    entry.duration = Math.round(performance.now() - entry.startTime);
                    entry.status = error ? 'error' : 'success';
                    entry.response = response;
                    entry.error = error;

                    const putReq = store.put(entry);
                    putReq.onsuccess = () => resolve(entry);
                    putReq.onerror = (e) => reject(e.target.error);
                } else {
                    resolve(null); // Entry not found (maybe cleared?)
                }
            };

            getReq.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Get recent logs for UI display
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getRecent(limit = 100) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            // Open cursor in reverse order (newest first)
            // Use 'created_at' index if available (v2), fallback to 'startTime' for old logs (or during migration)
            let indexName = 'startTime';
            if (store.indexNames.contains('created_at')) {
                indexName = 'created_at';
            }
            const index = store.index(indexName);

            const request = index.openCursor(null, 'prev');
            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Get logs matching criteria (date range)
     * @param {Object} opts { start, end, limit }
     */
    async query({ start, end, limit = 1000 } = {}) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.indexNames.contains('created_at') ? store.index('created_at') : store.index('startTime');

            let range = null;
            if (start || end) {
                range = IDBKeyRange.bound(start || 0, end || Date.now() + 86400000);
            }

            // Open cursor in correct direction? 'prev' for newest first
            // Note: IndexedDB range filtering with 'prev' gives newest in range.
            const request = index.openCursor(range, 'prev');
            const results = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Get ALL logs for export (batched)
     * @returns {Promise<Array>}
     */
    async getAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Clear all logs
     */
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    },

    /**
     * Import logs from external source
     * @param {Array} entries 
     */
    async import(entries) {
        if (!entries || !Array.isArray(entries)) throw new Error("Invalid log data");
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            let processed = 0;

            transaction.oncomplete = () => resolve(processed);
            transaction.onerror = (e) => reject(e.target.error);

            entries.forEach(entry => {
                // Basic validation
                if (entry.id && entry.url && entry.timestamp) {
                    store.put(entry);
                    processed++;
                }
            });
        });
    },

    /**
     * Delete logs older than X days
     * @param {number} days 
     */
    async deleteOlderThan(days) {
        if (!days || days <= 0) return 0;
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Prefer created_at index
            if (store.indexNames.contains('created_at')) {
                const index = store.index('created_at');
                const range = IDBKeyRange.upperBound(cutoffTime);
                const request = index.openCursor(range);
                let deleted = 0;

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        deleted++;
                        cursor.continue();
                    } else {
                        // console.debug(`Pruned ${deleted} old logs.`);
                    }
                };

                transaction.oncomplete = () => resolve(deleted);
                transaction.onerror = (e) => reject(e.target.error);
            } else {
                // Fallback for v1 schema: iterate all and check logic? 
                // Or just resolve 0 since migration creates index.
                // We should be safe assuming index exists after init.
                resolve(0);
            }
        });
    },

    async _pruneLogs() {
        const maxEntries = Config.LOG_MAX_ENTRIES || 5000;

        const count = await this._count();
        if (count <= maxEntries) return;

        const toDelete = count - maxEntries;

        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.indexNames.contains('created_at') ? store.index('created_at') : store.index('startTime'); // Use createdAt for sort stability

        const request = index.openCursor(); // standard order = oldest first
        let deleted = 0;

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && deleted < toDelete) {
                cursor.delete();
                deleted++;
                cursor.continue();
            }
        };
    },

    async _count() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(0);
        });
    }
};
