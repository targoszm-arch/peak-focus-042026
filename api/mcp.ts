// Peak Focus MCP connector — a remote MCP server (Streamable HTTP) served
// from the app's own domain at /api/mcp. Add it to claude.ai as a custom
// connector to let Claude manage tasks, projects and clients directly.
//
// Required Vercel environment variables (server-side only):
//   SUPABASE_SERVICE_ROLE_KEY  Supabase → Project Settings → API → service_role
//   PF_MCP_SECRET              long random string; gates access to this endpoint
//   PF_MCP_USER_EMAIL          the account whose workspace Claude manages
// Optional:
//   SUPABASE_URL               defaults to VITE_SUPABASE_URL
//
// Connector URL:  https://<your-domain>/api/mcp?key=<PF_MCP_SECRET>

import { createMcpHandler } from "mcp-handler";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SECRET = process.env.PF_MCP_SECRET || "";
const USER_EMAIL = process.env.PF_MCP_USER_EMAIL || "";

let sb: SupabaseClient | null = null;
let cachedUserId: string | null = null;

function db(): SupabaseClient {
  if (!sb) sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  return sb;
}

async function userId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const { data, error } = await db().auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`auth lookup failed: ${error.message}`);
  const user = data.users.find((u) => u.email?.toLowerCase() === USER_EMAIL.toLowerCase());
  if (!user) throw new Error(`no user with email ${USER_EMAIL}`);
  cachedUserId = user.id;
  return user.id;
}

/* ── helpers ── */

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function resolveDue(due?: string | null): string | null {
  if (!due) return null;
  const t = new Date();
  if (due === "today") return iso(t);
  if (due === "tomorrow") return iso(new Date(t.getTime() + 86400000));
  if (due === "next week") return iso(new Date(t.getTime() + 7 * 86400000));
  return due; // assume YYYY-MM-DD
}

async function resolveProjectId(uid: string, project?: string | null): Promise<string | null> {
  if (!project) return null;
  const { data } = await db()
    .from("projects")
    .select("id, name")
    .eq("user_id", uid)
    .ilike("name", `%${project}%`);
  if (data?.length === 1) return data[0].id;
  const exact = data?.find((p) => p.name.toLowerCase() === project.toLowerCase());
  if (exact) return exact.id;
  if (data && data.length > 1)
    throw new Error(`project "${project}" is ambiguous: ${data.map((p) => p.name).join(", ")}`);
  // Maybe an id was passed directly.
  if (/^[0-9a-f-]{36}$/i.test(project)) return project;
  throw new Error(`no project matching "${project}"`);
}

const ok = (payload: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
});

/* ── the MCP server ── */

