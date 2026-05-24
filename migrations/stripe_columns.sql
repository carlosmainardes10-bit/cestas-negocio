-- Run this in the Supabase Dashboard > SQL Editor
-- Adds Stripe-related columns to the users table

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
