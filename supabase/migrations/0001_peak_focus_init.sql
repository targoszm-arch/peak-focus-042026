-- Peak Focus initial schema
-- Run with: supabase db push   (or paste in Supabase SQL editor)

-- ────────────────────────────────────────────────────────────────────
-- Profiles (mirrors auth.users)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────
-- Projects
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  created_at timestamptz default now()
);
create index if not exists projects_user_idx on public.projects (user_id, created_at);

-- ────────────────────────────────────────────────────────────────────
-- Tasks
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  project_id uuid references public.projects on delete set null,
  title text not null,
  completed boolean not null default false,
  priority text not null default 'none' check (priority in ('high','medium','low','none')),
  created_at timestamptz default now()
);
create index if not exists tasks_user_idx on public.tasks (user_id, created_at desc);
create index if not exists tasks_project_idx on public.tasks (project_id);

-- ────────────────────────────────────────────────────────────────────
-- Habits
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  label text not null,
  emoji text not null default '✨',
  weekly_target int not null default 3 check (weekly_target between 1 and 7),
  builtin boolean not null default false,
  created_at timestamptz default now(),
  unique (user_id, key)
);
create index if not exists habits_user_idx on public.habits (user_id);

-- Daily journal entry — one per user per day
create table if not exists public.daily_entries (
  user_id uuid not null references auth.users on delete cascade,
  entry_date date not null,
  weight_unhappy int not null default 0 check (weight_unhappy between 0 and 5),
  inactivity int not null default 0 check (inactivity between 0 and 5),
  unhealthy int not null default 0 check (unhealthy between 0 and 5),
  mood int check (mood between 0 and 6),
  note text default '',
  primary key (user_id, entry_date)
);

-- Per-habit per-day check
create table if not exists public.habit_logs (
  user_id uuid not null references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  log_date date not null,
  done boolean not null default true,
  primary key (user_id, habit_id, log_date)
);
create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, log_date);

-- ────────────────────────────────────────────────────────────────────
-- Oura connection
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.oura_connections (
  user_id uuid primary key references auth.users on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  oura_user_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cached Oura daily metrics (sleep score, readiness, activity etc.)
create table if not exists public.oura_daily (
  user_id uuid not null references auth.users on delete cascade,
  metric_date date not null,
  readiness_score int,
  sleep_score int,
  activity_score int,
  total_sleep_seconds int,
  resting_heart_rate int,
  hrv_avg int,
  raw jsonb,
  fetched_at timestamptz default now(),
  primary key (user_id, metric_date)
);

-- ────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- ────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.daily_entries enable row level security;
alter table public.habit_logs enable row level security;
alter table public.oura_connections enable row level security;
alter table public.oura_daily enable row level security;

-- Generic "owner only" policies
do $$ begin
  -- profiles
  create policy "owner_select_profiles" on public.profiles for select using (auth.uid() = user_id);
  create policy "owner_update_profiles" on public.profiles for update using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_habits" on public.habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_daily_entries" on public.daily_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_habit_logs" on public.habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- oura_connections: read only by owner; writes happen from edge function with service role
do $$ begin
  create policy "owner_select_oura_conn" on public.oura_connections for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_select_oura_daily" on public.oura_daily for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
