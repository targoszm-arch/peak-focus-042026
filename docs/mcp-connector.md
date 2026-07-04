# Peak Focus MCP connector

Two implementations exist. **Use the Supabase one** — it's the recommended,
currently-supported path.

## Recommended: Supabase Edge Function (self-contained)

`supabase/functions/peak-focus-mcp/` — talks to Postgres directly with the
auto-injected service-role key. No Vercel hop (so Vercel's firewall/bot
protection can never block it), no Function secret to remember to set (the
shared secret lives in a locked-down database table instead). Setup steps:
**`supabase/functions/peak-focus-mcp/README.md`**.

Connector URL:
```
https://filtmcykamccfikuxehy.supabase.co/functions/v1/peak-focus-mcp/<secret>
```

## Legacy: Vercel route (`/api/mcp`)

Kept for reference; not recommended as the primary connector because Vercel's
Firewall/bot protection can 403-challenge the MCP client before it ever
reaches the function (workaround: add a custom Firewall rule "path starts
with `/api/mcp` → Bypass"). A Supabase Edge Function was previously used to
proxy around that, but it depended on a Function secret (`PEAK_FOCUS_MCP_KEY`)
that was never set, which is what caused persistent 500s and a
"couldn't register with sign-in service" error when adding the connector —
the Supabase implementation above removes that whole failure mode.

1. **Vercel → Project → Settings → Environment Variables** (all three for
   Production; never expose them client-side, so no `VITE_` prefix):
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings →
     API → `service_role` key
   - `PF_MCP_SECRET` — a long random string (e.g. `openssl rand -hex 24`).
     This is the connector's password; anyone with it can manage your data.
   - `PF_MCP_USER_EMAIL` — the account whose workspace Claude manages,
     e.g. `magda@skillstudio.ai`
2. **Redeploy** so the function picks up the env vars.
3. **claude.ai → Settings → Connectors → Add custom connector**, URL (secret
   as a path segment — more reliable than a query param):

   ```
   https://peak-focus.net/api/mcp/<PF_MCP_SECRET>
   ```

   (`…/api/mcp?key=<PF_MCP_SECRET>` also works.)


## MCP write-call fallback

Some ChatGPT Projects or custom GPT-style conversations can connect to a
Developer MCP but fail at execution time with `FORBIDDEN: This conversation
does not support developer MCPs`. That is a ChatGPT conversation capability
issue, not a Peak Focus API authorization error. If recreating the chat or
Project is not practical, use the admin-only HTTP fallback for bulk due-date
patches:

```bash
curl -X POST "https://peak-focus.net/api/task-due-date-patch?key=<PF_MCP_SECRET>" \
  -H "content-type: application/json" \
  -d '{
    "dryRun": true,
    "dueDates": {
      "PBBT-1": "2026-07-10",
      "PBBT-2": "2026-07-17"
    }
  }'
```

Set `dryRun` to `false` after confirming the matched task titles. The endpoint
uses the same service-role credentials and `PF_MCP_SECRET` as the MCP connector,
scopes every update to `PF_MCP_USER_EMAIL`, and matches Linear keys such as
`PBBT-1` in task titles or notes. Omit issue keys that have no Linear due date
so those Peak Focus tasks stay blank.

## What Claude can then do

- "What's due today?" / "What's overdue in Brilliancy Health?"
- "Add a task 'Send invoice' to Brilliancy Health, high priority, due tomorrow,
  with steps: draft, review, send."
- "Mark the data-room task done." / "Move it to review."
- "Create a project Website Refresh for Acme, target end of month."
- "List my clients and their renewals."

Tools: `list_tasks`, `create_task`, `update_task`, `complete_task`,
`delete_task`, `add_checklist_steps`, `list_projects`, `create_project`,
`update_project`, `list_clients`.

## Security notes

- The endpoint returns 401 without the secret, and 503 until the env vars
  are configured — deploying this code before configuration is safe.
- The service-role key never leaves the server; every query is scoped to
  the `PF_MCP_USER_EMAIL` account's rows.
- Rotate `PF_MCP_SECRET` in Vercel (and update the connector URL) if the
  URL ever leaks — it carries full workspace access.
