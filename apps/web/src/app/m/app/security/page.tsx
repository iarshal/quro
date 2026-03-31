'use client';

/**
 * Mobile Security Center for PWA
 * WeChat style Linked Devices manager.
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Monitor } from 'lucide-react';
import styles from './security.module.css';

export default function MobileSecurityPage() {
  const router = useRouter();

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ←
        </button>
        <h1 className={styles.title}>Account Security</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.securityHeader}>
          <div className={styles.shieldIcon}><ShieldCheck size={48} strokeWidth={1.5} /></div>
          <h2 className={styles.shieldText}>Your account is protected with End-to-End Encryption.</h2>
        </div>

        <h3 className={styles.sectionTitle}>Linked Devices (1)</h3>
        
        <div className={styles.deviceList}>
          {/* Active Desktop Device Mock */}
          <motion.div 
            className={styles.deviceCard}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className={styles.deviceIcon}><Monitor size={24} /></div>
            <div className={styles.deviceInfo}>
              <p className={styles.deviceName}>Mac Desktop (Chrome)</p>
              <p className={styles.deviceStatus}>Active now · Mumbai, IN</p>
            </div>
            <button className={styles.logoutBtn}>Log Out</button>
          </motion.div>
        </div>

        <p className={styles.securityHint}>
          Logging out will instantly destroy the encryption keys on the target device. They will immediately lose access to your chat history.
        </p>
      </main>
    </div>
  );
}
