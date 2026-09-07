# RLS 수동 검증 체크리스트

> Concept.md Phase 8: "AI가 만든 코드를 AI가 만든 테스트로만 검증하지 않는다. 최소한 권한 테스트 케이스는 사람이 직접 설계한다."
> 아래는 로컬(`npx supabase start`) 또는 스테이징 환경에서, `requester`/`agent`/`admin` 3개 테스트 계정으로 **직접 로그인해** 확인해야 하는 항목이다. Service Role Key를 쓰지 않고 각 계정의 anon 세션으로 시도한다.

## 준비
1. `npx supabase start` 후 `/signup`에서 3개 계정 생성 (예: `requester@test.local`, `agent@test.local`, `admin@test.local`)
2. Supabase Studio → `profiles` 테이블에서 두 번째/세 번째 계정의 `role`을 각각 `agent`, `admin`으로 수정
3. `admin` 계정으로 티켓 1건을 등록하고, `agent` 계정을 담당자로 배정해 둔다

## tickets
- [ ] `requester`가 본인이 등록하지 않은 티켓을 `/tickets/{다른 사람 id}`로 직접 조회 → 조회 실패(또는 404)해야 한다
- [ ] `requester`가 REST API(`PATCH /rest/v1/tickets?id=eq.<다른 티켓>`)로 `status`를 직접 바꾸려는 시도 → 거부되어야 한다
- [ ] `requester`가 자신의 티켓의 `assignee_id`를 직접 바꾸려는 시도 → 거부되어야 한다 (`prevent_requester_field_tampering` 트리거)
- [ ] `agent`가 배정되지 않은 다른 팀 티켓을 조회 → 소속 팀이 아니면 보이지 않아야 한다
- [ ] `agent`가 배정된 티켓의 상태를 허용되지 않은 경로로 변경 시도 (예: `open` → `resolved`) → 거부되어야 한다 (`enforce_ticket_status_transition`)
- [ ] `admin`은 모든 티켓을 조회·수정할 수 있어야 한다

## profiles
- [ ] `requester`가 자신의 `role`을 `admin`으로 바꾸는 UPDATE 요청 → 거부되어야 한다 (`prevent_self_role_escalation`)
- [ ] `requester`가 다른 사용자의 프로필을 조회 → 같은 팀이 아니면 보이지 않아야 한다

## ticket_comments
- [ ] `requester`가 `is_internal=true`인 내부 메모 댓글을 조회 → 보이지 않아야 한다
- [ ] `requester`가 `is_internal=true`로 댓글을 작성 시도 → 거부되어야 한다
- [ ] `agent`/`admin`은 내부 메모를 조회·작성할 수 있어야 한다

## email_logs
- [ ] `requester`/`agent` 계정으로 `GET /rest/v1/email_logs` 호출 → 빈 결과 또는 거부되어야 한다 (admin만 조회 가능)

## search_tickets 함수
- [ ] `requester` 세션으로 `rpc('search_tickets', { keyword: '...' })` 호출 시, 본인 티켓 외의 결과가 섞여 나오지 않는지 확인 (RLS가 함수 내부에도 적용되는지 = `security invoker` 검증)
- [ ] 마이그레이션에서 `search_tickets`가 `security invoker`로 선언되어 있는지 SQL로 재확인:
  ```sql
  select proname, prosecdef from pg_proc where proname = 'search_tickets';
  -- prosecdef가 false여야 한다 (true면 security definer = RLS 우회, 즉시 수정 필요)
  ```

## 이메일 발송
- [ ] 비-production 환경에서 상태 변경/댓글 등록을 트리거했을 때, 실제 테스트 계정 이메일이 아니라 `STAGING_TEST_EMAIL`로만 발송되는지 확인
