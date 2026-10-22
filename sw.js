const CACHE_NAME = 'ecomeq-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index.css',
    '/app.js',
    '/logo.png',
    '/login_banner.png'
];

// Instalar Service Worker y almacenar recursos estáticos en caché
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Almacenando en caché archivos estáticos de la aplicación...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activar el Service Worker y eliminar cachés obsoletas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('Eliminando caché antigua:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Interceptar peticiones para servir desde caché (offline) o buscar en la red
self.addEventListener('fetch', event => {
    // Las peticiones al backend API no deben ser cacheadas para asegurar datos en tiempo real
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
