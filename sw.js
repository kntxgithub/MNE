// キャッシュするファイルの名前とバージョン
const CACHE_NAME = 'mne-cache-v1';
// キャッシュするファイルのリスト
const urlsToCache = [
  '/MNE/',              // ルート（index.htmlなど）
  '/MNE/index.html',
  '/MNE/manifest.json',
  // アイコンもキャッシュしておくとオフラインでも表示される
  '/MNE/icon192.png',
  '/MNE/icon512.png'
  // 必要に応じて他のアイコンも追加
  // '/MNE/icon180.png',
  // '/MNE/icon152.png',
  // '/MNE/icon120.png',
  // '/MNE/icon32.png',
  // '/MNE/icon16.png'
];

// 1. インストールイベント
// Service Workerがインストールされたときに呼ばれる
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // 指定されたファイルをすべてキャッシュする
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. フェッチイベント
// ページがリクエスト（画像やスクリプトの読み込みなど）を行うたびに呼ばれる
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // まずキャッシュ内にリクエストされたファイルがあるか探す
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあれば、それを返す
        if (response) {
          return response;
        }
        // キャッシュになければ、通常通りネットワークから取得しにいく
        return fetch(event.request);
      })
  );
});

// 3. アクティベートイベント
// 古いService Workerが新しいものに置き換わったときに呼ばれる
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 古いバージョンのキャッシュ（ホワイトリストにないもの）を削除する
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});