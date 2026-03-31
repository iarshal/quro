/**
 * Contacts Tab — View friends and search via Quro ID
 */

import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, RADII, SPACING } from '@quro/ui';

export default function ContactsScreen() {
  const [search, setSearch] = useState('');
  const [friends] = useState([]); // Empty mock

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or Quro ID..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Pressable onPress={() => router.push('/(app)/(tabs)/scanner')} style={styles.actionRow}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.brandLight }]}>
            <Text style={{ fontSize: 20 }}>📸</Text>
          </View>
          <Text style={styles.actionText}>Scan QR Code</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.divider} />

      {friends.length === 0 && !search ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptySub}>Add friends by scanning their QR code or searching their Quro ID.</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={() => null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 56 },
  header: { paddingHorizontal: SPACING[5], paddingBottom: SPACING[3] },
  headerTitle: { fontSize: FONT_SIZE['2xl'], fontFamily: 'Inter-ExtraBold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING[5], borderRadius: RADII.pill, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], marginBottom: SPACING[4], gap: SPACING[2] },
  searchIcon: { fontSize: 18, color: COLORS.textSecondary },
  searchInput: { flex: 1, fontSize: FONT_SIZE.sm, fontFamily: 'Inter-Medium' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[5], paddingVertical: SPACING[3], gap: SPACING[4] },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: FONT_SIZE.md, fontFamily: 'Inter-SemiBold', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING[2] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING[8], gap: SPACING[2], paddingBottom: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontFamily: 'Inter-Bold', color: COLORS.textPrimary },
  emptySub: { fontSize: FONT_SIZE.sm, fontFamily: 'Inter-Regular', color: COLORS.textSecondary, textAlign: 'center' },
});
