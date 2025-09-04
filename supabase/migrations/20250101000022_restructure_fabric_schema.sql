-- Drop existing fabric tables
DROP TABLE IF EXISTS fabric_colors CASCADE;
DROP TABLE IF EXISTS fabric_master CASCADE;
DROP TABLE IF EXISTS fabrics CASCADE;
DROP TABLE IF EXISTS fabric_variants CASCADE;

-- Create fabrics table (basic fabric info)
CREATE TABLE IF NOT EXISTS fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_code TEXT UNIQUE NOT NULL,           -- e.g., COTTON, POLYESTER
  fabric_name TEXT NOT NULL,                  -- e.g., Cotton Fabric
  fabric_type TEXT,                           -- e.g., Natural, Synthetic
  image_url TEXT,                             -- fabric image
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fabric_variants table (specific variants with color, GSM, etc.)
CREATE TABLE IF NOT EXISTS fabric_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID NOT NULL REFERENCES fabrics(id) ON DELETE CASCADE,
  variant_code TEXT UNIQUE NOT NULL,          -- FABRIC+COLOR+GSM format, e.g., COTTON+BLACK+180
  color TEXT NOT NULL,                        -- e.g., BLACK, WHITE, RED
  gsm INTEGER NOT NULL,                       -- e.g., 180, 200, 250
  uom TEXT,                                   -- e.g., KGS, MTR
  price NUMERIC,                              -- e.g., 343.50
  supplier TEXT,                              -- e.g., Supplier A
  description TEXT,                           -- long description
  hex_code TEXT,                              -- e.g., #000000
  image_url TEXT,                             -- variant image
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fabrics_name ON fabrics(fabric_name);
CREATE INDEX IF NOT EXISTS idx_fabrics_code ON fabrics(fabric_code);
CREATE INDEX IF NOT EXISTS idx_fabric_variants_fabric_id ON fabric_variants(fabric_id);
CREATE INDEX IF NOT EXISTS idx_fabric_variants_code ON fabric_variants(variant_code);

-- Enable RLS
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_variants ENABLE ROW LEVEL SECURITY;

-- Policies: public read, authenticated write
-- fabrics
DROP POLICY IF EXISTS fabrics_select ON fabrics;
DROP POLICY IF EXISTS fabrics_insert ON fabrics;
DROP POLICY IF EXISTS fabrics_update ON fabrics;
DROP POLICY IF EXISTS fabrics_delete ON fabrics;

CREATE POLICY fabrics_select ON fabrics FOR SELECT USING (true);
CREATE POLICY fabrics_insert ON fabrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY fabrics_update ON fabrics FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY fabrics_delete ON fabrics FOR DELETE USING (auth.role() = 'authenticated');

-- fabric_variants
DROP POLICY IF EXISTS fabric_variants_select ON fabric_variants;
DROP POLICY IF EXISTS fabric_variants_insert ON fabric_variants;
DROP POLICY IF EXISTS fabric_variants_update ON fabric_variants;
DROP POLICY IF EXISTS fabric_variants_delete ON fabric_variants;

CREATE POLICY fabric_variants_select ON fabric_variants FOR SELECT USING (true);
CREATE POLICY fabric_variants_insert ON fabric_variants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY fabric_variants_update ON fabric_variants FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY fabric_variants_delete ON fabric_variants FOR DELETE USING (auth.role() = 'authenticated');

-- Storage RLS for bucket "fabric" (bucket already exists per user)
-- These policies allow public read and authenticated write scoped to bucket 'fabric'
DROP POLICY IF EXISTS "fabric_bucket_insert" ON storage.objects;
DROP POLICY IF EXISTS "fabric_bucket_select" ON storage.objects;
DROP POLICY IF EXISTS "fabric_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "fabric_bucket_delete" ON storage.objects;

CREATE POLICY "fabric_bucket_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fabric' AND auth.role() = 'authenticated');

CREATE POLICY "fabric_bucket_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'fabric');

CREATE POLICY "fabric_bucket_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fabric' AND auth.role() = 'authenticated');

CREATE POLICY "fabric_bucket_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'fabric' AND auth.role() = 'authenticated');
