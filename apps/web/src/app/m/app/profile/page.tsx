'use client';

/**
 * Mobile "Me" / Profile Tab for PWA
 * Matches the WeChat "Me" section with iOS styling and DB integration.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, MonitorSmartphone, Settings, Bell, ChevronRight } from 'lucide-react';
import { createBrowserClient } from '@quro/db';
import styles from './profile.module.css';

interface ProfileData {
  display_name: string;
  quro_id: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not' | null;
  avatar_url: string | null;
}

export default function MobileMePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, quro_id, gender, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (data) setProfile(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    sessionStorage.removeItem('__QURO_ID__');
    router.replace('/m/welcome');
  }

  // Generate Gender Badge SVG based on profile
  const renderGenderBadge = () => {
    if (!profile?.gender || profile.gender === 'prefer_not' || profile.gender === 'other') return null;
    
    const isMale = profile.gender === 'male';
    const bgColor = isMale ? '#e3f2fd' : '#fce4ec';
    const color = isMale ? '#1e88e5' : '#e91e63';
    const icon = isMale ? '♂' : '♀';

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: color,
        fontSize: '10px',
        fontWeight: 'bold',
        marginLeft: '6px',
        verticalAlign: 'middle'
      }}>
        {icon}
      </span>
    );
  };

  if (loading) return <div className={styles.screen} />;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Me</h1>
      </header>

      <main className={styles.content}>
        {/* Profile Card */}
        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.avatar}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span>{profile?.display_name?.charAt(0).toUpperCase() || 'A'}</span>
            )}
          </div>
          <div className={styles.info}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h2 className={styles.name}>{profile?.display_name || 'Anonymous User'}</h2>
              {renderGenderBadge()}
            </div>
            <p className={styles.quroId}>Quro ID: quro_{profile?.quro_id}</p>
          </div>
          <button className={styles.qrBtn}>
            <span className={styles.qrIcon}><QrCode size={24} color="#666" /></span>
          </button>
        </motion.div>

        {/* WeChat-style/iOS Grouped Menu Lists */}
        <div className={styles.menuGroup}>
          <button className={styles.menuItem} onClick={() => router.push('/m/app/security')}>
            <span className={styles.menuIcon}><MonitorSmartphone size={22} color="#07C160" /></span>
            <span className={styles.menuLabel}>Linked Devices</span>
            <span className={styles.menuArrow}><ChevronRight size={18} /></span>
          </button>
        </div>

        <div className={styles.menuGroup}>
          <button className={styles.menuItem}>
            <span className={styles.menuIcon}><Bell size={22} color="#1890FF" /></span>
            <span className={styles.menuLabel}>Notifications</span>
            <span className={styles.menuArrow}><ChevronRight size={18} /></span>
          </button>
          <button className={styles.menuItem}>
            <span className={styles.menuIcon}><Settings size={22} color="#888" /></span>
            <span className={styles.menuLabel}>Settings</span>
            <span className={styles.menuArrow}><ChevronRight size={18} /></span>
          </button>
        </div>

        <div className={styles.menuGroup}>
          <button className={styles.menuItem} onClick={handleLogout}>
            <span className={styles.menuLabel} style={{ marginLeft: 0, textAlign: 'center', width: '100%', color: '#FA5151' }}>Log Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}
