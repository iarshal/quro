'use client';

/**
 * Mobile Splash & Welcome Screen for PWA
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuroLogo } from '@/components/QuroLogo';
import { MobileButton } from '@/components/MobileButton';
import styles from './welcome.module.css';

export default function MobileWelcomePage() {
  const router = useRouter();

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 160, duration: 0.8 }}
          className={styles.brand}
        >
          <div className={styles.logoWrapper}>
            <QuroLogo size={80} />
          </div>
          <h1 className={styles.title}>Quro</h1>
          <p className={styles.subtitle}>Secure. Fast. Borderless.</p>
        </motion.div>
      </main>

      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, delay: 0.2 }}
        className={styles.footer}
      >
        <p className={styles.manifesto}>End-to-End Encrypted Messaging.</p>

        <MobileButton
          onPress={() => router.push('/m/onboarding/quro-id')}
          variant="primary"
          style={{ width: '100%', marginBottom: '16px' }}
        >
          Get Started
        </MobileButton>

        <p className={styles.legal}>
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </motion.footer>
    </div>
  );
}
