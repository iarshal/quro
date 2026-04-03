// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  hasSupabaseServerEnv,
} from '../../../../lib/server/supabase';

/**
 * POST /api/session/activate
 *
 * Called by the mobile app after successfully scanning the desktop QR.
 * Verifies the auth token, activates the desktop session, broadcasts
 * the DESKTOP_AUTH event via Supabase Realtime.
 *
 * Body: { sessionToken, authToken, deviceInfo }
 */
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    sessionToken: string;
    authToken: string;
    deviceInfo: { platform: string; deviceName: string };
  };

  const { sessionToken, authToken, deviceInfo } = body;

  if (!sessionToken || !authToken) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (!hasSupabaseServerEnv()) {
    return NextResponse.json({
      success: true,
      mode: 'local-demo',
      deviceInfo: {
        ...deviceInfo,
        scannedAt: new Date().toISOString(),
      },
    });
  }

  // Use service-role client for DB write + Realtime broadcast
  const supabase = createServerClient();

  // Verify the mobile user's auth token by fetching their profile
  // The mobile client passes its Supabase JWT — we verify by calling getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  // Fetch the user's full profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Activate the desktop session
  const { error: updateError } = await supabase
    .from('desktop_sessions')
    .update({
      user_id: user.id,
      is_active: true,
      device_info: deviceInfo,
    })
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString());

  if (updateError) {
    return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
  }

  // Log the scan event in the audit trail
  await supabase.from('scan_log').insert({
    user_id: user.id,
    scan_type: 'desktop_login',
    metadata: {
      sessionToken,
      deviceInfo,
      ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
    },
  });

  // Broadcast DESKTOP_AUTH event on the session's Realtime channel
  // The desktop is already subscribed and will react immediately
  const channelName = `quro:desktop-session:${sessionToken}`;

  await supabase.channel(channelName).send({
    type: 'broadcast',
    event: 'DESKTOP_AUTH',
    payload: {
      type: 'DESKTOP_AUTH',
      authToken,
      profile,
      deviceInfo: {
        platform: deviceInfo.platform,
        deviceName: deviceInfo.deviceName,
        scannedAt: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({ success: true });
}
