-- POLICY FIX:
-- The error "must be owner of table objects" likely happened because of the "ALTER TABLE" command.
-- storage.objects usually already has RLS enabled, so we can skip that line.

-- Run these commands to enable uploads:

-- 1. Create Policy for Uploads (Authenticated Users)
CREATE POLICY "Allow authenticated uploads to promotions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'promotions' );

-- 2. Create Policy for Viewing (Public)
CREATE POLICY "Allow public viewing of promotions"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'promotions' );

-- NOTE: If you still get an error, you can also create these policies manually in the Supabase Dashboard:
-- Go to Storage -> Configuration -> Policies -> "promotions" bucket -> "New Policy"
