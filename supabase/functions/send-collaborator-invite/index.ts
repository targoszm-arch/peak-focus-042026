// Sends the actual "you've been invited" email for a project collaborator
// invite. Previously `invite_collaborator` only wrote a `pending` row —
// nothing ever told the invited person to go sign up, so they never did.
//
// Auth: JWT-only, like assistant-chat. The calling user's session identifies
// who's inviting; the function re-derives the project name, inviter name,
// and invite status itself from the database (never trusts client-supplied
// copy) via a service-role client, after confirming the caller actually
// owns the project the collaborator row belongs to.
//
// Required secrets (Supabase Dashboard → Edge Functions → Secrets, or
// `supabase secrets set NAME=value --project-ref filtmcykamccfikuxehy`):
//   RESEND_API_KEY    Resend API key
//   RESEND_FROM_EMAIL Verified sender, e.g. "Peak Focus <notifications@yourdomain.com>"
//   APP_URL           Where the sign-up link points, e.g. https://peak-focus-042026.vercel.app
//                      (optional — defaults to that same URL)
//
// Deploy:
//   supabase functions deploy send-collaborator-invite --project-ref filtmcykamccfikuxehy

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_APP_URL = "https://peak-focus-042026.vercel.app";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "missing authorization" }), { status: 401, headers: { ...CORS, "content-type": "application/json" } });

    const { collaboratorId } = await req.json();
    if (!collaboratorId) return new Response(JSON.stringify({ error: "collaboratorId is required" }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Caller identity, from their own JWT (never trust a client-supplied user id).
    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerData.user) {
      return new Response(JSON.stringify({ error: "not authenticated" }), { status: 401, headers: { ...CORS, "content-type": "application/json" } });
    }
    const callerId = callerData.user.id;

    // Service-role client bypasses RLS — we do our own ownership check below,
    // and need it to read auth.users for the inviter's display name.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: collab, error: collabErr } = await admin
      .from("project_collaborators")
      .select("id, project_id, invited_email, role, status, projects:project_id(name, user_id)")
      .eq("id", collaboratorId)
      .single();
    if (collabErr || !collab) {
      return new Response(JSON.stringify({ error: "invite not found" }), { status: 404, headers: { ...CORS, "content-type": "application/json" } });
    }
    const project = collab.projects as unknown as { name: string; user_id: string } | null;
    if (!project || project.user_id !== callerId) {
      return new Response(JSON.stringify({ error: "not authorized to send this invite" }), { status: 403, headers: { ...CORS, "content-type": "application/json" } });
    }

    const { data: ownerData } = await admin.auth.admin.getUserById(callerId);
    const ownerName =
      (ownerData?.user?.user_metadata?.full_name as string | undefined) ||
      ownerData?.user?.email?.split("@")[0] ||
      "Someone";

    const appUrl = Deno.env.get("APP_URL") || DEFAULT_APP_URL;
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!fromEmail || !resendKey) {
      return new Response(JSON.stringify({ error: "email is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL)" }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
    }

    const projectName = escapeHtml(project.name);
    const inviterName = escapeHtml(ownerName);
    const hasAccount = collab.status === "active";

    const subject = hasAccount
      ? `You now have access to "${project.name}" on Peak Focus`
      : `${ownerName} invited you to "${project.name}" on Peak Focus`;

    const bodyLine = hasAccount
      ? `<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">You can now view tasks and attachments, and comment, on <strong>${projectName}</strong>.</p>`
      : `<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;"><strong>${inviterName}</strong> invited you to view <strong>${projectName}</strong> on Peak Focus — its tasks, attachments, and comments. Sign up with this email address (<strong>${escapeHtml(collab.invited_email)}</strong>) to get access.</p>`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#111;">${subject}</h1>
        ${bodyLine}
        <a href="${appUrl}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#266DF0;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
          ${hasAccount ? "Open Peak Focus" : "Sign up to view"}
        </a>
      </div>`;

    const sendRes = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from: fromEmail, to: collab.invited_email, subject, html }),
    });
    if (!sendRes.ok) {
      const detail = await sendRes.text();
      return new Response(JSON.stringify({ error: `email provider error: ${detail}` }), { status: 502, headers: { ...CORS, "content-type": "application/json" } });
    }

    return new Response(JSON.stringify({ sent: true }), { headers: { ...CORS, "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...CORS, "content-type": "application/json" } });
  }
});
