-- Peak Focus — agency features: clients, people (team), project/task board
-- metadata, and time tracking. Run with: supabase db push (or SQL editor).

-- ────────────────────────────────────────────────────────────────────
-- Clients (the "customer" a project belongs to)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  color text not null default '#266DF0',
  website text default '',
  contact_name text default '',
  contact_role text default '',
  email text default '',
  location text default '',
  stage text not null default 'Active',
  health text not null default 'Healthy' check (health in ('Healthy','Watch','At risk')),
  arr integer not null default 0,
  renewal date,
  created_at timestamptz default now()
);
create index if not exists clients_user_idx on public.clients (user_id, created_at);

-- ────────────────────────────────────────────────────────────────────
-- People (team members who can be assigned to tasks)
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  role text default '',
  email text default '',
  team_role text not null default 'User' check (team_role in ('Admin','User','Viewer')),
  color text not null default '#266DF0',
  created_at timestamptz default now()
);
create index if not exists people_user_idx on public.people (user_id, created_at);

-- ────────────────────────────────────────────────────────────────────
-- Project board metadata
-- ────────────────────────────────────────────────────────────────────
alter table public.projects
  add column if not exists client_id uuid references public.clients on delete set null,
  add column if not exists due date,
  add column if not exists status text not null default 'active'
    check (status in ('active','on_hold','done','archived'));
create index if not exists projects_client_idx on public.projects (client_id);

-- ────────────────────────────────────────────────────────────────────
-- Task board metadata (kanban status + tag)
-- ────────────────────────────────────────────────────────────────────
alter table public.tasks
  add column if not exists status text not null default 'todo'
    check (status in ('todo','progress','review','done')),
  add column if not exists tag text default '';

-- Task ↔ person assignment (many-to-many)
create table if not exists public.task_assignees (
  user_id uuid not null references auth.users on delete cascade,
  task_id uuid not null references public.tasks on delete cascade,
  person_id uuid not null references public.people on delete cascade,
  primary key (task_id, person_id)
);
create index if not exists task_assignees_person_idx on public.task_assignees (person_id);

-- ────────────────────────────────────────────────────────────────────
-- Time tracking — a running entry has ended_at is null
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  task_id uuid references public.tasks on delete set null,
  project_id uuid references public.projects on delete set null,
  description text default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists time_entries_user_idx on public.time_entries (user_id, started_at desc);
-- at most one running timer per user
create unique index if not exists time_entries_one_running
  on public.time_entries (user_id) where (ended_at is null);

-- ────────────────────────────────────────────────────────────────────
-- Row-Level Security (owner only)
-- ────────────────────────────────────────────────────────────────────
alter table public.clients enable row level security;
alter table public.people enable row level security;
alter table public.task_assignees enable row level security;
alter table public.time_entries enable row level security;

do $$ begin
  create policy "owner_all_clients" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_people" on public.people for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_task_assignees" on public.task_assignees for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_all_time_entries" on public.time_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
