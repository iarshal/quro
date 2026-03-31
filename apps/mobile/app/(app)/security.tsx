/**
 * Security Center — Active desktop sessions + scan audit log
 * Users can see all devices that are logged in and revoke them with one tap.
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT_SIZE, RADII, SPACING } from '@quro/ui';
import type { DesktopSession, ScanLog } from '@quro/db';

export default function SecurityScreen() {
  const [sessions, setSessions] = useState<DesktopSession[]>([]);
  const [scanLog, setScanLog] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const { createBrowserClient } = await import('@quro/db');
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [sessionsRes, logsRes] = await Promise.all([
        supabase
          .from('desktop_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('scan_log')
          .select('*')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(50),
      ]);

      setSessions(sessionsRes.data ?? []);
      setScanLog(logsRes.data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function revokeSession(sessionToken: string) {
    Alert.alert(
      'End Session?',
      'This will immediately log out the browser session. The device will need to scan a new QR code to log back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { createBrowserClient } = await import('@quro/db');
            const supabase = createBrowserClient();
            await supabase
              .from('desktop_sessions')
              .update({ is_active: false })
              .eq('session_token', sessionToken);
            setSessions((s) => s.filter((x) => x.session_token !== sessionToken));
          },
        },
      ]
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Pressable id="btn-back-security" onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Security Center</Text>
      </Pressable>

      {/* Active Sessions */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.sectionTitle}>Active Desktop Sessions</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <View style={styles.skeleton} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No active desktop sessions</Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.session_token} style={styles.sessionCard}>
              <View style={styles.sessionIcon}>
                <Text style={styles.sessionIconText}>💻</Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDevice}>
                  {(session.device_info as Record<string, string> | null)?.deviceName ?? 'Web Browser'}
                </Text>
                <Text style={styles.sessionTime}>
                  Logged in: {formatDate(session.created_at)}
                </Text>
                <Text style={styles.sessionExpiry}>
                  Expires: {formatDate(session.expires_at)}
                </Text>
              </View>
              <Pressable
                id={`btn-revoke-${session.session_token.slice(0, 8)}`}
                style={styles.revokeBtn}
                onPress={() => revokeSession(session.session_token)}
              >
                <Text style={styles.revokeBtnText}>End</Text>
              </Pressable>
            </View>
          ))
        )}
      </Animated.View>

      {/* Scan Log */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginTop: SPACING[6] }}>
        <Text style={styles.sectionTitle}>Recent QR Scans</Text>
        <Text style={styles.sectionSubtitle}>
          Every scan is logged for your security. Only you can see this.
        </Text>

        {loading ? (
          <View style={styles.loadingRow}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.skeleton, { marginBottom: SPACING[2] }]} />
            ))}
          </View>
        ) : scanLog.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>No scan history yet</Text>
          </View>
        ) : (
          scanLog.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logIcon}>
                {log.scan_type === 'desktop_login' ? '💻' : '👤'}
              </Text>
              <View style={styles.logInfo}>
                <Text style={styles.logType}>
                  {log.scan_type === 'desktop_login' ? 'Desktop Login' : 'Friend Add'}
                </Text>
                <Text style={styles.logTime}>{formatDate(log.scanned_at)}</Text>
              </View>
              <View style={[
                styles.logBadge,
                { backgroundColor: log.scan_type === 'desktop_login' ? '#EEF2FF' : '#ECFDF5' }
              ]}>
                <Text style={[
                  styles.logBadgeText,
                  { color: log.scan_type === 'desktop_login' ? '#4F46E5' : '#059669' }
                ]}>
                  {log.scan_type === 'desktop_login' ? 'Login' : 'Add'}
                </Text>
              </View>
            </View>
          ))
        )}
      </Animated.View>

      <View style={{ height: SPACING[12] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingTop: 56,
  },

  backBtn: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
  },

  backText: {
    fontSize: FONT_SIZE.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },

  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  sectionSubtitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING[5],
    marginTop: -SPACING[2],
    marginBottom: SPACING[3],
    lineHeight: 18,
  },

  loadingRow: {
    paddingHorizontal: SPACING[5],
    gap: SPACING[2],
  },

  skeleton: {
    height: 72,
    backgroundColor: COLORS.bg,
    borderRadius: RADII.lg,
    opacity: 0.7,
  },

  emptySection: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[6],
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },

  emptyText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },

  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  sessionIconText: {
    fontSize: 22,
  },

  sessionInfo: {
    flex: 1,
    gap: 2,
  },

  sessionDevice: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },

  sessionTime: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  sessionExpiry: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textDisabled,
  },

  revokeBtn: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: '#FFF0EE',
    borderRadius: RADII.pill,
  },

  revokeBtnText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.error,
  },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },

  logIcon: {
    fontSize: 20,
    width: 28,
  },

  logInfo: {
    flex: 1,
  },

  logType: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Medium',
    color: COLORS.textPrimary,
  },

  logTime: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  logBadge: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: RADII.pill,
  },

  logBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-SemiBold',
  },
});
