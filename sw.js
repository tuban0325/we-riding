// sw.js — WE 라이딩 Service Worker
// 역할: 백그라운드 푸시 알림 수신 및 표시

const CACHE_NAME = 'we-riding-v1';

// ── 설치
self.addEventListener('install', e => {
  self.skipWaiting();
});

// ── 활성화
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

// ── 푸시 알림 수신 (백그라운드)
self.addEventListener('push', e => {
  if (!e.data) return;

  let data;
  try {
    data = e.data.json();
  } catch {
    data = { title: 'WE 라이딩', body: e.data.text() };
  }

  const options = {
    body: data.body || '알림이 도착했어요',
    icon: '/we-riding/icon-192.png',
    badge: '/we-riding/icon-192.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || 'we-riding',
    renotify: true,
    requireInteraction: data.requireInteraction || false, // SOS는 true
    data: {
      url: data.url || '/we-riding/',
      type: data.type || 'normal'
    },
    actions: data.actions || []
  };

  // SOS 알림은 소리 + 강조
  if (data.type === 'sos') {
    options.requireInteraction = true; // 확인 전까지 유지
    options.tag = 'sos-alert';
    options.renotify = true;
    options.actions = [
      { action: 'view', title: '📍 위치 확인' },
      { action: 'dismiss', title: '확인' }
    ];
  }

  e.waitUntil(
    self.registration.showNotification(data.title || 'WE 라이딩', options)
  );
});

// ── 알림 클릭
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const url = e.notification.data?.url || '/we-riding/';

  if (e.action === 'dismiss') return;

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // 이미 열린 탭이 있으면 포커스
        for (const client of clients) {
          if (client.url.includes('we-riding') && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 탭 열기
        return self.clients.openWindow(url);
      })
  );
});

// ── 백그라운드 Firebase SOS 감지 (주기적 동기화)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-sos') {
    e.waitUntil(checkFirebaseSOS());
  }
});

async function checkFirebaseSOS() {
  // Firebase REST API로 SOS 확인 (SDK 없이)
  try {
    const res = await fetch(
      'https://we-riding-default-rtdb.firebaseio.com/rooms.json?shallow=true'
    );
    // 실제 SOS 체크는 앱에서 처리
    // SW에서는 푸시 수신만 담당
  } catch (e) {}
}
