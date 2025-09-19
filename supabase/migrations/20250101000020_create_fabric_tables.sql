-- Fabrics master tables

-- Parent table: fabrics (one per fabric name/type/gsm/uom/supplier/price)
CREATE TABLE IF NOT EXISTS fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_name TEXT NOT NULL,
  fabric_type TEXT,
  gsm INTEGER,
  uom TEXT,
  price NUMERIC,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Child table: fabric_colors (variants per color)
CREATE TABLE IF NOT EXISTS fabric_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID NOT NULL REFERENCES fabrics(id) ON DELETE CASCADE,
  code TEXT,
  color TEXT,
  hex_code TEXT,
  image_url TEXT,
  main_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_fabrics_fabric_name ON fabrics(fabric_name);
CREATE INDEX IF NOT EXISTS idx_fabric_colors_fabric_id ON fabric_colors(fabric_id);

-- Enable RLS
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_colors ENABLE ROW LEVEL SECURITY;

-- Policies: allow authenticated CRUD, public read
-- Fabrics
DROP POLICY IF EXISTS "fabrics_select_auth" ON fabrics;
DROP POLICY IF EXISTS "fabrics_insert_auth" ON fabrics;
DROP POLICY IF EXISTS "fabrics_update_auth" ON fabrics;
DROP POLICY IF EXISTS "fabrics_delete_auth" ON fabrics;

CREATE POLICY "fabrics_select_auth" ON fabrics FOR SELECT USING (true);
CREATE POLICY "fabrics_insert_auth" ON fabrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "fabrics_update_auth" ON fabrics FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "fabrics_delete_auth" ON fabrics FOR DELETE USING (auth.role() = 'authenticated');

-- Fabric Colors
DROP POLICY IF EXISTS "fabric_colors_select_auth" ON fabric_colors;
DROP POLICY IF EXISTS "fabric_colors_insert_auth" ON fabric_colors;
DROP POLICY IF EXISTS "fabric_colors_update_auth" ON fabric_colors;
DROP POLICY IF EXISTS "fabric_colors_delete_auth" ON fabric_colors;

CREATE POLICY "fabric_colors_select_auth" ON fabric_colors FOR SELECT USING (true);
CREATE POLICY "fabric_colors_insert_auth" ON fabric_colors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "fabric_colors_update_auth" ON fabric_colors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "fabric_colors_delete_auth" ON fabric_colors FOR DELETE USING (auth.role() = 'authenticated');
