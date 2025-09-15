-- Create branding_assets storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'branding_assets',
  'branding_assets',
  true,
  ARRAY['image/*'],
  5242880
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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
