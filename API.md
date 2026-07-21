# HNN API 명세서

> **기준 문서**  
> - [기획서.md](../Documents/기획서.md) v0.5  
> - [백엔드-개발계획.md](../Documents/백엔드-개발계획.md) v1.0  
> - [프론트엔드-개발계획.md](../Documents/프론트엔드-개발계획.md) v1.0  
>
> **Base URL**: `/hnn`  
> 프로덕션: `https://backend-production-2949.up.railway.app/hnn`  
> Content-Type: `application/json` (SSE 제외)

본 문서는 **FE·BE 공통 계약(목표: v0.5)** 을 정의합니다.  
현재 프론트 코드(`hnn-react`)는 아직 **v0.1** 경로·응답을 쓰는 구간이 있어, 각 API에 **현황**을 표시합니다.

| 표시 | 의미 |
|------|------|
| ✅ 목표 = 현재 | 이미 코드와 일치 |
| 🔄 Phase N | 개발계획 Phase N에서 변경/추가 |
| ⚠️ v0.1 잔존 | 현재 프론트가 구계약 사용 중 |

---

## 공통

### 인증

| 항목 | 내용 |
|------|------|
| 방식 | JWT Bearer |
| 헤더 | `Authorization: Bearer {accessToken}` |
| 발급 | `POST /admin/login` → `{ accessToken }` |
| 저장 | `localStorage.accessToken` |
| 만료 | 행사 운영 시간에 맞게 연장 (BE Phase 1, 예: 12h) |
| 401 | HTTP 401 + JSON body → 프론트 인터셉터로 logout + `/login` (FE Phase 1) |

**공개 API** (인증 불필요)

- `GET /index`
- `GET /checkStatus`
- `POST /register`, `GET /register/getmaterial`
- `GET /events` (SSE, Phase 4)

**관리자 API** — `/admin/*` (login 제외) JWT 필요  
`GET /register/getstate`, `GET /register/getadminname` 은 현재 공개이나, BE Phase 6에서 인증 필요로 옮길 수 있음.

### 환경변수 (프론트)

| 변수 | 설명 |
|------|------|
| `VITE_API_BASE_URL` | Axios `baseURL` (목표). 현재는 `axios.js`에 Railway URL 하드코딩 |
| `VITE_USE_MOCK` | `true`면 mock adapter (디자인용) |

### 일시 형식

ISO-8601: `YYYY-MM-DDTHH:mm:ss` 또는 `...Z`  
예: `"2026-07-21T21:00:00"`

### 에러 응답 (목표, BE Phase 1)

| HTTP | 용도 |
|------|------|
| 400 | 잘못된 요청 (`IllegalArgumentException` 등) |
| 401 | 인증 실패·토큰 만료 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 (남용 금지) |

본문 스키마는 백엔드 `GlobalExceptionHandler` 확정 후 보완.

---

## 주문 상태 코드

> 기획서 §5.3 / BE §4.4 / FE `constants/status.js` — **단일 진실 공급원**

### 상태 정의

| 순서 | 한글 표시명 | 상태 코드 | 의미 |
|:---:|------------|-----------|------|
| 1 | 제출 완료 | `submitted` | 참가자 접수 제출 |
| 2 | 접수 완료 | `accepted` | 관리자 검토·승인 |
| 3 | 디자인 완료 | `design_complete` | 디자인 완료 |
| 4 | 출력 완료 | `print_complete` | 출력 완료 |
| 5 | 수령 완료 | `picked_up` | 참가자 수령 (대시보드 미노출) |
| — | 실패 | `failed` | 실패 · 재접수는 **새 주문** |

### 허용 전이 (서버 검증, BE Phase 1)

| from | → to |
|------|------|
| *(신규)* | `submitted` |
| `submitted` | `accepted`, `failed` |
| `accepted` | `design_complete`, `failed` |
| `design_complete` | `print_complete`, `failed` |
| `print_complete` | `picked_up`, `failed` |
| `picked_up` / `failed` | *(종료)* |

### 대시보드 노출 (BE IndexService)

| 상태 | 완료 명단 | 대기 명단 |
|------|:--------:|:--------:|
| `submitted` | ❌ | ❌ |
| `accepted` | ❌ | ✅ |
| `design_complete` | ❌ | ✅ |
| `print_complete` | ✅ | ❌ |
| `picked_up` | ❌ | ❌ |
| `failed` | ❌ | ❌ |

