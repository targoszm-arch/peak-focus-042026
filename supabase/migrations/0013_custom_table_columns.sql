-- Peak Focus — user-defined custom columns for the Tasks/Projects table
-- views (the ported editable-react-table). Column *definitions* live here;
-- each row's values for them live in the new custom_fields jsonb column on
-- tasks/projects, keyed by custom_columns.id.

create table if not exists public.custom_columns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('tasks', 'projects')),
  label text not null default 'Column',
  data_type text not null default 'text' check (data_type in ('text', 'number', 'select')),
  options jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists custom_columns_owner_scope_idx on public.custom_columns (owner_id, scope);

alter table public.custom_columns enable row level security;

do $$ begin
  create policy "owner_all_custom_columns" on public.custom_columns for all
    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

-- Column definitions aren't row data — collaborators just need to know
-- the schema to render the (read-only) table on projects they can see.
do $$ begin
  create policy "collaborator_select_custom_columns" on public.custom_columns for select
    using (
      exists (
        select 1 from public.project_collaborators c
        where c.owner_id = custom_columns.owner_id and c.user_id = auth.uid() and c.status = 'active'
      )
    );
exception when duplicate_object then null; end $$;

alter table public.tasks add column if not exists custom_fields jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists custom_fields jsonb not null default '{}'::jsonb;
