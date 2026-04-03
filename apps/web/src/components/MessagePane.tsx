// @ts-nocheck
'use client';

/**
 * MessagePane — WeChat-style local chat
 * All messages stored in localStorage, never leave the device.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessagePaneProps {
  conversationId: string;
  otherUser: { id: string; display_name: string; avatar_url: string | null };
  currentProfile: { id: string };
}

export function MessagePane({ conversationId, otherUser, currentProfile }: MessagePaneProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = `quro_chat_local_${conversationId}`;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      const initial = [{
        id: `msg-${Date.now()}`,
        sender_id: otherUser.id,
        plaintext: "Hey! Our chat is completely local to your device. 🔐",
        created_at: new Date().toISOString(),
        isOwn: false,
      }];
      setMessages(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    }
  }, [conversationId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

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
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        height: 56, padding: '0 16px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 12,
        backgroundColor: '#EDEDED',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: '#07C160', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 600, fontSize: 14,
        }}>
          {otherUser.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{otherUser.display_name}</p>
          <p style={{ fontSize: 11, color: '#07C160' }}>🔒 Device-Local</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        backgroundColor: '#EDEDED',
      }}>
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.isOwn ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              <div style={{
                padding: '10px 14px',
                borderRadius: 4,
                backgroundColor: msg.isOwn ? '#95EC69' : '#fff',
                color: '#111',
                maxWidth: '75%',
                wordBreak: 'break-word',
                fontSize: 15,
                boxShadow: '0 1px 1px rgba(0,0,0,0.04)',
              }}>
                {msg.plaintext}
              </div>
              <span style={{ fontSize: 11, color: '#CCC', marginTop: 4 }}>
                {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: '#F7F7F7',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '10px 14px',
            backgroundColor: '#fff', borderRadius: 6,
            fontSize: 15, color: '#111',
          }}
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={sendMessage}
          disabled={!inputValue.trim()}
          style={{
            width: 36, height: 36, borderRadius: 6,
            backgroundColor: inputValue.trim() ? '#07C160' : '#A0DCBF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: inputValue.trim() ? 'pointer' : 'default',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M17 10L3 3l3.5 7L3 17l14-7z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
