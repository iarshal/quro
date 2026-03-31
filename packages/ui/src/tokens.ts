/**
 * @quro/ui — Soft Apricot Design Token System
 *
 * Single source of truth for the Quro design language.
 * All colors, typography, radii, shadows, and animation configs
 * live here. Import from both the web (CSS vars) and mobile (StyleSheet).
 *
 * STRICT RULE: Light mode only. No dark mode. Pure white backgrounds.
 */

// ── Color Palette ─────────────────────────────────────────────────────────────

export const COLORS = {
  // Brand — Soft Apricot
  brand: '#FFA488',          // Primary action, active states, scanner ring
  brandDark: '#E8845F',      // Pressed state for brand elements
  brandLight: '#FFE8D9',     // Tinted surfaces, selected backgrounds
  brandGlow: 'rgba(255, 164, 136, 0.35)', // Glow/shadow for the AR snap circle

  // Base
  bg: '#FFFFFF',             // App background — pure white
  surface: '#F7F8FA',        // Card/section surfaces — sterile light grey
  surfaceHover: '#F0F1F5',   // Hover state on surface cards

  // Text
  textPrimary: '#121212',    // All primary copy — near-black, high contrast
  textSecondary: '#8E8E93',  // Timestamps, captions, placeholder text
  textDisabled: '#C7C7CC',   // Disabled inputs/labels

  // Semantic
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',

  // Borders (hairline only — borderless design philosophy)
  border: 'rgba(0,0,0,0.06)',
  borderFocus: '#FFA488',    // Brand color on focus
} as const;

export type ColorKey = keyof typeof COLORS;

// ── Typography ────────────────────────────────────────────────────────────────

export const FONT_FAMILY = {
  // Primary: Inter — loaded via @fontsource/inter on web, expo-font on mobile
  sans: 'Inter',
  // Monospace: for Quro IDs, OTP codes
  mono: 'JetBrainsMono',
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const LINE_HEIGHT = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

// ── Spacing (8pt grid) ────────────────────────────────────────────────────────

export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// ── Border Radius (Squircle / Rounded) ────────────────────────────────────────

export const RADII = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 36,
  pill: 999,     // Fully rounded pills (buttons, tags)
  circle: '50%', // Perfect circles (avatars)
} as const;

// ── Shadows (Subtle, light-mode appropriate) ──────────────────────────────────

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 16px rgba(0,0,0,0.08)',
  lg: '0 8px 32px rgba(0,0,0,0.10)',
  brand: '0 4px 24px rgba(255,164,136,0.40)', // Apricot glow
  brandPulse: '0 0 0 12px rgba(255,164,136,0)', // Pulse animation start state
} as const;

// ── Motion & Spring Physics ───────────────────────────────────────────────────

/**
 * Spring config for react-native-reanimated withSpring()
 * Use on all interactive press handlers:
 *   onPressIn  → scale to 0.95
 *   onPressOut → spring back to 1.0
 */
export const SPRING = {
  // Standard interactive press — snappy, responsive
  press: {
    damping: 18,
    stiffness: 220,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },
  // Slower, bouncier — for the QR morph and avatar reveal
  morph: {
    damping: 14,
    stiffness: 160,
    mass: 1.2,
  },
  // Crisp snap — for the AR circle snap-on
  snap: {
    damping: 22,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

/**
 * Framer Motion spring config for the web app
 */
export const WEB_SPRING = {
  press: { type: 'spring', damping: 18, stiffness: 220 },
  morph: { type: 'spring', damping: 14, stiffness: 160, mass: 1.2 },
  snap: { type: 'spring', damping: 22, stiffness: 300, mass: 0.8 },
} as const;

/**
 * CSS transition strings for web elements that don't use framer-motion
 */
export const CSS_TRANSITIONS = {
  fast: 'all 0.15s ease',
  base: 'all 0.25s ease',
  slow: 'all 0.4s ease',
  morph: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy morph
} as const;

// ── Scanner / AR Specific ─────────────────────────────────────────────────────

export const SCANNER = {
  // The snap circle
  circleSize: 72,                        // px diameter of the snap circle
  circleColor: COLORS.brand,
  circleGlow: COLORS.brandGlow,
  circlePulseScale: 1.6,                // How much the pulse ring expands to
  circlePulseDuration: 600,             // ms for pulse animation

  // Viewfinder bounding box
  finderCornerLength: 28,               // px length of each corner bracket arm
  finderCornerThickness: 3,             // px
  finderCornerColor: COLORS.brand,
  finderCornerRadius: 4,                // px
} as const;

// ── QR Code Styling ───────────────────────────────────────────────────────────

export const QR_STYLE = {
  foregroundColor: COLORS.textPrimary,
  backgroundColor: COLORS.bg,
  size: 220,                            // px (web) / dp (mobile)
  logoSize: 48,                         // Quro logo in center of QR
  borderRadius: RADII.xl,
  padding: 20,
} as const;

// ── Z-Index Stack ─────────────────────────────────────────────────────────────

export const Z_INDEX = {
  base: 0,
  raised: 10,
  dropdown: 100,
  modal: 200,
  overlay: 300,
  scanner: 400,    // Scanner UI always on top of everything
  toast: 500,
} as const;
