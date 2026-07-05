-- Rich-text (HTML) description for projects.
alter table public.projects add column if not exists description text not null default '';
