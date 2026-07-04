-- Raise the attachments bucket's per-file limit from 25 MB to 50 MB —
-- Supabase's standard (non-resumable) upload path tops out around there;
-- going bigger needs chunked/TUS uploads, a separate feature.
update storage.buckets set file_size_limit = 52428800 where id = 'attachments'; -- 50 MB
