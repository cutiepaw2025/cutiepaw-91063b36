-- Staging table that matches your CSV headers exactly (case-sensitive, quoted)
CREATE TABLE IF NOT EXISTS products_import_raw (
  "SKU" text,
  "Size" text,
  "Class Name" text,
  "Color" text,
  "Brand" text,
  "Category" text,
  "Hsn" text,
  "Gst %" text,
  "Mrp" text,
  "Cost Price" text,
  "Selling Price" text,
  "Image" text,
  imported_at timestamptz DEFAULT now()
);

-- Simple view for quick preview (optional)
CREATE OR REPLACE VIEW products_import_preview AS
SELECT
  "SKU"              AS sku,
  "Size"             AS size,
  "Class Name"       AS class_name,
  "Color"            AS color,
  "Brand"            AS brand,
  "Category"         AS category,
  "Hsn"              AS hsn,
  NULLIF("Gst %", '')::numeric(5,2)      AS gst_percent,
  NULLIF("Mrp", '')::numeric(12,2)       AS mrp,
  NULLIF("Cost Price", '')::numeric(12,2) AS cost_price,
  NULLIF("Selling Price", '')::numeric(12,2) AS selling_price,
  "Image"            AS image_url,
  imported_at
FROM products_import_raw;

-- Function to load from staging into products (UPSERT on sku)
CREATE OR REPLACE FUNCTION load_products_from_staging()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO products (
    sku, size, class_name, color, brand, category, hsn,
    gst_percent, mrp, cost_price, selling_price, image_url
  )
  SELECT
    trim("SKU"),
    NULLIF(trim("Size"), ''),
    NULLIF(trim("Class Name"), ''),
    NULLIF(trim("Color"), ''),
    NULLIF(trim("Brand"), ''),
    NULLIF(trim("Category"), ''),
    NULLIF(trim("Hsn"), ''),
    COALESCE(NULLIF(trim("Gst %"), '')::numeric(5,2), 0),
    COALESCE(NULLIF(trim("Mrp"), '')::numeric(12,2), 0),
    COALESCE(NULLIF(trim("Cost Price"), '')::numeric(12,2), 0),
    COALESCE(NULLIF(trim("Selling Price"), '')::numeric(12,2), 0),
    NULLIF(trim("Image"), '')
  FROM products_import_raw pir
  WHERE trim("SKU") IS NOT NULL AND trim("SKU") <> ''
  ON CONFLICT (sku) DO UPDATE SET
    size = EXCLUDED.size,
    class_name = EXCLUDED.class_name,
    color = EXCLUDED.color,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    hsn = EXCLUDED.hsn,
    gst_percent = EXCLUDED.gst_percent,
    mrp = EXCLUDED.mrp,
    cost_price = EXCLUDED.cost_price,
    selling_price = EXCLUDED.selling_price,
    image_url = EXCLUDED.image_url,
    updated_at = now();
END;
$$;

-- RLS for staging: allow authenticated read/write
ALTER TABLE products_import_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_import_raw_select ON products_import_raw
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY products_import_raw_insert ON products_import_raw
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY products_import_raw_update ON products_import_raw
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY products_import_raw_delete ON products_import_raw
  FOR DELETE USING (auth.role() = 'authenticated');
