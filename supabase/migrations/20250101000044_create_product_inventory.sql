CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES product_master(id) ON DELETE CASCADE,
  sku text NOT NULL,
  facility text, -- e.g., WH1
  source text DEFAULT 'manual', -- 'manual' | 'unicommerce'
  quantity_available integer NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  snapshot_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sku, facility, source)
);

CREATE INDEX IF NOT EXISTS idx_product_inventory_sku ON product_inventory (sku);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product_id ON product_inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_facility ON product_inventory (facility);

ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_inventory' AND policyname='product_inventory_select_auth'
  ) THEN
    CREATE POLICY product_inventory_select_auth ON product_inventory FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_inventory' AND policyname='product_inventory_insert_auth'
  ) THEN
    CREATE POLICY product_inventory_insert_auth ON product_inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_inventory' AND policyname='product_inventory_update_auth'
  ) THEN
    CREATE POLICY product_inventory_update_auth ON product_inventory FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_inventory' AND policyname='product_inventory_delete_auth'
  ) THEN
    CREATE POLICY product_inventory_delete_auth ON product_inventory FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END$$;

CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_product_inventory_timestamp ON product_inventory;
CREATE TRIGGER set_product_inventory_timestamp
BEFORE UPDATE ON product_inventory
FOR EACH ROW
EXECUTE FUNCTION set_timestamp();
