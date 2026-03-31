/**
 * Welcome Screen — Auth entry point
 *
 * The first screen users see. Features:
 * - Quro logo and brand name with a fade-up entrance
 * - "Get Started" CTA → phone number entry
 * - E2EE security trust badge
 *
 * Design: Full white, centered, minimal — lets the Soft Apricot CTA pop.
 */

import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPRING, SPACING } from '@quro/ui';

const { width: screenWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
  const btnScale = useSharedValue(1);

  const btnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  function handlePressIn() {
    btnScale.value = withSpring(0.95, SPRING.press);
  }

  function handlePressOut() {
    btnScale.value = withSpring(1, SPRING.press);
  }

  function goToPhone() {
    router.push('/(auth)/phone');
  }

  return (
    <View style={styles.screen}>
      {/* Logo + Brand */}
      <Animated.View
        style={styles.logoSection}
        entering={FadeIn.delay(100).duration(600)}
      >
        {/* Quro "Q" logo mark */}
        <View style={styles.logoMark}>
          <View style={styles.logoCircle} />
          <View style={styles.logoTail} />
        </View>

        <Text style={styles.brandName}>Quro</Text>
        <Text style={styles.tagline}>
          Secure QR messaging.{'\n'}No password, ever.
        </Text>
      </Animated.View>

      {/* Feature pill badges */}
      <Animated.View
        style={styles.badges}
        entering={FadeIn.delay(300).duration(600)}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔒 End-to-End Encrypted</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>📱 QR Login on Any Device</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚡ Zero-Latency Scanning</Text>
        </View>
      </Animated.View>

      {/* CTA buttons */}
      <Animated.View
        style={styles.ctaSection}
        entering={FadeIn.delay(500).duration(600)}
      >
        <Pressable
          id="btn-get-started"
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={goToPhone}
        >
          <Animated.View style={[styles.primaryBtn, btnAnimatedStyle]}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </Animated.View>
        </Pressable>

        <Pressable
          id="btn-email-login"
          onPress={() => router.push('/(auth)/email')}
        >
          <Text style={styles.altLink}>Use email instead</Text>
        </Pressable>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={styles.footer}
        entering={FadeIn.delay(700).duration(600)}
      >
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[20],
    paddingBottom: SPACING[8],
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── Logo ────────────────────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    gap: SPACING[4],
  },

  logoMark: {
    width: 88,
    height: 88,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    // Simulate Quro Q: circle + tail
    position: 'relative',
  },

  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },

  logoTail: {
    position: 'absolute',
    bottom: 17,
    right: 17,
    width: 16,
    height: 5,
    borderRadius: RADII.pill,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },

  brandName: {
    fontSize: 42,
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: -1.5,
  },

  tagline: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },

  // ── Badge pills ──────────────────────────────────────────────────────────
  badges: {
    gap: SPACING[2],
    alignItems: 'center',
  },

  badge: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.surface,
    borderRadius: RADII.pill,
  },

  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },

  // ── CTA ──────────────────────────────────────────────────────────────────
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING[4],
  },

  primaryBtn: {
    width: screenWidth - SPACING[6] * 2,
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.brand,
    borderRadius: RADII.pill,
    alignItems: 'center',
    // Soft Apricot glow shadow
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  primaryBtnText: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },

  altLink: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
  },

  footerText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textDisabled,
    textAlign: 'center',
  },
});
