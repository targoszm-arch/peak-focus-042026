// Peak Focus MCP connector — self-contained Supabase Edge Function.
// Talks to Postgres directly with the service-role key that Supabase
// auto-injects into every edge function (SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY) — no manually-set Function secret required,
// and no hop through the Vercel app, so Vercel's firewall/bot-protection
// can never sit in front of this connector.
//
// Auth: the shared secret lives in the public.app_secrets table (RLS
// enabled, no policies — only the service-role key used by THIS function
// can read it). Compare against a path segment or ?key= query param.
// A bad/missing key returns 403 (never 401 + WWW-Authenticate), so
// MCP clients don't mistake this for an OAuth-protected server and
// attempt (and fail) dynamic client registration.
//
// Setup (see supabase/functions/peak-focus-mcp/README.md for full steps):
//   1. Run the SQL in README.md once (creates app_secrets, stores the key).
//   2. supabase functions deploy peak-focus-mcp --project-ref filtmcykamccfikuxehy --no-verify-jwt
//   3. Add connector in claude.ai with URL:
//      https://filtmcykamccfikuxehy.supabase.co/functions/v1/peak-focus-mcp/<secret>
//
// Change PF_MCP_USER_EMAIL below if this workspace is ever handed to a
// different account.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const PF_MCP_USER_EMAIL = "magda@skillstudio.ai";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

let sb: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!sb) sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  return sb;
}

let cachedSecret: string | null = null;
async function expectedSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const { data, error } = await db().from("app_secrets").select("value").eq("name", "peak_focus_mcp_secret").single();
  if (error || !data) throw new Error("app_secrets row 'peak_focus_mcp_secret' not found — run the setup SQL first");
  cachedSecret = data.value as string;
  return cachedSecret;
}

let cachedUserId: string | null = null;
async function userId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const { data, error } = await db().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`auth lookup failed: ${error.message}`);
  const user = data.users.find((u) => u.email?.toLowerCase() === PF_MCP_USER_EMAIL.toLowerCase());
  if (!user) throw new Error(`no user with email ${PF_MCP_USER_EMAIL}`);
  cachedUserId = user.id;
  return user.id;
}

/* ── helpers (ported from the Vercel connector) ── */

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function resolveDue(due?: string | null): string | null {
  if (!due) return null;
  const t = new Date();
  if (due === "today") return iso(t);
  if (due === "tomorrow") return iso(new Date(t.getTime() + 86400000));
  if (due === "next week") return iso(new Date(t.getTime() + 7 * 86400000));
  return due;
}

async function resolveProjectId(uid: string, project?: string | null): Promise<string | null> {
  if (!project) return null;
  const { data } = await db().from("projects").select("id, name").eq("user_id", uid).ilike("name", `%${project}%`);
  if (data?.length === 1) return data[0].id;
  const exact = data?.find((p) => p.name.toLowerCase() === project.toLowerCase());
  if (exact) return exact.id;
  if (data && data.length > 1) throw new Error(`project "${project}" is ambiguous: ${data.map((p) => p.name).join(", ")}`);
  if (/^[0-9a-f-]{36}$/i.test(project)) return project;
  throw new Error(`no project matching "${project}"`);
}

