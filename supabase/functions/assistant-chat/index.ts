// Peak Focus AI assistant — Supabase Edge Function.
//
// Runs an agentic tool-use loop against the Anthropic Messages API so the
// in-app assistant can read a user's projects/tasks/clients and directly
// create, update, or complete work on their behalf.
//
// Auth: JWT-only. The calling user's Supabase session token (forwarded
// automatically by `supabase.functions.invoke` from the browser) identifies
// which user's data to read/write — every query is scoped `.eq("user_id", uid)`.
//
// Required secret (set via `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
// or the Supabase Dashboard → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY
//
// Deploy:
//   supabase functions deploy assistant-chat --project-ref filtmcykamccfikuxehy

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_MODEL = "claude-sonnet-5";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOOL_ROUNDS = 6;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

/* ── helpers (ported from peak-focus-mcp) ── */

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

async function resolveProjectId(db: SupabaseClient, uid: string, project?: string | null): Promise<string | null> {
  if (!project) return null;
  if (/^[0-9a-f-]{36}$/i.test(project)) return project;
  const { data } = await db.from("projects").select("id, name").eq("user_id", uid).ilike("name", `%${project}%`);
  const exact = data?.find((p) => p.name.toLowerCase() === project.toLowerCase());
  if (exact) return exact.id;
  if (data?.length === 1) return data[0].id;
  if (data && data.length > 1) throw new Error(`project "${project}" is ambiguous: ${data.map((p) => p.name).join(", ")}`);
  throw new Error(`no project matching "${project}"`);
}

/* ── tool catalogue (Anthropic tool-use schema) ── */

const TOOLS = [
  {
    name: "list_projects",
    description: "List all projects with client, due date, status and task progress. Use this first when the user refers to 'a project' by name without giving its id.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_project",
    description: "Full context for one project: description, client, status, due date, bookmarked links, attachment filenames (contents are not readable yet), and every task with its checklist and assignees. Use this before planning work in a specific project.",
    input_schema: {
      type: "object",
      properties: { project: { type: "string", description: "project name or id" } },
      required: ["project"],
    },
  },
  {
    name: "list_tasks",
    description: "List tasks across the whole workspace (or one project). Returns ids you can pass to other tools. Checklist steps appear nested under their parent task.",
    input_schema: {
      type: "object",
      properties: {
        scope: { type: "string", enum: ["today", "overdue", "upcoming", "all"], default: "all", description: "today = due today or overdue; upcoming = due after today" },
        project: { type: "string", description: "filter by project name or id" },
        include_done: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "create_task",
    description: "Create a task, optionally with a checklist of steps.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        project: { type: "string", description: "project name or id; omit for Chores" },
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
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        title: { type: "string" },
        priority: { type: "string", enum: ["high", "medium", "low", "none"] },
        status: { type: "string", enum: ["todo", "progress", "review", "done"] },
        due: { type: ["string", "null"], description: "YYYY-MM-DD / 'today' / 'tomorrow' / null to clear" },
        project: { type: ["string", "null"], description: "project name or id, or null to move to Chores" },
        notes: { type: "string" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task (or checklist step) done or not done.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" }, done: { type: "boolean", default: true } },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task permanently (its checklist steps are deleted with it). Only do this when the user clearly asked to remove/delete it.",
    input_schema: { type: "object", properties: { task_id: { type: "string" } }, required: ["task_id"] },
  },
  {
    name: "add_checklist_steps",
    description: "Add checklist steps to an existing task.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" }, steps: { type: "array", items: { type: "string" }, minItems: 1 } },
      required: ["task_id", "steps"],
    },
  },
  {
    name: "create_project",
    description: "Create a project, optionally linked to a client by name.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" }, client: { type: "string" }, due: { type: "string", description: "target date YYYY-MM-DD" } },
      required: ["name"],
    },
  },
  {
    name: "update_project",
    description: "Rename a project, or change its due date, status, or description.",
    input_schema: {
      type: "object",
      properties: {
        project: { type: "string", description: "project name or id" },
        name: { type: "string" },
        due: { type: ["string", "null"] },
        status: { type: "string", enum: ["active", "on_hold", "done", "archived"] },
        description: { type: "string", description: "plain text or simple HTML" },
      },
      required: ["project"],
    },
  },
  {
    name: "list_clients",
    description: "List clients with stage, health, ARR and renewal date.",
    input_schema: { type: "object", properties: {} },
  },
] as const;

/* ── tool implementations — `db` is a service-role client, `uid` is the caller ── */

