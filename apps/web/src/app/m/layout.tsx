'use client';

/**
 * Mobile App Root Layout (PWA Shell)
 * Restricts scrolling to give a native app feel and applies the
 * base mobile background.
 */

import { motion } from 'framer-motion';

export default function MobileRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100dvh', // Use dvh for mobile browser chrome handling
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}
