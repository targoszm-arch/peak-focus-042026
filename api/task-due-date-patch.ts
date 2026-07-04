// One-off admin endpoint for applying Linear issue due dates to Peak Focus
// tasks when an MCP client cannot execute write tools in the current chat.
//
// POST /api/task-due-date-patch?key=<PF_MCP_SECRET>
// Body: { "dueDates": { "PBBT-1": "2026-07-10" }, "dryRun": true }

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SECRET = process.env.PF_MCP_SECRET || "";
const USER_EMAIL = process.env.PF_MCP_USER_EMAIL || "";

type DueDatePatchRequest = {
  dueDates?: Record<string, string | null | undefined>;
  dryRun?: boolean;
};

type TaskMatch = {
  id: string;
  title: string;
  notes: string | null;
  ends_at: string | null;
};

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

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function validateDueDates(dueDates: DueDatePatchRequest["dueDates"]): Record<string, string | null> {
  if (!dueDates || typeof dueDates !== "object" || Array.isArray(dueDates)) {
    throw new Error('Request body must include a "dueDates" object.');
  }

  const entries = Object.entries(dueDates).filter(([, due]) => due !== undefined);
  if (!entries.length) throw new Error('"dueDates" must include at least one issue key.');

  return Object.fromEntries(
    entries.map(([issueKey, due]) => {
      const normalizedKey = issueKey.trim().toUpperCase();
      if (!/^PBBT-\d+$/.test(normalizedKey)) throw new Error(`Invalid issue key: ${issueKey}`);
      if (due !== null && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        throw new Error(`Invalid due date for ${normalizedKey}: use YYYY-MM-DD or null.`);
      }
      return [normalizedKey, due ?? null];
    })
  );
}

async function findTaskMatches(uid: string, issueKey: string): Promise<TaskMatch[]> {
  const { data, error } = await db()
    .from("tasks")
    .select("id, title, notes, ends_at")
    .eq("user_id", uid)
    .or(`title.ilike.%${issueKey}%,notes.ilike.%${issueKey}%`);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function handler(req: Request): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_KEY || !SECRET || !USER_EMAIL) {
    return json(
      { error: "Due-date patch endpoint not configured — set SUPABASE_SERVICE_ROLE_KEY, PF_MCP_SECRET and PF_MCP_USER_EMAIL in Vercel." },
      503
    );
  }

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (key !== SECRET) return json({ error: "forbidden" }, 403);

  try {
    const body = (await req.json()) as DueDatePatchRequest;
    const dueDates = validateDueDates(body.dueDates);
    const uid = await userId();
    const results = [];

    for (const [issueKey, endsAt] of Object.entries(dueDates)) {
      const matches = await findTaskMatches(uid, issueKey);
      if (!body.dryRun && matches.length > 0) {
        const { error } = await db()
          .from("tasks")
          .update({ ends_at: endsAt })
          .eq("user_id", uid)
          .in(
            "id",
            matches.map((task) => task.id)
          );
        if (error) throw new Error(error.message);
      }

      results.push({
        issueKey,
        endsAt,
        matched: matches.length,
        updated: body.dryRun ? 0 : matches.length,
        tasks: matches.map((task) => ({ id: task.id, title: task.title, previousEndsAt: task.ends_at })),
      });
    }

    return json({ dryRun: Boolean(body.dryRun), results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unknown error" }, 400);
  }
}
