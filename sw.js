// sw.js — WE 라이딩 Service Worker v1.55
const CACHE_NAME = 'we-riding-v1';
const FB_URL = 'https://we-riding-default-rtdb.firebaseio.com';

// ── 설치 / 활성화
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── 푸시 수신 (서버에서 보내는 푸시)
self.addEventListener('push', e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); }
  catch { data = { title: 'WE 라이딩', body: e.data.text() }; }
  e.waitUntil(showSOSNotification(data.title, data.body));
});

// ── 앱에서 메시지 수신 (SOS 발생 시 SW에 알림)
self.addEventListener('message', e => {
  if (e.data?.type === 'SOS_ALERT') {
    showSOSNotification(
      '🆘 긴급 도움 요청',
      e.data.message || '팀원이 도움을 요청합니다!'
    );
    // 주기적 체크 시작
    startSOSCheck(e.data.roomId, e.data.userId, e.data.ts);
  }
  if (e.data?.type === 'STOP_SOS_CHECK') {
    stopSOSCheck();
  }
});

// ── SOS 알림 표시
async function showSOSNotification(title, body) {
  const opts = {
    body,
    icon: '/we-riding/icon-192.png',
    badge: '/we-riding/icon-192.png',
    vibrate: [300,100,300,100,300,100,300],
    tag: 'sos-alert',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '📍 위치 확인' },
      { action: 'dismiss', title: '확인' }
    ]
  };
  return self.registration.showNotification(title, opts);
}

// ── 알림 클릭
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        for (const c of clients) {
          if (c.url.includes('we-riding') && 'focus' in c) return c.focus();
        }
        return self.clients.openWindow('/we-riding/');
      })
  );
});

// ── Firebase REST로 SOS 주기적 체크 (앱 닫혀있을 때)
let _sosCheckInterval = null;
let _lastSosTs = {};

function startSOSCheck(roomId, myUserId, sinceTs) {
  if (_sosCheckInterval) return;
  _sosCheckInterval = setInterval(async () => {
    try {
      const res = await fetch(`${FB_URL}/rooms/${roomId}/sos.json`);
      if (!res.ok) return;
      const sosList = await res.json();
      if (!sosList) return;
      const now = Date.now();
      Object.values(sosList).forEach(s => {
        if (!s || s.uid === myUserId) return;
        if (now - s.ts > 60000) return; // 1분 이상 지난 SOS 무시
        const key = s.uid + '_' + s.ts;
        if (_lastSosTs[key]) return; // 중복 방지
        _lastSosTs[key] = true;
        showSOSNotification('🆘 긴급 도움 요청', `${s.name}님이 도움을 요청합니다!`);
      });
    } catch(e) {}
  }, 10000); // 10초마다 체크
}

function stopSOSCheck() {
  if (_sosCheckInterval) { clearInterval(_sosCheckInterval); _sosCheckInterval = null; }
  _lastSosTs = {};
}

// ── 백그라운드 동기화 (지원 브라우저만)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'sos-check') e.waitUntil(Promise.resolve());
});
