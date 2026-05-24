-- Run this in the Supabase Dashboard > SQL Editor
ALTER TABLE ai_usage
  ADD COLUMN IF NOT EXISTS script_count INTEGER NOT NULL DEFAULT 0;
