-- Create API integrations table
CREATE TABLE IF NOT EXISTS api_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  webhook_url TEXT,
  base_url TEXT,
  store_id VARCHAR(100),
  marketplace_id VARCHAR(100),
  additional_config TEXT,
  last_sync TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'disconnected' CHECK (sync_status IN ('connected', 'disconnected', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all integrations
CREATE POLICY "Authenticated users can read api integrations" ON api_integrations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert integrations
CREATE POLICY "Authenticated users can insert api integrations" ON api_integrations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update integrations
CREATE POLICY "Authenticated users can update api integrations" ON api_integrations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete integrations
CREATE POLICY "Authenticated users can delete api integrations" ON api_integrations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_integrations_updated_at
  BEFORE UPDATE ON api_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default platform configurations
INSERT INTO api_integrations (platform, is_enabled) VALUES
  ('shopify', false),
  ('amazon', false),
  ('flipkart', false),
  ('jiomart', false),
  ('ajio', false),
  ('myntra', false),
  ('unicommerce', false)
ON CONFLICT (platform) DO NOTHING;
