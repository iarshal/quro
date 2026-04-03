'use client';

/**
 * Mobile Welcome Screen — Single Entry Point
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { isLoggedIn } from '../../../lib/localSession';

export default function MobileWelcomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (isLoggedIn()) {
        router.replace('/m/app/chats');
      }
    } catch {}
  }, [router]);

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #E8F9EF 0%, #FFFFFF 50%, #F8FAFC 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '10%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(7,193,96,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '5%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,174,255,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 160 }}
          style={{ textAlign: 'center' }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: '#07C160',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(7,193,96,0.35)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16" y1="16" x2="21" y2="21" />
            </svg>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#111', letterSpacing: '-1px', marginBottom: 8 }}>Quro</h1>
          <p style={{ fontSize: 14, color: '#999', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase' }}>
            Face · Scan · Chat
          </p>
        </motion.div>
      </main>

      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, delay: 0.4 }}
        style={{ padding: '0 24px 40px', zIndex: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ fontSize: 12, color: '#999' }}>Face Verification · E2E Encrypted · Local Storage</p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            try {
              const masterFace = localStorage.getItem('quro_master_face');
              if (masterFace) {
                router.push('/m/agreement?mode=login');
              } else {
                router.push('/m/agreement?mode=register');
              }
            } catch {
              router.push('/m/agreement?mode=register');
            }
          }}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#07C160',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(7,193,96,0.35)',
            marginBottom: 16,
          }}
        >
          Start
        </motion.button>
      </motion.footer>
    </div>
  );
}
