// Service Worker for AI-Powered Wildcard Generator

const CACHE_VERSION = 'v1';
const CACHE_NAME = `wildcards-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `wildcards-dynamic-${CACHE_VERSION}`;
const MAX_DYNAMIC_ITEMS = 50;
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


// Cache Size Monitoring & Cleanup
const trimCache = async (cacheName, maxItems) => {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        if (keys.length > maxItems) {
            await cache.delete(keys[0]);
            await trimCache(cacheName, maxItems); // Recursive call to remove all excess
        }
    } catch (e) {
        console.error('Cache trimming failed', e);
    }
};

const manageStorage = async () => {
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            const usagePercent = (estimate.usage / estimate.quota) * 100;

            // If we're using more than 80% of our quota, aggressively clear dynamic cache
            if (usagePercent > 80) {
                console.warn(`Storage usage at ${usagePercent.toFixed(2)}%. Clearing dynamic cache.`);
                await caches.delete(DYNAMIC_CACHE_NAME);
            }
        } catch (e) {
            console.error('Storage estimation failed', e);
        }
    }
};

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
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
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

    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request)
                .then(response => {
                    // Cache successful responses
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                            // Schedule background cleanup
                            setTimeout(() => {
                                trimCache(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_ITEMS);
                                manageStorage();
                            }, 0);
                        });
                    }
                    return response;
                })
            )
    );
});
