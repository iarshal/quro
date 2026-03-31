'use client';

/**
 * Mobile Phone Number Input for PWA
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MobileButton } from '@/components/MobileButton';
import styles from './phone.module.css';

export default function MobilePhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);

  const isValid = phone.replace(/\D/g, '').length >= 10;

  async function sendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    
    setLoading(true);

    try {
      const { generateOTP } = await import('@quro/crypto');
      const mockCode = generateOTP();

      // Store in session storage for the OTP screen to verify (mock flow)
      const fullPhone = `${countryCode} ${phone}`;
      sessionStorage.setItem('__MOCK_OTP__', mockCode);
      sessionStorage.setItem('__AUTH_PHONE__', fullPhone);

      console.log(`[Quro DEV] Mock Phone OTP for ${fullPhone}: ${mockCode}`);

      router.push(`/m/auth/otp?phone=${encodeURIComponent(fullPhone)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ←
        </button>
      </header>

      <form className={styles.content} onSubmit={sendOTP}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.titleGroup}
        >
          <h1 className={styles.title}>Your phone number</h1>
          <p className={styles.subtitle}>We'll send a secure one-time code.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={styles.inputGroup}
        >
          <div className={styles.countrySelector}>
            <select
              className={styles.countrySelect}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option value="+1">🇺🇸 +1</option>
              <option value="+91">🇮🇳 +91</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
            </select>
          </div>
          <input
            autoFocus
            type="tel"
            className={styles.phoneInput}
            placeholder="(555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </motion.div>
        
        {/* Hidden submit so pressing "Go" on mobile keyboard works */}
        <input type="submit" style={{ display: 'none' }} />
      </form>

      <motion.footer
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.2 }}
        className={styles.footer}
      >
        <MobileButton
          type="button"
          onPress={() => sendOTP({ preventDefault: () => {} } as React.FormEvent)}
          disabled={!isValid || loading}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          {loading ? 'Sending...' : 'Send Code'}
        </MobileButton>
        <button 
          className={styles.emailFallbackBtn}
          onClick={() => router.push('/m/auth/email')}
        >
          Or continue with Email
        </button>
      </motion.footer>
    </div>
  );
}
