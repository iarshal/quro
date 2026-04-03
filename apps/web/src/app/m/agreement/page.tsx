'use client';

/**
 * Pre-Scan Agreement Page
 * Matches user specifications and screenshots for the "Start Scanning" UI
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function MobileAgreementPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('register');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setMode(params.get('mode') === 'login' ? 'login' : 'register');
    } catch {}
  }, []);

  const handleStart = () => {
    if (!agreed) {
      alert("Please agree to the Terms and Privacy Policy first.");
      return;
    }
    router.push(mode === 'login' ? '/m/login' : '/m/verifyFace');
  };

  return (
    <div style={{ height: '100dvh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid #F5F5F5' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#111', marginRight: 32 }}>
          {mode === 'login' ? 'Login Agreement' : 'Registration Agreement'}
        </h1>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        
        {/* Core Image Icon representing scan matching the reference screenshot */}
        <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 40 }}>
          {/* Scan frame corners */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: '3px solid #3B82F6', borderLeft: '3px solid #3B82F6' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: '3px solid #3B82F6', borderRight: '3px solid #3B82F6' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: '3px solid #3B82F6', borderLeft: '3px solid #3B82F6' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: '3px solid #3B82F6', borderRight: '3px solid #3B82F6' }} />

          {/* Person Illustration */}
          <div style={{ position: 'absolute', inset: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
            {/* Head */}
            <div style={{ width: 70, height: 80, backgroundColor: '#FCD4C6', borderRadius: '35px 35px 20px 20px', zIndex: 2, position: 'relative' }}>
              {/* Hair */}
              <div style={{ position: 'absolute', top: -10, left: -5, right: -5, height: 40, backgroundColor: '#333', borderRadius: '40px 40px 10px 10px' }} />
            </div>
            {/* Body suit */}
            <div style={{ width: 120, height: 60, backgroundColor: '#475569', borderRadius: '60px 60px 0 0', zIndex: 1, position: 'relative', overflow: 'hidden' }}>
              {/* Tie */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 10, height: 40, backgroundColor: '#EF4444' }} />
            </div>
          </div>

          {/* Scanning Line overlay */}
          <motion.div
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', left: -10, right: -10, height: 10, background: 'linear-gradient(to bottom, rgba(59,130,246,0) 0%, rgba(59,130,246,0.5) 100%)', borderBottom: '2px solid #3B82F6', zIndex: 10 }}
          />
        </div>

        <p style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 1.5, marginBottom: 40 }}>
          {mode === 'login'
            ? 'Before login, please review the facial data agreement and then complete face verification.'
            : 'Before registration, please review the facial data agreement and then complete face verification.'}
        </p>

      </main>

      {/* Bottom Action Area */}
      <div style={{ padding: '0 24px 40px' }}>
        <button
          onClick={handleStart}
          style={{ width: '100%', padding: '16px', backgroundColor: agreed ? '#3B82F6' : '#93C5FD', color: '#fff', border: 'none', borderRadius: 6, fontSize: 18, fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'background-color 0.2s' }}
        >
          Continue
        </button>

        <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: '#3B82F6' }}
          />
          <span style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
            I have read and agree to the <a href="#" style={{ color: '#3B82F6', textDecoration: 'none' }}>Privacy Policy</a> and <a href="#" style={{ color: '#3B82F6', textDecoration: 'none' }}>Biometric Data Agreement</a>. I consent to local processing of my facial data.
          </span>
        </label>
      </div>
    </div>
  );
}
