-- =============================================================================
-- Quro — Initial Database Schema
-- Migration: 001_initial_schema.sql
--
-- Run via Supabase CLI: supabase db push
-- Or paste into the Supabase SQL Editor in your project dashboard.
--
-- Schema Overview:
--   profiles          → User identity, Quro ID, avatar, public key
--   friendships       → Bidirectional friendship graph with status
--   conversations     → 1-on-1 and future group conversations
--   conversation_members → Join table (user ↔ conversation)
--   messages          → E2EE encrypted message blobs (server sees only ciphertext)
--   desktop_sessions  → Short-lived QR login sessions for desktop handshake
--   scan_log          → Audit trail of all QR scans (Security Center)
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
-- gen_random_uuid() is already available in Supabase via pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- One profile per authenticated user. Created immediately after OTP verification.
-- The public_key (Curve25519) is essential for E2EE — it is set during onboarding
-- and MUST be present before any messages can be sent.

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quro_id       VARCHAR(5) NOT NULL,
  display_name  TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 50),
  avatar_url    TEXT,
  gender        TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not')),
  birthday      DATE,
  -- Curve25519 public key, base64url encoded (43 chars)
  public_key    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on Quro ID — enforced here AND validated app-side
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_quro_id_unique UNIQUE (quro_id);

-- Index for fast Quro ID lookups (friend search, scanner routing)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_quro_id_idx ON public.profiles (quro_id);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create a stub profile entry when a new auth user is created.
-- The app fills in quro_id, display_name, public_key during onboarding.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- We do NOT insert here because public_key is NOT NULL.
  -- Onboarding flow inserts the full profile after key generation.
  -- This trigger exists for future use (e.g., setting default preferences).
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── FRIENDSHIPS ──────────────────────────────────────────────────────────────
-- Bidirectional friendship graph.
-- Convention: user_a UUID < user_b UUID (enforced via constraint)
-- so each pair has exactly one row regardless of who initiated.

CREATE TABLE IF NOT EXISTS public.friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- 'pending' → user_a sent request, awaiting user_b
  -- 'accepted' → both users are friends
  -- 'blocked' → user_a blocked user_b (one-directional, directional awareness via separate flag if needed)
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'blocked')),
  -- Who initiated (in case of pending)
  initiated_by  UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce canonical ordering: user_a < user_b for deduplication
  CONSTRAINT friendships_canonical_order CHECK (user_a < user_b),
  -- Exactly one row per pair
  CONSTRAINT friendships_unique_pair UNIQUE (user_a, user_b)
);

-- Indexes for fast friend list queries
CREATE INDEX IF NOT EXISTS friendships_user_a_idx ON public.friendships (user_a, status);
CREATE INDEX IF NOT EXISTS friendships_user_b_idx ON public.friendships (user_b, status);

-- ── CONVERSATIONS ─────────────────────────────────────────────────────────────
-- Currently supports 1:1 chats. Structure supports future group expansion.

CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Future: type TEXT CHECK (type IN ('direct', 'group')) DEFAULT 'direct'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONVERSATION MEMBERS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- last_read_at tracks unread message counts (client-side approximation)
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

-- Fast lookup: "which conversations is this user in?"
CREATE INDEX IF NOT EXISTS conv_members_user_idx
  ON public.conversation_members (user_id);

-- ── MESSAGES ─────────────────────────────────────────────────────────────────
-- Encrypted message blobs only. Server never processes or stores plaintext.
-- The (ciphertext, iv, tag) triad must ALWAYS be treated as an atomic unit.

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- AES-256-GCM encrypted message content (base64url)
  ciphertext      TEXT NOT NULL,
  -- 12-byte nonce — unique per message (base64url, ~16 chars)
  iv              TEXT NOT NULL,
  -- 16-byte GCM authentication tag (base64url, ~22 chars)
  tag             TEXT NOT NULL,
  -- Server-side delivery status only (not read receipts — that's client-side)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Most common query: fetch messages for a conversation in chronological order
CREATE INDEX IF NOT EXISTS messages_conv_created_idx
  ON public.messages (conversation_id, created_at ASC);

-- Track sender for decryption routing
CREATE INDEX IF NOT EXISTS messages_sender_idx
  ON public.messages (sender_id);

-- ── DESKTOP SESSIONS ──────────────────────────────────────────────────────────
-- Short-lived sessions for the QR-based desktop login flow.
-- Lifecycle:
--   1. Desktop generates token → INSERT row (user_id NULL, is_active FALSE)
--   2. Mobile scans QR → UPDATE: set user_id, device_info, is_active TRUE
--   3. Desktop receives Realtime event → auth completes
--   4. Cleanup job deletes rows past expires_at

CREATE TABLE IF NOT EXISTS public.desktop_sessions (
  session_token   TEXT PRIMARY KEY,       -- 32-byte hex (64 chars)
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  -- JSONB: { platform, deviceModel, appVersion, ipAddress }
  device_info     JSONB
);

-- Cleanup: index on expires_at for efficient sweeping of stale sessions
CREATE INDEX IF NOT EXISTS desktop_sessions_expires_idx
  ON public.desktop_sessions (expires_at);

-- Auto-delete expired sessions (run as a Supabase pg_cron job if available,
-- otherwise the app cleans up on new session creation)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.desktop_sessions
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ── SCAN LOG ─────────────────────────────────────────────────────────────────
-- Audit trail powering the Security Center dashboard.
-- Records every QR scan action for transparency and remote revocation.

CREATE TABLE IF NOT EXISTS public.scan_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scanned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 'friend_add'     → User scanned another user's personal QR code
  -- 'desktop_login'  → User scanned the desktop web app QR code
  scan_type     TEXT NOT NULL CHECK (scan_type IN ('friend_add', 'desktop_login')),
  -- Flexible metadata:
  -- friend_add:     { targetQuroId, targetUserId, resultConversationId }
  -- desktop_login:  { sessionToken, deviceInfo, ipAddress }
  metadata      JSONB
);

-- Fast lookup: user's own scan history, newest first
CREATE INDEX IF NOT EXISTS scan_log_user_idx
  ON public.scan_log (user_id, scanned_at DESC);

-- ── STORAGE BUCKETS ──────────────────────────────────────────────────────────
-- Configure via Supabase Dashboard > Storage, or via CLI.
-- Listed here as documentation.
--
-- Bucket: "avatars"
--   - Public: YES (avatar images are public by URL)
--   - Allowed MIME types: image/jpeg, image/png, image/webp
--   - Max file size: 5MB
--   - Path: {user_id}/{filename}
--
-- Example Supabase CLI command (run separately):
-- supabase storage create avatars --public
