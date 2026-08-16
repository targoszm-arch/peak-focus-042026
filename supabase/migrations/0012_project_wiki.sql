-- Peak Focus — one Notion-style document per project (the "Wiki" card that
-- replaces the old Files/Links panels on the project page). Content is a
-- Tiptap JSON document. Read-only for collaborators, full access for the
-- project owner — same shape as project_links/attachments in 0007/0005.

create table if not exists public.project_wikis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists project_wikis_project_idx on public.project_wikis (project_id);

alter table public.project_wikis enable row level security;

do $$ begin
  create policy "owner_all_project_wikis" on public.project_wikis for all
    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_project_wikis" on public.project_wikis for select
    using (public.is_project_collaborator(project_id));
exception when duplicate_object then null; end $$;
