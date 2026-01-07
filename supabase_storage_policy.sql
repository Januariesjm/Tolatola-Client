-- SQL Migration to fix storage permissions for business licenses
-- Run this in your Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow unauthenticated (anon) users to upload files to the business-licenses folder
-- This resolves the "row-level security policy" error during registration
CREATE POLICY "Allow public uploads to business-licenses"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = 'business-licenses'
);

-- 3. Allow public to view the files (needed for the client to display the link/status)
CREATE POLICY "Allow public read access to business-licenses"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = 'business-licenses'
);

-- 4. Enable RLS on the objects table (good practice ensuring our policies apply)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
