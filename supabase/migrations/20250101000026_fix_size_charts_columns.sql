-- Fix size_charts table columns to match the application
-- First, let's check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS size_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_type_id UUID NOT NULL REFERENCES size_types(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  neck NUMERIC,
  chest NUMERIC,
  length NUMERIC,
  front_leg_length NUMERIC,
  back_leg_length NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- If the table exists but has wrong column names, we need to fix them
-- This will handle the case where columns might have different names
DO $$
BEGIN
  -- Check if chest_circumference exists and rename it to chest
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'size_charts' AND column_name = 'chest_circumference') THEN
    ALTER TABLE size_charts RENAME COLUMN chest_circumference TO chest;
  END IF;
  
  -- Check if neck_circumference exists and rename it to neck
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'size_charts' AND column_name = 'neck_circumference') THEN
    ALTER TABLE size_charts RENAME COLUMN neck_circumference TO neck;
  END IF;
  
  -- Check if body_length exists and rename it to length
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'size_charts' AND column_name = 'body_length') THEN
    ALTER TABLE size_charts RENAME COLUMN body_length TO length;
  END IF;
  
  -- Check if size_name exists and rename it to size
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'size_charts' AND column_name = 'size_name') THEN
    ALTER TABLE size_charts RENAME COLUMN size_name TO size;
  END IF;
END $$;

-- Add any missing columns
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS neck NUMERIC;
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS chest NUMERIC;
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS length NUMERIC;
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS front_leg_length NUMERIC;
ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS back_leg_length NUMERIC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_size_charts_size_type_id ON size_charts(size_type_id);

-- Enable RLS
ALTER TABLE size_charts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON size_charts;
CREATE POLICY "Enable read access for all users" ON size_charts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON size_charts;
CREATE POLICY "Enable insert for authenticated users only" ON size_charts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON size_charts;
CREATE POLICY "Enable update for authenticated users only" ON size_charts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON size_charts;
CREATE POLICY "Enable delete for authenticated users only" ON size_charts FOR DELETE USING (true);
