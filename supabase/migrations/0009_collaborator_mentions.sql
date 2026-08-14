-- Let collaborators see just enough of each other (and the project owner)
-- to @mention them in comments — never anything beyond that.

do $$ begin
  create policy "collaborator_select_peers" on public.project_collaborators for select
    using (
      status = 'active' and exists (
        select 1 from public.project_collaborators me
        where me.project_id = project_collaborators.project_id and me.user_id = auth.uid() and me.status = 'active'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "collaborator_select_owner_profile" on public.profiles for select
    using (
      exists (
        select 1 from public.project_collaborators c
        where c.owner_id = profiles.user_id and c.user_id = auth.uid() and c.status = 'active'
      )
    );
exception when duplicate_object then null; end $$;
