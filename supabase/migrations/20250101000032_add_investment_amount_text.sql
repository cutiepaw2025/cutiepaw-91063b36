-- Add investment_amount_text field to franchise_requests table
ALTER TABLE franchise_requests 
ADD COLUMN IF NOT EXISTS investment_amount_text TEXT;

-- Update RLS policy to include the new field
DROP POLICY IF EXISTS "Enable read access for all users" ON franchise_requests;
CREATE POLICY "Enable read access for all users" ON franchise_requests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON franchise_requests;
CREATE POLICY "Enable insert for authenticated users only" ON franchise_requests
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON franchise_requests;
CREATE POLICY "Enable update for authenticated users only" ON franchise_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON franchise_requests;
CREATE POLICY "Enable delete for authenticated users only" ON franchise_requests
    FOR DELETE USING (auth.role() = 'authenticated');
