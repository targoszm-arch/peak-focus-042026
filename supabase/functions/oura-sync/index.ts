// Oura sync. Pulls daily metrics from Oura API v2 and upserts into oura_daily.
//
// Two invocation modes:
//   1) JWT request (from the app): syncs the calling user only.
//   2) Cron / service-role request with header `x-cron-secret: $CRON_SECRET`:
//      syncs every user with a row in oura_connections.
//
// Required Supabase secrets:
//   OURA_CLIENT_ID, OURA_CLIENT_SECRET   (for refresh-token flow)
//   CRON_SECRET                          (shared with pg_cron / scheduler)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//
// Deploy:
//   supabase functions deploy oura-sync --project-ref filtmcykamccfikuxehy

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const OURA_BASE = "https://api.ouraring.com";
const DAYS_BACK = 30;

type Conn = {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function refreshToken(conn: Conn, supa: SupabaseClient): Promise<string> {
  const expires = conn.expires_at ? new Date(conn.expires_at).getTime() : 0;
  const skewMs = 60_000;
  if (expires - skewMs > Date.now()) return conn.access_token;
  if (!conn.refresh_token) return conn.access_token;

  const clientId = Deno.env.get("OURA_CLIENT_ID")!;
  const clientSecret = Deno.env.get("OURA_CLIENT_SECRET")!;
  const res = await fetch(`${OURA_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    console.error("token refresh failed", res.status, await res.text());
    return conn.access_token;
  }
  const tok = await res.json();
  const newAccess = tok.access_token as string;
  const newRefresh = (tok.refresh_token as string | undefined) ?? conn.refresh_token;
  const newExpires = tok.expires_in
    ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
    : null;

  await supa
    .from("oura_connections")
    .update({
      access_token: newAccess,
      refresh_token: newRefresh,
      expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", conn.user_id);

  return newAccess;
}

async function ouraGet(token: string, path: string): Promise<any> {
  const res = await fetch(`${OURA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Oura ${path} ${res.status}: ${txt}`);
  }
  return res.json();
}

type DailyRow = {
  user_id: string;
  metric_date: string;
  readiness_score: number | null;
  sleep_score: number | null;
  activity_score: number | null;
  total_sleep_seconds: number | null;
  resting_heart_rate: number | null;
  hrv_avg: number | null;
  raw: any;
};

async function syncUser(conn: Conn, supa: SupabaseClient): Promise<number> {
  const token = await refreshToken(conn, supa);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - DAYS_BACK);
  const range = `start_date=${isoDate(start)}&end_date=${isoDate(end)}`;

  const [sleepDaily, readiness, activity, sleep] = await Promise.all([
    ouraGet(token, `/v2/usercollection/daily_sleep?${range}`).catch((e) => {
      console.warn("daily_sleep failed", e.message);
      return { data: [] };
    }),
    ouraGet(token, `/v2/usercollection/daily_readiness?${range}`).catch((e) => {
      console.warn("daily_readiness failed", e.message);
      return { data: [] };
    }),
    ouraGet(token, `/v2/usercollection/daily_activity?${range}`).catch((e) => {
      console.warn("daily_activity failed", e.message);
      return { data: [] };
    }),
    ouraGet(token, `/v2/usercollection/sleep?${range}`).catch((e) => {
      console.warn("sleep failed", e.message);
      return { data: [] };
    }),
  ]);

  const byDate = new Map<string, DailyRow>();
  const get = (day: string): DailyRow => {
    let r = byDate.get(day);
    if (!r) {
      r = {
        user_id: conn.user_id,
        metric_date: day,
        readiness_score: null,
        sleep_score: null,
        activity_score: null,
        total_sleep_seconds: null,
        resting_heart_rate: null,
        hrv_avg: null,
        raw: {},
      };
      byDate.set(day, r);
    }
    return r;
  };

  for (const d of sleepDaily.data ?? []) {
    const r = get(d.day);
    r.sleep_score = d.score ?? null;
    r.raw.daily_sleep = d;
  }
  for (const d of readiness.data ?? []) {
    const r = get(d.day);
    r.readiness_score = d.score ?? null;
    r.raw.daily_readiness = d;
  }
  for (const d of activity.data ?? []) {
    const r = get(d.day);
    r.activity_score = d.score ?? null;
    r.raw.daily_activity = d;
  }
  // /sleep gives detailed per-period; pick the long_sleep / main sleep per day
  for (const s of sleep.data ?? []) {
    if (s.type && s.type !== "long_sleep") continue;
    const day = s.day;
    if (!day) continue;
    const r = get(day);
    if (typeof s.total_sleep_duration === "number")
      r.total_sleep_seconds = s.total_sleep_duration;
    if (typeof s.average_heart_rate === "number" && r.resting_heart_rate == null)
      r.resting_heart_rate = Math.round(s.lowest_heart_rate ?? s.average_heart_rate);
    else if (typeof s.lowest_heart_rate === "number")
      r.resting_heart_rate = Math.round(s.lowest_heart_rate);
    if (typeof s.average_hrv === "number") r.hrv_avg = Math.round(s.average_hrv);
    r.raw.sleep = s;
  }

  const rows = [...byDate.values()];
  if (rows.length === 0) return 0;
  const { error } = await supa
    .from("oura_daily")
    .upsert(rows, { onConflict: "user_id,metric_date" });
  if (error) {
    console.error("upsert oura_daily failed", error);
    throw error;
  }
  return rows.length;
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-cron-secret",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cronSecret = Deno.env.get("CRON_SECRET");
    const cronHeader = req.headers.get("x-cron-secret");
    const isCron = cronSecret && cronHeader === cronSecret;

    let conns: Conn[] = [];
    if (isCron) {
      const { data, error } = await supa
        .from("oura_connections")
        .select("user_id, access_token, refresh_token, expires_at");
      if (error) throw error;
      conns = data ?? [];
    } else {
      // JWT mode: derive user from auth header
      const auth = req.headers.get("Authorization") ?? "";
      const jwt = auth.replace(/^Bearer\s+/i, "");
      if (!jwt)
        return new Response(JSON.stringify({ error: "missing auth" }), {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      const { data: userData, error: userErr } = await supa.auth.getUser(jwt);
      if (userErr || !userData.user)
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      const { data, error } = await supa
        .from("oura_connections")
        .select("user_id, access_token, refresh_token, expires_at")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return new Response(JSON.stringify({ error: "not_connected" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      conns = [data];
    }

    let totalRows = 0;
    const results: Array<{ user_id: string; rows?: number; error?: string }> = [];
    for (const c of conns) {
      try {
        const n = await syncUser(c, supa);
        totalRows += n;
        results.push({ user_id: c.user_id, rows: n });
      } catch (e) {
        results.push({ user_id: c.user_id, error: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, users: conns.length, rows: totalRows, results }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("oura-sync error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
