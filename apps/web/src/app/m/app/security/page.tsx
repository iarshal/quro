'use client';

/**
 * Security Center — Local-first authentication management
 * NO emojis, SVG icons only for a professional corporate aesthetic.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteFaceData, getFaceData, evaluateFaceMatch } from '../../../../lib/faceStore';
import { clearSession } from '../../../../lib/localSession';
import { FaceScanner } from '../../../../components/face-auth/FaceScanner';

interface LoginRecord {
  time: string;
  device: string;
}

export default function MobileSecurityPage() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('quro_login_history');
      if (raw) {
        setLoginHistory(JSON.parse(raw));
      } else {
        // Fallback dummy for fresh sessions
        setLoginHistory([
          { time: new Date().toISOString(), device: 'Current Session' }
        ]);
      }
    } catch {}
  }, []);

  async function handleDeleteVerified(descriptor: number[], _snapshot: string, allDescriptors?: number[][]) {
    const stored = await getFaceData();
    if (!stored) return;
    const match = evaluateFaceMatch(stored, descriptor, allDescriptors);
    if (match.accepted) {
      setDeleting(true);
      await deleteFaceData();
      clearSession();
      localStorage.clear();
      setTimeout(() => router.replace('/m/welcome'), 1000);
    } else {
      setShowFaceVerify(false);
      alert('Face validation failed. Identity cannot be confirmed.');
    }
  }

  function formatLogTime(iso: string) {
    return new Date(iso).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  if (showFaceVerify) {
    return (
      <FaceScanner
        onVerified={handleDeleteVerified}
        onFailed={() => setShowFaceVerify(false)}
        onCancel={() => setShowFaceVerify(false)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F7', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F7F7F7', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#111' }}>
          Security Center
        </h1>
        <div style={{ width: 36 }} />
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 0 100px' }}>
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '0 16px 24px', backgroundColor: '#E8F9EF',
            borderRadius: 16, padding: '28px 20px', textAlign: 'center',
            boxShadow: '0 4px 12px rgba(7, 193, 96, 0.05)',
            border: '1px solid #C6F6D5'
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: '50%', backgroundColor: '#07C160',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#064E3B', marginBottom: 4 }}>
            System Protected
          </h2>
          <p style={{ fontSize: 13, color: '#047857', fontWeight: 500 }}>
            Biometric Enclave Active
          </p>
        </motion.div>

        {/* Protection Items */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
            Protection Status
          </h3>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 16, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5"/>
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>Face Verification</p>
                <p style={{ fontSize: 13, color: '#047857', marginTop: 2, fontWeight: 500 }}>Identity lock secured via biometrics</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 16, flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>Data Vault</p>
                <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>All data isolated locally</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login History */}
        <div style={{ padding: '0 16px', marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
            Recent Access Log
          </h3>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            {loginHistory.map((log, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < loginHistory.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === 0 ? '#07C160' : '#D1D5DB', marginRight: 12 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: i === 0 ? '#111' : '#4B5563' }}>{log.device}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{formatLogTime(log.time)}</p>
                </div>
                {i === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#07C160', backgroundColor: '#E8F9EF', padding: '4px 8px', borderRadius: 6 }}>ACTIVE</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ padding: '0 16px', position: 'sticky', bottom: 84, zIndex: 20 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', padding: '16px',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 16, flexShrink: 0 }}>
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#EF4444' }}>
                  Erase Device Data
                </span>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Permanently remove identity and chats from device</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 320, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 12 }}>Irreversible Action</h3>
              <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 24, lineHeight: 1.5 }}>
                This will permanently delete your biometric identity and all end-to-end encrypted chats from this local device.
                <br /><br />
                <strong style={{ color: '#111' }}>Face verification is required to authorize deletion.</strong>
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowDeleteConfirm(false)} style={{
                  flex: 1, padding: '14px', backgroundColor: '#F3F4F6', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, color: '#4B5563', border: 'none', cursor: 'pointer'
                }}>Cancel</button>
                <button onClick={() => { setShowDeleteConfirm(false); setShowFaceVerify(true); }} style={{
                  flex: 1, padding: '14px', backgroundColor: '#EF4444', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.25)'
                }}>Authenticate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deleting overlay */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', zIndex: 300, color: '#fff',
            }}
          >
            <motion.svg
              width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ marginBottom: 24 }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </motion.svg>
            <p style={{ fontSize: 18, fontWeight: 600, letterSpacing: 0.5 }}>Shredding Enclave Data...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
