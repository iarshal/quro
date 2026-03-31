// @ts-nocheck
'use client';

/**
 * Mobile OTP Validation for PWA
 * WeChat style 6-digit grouped block.
 */

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@quro/db'; // Using DB package singleton
import { MobileButton } from '@/components/MobileButton';
import styles from './otp.module.css';

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Automatically submit when all 6 digits are filled
  useEffect(() => {
    if (digits.every(d => d !== '')) {
      verifyOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  // Focus management
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    // Take only the last character if multiple are pasted
    const val = value.slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);
    setErrorMsg('');

    // Auto-advance
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move backwards on empty backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async () => {
    const token = digits.join('');
    if (token.length < 6 || !email) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw error;
      if (!data.user) throw new Error('User data not found after verification');

      // Check if user has completed profile onboarding
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('quro_id')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "No rows found"
        throw profileError;
      }

      if (!profile || !profile.quro_id) {
        // Needs onboarding
        router.push('/m/onboarding/quro-id');
      } else {
        // Ready to rock
        router.push('/m/app/chats');
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
      setLoading(false);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  if (!email) {
    return (
      <div className={styles.screen}>
         <div className={styles.content}>
           <p className={styles.error}>Missing email parameter. Return to previous step.</p>
           <button onClick={() => router.back()} className={styles.resendBtn}>Go Back</button>
         </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()} type="button">
          ←
        </button>
      </header>

      <main className={styles.content}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className={styles.title}>Enter Code</h1>
          <p className={styles.subtitle}>
            Code sent to <span className={styles.highlight}>{email}</span>
          </p>

          <div className={styles.otpGrid}>
            {digits.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`${styles.otpInput} ${d ? styles.filled : ''}`}
                disabled={loading}
                autoFocus={idx === 0}
              />
            ))}
          </div>
          
          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <div className={styles.actions}>
            <button className={styles.resendBtn} disabled={loading}>
              Resend Code
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function MobileOTPPage() {
  return (
    <Suspense fallback={<div className={styles.screen}>Loading OTP module...</div>}>
      <OTPForm />
    </Suspense>
  );
}
