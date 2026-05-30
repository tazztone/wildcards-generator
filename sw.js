// Service Worker for AI-Powered Wildcard Generator

// TODO: Implement versioned caching strategy with automatic cache invalidation

const CACHE_NAME = 'wildcards-v1';
const DYNAMIC_CACHE_NAME = 'wildcards-dynamic-v1';
const MAX_CACHE_ITEMS = 50;

const STATIC_ASSETS = [
    './',
    './index.html',
    './css/wildcards.css',
    './data/initial-data.yaml',
    './vendor/mind-elixir/MindElixir.js',
    './vendor/mind-elixir/style.css',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdn.jsdelivr.net/npm/yaml@2.8.2/browser/index.js'
];

/**
 * Enforces a maximum number of items in a cache by removing the oldest entries.
 * @param {string} cacheName - The name of the cache to monitor.
 * @param {number} maxItems - The maximum number of allowed items.
 */
async function enforceCacheSizeLimit(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length > maxItems) {
            await cache.delete(keys[0]);
            await enforceCacheSizeLimit(cacheName, maxItems);
        }
    } catch (error) {
        console.error(`[SW] Failed to enforce cache size limit for ${cacheName}:`, error);
    }
}

// Install: cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Network-first for API calls
    if (url.hostname.includes('googleapis.com') ||
        url.hostname.includes('openrouter.ai') ||
        url.pathname.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => new Response(JSON.stringify({ error: 'Offline - API unavailable' }), {
                    headers: { 'Content-Type': 'application/json' }
                }))
        );
        return;
    }

    // Cache-first for static assets, then dynamic cache
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request)
                .then(response => {
                    // Cache successful responses in dynamic cache
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                            enforceCacheSizeLimit(DYNAMIC_CACHE_NAME, MAX_CACHE_ITEMS);
                        });
                    }
                    return response;
                })
            )
    );
});

// Listen for messages from clients to monitor and manage storage
self.addEventListener('message', async (event) => {
    if (!event.data) return;

    if (event.data.type === 'GET_STORAGE_INFO') {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                event.ports[0].postMessage({
                    usage: estimate.usage,
                    quota: estimate.quota,
                    usageDetails: estimate.usageDetails
                });
            } else {
                event.ports[0].postMessage({ error: 'Storage API not supported' });
            }
        } catch (error) {
            event.ports[0].postMessage({ error: error.message });
        }
    } else if (event.data.type === 'CLEAR_DYNAMIC_CACHE') {
        try {
            await caches.delete(DYNAMIC_CACHE_NAME);
            event.ports[0].postMessage({ success: true });
        } catch (error) {
            event.ports[0].postMessage({ error: error.message });
        }
    }
});
