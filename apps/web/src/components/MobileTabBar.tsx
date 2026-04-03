// @ts-nocheck
'use client';

/**
 * MobileTabBar — WeChat style with + at top header
 */

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const tabs = [
    {
      label: 'Chats',
      path: '/m/app/chats',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#07C160' : '#999'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      label: 'Contacts',
      path: '/m/app/contacts',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#07C160' : '#999'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Discover',
      path: '/m/app/status',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#07C160' : '#999'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
        </svg>
      ),
    },
    {
      label: 'Me',
      path: '/m/app/profile',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#07C160' : '#999'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
  ];

  const menuItems = [
    { label: 'Scan', svgPath: 'M2 7V2h5 M17 2h5v5 M22 17v5h-5 M7 22H2v-5', action: () => router.push('/m/app/scan') },
    { label: 'New Group', svgPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75', action: () => {} },
    { label: 'Add Contact', svgPath: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M12.5 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0z M20 8v6 M23 11h-6', action: () => {} },
  ];

  return (
    <>
      {/* Top + button (fixed at top right of the app) */}
      <div style={{
        position: 'fixed', top: 10, right: 12, zIndex: 100,
      }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: showMenu ? '#333' : 'rgba(0,0,0,0.04)',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.2s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showMenu ? '#fff' : '#111'} strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'transparent' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed', top: 50, right: 12, zIndex: 99,
                background: '#2E2E2E', borderRadius: 12,
                padding: '4px 0', minWidth: 180,
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setShowMenu(false); item.action(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 18px', color: '#fff', fontSize: 14, fontWeight: 500,
                    width: '100%', textAlign: 'left',
                    borderBottom: i < menuItems.length - 1 ? '0.5px solid rgba(255,255,255,0.08)' : 'none',
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.svgPath}/>
                  </svg>
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom tab bar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 56, backgroundColor: '#F7F7F7',
        borderTop: '0.5px solid rgba(0,0,0,0.08)',
        position: 'relative', zIndex: 10,
        flexShrink: 0,
      }}>
        {tabs.map(tab => {
          const active = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 16px', cursor: 'pointer',
              }}
            >
              {tab.icon(active)}
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 500,
                color: active ? '#07C160' : '#999',
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