function makeHandlers(db: SupabaseClient, uid: string): Record<string, (args: Record<string, unknown>) => Promise<unknown>> {
  return {
    async list_projects() {
      const [{ data: projects, error }, { data: tasks }, { data: clients }] = await Promise.all([
        db.from("projects").select("*").eq("user_id", uid).order("created_at"),
        db.from("tasks").select("id, project_id, completed, parent_id").eq("user_id", uid),
        db.from("clients").select("id, name").eq("user_id", uid),
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

    async get_project({ project }) {
      const pid = await resolveProjectId(db, uid, project as string);
      if (!pid) throw new Error("project not found");
      const [{ data: p, error }, { data: tasks }, { data: links }, { data: attachments }, { data: people }] = await Promise.all([
        db.from("projects").select("*").eq("id", pid).eq("user_id", uid).single(),
        db.from("tasks").select("*").eq("user_id", uid).eq("project_id", pid),
        db.from("project_links").select("url, title").eq("user_id", uid).eq("project_id", pid),
        db.from("attachments").select("file_name, mime_type, size_bytes").eq("user_id", uid).eq("project_id", pid),
        db.from("people").select("id, name").eq("user_id", uid),
      ]);
      if (error || !p) throw new Error("project not found");
      let client: unknown = null;
      if (p.client_id) {
        const { data: c } = await db.from("clients").select("*").eq("id", p.client_id).eq("user_id", uid).single();
        client = c ?? null;
      }
      const { data: assignees } = await db.from("task_assignees").select("task_id, person_id").eq("user_id", uid);
      const pname = (id: string) => people?.find((pp) => pp.id === id)?.name ?? id;
      const roots = (tasks ?? []).filter((t) => !t.parent_id);
      const kids = (tasks ?? []).filter((t) => t.parent_id);
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        due: p.due,
        description: p.description || undefined,
        client,
        links: links ?? [],
        attachments: (attachments ?? []).map((a) => ({ ...a, note: "filename/metadata only — contents cannot be read yet" })),
        tasks: roots.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          due: t.ends_at,
          done: t.completed,
          notes: t.notes || undefined,
          assignees: (assignees ?? []).filter((a) => a.task_id === t.id).map((a) => pname(a.person_id)),
          checklist: kids.filter((k) => k.parent_id === t.id).map((k) => ({ id: k.id, title: k.title, done: k.completed })),
        })),
      };
    },

    async list_tasks({ scope = "all", project, include_done = false }) {
      let q = db.from("tasks").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      if (!include_done) q = q.eq("completed", false);
      const pid = project ? await resolveProjectId(db, uid, project as string) : null;
      if (pid) q = q.eq("project_id", pid);
      const today = iso(new Date());
      if (scope === "today") q = q.lte("ends_at", today);
      if (scope === "overdue") q = q.lt("ends_at", today);
      if (scope === "upcoming") q = q.gt("ends_at", today);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const { data: projects } = await db.from("projects").select("id, name").eq("user_id", uid);
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
      const pid = await resolveProjectId(db, uid, (project as string) ?? null);
      const { data, error } = await db
        .from("tasks")
        .insert({ user_id: uid, title, priority, status: "todo", project_id: pid, ends_at: resolveDue(due as string), notes: notes ?? "" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      const steps = (checklist as string[] | undefined) ?? [];
      if (steps.length) {
        const { error: e2 } = await db
          .from("tasks")
          .insert(steps.map((s) => ({ user_id: uid, title: s, priority: "none", status: "todo", project_id: pid, parent_id: data.id })));
        if (e2) throw new Error(e2.message);
      }
      return { created: data.id, title, checklist_steps: steps.length };
    },

    async update_task({ task_id, title, priority, status, due, project, notes }) {
      const patch: Record<string, unknown> = {};
      if (title !== undefined) patch.title = title;
      if (priority !== undefined) patch.priority = priority;
      if (status !== undefined) {
        patch.status = status;
        patch.completed = status === "done";
      }
      if (due !== undefined) patch.ends_at = resolveDue(due as string | null);
      if (project !== undefined) patch.project_id = project === null ? null : await resolveProjectId(db, uid, project as string);
      if (notes !== undefined) patch.notes = notes;
      const { error } = await db.from("tasks").update(patch).eq("id", task_id).eq("user_id", uid);
      if (error) throw new Error(error.message);
      return { updated: task_id, fields: Object.keys(patch) };
    },

    async complete_task({ task_id, done = true }) {
      const { error } = await db.from("tasks").update({ completed: done, status: done ? "done" : "todo" }).eq("id", task_id).eq("user_id", uid);
      if (error) throw new Error(error.message);
      return { [done ? "completed" : "reopened"]: task_id };
    },

    async delete_task({ task_id }) {
      const { error } = await db.from("tasks").delete().eq("id", task_id).eq("user_id", uid);
      if (error) throw new Error(error.message);
      return { deleted: task_id };
    },

    async add_checklist_steps({ task_id, steps }) {
      const { data: parent, error: e1 } = await db.from("tasks").select("id, project_id").eq("id", task_id).eq("user_id", uid).single();
      if (e1 || !parent) throw new Error("task not found");
      const { error } = await db
        .from("tasks")
        .insert((steps as string[]).map((s) => ({ user_id: uid, title: s, priority: "none", status: "todo", project_id: parent.project_id, parent_id: parent.id })));
      if (error) throw new Error(error.message);
      return { task_id, added: (steps as string[]).length };
    },

    async create_project({ name, client, due }) {
      let clientId: string | null = null;
      if (client) {
        const { data } = await db.from("clients").select("id, name").eq("user_id", uid).ilike("name", `%${client}%`);
        if (!data?.length) throw new Error(`no client matching "${client}"`);
        if (data.length > 1) throw new Error(`client "${client}" is ambiguous: ${data.map((c) => c.name).join(", ")}`);
        clientId = data[0].id;
      }
      const { data, error } = await db
        .from("projects")
        .insert({ user_id: uid, name, client_id: clientId, due: due ?? null, status: "active" })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { created: data.id, name };
    },

    async update_project({ project, name, due, status, description }) {
      const pid = await resolveProjectId(db, uid, project as string);
      const patch: Record<string, unknown> = {};
      if (name !== undefined) patch.name = name;
      if (due !== undefined) patch.due = due;
      if (status !== undefined) patch.status = status;
      if (description !== undefined) patch.description = description;
      const { error } = await db.from("projects").update(patch).eq("id", pid!).eq("user_id", uid);
      if (error) throw new Error(error.message);
      return { updated: pid, fields: Object.keys(patch) };
    },

    async list_clients() {
      const { data, error } = await db
        .from("clients")
        .select("id, name, stage, health, arr, renewal, contact_name, email")
        .eq("user_id", uid)
        .order("created_at");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  };
}

/* ── Anthropic agentic loop ── */

type ChatMessage = { role: "user" | "assistant"; content: unknown };

async function callAnthropic(apiKey: string, system: string, messages: ChatMessage[]) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      system,
      tools: TOOLS,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }
  return res.json();
}

