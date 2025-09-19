-- Products master table
-- Columns from the sheet: SKU, Size, Class Name, Color, Brand, Category, Hsn, Gst %, Mrp, Cost Price, Selling Price, Image

-- Enable pgcrypto for gen_random_uuid if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  size text,
  class_name text,
  color text,
  brand text,
  category text,
  hsn text,
  gst_percent numeric(5,2) DEFAULT 0 CHECK (gst_percent >= 0),
  mrp numeric(12,2) DEFAULT 0 CHECK (mrp >= 0),
  cost_price numeric(12,2) DEFAULT 0 CHECK (cost_price >= 0),
  selling_price numeric(12,2) DEFAULT 0 CHECK (selling_price >= 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_color ON products (color);
CREATE INDEX IF NOT EXISTS idx_products_class_name ON products (class_name);

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policies (adjust as needed).
-- Read for authenticated users
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert for authenticated users
CREATE POLICY "products_insert_authenticated" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update for authenticated users
CREATE POLICY "products_update_authenticated" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Delete for authenticated users
CREATE POLICY "products_delete_authenticated" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_timestamp ON products;
CREATE TRIGGER set_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();

-- Optional: seed categories/brands can be handled elsewhere. This file focuses on structure.
