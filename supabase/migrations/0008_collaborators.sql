-- Peak Focus — client/team collaborator access, scoped per project.
--
-- A collaborator is an invited email address granted read + comment access
-- to exactly the project(s) they're added to (never anything else — no
-- Clients CRM, no other projects, no write access to project/task fields).
-- All data still lives under the workspace owner's user_id; collaborators
-- never own rows themselves.

-- ────────────────────────────────────────────────────────────────────
-- project_collaborators
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null default 'client' check (role in ('client', 'team')),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (project_id, invited_email)
);
create index if not exists project_collaborators_project_idx on public.project_collaborators (project_id);
create index if not exists project_collaborators_user_idx on public.project_collaborators (user_id);

alter table public.project_collaborators enable row level security;

do $$ begin
  create policy "owner_manage_collaborators" on public.project_collaborators for all
    using (exists (select 1 from public.projects p where p.id = project_collaborators.project_id and p.user_id = auth.uid()))
    with check (exists (select 1 from public.projects p where p.id = project_collaborators.project_id and p.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_own_grant" on public.project_collaborators for select
    using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────
-- Helper: is the caller an active collaborator on this project?
-- SECURITY DEFINER so it can read project_collaborators regardless of the
-- caller's own RLS visibility into that table, avoiding policy recursion.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.is_project_collaborator(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.project_collaborators
    where project_id = p_project_id and user_id = auth.uid() and status = 'active'
  );
$$;
grant execute on function public.is_project_collaborator(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- Invite / revoke RPCs — callable by the project owner only. Looks up an
-- existing auth.users match by email (SECURITY DEFINER can read auth.users)
-- so an invite to an already-registered address activates immediately;
-- otherwise it's linked automatically on that email's first sign-up (see
-- the trigger below).
-- ────────────────────────────────────────────────────────────────────
create or replace function public.invite_collaborator(p_project_id uuid, p_email text, p_role text default 'client')
returns public.project_collaborators
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_matched_user uuid;
  v_row public.project_collaborators;
begin
  select user_id into v_owner from public.projects where id = p_project_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not authorized to invite collaborators on this project';
  end if;
  if p_role not in ('client', 'team') then
    raise exception 'invalid role: %', p_role;
  end if;

  select id into v_matched_user from auth.users where lower(email) = lower(p_email) limit 1;

  insert into public.project_collaborators (project_id, owner_id, invited_email, user_id, role, status, accepted_at)
  values (
    p_project_id, v_owner, lower(p_email), v_matched_user, p_role,
    case when v_matched_user is not null then 'active' else 'pending' end,
    case when v_matched_user is not null then now() else null end
  )
  on conflict (project_id, invited_email) do update
    set role = excluded.role,
        status = excluded.status,
        user_id = excluded.user_id,
        accepted_at = excluded.accepted_at
    where public.project_collaborators.status in ('pending', 'revoked')
  returning * into v_row;

  if v_row.id is null then
    select * into v_row from public.project_collaborators where project_id = p_project_id and invited_email = lower(p_email);
  end if;

  return v_row;
end;
$$;
grant execute on function public.invite_collaborator(uuid, text, text) to authenticated;

create or replace function public.revoke_collaborator(p_collaborator_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select p.user_id into v_owner
  from public.project_collaborators c
  join public.projects p on p.id = c.project_id
  where c.id = p_collaborator_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not authorized';
  end if;
  update public.project_collaborators set status = 'revoked' where id = p_collaborator_id;
end;
$$;
grant execute on function public.revoke_collaborator(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────────
-- Auto-link a pending invite the moment that email signs up.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.link_pending_collaborators()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.project_collaborators
  set user_id = new.id, status = 'active', accepted_at = now()
  where lower(invited_email) = lower(new.email) and status = 'pending';
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_collaborators on auth.users;
create trigger on_auth_user_created_link_collaborators
  after insert on auth.users
  for each row execute function public.link_pending_collaborators();

-- ────────────────────────────────────────────────────────────────────
-- Read access for active collaborators — additive (OR'd) alongside the
-- existing owner_all_* policies, and read-only: no insert/update/delete
-- grants here, so collaborators can never modify projects/tasks/links.
-- ────────────────────────────────────────────────────────────────────
do $$ begin
  create policy "collaborator_select_projects" on public.projects for select
    using (public.is_project_collaborator(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_tasks" on public.tasks for select
    using (project_id is not null and public.is_project_collaborator(project_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_project_links" on public.project_links for select
    using (public.is_project_collaborator(project_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_attachments" on public.attachments for select
    using (
      (project_id is not null and public.is_project_collaborator(project_id))
      or (task_id is not null and exists (
            select 1 from public.tasks t
            where t.id = attachments.task_id and t.project_id is not null and public.is_project_collaborator(t.project_id)
         ))
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_task_assignees" on public.task_assignees for select
    using (
      exists (
        select 1 from public.tasks t
        where t.id = task_assignees.task_id and t.project_id is not null and public.is_project_collaborator(t.project_id)
      )
    );
exception when duplicate_object then null; end $$;

-- People are only exposed for names/avatars on tasks the collaborator can
-- already see (assignee display) — never the full team roster.
do $$ begin
  create policy "collaborator_select_assigned_people" on public.people for select
    using (
      exists (
        select 1 from public.task_assignees ta
        join public.tasks t on t.id = ta.task_id
        where ta.person_id = people.id and t.project_id is not null and public.is_project_collaborator(t.project_id)
      )
    );
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────
-- Storage: let a collaborator read (and get signed URLs for) attachment
-- files that belong to a project they're on. The existing owner policies
-- key off the uploader's own uid in the path prefix, which a collaborator
-- never matches — so this checks the attachments metadata table instead.
-- ────────────────────────────────────────────────────────────────────
create or replace function public.can_read_attachment_object(p_object_name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.attachments a
    where a.storage_path = p_object_name
      and (
        (a.project_id is not null and public.is_project_collaborator(a.project_id))
        or (a.task_id is not null and exists (
              select 1 from public.tasks t
              where t.id = a.task_id and t.project_id is not null and public.is_project_collaborator(t.project_id)
           ))
      )
  );
$$;
grant execute on function public.can_read_attachment_object(text) to authenticated;

do $$ begin
  create policy "collaborator_read_attachments" on storage.objects for select
    using (bucket_id = 'attachments' and public.can_read_attachment_object(name));
exception when duplicate_object then null; end $$;

-- ────────────────────────────────────────────────────────────────────
-- Comments — project-level (task_id null) or task-level threads, visible
-- to the owner and any active collaborator on that project, postable by
-- the same set, deletable by their author or the owner.
-- ────────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists comments_project_idx on public.comments (project_id);
create index if not exists comments_task_idx on public.comments (task_id);

alter table public.comments enable row level security;

do $$ begin
  create policy "owner_select_comments" on public.comments for select
    using (exists (select 1 from public.projects p where p.id = comments.project_id and p.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_comments" on public.comments for select
    using (public.is_project_collaborator(comments.project_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_insert_comments" on public.comments for insert
    with check (author_id = auth.uid() and exists (select 1 from public.projects p where p.id = comments.project_id and p.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_insert_comments" on public.comments for insert
    with check (author_id = auth.uid() and public.is_project_collaborator(comments.project_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "author_delete_own_comments" on public.comments for delete
    using (author_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "owner_delete_any_comment" on public.comments for delete
    using (exists (select 1 from public.projects p where p.id = comments.project_id and p.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
