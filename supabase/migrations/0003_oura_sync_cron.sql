-- Daily cron that calls the oura-sync Edge Function for all connected users.
-- Reads the cron secret from Supabase Vault (must be inserted as
-- vault.secrets where name = 'oura_sync_cron_secret') and the project URL
-- from a vault entry named 'project_url'.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

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
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/oura-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'oura_sync_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
