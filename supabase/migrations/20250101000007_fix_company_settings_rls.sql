-- Fix RLS policies for company_settings table
-- Enable RLS on company_settings table
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to delete company settings" ON company_settings;

-- Create new policies for company_settings table
-- Allow authenticated users to read all company settings
CREATE POLICY "Allow authenticated users to read company settings" ON company_settings
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert company settings
CREATE POLICY "Allow authenticated users to insert company settings" ON company_settings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update company settings
CREATE POLICY "Allow authenticated users to update company settings" ON company_settings
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete company settings
CREATE POLICY "Allow authenticated users to delete company settings" ON company_settings
FOR DELETE USING (auth.role() = 'authenticated');
