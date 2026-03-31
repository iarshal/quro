/**
 * Email Entry Screen (Alternative to phone)
 */

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING, SPRING } from '@quro/ui';

export default function EmailScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const isValid = email.includes('@') && email.includes('.');

  async function sendOTP() {
    if (!isValid || loading) return;
    setLoading(true);

    try {
      const { generateOTP } = await import('@quro/crypto');
      const mockCode = generateOTP();

      (global as Record<string, unknown>).__MOCK_OTP__ = mockCode;

      console.log(`==================================================`);
      console.log(`[Quro DEV] Mock Email OTP for ${email}: ${mockCode}`);
      console.log(`==================================================`);

      router.push({
        pathname: '/(auth)/otp',
        params: { email, method: 'email' },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.scroll}>
        <Pressable id="btn-back-welcome" onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.title}>Your email address</Text>
          <Text style={styles.subtitle}>We&apos;ll send a secure one-time code.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.inputGroup}>
          <TextInput
            id="input-email"
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendOTP}
            autoFocus
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomBar, btnStyle]}>
        <Pressable
          id="btn-send-email-otp"
          onPressIn={() => { btnScale.value = withSpring(0.96, SPRING.press); }}
          onPressOut={() => { btnScale.value = withSpring(1, SPRING.press); }}
          onPress={sendOTP}
          disabled={!isValid || loading}
          style={[styles.sendBtn, (!isValid || loading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendBtnText}>{loading ? 'Sending…' : 'Send Code'}</Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: SPACING[6], paddingTop: 64, gap: SPACING[6] },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: FONT_SIZE['2xl'], fontFamily: 'Inter-ExtraBold', color: COLORS.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontSize: FONT_SIZE.base, fontFamily: 'Inter-Regular', color: COLORS.textSecondary },
  inputGroup: { marginTop: SPACING[4] },
  input: { paddingHorizontal: SPACING[5], paddingVertical: SPACING[4], backgroundColor: COLORS.surface, borderRadius: RADII.lg, fontSize: FONT_SIZE.xl, fontFamily: 'Inter-Medium', color: COLORS.textPrimary },
  bottomBar: { position: 'absolute', bottom: 48, left: SPACING[6], right: SPACING[6] },
  sendBtn: { paddingVertical: SPACING[4], backgroundColor: COLORS.brand, borderRadius: RADII.pill, alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.textDisabled },
  sendBtnText: { fontSize: FONT_SIZE.md, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
});
