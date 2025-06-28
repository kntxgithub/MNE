// キャッシュするファイルの名前とバージョン
const CACHE_NAME = 'mne-cache-v1';
// キャッシュするファイルのリスト
const urlsToCache = [
  './',              // ルート（index.htmlなど）
  './index.html',
  './manifest.json',
  // アイコンもキャッシュしておくとオフラインでも表示される
  './icon-192.png',
  './icon-512.png'
  // 必要に応じて他のアイコンも追加
  // './icon180.png',
  // './icon152.png',
  // './icon120.png',
  // './icon32.png',
  // './icon16.png'
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