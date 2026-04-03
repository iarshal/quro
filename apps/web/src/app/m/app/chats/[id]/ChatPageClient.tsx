// @ts-nocheck
'use client';

/**
 * Chat Conversation Page
 * Real-time IndexedDB messaging with a contact.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSession } from '../../../../../lib/localSession';
import { getContact, type QuroContact } from '../../../../../lib/contactsStore';
import { getMessages, sendMessage, addReceivedMessage, type ChatMessage } from '../../../../../lib/chatStore';

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  
  const [contact, setContact] = useState<QuroContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/m/welcome'); return; }
    loadData();
  }, [router, contactId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadData() {
    const c = await getContact(contactId);
    if (c) setContact(c);
    else setContact({ quroCode: contactId, displayName: `User ${contactId}`, addedAt: '' }); // Fallback

    const msgs = await getMessages(contactId);
    setMessages(msgs);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    // Save to DB
    const newMsg = await sendMessage(contactId, text);
    setMessages(prev => [...prev, newMsg]);
    
    // Simulate auto-reply for demo purposes
    if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
      setTimeout(async () => {
        const reply = await addReceivedMessage(contactId, `👋 Hello! This is a secure local chat. Your messages stay on your device.`);
        setMessages(prev => [...prev, reply]);
      }, 1000);
    } else {
      setTimeout(async () => {
        const reply = await addReceivedMessage(contactId, `I received: "${text}"\n(This is an auto-reply demo)`);
        setMessages(prev => [...prev, reply]);
      }, 1500);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: '#F3F4F6' }}>
      {/* Header */}
      <header style={{ 
        display: 'flex', alignItems: 'center', backgroundColor: '#F3F4F6', 
        padding: '12px 16px', borderBottom: '1px solid #E5E7EB', zIndex: 10
      }}>
        <button onClick={() => router.push('/m/app/chats')} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: 0 }}>{contact?.displayName || 'Loading...'}</h1>
          {contact && <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>ID: {contact.quroCode}</p>}
        </div>
        <button style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
            <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 40 }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            End-to-End Encrypted<br/>Local Storage Only
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {!isMe && (
                  <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#E5E7EB', flexShrink: 0, overflow: 'hidden' }}>
                    {contact?.avatarDataUrl ? (
                      <img src={contact.avatarDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontWeight: 600 }}>
                        {contact?.displayName.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{
                    padding: '10px 14px',
                    backgroundColor: isMe ? '#95EC69' : '#fff', // WeChat green or white
                    color: '#111',
                    borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    fontSize: 16,
                    lineHeight: 1.4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text.split('\n').map((line, i) => (
                      <span key={i}>{line}<br/></span>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, margin: isMe ? '4px 4px 0 0' : '4px 0 0 4px' }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ 
        backgroundColor: '#F3F4F6', padding: '10px 12px 30px', borderTop: '1px solid #E5E7EB',
        display: 'flex', alignItems: 'flex-end', gap: 10 
      }}>
        <button type="button" style={{ width: 36, height: 36, borderRadius: 18, border: '1px solid #D1D5DB', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#4B5563' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
          </svg>
        </button>
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, minHeight: 40, display: 'flex', alignItems: 'center', padding: '4px 16px' }}>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Message..."
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, color: '#111', background: 'transparent' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={!inputText.trim()}
          style={{ 
            width: 40, height: 40, borderRadius: 20, border: 'none', 
            backgroundColor: inputText.trim() ? '#07C160' : '#D1D5DB', 
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: inputText.trim() ? 'pointer' : 'not-allowed', flexShrink: 0,
            transition: 'background-color 0.2s'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
