// @ts-nocheck
'use client';

/**
 * Face Registration Page — STRICT face matching
 * 
 * - Takes 3 captures, averages for accuracy
 * - If face already registered: shows existing profile
 * - Stores multiple raw descriptors for better login matching
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaceScanner } from '../../../components/face-auth/FaceScanner';
import { getFaceData, evaluateFaceMatch } from '../../../lib/faceStore';
import { createSession } from '../../../lib/localSession';

export default function RegisterFacePage() {
  const router = useRouter();
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);
  const [matchDistance, setMatchDistance] = useState(0);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function startLoginAsExisting(profile: any) {
    setIsLoggingIn(true);
    window.setTimeout(() => {
      createSession(profile.quroId, profile.displayName);
      window.location.replace('/m/app/chats');
    }, 2200);
  }

  async function handleVerified(descriptor: number[], snapshot: string, allDescriptors?: number[][]) {
    // Check if this face is already registered
    const stored = await getFaceData();
    if (stored) {
      const match = evaluateFaceMatch(stored, descriptor, allDescriptors);

      console.log(
        `[FACE MATCH] best=${match.bestDistance.toFixed(4)} avg=${match.averageDistance.toFixed(4)} samples=${match.matchedSamples}/${match.sampleCount}`
      );

      if (match.accepted) {
        // Same person — already registered
        setExistingProfile(stored);
        setMatchDistance(match.bestDistance);
        setShowAlreadyRegistered(true);
        return;
      }
    }

    // New face — save data and descriptors, go to profile setup
    sessionStorage.setItem('__QURO_FACE__', JSON.stringify({
      descriptor,
      snapshot,
      allDescriptors: allDescriptors || [descriptor],
    }));
    router.push('/m/register/profile');
  }

  function handleLoginAsExisting() {
    if (existingProfile) {
      startLoginAsExisting(existingProfile);
    }
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

  // Already registered screen
  if (showAlreadyRegistered && existingProfile) {
    const age = existingProfile.birthday
      ? Math.floor((Date.now() - new Date(existingProfile.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const genderMap: Record<string, string> = { male: '男 Male', female: '女 Female', transgender: '跨性别', other: '其他' };

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#0B0B0F',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', 'Noto Sans SC', sans-serif", padding: 32,
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(7,193,96,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Account Already Exists</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 280 }}>
            This face already belongs to an account on this device. Please log in with this account.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '24px 32px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, minWidth: 260,
          }}>
            {existingProfile.avatarDataUrl ? (
              <img src={existingProfile.avatarDataUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(7,193,96,0.3)' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{existingProfile.displayName?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}

            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{existingProfile.displayName}</h3>

            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '3px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                {genderMap[existingProfile.gender] || existingProfile.gender}
              </span>
              {age !== null && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', padding: '3px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                  {age} 岁
                </span>
              )}
            </div>

            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
              ID: {existingProfile.quroId}
            </div>

            <div style={{ fontSize: 10, color: 'rgba(7,193,96,0.5)', marginTop: 4 }}>
              人脸匹配度: {((1 - matchDistance) * 100).toFixed(1)}%
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleLoginAsExisting}
            style={{ width: '100%', maxWidth: 260, padding: '14px 0', background: '#07C160', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Log In To Existing Account
          </motion.button>

          <button onClick={() => router.replace('/m/welcome')}
            style={{ padding: '10px 24px', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>
            返回 · Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <FaceScanner mode="register" onVerified={handleVerified} onFailed={(r) => console.error(r)} onCancel={() => router.back()} />
  );
}
