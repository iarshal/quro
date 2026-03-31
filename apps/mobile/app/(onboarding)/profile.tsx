/**
 * Profile Setup Screen — Onboarding Part 2
 *
 * Collects Display Name, Gender, and Birthday.
 * Wheel pickers are used for a premium iOS feel.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING, SPRING } from '@quro/ui';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male'|'female'|'other'|'prefer_not'|null>(null);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const isValid = name.trim().length >= 2 && gender;

  function proceed() {
    if (!isValid) return;

    // Save to globals for the final Avatar step
    (global as Record<string, unknown>).__PROFILE_NAME__ = name.trim();
    (global as Record<string, unknown>).__PROFILE_GENDER__ = gender;

    router.push('/(onboarding)/avatar');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <Pressable id="btn-back-quro-id" onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <Text style={styles.title}>About You</Text>
          <Text style={styles.subtitle}>What should friends call you?</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            id="input-display-name"
            style={styles.input}
            placeholder="E.g. Alex"
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoCorrect={false}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderGrid}>
            <GenderOption label="Male" value="male" selected={gender} onSelect={setGender} />
            <GenderOption label="Female" value="female" selected={gender} onSelect={setGender} />
            <GenderOption label="Other" value="other" selected={gender} onSelect={setGender} />
            <GenderOption label="Prefer Not" value="prefer_not" selected={gender} onSelect={setGender} />
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.bottomBar, btnStyle]}>
        <Pressable
          id="btn-continue-avatar"
          onPressIn={() => { btnScale.value = withSpring(0.96, SPRING.press); }}
          onPressOut={() => { btnScale.value = withSpring(1, SPRING.press); }}
          onPress={proceed}
          disabled={!isValid}
          style={[styles.continueBtn, !isValid && styles.disabledBtn]}
        >
          <Text style={styles.continueBtnText}>Continue →</Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function GenderOption({
  label,
  value,
  selected,
  onSelect
}: {
  label: string;
  value: any;
  selected: any;
  onSelect: (v: any) => void;
}) {
  const isSelected = selected === value;
  return (
    <Pressable
      id={`btn-gender-${value}`}
      style={[styles.genderBtn, isSelected && styles.genderBtnActive]}
      onPress={() => onSelect(value)}
    >
      <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: SPACING[6], paddingTop: 64, paddingBottom: 120, gap: SPACING[8] },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { fontSize: 24, color: COLORS.textPrimary },
  header: { gap: SPACING[2] },
  title: { fontSize: FONT_SIZE['2xl'], fontFamily: 'Inter-ExtraBold', color: COLORS.textPrimary, letterSpacing: -0.8 },
  subtitle: { fontSize: FONT_SIZE.base, fontFamily: 'Inter-Regular', color: COLORS.textSecondary },
  inputGroup: { gap: SPACING[3] },
  label: { fontSize: FONT_SIZE.sm, fontFamily: 'Inter-SemiBold', color: COLORS.textPrimary },
  input: { paddingHorizontal: SPACING[5], paddingVertical: SPACING[4], backgroundColor: COLORS.surface, borderRadius: RADII.lg, fontSize: FONT_SIZE.lg, fontFamily: 'Inter-Medium', color: COLORS.textPrimary },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3] },
  genderBtn: { paddingVertical: SPACING[3], paddingHorizontal: SPACING[4], backgroundColor: COLORS.surface, borderRadius: RADII.pill, borderWidth: 2, borderColor: 'transparent' },
  genderBtnActive: { backgroundColor: COLORS.brandLight, borderColor: COLORS.brand },
  genderText: { fontSize: FONT_SIZE.sm, fontFamily: 'Inter-Medium', color: COLORS.textSecondary },
  genderTextActive: { color: COLORS.brandDark, fontFamily: 'Inter-Bold' },
  bottomBar: { position: 'absolute', bottom: 48, left: SPACING[6], right: SPACING[6] },
  continueBtn: { paddingVertical: SPACING[4], backgroundColor: COLORS.brand, borderRadius: RADII.pill, alignItems: 'center', shadowColor: COLORS.brand, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 12 },
  disabledBtn: { backgroundColor: COLORS.textDisabled, shadowOpacity: 0, elevation: 0 },
  continueBtnText: { fontSize: FONT_SIZE.md, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
});
