-- Create pet_breeds table
CREATE TABLE IF NOT EXISTS pet_breeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breed_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat')), -- dog or cat
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create size_types table
CREATE TABLE IF NOT EXISTS size_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_type_name TEXT NOT NULL,
  pet_type TEXT NOT NULL CHECK (pet_type IN ('dog', 'cat')), -- dog or cat
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create size_charts table
CREATE TABLE IF NOT EXISTS size_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_type_id UUID NOT NULL REFERENCES size_types(id) ON DELETE CASCADE,
  size TEXT NOT NULL, -- e.g., XS, S, M, L, XL
  neck NUMERIC, -- in cm
  chest NUMERIC, -- in cm
  length NUMERIC, -- in cm
  front_leg_length NUMERIC, -- in cm
  back_leg_length NUMERIC, -- in cm
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pet_breeds_pet_type ON pet_breeds(pet_type);
CREATE INDEX IF NOT EXISTS idx_pet_breeds_name ON pet_breeds(breed_name);
CREATE INDEX IF NOT EXISTS idx_size_types_pet_type ON size_types(pet_type);
CREATE INDEX IF NOT EXISTS idx_size_charts_size_type_id ON size_charts(size_type_id);

-- Enable RLS
ALTER TABLE pet_breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;

-- Policies for pet_breeds
CREATE POLICY pet_breeds_select ON pet_breeds FOR SELECT USING (true);
CREATE POLICY pet_breeds_insert ON pet_breeds FOR INSERT WITH CHECK (true);
CREATE POLICY pet_breeds_update ON pet_breeds FOR UPDATE USING (true);
CREATE POLICY pet_breeds_delete ON pet_breeds FOR DELETE USING (true);

-- Policies for size_types
CREATE POLICY size_types_select ON size_types FOR SELECT USING (true);
CREATE POLICY size_types_insert ON size_types FOR INSERT WITH CHECK (true);
CREATE POLICY size_types_update ON size_types FOR UPDATE USING (true);
CREATE POLICY size_types_delete ON size_types FOR DELETE USING (true);

-- Policies for size_charts
CREATE POLICY size_charts_select ON size_charts FOR SELECT USING (true);
CREATE POLICY size_charts_insert ON size_charts FOR INSERT WITH CHECK (true);
CREATE POLICY size_charts_update ON size_charts FOR UPDATE USING (true);
CREATE POLICY size_charts_delete ON size_charts FOR DELETE USING (true);

-- Insert some sample pet breeds
INSERT INTO pet_breeds (breed_name, description, pet_type) VALUES
('Golden Retriever', 'Friendly and intelligent dog breed', 'dog'),
('Labrador Retriever', 'Popular family dog known for loyalty', 'dog'),
('German Shepherd', 'Intelligent and versatile working dog', 'dog'),
('Persian Cat', 'Long-haired cat breed with sweet personality', 'cat'),
('Maine Coon', 'Large domestic cat breed', 'cat'),
('Siamese Cat', 'Short-haired cat with distinctive coloring', 'cat');

-- Insert some sample size types
INSERT INTO size_types (size_type_name, pet_type, description) VALUES
('Small Dog Sizes', 'dog', 'Size chart for small dog breeds'),
('Medium Dog Sizes', 'dog', 'Size chart for medium dog breeds'),
('Large Dog Sizes', 'dog', 'Size chart for large dog breeds'),
('Cat Sizes', 'cat', 'Size chart for cat breeds');
