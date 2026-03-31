/**
 * @quro/db — Database Type Definitions
 *
 * Auto-generated from Supabase schema + hand-curated application types.
 * Run `pnpm db:types` after schema changes to regenerate the Supabase
 * generated types (supabase gen types typescript --local).
 */

// ── Raw Supabase Table Types ──────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;                 // UUID — matches auth.users.id
          quro_id: string;            // e.g. "X9A2P" — unique, 5-char
          display_name: string;
          avatar_url: string | null;
          gender: 'male' | 'female' | 'other' | 'prefer_not' | null;
          birthday: string | null;    // ISO date string "YYYY-MM-DD"
          public_key: string;         // Curve25519 public key, base64url
          created_at: string;         // ISO timestamp
        };
        Insert: {
          id: string;
          quro_id: string;
          display_name: string;
          avatar_url?: string | null;
          gender?: 'male' | 'female' | 'other' | 'prefer_not' | null;
          birthday?: string | null;
          public_key: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      friendships: {
        Row: {
          id: string;
          user_a: string;             // UUID
          user_b: string;             // UUID
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
      };

      conversations: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };

      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['conversation_members']['Insert']>;
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          ciphertext: string;         // AES-256-GCM ciphertext, base64url
          iv: string;                 // 12-byte nonce, base64url
          tag: string;                // 16-byte GCM auth tag, base64url
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          ciphertext: string;
          iv: string;
          tag: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };

      desktop_sessions: {
        Row: {
          session_token: string;
          user_id: string | null;
          created_at: string;
          expires_at: string;
          is_active: boolean;
          device_info: Record<string, unknown> | null;
        };
        Insert: {
          session_token: string;
          user_id?: string | null;
          created_at?: string;
          expires_at: string;
          is_active?: boolean;
          device_info?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['desktop_sessions']['Insert']>;
      };

      scan_log: {
        Row: {
          id: string;
          user_id: string;
          scanned_at: string;
          scan_type: 'friend_add' | 'desktop_login';
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          scanned_at?: string;
          scan_type: 'friend_add' | 'desktop_login';
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['scan_log']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Application-Level Types ───────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationMember = Database['public']['Tables']['conversation_members']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type DesktopSession = Database['public']['Tables']['desktop_sessions']['Row'];
export type ScanLog = Database['public']['Tables']['scan_log']['Row'];

// ── Derived / Joined Types ────────────────────────────────────────────────────

/** A conversation enriched with the other participant's profile and last message */
export interface ConversationPreview {
  conversation: Conversation;
  otherUser: Profile;
  lastMessageAt: string | null;
  unreadCount: number;
}

/** A message with decrypted plaintext (decryption happens client-side) */
export interface DecryptedMessage extends Message {
  /** Null if decryption fails (key mismatch / corrupted data) */
  plaintext: string | null;
  isOwn: boolean;
}

// ── Supabase Realtime Payload Types ──────────────────────────────────────────

/** Payload broadcast on the desktop QR handshake channel */
export interface DesktopAuthPayload {
  type: 'DESKTOP_AUTH';
  /** Supabase JWT for the authenticated user */
  authToken: string;
  /** Full user profile to render the morph animation */
  profile: Profile;
  /** The mobile device that performed the scan */
  deviceInfo: {
    platform: 'ios' | 'android';
    deviceName: string;
    scannedAt: string;
  };
}

/** Payload broadcast when a user's QR code is scanned for friend add */
export interface FriendScanPayload {
  type: 'FRIEND_SCAN';
  scannerId: string;
  targetQuroId: string;
}
