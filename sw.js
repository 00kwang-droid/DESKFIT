const CACHE_NAME = 'deskfit-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});

// 알림을 탭했을 때: 앱을 열고 해당 운동의 타이머 화면으로 바로 진입
self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {};
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'OPEN_TIMER', slotId: data.slotId });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(`./index.html?slot=${data.slotId || ''}`);
      }
    })
  );
});

// 예약된 로컬 알림 트리거 (앱/서비스워커가 살아있는 동안의 best-effort 스케줄링)
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg && msg.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, slotId, tag } = msg.payload;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        tag,
        data: { slotId },
        silent: false
      });
    }, Math.max(0, delay));
  }
});
