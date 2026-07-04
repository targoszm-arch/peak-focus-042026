# File attachments — one-time setup

The attachments feature needs a Storage bucket and a metadata table that
this session's Supabase access can't create directly (it's read-only here).
Run the migration once against the live project before using the feature:

1. Open the Supabase SQL editor for project `filtmcykamccfikuxehy`
   (https://supabase.com/dashboard/project/filtmcykamccfikuxehy/sql/new).
2. Paste and run the contents of `supabase/migrations/0005_attachments.sql`.
3. Confirm it worked:
   - **Storage → Buckets** shows a private `attachments` bucket (25 MB file limit).
   - **Table editor** shows a `public.attachments` table with RLS enabled.

Alternatively, from a machine with the Supabase CLI and write access:

```bash
supabase db push --project-ref filtmcykamccfikuxehy
```

Nothing else to configure — the app reads/writes through the existing
Supabase client, scoped per-user via the bucket's path-prefix RLS policies.
