'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loginWithGoogle } from '../../../lib/api';

export default function LoginFallbackPage() {
  const router = useRouter();

  async function handleGoogleLogin() {
    try {
      const { supabase } = await import('../../../lib/supabaseClient');
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/m/login?google=1',
        },
      });
    } catch (err) {
      console.error('Google login failed:', err);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('../../../lib/supabaseClient');
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) return;
        const profile = await loginWithGoogle({ access_token: accessToken });
        localStorage.setItem('quro_session', JSON.stringify({
          token: profile.session_token,
          quroId: profile.quro_id,
          displayName: profile.display_name,
          loggedInAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }));
        router.replace('/m/app/chats');
      } catch {}
    })();
  }, [router]);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F7F7F7', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', backgroundColor: '#F7F7F7' }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#111' }}>Google Login</h1>
        <div style={{ width: 36 }} />
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 16px 50px rgba(15,23,42,0.08)', textAlign: 'center' }}>
          <div style={{ width: 70, height: 70, borderRadius: 22, margin: '0 auto 18px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 23, fontWeight: 900, color: '#111827' }}>Log in with bound Gmail</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, lineHeight: 1.6, color: '#6B7280' }}>Use the same Google account that was bound when you registered your face.</p>
          <button onClick={handleGoogleLogin} style={{ width: '100%', padding: 16, background: '#111827', color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>Continue with Google</button>
        </motion.div>
      </main>
    </div>
  );
}
