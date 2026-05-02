// Oura OAuth callback. Exchanges the authorization code for tokens and stores
// them in `oura_connections` for the authenticated user.
//
// Required Supabase secrets (Project Settings → Edge Functions → Secrets):
//   OURA_CLIENT_ID
//   OURA_CLIENT_SECRET
//   APP_REDIRECT_URL    e.g. https://peak-focus-042026.vercel.app/settings
//   SUPABASE_URL        (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//
// Deploy:
//   supabase functions deploy oura-callback --no-verify-jwt
// (we accept the callback redirect from Oura which has no JWT)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const error = url.searchParams.get("error");

    const appRedirect =
      Deno.env.get("APP_REDIRECT_URL") ?? "https://peak-focus-042026.vercel.app/settings";

    if (error || !code || !state) {
      return Response.redirect(`${appRedirect}?oura=error`, 302);
    }

    const clientId = Deno.env.get("OURA_CLIENT_ID");
    const clientSecret = Deno.env.get("OURA_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.error("Missing OURA credentials");
      return Response.redirect(`${appRedirect}?oura=error`, 302);
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/oura-callback`,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(OURA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("Oura token exchange failed", tokenRes.status, txt);
      return Response.redirect(`${appRedirect}?oura=error`, 302);
    }

    const tok = await tokenRes.json();
    const expiresAt = tok.expires_in
      ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
      : null;

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: upsertErr } = await supa
      .from("oura_connections")
      .upsert(
        {
          user_id: state,
          access_token: tok.access_token,
          refresh_token: tok.refresh_token ?? null,
          expires_at: expiresAt,
          scope: tok.scope ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertErr) {
      console.error("Upsert failed", upsertErr);
      return Response.redirect(`${appRedirect}?oura=error`, 302);
    }

    return Response.redirect(`${appRedirect}?oura=connected`, 302);
  } catch (e) {
    console.error("oura-callback error", e);
    return new Response("internal error", { status: 500 });
  }
});
