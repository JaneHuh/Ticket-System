-- Ticket status / priority enums
create type ticket_status   as enum ('open', 'in_progress', 'on_hold', 'resolved', 'closed', 'reopened');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');

-- 공용 유틸리티: updated_at 자동 갱신
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table tickets (
  id           uuid primary key default gen_random_uuid(),
  ticket_no    bigserial unique,
  title        text not null check (char_length(title) between 1 and 200),
  body         text not null check (char_length(body) between 1 and 10000),
  status       ticket_status   not null default 'open',
  priority     ticket_priority not null default 'normal',
  requester_id uuid not null references profiles(id),
  assignee_id  uuid references profiles(id),
  team_id      uuid references teams(id),
  due_at       timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index tickets_status_created_idx on tickets (status, created_at desc);
create index tickets_assignee_open_idx on tickets (assignee_id) where status <> 'closed';
create index tickets_requester_idx on tickets (requester_id);
create index tickets_team_idx on tickets (team_id);

create trigger tickets_set_updated_at
  before update on tickets
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 상태 전이 강제 (DB 레벨). 애플리케이션 코드만으로는 다른 경로로 우회할 수 있으므로
-- 트리거에서 허용된 전이만 통과시킨다.
-- ---------------------------------------------------------------------------
create or replace function enforce_ticket_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'open'        and new.status in ('in_progress', 'on_hold'))
    or (old.status = 'in_progress' and new.status in ('on_hold', 'resolved'))
    or (old.status = 'on_hold'     and new.status in ('in_progress'))
    or (old.status = 'resolved'    and new.status in ('closed', 'reopened'))
    or (old.status = 'closed'      and new.status in ('reopened'))
    or (old.status = 'reopened'    and new.status in ('in_progress'))
  ) then
    raise exception '허용되지 않은 상태 전이입니다: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$;

create trigger tickets_status_transition
  before update of status on tickets
  for each row
  execute function enforce_ticket_status_transition();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table tickets enable row level security;

-- 조회: 본인 요청 / 배정된 것 / 같은 팀 / admin
create policy "tickets_select" on tickets for select
  to authenticated
  using (
    requester_id = auth.uid()
    or assignee_id = auth.uid()
    or team_id = (select team_id from profiles where id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 등록: 로그인 사용자 본인 명의로만
create policy "tickets_insert" on tickets for insert
  to authenticated
  with check (requester_id = auth.uid());

-- 수정: 담당자 또는 admin. 요청자는 본인 티켓의 title/body만 수정 가능(별도 정책)
create policy "tickets_update_assignee_admin" on tickets for update
  to authenticated
  using (
    assignee_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    assignee_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "tickets_update_requester_own" on tickets for update
  to authenticated
  using (requester_id = auth.uid())
  with check (requester_id = auth.uid());

-- 요청자가 status/assignee_id/team_id를 직접 바꾸지 못하도록 트리거로 강제
create or replace function prevent_requester_field_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_privileged boolean;
begin
  select exists(
    select 1 from profiles
    where id = auth.uid()
      and (id = new.assignee_id or role = 'admin')
  ) into is_privileged;

  if not is_privileged then
    if new.status is distinct from old.status
      or new.assignee_id is distinct from old.assignee_id
      or new.team_id is distinct from old.team_id
      or new.requester_id is distinct from old.requester_id
    then
      raise exception '요청자는 status/assignee_id/team_id/requester_id를 변경할 수 없습니다';
    end if;
  end if;

  return new;
end;
$$;

create trigger tickets_before_update_guard
  before update on tickets
  for each row
  execute function prevent_requester_field_tampering();

-- 삭제는 admin만 (데이터 보존 원칙 — 실무에서는 closed 처리로 대체 권장)
create policy "tickets_delete_admin" on tickets for delete
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
