-- 로컬 개발용 더미 데이터. 운영 데이터/개인정보를 넣지 않는다.
-- 검색 성능 확인용 2,000건 포함 (Concept.md Phase 5 참조: 목표 300ms 이내).

insert into teams (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Tech Support'),
  ('00000000-0000-0000-0000-000000000002', 'Billing'),
  ('00000000-0000-0000-0000-000000000003', 'HR')
on conflict do nothing;

-- profiles는 auth.users 트리거로 생성되는 것이 원칙이지만, 로컬 시드에서는
-- supabase auth admin API로 테스트 계정(requester/agent/admin)을 먼저 만든 뒤
-- 아래처럼 role/team을 배정한다. (테스트 계정 생성은 scripts/seed-users.ts 참고)

-- 더미 티켓 2,000건 생성 (검색 성능 측정용)
do $$
declare
  demo_requester uuid;
  demo_team uuid := '00000000-0000-0000-0000-000000000001';
  i int;
begin
  select id into demo_requester from profiles where role = 'requester' limit 1;

  if demo_requester is null then
    raise notice 'requester 테스트 계정이 없어 더미 티켓 생성을 건너뜁니다. scripts/seed-users.ts 먼저 실행하세요.';
    return;
  end if;

  for i in 1..2000 loop
    insert into tickets (title, body, status, priority, requester_id, team_id, created_at)
    values (
      format('샘플 티켓 #%s - %s', i, (array['로그인 오류', '결제 실패', '전자결재 문의', '비밀번호 초기화', 'VPN 접속 불가'])[1 + (i % 5)]),
      format('테스트용 더미 본문입니다. 티켓 번호 %s에 대한 상세 내용을 여기에 기술합니다.', i),
      (array['open', 'in_progress', 'resolved', 'closed']::ticket_status[])[1 + (i % 4)],
      (array['low', 'normal', 'high', 'urgent']::ticket_priority[])[1 + (i % 4)],
      demo_requester,
      demo_team,
      now() - (i || ' hours')::interval
    );
  end loop;
end $$;
