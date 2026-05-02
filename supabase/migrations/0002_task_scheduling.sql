-- Adds scheduling, subtasks, and notes to tasks.
-- Run in Supabase SQL editor.

alter table public.tasks
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists time_of_day text check (time_of_day in ('anytime','morning','afternoon','evening','at_time')) default 'anytime',
  add column if not exists repeat text check (repeat in ('none','daily','weekdays','weekly','monthly')) default 'none',
  add column if not exists notes text default '',
  add column if not exists parent_id uuid references public.tasks(id) on delete cascade;

create index if not exists tasks_parent_idx on public.tasks (parent_id);
create index if not exists tasks_starts_idx on public.tasks (user_id, starts_at);

-- Completed-at tracking so we can render "Completed tasks" lists per day
alter table public.tasks add column if not exists completed_at timestamptz;

create or replace function public.touch_completed_at()
returns trigger language plpgsql as $$
begin
  if new.completed and (old.completed is distinct from new.completed) then
    new.completed_at := now();
  elsif not new.completed then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_touch_completed_at on public.tasks;
create trigger tasks_touch_completed_at
before update on public.tasks
for each row execute function public.touch_completed_at();
