-- Safely enable RLS on storage.objects (won't error if already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update branding assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete branding assets" ON storage.objects;

-- Create policy to allow authenticated users to upload to branding_assets
CREATE POLICY "Allow authenticated users to upload branding assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access to branding_assets
CREATE POLICY "Allow public read access to branding assets" ON storage.objects
FOR SELECT USING (bucket_id = 'branding_assets');

-- Create policy to allow authenticated users to update branding assets
CREATE POLICY "Allow authenticated users to update branding assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete branding assets
CREATE POLICY "Allow authenticated users to delete branding assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);
