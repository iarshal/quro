'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFaceData, updateFaceData } from '../../../../../lib/faceStore';

const genderOptions = [
  {
    value: 'male',
    color: '#3B82F6',
    label: 'Male',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="15" r="5.5" />
        <path d="M13 11 20 4" />
        <path d="M15 4h5v5" />
      </svg>
    ),
  },
  {
    value: 'female',
    color: '#EC4899',
    label: 'Female',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5.5" />
        <path d="M12 13.5V22" />
        <path d="M8 18h8" />
      </svg>
    ),
  },
  {
    value: 'transgender',
    color: '#8B5CF6',
    label: 'Non-binary',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="5.2" />
        <path d="M13.8 6.2 19.5.5" />
        <path d="M15.8.5h3.7v3.7" />
        <path d="M10 15.2V23" />
        <path d="M6.3 19.2h7.4" />
      </svg>
    ),
  },
  {
    value: 'other',
    color: '#F59E0B',
    label: 'Prefer not to say',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="6.2" />
      </svg>
    ),
  },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'transgender' | 'other'>('other');
  const [avatarDataUrl, setAvatarDataUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getFaceData();
      if (!profile) {
        router.replace('/');
        return;
      }
      setDisplayName(profile.displayName);
      setBio(profile.bio || '');
      setGender(profile.gender);
      setAvatarDataUrl(profile.avatarDataUrl || '');
    })();
  }, [router]);

  async function handleSave() {
    if (!displayName.trim() || saving) return;
    setSaving(true);
    await updateFaceData({
      displayName: displayName.trim(),
      bio: bio.trim(),
      gender,
      avatarDataUrl: avatarDataUrl || undefined,
      verified: true,
    });
    router.replace('/m/app/profile');
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarDataUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F6F7FB', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', backgroundColor: '#fff', borderBottom: '1px solid #EEF0F4', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#111' }}>Edit Profile</h1>
        <div style={{ width: 36 }} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))', display: 'grid', gap: 18 }}>
        <section style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 82, height: 82, borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontSize: 30, fontWeight: 700 }}>{displayName.trim().charAt(0).toUpperCase() || 'Q'}</span>
              )}
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 999, backgroundColor: '#111827', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Change Photo
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Display Name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} style={{ width: '100%', borderRadius: 16, border: '1px solid #E5E7EB', padding: '14px 16px', fontSize: 16, outline: 'none' }} />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bio</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={120} style={{ width: '100%', minHeight: 92, borderRadius: 16, border: '1px solid #E5E7EB', padding: '14px 16px', fontSize: 15, outline: 'none', resize: 'none' }} />
          </label>
        </section>

        <section style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, display: 'grid', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gender Badge</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {genderOptions.map(({ value, color, label, icon }) => (
              <button
                key={value}
                onClick={() => setGender(value as typeof gender)}
                style={{
                  borderRadius: 18,
                  border: gender === value ? `2px solid ${color}` : '1px solid #E5E7EB',
                  backgroundColor: gender === value ? `${color}15` : '#fff',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{label}</span>
                <span style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${color}14`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div style={{ position: 'sticky', bottom: 0, zIndex: 20, padding: '14px 20px calc(78px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(180deg, rgba(246,247,251,0) 0%, #F6F7FB 25%, #F6F7FB 100%)' }}>
        <button onClick={handleSave} disabled={!displayName.trim() || saving} style={{ width: '100%', border: 'none', borderRadius: 18, backgroundColor: '#111827', color: '#fff', padding: '16px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: !displayName.trim() || saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
