// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@quro/db';
import { randomUUID } from 'crypto';

/**
 * POST /api/session/create
 *
 * Creates a new desktop login session in Supabase.
 * Uses the service-role key to bypass RLS (unauthenticated desktop request).
 *
 * Returns: { token, expiresAt }
 */
export async function POST() {
  const supabase = createServerClient();

  const token = randomUUID();
  const ttlSeconds = parseInt(process.env.NEXT_PUBLIC_QR_SESSION_TTL ?? '300', 10);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  const { error } = await supabase.from('desktop_sessions').insert({
    session_token: token,
    expires_at: expiresAt.toISOString(),
    is_active: false,
  });

  if (error) {
    console.error('[Quro/session] Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  return NextResponse.json({
    token,
    expiresAt: expiresAt.getTime(),
  });
}
