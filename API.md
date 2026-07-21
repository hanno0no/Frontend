# HNN API 명세서

> **기준 문서**  
> - [기획서.md](../Documents/기획서.md) v0.5  
> - [백엔드-개발계획.md](../Documents/백엔드-개발계획.md) v1.0  
> - [프론트엔드-개발계획.md](../Documents/프론트엔드-개발계획.md) v1.0  
>
> **Base URL**: `/hnn`  
> 프로덕션: `https://backend-production-2949.up.railway.app/hnn`  
> Content-Type: `application/json` (SSE 제외)  
> **프론트 스냅샷**: `hnn-react` (2026-07-21)

본 문서는 **FE·BE 공통 계약(v0.5)** 입니다.  
엔드포인트마다 **프론트 구현 여부**를 표시합니다.

| 표시 | 의미 |
|------|------|
| ✅ FE 반영 | 현재 프론트 코드가 이 계약을 사용 |
| 🔄 미구현 | 명세(목표)만 있고 프론트 미구현 |
| ⏳ BE 선행 | 프론트는 준비됐거나 반영됨 — 백엔드 배포 필요 |

---

## 프론트 구현 현황 (요약)

| 구분 | 상태 |
|------|------|
| `/register` 경로 | ✅ |
| 접수 JSON `{ orderId, message }` | ✅ (mock 포함). ⏳ 실제 BE JSON 필요 |
| 상태 코드 6개 (`constants/status.js`) | ✅ (mock 포함). ⏳ BE DB 마이그레이션 필요 |
| Admin 새로고침·필터(상태/담당자/재질/팀) | ✅ |
| `VITE_USE_MOCK` | ✅ |
| `VITE_API_BASE_URL` | 🔄 (Railway URL 하드코딩) |
| 401 인터셉터 | 🔄 |
| manager 미지정 `null` | 🔄 (현재 `""`) |
| 페이지네이션·정렬·stats·material·hide | 🔄 |
| setting `completedLimit` / `waitingLimit` | 🔄 |
| SSE `/events` | 🔄 (대시보드 5초 폴링) |
| `/admin/teams` | 🔄 |
| Dashboard 새로고침 버튼 | 🔄 |

---

## 공통

### 인증

| 항목 | 내용 | FE |
|------|------|:--:|
| 방식 | JWT Bearer | ✅ |
| 헤더 | `Authorization: Bearer {accessToken}` | ✅ |
| 발급 | `POST /admin/login` → `{ accessToken }` | ✅ |
| 저장 | `localStorage.accessToken` | ✅ |
| 만료 | 행사 운영 시간 반영 (예: 12h) | ⏳ BE |
| 401 인터셉터 | logout + `/login` | 🔄 |

**공개 API**

- `GET /index`
- `GET /checkStatus`
- `POST /register`, `GET /register/getmaterial`
- `GET /events` (🔄 Phase 4)

**관리자 API** — `/admin/*` (login 제외) JWT 필요  
`GET /register/getstate`, `GET /register/getadminname` 은 현재 공개 호출. Phase 6에서 인증화 가능.

### 환경변수 (프론트)

| 변수 | 설명 | FE |
|------|------|:--:|
| `VITE_API_BASE_URL` | Axios `baseURL` | 🔄 하드코딩 |
| `VITE_USE_MOCK` | `true`면 mock adapter | ✅ |

하드코딩 값: `https://backend-production-2949.up.railway.app/hnn`

### 일시 형식

ISO-8601: `YYYY-MM-DDTHH:mm:ss` 또는 `...Z`

### 에러 응답 (목표)

| HTTP | 용도 |
|------|------|
| 400 | 잘못된 요청 |
| 401 | 인증 실패·토큰 만료 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |

스키마는 BE `GlobalExceptionHandler` 확정 후 보완. 현재 FE는 상태 코드만으로 분기.

---

## 주문 상태 코드 ✅ FE

> 기획서 §5.3 / `src/constants/status.js` — 프론트 단일 정의

### 상태 정의

