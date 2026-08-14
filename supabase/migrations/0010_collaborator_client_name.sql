-- A collaborator may see the client record linked to a project they're on
-- (name/color for display) — not the rest of the client roster, and this
-- exposes the same columns the owner already sees, just scoped to one row.
do $$ begin
  create policy "collaborator_select_linked_client" on public.clients for select
    using (
      exists (
        select 1 from public.projects p
        where p.client_id = clients.id and public.is_project_collaborator(p.id)
      )
    );
exception when duplicate_object then null; end $$;