표시 형식(기획): `{팀번호}_{주문ID}`  
건수: 설정값 (기본 완료 9 / 대기 12)

### v0.1 → v0.5 마이그레이션

| v0.1 | v0.5 |
|------|------|
| `submission` | `submitted` |
| `register` | `accepted` |
| `design` | `design_complete` |
| `print` | `print_complete` |
| `rejection` | `failed` |
| — | `picked_up` |

⚠️ **현황:** 프론트 `statusMap`·mock은 아직 v0.1 코드. FE Phase 0에서 `STATUS_LABELS`로 교체.

---

## 1. 대시보드

### `GET /index` ✅ / 🔄 Phase 0·2 (필터·limit)

**사용처:** `DashboardPage`  
**갱신:** 현재 5초 폴링 → 목표 SSE `index_updated` + 폴링 fallback (Phase 4)

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
| `completedTeam` | `string[]` | `print_complete` 주문, 최근순, limit 적용 |
| `waitingTeam` | `string[]` | `accepted` + `design_complete`, 접수 오래된 순, limit 적용 |
| `endTime` | `string` | 활성 이벤트 종료 시각 |
| `emergencyMessage` | `string[]` | 긴급 공지 |
| `messages` | `string[]` | 일반 공지 |

> `picked_up` / `submitted` / `failed` / 숨김 주문은 양쪽에 미포함.

---

## 2. 접수 · 공통 조회

### `POST /register` 🔄 Phase 0

| | v0.1 (현재 프론트) | v0.5 (목표) |
|--|-------------------|-------------|
| Path | `POST /registar` | `POST /register` ✅ 프론트 반영 |
| Response | plain text 문자열 | JSON `{ orderId, message }` ✅ 프론트 반영 |

**Request**

```json
{ "teamNum": "T2_1", "material": "PLA" }
```

**Response `200` (목표)**

```json
{
  "orderId": 16,
  "message": "접수가 완료되었습니다."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `orderId` | `number` | 접수번호 |
| `message` | `string` | 안내 문구 |

초기 상태: `submitted`  
파일명: `{팀번호}_{주문ID}{A|M}` (기획 BR-03)

⚠️ ~~프론트 문자열 파싱~~ → **프론트는 `response.data.orderId` 사용으로 전환 완료.**  
백엔드가 아직 plain text면 깨집니다. BE Phase 0 JSON 배포와 맞출 것.

**병행:** BE는 `/registar/**` → `/register/**` redirect 임시 지원 후 제거.

---

### `GET /register/getmaterial` 🔄 Phase 0 (경로만)

활성 재질(`is_active=true`) 목록.

```json
["PLA", "ABS", "PETG", "TPU"]
```

⚠️ ~~현재: `GET /registar/getmaterial`~~ → 프론트 `/register/getmaterial` 반영 완료.

---

### `GET /register/getstate` 🔄 Phase 0

상태 코드 목록 (드롭다운).

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

⚠️ 상태 코드 목록은 아직 v0.1 5개일 수 있음 (프론트 `statusMap` 미교체). 경로는 `/register/getstate` 반영 완료.

---

### `GET /register/getadminname` 🔄 Phase 0 / Phase 6(인증)

```json
["김한노", "이한노", "박한노"]
```

---

## 3. 팀 진행 현황

### `GET /checkStatus` ✅ (상태 코드만 🔄)

**Query:** `teamNum` (필수)

예: `GET /checkStatus?teamNum=T2_1`

**Response `200`**

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
| `status` | `string` | 상태 코드 (**`state` 아님**) |
| `orderTime` | `string` | 접수 시각 |

기획서 요약에는 `teamNum` 포함 가능 — 백엔드 응답에 있으면 프론트는 무시해도 됨.

**삭제:** `GET /checkStatus/view` (Thymeleaf) — BE Phase 0

---

## 4. 인증

### `POST /admin/login` ✅

**Request**

```json
{ "username": "admin", "password": "password" }
```

**Response `200`**

```json
{ "accessToken": "eyJ..." }
```

실패: **401** + JSON (목표). 현재 프론트는 상태코드만으로 오류 표시.

---

## 5. 관리자 — 주문

### `GET /admin/view` 🔄 Phase 3 (페이지네이션·정렬)

**인증:** 필요

**Query (목표)**

| 파라미터 | 타입 | 기본 | 설명 |
|----------|------|------|------|
| `page` | `number` | 0 | 페이지 번호 |
| `size` | `number` | — | 페이지 크기 |
| `sort` | `string` | — | `orderedAt`, `updatedAt`, `state`, `teamNum` 등 |
| `direction` | `string` | — | `asc` \| `desc` |

**Response `200` — v0.1 / Phase 0~2 (배열)**

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
| `admin` | `string \| null` | 담당자. 미지정은 `null` 또는 `""` |
| `state` | `string` | 상태 코드 |

**Response (목표 Phase 3)** — Spring Page 형태 권장 (백엔드 확정 후 스키마 고정)

```json
{
  "content": [ /* Order 객체 */ ],
  "totalElements": 120,
  "totalPages": 12,
  "number": 0,
  "size": 10
}
```

⚠️ 현재 프론트: 배열 전체 로드, 쿼리 파라미터 없음.

---

### `PATCH /admin/{orderId}/status` ✅ / 🔄 Phase 1 (전이 검증)

**Request**

```json
{ "status": "design_complete" }
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `string` | 새 상태 코드 |

