// Bump the version when the shell files change so old caches are cleared.
var CACHE = 'little-lasagna-v2';
var SHELL = [
    './',
    'index.html',
    'manifest.webmanifest',
    'Static/Content/LittleLasagna/little-lasagna-css/main.css',
    'Static/Content/LittleLasagna/little-lasagna-js/timeline.js',
    'Static/Content/LittleLasagna/little-lasagna-js/pwa.js',
    'Static/Content/LittleLasagna/data/little-lasagna-timeline.json',
    'Static/Content/LittleLasagna/data/letter.json',
    'Static/Content/LittleLasagna/little-lasagna-img/couple-angels.png',
    'Static/Content/LittleLasagna/icons/icon-192.png'
];

self.addEventListener('install', function (event) {
    event.waitUntil(caches.open(CACHE).then(function (cache) {
        return cache.addAll(SHELL);
    }).then(function () {
        return self.skipWaiting();
    }));
});

self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (key) {
            return key !== CACHE;
        }).map(function (key) {
            return caches.delete(key);
        }));
    }).then(function () {
        return self.clients.claim();
    }));
});

function fromNetwork(request) {
    return fetch(request).then(function (response) {
        if (response.ok || response.type === 'opaque') {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) {
                cache.put(request, copy);
            });
        }
        return response;
    });
}

self.addEventListener('fetch', function (event) {
    var request = event.request;
    if (request.method !== 'GET') return;
    var url = new URL(request.url);
    var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    if (url.origin !== self.location.origin && !isFont) return;

    // Photos and fonts never change, so serve them from the cache first.
    if (request.destination === 'image' || request.destination === 'font' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(caches.match(request).then(function (cached) {
            return cached || fromNetwork(request);
        }));
        return;
    }

    // Everything else prefers the network so updates show up, falling back to the cache offline.
    event.respondWith(fromNetwork(request).catch(function () {
        return caches.match(request, { ignoreSearch: request.mode === 'navigate' }).then(function (cached) {
            if (cached) return cached;
            if (request.mode === 'navigate') return caches.match('index.html');
            return Response.error();
        });
    }));
});
