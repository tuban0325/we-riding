# 🚴 수성철인클럽 라이딩 — v1.663 (V1 최종본)

> ⚠️ 이 문서는 V2 개발 시작 전 **롤백용 스냅샷**입니다.
> V2에서 문제 발생 시 이 버전(`index.html` v1.663)으로 되돌릴 수 있습니다.

**배포 주소:** https://tuban0325.github.io/we-riding/
**버전:** v1.663
**스냅샷 일자:** 2026-06-30
**기술 스택:** HTML/CSS/JavaScript · Firebase Realtime Database · Leaflet · OpenStreetMap

---

## 📁 V1 배포 파일 구성

```
index.html      ← 메인 파일 (전체 앱)
sw.js           ← Service Worker (백그라운드 SOS 푸시)
manifest.json   ← PWA 설정
admin.html      ← 관리자 모드 (V1 버전, 단순 모니터링용)
```

---

## V1 인증 방식 (V2와 가장 큰 차이)

```
닉네임만 입력 → 즉시 이용 가능 (회원가입 없음)
재접속시 localStorage 기반 이름 자동완성
중복 이름은 IP/세션키로 판별
```

---

## V1 핵심 기능 요약

### 로그인
- 닉네임 입력만으로 시작
- 재접속 시 이름 자동 입력
- 중복 이름 체크 (로그인 시점, IP/세션 기준)
- 다른 기기 로그인 시 기존 세션 강제 로그아웃

### 홈 화면 (방 목록 — V2에서 구조 변경 예정)
- **누구나 여러 개의 방을 자유롭게 생성 가능**
- 진행 중인 모든 방 목록 표시
- 방 카드: 상태/참가자/경과시간/GPX정보/선두진행률 (4줄 구성)
- 멤버 0명이면 방 자동 삭제 (V2에서는 "방 재사용"으로 정책 변경 예정)

### 라이딩 방
- 실시간 GPS 위치 공유 (Leaflet + OpenStreetMap)
- 정사각형 마커, 3글자 이름 표시
- GPX 코스 등록/이탈 알림 (방장 전용)
- 라이딩 상태 버튼 (시작/중지/재시작/종료, 방장 전용)
- SOS 긴급 알림 (진동+소리+화면점멸+10초반복+위치이동+백그라운드 푸시)
- 팀원 현황 패널 (속도/거리/순위)
- 선두 카드 (GPX 있을 때만)
- 코스 정보 모달 (거리/고도/경사도)

### 방 생명주기 (V2에서 변경 예정)
```
멤버 0명 → 방 즉시 삭제 ⚠️ V2에서는 "방 보존" 정책으로 변경
60분 무활동 → 자동 종료
GPX 도착 100m → 전원 도달 알림
```

### 보안
- 초대 코드 없음 (V2에서 1회용 코드 추가 예정)
- URL만 알면 누구나 접속 가능

### 관리자 모드 (admin.html, V1)
```
📊 통계 대시보드 — 방/인원/라이딩중 현황
🚴 라이딩 관리 — 실시간 목록 + 강제 종료
👥 사용자 목록 — 현재 활동 중인 사용자 (회원 시스템 없어 실시간 기준)
🔑 관리자 계정 — 최고/서브 관리자
🗺️ 실시간 지도 — 준비중
📜 라이딩 이력 — 준비중
```

---

## Firebase 구조 (V1)

```
rooms/{roomId}/
├── id, name, ownerId, createdAt, lastActivity
├── status (waiting|riding|paused|ended)
├── members/{userId}
│   ├── name, color, lat, lng, speed, ts
│   ├── sessionKey, ip
├── gpx[], gpxName, gpxAlertMode, gpxDeviation
└── sos/{userId}

admins/{adminId}/
├── username, passwordHash, name, role(super|sub)
└── createdAt, createdBy, lastLogin
```

---

## V1 → V2 변경 핵심 요약

| 항목 | V1 | V2 |
|------|----|----|
| 로그인 | 닉네임만 | 카카오 간편가입 필수 |
| 방 개수 | 누구나 여러 개 | 1인 1방 (보유 방 1개 제한) |
| 방 목록 화면 | 전체 방 목록 표시 | "내 방" 단일 화면 (전체 목록은 관리자만) |
| 초대 방식 | 링크만 | 링크 + 1회용 초대코드 |
| 방 생명주기 | 멤버 0명시 삭제 | 방 보존, 종료 후 재사용 가능 |
| 방 나가기 | 즉시 퇴장 처리 | 로그아웃 안 하면 재입장 가능 (방엔 "로그아웃" 표시) |
| 관리자 메뉴 | 단순 모니터링 | 회원 관리, 1인1방 검증, 초대코드 이력 추가 |

---

## 롤백 방법

```bash
# V2 작업 중 문제 발생시
git log --oneline | grep "v1.663"
git checkout <commit-hash> -- index.html sw.js manifest.json admin.html
git commit -m "rollback to v1.663"
git push
```

또는 이 대화의 `/mnt/user-data/outputs/index.html` (v1.663) 파일을 그대로 재배포하면 됩니다.
