-- Drop legacy tables if present
DROP TABLE IF EXISTS fabric_colors CASCADE;
DROP TABLE IF EXISTS fabrics CASCADE;
DROP TABLE IF EXISTS fabric_master CASCADE;

-- New schema: fabric_master (group) and fabric_colors (variants)
-- Use code as the primary key (TEXT)

CREATE TABLE IF NOT EXISTS fabric_master (
  id TEXT PRIMARY KEY,                 -- code used as id, e.g., DK-180
  fabric_name TEXT NOT NULL,           -- e.g., DOT KNIT
  fabric_type TEXT,                    -- e.g., Polyester
  gsm INTEGER,                         -- e.g., 180
  uom TEXT,                            -- e.g., KGS
  price NUMERIC,                       -- e.g., 343
  supplier TEXT,                       -- e.g., Supplier name
  main_image_url TEXT,                 -- card left image
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fabric_colors (
  id TEXT PRIMARY KEY,                 -- code-color, e.g., DK-180-BL
  fabric_id TEXT NOT NULL REFERENCES fabric_master(id) ON DELETE CASCADE,
  description TEXT,                    -- long description
  color TEXT,                          -- e.g., BLACK
  hex_code TEXT,                       -- e.g., #000000
  image_url TEXT,                      -- color image
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fabric_master_name ON fabric_master(fabric_name);
CREATE INDEX IF NOT EXISTS idx_fabric_colors_fabric_id ON fabric_colors(fabric_id);

-- Enable RLS
ALTER TABLE fabric_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_colors ENABLE ROW LEVEL SECURITY;

-- Policies: public read, authenticated write
-- fabric_master
DROP POLICY IF EXISTS fabric_master_select ON fabric_master;
DROP POLICY IF EXISTS fabric_master_insert ON fabric_master;
DROP POLICY IF EXISTS fabric_master_update ON fabric_master;
DROP POLICY IF EXISTS fabric_master_delete ON fabric_master;

CREATE POLICY fabric_master_select ON fabric_master FOR SELECT USING (true);
CREATE POLICY fabric_master_insert ON fabric_master FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY fabric_master_update ON fabric_master FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY fabric_master_delete ON fabric_master FOR DELETE USING (auth.role() = 'authenticated');

-- fabric_colors
DROP POLICY IF EXISTS fabric_colors_select ON fabric_colors;
DROP POLICY IF EXISTS fabric_colors_insert ON fabric_colors;
DROP POLICY IF EXISTS fabric_colors_update ON fabric_colors;
DROP POLICY IF EXISTS fabric_colors_delete ON fabric_colors;

CREATE POLICY fabric_colors_select ON fabric_colors FOR SELECT USING (true);
CREATE POLICY fabric_colors_insert ON fabric_colors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY fabric_colors_update ON fabric_colors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY fabric_colors_delete ON fabric_colors FOR DELETE USING (auth.role() = 'authenticated');

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
