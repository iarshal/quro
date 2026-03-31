/**
 * OTP Verification Screen
 *
 * 6-digit OTP input with:
 * - Auto-advance on each digit typed
 * - Auto-focus on first digit
 * - Spring bounce animation on each digit entry
 * - Haptic feedback on completion
 * - Resend with 60s countdown
 *
 * Mock mode: Accepts the locally stored OTP from console.
 * Production mode: Validates via Supabase Auth verifyOtp endpoint.
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Vibration,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPRING, SPACING } from '@quro/ui';
import { createBrowserClient } from '@quro/db';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { phone, email, method } = useLocalSearchParams<{
    phone?: string;
    email?: string;
    method: 'phone' | 'email';
  }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focused, setFocused] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const digitScales = Array(OTP_LENGTH).fill(0).map(() => useSharedValue(1));

  const identifier = method === 'phone' ? phone! : email!;
  const masked = method === 'phone'
    ? `+*** *** ${identifier.slice(-4)}`
    : identifier.replace(/(.{2}).*(@.*)/, '$1***$2');

  // Resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  function handleDigitChange(index: number, value: string) {
    const digit = value.slice(-1); // Only last char (handles paste)

    // Bounce animation
    digitScales[index].value = withSequence(
      withSpring(1.2, SPRING.snap),
      withSpring(1, SPRING.press)
    );

    // Haptic on each digit
    Haptics.selectionAsync();

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocused(index + 1);
    }

    // Auto-submit when complete
    if (digit && index === OTP_LENGTH - 1) {
      const code = [...newDigits.slice(0, OTP_LENGTH - 1), digit].join('');
      if (code.length === OTP_LENGTH) {
        verifyOTP(code);
      }
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocused(index - 1);
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
  }

  async function verifyOTP(code: string) {
    setLoading(true);
    setError('');

    try {
      // ── Mock verification ──────────────────────────────────────────────────
      const mockOTP = (global as Record<string, unknown>).__MOCK_OTP__;
      if (mockOTP) {
        if (code !== String(mockOTP)) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError('Incorrect code. Check the console for the mock OTP.');
          setDigits(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
          setLoading(false);
          return;
        }

        // Mock success — trigger heavy haptic confirmation
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Check if user already has a profile → go to app, else onboarding
        // For mock: always go to onboarding on first login
        const hasProfile = false; // In production: check Supabase `profiles` table
        if (hasProfile) {
          router.replace('/(app)/(tabs)/');
        } else {
          router.replace('/(onboarding)/quro-id');
        }
        return;
      }

      // ── Production: Supabase Verify OTP ─────────────────────────────────
      const supabase = createBrowserClient();
      const verfiyPayload = method === 'phone'
        ? { phone: identifier, token: code, type: 'sms' as const }
        : { email: identifier, token: code, type: 'email' as const };

      const { data, error: authError } = await supabase.auth.verifyOtp(verfiyPayload);

      if (authError || !data.session) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('Invalid or expired code. Please try again.');
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      // Store session
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check for existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user!.id)
        .single();

      if (profile) {
        router.replace('/(app)/(tabs)/');
      } else {
        router.replace('/(onboarding)/quro-id');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const code = digits.join('');

  return (
    <View style={styles.screen}>
      {/* Back */}
      <Pressable id="btn-back-otp" onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <Text style={styles.title}>Enter the code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.identifierText}>{masked}</Text>
        </Text>
      </Animated.View>

      {/* OTP Digit Inputs */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        style={styles.otpRow}
      >
        {Array(OTP_LENGTH).fill(0).map((_, i) => {
          const digitStyle = useAnimatedStyle(() => ({
            transform: [{ scale: digitScales[i].value }],
          }));

          return (
            <Animated.View key={i} style={[styles.digitWrapper, digitStyle]}>
              <TextInput
                ref={(ref) => { inputRefs.current[i] = ref; }}
                id={`input-otp-digit-${i}`}
                style={[
                  styles.digitInput,
                  focused === i && styles.digitInputFocused,
                  digits[i] && styles.digitInputFilled,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digits[i]}
                onChangeText={(v) => handleDigitChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                onFocus={() => setFocused(i)}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                selectTextOnFocus
              />
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Error */}
      {!!error && (
        <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
          {error}
        </Animated.Text>
      )}

      {/* Verify button (shows when not auto-submitted) */}
      {code.length === OTP_LENGTH && !loading && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.verifyBtnWrapper}>
          <Pressable
            id="btn-verify-otp"
            onPress={() => verifyOTP(code)}
            style={styles.verifyBtn}
          >
            <Text style={styles.verifyBtnText}>Verify →</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Resend */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.resendRow}>
        {resendCountdown > 0 ? (
          <Text style={styles.resendHint}>
            Resend code in {resendCountdown}s
          </Text>
        ) : (
          <Pressable
            id="btn-resend-otp"
            onPress={() => {
              setResendCountdown(60);
              router.back();
            }}
          >
            <Text style={styles.resendLink}>Resend code</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING[6],
    paddingTop: 64,
    gap: SPACING[8],
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },

  header: {
    gap: SPACING[2],
  },

  title: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  identifierText: {
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },

  otpRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    justifyContent: 'center',
  },

  digitWrapper: {
    // Animated wrapper for bounce
  },

  digitInput: {
    width: 48,
    height: 60,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    fontSize: FONT_SIZE['2xl'],
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  digitInputFocused: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandLight,
  },

  digitInputFilled: {
    borderColor: COLORS.brandLight,
    color: COLORS.brandDark,
  },

  errorText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.error,
    textAlign: 'center',
  },

  verifyBtnWrapper: {
    alignItems: 'center',
  },

  verifyBtn: {
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[10],
    backgroundColor: COLORS.brand,
    borderRadius: RADII.pill,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },

  verifyBtnText: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },

  resendRow: {
    alignItems: 'center',
  },

  resendHint: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  resendLink: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.brand,
    textDecorationLine: 'underline',
  },
});
