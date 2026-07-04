const CACHE_NAME = 'mne-cache-v4';
const urlsToCache = [
  '/MNE/',
  '/MNE/index.html',
  '/MNE/manifest.json',
  '/MNE/icon192.png',
  '/MNE/icon512.png'
];

// インストール：キャッシュに追加
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ：ネットワーク優先、失敗時のみキャッシュから返す
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したらキャッシュを更新して返す
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
