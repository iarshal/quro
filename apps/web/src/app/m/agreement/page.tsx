'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    if (!agreed) return;
    router.push(mode === 'login' ? '/m/login' : '/m/verifyFace');
  };

  return (
    <div style={{ height: '100dvh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', color: '#000', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: 18, fontWeight: 600, marginRight: 32 }}>
          Identity Authentication
        </h1>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', overflowY: 'auto' }}>
        
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px 0', textAlign: 'center', letterSpacing: '-0.5px' }}>
          Identity Authentication
        </h2>
        <p style={{ fontSize: 16, color: '#9CA3AF', textAlign: 'center', margin: '0 0 48px 0', lineHeight: 1.5 }}>
          Follow the instructions to safely verify your<br />identity.
        </p>

        {/* Scan Area UI */}
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 48 }}>
          
          {/* Top subtle blue glow */}
          <div style={{ position: 'absolute', top: -10, left: '20%', right: '20%', height: 10, background: 'linear-gradient(to bottom, rgba(59,130,246,0.3), transparent)', filter: 'blur(8px)' }} />
          
          {/* Top Blue Bar line */}
          <div style={{ position: 'absolute', top: -4, left: '25%', right: '25%', height: 4, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.8), transparent)', filter: 'blur(1px)' }} />

          {/* Corner Brackets */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTop: '4px solid #3B82F6', borderLeft: '4px solid #3B82F6' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTop: '4px solid #3B82F6', borderRight: '4px solid #3B82F6' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottom: '4px solid #3B82F6', borderLeft: '4px solid #3B82F6' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottom: '4px solid #3B82F6', borderRight: '4px solid #3B82F6' }} />

          {/* Image */}
          <img src="/face-guide.png" alt="Face verification illustration" style={{ width: 140, height: 'auto', objectFit: 'contain', zIndex: 10 }} />
        </div>

        {/* Instructions */}
        <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', margin: '0 0 12px 0' }}>
          Please ensure this is <span style={{ fontWeight: 700, color: '#374151' }}>you</span> operating the device.
        </p>
        <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          Face the camera directly and ensure good<br />lighting.
        </p>

      </main>

      {/* Footer Area */}
      <div style={{ padding: '0 24px 32px' }}>
        
        {/* Checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 24, cursor: 'pointer' }}>
          <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, cursor: 'pointer', zIndex: 2, inset: 0 }}
            />
            <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${agreed ? '#3B82F6' : '#9CA3AF'}`, background: agreed ? '#3B82F6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {agreed && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </div>
          <span style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>
            I agree to the <span style={{ color: '#3B82F6', fontWeight: 600 }}>Quro Privacy Policy</span> and <span style={{ color: '#3B82F6', fontWeight: 600 }}>Biometric Agreement</span>.
          </span>
        </label>

        {/* Action Button */}
        <button
          onClick={handleStart}
          disabled={!agreed}
          style={{
            width: '100%',
            padding: '16px',
            background: agreed ? '#3B82F6' : '#E5E7EB',
            color: agreed ? '#fff' : '#9CA3AF',
            border: 'none',
            borderRadius: 100,
            fontSize: 18,
            fontWeight: 700,
            cursor: agreed ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          Start Registration
        </button>

      </div>
    </div>
  );
}
