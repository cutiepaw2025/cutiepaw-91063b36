-- Add missing logo-related fields to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS auth_logo_url TEXT,
ADD COLUMN IF NOT EXISTS sidebar_logo_url TEXT,
ADD COLUMN IF NOT EXISTS header_logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_size_auth INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS logo_size_header INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS logo_size_sidebar INTEGER DEFAULT 28;

-- Update existing records to have default values for new fields
UPDATE company_settings 
SET 
  auth_logo_url = COALESCE(auth_logo_url, NULL),
  sidebar_logo_url = COALESCE(sidebar_logo_url, NULL),
  header_logo_url = COALESCE(header_logo_url, NULL),
  logo_size_auth = COALESCE(logo_size_auth, 48),
  logo_size_header = COALESCE(logo_size_header, 24),
  logo_size_sidebar = COALESCE(logo_size_sidebar, 28)
WHERE auth_logo_url IS NULL;
