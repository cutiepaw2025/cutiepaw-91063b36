-- Update ideal_for_breed_id to support multiple breeds as an array
-- First, drop the existing column and its index
ALTER TABLE size_types DROP COLUMN IF EXISTS ideal_for_breed_id;
DROP INDEX IF EXISTS idx_size_types_ideal_for_breed_id;

-- Add the new array column
ALTER TABLE size_types 
ADD COLUMN ideal_for_breed_ids UUID[];

-- Add index for better performance on array operations
CREATE INDEX IF NOT EXISTS idx_size_types_ideal_for_breed_ids ON size_types USING GIN(ideal_for_breed_ids);

-- Update RLS policy to include the new field
DROP POLICY IF EXISTS "Enable read access for all users" ON size_types;
CREATE POLICY "Enable read access for all users" ON size_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON size_types;
CREATE POLICY "Enable insert for authenticated users only" ON size_types FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON size_types;
CREATE POLICY "Enable update for authenticated users only" ON size_types FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON size_types;
CREATE POLICY "Enable delete for authenticated users only" ON size_types FOR DELETE USING (true);
