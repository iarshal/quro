'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function LoginPortalPage() {
  const router = useRouter();
  const [qrLoaded, setQrLoaded] = useState('');

  useEffect(() => {
    QRCode.toDataURL('quro://session/verify', {
      width: 240,
      margin: 2,
      color: { dark: '#111', light: '#fff' }
    }).then(setQrLoaded);
  }, []);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#050505', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflowY: 'auto' }}>

      <header style={{ padding: '24px 24px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#A3A3A3', padding: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Back</span>
        </button>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>

          {/* QR Code Login Panel */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 32, padding: '40px 24px', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Mobile QR Login</h2>
            <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 }}>Scan with Quro App to sync session.</p>

            <div style={{ background: '#fff', padding: 20, borderRadius: 24, marginBottom: 24 }}>
              {qrLoaded ? (
                <img src={qrLoaded} alt="Login QR Code" style={{ width: 220, height: 220, mixBlendMode: 'multiply' }} />
              ) : (
                <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
                  <div style={{ width: 24, height: 24, border: '3px solid #ccc', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'rgba(0,242,254,0.1)', borderRadius: 100 }}>
              <div style={{ width: 8, height: 8, background: '#00f2fe', borderRadius: '50%', boxShadow: '0 0 10px #00f2fe' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00f2fe', letterSpacing: 1 }}>WAITING FOR SCAN</span>
            </div>
          </div>

          {/* Face ID Login Panel */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 32, padding: '40px 24px', width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
          }}>
            {/* Apple Face ID icon */}
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 3H5a2 2 0 0 0-2 2v2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
                <circle cx="9" cy="10" r="0.5" fill="#fff" />
                <circle cx="15" cy="10" r="0.5" fill="#fff" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <path d="M8 15c1.5 1.5 6.5 1.5 8 0" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Face Login</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 40, lineHeight: 1.6, textAlign: 'center' }}>
              Use your face to securely sign in. No passwords needed.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/m/agreement?mode=login')}
              style={{ padding: '18px 24px', background: 'linear-gradient(135deg, #FF4D6A, #FF2D55)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', borderRadius: 100, cursor: 'pointer', boxShadow: '0 8px 30px rgba(255,45,85,0.3)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 3H5a2 2 0 0 0-2 2v2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M17 21h2a2 2 0 0 0 2-2v-2" />
              </svg>
              Verify with Face ID
            </motion.button>

            <button onClick={async () => {
              try {
                const { supabase } = await import('../../../lib/supabaseClient');
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/m/login?google=1` }
                });
              } catch (err) { console.warn('Google OAuth init failed:', err); }
            }} style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 16 }}>
              Use Bound Google Login
            </button>
          </div>

        </motion.div>
      </main>

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
