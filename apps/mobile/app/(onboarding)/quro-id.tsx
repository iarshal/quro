/**
 * Quro ID Reveal Screen — First step of onboarding
 *
 * Generates a unique 5-char Quro ID, validates it's not taken,
 * then presents it to the user with a reveal animation.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Clipboard,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING, SPRING } from '@quro/ui';
import { generateQuroId } from '@quro/crypto';
import { createBrowserClient, isQuroIdTaken } from '@quro/db';

export default function QuroIdScreen() {
  const [quroId, setQuroId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));
  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));

  useEffect(() => {
    generateId();
  }, []);

  async function generateId() {
    setLoading(true);
    const supabase = createBrowserClient();

    let id = '';
    let attempts = 0;

    do {
      id = generateQuroId();
      const taken = await isQuroIdTaken(supabase, id);
      if (!taken) break;
      attempts++;
    } while (attempts < 10);

    setQuroId(id);
    setLoading(false);

    // Animate card in
    cardScale.value = withSpring(1, SPRING.morph);
    cardOpacity.value = withTiming(1, { duration: 400 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function copyId() {
    Clipboard.setString(quroId);
    setCopied(true);
    bounceScale.value = withSequence(
      withSpring(1.1, SPRING.snap),
      withSpring(1, SPRING.press)
    );
    Haptics.selectionAsync();
    setTimeout(() => setCopied(false), 2000);
  }

  function proceed() {
    // Store the generated ID in session for the next onboarding step
    (global as Record<string, unknown>).__QURO_ID__ = quroId;
    router.push('/(onboarding)/profile');
  }

  return (
    <View style={styles.screen}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <Text style={styles.title}>Your Quro ID</Text>
        <Text style={styles.subtitle}>
          This is your unique identity on Quro.{'\n'}
          Share it with friends to connect.
        </Text>
      </Animated.View>

      {/* ID reveal card */}
      <Animated.View style={[styles.idCard, cardStyle]}>
        {loading ? (
          <View style={styles.generatingRow}>
            <Text style={styles.generatingText}>Generating your ID…</Text>
          </View>
        ) : (
          <>
            <View style={styles.quroPrefix}>
              <Text style={styles.quroPrefixText}>Quro:</Text>
            </View>
            <Animated.View style={bounceStyle}>
              <Text style={styles.idText}>{quroId}</Text>
            </Animated.View>

            <Pressable
              id="btn-copy-quro-id"
              style={styles.copyBtn}
              onPress={copyId}
            >
              <Text style={styles.copyBtnText}>{copied ? '✓ Copied!' : 'Copy ID'}</Text>
            </Pressable>
          </>
        )}
      </Animated.View>

      {/* Info bullets */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.bullets}>
        <BulletRow icon="🔒" text="Your ID is permanent and unique" />
        <BulletRow icon="👥" text="Friends can search you by this ID" />
        <BulletRow icon="📱" text="Your QR code encodes this ID" />
      </Animated.View>

      {/* Continue */}
      <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.bottomBar}>
        <Pressable
          id="btn-continue-to-profile"
          style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
          onPress={proceed}
          disabled={loading}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function BulletRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletIcon}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING[6],
    paddingTop: 80,
    paddingBottom: SPACING[8],
    gap: SPACING[8],
  },

  header: {
    gap: SPACING[2],
  },

  title: {
    fontSize: FONT_SIZE['3xl'],
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  idCard: {
    backgroundColor: COLORS.brand,
    borderRadius: RADII['2xl'],
    padding: SPACING[8],
    alignItems: 'center',
    gap: SPACING[4],
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },

  generatingRow: {
    paddingVertical: SPACING[6],
  },

  generatingText: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },

  quroPrefix: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADII.pill,
  },

  quroPrefixText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  idText: {
    fontSize: 52,
    fontFamily: 'Inter-ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 8,
    textAlign: 'center',
  },

  copyBtn: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[2],
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: RADII.pill,
  },

  copyBtnText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },

  bullets: {
    gap: SPACING[3],
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },

  bulletIcon: {
    fontSize: 20,
    width: 28,
  },

  bulletText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    flex: 1,
  },

  bottomBar: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  continueBtn: {
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.brand,
    borderRadius: RADII.pill,
    alignItems: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  continueBtnDisabled: {
    backgroundColor: COLORS.textDisabled,
    shadowOpacity: 0,
  },

  continueBtnText: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
