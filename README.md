# hnn-react

행사 현장용 **주문·진행 현황 프론트엔드** (React + Vite).  
참가팀 접수·현황 조회와 관리자 주문/설정 관리를 담당합니다.

API 계약·엔드포인트 상세는 [API.md](./API.md)를 참고하세요.

---

## 기술 스택

| 항목 | 버전 |
|------|------|
| React | 19 |
| Vite | 7 |
| React Router | 7 |
| Axios | 1.11 |
| 언어 | JavaScript (JSX) |

---

## 페이지 · 라우트

| 경로 | 페이지 | 설명 | 인증 |
|------|--------|------|:----:|
| `/` | Dashboard | 완료/대기 팀, 공지, 긴급 메시지, 종료 시각 (5초 폴링) | — |
| `/submission` | Submission | 팀명·재질로 주문 접수 | — |
| `/team-lookup` | TeamLookup | 팀명으로 진행 현황 조회 | — |
| `/login` | Login | 관리자 JWT 로그인 | — |
| `/admin` | Admin | 주문 목록·상태/담당자 수정, 필터·새로고침 | JWT |
| `/admin/settings` | AdminSettings | 행사/공지/재질·대시보드 표시 개수 설정 | JWT |

관리자 경로는 `ProtectedRoute` + `AuthContext`로 보호합니다.  
토큰은 `localStorage.accessToken`, 요청 헤더는 `Authorization: Bearer …` 입니다.

---

## 시작하기

```bash
npm install
npm run dev        # 기본: mock 모드 (.env.development)
```

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` / `dev:mock` | Vite 기본 모드 → `VITE_USE_MOCK=true` |
| `npm run dev:api` | `--mode api` → `.env.api` (`VITE_USE_MOCK=false`), Railway API 연동 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint |

### 환경 변수

| 파일 | 용도 |
|------|------|
| `.env.example` | 변수 예시 |
| `.env.development` | 로컬 기본 (mock ON) |
| `.env.api` | 실제 API 연동 (mock OFF) |

```env
# true면 백엔드 없이 샘플 데이터로 화면 표시
VITE_USE_MOCK=true
```

- Mock ON 시 Axios adapter가 `src/mocks/handler.js`로 요청을 가로챕니다.
- 화면 상단에 **MOCK MODE** 배너가 표시됩니다.
- Mock에서는 관리자 페이지에 바로 진입 가능하며, 로그아웃 후 로그인 시 아무 계정이나 통과합니다.

> **참고:** API Base URL은 현재 `src/api/axios.js`에 Railway 주소가 하드코딩되어 있습니다.  
> `VITE_API_BASE_URL` 환경변수화는 아직 미반영입니다.

---

## 디렉터리 구조

```
src/
├── api/axios.js          # Axios 클라이언트 · mock adapter
├── constants/status.js   # 주문 상태 코드 단일 정의
├── context/AuthContext.jsx
├── mocks/                # mock 데이터 · 핸들러 · 배너
├── components/           # Header, Modal, StatusCard 등
├── pages/                # 라우트별 페이지
├── App.jsx
└── main.jsx              # 라우터 · AuthProvider
```

---

## 주문 상태 코드

`src/constants/status.js`가 프론트 단일 기준입니다.

| 코드 | 표시명 |
|------|--------|
| `submitted` | 제출 완료 |
| `accepted` | 접수 완료 |
| `design_complete` | 디자인 완료 |
| `print_complete` | 출력 완료 |
| `picked_up` | 수령 완료 |
| `failed` | 실패 |

---

## 구현 현황 (요약)

프론트에 반영된 주요 기능:

- 공개: 대시보드(`/index`), 접수(`/register`), 재질 목록, 팀 현황(`/checkStatus`)
- 관리자: 로그인, 주문 조회·수정, 설정(행사/메시지/재질)
- Admin 필터(상태·담당자·재질·팀) 및 소프트 새로고침
- `VITE_USE_MOCK` 기반 로컬 개발

아직 미구현·부분 구현:

- `VITE_API_BASE_URL` (하드코딩 중)
- 401 인터셉터 (자동 로그아웃·리다이렉트)
- SSE `/events` (대시보드는 5초 폴링)
- 페이지네이션·정렬·stats·hide 등 Admin 고도화
- setting의 `completedLimit` / `waitingLimit` — UI는 있으나 BE 계약·배포와 맞춤 필요

상세는 [API.md — 프론트 구현 현황](./API.md)을 보세요.

---

## 관련 문서

- [API.md](./API.md) — FE·BE 공통 API 계약 (v0.5)
- Base URL: `/hnn`  
  프로덕션: `https://backend-production-2949.up.railway.app/hnn`