function systemPrompt(projectId?: string) {
  const today = iso(new Date());
  return [
    `You are the Peak Focus in-app assistant. Today's date is ${today}.`,
    `You help the user plan and execute work across their projects, tasks, and clients.`,
    `You can directly create, update, complete, and delete tasks/projects using the provided tools — you do not need to ask for confirmation before acting, but always summarize in plain language what you did (or would do) at the end of your reply.`,
    `Use list_projects/get_project/list_tasks to look up ids before mutating anything; never guess an id.`,
    projectId ? `The user is currently viewing project id ${projectId} — assume that's the subject unless they say otherwise.` : "",
    `File attachments only expose filenames/metadata right now, not their contents — say so if asked to read inside a file.`,
    `Be concise. Prefer short plans and bullet lists over long prose.`,
  ]
    .filter(Boolean)
    .join(" ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: CORS });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY secret is not configured for this function." }), {
      status: 500,
      headers: { ...CORS, "content-type": "application/json" },
    });
  }

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "missing auth" }), { status: 401, headers: { ...CORS, "content-type": "application/json" } });
  }

  const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await supa.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS, "content-type": "application/json" } });
  }
  const uid = userData.user.id;

  let body: { messages?: ChatMessage[]; projectId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });
  }
  const history = Array.isArray(body.messages) ? body.messages : [];
  if (!history.length) {
    return new Response(JSON.stringify({ error: "messages is required" }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });
  }

  const handlers = makeHandlers(supa, uid);
  const messages: ChatMessage[] = [...history];
  const actions: { tool: string; args: unknown; result: unknown }[] = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const data = await callAnthropic(apiKey, systemPrompt(body.projectId), messages);

      if (data.stop_reason !== "tool_use") {
        const reply = (data.content ?? [])
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n");
        return new Response(JSON.stringify({ reply, actions }), { status: 200, headers: { ...CORS, "content-type": "application/json" } });
      }

      const toolResults: { type: string; tool_use_id: string; content: string }[] = [];
      for (const block of data.content as { type: string; id: string; name: string; input: Record<string, unknown> }[]) {
        if (block.type !== "tool_use") continue;
        const handler = handlers[block.name];
        let result: unknown;
        try {
          result = handler ? await handler(block.input) : { error: `unknown tool: ${block.name}` };
        } catch (e) {
          result = { error: (e as Error).message };
        }
        actions.push({ tool: block.name, args: block.input, result });
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: "assistant", content: data.content });
      messages.push({ role: "user", content: toolResults });
    }

    return new Response(
      JSON.stringify({ reply: "I took several steps but hit my limit for this turn — tell me to continue if I'm not done.", actions }),
      { status: 200, headers: { ...CORS, "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, actions }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
  }
});
