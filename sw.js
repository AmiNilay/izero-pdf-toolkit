// Service Worker for iZeroPDF
const CACHE_NAME = 'izero-pdf-v2.0.0';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS
    '/css/main.css',
    '/css/theme-light.css',
    '/css/theme-dark.css',
    
    // JavaScript - Core
    '/js/app.js',
    '/js/router.js',
    '/js/state.js',
    
    // JavaScript - Utils
    '/js/utils/validators.js',
    '/js/utils/fileHelpers.js',
    '/js/utils/canvasHelpers.js',
    '/js/utils/zipHelpers.js',
    '/js/utils/downloadHelpers.js',
    
    // JavaScript - Core Engines
    '/js/core/pdfProcessor.js',
    '/js/core/imageProcessor.js',
    '/js/core/cropEngine.js',
    '/js/core/mergeEngine.js',
    '/js/core/splitEngine.js',
    '/js/core/compressEngine.js',
    
    // JavaScript - UI Controllers - Core
    '/js/ui/pdfToImage.js',
    '/js/ui/imageToPdf.js',
    '/js/ui/cropTool.js',
    '/js/ui/resizeTool.js',
    '/js/ui/photoResizerTool.js',
    '/js/ui/mergeTool.js',
    '/js/ui/splitTool.js',
    '/js/ui/rotateTool.js',
    '/js/ui/extractTool.js',
    
    // JavaScript - UI Controllers - New Features
    '/js/ui/compressTool.js',
    '/js/ui/lockTool.js',
    '/js/ui/removePagesTool.js',
    '/js/ui/pdfToJpgTool.js',
    
    // Libraries (CDN versions cached)
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// Install Event - Cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
        .then(() => self.clients.claim())
    );
});

// Fetch Event - Serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip cross-origin requests except CDN libraries
    if (url.origin !== self.location.origin && 
        !url.href.includes('cdnjs.cloudflare.com') &&
        !url.href.includes('fonts.googleapis.com') &&
        !url.href.includes('fonts.gstatic.com')) {
        return event.respondWith(fetch(event.request));
    }
    
    // For HTML pages - Network first with cache fallback
    if (event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cached => cached || caches.match('/index.html'));
                })
        );
        return;
    }
    
    // For static assets - Cache first with network fallback
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) {
                    // Return cached version and update in background
                    fetch(event.request)
                        .then(response => {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, response);
                            });
                        })
                        .catch(() => {});
                    return cached;
                }
                return fetch(event.request)
                    .then(response => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                        return response;
                    });
            })
            .catch(() => {
                return new Response('Resource not available offline', {
                    status: 404,
                    statusText: 'Not Found'
                });
            })
    );
});