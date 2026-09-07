-- ---------------------------------------------------------------------------
-- ticket_comments (R4 대체: 실시간 채팅 대신 일반 CRUD 댓글)
-- ---------------------------------------------------------------------------
create table ticket_comments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  author_id    uuid not null references profiles(id),
  body         text not null check (char_length(body) between 1 and 5000),
  is_internal  boolean not null default false, -- 내부 메모: 요청자에게 노출/발송되지 않음
  created_at   timestamptz not null default now()
);

create index ticket_comments_ticket_idx on ticket_comments (ticket_id, created_at);

alter table ticket_comments enable row level security;

-- 조회: 해당 티켓을 볼 수 있는 사용자만. 단, 내부 메모는 requester에게 숨긴다.
create policy "ticket_comments_select" on ticket_comments for select
  to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          t.assignee_id = auth.uid()
          or t.team_id = (select team_id from profiles where id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
          or (t.requester_id = auth.uid() and ticket_comments.is_internal = false)
        )
    )
  );

-- 작성: 해당 티켓 조회 권한이 있는 사람만, 본인 명의로만. 요청자는 내부 메모 작성 불가.
create policy "ticket_comments_insert" on ticket_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_comments.ticket_id
        and (
          t.requester_id = auth.uid()
          or t.assignee_id = auth.uid()
          or t.team_id = (select team_id from profiles where id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        )
    )
    and (
      is_internal = false
      or exists (
        select 1 from tickets t
        where t.id = ticket_comments.ticket_id
          and t.requester_id <> auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- ticket_attachments (메타데이터만. 실제 파일은 Supabase Storage)
-- ---------------------------------------------------------------------------
create table ticket_attachments (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  uploader_id  uuid not null references profiles(id),
  storage_path text not null,
  file_name    text not null,
  file_size    bigint not null check (file_size > 0 and file_size <= 10 * 1024 * 1024),
  content_type text not null,
  created_at   timestamptz not null default now()
);

create index ticket_attachments_ticket_idx on ticket_attachments (ticket_id);

alter table ticket_attachments enable row level security;

create policy "ticket_attachments_select" on ticket_attachments for select
  to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          t.requester_id = auth.uid()
          or t.assignee_id = auth.uid()
          or t.team_id = (select team_id from profiles where id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        )
    )
  );

create policy "ticket_attachments_insert" on ticket_attachments for insert
  to authenticated
  with check (
    uploader_id = auth.uid()
    and exists (
      select 1 from tickets t
      where t.id = ticket_attachments.ticket_id
        and (
          t.requester_id = auth.uid()
          or t.assignee_id = auth.uid()
          or t.team_id = (select team_id from profiles where id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        )
    )
  );

create policy "ticket_attachments_delete" on ticket_attachments for delete
  to authenticated
  using (
    uploader_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- ticket_history (상태·담당자 변경 감사 추적 — 애플리케이션이 아닌 트리거로 기록)
-- ---------------------------------------------------------------------------
create table ticket_history (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  actor_id     uuid references profiles(id),
  field        text not null,       -- 'status' | 'assignee_id' | 'priority' | 'team_id'
  old_value    text,
  new_value    text,
  created_at   timestamptz not null default now()
);

create index ticket_history_ticket_idx on ticket_history (ticket_id, created_at);

alter table ticket_history enable row level security;

create policy "ticket_history_select" on ticket_history for select
  to authenticated
  using (
    exists (
      select 1 from tickets t
      where t.id = ticket_history.ticket_id
        and (
          t.requester_id = auth.uid()
          or t.assignee_id = auth.uid()
          or t.team_id = (select team_id from profiles where id = auth.uid())
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
        )
    )
  );
-- insert는 아래 트리거(security definer)를 통해서만 발생. 직접 insert 정책은 만들지 않는다.

create or replace function record_ticket_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into ticket_history (ticket_id, actor_id, field, old_value, new_value)
    values (new.id, auth.uid(), 'status', old.status::text, new.status::text);
  end if;

  if new.assignee_id is distinct from old.assignee_id then
    insert into ticket_history (ticket_id, actor_id, field, old_value, new_value)
    values (new.id, auth.uid(), 'assignee_id', old.assignee_id::text, new.assignee_id::text);
  end if;

  if new.priority is distinct from old.priority then
    insert into ticket_history (ticket_id, actor_id, field, old_value, new_value)
    values (new.id, auth.uid(), 'priority', old.priority::text, new.priority::text);
  end if;

  if new.team_id is distinct from old.team_id then
    insert into ticket_history (ticket_id, actor_id, field, old_value, new_value)
    values (new.id, auth.uid(), 'team_id', old.team_id::text, new.team_id::text);
  end if;

  return new;
end;
$$;

create trigger tickets_after_update_history
  after update on tickets
  for each row
  execute function record_ticket_history();
