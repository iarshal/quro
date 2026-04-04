'use client';

/**
 * Face Login Page — STRICT face matching (English)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaceScanner } from '../../../components/face-auth/FaceScanner';
import { getFaceData, evaluateFaceMatch } from '../../../lib/faceStore';
import { createSession } from '../../../lib/localSession';
import { playFailBuzz } from '../../../lib/audioEffects';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [showDenied, setShowDenied] = useState(false);
  const [matchDistance, setMatchDistance] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function beginLogin(profile: any) {
    setIsLoggingIn(true);
    window.setTimeout(() => {
      createSession(profile.quroId, profile.displayName);
      router.replace('/m/app/chats');
    }, 2200);
  }

  async function handleVerified(descriptor: number[], snapshot: string, allDescriptors?: number[][]) {
    const stored = await getFaceData();
    if (!stored) {
      setError('No registered face was found on this device.');
      return false;
    }

    const match = evaluateFaceMatch(stored, descriptor, allDescriptors);

    if (match.accepted) {
      beginLogin(stored);
      return true;
    } else {
      playFailBuzz();
      setMatchDistance(match.bestDistance);
      setShowDenied(true);
      return false;
    }
  }

  if (isLoggingIn) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#0B0B0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: 32,
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22, padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Signing You In</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0 0', textAlign: 'center' }}>
              Secure face match confirmed. Redirecting now.
            </p>
          </div>

          <div style={{ position: 'relative', width: 42, height: 18 }}>
            <div style={{ position: 'absolute', top: 0, left: 6, width: 14, height: 14, borderRadius: '50%', background: '#25F4EE', opacity: 0.9, animation: 'douyin-l 0.8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: 0, right: 6, width: 14, height: 14, borderRadius: '50%', background: '#FE2C55', opacity: 0.9, animation: 'douyin-r 0.8s ease-in-out infinite' }} />
          </div>
        </motion.div>
        <style>{`
          @keyframes douyin-l { 0%,100% { transform: translateX(-12px); } 50% { transform: translateX(12px); } }
          @keyframes douyin-r { 0%,100% { transform: translateX(12px); } 50% { transform: translateX(-12px); } }
        `}</style>
      </div>
    );
  }

  if (showDenied) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#0B0B0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: 32,
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(239,68,68,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(239,68,68,0.12)' }}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 19.5C16 15.1 19.6 11.5 24 11.5C28.4 11.5 32 15.1 32 19.5C32 23.9 28.4 27.5 24 27.5C19.6 27.5 16 23.9 16 19.5Z" />
              <path d="M10.5 36C13.6 31.8 18.4 29.5 24 29.5C29.6 29.5 34.4 31.8 37.5 36" />
              <path d="M34 14L40 20" />
              <path d="M40 14L34 20" />
            </svg>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', textAlign: 'center' }}>Face Not Recognized</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: 280 }}>
            The scanned face does not match the face saved on this device.
          </p>
          
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', marginTop: 12 }}>
            Face Mismatch · Distance: {matchDistance.toFixed(3)}
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, width: '100%', maxWidth: 280 }}>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { setShowDenied(false); setError(''); }}
              style={{ flex: 1, padding: '14px 0', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Retry
            </motion.button>
            <button onClick={() => router.replace('/m/welcome')}
              style={{ flex: 1, padding: '14px 0', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
              Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100dvh' }}>
      <FaceScanner
        onVerified={handleVerified}
        onFailed={() => setError('Verification failed, please retry.')}
        onCancel={() => router.replace('/m/welcome')}
      />

      {error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute', bottom: 80, left: 20, right: 20, zIndex: 200,
            backgroundColor: 'rgba(239, 68, 68, 0.95)', color: '#fff',
            padding: '14px 20px', borderRadius: 12, textAlign: 'center', fontSize: 14, fontWeight: 600,
          }}>
          {error}
        </motion.div>
      )}
    </div>
  );
}
