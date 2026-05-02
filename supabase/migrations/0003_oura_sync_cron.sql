-- Daily cron that calls the oura-sync Edge Function for all connected users.
-- Requires: pg_cron, pg_net extensions, and the CRON_SECRET secret matching
-- the value set on the Edge Function.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Drop existing schedule if re-running
do $$
begin
  perform cron.unschedule('oura-sync-daily');
exception when others then null;
end $$;

select cron.schedule(
  'oura-sync-daily',
  '15 6 * * *',  -- 06:15 UTC daily
  $$
  select net.http_post(
    url := 'https://filtmcykamccfikuxehy.supabase.co/functions/v1/oura-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
