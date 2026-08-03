# assistant-chat — in-app AI assistant

A Supabase Edge Function backing the "Assistant" panel in the app. It runs an
agentic tool-use loop against the Anthropic Messages API (model
`claude-sonnet-5`) so the assistant can read the signed-in user's projects,
tasks, and clients, and directly create/update/complete work for them.

Auth is JWT-only: the browser's Supabase session token (forwarded
automatically by `supabase.functions.invoke`) identifies the caller, and
every query is scoped to that user's own rows — no shared-secret table
needed here (unlike `peak-focus-mcp`, which serves external MCP clients).

## One-time setup

**1. Get an Anthropic API key** from <https://console.anthropic.com/> (this
is separate from claude.ai / Claude Code access — it's billed API usage).

**2. Set it as a Function secret:**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref filtmcykamccfikuxehy
```

(or Supabase Dashboard → Edge Functions → Secrets)

**3. Deploy the function:**

```bash
supabase functions deploy assistant-chat --project-ref filtmcykamccfikuxehy
```

This one keeps JWT verification on (no `--no-verify-jwt`) since it's only
ever called from the logged-in web app, never externally.

## What it can do today

- Read: projects (description, status, due date, client, bookmarked links,
  attachment filenames), tasks (notes, checklist, priority, status,
  assignees), clients.
- Write: create/update/complete/delete tasks and checklist steps,
  create/update projects.
- **Not yet:** reading the actual contents of uploaded file attachments —
  only filename/type/size are visible to it. Adding real text extraction
  (PDF/doc parsing) is a follow-up, not included in this first version.

## Cost note

Each assistant turn is one or more Messages API calls (the loop makes an
extra call per round of tool use, capped at 6 rounds). There's no caching
or rate-limiting built in yet — keep an eye on Anthropic usage if this gets
heavy daily use.
