# Ticket System — Concept

> Vibe Coding(AI Coding Agent 주도 개발) 기반 사내 티켓 관리 시스템 설계 및 구현 개념서
> Stack: Next.js(App Router) + TypeScript + Supabase + Vercel + GitHub

---

## 1. 목적과 범위

### 1.1 만들려는 것
사내 업무 요청·장애·문의를 하나의 창구로 접수하고, 담당자 배정 → 처리 → 완료까지의 흐름을 추적하는 티켓 관리 시스템.

### 1.2 확정 요구사항

| # | 요구사항 | 포함 여부 | 구현 방식 |
|---|---|:---:|---|
| R1 | **로그인** | **O** | Supabase Auth (이메일 + 사내 소셜), 역할 3종 |
| R2 | **검색** | **O** | PostgreSQL 전문검색(tsvector + GIN) + 상태·기간·담당자 필터 |
| R3 | **이메일 발송** | **O** | Resend API + Supabase Edge Function, 발송 이력 테이블로 추적 |
| R4 | **실시간 채팅** | **X** | 구현하지 않음. 소통은 티켓 댓글(일반 CRUD)로 대체 |
| R5 | 규모 | — | 월 사용자 100명 / 월 티켓 50건 |

**R4를 명시적으로 "X"로 적는 이유:** 요구사항에 없다는 말을 문서에 남기지 않으면, AI 에이전트가 Supabase Realtime을 보고 채팅 UI·WebSocket 구독·읽음 표시까지 알아서 만들어낸다. 만들지 않을 것도 적어야 한다.

### 1.3 MVP 범위 (1차 구현)
| 구분 | 포함 | 제외 |
|---|---|---|
| 인증 | 이메일/소셜 로그인, 역할 구분 | SSO, LDAP 연동 |
| 티켓 | 등록·조회·수정·상태 변경 | SLA 자동 에스컬레이션 |
| 검색 | 제목·본문 전문검색, 상태/담당자/기간 필터 | 첨부파일 내용 검색, 유사 티켓 추천 |
| 협업 | 댓글, 담당자 배정, 첨부파일 | **실시간 채팅**, 승인 결재선 |
| 알림 | **이메일 발송**, 인앱 알림 | 카카오/SMS 발송 |
| 관리 | 대시보드(상태별 집계) | 통계 리포트 export |

### 1.4 규모 산정과 그 결과

| 항목 | 수치 | 설계에 미치는 영향 |
|---|---|---|
| 월 활성 사용자 | 100명 | 동시 접속 최대 10~20명 수준 |
| 월 신규 티켓 | 50건 | 연 600건, 3년 누적 약 1,800건 |
| 댓글 | 티켓당 평균 5건 가정 | 연 3,000행 |
| 첨부파일 | 티켓당 평균 1건 × 2MB | 연 약 1.2GB |
| 이메일 발송 | 티켓당 3~4통 | 월 약 200통 |

**결론 — 이 규모에서 하지 말아야 할 것:** Redis 캐시, 큐 시스템, 마이크로서비스 분리, Elasticsearch/Algolia, 무한 스크롤·가상화 리스트 → 전부 과잉 설계. Supabase 단일 DB + PostgreSQL 전문검색 + 페이지네이션 20건으로 충분하다.

### 1.5 역할(Role) 정의
- `requester` — 티켓 등록, 본인 티켓만 조회
- `agent` — 배정된 티켓 + 소속 팀 티켓 조회·처리
- `admin` — 전체 조회, 배정, 마스터 데이터 관리

---

## 2. 아키텍처

```
사용자 브라우저 / 모바일
        │  HTTP (WebSocket 미사용 — 실시간 채팅 범위 제외)
[Frontend & App] Vercel + Next.js (App Router)
  • Server Components / Server Actions
  • Route Handlers (API)
  • 미들웨어에서 세션 검증
        │  supabase-js / PostgREST
[Backend] Supabase
  • PostgreSQL (+ RLS, 전문검색 tsvector)
  • Auth (JWT)
  • Storage (첨부파일)
  • Edge Functions (이메일 발송 트리거)
        │
        └──▶ Resend API ──▶ 담당자 / 요청자 메일함
        │
GitHub → Vercel 자동배포 (Preview / Staging / Production)
```

