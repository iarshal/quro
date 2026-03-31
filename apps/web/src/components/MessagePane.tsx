// @ts-nocheck
'use client';

/**
 * MessagePane — Local Device-Only Chat
 *
 * Modified per architecture mandate to ensure chat *never* leaves the device.
 * Stores data purely in LocalStorage (No cloud sync, no Supabase, no E2EE).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './MessagePane.module.css';

interface MessagePaneProps {
  conversationId: string;
  otherUser: { id: string; display_name: string; avatar_url: string | null };
  currentProfile: { id: string };
}

export function MessagePane({ conversationId, otherUser, currentProfile }: MessagePaneProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = `quro_chat_local_${conversationId}`;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function loadMessages() {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Initial mock message from the other person so it's not empty
        const initialMock = [{
          id: `msg-${Date.now()}`,
          sender_id: otherUser.id,
          plaintext: "Hey! Our chat is completely local to your device now. No cloud servers.",
          created_at: new Date().toISOString(),
          isOwn: false
        }];
        setMessages(initialMock);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMock));
      }
    } catch (err) {
      console.error('[Quro/local-chat] Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  function sendMessage() {
    const text = inputValue.trim();
    if (!text || sending) return;

    setSending(true);
    setInputValue('');

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender_id: currentProfile.id,
      plaintext: text,
      created_at: new Date().toISOString(),
      isOwn: true,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Simulate auto-reply so the local-only UI feels alive
    simulateReply(updated);

    setSending(false);
    inputRef.current?.focus();
  }

  function simulateReply(history: any[]) {
    setTimeout(() => {
      const reply = {
        id: `reply-${Date.now()}`,
        sender_id: otherUser.id,
        plaintext: "Got it! (Auto-replying, this didn't leave your phone)",
        created_at: new Date().toISOString(),
        isOwn: false,
      };
      
      const newHistory = [...history, reply];
      setMessages(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }, 1500);
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
          <div className={`avatar avatar-md ${styles.avatarPlaceholder}`} style={{ backgroundColor: 'var(--color-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%'}}>
            {otherUser.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ marginLeft: 12 }}>
          <p className={styles.headerName} style={{ margin: 0, fontWeight: 600 }}>{otherUser.display_name}</p>
          <p className={styles.headerStatus} style={{ margin: 0, fontSize: 13, color: '#34C759', display: 'flex', alignItems: 'center' }}>
            <LockIcon /> Device-Local (No Server)
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
          <div className={styles.noMessages} style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`${styles.messageRow} ${msg.isOwn ? styles.ownRow : styles.otherRow}`}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isOwn ? 'flex-end' : 'flex-start', margin: '12px 16px' }}
              >
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 18,
                  backgroundColor: msg.isOwn ? '#07C160' : '#FFF',
                  color: msg.isOwn ? '#FFF' : '#111',
                  maxWidth: '75%',
                  boxShadow: msg.isOwn ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  wordBreak: 'break-word'
                }}>
                  {msg.plaintext}
                </div>
                <span className={styles.timestamp} style={{ fontSize: 11, color: '#CCC', marginTop: 4 }}>
                  {formatMessageTime(msg.created_at)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className={styles.inputBar} style={{ padding: '12px 16px', backgroundColor: '#F7F7F7', borderTop: '1px solid #EBEBEB', display: 'flex', gap: 12 }}>
        <input
          ref={inputRef}
          id="input-message"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message (stored only on this device)"
          className={styles.messageInput}
          disabled={sending}
          style={{ flex: 1, padding: '10px 16px', borderRadius: 20, border: 'none', outline: 'none', backgroundColor: '#FFF' }}
        />
        <motion.button
          id="btn-send-message"
          className={styles.sendBtn}
          onClick={sendMessage}
          disabled={!inputValue.trim() || sending}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: inputValue.trim() ? '#07C160' : '#E0E0E0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <SendIcon opacity={inputValue.trim() ? 1 : 0.5} />
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
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display: 'inline', marginRight: 4 }}>
      <rect x="1.5" y="4.5" width="7" height="5" rx="1.5" fill="#34C759" />
      <path d="M3 4.5V3a2 2 0 1 1 4 0v1.5" stroke="#34C759" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function SendIcon({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ opacity }}>
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
