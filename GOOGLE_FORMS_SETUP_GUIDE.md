# Google Forms Integration Setup Guide

## 🎯 What You'll Get

- **Automatic sync** of Google Forms responses to your CRM
- **Real-time notifications** when new franchise requests are submitted
- **Complete CRM management** of franchise requests with status tracking
- **Email notifications** for new submissions and errors

## 📋 Prerequisites

1. ✅ Google Form already created
2. ✅ Supabase project set up
3. ✅ Your CRM application running

## 🚀 Step-by-Step Setup

### Step 1: Run Database Migration

First, you need to create the `franchise_requests` table in your Supabase database.

**Go to your Supabase Dashboard → SQL Editor** and run this migration:

```sql
-- Create franchise_requests table for Google Forms integration
CREATE TABLE IF NOT EXISTS franchise_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_form_id TEXT,
  google_sheet_row_id TEXT,
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  investment_amount NUMERIC,
  preferred_territory TEXT,
  business_experience TEXT,
  current_business TEXT,
  why_franchise TEXT,
  expected_timeline TEXT,
  additional_notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected', 'contacted')),
  assigned_to UUID REFERENCES profiles(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source TEXT DEFAULT 'google_form',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_franchise_requests_status ON franchise_requests(status);
CREATE INDEX IF NOT EXISTS idx_franchise_requests_assigned_to ON franchise_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_franchise_requests_created_at ON franchise_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_franchise_requests_google_form_id ON franchise_requests(google_form_id);

-- Enable RLS
ALTER TABLE franchise_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON franchise_requests;
CREATE POLICY "Enable read access for authenticated users" ON franchise_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON franchise_requests;
CREATE POLICY "Enable insert for authenticated users" ON franchise_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON franchise_requests;
CREATE POLICY "Enable update for authenticated users" ON franchise_requests FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON franchise_requests;
CREATE POLICY "Enable delete for authenticated users" ON franchise_requests FOR DELETE USING (true);
```

### Step 2: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**
2. **Navigate to Settings → API**
3. **Copy these values:**
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 3: Set Up Google Apps Script

1. **Go to [Google Apps Script](https://script.google.com/)**
2. **Click "New Project"**
3. **Replace the default code** with the content from `google-apps-script/franchise-form-sync.js`
4. **Update the credentials** in the script:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // Replace with your project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Replace with your anon key
   ```
5. **Update the admin email** in the notification functions:
   ```javascript
   const adminEmail = 'your-email@yourcompany.com'; // Replace with your email
   ```

### Step 4: Connect Google Apps Script to Your Form

1. **In Google Apps Script, click "Deploy" → "New deployment"**
2. **Choose "Web app"**
3. **Set access to "Anyone"**
4. **Click "Deploy"**

### Step 5: Set Up the Trigger

1. **In Google Apps Script, click "Triggers" (clock icon)**
2. **Click "Add Trigger"**
3. **Configure:**
   - **Choose which function to run:** `syncFormResponseToSupabase`
   - **Choose which deployment should run:** `Head`
   - **Select event source:** `From form`
   - **Select event type:** `On form submit`
   - **Select form:** Choose your franchise form
4. **Click "Save"**

### Step 6: Test the Integration

1. **Submit a test response** to your Google Form
2. **Check the Google Apps Script logs** (View → Execution log)
3. **Check your CRM** at `/crm/franchise-requests` to see if the data appears
4. **Check your email** for notifications

### Step 7: Form Field Mapping (Already Configured!)

✅ **Your form fields have been automatically mapped!** 

The Google Apps Script has been customized to handle your exact form fields:

- **Full Name** → `owner_name`
- **Email Address** → `email`
- **Phone Number** → `phone`
- **City & State** → `city` and `state` (automatically split)
- **Current Occupation** → `current_business`
- **Industry Experience** → `business_experience`
- **Years of Business Experience** → `business_experience`
- **Investment Budget Range** → `investment_amount` (converted to numeric value)
- **Preferred Franchise Type/Model** → `preferred_territory`
- **City/Region Interested In** → `preferred_territory`
- **How soon are you looking to start?** → `expected_timeline`
- **Why do you want to take our franchise?** → `why_franchise`
- **Any additional comments or questions?** → `additional_notes`

**Additional fields** (like "How did you hear about us?", "Source of Investment", etc.) are stored in the `additional_notes` field for reference.

**No customization needed!** The script is ready to use with your form.

## 🔧 Troubleshooting

### Issue: "Supabase connection test failed"
**Solution:** 
- Check your Supabase URL and API key
- Ensure your Supabase project is active
- Verify the `franchise_requests` table exists

### Issue: "Form data not appearing in CRM"
**Solution:**
- Check Google Apps Script execution logs
- Verify the form field mappings match your actual questions
- Test the Supabase connection using `testSupabaseConnection()`

### Issue: "Trigger not working"
**Solution:**
- Ensure the trigger is set to "On form submit"
- Check that the function name matches exactly
- Verify the form is connected to the script

## 📱 Using Your CRM

Once set up, you can:

1. **View all franchise requests** at `/crm/franchise-requests`
2. **Filter by status** (new, reviewing, approved, rejected, contacted)
3. **Filter by priority** (low, medium, high, urgent)
4. **Search by name, email, or phone**
5. **Edit request details** and assign to team members
6. **Add notes** and update status

## 🔄 Manual Sync (Optional)

If you have existing form responses, you can sync them manually:

1. **In Google Apps Script, run the `manualSync()` function**
2. **This will sync all existing responses** to your CRM
3. **Check the logs** for any errors

## 📧 Email Notifications

The system will automatically send:
- **Success notifications** when new requests are synced
- **Error notifications** if sync fails
- **Update the admin email** in the script to receive these

## 🎉 You're Done!

Your Google Forms integration is now complete! Every time someone submits your franchise form, the data will automatically appear in your CRM for management.

## 📞 Support

If you encounter any issues:
1. Check the Google Apps Script execution logs
2. Verify your Supabase credentials
3. Test the connection using the provided test functions
4. Ensure your form field mappings are correct
