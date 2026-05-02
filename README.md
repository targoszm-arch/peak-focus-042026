# Peak Focus

An ADHD-friendly productivity app: Pomodoro timer, projects + tasks (with priority view), habit tracking, mood log, and progress visualization. Auth and data sync via Supabase. Optional Oura Ring integration.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router, next-themes (system dark mode)
- Supabase (Auth + Postgres + Edge Functions)
- Vercel deployment

## Local development

```sh
cp .env.example .env.local
npm install
npm run dev
```

Server runs on http://localhost:8080.

## Required env vars

Set in `.env.local` for local dev and in **Vercel → Settings → Environment Variables** for prod:

```
VITE_SUPABASE_URL=https://filtmcykamccfikuxehy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Supabase setup

1. **Apply the schema**
   - Open Supabase dashboard → SQL editor
   - Paste the contents of `supabase/migrations/0001_peak_focus_init.sql` and run

2. **Auth**
   - Auth → Providers → Email: enable "Confirm email" off, "Enable Email link (Magic Link)" on
   - Auth → URL Configuration → Site URL: `https://peak-focus-042026.vercel.app`
   - Add redirect URLs: `https://peak-focus-042026.vercel.app/**` and `http://localhost:8080/**`

3. **Edge Function secrets** (Project Settings → Edge Functions → Secrets)
   - `OURA_CLIENT_ID` — your Oura developer client_id
   - `OURA_CLIENT_SECRET` — your Oura developer client_secret
   - `APP_REDIRECT_URL` — `https://peak-focus-042026.vercel.app/settings`

4. **Deploy the edge function**
   ```sh
   supabase login
   supabase link --project-ref filtmcykamccfikuxehy
   supabase functions deploy oura-callback --no-verify-jwt
   ```

5. **Oura Developer Console**
   - Set Redirect URI to: `https://filtmcykamccfikuxehy.supabase.co/functions/v1/oura-callback`

## Deployment

Vercel auto-deploys `main` on every push:
https://vercel.com/magdas-projects-72309b5a/peak-focus-042026

Manual deploy: `npx vercel --prod`
