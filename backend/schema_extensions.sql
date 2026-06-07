-- Quro Shield — Supabase Schema Extensions
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- OTP codes for email recovery
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_email_code ON otp_codes(email, code);

-- Gender field on users (if not already present)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Group chat support
DO $$ BEGIN
  ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;
  ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_name TEXT;
  ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_avatar_url TEXT;
  ALTER TABLE conversations ADD COLUMN IF NOT EXISTS member_ids TEXT[];
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Row Level Security for OTP codes (service role only)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTP codes
CREATE POLICY IF NOT EXISTS "Service role manages OTP codes"
  ON otp_codes
  FOR ALL
  USING (true)
  WITH CHECK (true);
