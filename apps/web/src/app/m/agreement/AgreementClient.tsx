'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

type AgreementMode = 'login' | 'register';
type PolicySheet = 'privacy' | 'biometric' | null;

export default function AgreementClient({ mode }: { mode: AgreementMode }) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [openSheet, setOpenSheet] = useState<PolicySheet>(null);

  const handleStart = () => {
    if (!agreed) return;
    router.replace(mode === 'login' ? '/m/login' : '/m/verifyFace');
  };

  const sheetTitle = openSheet === 'privacy' ? 'Privacy Policy' : 'Biometric Data Agreement';
  const sheetBody =
    openSheet === 'privacy'
      ? [
          'Your profile, QR identity, chats, and biometric data are transmitted securely to our servers for multi-device authentication.',
          'All facial embeddings are encrypted at rest and processed only for identity verification.',
          'You can delete your account and all associated data at any time through Security Center.',
        ]
      : [
          'Face verification uses server-processed facial embeddings generated from your camera during registration and login.',
          'These embeddings are stored securely in our database and used to verify your identity across any device.',
          'Deleting your account permanently removes all stored biometric data from our servers.',
        ];

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid #F5F5F5' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#111', marginRight: 32 }}>
          {mode === 'login' ? 'Identity Verification' : 'Face Registration'}
        </h1>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 20px', gap: 24 }}>
        
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 8 }}>
            {mode === 'login' ? 'Complete Face Verification' : 'One More Step'}
          </h2>
          <p style={{ fontSize: 14, color: '#999', fontWeight: 500 }}>
            Follow the instructions to complete identity verification
          </p>
        </motion.div>

        {/* Face Verification Icon — Extracted from Douyin reference */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', damping: 18 }}
          style={{ position: 'relative', width: '100%', maxWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Scanning Frame Corners */}
          <div style={{ position: 'relative', width: 280, height: 280 }}>
            {/* Corner brackets */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '3px solid #07C160', borderLeft: '3px solid #07C160', borderRadius: '4px 0 0 0' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '3px solid #07C160', borderRight: '3px solid #07C160', borderRadius: '0 4px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '3px solid #07C160', borderLeft: '3px solid #07C160', borderRadius: '0 0 0 4px' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '3px solid #07C160', borderRight: '3px solid #07C160', borderRadius: '0 0 4px 0' }} />

            {/* The extracted Douyin icon */}
            <div style={{ position: 'absolute', inset: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img
                src="/images/face-verify-icon.png"
                alt="Face verification illustration"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            </div>

            {/* Animated scan line */}
            <motion.div
              animate={{ top: ['12%', '80%', '12%'], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: 4,
                right: 4,
                height: 3,
                background: 'linear-gradient(90deg, rgba(7,193,96,0) 0%, rgba(7,193,96,0.6) 30%, rgba(7,193,96,0.9) 50%, rgba(7,193,96,0.6) 70%, rgba(7,193,96,0) 100%)',
                borderRadius: 999,
                boxShadow: '0 0 16px rgba(7,193,96,0.3)',
                zIndex: 10,
              }}
            />
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 1.6, maxWidth: 360, fontWeight: 500 }}
        >
          {mode === 'login'
            ? 'Please face the camera directly and ensure adequate lighting for verification.'
            : 'Please face the camera directly and ensure adequate lighting for registration.'}
        </motion.p>
      </main>

      {/* Bottom Section */}
      <div style={{ padding: '0 24px 32px', display: 'grid', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 10, cursor: 'pointer', maxWidth: 900, margin: '0 auto' }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: '#07C160' }}
          />
          <span style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
            I have read and agree to the{' '}
            <button type="button" onClick={(event) => { event.preventDefault(); setOpenSheet('privacy'); }} style={{ color: '#07C160', fontWeight: 700, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              Privacy Policy
            </button>{' '}
            and{' '}
            <button type="button" onClick={(event) => { event.preventDefault(); setOpenSheet('biometric'); }} style={{ color: '#07C160', fontWeight: 700, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              Biometric Data Agreement
            </button>
            . I consent to processing of my facial data for identity verification.
          </span>
        </label>

        {!agreed && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: 13, color: '#999', fontWeight: 500 }}>
            Tick the checkbox to continue.
          </p>
        )}

        <motion.button
          whileTap={agreed ? { scale: 0.97 } : {}}
          onClick={handleStart}
          disabled={!agreed}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: agreed ? '#07C160' : '#C6F6D5',
            color: agreed ? '#fff' : '#A7F3D0',
            border: 'none',
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 700,
            cursor: agreed ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: agreed ? '0 8px 24px rgba(7,193,96,0.25)' : 'none',
          }}
        >
          Start Verification
        </motion.button>
      </div>

      {/* Policy Sheet Modal */}
      <AnimatePresence>
        {openSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenSheet(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              style={{ width: '100%', maxWidth: 720, backgroundColor: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111' }}>{sheetTitle}</h2>
                <button type="button" onClick={() => setOpenSheet(null)} style={{ width: 36, height: 36, borderRadius: 18, border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div style={{ display: 'grid', gap: 12, color: '#475569', fontSize: 14, lineHeight: 1.65 }}>
                {sheetBody.map((paragraph) => (
                  <p key={paragraph} style={{ margin: 0 }}>
                    {paragraph}
                  </p>
                ))}
              </div>
              <button type="button" onClick={() => setOpenSheet(null)} style={{ marginTop: 20, width: '100%', border: 'none', borderRadius: 14, backgroundColor: '#111', color: '#fff', padding: '14px 16px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
