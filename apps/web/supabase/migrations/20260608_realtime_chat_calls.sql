-- Migration: Real-Time Chat & Calls Overhaul

-- 1. Modify `messages` table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- 2. Create `active_calls` table
CREATE TABLE IF NOT EXISTS active_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('video', 'voice')),
    status TEXT NOT NULL CHECK (status IN ('ringing', 'ongoing', 'ended', 'rejected')),
    room_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Turn on Row Level Security for active_calls
ALTER TABLE active_calls ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for active_calls
CREATE POLICY "Users can view their active calls"
ON active_calls FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls"
ON active_calls FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their calls"
ON active_calls FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- 4. Enable Realtime for active_calls and messages (if not already enabled)
-- Note: You might need to manually enable Realtime for these tables in the Supabase Dashboard
-- Database -> Replication -> Click 'Source' 0 tables -> toggle active_calls and messages
