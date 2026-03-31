// @ts-nocheck
'use client';

/**
 * MessagePane — Real-time E2EE message thread
 *
 * Features:
 * - Loads historical messages from Supabase (encrypted blobs)
 * - Decrypts them client-side using the shared Curve25519 secret
 * - Subscribes to Supabase Realtime for new incoming messages
 * - Sends new messages: encrypt → insert to DB → Realtime delivers to other party
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile, DecryptedMessage } from '@quro/db';
import styles from './MessagePane.module.css';

interface MessagePaneProps {
  conversationId: string;
  otherUser: Profile;
  currentProfile: Profile;
}

export function MessagePane({ conversationId, otherUser, currentProfile }: MessagePaneProps) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadMessages();
    const unsub = subscribeToMessages();
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function loadMessages() {
    setLoading(true);
    try {
      const { createBrowserClient, getMessagesForConversation } = await import('@quro/db');
      const { decryptMessage, deriveSharedSecret, deserializeKeyPair, fromBase64 } = await import('@quro/crypto');

      const supabase = createBrowserClient();
      const { data: rawMessages } = await getMessagesForConversation(supabase, conversationId);

      if (!rawMessages) return;

      // Get our stored private key from sessionStorage (set during login)
      const storedKeys = sessionStorage.getItem('quro_keys');
      if (!storedKeys) {
        console.warn('[Quro/chat] No local keys found — messages will show as encrypted');
        setMessages(rawMessages.map((m) => ({ ...m, plaintext: '[Key not found]', isOwn: m.sender_id === currentProfile.id })));
        return;
      }

      const keyPair = deserializeKeyPair(JSON.parse(storedKeys));
      const theirPublicKeyBytes = new Uint8Array(Buffer.from(otherUser.public_key, 'base64url'));
      const sharedSecret = deriveSharedSecret(keyPair.privateKey, theirPublicKeyBytes);

      const decrypted: DecryptedMessage[] = rawMessages.map((m) => {
        try {
          const plaintext = decryptMessage(sharedSecret, {
            ciphertext: m.ciphertext,
            iv: m.iv,
            tag: m.tag,
          });
          return { ...m, plaintext, isOwn: m.sender_id === currentProfile.id };
        } catch {
          return { ...m, plaintext: null, isOwn: m.sender_id === currentProfile.id };
        }
      });

      setMessages(decrypted);
    } catch (err) {
      console.error('[Quro/chat] Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    let supabase: Awaited<ReturnType<typeof import('@quro/db').createBrowserClient>> | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { createBrowserClient, getChatChannel } = await import('@quro/db');
      supabase = createBrowserClient();

      channel = supabase
        .channel(getChatChannel(conversationId))
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            const newMsg = payload.new as typeof messages[0];

            // Decrypt the incoming message
            try {
              const { decryptMessage, deriveSharedSecret, deserializeKeyPair } = await import('@quro/crypto');
              const storedKeys = sessionStorage.getItem('quro_keys');
              if (!storedKeys) return;

              const keyPair = deserializeKeyPair(JSON.parse(storedKeys));
              const theirPublicKeyBytes = new Uint8Array(Buffer.from(otherUser.public_key, 'base64url'));
              const sharedSecret = deriveSharedSecret(keyPair.privateKey, theirPublicKeyBytes);

              const plaintext = decryptMessage(sharedSecret, {
                ciphertext: newMsg.ciphertext,
                iv: newMsg.iv,
                tag: newMsg.tag,
              });

              const decryptedMsg: DecryptedMessage = {
                ...newMsg,
                plaintext,
                isOwn: newMsg.sender_id === currentProfile.id,
              };

              setMessages((prev) => {
                // Avoid duplicate if we sent it ourselves
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, decryptedMsg];
              });
            } catch (err) {
              console.error('[Quro/chat] Realtime decrypt failed:', err);
            }
          }
        )
        .subscribe();
    })();

    return () => {
      channel?.unsubscribe();
    };
  }

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || sending) return;

    setSending(true);
    setInputValue('');

    try {
      const { createBrowserClient } = await import('@quro/db');
      const { encryptMessage, deriveSharedSecret, deserializeKeyPair } = await import('@quro/crypto');

      const storedKeys = sessionStorage.getItem('quro_keys');
      if (!storedKeys) throw new Error('No local keys');

      const keyPair = deserializeKeyPair(JSON.parse(storedKeys));
      const theirPublicKeyBytes = new Uint8Array(Buffer.from(otherUser.public_key, 'base64url'));
      const sharedSecret = deriveSharedSecret(keyPair.privateKey, theirPublicKeyBytes);

      const { ciphertext, iv, tag } = encryptMessage(sharedSecret, text);

      const supabase = createBrowserClient();
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentProfile.id,
        ciphertext,
        iv,
        tag,
      });

      if (error) throw error;

      // Optimistically add to local state
      const optimistic: DecryptedMessage = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentProfile.id,
        ciphertext,
        iv,
        tag,
        created_at: new Date().toISOString(),
        plaintext: text,
        isOwn: true,
      };

      setMessages((prev) => [...prev, optimistic]);
    } catch (err) {
      console.error('[Quro/chat] Failed to send message:', err);
      setInputValue(text); // Restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className={styles.pane}>
      {/* Header */}
      <div className={styles.header}>
        {otherUser.avatar_url ? (
          <img src={otherUser.avatar_url} alt={otherUser.display_name} className="avatar avatar-md" />
        ) : (
          <div className={`avatar avatar-md ${styles.avatarPlaceholder}`}>
            {otherUser.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className={styles.headerName}>{otherUser.display_name}</p>
          <p className={styles.headerStatus}>
            <LockIcon /> End-to-End Encrypted
          </p>
        </div>
      </div>

      {/* Message list */}
      <div className={styles.messageList} id="message-list">
        {loading ? (
          <div className={styles.loadingCenter}>
            <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--color-brand-light)', borderTopColor: 'var(--color-brand)', borderRadius: '50%' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.noMessages}>
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                className={`${styles.messageRow} ${msg.isOwn ? styles.ownRow : styles.otherRow}`}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              >
                <div className={`bubble ${msg.isOwn ? 'bubble--own' : 'bubble--other'}`}>
                  {msg.plaintext ?? (
                    <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
                      [Decryption failed]
                    </span>
                  )}
                </div>
                <span className={styles.timestamp}>
                  {formatMessageTime(msg.created_at)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className={styles.inputBar}>
        <input
          ref={inputRef}
          id="input-message"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message (encrypted locally before sending)"
          className={styles.messageInput}
          disabled={sending}
        />
        <motion.button
          id="btn-send-message"
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={!inputValue.trim() || sending}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
        >
          <SendIcon />
        </motion.button>
      </div>
    </div>
  );
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function LockIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display: 'inline', marginRight: 3 }}>
      <rect x="1.5" y="4.5" width="7" height="5" rx="1.5" fill="#34C759" />
      <path d="M3 4.5V3a2 2 0 1 1 4 0v1.5" stroke="#34C759" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M17 10L3 3l3.5 7L3 17l14-7z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
