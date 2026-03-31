/**
 * E2EE Message Thread (Mobile)
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { COLORS, FONT_SIZE, RADII, SPACING } from '@quro/ui';
import type { DecryptedMessage } from '@quro/db';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Mock load for structure
    setMessages([{
      id: '1', conversation_id: conversationId, sender_id: 'me',
      ciphertext: '', iv: '', tag: '', created_at: new Date().toISOString(),
      plaintext: 'End-to-End Encryption established.', isOwn: false,
    }]);
  }, [conversationId]);

  function sendMessage() {
    if (!input.trim()) return;
    setMessages(p => [...p, {
      id: `m-${Date.now()}`, conversation_id: conversationId, sender_id: 'me',
      ciphertext: '', iv: '', tag: '', created_at: new Date().toISOString(),
      plaintext: input.trim(), isOwn: true,
    }]);
    setInput('');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>←</Text></Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Encrypted Chat</Text>
          <Text style={styles.headerSub}>🔒 Secured with Curve25519</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubbleWrapper, item.isOwn ? styles.ownWrapper : styles.otherWrapper]}>
            <View style={[styles.bubble, item.isOwn ? styles.ownBubble : styles.otherBubble]}>
              <Text style={[styles.msgText, item.isOwn ? styles.ownText : styles.otherText]}>{item.plaintext}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Encrypted message"
          value={input}
          onChangeText={setInput}
          placeholderTextColor={COLORS.textSecondary}
        />
        <Pressable onPress={sendMessage} style={styles.sendBtn} disabled={!input.trim()}>
          <Text style={styles.sendEmoji}>↗</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 56, paddingBottom: SPACING[3], paddingHorizontal: SPACING[4], flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderColor: COLORS.border },
  backBtn: { width: 40, alignItems: 'center'},
  backText: { fontSize: 24, color: COLORS.textPrimary },
  headerInfo: { flex: 1, paddingLeft: SPACING[2] },
  headerTitle: { fontSize: FONT_SIZE.md, fontFamily: 'Inter-Bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONT_SIZE.xs, color: COLORS.success, fontFamily: 'Inter-Medium' },
  list: { padding: SPACING[4], gap: SPACING[2] },
  bubbleWrapper: { width: '100%', flexDirection: 'row' },
  ownWrapper: { justifyContent: 'flex-end' },
  otherWrapper: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', padding: SPACING[3], borderRadius: RADII.xl },
  ownBubble: { backgroundColor: COLORS.brand, borderBottomRightRadius: RADII.sm },
  otherBubble: { backgroundColor: COLORS.surface, borderBottomLeftRadius: RADII.sm },
  msgText: { fontSize: FONT_SIZE.md, fontFamily: 'Inter-Regular', lineHeight: 22 },
  ownText: { color: '#FFF' },
  otherText: { color: COLORS.textPrimary },
  inputBar: { flexDirection: 'row', padding: SPACING[3], borderTopWidth: 0.5, borderColor: COLORS.border, backgroundColor: COLORS.bg, alignItems: 'center', gap: SPACING[2] },
  input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADII.pill, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], fontSize: FONT_SIZE.base, fontFamily: 'Inter-Regular' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  sendEmoji: { fontSize: 20, color: '#FFF' },
});
