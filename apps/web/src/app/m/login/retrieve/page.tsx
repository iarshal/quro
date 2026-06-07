'use client';

/**
 * Account Retrieval Page
 * Fallback mechanism utilizing Firebase Phone OTP
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { setupRecaptcha, sendPhoneOTP, verifyPhoneOTP, cleanupRecaptcha } from '../../../../lib/phoneAuth';

export default function AccountRetrievalPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sendBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    return () => cleanupRecaptcha();
  }, []);

  async function handleSendCode() {
    if (phone.length < 10 || countdown > 0) return;
    setLoading(true);
    setCodeError('');
    try {
      const formatted = phone.startsWith('+') ? phone : `+${phone}`;
      setupRecaptcha('firebase-recaptcha-retrieve-container');
      await sendPhoneOTP(formatted);
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setCodeError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.MouseEvent) {
    e.preventDefault();
    setCodeError('');
    try {
      const res = await verifyPhoneOTP(otpCode.trim());
      if (res.verified) {
        setPhoneVerified(true);
      }
    } catch (err: any) {
      setPhoneVerified(false);
      setCodeError(err.message || 'Invalid code');
    }
  }

  async function handleLogin() {
    if (!phoneVerified) return;
    setLoading(true);
    setError('');
    // In production, call backend to retrieve session by verified phone
    setTimeout(() => {
      router.replace('/m/app/chats');
    }, 1000);
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F7F7F7', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#111', marginRight: 32 }}>
          Retrieve Account
        </h1>
      </header>

      <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>Security Check</h2>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
            Verify your registered phone number to retrieve and unlock your account.
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Registered Phone Number
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              disabled={codeSent && phoneVerified}
              placeholder="+91 98765 43210"
              style={{
                flex: 1, padding: '16px', backgroundColor: phoneVerified ? '#F3F4F6' : '#fff', borderRadius: 10,
                fontSize: 16, fontWeight: 500, color: '#111',
                border: '1.5px solid transparent', outline: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            />
            <button
              id="send-retrieve-btn"
              ref={sendBtnRef}
              onClick={handleSendCode}
              disabled={countdown > 0 || phone.length < 10 || loading || phoneVerified}
              style={{
                padding: '0 20px', backgroundColor: countdown > 0 || phoneVerified ? '#F3F4F6' : '#E0F2FE',
                color: countdown > 0 || phoneVerified ? '#9CA3AF' : '#0369A1', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: countdown > 0 || phone.length < 10 || phoneVerified ? 'default' : 'pointer',
              }}
            >
              {loading && !codeSent ? '...' : phoneVerified ? 'Verified ✓' : countdown > 0 ? `Resend (${countdown}s)` : 'Send Code'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8, lineHeight: 1.5 }}>
            On localhost, use a Firebase test number if real SMS is blocked by your project quota.
          </p>
          {codeError && !codeSent && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{codeError}</p>}
          <div id="firebase-recaptcha-retrieve-container" style={{ minHeight: 1 }} />
        </motion.div>

        {codeSent && !phoneVerified && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Verification Code
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text" value={otpCode} onChange={e => { setOtpCode(e.target.value); setCodeError(''); }}
                placeholder="Enter 6-digit code"
                style={{
                  flex: 1, padding: '16px', backgroundColor: '#fff', borderRadius: 10,
                  fontSize: 16, fontWeight: 500, color: '#111', letterSpacing: 4,
                  border: `1.5px solid ${codeError ? '#EF4444' : 'transparent'}`, outline: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onFocus={e => !codeError && (e.target.style.borderColor = '#07C160')}
                onBlur={e => !codeError && (e.target.style.borderColor = 'transparent')}
              />
              <button
                onClick={handleVerifyCode}
                disabled={otpCode.length < 6}
                style={{
                  padding: '0 20px', backgroundColor: otpCode.length >= 6 ? '#E0F2FE' : '#F3F4F6',
                  color: otpCode.length >= 6 ? '#0369A1' : '#9CA3AF', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: otpCode.length < 6 ? 'default' : 'pointer',
                }}
              >
                Verify
              </button>
            </div>
            {codeError && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{codeError}</p>}
          </motion.div>
        )}

        {error && <p style={{ color: '#EF4444', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>{error}</p>}
      </main>

      <div style={{ padding: '24px' }}>
        <button
          onClick={handleLogin}
          disabled={!phoneVerified || loading}
          style={{ width: '100%', padding: '16px', backgroundColor: !phoneVerified ? '#E5E7EB' : '#07C160', color: !phoneVerified ? '#9CA3AF' : '#fff', border: 'none', borderRadius: 10, fontSize: 17, fontWeight: 700, cursor: !phoneVerified ? 'default' : 'pointer' }}
        >
          {loading && phoneVerified ? 'Logging in...' : 'Login Now'}
        </button>
      </div>
    </div>
  );
}
