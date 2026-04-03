// @ts-nocheck
'use client';

/**
 * WeChat-Style "Me" Profile Tab (NO emojis — SVG icons only)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getFaceData, type QuroProfile } from '../../../../lib/faceStore';
import { clearSession, getSession } from '../../../../lib/localSession';
import { generatePersonalQR } from '../../../../lib/qrUtils';

export default function MobileMePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<QuroProfile | null>(null);
  const [qrSrc, setQrSrc] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) { router.replace('/m/welcome'); return; }
      const data = await getFaceData();
      if (data) {
        setProfile(data);
        const qr = await generatePersonalQR(data.quroId);
        setQrSrc(qr);
      }
    }
    load();
  }, [router]);

  const genderInfo: Record<string, { label: string; color: string; bg: string }> = {
    male: { label: 'M', color: '#3B82F6', bg: '#EFF6FF' },
    female: { label: 'F', color: '#EC4899', bg: '#FDF2F8' },
    transgender: { label: 'T', color: '#8B5CF6', bg: '#F5F3FF' },
    other: { label: 'O', color: '#F59E0B', bg: '#FFFBEB' },
  };

  function handleLogout() {
    clearSession();
    router.replace('/');
  }

  if (!profile) return <div style={{ height: '100dvh', backgroundColor: '#EDEDED' }} />;

  const gender = genderInfo[profile.gender] || genderInfo.other;

  const menuItems = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      ),
      label: 'Security Center',
      action: () => router.push('/m/app/security'),
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      label: 'Favorites',
      action: () => {},
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ),
      label: 'Settings',
      action: () => {},
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#EDEDED', overflowY: 'auto' }}>
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          backgroundColor: '#fff', padding: '60px 20px 20px',
          display: 'flex', alignItems: 'center', cursor: 'pointer',
        }}
        onClick={() => setShowQR(true)}
      >
        <div style={{
          width: 64, height: 64, borderRadius: 12, overflow: 'hidden', marginRight: 16,
          flexShrink: 0, backgroundColor: '#E8F9EF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
              {profile.displayName}
            </h2>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: gender.bg, color: gender.color,
              fontSize: 11, fontWeight: 700,
            }}>
              {gender.label}
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#999' }}>Quro ID: quro_{profile.quroId}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </motion.div>

      {/* Menu Sections */}
      <div style={{ marginTop: 8 }}>
        {menuItems.map((item, i) => (
          <div key={i} className="wechat-section" style={i > 0 ? { borderTop: 'none', marginTop: 0 } : {}}>
            <button className="wechat-menu-item" onClick={item.action} style={{ width: '100%' }}>
              <span style={{ marginRight: 16, display: 'flex' }}>{item.icon}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: '#111' }}>{item.label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        ))}

        {/* Logout */}
        <div className="wechat-section" style={{ marginTop: 8 }}>
          <button className="wechat-menu-item" onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#FA5151' }}>Log Out</span>
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowQR(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', borderRadius: 24, padding: 32,
              textAlign: 'center', maxWidth: 300,
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
              margin: '0 auto 16px', backgroundColor: '#E8F9EF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profile.avatarDataUrl ? (
                <img src={profile.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 4 }}>
              {profile.displayName}
            </h3>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Quro ID: quro_{profile.quroId}</p>
            {qrSrc && (
              <img src={qrSrc} alt="My QR Code" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 12 }} />
            )}
            <p style={{ fontSize: 11, color: '#CCC', marginTop: 12 }}>
              Scan to add me
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