> 요청 필드명 `status` / 목록 응답 필드명 `state` — 불일치 유지(현행 계약).

비허용 전이 → **400** (서버 검증).

---

### `PATCH /admin/{orderId}/manager` 🔄 Phase 1

**Request**

```json
{ "manager": "김한노" }
```

미지정:

```json
{ "manager": null }
```

| | 현재 프론트 | 목표 (FE·BE Phase 1) |
|--|------------|---------------------|
| 미지정 전송 | `""` (빈 문자열) | `null` (또는 `"미지정"` BE 허용) |
| DB | — | `admin_id` NULL |

---

### `PATCH /admin/{orderId}/material` 🔄 Phase 3 (신규)

```json
{ "material": "ABS" }
```

---

### `PATCH /admin/{orderId}/hide` 🔄 Phase 2 (신규)

대시보드 완료 명단에서 숨김 (`hidden_from_dashboard = true`).

Request body 없음 또는 `{ "hidden": true }` — 백엔드 구현 시 확정.

---

### `GET /admin/stats` 🔄 Phase 3 (신규)

상태별 주문 건수.

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

### `GET /admin/setting` 🔄 Phase 2 (dashboard limit 필드)

**Response `200`**

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
  ],
  "completedLimit": 9,
  "waitingLimit": 12
}
```

| 추가 필드 (Phase 2) | 타입 | 기본 | 설명 |
|---------------------|------|------|------|
| `completedLimit` | `number` | 9 | 완료 명단 표시 건수 |
| `waitingLimit` | `number` | 12 | 대기 명단 표시 건수 |

> GET boolean: `open`, `display`, `emergency`, `active` (현재 프론트 계약)

---

### `PATCH /admin/setting` 🔄 Phase 2

**Request**

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
  ],
  "completedLimit": 9,
  "waitingLimit": 12
}
```

> PATCH boolean: `isOpen`, `isDisplay`, `isEmergency`, `isActive`  
> GET과 접두사 불일치 — 현행 유지, 변경 시 FE·BE 동시.

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

| `type` | ID 필드 |
|--------|---------|
| `eventinfo` | `eventId` |
| `message` | `messageId` |
| `material` | `materialId` |

예: `DELETE /admin/delete/message/2`

---

## 7. 실시간 (SSE)

### `GET /events` 🔄 Phase 4 (신규)

- Content-Type: `text/event-stream`
- 전체 경로: `/hnn/events`

**이벤트 타입**

| event | 프론트 동작 |
|-------|------------|
| `orders_updated` | AdminPage 주문 목록 refetch |
| `index_updated` | DashboardPage refetch |
| `settings_updated` | (선택) 설정/대시보드 갱신 |

**예시**

```
event: orders_updated
data: {"type":"orders_updated","timestamp":"2026-07-13T14:30:00"}

event: index_updated
data: {"type":"index_updated"}
```

연결 실패 시 프론트는 5초 폴링 fallback. 수동 새로고침 버튼 유지.

---

## 8. 팀 관리

### `/admin/teams` 🔄 Phase 5 (신규)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/admin/teams` | 팀 목록 |
| POST | `/admin/teams` | 팀 등록 |
| PATCH | `/admin/teams/{teamNum}` | 팀 수정 |
| DELETE | `/admin/teams/{teamNum}` | 팀 삭제 (주문 있으면 금지 또는 soft delete) |

