-- ---------------------------------------------------------------------------
-- notifications (인앱 알림)
-- ---------------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  ticket_id   uuid references tickets(id) on delete cascade,
  title       text not null,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc) where read_at is null;

alter table notifications enable row level security;

-- 본인 알림만 조회/수정(읽음 처리) 가능
create policy "notifications_select_own" on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own" on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- insert는 서버(SERVICE_ROLE) 또는 아래 트리거를 통해서만 발생. 클라이언트 insert 정책은 두지 않는다.

-- ---------------------------------------------------------------------------
-- email_logs (R3: 발송 이력. 실패가 티켓 트랜잭션을 롤백시키지 않도록 별도 테이블로 분리)
-- ---------------------------------------------------------------------------
create table email_logs (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid references tickets(id) on delete cascade,
  to_email    text not null,
  template    text not null, -- 'ticket_created' | 'ticket_assigned' | 'status_changed' | 'comment_added' | 'ticket_resolved'
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error       text,
  retry_count int not null default 0,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index email_logs_status_idx on email_logs (status, created_at);

alter table email_logs enable row level security;

-- 일반 사용자 접근 불가. admin만 조회 (발송 이력에는 이메일 주소가 담기므로 최소 공개)
create policy "email_logs_admin_select" on email_logs for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
-- insert/update는 SERVICE_ROLE_KEY로만 수행(서버 전용 Route Handler/Edge Function). 클라이언트 정책은 두지 않는다.

-- ---------------------------------------------------------------------------
-- 티켓 이벤트 발생 시 알림 + 이메일 발송 대기열(email_logs pending) 생성.
-- 실제 발송(Resend 호출)은 서버 사이드 Route Handler가 pending 행을 읽어 처리한다.
-- ---------------------------------------------------------------------------
create or replace function queue_ticket_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_email text;
  assignee_email  text;
begin
  select email into requester_email from profiles where id = new.requester_id;

  if tg_op = 'INSERT' then
    insert into email_logs (ticket_id, to_email, template)
    values (new.id, requester_email, 'ticket_created');
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.assignee_id is distinct from old.assignee_id and new.assignee_id is not null then
      select email into assignee_email from profiles where id = new.assignee_id;
      insert into notifications (user_id, ticket_id, title)
      values (new.assignee_id, new.id, format('티켓 #%s 담당자로 지정되었습니다', new.ticket_no));
      insert into email_logs (ticket_id, to_email, template)
      values (new.id, assignee_email, 'ticket_assigned');
    end if;

    if new.status is distinct from old.status then
      insert into notifications (user_id, ticket_id, title)
      values (new.requester_id, new.id, format('티켓 #%s 상태가 %s(으)로 변경되었습니다', new.ticket_no, new.status));
      insert into email_logs (ticket_id, to_email, template)
      values (new.id, requester_email, case when new.status = 'resolved' then 'ticket_resolved' else 'status_changed' end);
    end if;

    return new;
  end if;

  return new;
end;
$$;

create trigger tickets_after_insert_notify
  after insert on tickets
  for each row
  execute function queue_ticket_notifications();

create trigger tickets_after_update_notify
  after update on tickets
  for each row
  execute function queue_ticket_notifications();

-- 댓글 등록 시 상대방에게 알림 + 메일 대기열 생성 (내부 메모는 제외)
create or replace function queue_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
  recipient_id uuid;
  recipient_email text;
begin
  if new.is_internal then
    return new;
  end if;

  select * into v_ticket from tickets where id = new.ticket_id;

  recipient_id := case when new.author_id = v_ticket.requester_id then v_ticket.assignee_id else v_ticket.requester_id end;

  if recipient_id is null then
    return new;
  end if;

  select email into recipient_email from profiles where id = recipient_id;

  insert into notifications (user_id, ticket_id, title)
  values (recipient_id, v_ticket.id, format('티켓 #%s에 새 댓글이 등록되었습니다', v_ticket.ticket_no));

  insert into email_logs (ticket_id, to_email, template)
  values (v_ticket.id, recipient_email, 'comment_added');

  return new;
end;
$$;

create trigger ticket_comments_after_insert_notify
  after insert on ticket_comments
  for each row
  execute function queue_comment_notification();
