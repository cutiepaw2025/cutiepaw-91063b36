import supabase from "@/lib/supabase/client";

export async function manualSetupStorage() {
  console.log('Starting manual storage setup...');
  
  try {
    // Step 1: List existing buckets
    console.log('Step 1: Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError };
    }
    
    console.log('Existing buckets:', buckets);
    
    // Step 2: Check if branding_assets bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'branding_assets');
    
    if (bucketExists) {
      console.log('✅ branding_assets bucket already exists');
      return { success: true, message: 'Bucket already exists' };
    }
    
    // Step 3: Create the bucket
    console.log('Step 2: Creating branding_assets bucket...');
    const { data, error } = await supabase.storage.createBucket('branding_assets', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error);
      return { success: false, error };
    }
    
    console.log('✅ branding_assets bucket created successfully');
    console.log('Bucket data:', data);
    
    return { success: true, message: 'Bucket created successfully', data };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return { success: false, error };
  }
}

export async function testStorageUpload() {
  console.log('Testing storage upload...');
  
  try {
    // Create a simple test file
    const testContent = 'test';
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const { data, error } = await supabase.storage
      .from('branding_assets')
      .upload('test.txt', testFile);
    
    if (error) {
      console.error('❌ Upload test failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Upload test successful:', data);
    
    // Clean up test file
    await supabase.storage.from('branding_assets').remove(['test.txt']);
    
    return { success: true, message: 'Upload test successful' };
    
  } catch (error) {
    console.error('❌ Upload test failed:', error);
    return { success: false, error };
  }
}

// Instructions for manual setup
export const setupInstructions = `
MANUAL SETUP INSTRUCTIONS:

Since automatic bucket creation is failing due to RLS policies, please run this SQL in your Supabase Dashboard:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kugoonmszogwjxwulhtj
2. Navigate to SQL Editor
3. Copy and paste this SQL:

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

4. Click "Run" to execute the SQL
5. After running, try uploading files again

Alternative: You can also create the bucket manually in the Storage section, but you'll still need to run the RLS policies SQL above.
`;
