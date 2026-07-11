-- Peak Focus — bookmarked links on a project.
-- A lightweight list of URLs (with an optional title) shown as thumbnail cards
-- under the Files section on the project page. No storage bucket needed —
-- thumbnails are rendered client-side from the site's favicon.

create table if not exists public.project_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  project_id uuid not null references public.projects on delete cascade,
  url text not null,
  title text default '',
  created_at timestamptz default now()
);
create index if not exists project_links_project_idx on public.project_links (project_id);

alter table public.project_links enable row level security;

do $$ begin
  create policy "owner_all_project_links" on public.project_links for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
