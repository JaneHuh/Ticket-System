-- R2: 검색. 3년 누적 약 1,800행 규모 → 외부 검색엔진 없이 PostgreSQL 내장 기능으로 충분.
-- pg_trgm은 20260101000000 마이그레이션에서 이미 활성화됨.

alter table tickets add column search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored;

create index tickets_search_idx on tickets using gin (search_vector);
create index tickets_title_trgm_idx on tickets using gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- security invoker: 호출자 권한으로 실행되어 RLS가 그대로 적용된다.
-- ⚠️ 이 함수를 security definer로 바꾸면 RLS가 우회되어 전체 티켓이 검색으로 노출된다.
--    변경 시 반드시 사전 승인을 받는다 (CLAUDE.md 규칙 참조).
-- ---------------------------------------------------------------------------
create or replace function search_tickets(
  keyword text default null,
  p_status ticket_status default null,
  p_priority ticket_priority default null,
  p_assignee uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit int default 20,
  p_offset int default 0
)
returns setof tickets
language sql
security invoker
stable
as $$
  select *
  from tickets
  where (
      keyword is null
      or search_vector @@ plainto_tsquery('simple', keyword)
      or title ilike '%' || keyword || '%'
    )
    and (p_status   is null or status = p_status)
    and (p_priority is null or priority = p_priority)
    and (p_assignee is null or assignee_id = p_assignee)
    and (p_from is null or created_at >= p_from)
    and (p_to   is null or created_at <= p_to)
  order by created_at desc
  limit least(coalesce(p_limit, 20), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;
