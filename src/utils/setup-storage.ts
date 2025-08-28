import { supabase } from "@/integrations/supabase/client";

export async function setupStorageBucket() {
  try {
    // First, let's check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'branding_assets');
    
    if (bucketExists) {
      console.log('Storage bucket branding_assets already exists');
      return { success: true, message: 'Bucket already exists' };
    }

    // Try to create the branding_assets bucket
    const { data, error } = await supabase.storage.createBucket('branding_assets', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return { success: false, error };
    }

    console.log('Storage bucket branding_assets created successfully');
    return { success: true, message: 'Bucket created successfully' };
  } catch (error) {
    console.error('Error setting up storage bucket:', error);
    return { success: false, error };
  }
}

export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return { success: false, error };
    }

    console.log('Database connection successful');
    return { success: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, error };
  }
}