> Realtime을 쓰지 않는다. 요구사항 R4에 따라 실시간 채팅은 범위 밖이고, 티켓 목록은 새로고침·라우터 refresh로 충분한 규모(월 50건)다.

### 2.2 보안 경계선

| 키 | 노출 위치 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 O | 접속 주소 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 O | RLS 통과 전제의 일반 접근 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용, 절대 클라이언트 금지 | 관리자 배치·시스템 작업 |

> 원칙: 권한 판단의 최종 책임은 RLS에 둔다. UI에서 버튼을 숨기는 것은 보안이 아니라 UX다.

---

## 3. 데이터 모델

```
profiles            사용자 프로필 (auth.users 확장, role 보관)
teams               처리 조직
tickets             티켓 본문 (제목/내용/상태/우선순위/요청자/담당자)
ticket_comments     댓글 (내부 메모 여부 플래그 포함)
ticket_attachments  첨부파일 메타 (실제 파일은 Storage)
ticket_history      상태·담당자 변경 이력 (감사 추적)
notifications       인앱 알림
email_logs          이메일 발송 이력 (성공/실패, 재시도 추적)
```

### 상태 전이(Status Flow)
```
open ──▶ in_progress ──▶ resolved ──▶ closed
  │            │              │
  └──────▶ on_hold ◀──────────┘
                              └──▶ reopened ──▶ in_progress
```
전이 규칙은 DB 제약 또는 트리거로 강제한다.

### RLS 정책 (필수)
Supabase 테이블은 RLS를 켜지 않으면 anon key로 전부 열린다. 테이블 생성과 RLS 설정은 항상 같은 마이그레이션에 넣는다. `profiles.role`은 사용자가 스스로 수정할 수 없어야 한다.

---

## 4. 검색 설계 (R2)

3년 누적 약 1,800행 규모이므로 외부 검색 엔진은 불필요하다. `tsvector` 전문검색 + `pg_trgm` 부분 일치를 함께 두고 검증한다.

> 검색 함수를 `security definer`로 만들면 RLS가 우회되어 모든 사용자가 남의 티켓을 검색으로 열람하게 된다. 반드시 `security invoker`를 사용한다.

검색 UX: URL 쿼리스트링(`?q=&status=&assignee=`) 기반, 디바운스 300ms, 최소 2글자.

---

## 5. 이메일 발송 설계 (R3)

| 트리거 | 수신자 | 제목 예시 |
|---|---|---|
| 티켓 등록 | 담당 팀 / 관리자 | `[티켓 #123] 새 요청이 접수되었습니다` |
| 담당자 배정 | 배정된 담당자 | `[티켓 #123] 담당자로 지정되었습니다` |
| 상태 변경 | 요청자 | `[티켓 #123] 처리 상태가 '처리중'으로 변경되었습니다` |
| 댓글 등록 | 상대방 (내부 메모는 제외) | `[티켓 #123] 새 댓글이 등록되었습니다` |
| 완료 처리 | 요청자 | `[티켓 #123] 처리가 완료되었습니다` |

핵심 원칙: 이메일 발송 실패가 티켓 처리를 롤백시키면 안 된다. DB 커밋과 메일 발송을 분리하고, 실패는 `email_logs`에 남겨 재시도한다.

보안·운영 주의사항: `RESEND_API_KEY`는 서버 전용. 메일 본문에 티켓 본문 전체를 담지 않는다(제목·상태·링크만). 수신자 주소는 DB 조회값만 사용. 헤더 인젝션 방지를 위해 개행 제거. 스테이징에서는 실제 주소로 발송되지 않도록 차단한다.

---

## 6~11장

나머지 구현 절차(Phase 0-10), AI 코딩 에이전트 활용법, 보안 체크리스트, 폴더 구조, 진행 순서 요약은 프로젝트 초기 설계 논의에서 합의된 내용이며 `CLAUDE.md`, `docs/requirements.md`, `.github`(추가 시)에 실행 가능한 형태로 반영되어 있다. 상세 산출물:

- AI 규칙: [`CLAUDE.md`](../CLAUDE.md)
- 화면·역할 접근표: [`docs/requirements.md`](./requirements.md)
- 디자인 토큰: [`docs/DesignSystem.md`](./DesignSystem.md)
- 진행 체크리스트: [`docs/ToDo.md`](./ToDo.md)
