# File attachments — setup

The attachments feature needs a Storage bucket and a metadata table,
provisioned by `supabase/migrations/0005_attachments.sql` (creates the
bucket + table) and `0006_attachments_50mb.sql` (raises the per-file limit
to 50 MB). Both are already applied to the live project.

For a fresh Supabase project (e.g. a new environment), apply them once:

1. Open the Supabase SQL editor for the project
   (`https://supabase.com/dashboard/project/<ref>/sql/new`).
2. Paste and run `0005_attachments.sql`, then `0006_attachments_50mb.sql`, in order.
3. Confirm it worked:
   - **Storage → Buckets** shows a private `attachments` bucket (50 MB file limit).
   - **Table editor** shows a `public.attachments` table with RLS enabled.

Or, from a machine with the Supabase CLI and write access:

```bash
supabase db push --project-ref <ref>
```

Nothing else to configure — the app reads/writes through the existing
Supabase client, scoped per-user via the bucket's path-prefix RLS policies.
