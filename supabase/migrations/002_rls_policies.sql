-- =============================================================================
-- Quro — Row Level Security Policies
-- Migration: 002_rls_policies.sql
--
-- RLS ensures users can ONLY access their own data and data they are
-- explicitly granted access to via friendships/conversations.
--
-- Principle: Default DENY. Every table is locked down, then selectively opened.
-- =============================================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desktop_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_log           ENABLE ROW LEVEL SECURITY;

-- ── Helper: current authenticated user's UUID ────────────────────────────────
-- auth.uid() returns the UUID of the currently authenticated user.

-- ── PROFILES ─────────────────────────────────────────────────────────────────

-- Anyone authenticated can view any profile (needed for Quro ID search & friend add)
CREATE POLICY "profiles: authenticated users can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only INSERT their own profile (enforced by matching auth.uid())
CREATE POLICY "profiles: users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users can only UPDATE their own profile
CREATE POLICY "profiles: users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users cannot delete profiles (soft delete via auth.users if needed)

-- ── FRIENDSHIPS ───────────────────────────────────────────────────────────────

-- Users can see friendships they are party to
CREATE POLICY "friendships: users can view own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- Users can send friend requests (INSERT where they are user_a or user_b)
CREATE POLICY "friendships: users can initiate friendships"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

-- Users can update friendships they are party to (accept, block)
CREATE POLICY "friendships: users can update own friendships"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- Users can delete friendships they are party to
CREATE POLICY "friendships: users can delete own friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- ── CONVERSATIONS ─────────────────────────────────────────────────────────────

-- Users can only see conversations they are members of
CREATE POLICY "conversations: members can view"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id
        AND cm.user_id = auth.uid()
    )
  );

-- Authenticated users can create conversations
CREATE POLICY "conversations: authenticated can create"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── CONVERSATION MEMBERS ──────────────────────────────────────────────────────

-- Members can see who else is in their conversations
CREATE POLICY "conv_members: users can view members of own conversations"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id
        AND cm2.user_id = auth.uid()
    )
  );

-- Users can add themselves to conversations
CREATE POLICY "conv_members: users can join conversations"
  ON public.conversation_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own membership (e.g., last_read_at)
CREATE POLICY "conv_members: users can update own membership"
  ON public.conversation_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ── MESSAGES ─────────────────────────────────────────────────────────────────

-- Users can only read messages from conversations they belong to
CREATE POLICY "messages: members can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

-- Users can only send messages to conversations they belong to
CREATE POLICY "messages: members can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

-- Messages are immutable — no UPDATE or DELETE (for E2EE audit integrity)
-- To "delete" a message, the client renders it as "[Message deleted]" locally.

-- ── DESKTOP SESSIONS ──────────────────────────────────────────────────────────

-- Anyone can INSERT a desktop session (desktop browser creates it, unauthenticated)
-- We use the service role key in the API route for this.
CREATE POLICY "desktop_sessions: service role only insert"
  ON public.desktop_sessions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can read their own active sessions
CREATE POLICY "desktop_sessions: users can view own sessions"
  ON public.desktop_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can deactivate (remote logout) their own sessions
CREATE POLICY "desktop_sessions: users can deactivate own sessions"
  ON public.desktop_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can do anything (needed for the mobile→desktop auth flow)
CREATE POLICY "desktop_sessions: service role full access"
  ON public.desktop_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── SCAN LOG ─────────────────────────────────────────────────────────────────

-- Users can only view their own scan history (Security Center)
CREATE POLICY "scan_log: users can view own log"
  ON public.scan_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own scan events
CREATE POLICY "scan_log: users can log own scans"
  ON public.scan_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Scan log is immutable — no UPDATE or DELETE

-- ── Realtime Enable ───────────────────────────────────────────────────────────
-- Enable Supabase Realtime on the tables that need live subscriptions.

-- Messages feed (chat realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Desktop sessions (QR login handshake)
ALTER PUBLICATION supabase_realtime ADD TABLE public.desktop_sessions;

-- Conversation members (join/leave events)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;

-- =============================================================================
-- SETUP NOTES FOR SUPABASE DASHBOARD:
--
-- 1. Go to Authentication > Providers > Email → Enable "Email OTP" (magic link)
-- 2. Go to Authentication > Providers > Phone → Enable phone auth (Twilio later)
-- 3. Go to Storage → Create bucket "avatars" with public access
-- 4. Go to Database > Extensions → Ensure pgcrypto is enabled
-- 5. Go to API > Settings → Note your URL and anon key for .env
-- =============================================================================
