-- The "collaborator_select_peers" policy from 0009 embedded a raw
-- self-referential subquery against project_collaborators inside a policy
-- on that same table, which Postgres RLS cannot evaluate ("infinite
-- recursion detected in policy for relation \"project_collaborators\"").
-- Route the same check through the existing SECURITY DEFINER helper
-- (is_project_collaborator, from 0008), which evaluates outside RLS and
-- breaks the recursive cycle.

drop policy if exists "collaborator_select_peers" on public.project_collaborators;

create policy "collaborator_select_peers" on public.project_collaborators for select
  using (status = 'active' and public.is_project_collaborator(project_collaborators.project_id));
