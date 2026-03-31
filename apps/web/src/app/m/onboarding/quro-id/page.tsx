// @ts-nocheck
'use client';

/**
 * Mobile Quro ID Setup for PWA
 * Auto-generates a 6-char ID, allows custom edits.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { MobileButton } from '@/components/MobileButton';
import { createBrowserClient } from '@quro/db';
import styles from './quro-id.module.css';

function generateRandomID() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function QuroIdPage() {
  const router = useRouter();
  const [quroId, setQuroId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Generate an aggressive default ID as requested
    setQuroId(generateRandomID());
  }, []);

  async function handleContinue() {
    if (quroId.length < 5) {
      setErrorMsg('Quro ID must be at least 5 characters');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createBrowserClient();
      
      // Get the currently authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');

      // Check if this Quro ID is already taken
      const { count, error: checkError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('quro_id', quroId)
        .neq('id', user.id); // exclude self if they already claimed it

      if (checkError) throw checkError;
      if (count && count > 0) throw new Error('Quro ID already taken.');

      // Update / Upsert the profile record
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // Must match auth user
          quro_id: quroId,
          display_name: `User_${quroId.substring(0, 4)}`, // Placeholder until next screen
          public_key: 'dummy-key-until-crypto-layer-inits', // Placeholders
        });

      if (upsertError) throw upsertError;

      // Session context set
      sessionStorage.setItem('__QURO_ID__', quroId);
      router.push('/m/onboarding/profile');

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim Quro ID.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={styles.card}
        >
          <div className={styles.iconWrapper}>
            <span className={styles.icon}><Sparkles size={32} color="var(--color-brandDark)" /></span>
          </div>
          
          <h1 className={styles.title}>Your Quro ID</h1>
          <p className={styles.subtitle}>
            This is unique to you. Friends can find you by searching this exact ID.
          </p>

          <div className={styles.idBox}>
            <span className={styles.idPrefix}>quro_</span>
            <input 
              type="text" 
              className={styles.idHighlight} 
              value={quroId}
              onChange={(e) => {
                setQuroId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setErrorMsg('');
              }}
              disabled={loading}
              maxLength={12}
            />
          </div>

          {errorMsg && <p style={{ color: 'var(--color-error)', fontSize: '14px', marginTop: '12px' }}>{errorMsg}</p>}

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={styles.actions}
        >
          <MobileButton variant="primary" fullWidth onClick={handleContinue} disabled={loading || quroId.length < 5}>
            {loading ? 'Claiming...' : 'Claim & Continue'}
          </MobileButton>
        </motion.div>
      </main>
    </div>
  );
}
