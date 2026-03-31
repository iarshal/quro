'use client';

/**
 * Mobile Profile Setup for PWA
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MobileButton } from '@/components/MobileButton';
import styles from './profile.module.css';

export default function MobileProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2 && gender;

  async function completeSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);

    try {
      const quroId = sessionStorage.getItem('__QURO_ID__');
      
      // In a real app, we'd sign up the user via Supabase, store the public key,
      // and redirect to the main app layout.
      // Mocking the success here.
      
      console.log(`[Quro DEV] Profile Created: ${name}, ${gender}, ${quroId}`);
      
      // Navigate to the mobile app home
      router.push('/m/app/chats');
    } catch (err) {
      console.error(err);
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

      <form className={styles.content} onSubmit={completeSetup}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={styles.titleGroup}>
          <h1 className={styles.title}>About You</h1>
          <p className={styles.subtitle}>What should friends call you?</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={styles.inputGroup}>
          <label className={styles.label}>Display Name</label>
          <input
            className={styles.input}
            placeholder="E.g. Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={styles.inputGroup}>
          <label className={styles.label}>Gender</label>
          <div className={styles.genderGrid}>
            {['Male', 'Female', 'Other', 'Prefer Not'].map((opt) => {
              const val = opt.toLowerCase().replace(' ', '_');
              const isSelected = gender === val;
              return (
                <button
                  key={val}
                  type="button"
                  className={`${styles.genderBtn} ${isSelected ? styles.activeGender : ''}`}
                  onClick={() => setGender(val)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </motion.div>

        <input type="submit" style={{ display: 'none' }} />
      </form>

      <motion.footer initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className={styles.footer}>
        <MobileButton type="button" onPress={() => completeSetup({ preventDefault: () => {} } as React.FormEvent)} disabled={!isValid || loading} style={{ width: '100%' }}>
          {loading ? 'Setting up...' : 'Finish Setup'}
        </MobileButton>
      </motion.footer>
    </div>
  );
}
