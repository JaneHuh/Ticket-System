# Ticket System

사내 업무 요청·장애·문의를 접수하고 담당자 배정 → 처리 → 완료까지 추적하는 티켓 관리 시스템.
Next.js(App Router) + TypeScript + Supabase + Vercel 기반. 설계 배경은 [`docs/Concept.md`](./docs/Concept.md) 참고.

- **로그인(R1)**: Supabase Auth 이메일 로그인, 역할 3종(requester/agent/admin)
- **검색(R2)**: PostgreSQL `tsvector` + `pg_trgm` 전문검색 + 상태/우선순위/담당자/기간 필터
- **이메일 발송(R3)**: Resend API, `email_logs` 테이블로 발송 이력 추적
- **실시간 채팅(R4)**: 구현하지 않음 — 댓글(CRUD)로 대체
- **규모(R5)**: 월 사용자 100명 / 월 티켓 50건 — 이 규모에 맞춰 Redis/큐/마이크로서비스/외부 검색엔진 없이 Supabase 단일 DB로 구성

## 시작하기

### 1. Supabase 로컬 환경

```bash
npx supabase start
```

출력되는 `API URL`, `anon key`, `service_role key`를 `.env.local`에 채운다.

```bash
cp .env.example .env.local
```

### 2. 마이그레이션 적용 + 시드

```bash
npx supabase db reset   # supabase/migrations 전체 적용 + supabase/seed.sql 실행
```

> `supabase/seed.sql`은 검색 성능 확인용 더미 티켓 2,000건을 생성한다. `role='requester'`인 프로필이 최소 1개 있어야 하므로, 먼저 Supabase Studio(`http://127.0.0.1:54323`)에서 테스트 계정으로 회원가입한 뒤 재실행한다.

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속 → `/signup`에서 계정 생성 (기본 role: `requester`). agent/admin 권한은 Supabase Studio에서 `profiles.role`을 직접 수정해 부여한다 (일반 사용자는 API로 자신의 role을 바꿀 수 없다 — RLS/트리거로 차단됨).

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드/실행 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 타입 체크 |
| `npm test` | Vitest 단위 테스트 |
| `npm run e2e` | Playwright E2E (앱이 `localhost:3000`에서 실행 중이어야 함) |

## 이메일 발송 안전장치

`NODE_ENV=production`이 아닌 환경(local/staging)에서는 모든 메일이 `STAGING_TEST_EMAIL` 주소로만 발송된다. 이 값이 없으면 발송이 실패한다 — 테스트 중 실제 직원에게 메일이 나가는 사고를 막기 위한 장치이므로 우회하지 않는다.

## 문서

- [`docs/Concept.md`](./docs/Concept.md) — 설계 개념서 (요구사항, 아키텍처, 데이터 모델, 구현 절차)
- [`docs/requirements.md`](./docs/requirements.md) — 화면 목록, 역할 접근표, 이메일 템플릿 문안
- [`docs/DesignSystem.md`](./docs/DesignSystem.md) — 디자인 토큰 (색상/타이포그래피/컴포넌트 패턴)
- [`docs/ToDo.md`](./docs/ToDo.md) — Phase별 진행 체크리스트
- [`tests/rls-manual-checklist.md`](./tests/rls-manual-checklist.md) — RLS 수동 검증 체크리스트 (사람이 직접 수행)
- [`CLAUDE.md`](./CLAUDE.md) — AI 코딩 에이전트 규칙

## 보안 메모

- `SUPABASE_SERVICE_ROLE_KEY`는 `lib/supabase/admin.ts`(서버 전용) 외에서 사용하지 않는다.
- 모든 테이블은 RLS가 활성화되어 있다. 새 테이블 추가 시 같은 마이그레이션에 RLS 정책을 포함한다.
- 검색 함수(`search_tickets`)는 `security invoker`다 — `security definer`로 바꾸면 RLS가 우회된다.