**팀 객체 (목표)**

```json
{
  "teamNum": "T2_1",
  "phone": "010-2222-2222"
}
```

| 필드 | 필수 | 설명 |
|------|:----:|------|
| `teamNum` | O | 팀 식별자 |
| `phone` | | `010-0000-0000` 형식, nullable |

정확한 path/body는 BE `TeamController` 구현 시 확정.

---

## 엔드포인트 요약

### 유지 · 변경

| Method | Path (목표) | Phase | 비고 |
|--------|-------------|:-----:|------|
| GET | `/index` | 0, 2 | 필터·limit |
| GET | `/checkStatus` | 0 | 상태 코드 |
| POST | `/register` | 0 | ← `/registar`, JSON |
| GET | `/register/getmaterial` | 0 | ← `/registar/...` |
| GET | `/register/getstate` | 0 | 6개 코드 |
| GET | `/register/getadminname` | 0 | Phase 6 인증화 가능 |
| POST | `/admin/login` | — | |
| GET | `/admin/view` | 3 | `?page&size&sort&direction` |
| PATCH | `/admin/{id}/status` | 1 | 전이 검증 |
| PATCH | `/admin/{id}/manager` | 1 | `null` 미지정 |
| GET/PATCH | `/admin/setting` | 2 | limit 필드 |
| POST | `/admin/create/*` | — | |
| DELETE | `/admin/delete/{type}/{id}` | — | |

### 신규

| Method | Path | Phase |
|--------|------|:-----:|
| GET | `/events` | 4 |
| GET | `/admin/stats` | 3 |
| PATCH | `/admin/{id}/material` | 3 |
| PATCH | `/admin/{id}/hide` | 2 |
| * | `/admin/teams` | 5 |

### 삭제

| Method | Path | Phase |
|--------|------|:-----:|
| GET | `/checkStatus/view` | 0 |

---

## 검토 결과 (개발계획 대비)

| # | 이슈 | 조치 |
|---|------|------|
| 1 | 명세가 v0.1 as-is만 기술 → 목표 계약과 혼선 | **목표(v0.5) 중심**으로 재작성, 현황 ⚠️ 표시 |
| 2 | `/registar`·문자열 접수 응답이 “정본”처럼 보임 | `/register` + `{ orderId, message }`를 목표로 명시 |
| 3 | 상태 예시에 v0.1 코드 잔존 (`print`, `register` 등) | v0.5 코드로 통일 |
| 4 | 페이지네이션·stats·material·hide·SSE·teams 누락 | Phase별 신규 API 섹션 추가 |
| 5 | setting의 `completedLimit` / `waitingLimit` 누락 | GET/PATCH에 반영 |
| 6 | manager 미지정 `""` vs `null` | Phase 1 목표 `null`로 명시 |
| 7 | 401·에러 코드 미기술 | 공통 섹션에 목표 추가 |
| 8 | 대시보드 명단 형식·필터 규칙 불충분 | §5.3·IndexService 규칙 반영 |
| 9 | `VITE_API_BASE_URL` 미언급 | 공통·환경변수 절 추가 |

### 아직 백엔드 구현 시 확정할 항목

1. `GET /admin/view` Page JSON 정확한 스키마  
2. `PATCH .../hide` body 유무  
3. `/admin/teams` REST path·DTO 세부  
4. 에러 응답 JSON 공통 스키마  
5. `completedTeam` 문자열 형식이 실제 `{팀}_{주문ID}`인지 (기획은 이 형식)

### FE·BE 배포 순서 (개발계획)

1. BE Phase 0 (`/register` + redirect + 상태 코드 + Index 필터)  
2. FE Phase 0 (경로·statusMap·JSON 접수)  
3. 이후 Phase 단위 동시 배포

---

## 문서 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v0.1 | 2026-07-21 | 프론트 코드 역분석 |
| v0.2 | 2026-07-21 | 기획서 §5.3 상태 코드 반영 |
| v0.3 | 2026-07-21 | BE·FE 개발계획 대조 전면 재검토 |

*협업 시 본 문서의 **목표 계약**을 우선하고, ⚠️ 현황은 마이그레이션 체크리스트로 사용합니다.*