| 순서 | 한글 표시명 | 상태 코드 | 의미 |
|:---:|------------|-----------|------|
| 1 | 제출 완료 | `submitted` | 참가자 접수 제출 |
| 2 | 접수 완료 | `accepted` | 관리자 검토·승인 |
| 3 | 디자인 완료 | `design_complete` | 디자인 완료 |
| 4 | 출력 완료 | `print_complete` | 출력 완료 |
| 5 | 수령 완료 | `picked_up` | 참가자 수령 (대시보드 미노출) |
| — | 실패 | `failed` | 실패 · 재접수는 **새 주문** |

### 허용 전이 (서버 검증 ⏳ BE Phase 1)

| from | → to |
|------|------|
| *(신규)* | `submitted` |
| `submitted` | `accepted`, `failed` |
| `accepted` | `design_complete`, `failed` |
| `design_complete` | `print_complete`, `failed` |
| `print_complete` | `picked_up`, `failed` |
| `picked_up` / `failed` | *(종료)* |

### 대시보드 노출 (BE IndexService ⏳)

| 상태 | 완료 명단 | 대기 명단 |
|------|:--------:|:--------:|
| `submitted` | ❌ | ❌ |
| `accepted` | ❌ | ✅ |
| `design_complete` | ❌ | ✅ |
| `print_complete` | ✅ | ❌ |
| `picked_up` | ❌ | ❌ |
| `failed` | ❌ | ❌ |

표시 형식(기획): `{팀번호}_{주문ID}` · 건수 기본 9 / 12

### v0.1 → v0.5 마이그레이션

| v0.1 | v0.5 |
|------|------|
| `submission` | `submitted` |
| `register` | `accepted` |
| `design` | `design_complete` |
| `print` | `print_complete` |
| `rejection` | `failed` |
| — | `picked_up` |

프론트·mock은 v0.5 완료. 실제 API는 BE `state` 테이블 마이그레이션 후 일치.

---

## 1. 대시보드

### `GET /index` ✅ FE · ⏳ BE 필터/limit

**사용처:** `DashboardPage`  
**갱신:** 5초 폴링 ✅ · SSE 🔄 · Dashboard 수동 새로고침 🔄

**Response `200`**

```json
{
  "completedTeam": ["T1_16", "T2_21"],
  "waitingTeam": ["T3_22", "T5_30"],
  "endTime": "2026-07-21T21:00:00",
  "emergencyMessage": ["긴급 메시지"],
  "messages": ["일반 공지"]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `completedTeam` | `string[]` | `print_complete`, limit 적용 |
| `waitingTeam` | `string[]` | `accepted` + `design_complete`, limit 적용 |
| `endTime` | `string` | 활성 이벤트 종료 시각 |
| `emergencyMessage` | `string[]` | 긴급 공지 |
| `messages` | `string[]` | 일반 공지 |

프론트는 배열을 그대로 표시. 필터·건수는 백엔드 책임.

---

## 2. 접수 · 공통 조회

### `POST /register` ✅ FE · ⏳ BE

```json
// Request
{ "teamNum": "T2_1", "material": "PLA" }

// Response 200
{ "orderId": 16, "message": "접수가 완료되었습니다." }
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `orderId` | `number` | 접수번호 — FE: `response.data.orderId` |
| `message` | `string` | 안내 문구 |

초기 상태: `submitted`  
파일명: `{팀번호}_{주문ID}{A|M}` (기획 BR-03)

레거시: BE는 `/registar/**` → `/register/**` redirect 임시 지원 가능.

---

### `GET /register/getmaterial` ✅ FE

```json
["PLA", "ABS", "PETG", "TPU"]
```

활성 재질만 반환하는 것이 목표.

---

### `GET /register/getstate` ✅ FE

```json
[
  "submitted",
  "accepted",
  "design_complete",
  "print_complete",
  "picked_up",
  "failed"
]
```

Admin 드롭다운에 사용. FE 라벨은 `getStatusLabel()`.

---

### `GET /register/getadminname` ✅ FE

```json
["김한노", "이한노", "박한노"]
```

---

## 3. 팀 진행 현황

### `GET /checkStatus` ✅ FE

**Query:** `teamNum` (필수)  
예: `GET /checkStatus?teamNum=T2_1`

