-- Add missing columns to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS company_city TEXT,
ADD COLUMN IF NOT EXISTS company_state TEXT,
ADD COLUMN IF NOT EXISTS company_pincode TEXT,
ADD COLUMN IF NOT EXISTS company_gstin TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_size_favicon INTEGER DEFAULT 32;

-- Update existing records to have default values for new fields
UPDATE company_settings 
SET 
  company_city = COALESCE(company_city, ''),
  company_state = COALESCE(company_state, ''),
  company_pincode = COALESCE(company_pincode, ''),
  company_gstin = COALESCE(company_gstin, ''),
  bank_name = COALESCE(bank_name, ''),
  account_number = COALESCE(account_number, ''),
  ifsc_code = COALESCE(ifsc_code, ''),
  branch = COALESCE(branch, ''),
  logo_size_favicon = COALESCE(logo_size_favicon, 32)
WHERE company_city IS NULL;
