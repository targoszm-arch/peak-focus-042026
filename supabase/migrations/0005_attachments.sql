-- Peak Focus — file attachments on tasks and projects.
-- Files live in the private "attachments" Storage bucket, under
-- <user_id>/<owner_id>/<filename> so a per-user storage policy is a single
-- path-prefix check. Metadata lives in public.attachments.

-- ────────────────────────────────────────────────────────────────────
-- Storage bucket (private — access only via signed URLs)
-- ────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 26214400) -- 25 MB
on conflict (id) do nothing;

do $$ begin
  create policy "owner_read_attachments" on storage.objects for select
    using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_write_attachments" on storage.objects for insert
    with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_delete_attachments" on storage.objects for delete
    using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────
-- Metadata table
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  task_id uuid references public.tasks on delete cascade,
  project_id uuid references public.projects on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text default '',
  size_bytes bigint not null default 0,
  created_at timestamptz default now(),
  constraint attachments_one_owner check (
    (task_id is not null and project_id is null) or
    (task_id is null and project_id is not null)
  )
);
create index if not exists attachments_task_idx on public.attachments (task_id);
create index if not exists attachments_project_idx on public.attachments (project_id);

alter table public.attachments enable row level security;

do $$ begin
  create policy "owner_all_attachments" on public.attachments for all
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
