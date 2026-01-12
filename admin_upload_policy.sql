-- Run this in your Supabase SQL Editor to fix the upload error

-- 1. Enable RLS on storage.objects (usually enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users (Admins) to upload to the 'promotions' bucket
CREATE POLICY "Allow authenticated uploads to promotions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'promotions' );

-- 3. Allow everyone (Public) to view the images
CREATE POLICY "Allow public viewing of promotions"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'promotions' );

-- 4. Allow authenticated users to update/delete (Optional, for managing files)
CREATE POLICY "Allow authenticated updates to promotions"
ON storage.objects
FOR UPDATE
TO authenticated
USING ( bucket_id = 'promotions' );

CREATE POLICY "Allow authenticated deletes from promotions"
ON storage.objects
FOR DELETE
TO authenticated
USING ( bucket_id = 'promotions' );
