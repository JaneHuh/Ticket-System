-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Enums
create type user_role as enum ('requester', 'agent', 'admin');

-- Teams (처리 조직)
create table teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- Profiles (auth.users 확장)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        user_role not null default 'requester',
  team_id     uuid references teams(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- 조회: 본인 / 같은 팀 / admin
create policy "profiles_select" on profiles for select
  to authenticated
  using (
    id = auth.uid()
    or team_id = (select team_id from profiles where id = auth.uid())
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 수정: 본인의 이름만 (role, team_id는 이 정책으로 변경 불가 — 아래 트리거로 강제)
create policy "profiles_update_self" on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- admin은 모든 프로필을 수정 가능 (role/team 배정 포함)
create policy "profiles_update_admin" on profiles for update
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 권한 상승 방지: 일반 사용자가 자신의 role/team_id를 바꾸지 못하도록 트리거로 강제.
-- (RLS의 with check만으로는 "본인 row의 role 컬럼만" 제한할 수 없기 때문에 트리거가 최종 방어선)
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select exists(select 1 from profiles where id = auth.uid() and role = 'admin') into is_admin;

  if not is_admin then
    if new.role is distinct from old.role then
      raise exception 'role 컬럼은 admin만 변경할 수 있습니다';
    end if;
    if new.team_id is distinct from old.team_id then
      raise exception 'team_id 컬럼은 admin만 변경할 수 있습니다';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_before_update
  before update on profiles
  for each row
  execute function prevent_self_role_escalation();

-- 회원가입 시 profiles 자동 생성. 기본 role은 항상 최소 권한(requester)
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'requester');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Teams RLS (profiles가 존재해야 정책을 정의할 수 있어 이 시점에 활성화)
alter table teams enable row level security;

-- 팀 목록은 로그인한 모든 사용자가 조회 가능 (배정/필터 UI에서 필요)
create policy "teams_select_authenticated" on teams for select
  to authenticated
  using (true);

-- 팀 생성/수정/삭제는 admin 전용
create policy "teams_admin_write" on teams for all
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
