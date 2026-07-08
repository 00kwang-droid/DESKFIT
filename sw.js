const CACHE_NAME = 'deskfit-v4';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // 앱 코드(HTML/JS/CSS/네비게이션)는 network-first: 온라인이면 항상 최신, 오프라인이면 캐시 폴백
  const isAppShell =
    req.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    /\.(?:html|js|css)$/.test(url.pathname);

  if (isAppShell) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // 그 외(아이콘 등 정적 자원)는 cache-first
  event.respondWith(caches.match(req).then((c) => c || fetch(req).catch(() => c)));
});

// 알림을 탭했을 때: 앱을 열고 해당 운동의 타이머로 진입
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

// 예약된 로컬 알림 트리거 (앱/서비스워커가 살아있는 동안의 best-effort)
self.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg && msg.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, slotId, tag } = msg.payload;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body, icon: 'icon-192.png', badge: 'icon-192.png', tag, data: { slotId }, silent: false
      });
    }, Math.max(0, delay));
  }
});
