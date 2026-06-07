'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserPassword, updateUserProfile } from '../../../../../lib/api';
import { normalizeCountryCode, sanitizePhoneDigits } from '../../../../../lib/phone';

export default function LocalAuthSettingsPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const profile = await getUserProfile();
        const savedPhone = profile.phone || '';
        if (savedPhone.startsWith('+')) {
          const match = savedPhone.match(/^(\+\d{1,4})(\d+)$/);
          if (match) {
            setCountryCode(match[1]);
            setPhone(match[2]);
          } else {
            setPhone(savedPhone.replace(/^\+/, ''));
          }
        } else {
          setPhone(savedPhone);
        }
      } catch {
        router.replace('/');
      }
    }
    load();
  }, [router]);

  async function handleSave() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const normalizedPhoneDigits = sanitizePhoneDigits(phone);
      await updateUserProfile({
        phone: normalizedPhoneDigits ? `${normalizeCountryCode(countryCode)}${normalizedPhoneDigits}` : '',
      });
      if (password.trim()) {
        await updateUserPassword(password.trim());
      }
      setPassword('');
      setMessage('Phone number and password were updated.');
    } catch (err: any) {
      setError(err?.message || 'Could not save your login details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F6F7FB', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', backgroundColor: '#fff', borderBottom: '1px solid #EEF0F4' }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: 700, color: '#111' }}>Login Details</h1>
        <div style={{ width: 36 }} />
      </header>

      <main style={{ padding: 20, display: 'grid', gap: 16 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, border: '1px solid #E8EAF0', display: 'grid', gap: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Phone and password</h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>
              Keep your fallback phone number current and change your password here anytime.
            </p>
          </div>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mobile Number</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={countryCode} onChange={(event) => setCountryCode(normalizeCountryCode(event.target.value))} placeholder="+91" style={{ width: 96, borderRadius: 16, border: '1px solid #E5E7EB', padding: '14px 16px', fontSize: 16, outline: 'none' }} />
              <input value={phone} onChange={(event) => setPhone(sanitizePhoneDigits(event.target.value))} placeholder="98765 43210" style={{ width: '100%', borderRadius: 16, border: '1px solid #E5E7EB', padding: '14px 16px', fontSize: 16, outline: 'none' }} />
            </div>
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep your current password" style={{ width: '100%', borderRadius: 16, border: '1px solid #E5E7EB', padding: '14px 16px', fontSize: 16, outline: 'none' }} />
          </label>

          {message && <div style={{ borderRadius: 14, backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{message}</div>}
          {error && <div style={{ borderRadius: 14, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <button onClick={handleSave} disabled={loading} style={{ width: '100%', border: 'none', borderRadius: 18, backgroundColor: '#111827', color: '#fff', padding: '16px 20px', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Save Login Details'}
          </button>
        </div>
      </main>
    </div>
  );
}
