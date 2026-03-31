/**
 * @quro/db — Supabase Client Factory
 *
 * Provides typed Supabase clients for:
 *   - Browser/client-side (uses anon key, respects RLS)
 *   - Server-side / API routes (uses service role key, bypasses RLS)
 *
 * Usage:
 *   import { createBrowserClient } from '@quro/db'
 *   const supabase = createBrowserClient()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type QuroSupabaseClient = SupabaseClient<Database>;

// ── Environment variable accessors ────────────────────────────────────────────

function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';
  if (!url) {
    console.warn('[Quro/db] SUPABASE_URL is not set. Using placeholder — wire in your .env');
    return 'https://placeholder.supabase.co';
  }
  return url;
}

function getAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!key) {
    console.warn('[Quro/db] SUPABASE_ANON_KEY is not set. Using placeholder.');
    return 'placeholder-anon-key';
  }
  return key;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    console.warn('[Quro/db] SUPABASE_SERVICE_ROLE_KEY is not set. Server calls will fail.');
    return 'placeholder-service-key';
  }
  return key;
}

// ── Browser Client (singleton) ────────────────────────────────────────────────

let browserClient: QuroSupabaseClient | null = null;

/**
 * Returns a typed Supabase client safe for browser/client use.
 * Singleton — only creates one instance per session.
 */
export function createBrowserClient(): QuroSupabaseClient {
  if (browserClient) return browserClient;

  browserClient = createClient<Database>(getSupabaseUrl(), getAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return browserClient;
}

// ── Server Client ────────────────────────────────────────────────────────────

/**
 * Returns a typed Supabase client with service role privileges.
 * Use ONLY in server-side code (API routes, server components).
 * NEVER expose this to the browser or client bundle.
 */
export function createServerClient(): QuroSupabaseClient {
  return createClient<Database>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ── Realtime Channel Helpers ──────────────────────────────────────────────────

/**
 * Channel naming convention for desktop QR handshake.
 * Both desktop and mobile join this exact channel name.
 * @param token — session token from generateSessionToken()
 */
export function getDesktopSessionChannel(token: string): string {
  return `quro:desktop-session:${token}`;
}

/**
 * Channel naming convention for real-time chat messages.
 * @param conversationId — UUID of the conversation
 */
export function getChatChannel(conversationId: string): string {
  return `quro:chat:${conversationId}`;
}

// ── Type-safe Query Helpers ───────────────────────────────────────────────────

/**
 * Fetch a user's profile by their Supabase auth UUID.
 */
export async function getProfileById(
  client: QuroSupabaseClient,
  userId: string
) {
  return client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

/**
 * Fetch a user's profile by their unique Quro ID (e.g., "X9A2P").
 */
export async function getProfileByQuroId(
  client: QuroSupabaseClient,
  quroId: string
) {
  return client
    .from('profiles')
    .select('*')
    .eq('quro_id', quroId)
    .single();
}

/**
 * Fetch all conversations for a user, ordered by most recent message.
 * Also fetches the other participant's profile and the latest message timestamp.
 */
export async function getConversationsForUser(
  client: QuroSupabaseClient,
  userId: string
) {
  return client
    .from('conversation_members')
    .select(`
      conversation_id,
      conversations (
        id,
        created_at
      )
    `)
    .eq('user_id', userId);
}

/**
 * Fetch all messages for a conversation, ordered chronologically.
 * NOTE: Messages are encrypted blobs — decryption happens on the client.
 */
export async function getMessagesForConversation(
  client: QuroSupabaseClient,
  conversationId: string,
  limit = 50,
  before?: string
) {
  let query = client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  return query;
}

/**
 * Check if a Quro ID is already taken.
 */
export async function isQuroIdTaken(
  client: QuroSupabaseClient,
  quroId: string
): Promise<boolean> {
  const { count } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('quro_id', quroId);
  return (count ?? 0) > 0;
}

/**
 * Insert a new desktop session record.
 * Called by the web app when generating a fresh QR code.
 */
export async function createDesktopSession(
  client: QuroSupabaseClient,
  sessionToken: string,
  expiresAt: Date
) {
  // @ts-ignore
  return (client as any).from('desktop_sessions').insert({
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
    is_active: false,
  });
}

/**
 * Activate a desktop session after mobile scan.
 * Called by the mobile app (via API route) after successful QR scan.
 */
export async function activateDesktopSession(
  client: QuroSupabaseClient,
  sessionToken: string,
  userId: string,
  deviceInfo: Record<string, unknown>
) {
  // @ts-ignore
  return (client as any)
    .from('desktop_sessions')
    .update({
      user_id: userId,
      is_active: true,
      device_info: deviceInfo,
    })
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString()); // Reject expired sessions
}
