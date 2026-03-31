/**
 * Profile Tab — Own profile + personal QR code card
 * This QR code encodes quro://user/<quroId> for friend adds
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING } from '@quro/ui';
import type { Profile } from '@quro/db';

const { width: SCREEN_W } = Dimensions.get('window');

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { createBrowserClient } = await import('@quro/db');
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/(auth)/welcome'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        generateProfileQR(data.quro_id);
      }
    } catch { /* silent */ }
  }

  async function generateProfileQR(quroId: string) {
    // On mobile: use a simple QR library or the expo-barcode module
    // The encoded content: quro://user/<quroId>
    setQrDataUrl(`quro://user/${quroId}`);
  }

  async function handleSignOut() {
    const { createBrowserClient } = await import('@quro/db');
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  }

  async function handleShare() {
    await Share.share({
      message: `Add me on Quro! My ID is: ${profile?.quro_id}\n\nDownload Quro: https://quro.app`,
      title: 'My Quro ID',
    });
  }

  if (!profile) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.spinner} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          id="btn-edit-profile"
          style={styles.editBtn}
          onPress={() => router.push('/(onboarding)/profile')}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
      </View>

      {/* Avatar + Name card */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLetter}>
            {profile.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.displayName}>{profile.display_name}</Text>
        <View style={styles.quroIdPill}>
          <Text style={styles.quroIdLabel}>Quro ID</Text>
          <Text style={styles.quroIdValue}>{profile.quro_id}</Text>
        </View>
      </Animated.View>

      {/* Personal QR Code card */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.qrCard}>
        <Text style={styles.qrCardTitle}>My Quro Code</Text>
        <Text style={styles.qrCardSubtitle}>
          Friends scan this to add you instantly
        </Text>

        {/* QR placeholder — in production render actual QR via react-native-qrcode-svg */}
        <View style={styles.qrPlaceholder}>
          <View style={styles.qrCornerTL} />
          <View style={styles.qrCornerTR} />
          <View style={styles.qrCornerBL} />
          <View style={styles.qrCornerBR} />
          <Text style={styles.qrPlaceholderText}>{profile.quro_id}</Text>
          <Text style={styles.qrPlaceholderSub}>quro://user/{profile.quro_id}</Text>
        </View>

        <Pressable
          id="btn-share-qr"
          style={styles.shareBtn}
          onPress={handleShare}
        >
          <Text style={styles.shareBtnText}>Share My Code</Text>
        </Pressable>
      </Animated.View>

      {/* Settings list */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Account</Text>

        <SettingsRow
          id="btn-security-center"
          icon="🛡"
          label="Security Center"
          hint="Sessions & scan log"
          onPress={() => router.push('/(app)/security')}
        />
        <SettingsRow
          id="btn-privacy"
          icon="🔒"
          label="Privacy"
          hint="E2EE settings"
          onPress={() => {}}
        />
        <SettingsRow
          id="btn-notifications"
          icon="🔔"
          label="Notifications"
          hint=""
          onPress={() => {}}
        />
        <SettingsRow
          id="btn-sign-out"
          icon="🚪"
          label="Sign Out"
          hint=""
          onPress={handleSignOut}
          danger
        />
      </Animated.View>

      <View style={{ height: SPACING[12] }} />
    </ScrollView>
  );
}

function SettingsRow({
  id,
  icon,
  label,
  hint,
  onPress,
  danger = false,
}: {
  id: string;
  icon: string;
  label: string;
  hint: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable id={id} style={styles.settingsRow} onPress={onPress}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={styles.settingsInfo}>
        <Text style={[styles.settingsLabel, danger && { color: COLORS.error }]}>
          {label}
        </Text>
        {!!hint && <Text style={styles.settingsHint}>{hint}</Text>}
      </View>
      <Text style={styles.settingsChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 56,
  },

  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.brandLight,
    borderTopColor: COLORS.brand,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[4],
    backgroundColor: COLORS.bg,
  },

  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
  },

  editBtn: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.surface,
    borderRadius: RADII.pill,
  },

  editBtnText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.brand,
  },

  profileCard: {
    backgroundColor: COLORS.bg,
    padding: SPACING[6],
    alignItems: 'center',
    gap: SPACING[3],
    marginBottom: SPACING[3],
  },

  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  avatarLetter: {
    fontSize: 40,
    fontFamily: 'Inter-Bold',
    color: COLORS.brandDark,
  },

  displayName: {
    fontSize: FONT_SIZE.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },

  quroIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[1],
    backgroundColor: COLORS.brandLight,
    borderRadius: RADII.pill,
  },

  quroIdLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Medium',
    color: COLORS.textSecondary,
  },

  quroIdValue: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Bold',
    color: COLORS.brandDark,
    letterSpacing: 2,
  },

  qrCard: {
    backgroundColor: COLORS.bg,
    padding: SPACING[6],
    marginBottom: SPACING[3],
    alignItems: 'center',
    gap: SPACING[4],
  },

  qrCardTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },

  qrCardSubtitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    gap: SPACING[2],
  },

  qrCornerTL: { position: 'absolute', top: 12, left: 12, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: COLORS.brand, borderTopLeftRadius: 4 },
  qrCornerTR: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: COLORS.brand, borderTopRightRadius: 4 },
  qrCornerBL: { position: 'absolute', bottom: 12, left: 12, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: COLORS.brand, borderBottomLeftRadius: 4 },
  qrCornerBR: { position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: COLORS.brand, borderBottomRightRadius: 4 },

  qrPlaceholderText: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: 4,
  },

  qrPlaceholderSub: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  shareBtn: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[8],
    backgroundColor: COLORS.brand,
    borderRadius: RADII.pill,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  shareBtnText: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },

  settingsSection: {
    backgroundColor: COLORS.bg,
    marginBottom: SPACING[3],
  },

  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    backgroundColor: COLORS.surface,
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },

  settingsIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },

  settingsInfo: {
    flex: 1,
  },

  settingsLabel: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },

  settingsHint: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  settingsChevron: {
    fontSize: 20,
    color: COLORS.textDisabled,
  },
});
