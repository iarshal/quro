'use client';

/**
 * Account Recovery via Email OTP
 * Clean, minimal UI for entering email and 6-digit code.
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sendOTP, verifyOTP } from '../../../lib/api';

export default function RecoverPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendOTP(email.trim());
      setSuccess(res.message);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP(email.trim(), fullCode);
      if (res.verified && res.session_token) {
        localStorage.setItem('quro_session', JSON.stringify({
          token: res.session_token,
          quroId: res.quro_id,
          displayName: res.display_name,
          loggedInAt: new Date().toISOString(),
        }));
        router.replace('/m/app/chats');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#050505', color: '#fff', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400 }}>
        
        {/* Back */}
        <button onClick={() => step === 'code' ? setStep('email') : router.back()} style={{ background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          {step === 'code' ? 'Change email' : 'Back'}
        </button>

        {/* Icon */}
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {step === 'email' ? 'Account Recovery' : 'Enter Verification Code'}
        </h1>
        <p style={{ fontSize: 15, color: '#888', marginBottom: 32, lineHeight: 1.5 }}>
          {step === 'email' 
            ? "Enter the email linked to your Quro account. We'll send a one-time code." 
            : `We sent a 6-digit code to ${email}`}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '16px 20px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                color: '#fff', fontSize: 16, outline: 'none', marginBottom: 16,
                boxSizing: 'border-box',
              }}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px', background: '#fff', color: '#000',
                border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Recovery Code'}
            </motion.button>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                    background: 'rgba(255,255,255,0.05)', border: digit ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, color: '#fff', outline: 'none',
                    transition: 'border 0.2s',
                  }}
                />
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleVerify}
              disabled={loading || code.join('').length !== 6}
              style={{
                width: '100%', padding: '16px', background: code.join('').length === 6 ? '#fff' : 'rgba(255,255,255,0.1)',
                color: code.join('').length === 6 ? '#000' : '#666',
                border: 'none', borderRadius: 100, fontSize: 16, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </motion.button>
          </div>
        )}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#EF4444', fontSize: 14, fontWeight: 600, marginTop: 16, textAlign: 'center' }}>
            {error}
          </motion.p>
        )}
        {success && step === 'code' && (
          <p style={{ color: '#10B981', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{success}</p>
        )}

      </motion.div>
    </div>
  );
}
