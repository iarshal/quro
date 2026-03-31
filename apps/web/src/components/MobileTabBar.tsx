'use client';

/**
 * Mobile Tab Bar Component for PWA
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, ScanLine, Users, User, Camera } from 'lucide-react';

export function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Chats', path: '/m/app/chats', icon: <MessageCircle size={24} /> },
    { label: 'Scanner', path: '/m/app/scan', icon: <Camera size={26} />, isAction: true },
    { label: 'Contacts', path: '/m/app/contacts', icon: <Users size={24} /> },
    { label: 'Me', path: '/m/app/profile', icon: <User size={24} /> },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--color-bg)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        display: 'flex',
        flexDirection: 'row',
        zIndex: 'var(--z-raised)',
        height: 'calc(60px + env(safe-area-inset-bottom, 0))',
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || pathname?.startsWith(tab.path + '/');
        
        return (
          <Link
            key={tab.path}
            href={tab.path}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {tab.isAction ? (
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'var(--color-brand)',
                  borderRadius: 'var(--radius-circle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: 'var(--shadow-md)',
                  transform: 'translateY(-12px)',
                }}
              >
                {tab.icon}
              </motion.div>
            ) : (
              <>
                <motion.span
                  animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                  style={{ marginBottom: 2, display: 'flex', alignItems: 'center' }}
                >
                  {tab.icon}
                </motion.span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
