/**
 * Chats Tab — Conversation list (home screen of the app)
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING } from '@quro/ui';
import type { ConversationPreview } from '@quro/db';

export default function ChatsScreen() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  async function loadConversations(pull = false) {
    if (pull) setRefreshing(true);
    try {
      const { createBrowserClient } = await import('@quro/db');
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        router.replace('/(auth)/welcome');
        return;
      }
      // Fetch conversations (simplified — join in production)
      setConversations([]); // Replace with real query
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}h`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Pressable
          id="btn-new-conversation"
          style={styles.newBtn}
          onPress={() => router.push('/(app)/contacts')}
        >
          <Text style={styles.newBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchPlaceholder}>Search</Text>
      </View>

      {/* Empty state */}
      {!loading && conversations.length === 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDesc}>
            Scan a friend&apos;s Quro code to start your first encrypted conversation.
          </Text>
          <Pressable
            id="btn-open-scanner-from-empty"
            style={styles.scanBtn}
            onPress={() => router.push('/(app)/(tabs)/scanner')}
          >
            <Text style={styles.scanBtnText}>Open Scanner</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Conversation list */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.conversation.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadConversations(true)}
            tintColor={COLORS.brand}
          />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
            <Pressable
              id={`chat-item-${item.conversation.id}`}
              style={styles.chatRow}
              onPress={() => router.push(`/(app)/chat/${item.conversation.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {item.otherUser.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.chatTopRow}>
                  <Text style={styles.chatName}>{item.otherUser.display_name}</Text>
                  {item.lastMessageAt && (
                    <Text style={styles.chatTime}>{formatTime(item.lastMessageAt)}</Text>
                  )}
                </View>
                <View style={styles.chatBottomRow}>
                  <Text style={styles.chatPreview} numberOfLines={1}>🔒 Encrypted message</Text>
                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 56,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[3],
  },

  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
  },

  newBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  newBtnText: {
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 24,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginHorizontal: SPACING[5],
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.surface,
    borderRadius: RADII.pill,
  },

  searchIcon: {
    fontSize: 17,
    color: COLORS.textSecondary,
  },

  searchPlaceholder: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  list: {
    flexGrow: 1,
  },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  avatarLetter: {
    fontSize: FONT_SIZE.lg,
    fontFamily: 'Inter-Bold',
    color: COLORS.brandDark,
  },

  chatInfo: {
    flex: 1,
    gap: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING[3],
  },

  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  chatName: {
    fontSize: FONT_SIZE.md,
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textPrimary,
  },

  chatTime: {
    fontSize: FONT_SIZE.xs,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
  },

  chatBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  chatPreview: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    flex: 1,
  },

  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  unreadCount: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[4],
    paddingHorizontal: SPACING[8],
    paddingBottom: SPACING[16],
  },

  emptyEmoji: {
    fontSize: 56,
  },

  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: 'Inter-Bold',
    color: COLORS.textPrimary,
  },

  emptyDesc: {
    fontSize: FONT_SIZE.sm,
    fontFamily: 'Inter-Regular',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  scanBtn: {
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

  scanBtnText: {
    fontSize: FONT_SIZE.base,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