function textResult(payload: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

/* ── tool catalogue: JSON Schema (not zod) for the MCP tools/list response ── */

const TOOLS = [
  {
    name: "list_tasks",
    description: "List tasks in the Peak Focus workspace. Returns ids you can pass to other tools. Checklist steps appear under their parent task.",
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["today", "overdue", "upcoming", "all"], default: "all", description: "today = due today or overdue; upcoming = due after today" },
        project: { type: "string", description: "filter by project name" },
        include_done: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a task, optionally with a checklist of steps.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        project: { type: "string", description: "project name; omit for Chores" },
        priority: { type: "string", enum: ["high", "medium", "low", "none"], default: "none" },
        due: { type: "string", description: "YYYY-MM-DD, or 'today' | 'tomorrow' | 'next week'" },
        notes: { type: "string" },
        checklist: { type: "array", items: { type: "string" }, description: "step titles" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Update a task's fields (also works for checklist steps by id).",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low", "none"] },
        status: { type: "string", enum: ["todo", "progress", "review", "done"] },
        due: { type: ["string", "null"], description: "YYYY-MM-DD / 'today' / 'tomorrow' / null to clear" },
        project: { type: ["string", "null"], description: "project name, or null to move to Chores" },
        notes: { type: "string" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task (or checklist step) done or not done.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string" }, done: { type: "boolean", default: true } },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task permanently (its checklist steps are deleted with it).",
    inputSchema: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] },
  },
  {
    name: "add_checklist_steps",
    description: "Add checklist steps to an existing task.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "string" }, steps: { type: "array", items: { type: "string" }, minItems: 1 } },
      required: ["task_id", "steps"],
    },
  },
  {
    name: "list_projects",
    description: "List projects with client, due date, status and task progress.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_project",
    description: "Create a project, optionally linked to a client by name.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" }, client: { type: "string" }, due: { type: "string", description: "target date YYYY-MM-DD" } },
      required: ["name"],
    },
  },
  {
    name: "update_project",
    description: "Rename a project or change its due date / status.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "project name or id" },
        name: { type: "string" },
        due: { type: ["string", "null"] },
        status: { type: "string", enum: ["active", "on_hold", "done", "archived"] },
      },
      required: ["project"],
    },
  },
  {
    name: "list_clients",
    description: "List clients with stage, health, ARR and renewal date.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

/* ── tool implementations ── */

const handlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  async list_tasks({ scope = "all", project, include_done = false }) {
    const uid = await userId();
    let q = db().from("tasks").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    if (!include_done) q = q.eq("completed", false);
    const pid = project ? await resolveProjectId(uid, project as string) : null;
    if (pid) q = q.eq("project_id", pid);
    const today = iso(new Date());
    if (scope === "today") q = q.lte("ends_at", today);
    if (scope === "overdue") q = q.lt("ends_at", today);
    if (scope === "upcoming") q = q.gt("ends_at", today);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const { data: projects } = await db().from("projects").select("id, name").eq("user_id", uid);
    const pname = (id: string | null) => projects?.find((p) => p.id === id)?.name ?? "Chores";
    const roots = (data ?? []).filter((t) => !t.parent_id);
    const kids = (data ?? []).filter((t) => t.parent_id);
    return roots.map((t) => ({
      id: t.id,
      title: t.title,
      project: pname(t.project_id),
      priority: t.priority,
      status: t.status,
      due: t.ends_at,
      done: t.completed,
      notes: t.notes || undefined,
      checklist: kids.filter((k) => k.parent_id === t.id).map((k) => ({ id: k.id, title: k.title, done: k.completed })),
    }));
  },

  async create_task({ title, project, priority = "none", due, notes, checklist }) {
    const uid = await userId();
    const pid = await resolveProjectId(uid, (project as string) ?? null);
    const { data, error } = await db()
      .from("tasks")
      .insert({ user_id: uid, title, priority, status: "todo", project_id: pid, ends_at: resolveDue(due as string), notes: notes ?? "" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const steps = (checklist as string[] | undefined) ?? [];
    if (steps.length) {
      const { error: e2 } = await db().from("tasks").insert(
        steps.map((s) => ({ user_id: uid, title: s, priority: "none", status: "todo", project_id: pid, parent_id: data.id }))
      );
      if (e2) throw new Error(e2.message);
    }
    return { created: data.id, title, checklist_steps: steps.length };
  },

  async update_task({ task_id, title, priority, status, due, project, notes }) {
    const uid = await userId();
    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title;
    if (priority !== undefined) patch.priority = priority;
    if (status !== undefined) {
      patch.status = status;
      patch.completed = status === "done";
    }
    if (due !== undefined) patch.ends_at = resolveDue(due as string | null);
    if (project !== undefined) patch.project_id = project === null ? null : await resolveProjectId(uid, project as string);
    if (notes !== undefined) patch.notes = notes;
    const { error } = await db().from("tasks").update(patch).eq("id", task_id).eq("user_id", uid);
    if (error) throw new Error(error.message);
    return { updated: task_id, fields: Object.keys(patch) };
  },

  async complete_task({ task_id, done = true }) {
    const uid = await userId();
    const { error } = await db().from("tasks").update({ completed: done, status: done ? "done" : "todo" }).eq("id", task_id).eq("user_id", uid);
    if (error) throw new Error(error.message);
    return { [done ? "completed" : "reopened"]: task_id };
  },

  async delete_task({ task_id }) {
    const uid = await userId();
    const { error } = await db().from("tasks").delete().eq("id", task_id).eq("user_id", uid);
    if (error) throw new Error(error.message);
    return { deleted: task_id };
  },

  async add_checklist_steps({ task_id, steps }) {
    const uid = await userId();
    const { data: parent, error: e1 } = await db().from("tasks").select("id, project_id").eq("id", task_id).eq("user_id", uid).single();
    if (e1 || !parent) throw new Error("task not found");
    const { error } = await db().from("tasks").insert(
      (steps as string[]).map((s) => ({ user_id: uid, title: s, priority: "none", status: "todo", project_id: parent.project_id, parent_id: parent.id }))
    );
    if (error) throw new Error(error.message);
    return { task_id, added: (steps as string[]).length };
  },

  async list_projects() {
    const uid = await userId();
    const [{ data: projects, error }, { data: tasks }, { data: clients }] = await Promise.all([
      db().from("projects").select("*").eq("user_id", uid).order("created_at"),
      db().from("tasks").select("id, project_id, completed, parent_id").eq("user_id", uid),
      db().from("clients").select("id, name").eq("user_id", uid),
    ]);
    if (error) throw new Error(error.message);
    return (projects ?? []).map((p) => {
      const list = (tasks ?? []).filter((t) => t.project_id === p.id && !t.parent_id);
      return {
        id: p.id,
        name: p.name,
        client: clients?.find((c) => c.id === p.client_id)?.name ?? null,
        due: p.due,
        status: p.status,
        tasks_done: list.filter((t) => t.completed).length,
        tasks_total: list.length,
      };
    });
  },

  async create_project({ name, client, due }) {
    const uid = await userId();
    let clientId: string | null = null;
    if (client) {
      const { data } = await db().from("clients").select("id, name").eq("user_id", uid).ilike("name", `%${client}%`);
      if (!data?.length) throw new Error(`no client matching "${client}"`);
      if (data.length > 1) throw new Error(`client "${client}" is ambiguous: ${data.map((c) => c.name).join(", ")}`);
      clientId = data[0].id;
    }
    const { data, error } = await db()
      .from("projects")
      .insert({ user_id: uid, name, client_id: clientId, due: due ?? null, status: "active" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { created: data.id, name };
  },

  async update_project({ project, name, due, status }) {
    const uid = await userId();
    const pid = await resolveProjectId(uid, project as string);
    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (due !== undefined) patch.due = due;
    if (status !== undefined) patch.status = status;
    const { error } = await db().from("projects").update(patch).eq("id", pid!).eq("user_id", uid);
    if (error) throw new Error(error.message);
    return { updated: pid, fields: Object.keys(patch) };
  },

  async list_clients() {
    const uid = await userId();
    const { data, error } = await db()
      .from("clients")
      .select("id, name, stage, health, arr, renewal, contact_name, email")
      .eq("user_id", uid)
      .order("created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

/* ── MCP JSON-RPC 2.0 over plain HTTP (Streamable HTTP, non-SSE) ── */

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, mcp-session-id",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

async function handleRpc(msg: { jsonrpc: string; id?: unknown; method: string; params?: Record<string, unknown> }) {
  const isNotification = msg.id === undefined;
  try {
    if (msg.method === "initialize") {
      return { jsonrpc: "2.0", id: msg.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "peak-focus", version: "1.0.0" } } };
    }
    if (msg.method === "notifications/initialized" || msg.method.startsWith("notifications/")) {
      return isNotification ? null : { jsonrpc: "2.0", id: msg.id, result: {} };
    }
    if (msg.method === "tools/list") {
      return { jsonrpc: "2.0", id: msg.id, result: { tools: TOOLS } };
    }
    if (msg.method === "tools/call") {
      const name = msg.params?.name as string;
      const args = (msg.params?.arguments as Record<string, unknown>) ?? {};
      const handler = handlers[name];
      if (!handler) return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `unknown tool: ${name}` } };
      try {
        const result = await handler(args);
        return { jsonrpc: "2.0", id: msg.id, result: textResult(result) };
      } catch (e) {
        return { jsonrpc: "2.0", id: msg.id, result: { content: [{ type: "text", text: `Error: ${(e as Error).message}` }], isError: true } };
      }
    }
    return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `unknown method: ${msg.method}` } };
  } catch (e) {
    return { jsonrpc: "2.0", id: msg.id, error: { code: -32000, message: (e as Error).message } };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET") return new Response("method not allowed", { status: 405, headers: CORS });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: CORS });

  // Secret from the trailing path segment (…/peak-focus-mcp/<secret>) or ?key=.
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const pathKey = parts[parts.indexOf("peak-focus-mcp") + 1];
  const key = pathKey || url.searchParams.get("key");

  let expected: string;
  try {
    expected = await expectedSecret();
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
  }
  // 403, never 401 — a 401 makes MCP clients attempt (and fail) OAuth discovery.
  if (key !== expected) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...CORS, "content-type": "application/json" } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "parse error" } }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });
  }

  const messages = Array.isArray(body) ? body : [body];
  const results = await Promise.all(messages.map((m) => handleRpc(m as Parameters<typeof handleRpc>[0])));
  const responses = results.filter((r) => r !== null);

  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS });
  const payload = Array.isArray(body) ? responses : responses[0];
  return new Response(JSON.stringify(payload), { status: 200, headers: { ...CORS, "content-type": "application/json" } });
});