const mcp = createMcpHandler(
  (server) => {
    server.tool(
      "list_tasks",
      "List tasks in the Peak Focus workspace. Returns ids you can pass to other tools. Checklist steps appear under their parent task.",
      {
        scope: z.enum(["today", "overdue", "upcoming", "all"]).default("all")
          .describe("today = due today or overdue; upcoming = due after today"),
        project: z.string().optional().describe("filter by project name"),
        include_done: z.boolean().default(false),
      },
      async ({ scope, project, include_done }) => {
        const uid = await userId();
        let q = db().from("tasks").select("*").eq("user_id", uid).order("created_at", { ascending: false });
        if (!include_done) q = q.eq("completed", false);
        const pid = project ? await resolveProjectId(uid, project) : null;
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
        return ok(
          roots.map((t) => ({
            id: t.id,
            title: t.title,
            project: pname(t.project_id),
            priority: t.priority,
            status: t.status,
            due: t.ends_at,
            done: t.completed,
            notes: t.notes || undefined,
            checklist: kids
              .filter((k) => k.parent_id === t.id)
              .map((k) => ({ id: k.id, title: k.title, done: k.completed })),
          }))
        );
      }
    );

    server.tool(
      "create_task",
      "Create a task, optionally with a checklist of steps.",
      {
        title: z.string().min(1),
        project: z.string().optional().describe("project name; omit for Chores"),
        priority: z.enum(["high", "medium", "low", "none"]).default("none"),
        due: z.string().optional().describe("YYYY-MM-DD, or 'today' | 'tomorrow' | 'next week'"),
        notes: z.string().optional(),
        checklist: z.array(z.string()).optional().describe("step titles"),
      },
      async ({ title, project, priority, due, notes, checklist }) => {
        const uid = await userId();
        const pid = await resolveProjectId(uid, project ?? null);
        const { data, error } = await db()
          .from("tasks")
          .insert({
            user_id: uid,
            title,
            priority,
            status: "todo",
            project_id: pid,
            ends_at: resolveDue(due),
            notes: notes ?? "",
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        if (checklist?.length) {
          const { error: e2 } = await db().from("tasks").insert(
            checklist.map((s) => ({
              user_id: uid,
              title: s,
              priority: "none",
              status: "todo",
              project_id: pid,
              parent_id: data.id,
            }))
          );
          if (e2) throw new Error(e2.message);
        }
        return ok({ created: data.id, title, checklist_steps: checklist?.length ?? 0 });
      }
    );

    server.tool(
      "update_task",
      "Update a task's fields (also works for checklist steps by id).",
      {
        task_id: z.string(),
        title: z.string().optional(),
        priority: z.enum(["high", "medium", "low", "none"]).optional(),
        status: z.enum(["todo", "progress", "review", "done"]).optional(),
        due: z.string().nullable().optional().describe("YYYY-MM-DD / 'today' / 'tomorrow' / null to clear"),
        project: z.string().nullable().optional().describe("project name, or null to move to Chores"),
        notes: z.string().optional(),
      },
      async ({ task_id, title, priority, status, due, project, notes }) => {
        const uid = await userId();
        const patch: Record<string, unknown> = {};
        if (title !== undefined) patch.title = title;
        if (priority !== undefined) patch.priority = priority;
        if (status !== undefined) {
          patch.status = status;
          patch.completed = status === "done";
        }
        if (due !== undefined) patch.ends_at = resolveDue(due);
        if (project !== undefined) patch.project_id = project === null ? null : await resolveProjectId(uid, project);
        if (notes !== undefined) patch.notes = notes;
        const { error } = await db().from("tasks").update(patch).eq("id", task_id).eq("user_id", uid);
        if (error) throw new Error(error.message);
        return ok({ updated: task_id, fields: Object.keys(patch) });
      }
    );

    server.tool(
      "complete_task",
      "Mark a task (or checklist step) done or not done.",
      { task_id: z.string(), done: z.boolean().default(true) },
      async ({ task_id, done }) => {
        const uid = await userId();
        const { error } = await db()
          .from("tasks")
          .update({ completed: done, status: done ? "done" : "todo" })
          .eq("id", task_id)
          .eq("user_id", uid);
        if (error) throw new Error(error.message);
        return ok({ [done ? "completed" : "reopened"]: task_id });
      }
    );

    server.tool(
      "delete_task",
      "Delete a task permanently (its checklist steps are deleted with it).",
      { task_id: z.string() },
      async ({ task_id }) => {
        const uid = await userId();
        const { error } = await db().from("tasks").delete().eq("id", task_id).eq("user_id", uid);
        if (error) throw new Error(error.message);
        return ok({ deleted: task_id });
      }
    );

    server.tool(
      "add_checklist_steps",
      "Add checklist steps to an existing task.",
      { task_id: z.string(), steps: z.array(z.string()).min(1) },
      async ({ task_id, steps }) => {
        const uid = await userId();
        const { data: parent, error: e1 } = await db()
          .from("tasks")
          .select("id, project_id")
          .eq("id", task_id)
          .eq("user_id", uid)
          .single();
        if (e1 || !parent) throw new Error("task not found");
        const { error } = await db().from("tasks").insert(
          steps.map((s) => ({
            user_id: uid,
            title: s,
            priority: "none",
            status: "todo",
            project_id: parent.project_id,
            parent_id: parent.id,
          }))
        );
        if (error) throw new Error(error.message);
        return ok({ task_id, added: steps.length });
      }
    );

    server.tool(
      "list_projects",
      "List projects with client, due date, status and task progress.",
      {},
      async () => {
        const uid = await userId();
        const [{ data: projects, error }, { data: tasks }, { data: clients }] = await Promise.all([
          db().from("projects").select("*").eq("user_id", uid).order("created_at"),
          db().from("tasks").select("id, project_id, completed, parent_id").eq("user_id", uid),
          db().from("clients").select("id, name").eq("user_id", uid),
        ]);
        if (error) throw new Error(error.message);
        return ok(
          (projects ?? []).map((p) => {
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
          })
        );
      }
    );

    server.tool(
      "create_project",
      "Create a project, optionally linked to a client by name.",
      {
        name: z.string().min(1),
        client: z.string().optional(),
        due: z.string().optional().describe("target date YYYY-MM-DD"),
      },
      async ({ name, client, due }) => {
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
        return ok({ created: data.id, name });
      }
    );

    server.tool(
      "update_project",
      "Rename a project or change its due date / status.",
      {
        project: z.string().describe("project name or id"),
        name: z.string().optional(),
        due: z.string().nullable().optional(),
        status: z.enum(["active", "on_hold", "done", "archived"]).optional(),
      },
      async ({ project, name, due, status }) => {
        const uid = await userId();
        const pid = await resolveProjectId(uid, project);
        const patch: Record<string, unknown> = {};
        if (name !== undefined) patch.name = name;
        if (due !== undefined) patch.due = due;
        if (status !== undefined) patch.status = status;
        const { error } = await db().from("projects").update(patch).eq("id", pid!).eq("user_id", uid);
        if (error) throw new Error(error.message);
        return ok({ updated: pid, fields: Object.keys(patch) });
      }
    );

    server.tool(
      "list_clients",
      "List clients with stage, health, ARR and renewal date.",
      {},
      async () => {
        const uid = await userId();
        const { data, error } = await db()
          .from("clients")
          .select("id, name, stage, health, arr, renewal, contact_name, email")
          .eq("user_id", uid)
          .order("created_at");
        if (error) throw new Error(error.message);
        return ok(data ?? []);
      }
    );
  },
  {
    serverInfo: { name: "peak-focus", version: "1.0.0" },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: false,
  }
);

export default async function handler(req: Request): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_KEY || !SECRET || !USER_EMAIL) {
    return new Response(
      JSON.stringify({ error: "MCP connector not configured — set SUPABASE_SERVICE_ROLE_KEY, PF_MCP_SECRET and PF_MCP_USER_EMAIL in Vercel." }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (key !== SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return mcp(req);
}
