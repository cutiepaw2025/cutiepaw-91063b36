-- Simple storage policies for branding_assets bucket
-- These policies allow all operations for authenticated users on the branding_assets bucket

-- Allow authenticated users to upload files
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to branding_assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to files
CREATE POLICY IF NOT EXISTS "Allow public read access to branding_assets" ON storage.objects
FOR SELECT USING (bucket_id = 'branding_assets');

-- Allow authenticated users to update files
CREATE POLICY IF NOT EXISTS "Allow authenticated updates to branding_assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from branding_assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);
