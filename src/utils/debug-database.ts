import { supabase } from "@/integrations/supabase/client";

export async function debugDatabase() {
  console.log('🔍 Debugging Database Connection...');
  
  try {
    // Test 1: Check if we can connect to the database
    console.log('📊 Test 1: Database Connection');
    const { data: testData, error: testError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return { success: false, error: testError };
    }
    
    console.log('✅ Database connection successful');
    console.log('📋 Current company_settings data:', testData);
    
    // Test 2: Check table structure
    console.log('📊 Test 2: Table Structure');
    const { data: structureData, error: structureError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(0);
    
    if (structureError) {
      console.error('❌ Table structure check failed:', structureError);
    } else {
      console.log('✅ Table structure check successful');
    }
    
    // Test 3: Try to insert a test record
    console.log('📊 Test 3: Insert Test');
    const testRecord = {
      company_name: 'Test Company',
      company_email: 'test@example.com',
      logo_size_auth: 48,
      logo_size_header: 24,
      logo_size_sidebar: 28,
      logo_size_favicon: 32
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('company_settings')
      .insert([testRecord])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
    } else {
      console.log('✅ Insert test successful:', insertData);
      
      // Clean up test record
      if (insertData && insertData[0]) {
        await supabase
          .from('company_settings')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
    return { success: true, data: testData };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { success: false, error };
  }
}

export async function testDatabaseSave() {
  console.log('🔍 Testing Database Save...');
  
  try {
    // Test 1: Check current company settings
    console.log('📊 Test 1: Check current settings');
    const { data: currentSettings, error: readError } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Read test failed:', readError);
      return { success: false, error: readError };
    }
    
    console.log('✅ Read test successful:', currentSettings);
    
    // Test 2: Try to update existing record
    if (currentSettings && currentSettings.length > 0) {
      const existingRecord = currentSettings[0];
      console.log('📊 Test 2: Update existing record');
      
      const updateData = {
        company_name: existingRecord.company_name || 'Test Company Updated',
        company_email: existingRecord.company_email || 'test@example.com',
        logo_size_auth: 50,
        logo_size_header: 30,
        logo_size_sidebar: 35,
        logo_size_favicon: 40
      };
      
      const { data: updateResult, error: updateError } = await supabase
        .from('company_settings')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select();
      
      if (updateError) {
        console.error('❌ Update test failed:', updateError);
        return { success: false, error: updateError };
      }
      
      console.log('✅ Update test successful:', updateResult);
    } else {
      // Test 3: Try to insert new record
      console.log('📊 Test 3: Insert new record');
      
      const newRecord = {
        company_name: 'Test Company',
        company_email: 'test@example.com',
        logo_size_auth: 48,
        logo_size_header: 24,
        logo_size_sidebar: 28,
        logo_size_favicon: 32
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('company_settings')
        .insert([newRecord])
        .select();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError);
        return { success: false, error: insertError };
      }
      
      console.log('✅ Insert test successful:', insertResult);
    }
    
    return { success: true, data: currentSettings };
    
  } catch (error) {
    console.error('❌ Database save test failed:', error);
    return { success: false, error };
  }
}

export async function checkStorageBucket() {
  console.log('🔍 Checking Storage Bucket...');
  
  try {
    // First check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Authentication status:', { user: user?.email, error: authError });
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return { success: false, error: authError, message: 'Authentication failed' };
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return { success: false, message: 'No authenticated user' };
    }
    
    console.log('✅ User authenticated:', user.email);
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Storage bucket check failed:', error);
      return { success: false, error };
    }
    
    console.log('📋 Available buckets:', buckets);
    
    const brandingBucket = buckets?.find(bucket => bucket.name === 'branding_assets');
    
    if (brandingBucket) {
      console.log('✅ branding_assets bucket exists:', brandingBucket);
      
      // Check bucket contents
      const { data: files, error: filesError } = await supabase.storage
        .from('branding_assets')
        .list();
      
      if (filesError) {
        console.error('❌ Failed to list files:', filesError);
      } else {
        console.log('📁 Files in bucket:', files);
      }
      
      // Test upload permissions
      console.log('🧪 Testing upload permissions...');
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const { error: uploadTestError } = await supabase.storage
        .from('branding_assets')
        .upload(`test_${Date.now()}.txt`, testFile);
      
      if (uploadTestError) {
        console.error('❌ Upload test failed:', uploadTestError);
        return { success: false, bucket: brandingBucket, files, uploadError: uploadTestError };
      } else {
        console.log('✅ Upload test successful');
        // Clean up test file
        await supabase.storage
          .from('branding_assets')
          .remove([`test_${Date.now()}.txt`]);
      }
      
      return { success: true, bucket: brandingBucket, files };
    } else {
      console.log('❌ branding_assets bucket not found');
      return { success: false, message: 'Bucket not found' };
    }
    
  } catch (error) {
    console.error('❌ Storage check failed:', error);
    return { success: false, error };
  }
}

export async function testDirectBucketAccess() {
  console.log('🔍 Testing Direct Bucket Access...');
  
  try {
    // Test direct access to branding_assets bucket
    const { data: files, error: listError } = await supabase.storage
      .from('branding_assets')
      .list();
    
    if (listError) {
      console.error('❌ Direct bucket access failed:', listError);
      return { success: false, error: listError };
    }
    
    console.log('✅ Direct bucket access successful');
    console.log('📁 Files in bucket:', files);
    
    // Test upload to bucket
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('branding_assets')
      .upload(`test_${Date.now()}.txt`, testFile);
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      return { success: false, uploadError };
    }
    
    console.log('✅ Upload test successful:', uploadData);
    
    // Clean up test file
    if (uploadData?.path) {
      await supabase.storage
        .from('branding_assets')
        .remove([uploadData.path]);
      console.log('🧹 Test file cleaned up');
    }
    
    return { success: true, files, uploadData };
    
  } catch (error) {
    console.error('❌ Direct bucket test failed:', error);
    return { success: false, error };
  }
}
