'use client';

/**
 * Profile Setup — After Face Verification (English)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { saveFaceData, generateQuroId, type QuroProfile } from '../../../../lib/faceStore';
import { createSession } from '../../../../lib/localSession';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const faceRaw = sessionStorage.getItem('__QURO_FACE__');
    if (!faceRaw) router.replace('/m/welcome');
  }, [router]);

  const isValid = name.trim().length >= 2 && birthday && gender;

  const genderOptions = [
    { value: 'male', label: 'Male', color: '#3B82F6', bg: '#EFF6FF' },
    { value: 'female', label: 'Female', color: '#EC4899', bg: '#FDF2F8' },
    { value: 'transgender', label: 'Trans', color: '#8B5CF6', bg: '#F5F3FF' },
    { value: 'other', label: 'Other', color: '#F59E0B', bg: '#FFFBEB' },
  ];

  async function handleComplete() {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    try {
      const faceRaw = sessionStorage.getItem('__QURO_FACE__');
      if (!faceRaw) throw new Error('Face data not found');

      const { descriptor, snapshot, allDescriptors } = JSON.parse(faceRaw);
      const quroId = generateQuroId();

      const profile: QuroProfile = {
        displayName: name.trim(),
        gender: gender as any,
        birthday,
        quroId,
        faceDescriptor: descriptor,
        faceDescriptors: allDescriptors || [descriptor],
        registeredAt: new Date().toISOString(),
        avatarDataUrl: snapshot,
      };

      await saveFaceData(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('quro_master_face', quroId);
      }
      createSession(quroId, name.trim());
      sessionStorage.removeItem('__QURO_FACE__');
      router.replace('/m/app/chats');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F7F7' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: '#F7F7F7',
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 600, color: '#111' }}>
          Setup Profile
        </h1>
        <div style={{ width: 36 }} />
      </header>

      {/* Form */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', fontFamily: "'Inter', sans-serif" }}>
        {/* Verified badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px', backgroundColor: '#E8F9EF', borderRadius: 12, marginBottom: 28,
            border: '1px solid #C6F6D5'
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#07C160', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#064E3B' }}>Biometrics Verified</p>
            <p style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>Real person presence confirmed</p>
          </div>
        </motion.div>

        {/* Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Display Name
          </label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Alex Chen"
            style={{
              width: '100%', padding: '16px', backgroundColor: '#fff', borderRadius: 10,
              fontSize: 16, fontWeight: 500, color: '#111',
              border: '1.5px solid transparent', transition: 'all 0.2s', outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onFocus={e => e.target.style.borderColor = '#07C160'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
        </motion.div>

        {/* Birthday */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Date of Birth
          </label>
          <input
            type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
            style={{
              width: '100%', padding: '16px', backgroundColor: '#fff', borderRadius: 10,
              fontSize: 16, fontWeight: 500, color: '#111',
              border: '1.5px solid transparent', transition: 'all 0.2s', outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)', WebkitAppearance: 'none'
            }}
            onFocus={e => e.target.style.borderColor = '#07C160'}
            onBlur={e => e.target.style.borderColor = 'transparent'}
          />
        </motion.div>

        {/* Gender */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Gender
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {genderOptions.map(opt => (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.97 }}
                onClick={() => setGender(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '16px 12px', backgroundColor: gender === opt.value ? opt.bg : '#fff',
                  borderRadius: 12, border: `2px solid ${gender === opt.value ? opt.color : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: gender === opt.value ? opt.color : '#9CA3AF' }}>
                  {opt.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {error && <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 500, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
      </main>

      {/* Bottom CTA */}
      <div style={{ padding: '16px 20px 32px', backgroundColor: '#F7F7F7' }}>
        <motion.button
          whileTap={isValid ? { scale: 0.97 } : {}}
          onClick={handleComplete}
          disabled={!isValid || loading}
          style={{
            width: '100%', padding: '16px',
            backgroundColor: isValid ? '#07C160' : '#A7F3D0',
            color: isValid ? '#fff' : '#047857', border: 'none', borderRadius: 12,
            fontSize: 17, fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
            boxShadow: isValid ? '0 8px 16px rgba(7,193,96,0.25)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Creating Account...' : 'Finish Setup'}
        </motion.button>
      </div>
    </div>
  );
}
