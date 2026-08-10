-- scripts/20260807_create_user_preferences_table.sql
-- Creates a table to store per-user UI preferences (JSONB)
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- trigger to update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON user_preferences;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- RLS policy example (requires enabling RLS on the table and supabase auth)
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage their preferences" ON user_preferences
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
