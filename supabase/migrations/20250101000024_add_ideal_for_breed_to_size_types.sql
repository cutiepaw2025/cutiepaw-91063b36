-- Add ideal_for_breed_id field to size_types table
ALTER TABLE size_types 
ADD COLUMN ideal_for_breed_id UUID REFERENCES pet_breeds(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_size_types_ideal_for_breed_id ON size_types(ideal_for_breed_id);

-- Update RLS policy to include the new field
DROP POLICY IF EXISTS "Enable read access for all users" ON size_types;
CREATE POLICY "Enable read access for all users" ON size_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON size_types;
CREATE POLICY "Enable insert for authenticated users only" ON size_types FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON size_types;
CREATE POLICY "Enable update for authenticated users only" ON size_types FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON size_types;
CREATE POLICY "Enable delete for authenticated users only" ON size_types FOR DELETE USING (true);
