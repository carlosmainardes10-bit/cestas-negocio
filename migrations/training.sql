-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS training_lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position    INTEGER NOT NULL DEFAULT 0,
  title       TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  is_free     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('image', 'pdf')),
  storage_path TEXT NOT NULL,
  name         TEXT NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_lessons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read lessons"    ON training_lessons    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth read materials"  ON training_materials  FOR SELECT USING (auth.role() = 'authenticated');

-- Storage bucket: create manually in Supabase Dashboard > Storage
-- Name: training  |  Public: true
