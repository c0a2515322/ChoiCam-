const CACHE_NAME = 'choicam-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/icon.png',
    '/baby.png',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
    'https://unpkg.com/react@18/umd/react.development.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Service Workerのインストール
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('キャッシュを開きました');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.log('キャッシュの追加に失敗:', error);
            })
    );
    // 即座にアクティベート
    self.skipWaiting();
});

// Service Workerのアクティベート
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('古いキャッシュを削除:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // すべてのクライアントを即座に制御
    self.clients.claim();
});

// フェッチリクエストの処理（ネットワークファースト戦略）
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // レスポンスが有効な場合、キャッシュに保存
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // ネットワークが利用できない場合、キャッシュから取得
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        // オフラインフォールバック
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// プッシュ通知の受信
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : '新しい通知があります',
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: '確認する' },
            { action: 'close', title: '閉じる' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('ChoiCam♡', options)
    );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
