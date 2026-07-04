# peak-focus-mcp — self-contained MCP connector

A Supabase Edge Function that IS the MCP server (talks to Postgres directly
via the auto-injected service-role key). No Vercel hop, no manually-set
Function secret to forget — see `index.ts` for the full design rationale.

## One-time setup

**1. Run this once in the Supabase SQL editor** (Peak Focus project →
SQL Editor → New query). It creates a locked-down table for the connector's
shared secret — RLS is enabled with no policies, so only the service-role
key (used server-side by this function) can ever read it:

```sql
create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;

insert into public.app_secrets (name, value)
values ('peak_focus_mcp_secret', '<PASTE_A_LONG_RANDOM_STRING_HERE>')
on conflict (name) do update set value = excluded.value;
```

Generate the random string yourself, e.g. `openssl rand -hex 24` in any
terminal — paste the result in place of the placeholder above. Keep a copy;
you'll need it for the connector URL in step 3.

**2. Deploy the function** (Supabase Dashboard → Edge Functions →
`peak-focus-mcp` → paste the contents of `index.ts` → Deploy — or via CLI
if you have it installed):

```bash
supabase functions deploy peak-focus-mcp --project-ref filtmcykamccfikuxehy --no-verify-jwt
```

**3. claude.ai → Settings → Connectors → Add custom connector**, URL:

```
https://filtmcykamccfikuxehy.supabase.co/functions/v1/peak-focus-mcp/<the random string from step 1>
```

## Notes

- If this workspace is ever handed to a different account, change
  `PF_MCP_USER_EMAIL` at the top of `index.ts` and redeploy.
- To rotate the secret: update the `app_secrets` row (an `update` statement
  with a new value) and update the connector URL in claude.ai. The function
  caches the secret per warm instance, so a stale instance may accept the
  old value for a few minutes after rotation.
- The old two-hop design (a Supabase Edge Function proxying to
  `peak-focus.net/api/mcp`) is retired — it depended on a Function secret
  that was never set, which is what caused the 500s / "couldn't register
  with sign-in service" error this replaces.
