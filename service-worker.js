const CACHE_NAME = 'qingchu-v2';
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// 安装时只预缓存本地核心文件（不缓存CDN资源，避免失败）
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(PRECACHE_ASSETS).catch(() => {})
        )
    );
    self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// 运行时缓存：所有GET请求都缓存（包括CDN的JSZip和Tesseract.js）
// 策略：缓存优先，缓存未命中则网络请求并缓存
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;

            return fetch(e.request).then((response) => {
                // 只缓存成功的响应
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, clone);
                    });
                }
                return response;
            }).catch(() => {
                // 网络失败，尝试返回缓存的首页
                return caches.match('./index.html');
            });
        })
    );
});
