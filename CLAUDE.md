# 프로젝트 규칙 (AI 코딩 에이전트용)

이 문서는 `docs/Concept.md`의 개념 설계를 바탕으로 한다. 코드를 작성하기 전에 항상 이 규칙을 먼저 확인한다.

## 스택
- Next.js (App Router) + TypeScript strict + Supabase + Tailwind CSS
- 배포: Vercel. 형상관리: GitHub

## 반드시 지킬 것
- 모든 DB 접근은 `lib/supabase`의 클라이언트를 통해서만 한다. raw fetch로 PostgREST를 직접 호출하지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`는 `lib/supabase/admin.ts`(서버 전용, `import "server-only"`)에서만 사용한다. 클라이언트 컴포넌트로 반입 금지. 이 파일 밖에서 service role을 새로 쓰는 PR은 별도 승인 대상이다.
- 새 테이블을 만들 때는 **같은 마이그레이션 파일 안에** `alter table ... enable row level security`와 정책(`create policy`)을 함께 작성한다. RLS 없는 테이블을 커밋하지 않는다.
- 입력값은 `lib/validations`의 Zod 스키마로 검증한 뒤 Server Action(`lib/actions`)에서 사용한다.
- 컴포넌트는 기본 Server Component. 상호작용(폼 입력, 클릭 핸들러 등)이 필요할 때만 `"use client"`를 붙인다.
- 새 라이브러리를 추가하기 전에 먼저 제안하고 승인을 받는다.
- 한 번에 한 기능만 수정한다. 무관한 파일 리팩터링을 함께 하지 않는다.
- 권한 판단의 최종 책임은 RLS(및 DB 트리거)에 있다. UI에서 버튼을 숨기는 것은 UX일 뿐 보안이 아니다.

## 요구사항 제약 (반드시 지킬 것)
- 규모: 월 사용자 100명 / 월 신규 티켓 50건. **오버엔지니어링 금지**
  → Redis, 메시지 큐, 마이크로서비스, Elasticsearch/Algolia 등 외부 검색엔진, 무한 스크롤/가상화 리스트 도입 금지
- **실시간 채팅 기능은 범위 밖이다 (R4 = X).** Supabase Realtime 구독, WebSocket을 사용하지 않는다. 소통은 `ticket_comments` 일반 CRUD로 대체한다.
- 검색(R2)은 PostgreSQL `tsvector` + `pg_trgm`으로만 구현한다 (`supabase/migrations/20260101000004_search.sql`의 `search_tickets` 함수).
- **`search_tickets` 등 조회 함수는 반드시 `security invoker`여야 한다.** `security definer`로 바꾸면 RLS가 우회되어 전체 티켓이 노출된다 — "권한 오류가 난다"는 이유로 이 값을 바꾸지 말고, 먼저 호출자의 RLS 정책을 점검한다. 변경이 꼭 필요하면 사전 승인을 받는다.
- 이메일 발송(R3)은 서버 사이드(`lib/email`)에서만 한다. 발송 실패가 DB 트랜잭션을 롤백시키면 안 된다 — `email_logs`에 pending/failed로 기록하고 재시도한다.
- 메일 본문에는 티켓 제목·상태·링크만 담는다. 티켓 본문 전체를 메일에 넣지 않는다.
- 비-production 환경에서는 `lib/email/resend.ts`의 스테이징 발송 차단 로직(`STAGING_TEST_EMAIL`)을 절대 우회하지 않는다.
- `profiles.role`, `tickets.status/assignee_id/team_id/requester_id`는 사용자가 스스로 수정할 수 없다 (트리거로 강제됨). 이 트리거를 완화하는 변경은 사전 승인 대상이다.
- 티켓 상태 전이는 `enforce_ticket_status_transition` 트리거가 정의한 경로만 허용한다 (`open → in_progress/on_hold`, `in_progress → on_hold/resolved`, ... ). 애플리케이션 코드에서 이 규칙을 우회하는 다른 경로를 만들지 않는다.

## 폴더 구조
```
/app                     라우트 (App Router)
/components              /ui, /tickets, /search, /layout, /dashboard
/lib
  /supabase              client.ts(브라우저) / server.ts(서버) / admin.ts(service_role, 서버 전용) / types.ts
  /email                 resend.ts, process.ts, templates/
  /validations           Zod 스키마
  /actions               Server Actions
/supabase/migrations     스키마 변경 이력 (RLS 포함)
```

## AI 산출물 수용 기준 (하나라도 아니면 반려)
- [ ] 코드의 동작 원리를 설명할 수 있다
- [ ] import한 라이브러리·함수가 실제로 존재한다 (환각 확인)
- [ ] 권한 검증이 UI가 아니라 DB/서버 레이어에 있다
- [ ] 하드코딩된 키·비밀번호·엔드포인트가 없다
- [ ] 변경 범위가 요청한 기능에 한정된다
- [ ] 요구사항에 없는 기능(채팅, 캐시 레이어 등)이 딸려오지 않았다
