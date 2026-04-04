'use client';

/**
 * Unified Face Scan Gate
 * 
 * - Acts as the single entry point from the Pre-Scan Agreement.
 * - Does 1 covert face match against the DB.
 * - If matches -> Shows Profile verification mark -> Prompts "Log In" -> routes to /m/login (reswipe).
 * - If no match -> Proceeds to /m/register/profile setup.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaceScanner } from '../../../components/face-auth/FaceScanner';
import { getFaceData, evaluateFaceMatch } from '../../../lib/faceStore';
import { createSession } from '../../../lib/localSession';

export default function VerifyFacePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDenied, setShowDenied] = useState(false);
  const [matchDistance, setMatchDistance] = useState(0);

  async function handleVerified(descriptor: number[], snapshot: string, allDescriptors?: number[][]) {
    setError('');
    const stored = await getFaceData();
    if (stored) {
      const match = evaluateFaceMatch(stored, descriptor, allDescriptors);

      if (match.accepted) {
        setExistingProfile(stored);
        setShowAlreadyRegistered(true);
        return;
      }

      setMatchDistance(match.bestDistance);
      setShowDenied(true);
      return;
    }

    // New face — save temporary data and route to registration profile setup
    sessionStorage.setItem('__QURO_FACE__', JSON.stringify({
      descriptor,
      snapshot,
      allDescriptors: allDescriptors || [descriptor],
    }));
    router.push('/m/register/profile');
  }

  function handleLoginExisting() {
    if (!existingProfile) return;
    setIsLoggingIn(true);
    window.setTimeout(() => {
      createSession(existingProfile.quroId, existingProfile.displayName);
      window.location.replace('/m/app/chats');
    }, 2200);
  }

  if (showDenied) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#0B0B0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: 32,
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(239,68,68,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(239,68,68,0.12)' }}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 19.5C16 15.1 19.6 11.5 24 11.5C28.4 11.5 32 15.1 32 19.5C32 23.9 28.4 27.5 24 27.5C19.6 27.5 16 23.9 16 19.5Z" />
              <path d="M10.5 36C13.6 31.8 18.4 29.5 24 29.5C29.6 29.5 34.4 31.8 37.5 36" />
              <path d="M34 14L40 20" />
              <path d="M40 14L34 20" />
            </svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', textAlign: 'center', margin: 0 }}>Registration Failed</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', textAlign: 'center', maxWidth: 300, margin: 0 }}>
            This device already has a verified face. A different person cannot register until the current face data is removed.
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace', marginTop: 6 }}>
            Face Mismatch · Distance: {matchDistance.toFixed(3)}
          </p>
          <button onClick={() => router.replace('/m/welcome')}
            style={{ width: '100%', padding: '15px 0', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (isLoggingIn && existingProfile) {
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
            {existingProfile.avatarDataUrl ? (
              <img src={existingProfile.avatarDataUrl} alt="" style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.16)' }} />
            ) : (
              <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 30, fontWeight: 700 }}>{existingProfile.displayName?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>{existingProfile.displayName}</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, fontFamily: 'monospace' }}>Quro ID: {existingProfile.quroId}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0 0', textAlign: 'center' }}>
              Existing account found. Logging in now.
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

  if (showAlreadyRegistered && existingProfile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#0B0B0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif", padding: 32,
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(34,197,94,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', textAlign: 'center', margin: 0 }}>Account Already Exists</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', textAlign: 'center', maxWidth: 300, margin: 0 }}>
            This face is already verified on this device. Please log in with the existing account.
          </p>

          <div style={{
            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22, padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            {existingProfile.avatarDataUrl ? (
              <img src={existingProfile.avatarDataUrl} alt="" style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(34,197,94,0.28)' }} />
            ) : (
              <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 30, fontWeight: 700 }}>{existingProfile.displayName?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>{existingProfile.displayName}</h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, fontFamily: 'monospace' }}>Quro ID: {existingProfile.quroId}</p>
          </div>

          <button onClick={handleLoginExisting}
            style={{ width: '100%', padding: '15px 0', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Log In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <FaceScanner onVerified={handleVerified} onFailed={(r) => { console.error(r); setError('Face verification failed. Please try again.'); }} onCancel={() => router.replace('/m/welcome')} />
      {error && (
        <div style={{
          position: 'fixed',
          left: 20,
          right: 20,
          bottom: 32,
          zIndex: 1200,
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
    </>
  );
}
