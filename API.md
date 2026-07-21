# HNN Frontend API 명세서

> 기준: 현재 프론트엔드 코드 (`src/`)가 실제로 호출·기대하는 계약  
> Base URL: `https://backend-production-2949.up.railway.app/hnn`  
> Content-Type: `application/json`  
> Timeout: 10초

---

## 공통

### 인증

| 항목 | 내용 |
|------|------|
| 방식 | Bearer Token |
| 헤더 | `Authorization: Bearer {accessToken}` |
| 토큰 발급 | `POST /admin/login` 응답의 `accessToken` |
| 저장 | 프론트 `localStorage.accessToken` |

관리자 전용 API (`/admin/*` 중 login 제외)는 인증이 필요하다고 가정합니다.  
공개 API: `/index`, `/checkStatus`, `/registar`, `/registar/getmaterial`

### 주문 상태 코드 (`state` / `status`)

> 기획서 §5.3 (v0.4 확정) 기준.  
> **주의:** Admin 주문 목록은 필드명 `state`, 팀 조회는 필드명 `status`를 사용합니다.

#### 상태 정의

| 순서 | 한글 표시명 | 상태 코드 | 의미 | 다음 대기 |
|:---:|------------|-----------|------|----------|
| 1 | 제출 완료 | `submitted` | 참가자가 신청서(접수)를 제출함 | 관리자 **접수** 대기 |
| 2 | 접수 완료 | `accepted` | 관리자가 신청서를 검토·승인함 | **디자인** 대기 |
| 3 | 디자인 완료 | `design_complete` | 종이 도면 → 전자 문서 디자인 완료 | **출력** 대기 |
| 4 | 출력 완료 | `print_complete` | MDF/아크릴 출력 완료 | 참가자 **수령** 대기 |
| 5 | 수령 완료 | `picked_up` | 참가자가 물품을 수령함 | (종료) |
| — | 실패 | `failed` | 디자인/출력 중 실패. 참가자 **재접수** 필요 | (종료) |

> `picked_up`은 공개 대시보드(완료·대기 명단)에 **표시하지 않음**. 관리자·팀 조회에서만 확인.

#### 허용 전이

| from | → to (허용) |
|------|------------|
| *(신규 접수)* | `submitted` |
| `submitted` | `accepted`, `failed` |
| `accepted` | `design_complete`, `failed` |
| `design_complete` | `print_complete`, `failed` |
| `print_complete` | `picked_up`, `failed` |
| `picked_up` | *(전이 없음 — 종료)* |
| `failed` | *(전이 없음 — 재접수는 **새 주문** 생성)* |

#### 대시보드 노출 규칙

| 상태 | 완료 명단 | 대기 명단 |
|------|:--------:|:--------:|
| `submitted` | ❌ | ❌ |
| `accepted` | ❌ | ✅ |
| `design_complete` | ❌ | ✅ |
| `print_complete` | ✅ | ❌ |
| `picked_up` | ❌ | ❌ |
| `failed` | ❌ | ❌ |

#### v0.1 → v0.4 마이그레이션

| v0.1 코드 (현재 프론트) | v0.4 코드 | v0.1 표시명 |
|------------------------|-----------|------------|
| `submission` | `submitted` | 제출완료 |
| `register` | `accepted` | 접수완료 |
| `design` | `design_complete` | 디자인완료 |
| `print` | `print_complete` | 출력완료 |
| `rejection` | `failed` | 실패 |
| *(없음)* | `picked_up` | *(신규)* |

> **구현 현황:** 현재 프론트 `statusMap`·mock 데이터는 아직 v0.1 코드를 사용합니다. API/백엔드 마이그레이션 후 프론트를 v0.4로 맞춰야 합니다.

### 일시 형식

- ISO-8601 문자열 권장: `YYYY-MM-DDTHH:mm:ss` 또는 `YYYY-MM-DDTHH:mm:ss.sssZ`
- 예: `"2026-07-21T21:00:00"`

---

## 1. 대시보드

### `GET /index`

대시보드 메인 데이터. 프론트는 **5초마다** 폴링합니다.

**사용처:** `DashboardPage`

**Response `200`**

