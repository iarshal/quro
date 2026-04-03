// @ts-nocheck
'use client';

/**
 * ChatLayout — WeChat-style desktop chat layout
 * Simplified for local-only operation
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QuroLogo } from './QuroLogo';

interface ChatLayoutProps {
  profile: any;
  authToken?: string;
}

export function ChatLayout({ profile }: ChatLayoutProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
        style={{
          width: 340,
          flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F7F7F7',
        }}
      >
        {/* Header */}
        <div style={{
          height: 56,
          padding: '0 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F7F7F7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: '#07C160', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}>
              {profile?.display_name?.charAt(0).toUpperCase() || 'Q'}
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Quro</h2>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', backgroundColor: '#EDEDED', borderRadius: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#999" strokeWidth="1.5" />
              <line x1="11" y1="11" x2="14" y2="14" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input type="text" placeholder="Search" style={{
              flex: 1, fontSize: 13, color: '#111', backgroundColor: 'transparent',
            }} />
          </div>
        </div>

        {/* Empty Chat List */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, color: '#CCC',
        }}>
          <QuroLogo size={48} />
          <p style={{ fontSize: 14 }}>No conversations yet</p>
          <p style={{ fontSize: 12, color: '#DDD' }}>Scan a friend&apos;s QR code to start</p>
        </div>
      </motion.aside>

      {/* Main Pane */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#EDEDED',
        }}
      >
        <QuroLogo size={64} />
        <h2 style={{ fontSize: 20, fontWeight: 500, color: '#999', marginTop: 16 }}>Quro Web</h2>
        <p style={{ fontSize: 14, color: '#CCC', marginTop: 4 }}>Device-Local Messaging 🔐</p>
      </motion.main>
    </div>
  );
}
