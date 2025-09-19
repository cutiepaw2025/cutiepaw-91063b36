-- Create storage bucket manually
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding_assets',
  'branding_assets',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/*']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to branding_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to branding_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to branding_assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from branding_assets" ON storage.objects;

-- Create new policies for branding_assets bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to branding_assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to files
CREATE POLICY "Allow public read access to branding_assets" ON storage.objects
FOR SELECT USING (bucket_id = 'branding_assets');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to branding_assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from branding_assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding_assets' 
  AND auth.role() = 'authenticated'
);