```json
{
  "completedTeam": ["T1_1", "T1_3", "T2_2"],
  "waitingTeam": ["T2_1", "T3_4"],
  "endTime": "2026-07-21T21:00:00",
  "emergencyMessage": ["긴급 메시지1", "긴급 메시지2"],
  "messages": ["공지1", "공지2"]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `completedTeam` | `string[]` | 완료 팀명 목록 |
| `waitingTeam` | `string[]` | 대기 팀명 목록 |
| `endTime` | `string \| null` | 카운트다운 종료 시각 |
| `emergencyMessage` | `string[]` | 긴급 바 메시지 (비어 있으면 바 숨김) |
| `messages` | `string[]` | 공지판 메시지 |

---

## 2. 접수

### `GET /registar/getmaterial`

접수 폼용 재질 목록.

**사용처:** `SubmissionPage`

**Response `200`**

```json
["PLA", "ABS", "PETG", "TPU"]
```

| 타입 | 설명 |
|------|------|
| `string[]` | 재질명 배열. 첫 항목이 기본 선택값 |

---

### `POST /registar`

신규 접수 등록.

**사용처:** `SubmissionPage`

**Request Body**

```json
{
  "teamNum": "T2_1",
  "material": "PLA"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `teamNum` | `string` | O | 팀명 |
| `material` | `string` | O | 재질명 |

**Response `200`**

프론트는 응답을 **문자열**로 파싱합니다.

```text
접수가 완료되었습니다. 접수번호: 16
```

- `:` 뒤 숫자를 접수번호로 추출합니다.
- 형식이 바뀌면 UI에서 접수번호가 `확인불가`로 표시됩니다.

---

## 3. 팀 진행 현황

### `GET /checkStatus`

팀명으로 주문 현황 조회.

**사용처:** `TeamLookupPage`

**Query**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `teamNum` | `string` | O | 팀명 |

예: `GET /checkStatus?teamNum=T2_1`

**Response `200`**

```json
[
  {
    "orderId": 201,
    "material": "PLA",
    "status": "print",
    "orderTime": "2026-07-21T14:30:00"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `orderId` | `number` | 주문 ID |
| `material` | `string` | 재질 |
| `status` | `string` | 상태 코드 (`state`가 아님) |
| `orderTime` | `string` | 주문 시각 |

- 빈 배열 `[]`: 해당 팀 주문 없음
- 조회 실패(4xx/5xx): "해당 팀을 찾을 수 없습니다." 표시

---

## 4. 인증

### `POST /admin/login`

관리자 로그인.

**사용처:** `LoginPage`

**Request Body**

```json
{
  "username": "admin",
  "password": "password"
}
```

**Response `200`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `accessToken` | `string` | JWT 등 Bearer 토큰 |

실패 시 프론트는 401 등으로 간주하고 로그인 오류 메시지를 표시합니다.

---

## 5. 관리자 — 주문

### `GET /admin/view`

전체 주문 목록.

**사용처:** `AdminPage`  
**인증:** 필요

**Response `200`**

```json
[
  {
    "orderId": 101,
    "teamNum": "T2_1",
    "material": "PLA",
    "fileName": "T2_1_PLA.stl",
    "admin": "김한노",
    "state": "register"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `orderId` | `number` | 주문 ID |
| `teamNum` | `string` | 팀명 |
| `material` | `string` | 재질 |
| `fileName` | `string \| null` | 파일명 (`null`이면 `-` 표시) |
| `admin` | `string` | 담당자 (미지정은 `""` 또는 falsy) |
| `state` | `string` | 상태 코드 |

---

### `GET /registar/getstate`

상태 드롭다운 옵션 목록.

**사용처:** `AdminPage`

**Response `200`**

```json
["submission", "register", "design", "print", "rejection"]
```

---

### `GET /registar/getadminname`

담당자 드롭다운 옵션 목록.

**사용처:** `AdminPage`

**Response `200`**

```json
["김한노", "이한노", "박한노"]
```

---

### `PATCH /admin/{orderId}/status`

주문 상태 변경.

**사용처:** `AdminPage`  
**인증:** 필요

**Path**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `orderId` | `number` | 주문 ID |

**Request Body**

```json
{
  "status": "design"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `string` | 새 상태 코드 |

**Response `200`**

프론트는 본문을 사용하지 않습니다. 성공(2xx)이면 로컬 state를 갱신합니다.

> 요청 필드는 `status`이지만, 목록 응답 필드는 `state`입니다.

---

### `PATCH /admin/{orderId}/manager`

주문 담당자 변경.

**사용처:** `AdminPage`  
**인증:** 필요

**Request Body**

```json
{
  "manager": "김한노"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `manager` | `string` | 담당자명. 미지정 시 `""` |

**Response `200`**

본문 미사용. 성공 시 로컬 `admin` 필드 갱신.

---

## 6. 관리자 — 설정

### `GET /admin/setting`

설정 전체 조회 (대회 / 공지 / 재질).

**사용처:** `AdminSettingsPage`  
**인증:** 필요

**Response `200`**

```json
{
  "eventInfos": [
    {
      "eventId": 1,
      "eventName": "한노 여름방학 해커톤",
      "description": "3D 프린팅 접수 및 출력 운영",
      "startTime": "2026-07-21T09:00:00",
      "endTime": "2026-07-21T21:00:00",
      "open": true
    }
  ],
  "messages": [
    {
      "messageId": 1,
      "content": "출력기 점검으로 대기가 길어질 수 있습니다",
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

#### `eventInfos[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `eventId` | `number` | 대회 ID |
| `eventName` | `string` | 대회명 |
| `description` | `string` | 설명 |
| `startTime` | `string` | 시작 시각 |
| `endTime` | `string` | 종료 시각 |
| `open` | `boolean` | 진행중 여부 |

#### `messages[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `messageId` | `number` | 메시지 ID |
| `content` | `string` | 내용 |
| `emergency` | `boolean` | 긴급 여부 |
| `display` | `boolean` | 표시 여부 |

#### `materials[]`

| 필드 | 타입 | 설명 |
|------|------|------|
| `materialId` | `number` | 재질 ID |
| `materialName` | `string` | 재질명 |
| `active` | `boolean` | 활성 여부 |

---

### `PATCH /admin/setting`

설정 일괄 저장.

**사용처:** `AdminSettingsPage`  
**인증:** 필요

**Request Body**

```json
{
  "eventInfoRequestDtos": [
    {
      "eventId": 1,
      "eventName": "한노 여름방학 해커톤",
      "description": "...",
      "startTime": "2026-07-21T09:00:00",
      "endTime": "2026-07-21T21:00:00",
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

> **필드명 주의 (GET vs PATCH)**  
> GET: `open`, `display`, `emergency`, `active`  
> PATCH: `isOpen`, `isDisplay`, `isEmergency`, `isActive`

**Response `200`**

본문 미사용.

---

### `POST /admin/create/eventinfo`

대회 추가.

**사용처:** `AdminSettingsPage` → `AddEventModal`  
**인증:** 필요

**Request Body**

```json
{
  "eventName": "새 대회",
  "description": "설명",
  "startTime": "2026-08-01T10:00:00",
  "endTime": "2026-08-01T18:00:00",
  "open": true
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `eventName` | `string` | O | 대회명 |
| `description` | `string` | | 설명 |
| `startTime` | `string \| null` | | 시작 |
| `endTime` | `string \| null` | | 종료 |
| `open` | `boolean` | | 진행중 |

**Response `200`**

성공 후 프론트가 `GET /admin/setting`을 재호출합니다.

---

### `POST /admin/create/message`

공지 메시지 추가.

**사용처:** `AdminSettingsPage`  
**인증:** 필요

**Request Body**

```json
{
  "content": "새 공지 내용",
  "emergency": false,
  "display": true
}
```

---

### `POST /admin/create/material`

재질 추가.

**사용처:** `AdminSettingsPage`  
**인증:** 필요

**Request Body**

```json
{
  "materialName": "Nylon",
  "active": true
}
```

---

### `DELETE /admin/delete/{type}/{id}`

설정 항목 삭제.

**사용처:** `AdminSettingsPage`  
**인증:** 필요

**Path**

| 파라미터 | 값 | 설명 |
|----------|-----|------|
| `type` | `eventinfo` \| `message` \| `material` | 삭제 대상 종류 |
| `id` | `number` | 각각 `eventId` / `messageId` / `materialId` |

예:

- `DELETE /admin/delete/eventinfo/1`
- `DELETE /admin/delete/message/2`
- `DELETE /admin/delete/material/3`

**Response `200`**

성공 후 `GET /admin/setting` 재호출.

---

## 엔드포인트 요약

| Method | Path | 인증 | 사용 페이지 |
|--------|------|------|-------------|
| GET | `/index` | | Dashboard |
| GET | `/registar/getmaterial` | | Submission |
| POST | `/registar` | | Submission |
| GET | `/checkStatus` | | TeamLookup |
| POST | `/admin/login` | | Login |
| GET | `/admin/view` | O | Admin |
| GET | `/registar/getstate` | | Admin |
| GET | `/registar/getadminname` | | Admin |
| PATCH | `/admin/{orderId}/status` | O | Admin |
| PATCH | `/admin/{orderId}/manager` | O | Admin |
| GET | `/admin/setting` | O | AdminSettings |
| PATCH | `/admin/setting` | O | AdminSettings |
| POST | `/admin/create/eventinfo` | O | AdminSettings |
| POST | `/admin/create/message` | O | AdminSettings |
| POST | `/admin/create/material` | O | AdminSettings |
| DELETE | `/admin/delete/{type}/{id}` | O | AdminSettings |

---

## 프론트 기준 주의사항

1. **철자:** 경로에 `registar`(register 아님)가 사용됩니다.
2. **상태 필드 불일치:** 주문 목록=`state`, 팀 조회=`status`, 상태 변경 요청=`status`.
3. **설정 boolean 접두사:** GET은 `open/display/...`, PATCH 저장은 `isOpen/isDisplay/...`.
4. **접수 응답:** JSON 객체가 아니라 **평문 문자열**을 파싱합니다.
5. **에러 처리:** 대부분 4xx/5xx면 사용자 알림만 하고, 상세 에러 바디 스키마는 가정하지 않습니다.

---

*생성 기준 코드: `src/api/axios.js`, `src/pages/*`, `src/context/AuthContext.jsx`, `src/mocks/data.js`*
