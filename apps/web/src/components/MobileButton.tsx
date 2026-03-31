'use client';

/**
 * MobileButton Component
 *
 * Provides native-like press animations (shrinks on press down, springs back up)
 * using framer-motion instead of react-native-reanimated for the web version.
 */

import { motion } from 'framer-motion';
import { CSSProperties, ReactNode } from 'react';

interface MobileButtonProps {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  type?: 'button' | 'submit';
}

export function MobileButton({
  onPress,
  children,
  variant = 'primary',
  disabled = false,
  style,
  className = '',
  type = 'button',
}: MobileButtonProps) {
  // Styles based on variant
  let btnClass = '';
  switch (variant) {
    case 'primary':
      btnClass = 'btn-primary';
      break;
    case 'outline':
      // Basic outline fallback
      btnClass = 'btn-outline';
      break;
    default:
      btnClass = '';
  }

  // Base mobile tap styles
  const baseStyles: CSSProperties = {
    padding: 'var(--space-4) var(--space-6)',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 700,
    fontSize: 'var(--text-md)',
    fontFamily: 'Inter, sans-serif',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: variant === 'primary' && !disabled ? 'var(--shadow-brand)' : 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    ...style,
  };

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onPress}
      className={`${btnClass} ${className}`}
      style={baseStyles}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', damping: 18, stiffness: 220 }}
    >
      {children}
    </motion.button>
  );
}
