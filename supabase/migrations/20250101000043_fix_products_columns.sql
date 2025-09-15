-- Normalize products table columns to snake_case if previous table was created with quoted CSV headers
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table if missing
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
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

-- Conditionally rename legacy columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='SKU') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "SKU" TO sku';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Size') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "Size" TO size';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Class Name') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "Class Name" TO class_name';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Color') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "Color" TO color';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Brand') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "Brand" TO brand';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Category') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "Category" TO category';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Hsn') THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN "Hsn" TO hsn';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Gst %') THEN
    -- rename then cast later if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='gst_percent') THEN
      EXECUTE 'ALTER TABLE products ADD COLUMN gst_percent numeric(5,2)';
    END IF;
    -- copy data (text) to numeric column
    EXECUTE 'UPDATE products SET gst_percent = NULLIF("Gst %", '''')::numeric(5,2) WHERE "Gst %" IS NOT NULL';
    -- drop legacy column
    EXECUTE 'ALTER TABLE products DROP COLUMN "Gst %"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Mrp') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='mrp') THEN
      EXECUTE 'ALTER TABLE products ADD COLUMN mrp numeric(12,2)';
    END IF;
    EXECUTE 'UPDATE products SET mrp = NULLIF("Mrp", '''')::numeric(12,2) WHERE "Mrp" IS NOT NULL';
    EXECUTE 'ALTER TABLE products DROP COLUMN "Mrp"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Cost Price') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='cost_price') THEN
      EXECUTE 'ALTER TABLE products ADD COLUMN cost_price numeric(12,2)';
    END IF;
    EXECUTE 'UPDATE products SET cost_price = NULLIF("Cost Price", '''')::numeric(12,2) WHERE "Cost Price" IS NOT NULL';
    EXECUTE 'ALTER TABLE products DROP COLUMN "Cost Price"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Selling Price') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='selling_price') THEN
      EXECUTE 'ALTER TABLE products ADD COLUMN selling_price numeric(12,2)';
    END IF;
    EXECUTE 'UPDATE products SET selling_price = NULLIF("Selling Price", '''')::numeric(12,2) WHERE "Selling Price" IS NOT NULL';
    EXECUTE 'ALTER TABLE products DROP COLUMN "Selling Price"';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='Image') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_url') THEN
      EXECUTE 'ALTER TABLE products ADD COLUMN image_url text';
    END IF;
    EXECUTE 'UPDATE products SET image_url = NULLIF("Image", '''') WHERE "Image" IS NOT NULL';
    EXECUTE 'ALTER TABLE products DROP COLUMN "Image"';
  END IF;
END
$$;

-- Ensure NOT NULL/DEFAULT/constraints where appropriate
ALTER TABLE products
  ALTER COLUMN gst_percent SET DEFAULT 0,
  ALTER COLUMN mrp SET DEFAULT 0,
  ALTER COLUMN cost_price SET DEFAULT 0,
  ALTER COLUMN selling_price SET DEFAULT 0;

-- Recreate helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_color ON products (color);
CREATE INDEX IF NOT EXISTS idx_products_class_name ON products (class_name);

-- RLS (idempotent)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_select_authenticated'
  ) THEN
    CREATE POLICY products_select_authenticated ON products FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_insert_authenticated'
  ) THEN
    CREATE POLICY products_insert_authenticated ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_update_authenticated'
  ) THEN
    CREATE POLICY products_update_authenticated ON products FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'products_delete_authenticated'
  ) THEN
    CREATE POLICY products_delete_authenticated ON products FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- updated_at trigger
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
