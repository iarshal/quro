/**
 * Phone Number Entry Screen
 *
 * Collects a mobile number with country code, sends an OTP.
 * In mock/dev mode: OTP is generated locally and logged to console (no SMS sent).
 * In production: swap the `/api/otp/send` call to route through Twilio/MSG91.
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPRING, SPACING } from '@quro/ui';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const isValid = phone.replace(/\D/g, '').length >= 7;

  async function sendOTP() {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');

    const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

    try {
      // In mock mode: generate OTP locally and log it
      // In production: call your backend which uses Twilio to send a real SMS
      const { generateOTP } = await import('@quro/crypto');
      const mockCode = generateOTP();

      // Store for local verification (mock only)
      // In production this is stored server-side, never on device
      (global as Record<string, unknown>).__MOCK_OTP__ = mockCode;
      (global as Record<string, unknown>).__MOCK_PHONE__ = fullPhone;

      console.log(`==================================================`);
      console.log(`[Quro DEV] OTP for ${fullPhone}: ${mockCode}`);
      console.log(`==================================================`);

      // Navigate to OTP entry screen
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: fullPhone, method: 'phone' },
      });
    } catch (err) {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          id="btn-back-welcome"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.title}>Your phone number</Text>
          <Text style={styles.subtitle}>
            We&apos;ll send a one-time code to verify your number.
            {'\n'}No spam, ever.
          </Text>
        </Animated.View>

        {/* Phone input */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.inputGroup}>
          {/* Country code picker (simplified — tap to expand in production) */}
          <Pressable style={styles.countryCode} id="btn-country-code">
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Text style={styles.countryChevron}>▾</Text>
          </Pressable>

          <TextInput
            id="input-phone-number"
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            returnKeyType="done"
            onSubmitEditing={sendOTP}
            autoFocus
          />
        </Animated.View>

        {/* Error message */}
        {!!error && (
          <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
            {error}
          </Animated.Text>
        )}

        {/* Dev hint */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.devHint}>
          <Text style={styles.devHintText}>
            🧪 Dev Mode: OTP will be printed to the console, not sent via SMS.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Send OTP button — fixed at bottom */}
      <Animated.View style={[styles.bottomBar, btnStyle]}>
        <Pressable
          id="btn-send-otp"
          onPressIn={() => { btnScale.value = withSpring(0.96, SPRING.press); }}
          onPressOut={() => { btnScale.value = withSpring(1, SPRING.press); }}
          onPress={sendOTP}
          disabled={!isValid || loading}
          style={[styles.sendBtn, (!isValid || loading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendBtnText}>
            {loading ? 'Sending…' : 'Send Code'}
          </Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: {
    flex: 1,
    paddingHorizontal: SPACING[6],
    paddingTop: 64,
    paddingBottom: 120,
    gap: SPACING[6],
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },

  backText: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },

  title: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
    marginBottom: SPACING[2],
  },

  subtitle: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  inputGroup: {
    flexDirection: 'row',
    gap: SPACING[2],
    alignItems: 'center',
  },

  countryCode: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },

  countryCodeText: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },

  countryChevron: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    fontSize: FONT_SIZE.xl,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },

  errorText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.error,
  },

  devHint: {
    padding: SPACING[3],
    backgroundColor: '#FFF3CD',
    borderRadius: RADII.md,
  },

  devHintText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: '#856404',
    lineHeight: 16,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 48,
    left: SPACING[6],
    right: SPACING[6],
  },

  sendBtn: {
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

  sendBtnDisabled: {
    backgroundColor: COLORS.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },

  sendBtnText: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
