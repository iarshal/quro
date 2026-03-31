/**
 * Avatar Upload & Finalization — Onboarding Part 3
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING, SPRING } from '@quro/ui';

export default function AvatarScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  async function completeOnboarding() {
    setLoading(true);

    try {
      const quroId = (global as Record<string, unknown>).__QURO_ID__ as string;
      const name = (global as Record<string, unknown>).__PROFILE_NAME__ as string;
      const gender = (global as Record<string, unknown>).__PROFILE_GENDER__ as string;

      const { createBrowserClient } = await import('@quro/db');
      const { generateKeyPair, serializeKeyPair } = await import('@quro/crypto');

      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // 1. Generate E2EE Keys
      const keyPair = generateKeyPair();
      const { privateKey, publicKey } = serializeKeyPair(keyPair);

      // Save Private Key locally (in production use expo-secure-store)
      sessionStorage.setItem('quro_keys', JSON.stringify({ privateKey, publicKey }));

      // 2. Upload Avatar (mocked for now, just pretend or skip)
      let avatarUrl = null;
      if (image) {
        // In prod: supabase.storage.from('avatars').upload(...)
        avatarUrl = image;
      }

      // 3. Create Profile
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        quro_id: quroId,
        display_name: name,
        gender: gender as any,
        public_key: publicKey,
        avatar_url: avatarUrl,
      });

      if (error) throw error;

      router.replace('/(app)/(tabs)/');
    } catch (err) {
      console.error(err);
      // Fallback for dev/mock mode
      router.replace('/(app)/(tabs)/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>←</Text></Pressable>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <Text style={styles.title}>Add a photo</Text>
        <Text style={styles.subtitle}>Help your friends recognize you.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.avatarSection}>
        <Pressable id="btn-pick-avatar" onPress={pickImage} style={styles.avatarCircle}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Text style={styles.avatarIcon}>📷</Text>
          )}
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.bottomBar, btnStyle]}>
        <Pressable
          id="btn-complete-onboarding"
          onPressIn={() => { btnScale.value = withSpring(0.96, SPRING.press); }}
          onPressOut={() => { btnScale.value = withSpring(1, SPRING.press); }}
          onPress={completeOnboarding}
          disabled={loading}
          style={styles.continueBtn}
        >
          <Text style={styles.continueBtnText}>{loading ? 'Setting up...' : 'Finish Setup'}</Text>
        </Pressable>
        {!image && !loading && (
          <Pressable id="btn-skip-avatar" onPress={completeOnboarding} style={{ marginTop: SPACING[4] }}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING[6], paddingTop: 64 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: SPACING[4] },
  backText: { fontSize: 24, color: COLORS.textPrimary },
  header: { gap: SPACING[2], marginBottom: SPACING[12] },
  title: { fontSize: FONT_SIZE['2xl'], fontFamily: 'Inter-ExtraBold', color: COLORS.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontSize: FONT_SIZE.base, fontFamily: 'Inter-Regular', color: COLORS.textSecondary },
  avatarSection: { alignItems: 'center' },
  avatarCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: COLORS.border },
  image: { width: '100%', height: '100%' },
  avatarIcon: { fontSize: 40 },
  bottomBar: { position: 'absolute', bottom: 48, left: SPACING[6], right: SPACING[6], alignItems: 'center' },
  continueBtn: { width: '100%', paddingVertical: SPACING[4], backgroundColor: COLORS.brand, borderRadius: RADII.pill, alignItems: 'center', shadowColor: COLORS.brand, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 12 },
  continueBtnText: { fontSize: FONT_SIZE.md, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  skipText: { fontSize: FONT_SIZE.sm, fontFamily: 'Inter-SemiBold', color: COLORS.textSecondary },
});
