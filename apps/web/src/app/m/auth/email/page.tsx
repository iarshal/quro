// @ts-nocheck
'use client';

/**
 * Mobile Email Auth for PWA
 * WeChat style clean input.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@quro/db'; // Will be replaced by actual path checking
import { MobileButton } from '@/components/MobileButton';
import styles from './email.module.css';

export default function MobileEmailAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      
      if (error) {
        throw error;
      }
      
      // Navigate to OTP screen
      router.push(`/m/auth/otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send code.');
      setLoading(false);
    }
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className={styles.title}>Log in with Email</h1>
          <p className={styles.subtitle}>Enter your email address. We will send you a 6-digit confirmation code.</p>

          <form onSubmit={handleSendCode} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="example@quro.app"
                className={styles.input}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.actions}>
              <MobileButton 
                variant="primary" 
                type="submit"
                disabled={!email || loading}
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </MobileButton>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
