-- Create franchise_requests table for Google Forms integration
CREATE TABLE IF NOT EXISTS franchise_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_form_id TEXT,
  google_sheet_row_id TEXT,
  business_name TEXT,
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