```json
[
  {
    "orderId": 201,
    "material": "PLA",
    "status": "print_complete",
    "orderTime": "2026-07-21T14:30:00"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `orderId` | `number` | 주문 ID |
| `material` | `string` | 재질 |
| `status` | `string` | 상태 코드 (**목록의 `state`와 필드명 다름**) |
| `orderTime` | `string` | 접수 시각 |

**삭제(BE):** `GET /checkStatus/view` (Thymeleaf)

---

## 4. 인증

### `POST /admin/login` ✅ FE

```json
// Request
{ "username": "admin", "password": "password" }

// Response 200
{ "accessToken": "eyJ..." }
```

실패 시 FE는 catch로 오류 메시지 표시. 401 JSON 바디·인터셉터는 🔄.

---

## 5. 관리자 — 주문

### `GET /admin/view` ✅ FE (배열) · 🔄 페이지네이션

**인증:** 필요  
**현재 FE:** 쿼리 없이 전체 배열 로드 + 클라이언트 필터 + 수동 새로고침

```json
[
  {
    "orderId": 101,
    "teamNum": "T2_1",
    "material": "PLA",
    "fileName": "T2_1_101A",
    "admin": "김한노",
    "state": "accepted"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `orderId` | `number` | 주문 ID |
| `teamNum` | `string` | 팀명 |
| `material` | `string` | 재질 |
| `fileName` | `string \| null` | 파일명 |
| `admin` | `string` | 담당자. FE 미지정 표시: falsy → `미지정` |
| `state` | `string` | 상태 코드 |

**목표 Query (🔄 Phase 3)**

| 파라미터 | 설명 |
|----------|------|
| `page`, `size` | 페이지네이션 |
| `sort`, `direction` | 정렬 (`orderedAt`, `updatedAt`, `state`, `teamNum` …) |

**목표 Response (🔄)** — Spring Page 권장

```json
{
  "content": [],
  "totalElements": 120,
  "totalPages": 12,
  "number": 0,
  "size": 10
}
```

---

### `PATCH /admin/{orderId}/status` ✅ FE · ⏳ 전이 검증 BE

```json
{ "status": "design_complete" }
```

요청 필드 `status` / 목록 필드 `state` — 현행 유지.

---

### `PATCH /admin/{orderId}/manager` ✅ FE (부분) · 🔄 null

```json
{ "manager": "김한노" }
```

| | 현재 FE | 목표 |
|--|---------|------|
| 미지정 | `""` | `null` |

---

### `PATCH /admin/{orderId}/material` 🔄

```json
{ "material": "ABS" }
```

---

### `PATCH /admin/{orderId}/hide` 🔄

완료 명단 숨김. body는 BE 구현 시 확정.

---

### `GET /admin/stats` 🔄

```json
{
  "submitted": 3,
  "accepted": 5,
  "design_complete": 2,
  "print_complete": 4,
  "picked_up": 10,
  "failed": 1
}
```

---

## 6. 관리자 — 설정

### `GET /admin/setting` ✅ FE · 🔄 limit 필드

현재 FE가 읽는 필드:

```json
{
  "eventInfos": [
    {
      "eventId": 1,
      "eventName": "한노 여름방학 해커톤",
      "description": "...",
      "startTime": "2026-07-21T09:00:00",
      "endTime": "2026-07-21T21:00:00",
      "open": true
    }
  ],
  "messages": [
    {
      "messageId": 1,
      "content": "...",
      "emergency": true,
      "display": true
    }
  ],
  "materials": [
    {
      "materialId": 1,
      "materialName": "PLA",
      "active": true
    }
  ]
}
```

**목표 추가 (🔄 Phase 2)**

| 필드 | 기본 | 설명 |
|------|------|------|
| `completedLimit` | 9 | 완료 명단 건수 |
| `waitingLimit` | 12 | 대기 명단 건수 |

GET boolean: `open`, `display`, `emergency`, `active`

---

### `PATCH /admin/setting` ✅ FE · 🔄 limit

```json
{
  "eventInfoRequestDtos": [
    {
      "eventId": 1,
      "eventName": "...",
      "description": "...",
      "startTime": "...",
      "endTime": "...",
      "isOpen": true
    }
  ],
  "messageRequestDtos": [
    {
      "messageId": 1,
      "content": "...",
      "isDisplay": true,
      "isEmergency": false
    }
  ],
  "materialRequestDtos": [
    {
      "materialId": 1,
      "materialName": "PLA",
      "isActive": true
    }
  ]
}
```

PATCH boolean: `isOpen`, `isDisplay`, `isEmergency`, `isActive`  
목표: 동일 body에 `completedLimit`, `waitingLimit` 추가.

---

### `POST /admin/create/eventinfo` ✅

```json
{
  "eventName": "새 대회",
  "description": "설명",
  "startTime": "2026-08-01T10:00:00",
  "endTime": "2026-08-01T18:00:00",
  "open": true
}
```

### `POST /admin/create/message` ✅

```json
{ "content": "새 공지", "emergency": false, "display": true }
```

### `POST /admin/create/material` ✅

```json
{ "materialName": "Nylon", "active": true }
```

### `DELETE /admin/delete/{type}/{id}` ✅

| `type` | ID |
|--------|-----|
| `eventinfo` | `eventId` |
| `message` | `messageId` |
| `material` | `materialId` |

---

## 7. 실시간 (SSE) 🔄

### `GET /events`

- `text/event-stream` · 경로 `/hnn/events`

| event | 프론트 동작 (목표) |
|-------|-------------------|
| `orders_updated` | Admin 목록 refetch |
| `index_updated` | Dashboard refetch |
| `settings_updated` | (선택) 설정 갱신 |

```
event: orders_updated
data: {"type":"orders_updated","timestamp":"2026-07-13T14:30:00"}
```

현재: Dashboard 5초 폴링 · Admin 수동 새로고침. SSE 없음.

---

## 8. 팀 관리 🔄

| Method | Path | 설명 |
|--------|------|------|
| GET | `/admin/teams` | 목록 |
| POST | `/admin/teams` | 등록 |
| PATCH | `/admin/teams/{teamNum}` | 수정 |
| DELETE | `/admin/teams/{teamNum}` | 삭제 |

```json
{ "teamNum": "T2_1", "phone": "010-2222-2222" }
```

path/DTO는 BE 구현 시 확정. FE 라우트·페이지 없음.

---

## 엔드포인트 요약

| Method | Path | FE | 비고 |
|--------|------|:--:|------|
| GET | `/index` | ✅ | 폴링. SSE·limit ⏳/🔄 |
| GET | `/checkStatus` | ✅ | |
| POST | `/register` | ✅ | JSON. ⏳ BE |
| GET | `/register/getmaterial` | ✅ | |
| GET | `/register/getstate` | ✅ | |
| GET | `/register/getadminname` | ✅ | |
| POST | `/admin/login` | ✅ | |
| GET | `/admin/view` | ✅ | 배열. 페이지네이션 🔄 |
| PATCH | `/admin/{id}/status` | ✅ | 전이 검증 ⏳ |
| PATCH | `/admin/{id}/manager` | ✅ | 미지정 `""` → `null` 🔄 |
| GET/PATCH | `/admin/setting` | ✅ | limit 🔄 |
| POST | `/admin/create/*` | ✅ | |
| DELETE | `/admin/delete/{type}/{id}` | ✅ | |
| GET | `/events` | 🔄 | |
| GET | `/admin/stats` | 🔄 | |
| PATCH | `/admin/{id}/material` | 🔄 | |
| PATCH | `/admin/{id}/hide` | 🔄 | |
| * | `/admin/teams` | 🔄 | |

**삭제:** `GET /checkStatus/view`

---

## BE 확정 대기

1. `GET /admin/view` Page JSON 스키마  
2. `PATCH .../hide` body  
3. `/admin/teams` path·DTO  
4. 에러 응답 JSON 공통 스키마  
5. `completedTeam`이 `{팀}_{주문ID}`인지  

## 배포 순서

1. BE Phase 0 (`/register` + JSON + 상태 코드 + Index 필터) — **FE 경로·상태·JSON은 선행 반영됨**  
2. 이후 Phase 단위 동시 배포  

---

## 문서 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v0.1 | 2026-07-21 | 프론트 코드 역분석 |
| v0.2 | 2026-07-21 | 기획서 §5.3 상태 코드 |
| v0.3 | 2026-07-21 | BE·FE 개발계획 대조 |
| v0.4 | 2026-07-21 | **현재 프론트 기준 전면 갱신** (경로·상태·접수 JSON 반영, 현황 표 정리) |
