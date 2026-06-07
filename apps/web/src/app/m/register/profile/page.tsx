'use client';

/**
 * Profile Setup — Bind with Google Page (Restored)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const handleGoogleBind = () => {
    // Simulate OAuth pop-up and auto-fill
    setName('Alex Doe');
    setBirthday('1998-05-15');
    setGender('male');
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#111', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F3F4F6'
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, margin: 0, marginRight: 36 }}>
          Identity Required
        </h1>
      </header>

      {/* Form */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px 0', textAlign: 'center' }}>
          Bind Account
        </h2>

        {/* Bind with Google Button */}
        <button
          onClick={handleGoogleBind}
          style={{
            width: '100%', padding: '16px', backgroundColor: '#fff', color: '#3C4043',
            border: '1px solid #DADCE0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 32,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Bind with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
          <span style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>OR ENTER MANUALLY</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
        </div>

        {/* Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>
            Full Name
          </label>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Alex Chen"
            style={{
              width: '100%', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: 10,
              fontSize: 16, color: '#111', border: '1px solid #D1D5DB', outline: 'none'
            }}
          />
        </div>

        {/* Birthday */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 8 }}>
            Date of Birth
          </label>
          <input
            type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
            style={{
              width: '100%', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: 10,
              fontSize: 16, color: '#111', border: '1px solid #D1D5DB', outline: 'none', WebkitAppearance: 'none'
            }}
          />
        </div>

        {/* Gender */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4B5563', marginBottom: 12 }}>
            Gender
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            {genderOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value)}
                style={{
                  flex: 1, padding: '16px 8px', backgroundColor: gender === opt.value ? opt.bg : '#F9FAFB',
                  borderRadius: 12, border: `2px solid ${gender === opt.value ? opt.color : '#D1D5DB'}`,
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: 14, fontWeight: 600,
                  color: gender === opt.value ? opt.color : '#4B5563'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 500, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
      </main>

      {/* Bottom CTA */}
      <div style={{ padding: '16px 24px 32px' }}>
        <button
          onClick={handleComplete}
          disabled={!isValid || loading}
          style={{
            width: '100%', padding: '16px',
            background: isValid ? '#3B82F6' : '#E5E7EB',
            color: isValid ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 100,
            fontSize: 18, fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );
}
