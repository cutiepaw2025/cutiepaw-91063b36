-- Create product_categories storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product_categories',
  'product_categories',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/*']
) ON CONFLICT (id) DO NOTHING;

-- Create product_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_subcategories table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_subcategories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_categories
DROP POLICY IF EXISTS "Allow authenticated users to read product categories" ON product_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert product categories" ON product_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update product categories" ON product_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete product categories" ON product_categories;

CREATE POLICY "Allow authenticated users to read product categories" ON product_categories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert product categories" ON product_categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product categories" ON product_categories
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product categories" ON product_categories
FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for product_subcategories
DROP POLICY IF EXISTS "Allow authenticated users to read product subcategories" ON product_subcategories;
DROP POLICY IF EXISTS "Allow authenticated users to insert product subcategories" ON product_subcategories;
DROP POLICY IF EXISTS "Allow authenticated users to update product subcategories" ON product_subcategories;
DROP POLICY IF EXISTS "Allow authenticated users to delete product subcategories" ON product_subcategories;

CREATE POLICY "Allow authenticated users to read product subcategories" ON product_subcategories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert product subcategories" ON product_subcategories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product subcategories" ON product_subcategories
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product subcategories" ON product_subcategories
FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for product_categories storage bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to product_categories" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product_categories" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to product_categories" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from product_categories" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to product_categories" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product_categories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access to product_categories" ON storage.objects
FOR SELECT USING (bucket_id = 'product_categories');

CREATE POLICY "Allow authenticated updates to product_categories" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product_categories' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated deletes from product_categories" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product_categories' 
  AND auth.role() = 'authenticated'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_categories_created_at ON product_categories(created_at);
CREATE INDEX IF NOT EXISTS idx_product_subcategories_category_id ON product_subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_subcategories_created_at ON product_subcategories(created_at);
