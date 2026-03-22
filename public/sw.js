self.addEventListener('install', (e) => {
    console.log('Service Worker Installed');
});

self.addEventListener('fetch', (e) => {
    // كود بسيط جداً يمرر الطلبات كما هي
    e.respondWith(fetch(e.request));
});