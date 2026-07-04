# Peak Focus MCP connector

A remote MCP server served by the app itself at `/api/mcp`. Add it to
claude.ai as a **custom connector** and Claude can manage your workspace:
list/create/update/complete/delete tasks (including execution-checklist
steps), manage projects, and read clients.

## One-time setup

1. **Vercel → Project → Settings → Environment Variables** (all three for
   Production; never expose them client-side, so no `VITE_` prefix):
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings →
     API → `service_role` key
   - `PF_MCP_SECRET` — a long random string (e.g. `openssl rand -hex 24`).
     This is the connector's password; anyone with it can manage your data.
   - `PF_MCP_USER_EMAIL` — the account whose workspace Claude manages,
     e.g. `magda@skillstudio.ai`
2. **Redeploy** so the function picks up the env vars.
3. **claude.ai → Settings → Connectors → Add custom connector**, URL:

   ```
   https://peak-focus.net/api/mcp?key=<PF_MCP_SECRET>
   ```

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
