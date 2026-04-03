// @ts-nocheck
'use client';

/**
 * WeChat-Style Chats List
 * Loads conversations from chatStore.ts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getSession } from '../../../../lib/localSession';
import { getConversations, type Conversation } from '../../../../lib/chatStore';
import { getContact } from '../../../../lib/contactsStore';

interface EnrichedConversation extends Conversation {
  displayName: string;
  avatarUrl?: string;
}

export default function MobileChatsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.replace('/m/welcome'); return; }
    loadChats();
  }, [router]);

  async function loadChats() {
    try {
      const convos = await getConversations();
      // Enrich with contact info
      const enriched = await Promise.all(convos.map(async (c) => {
        const contact = await getContact(c.contactCode);
        return {
          ...c,
          displayName: contact?.displayName || c.contactCode,
          avatarUrl: contact?.avatarDataUrl,
        };
      }));
      setConversations(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F0F4F8', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{ backgroundColor: '#F0F4F8', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>Chats</h1>
      </header>

      {/* App Stories / Status horizontally scrollable */}
      <div style={{ padding: '0 0 16px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 20px', gap: 16, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {/* Create Story */}
          <motion.div whileTap={{ scale: 0.95 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px dashed #9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#666' }}>Add Story</span>
          </motion.div>
          
          {/* Real Stories from contacts */}
          {conversations.slice(0, 5).map(c => (
            <motion.div key={c.contactCode} whileTap={{ scale: 0.95 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', padding: 3, background: 'linear-gradient(45deg, #3B82F6, #EC4899)' }}>
                 <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', padding: 2 }}>
                   <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {c.avatarUrl ? <img src={c.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18, fontWeight: 600, color: '#9CA3AF' }}>{c.displayName.charAt(0)}</span>}
                   </div>
                 </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#111', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.displayName}</span>
            </motion.div>
           ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search conversations..." style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#111', backgroundColor: 'transparent', border: 'none', outline: 'none' }} />
        </div>
      </div>

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, color: '#666', margin: 0 }}>No messages yet</p>
            <button onClick={() => router.push('/m/app/contacts')} style={{ padding: '8px 16px', color: '#3B82F6', background: 'none', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Go to Contacts to start chatting
            </button>
          </div>
        ) : (
          conversations.map((chat, i) => (
            <motion.div
              key={chat.contactCode}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => router.push(`/m/app/chats/${chat.contactCode}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px', width: '100%',
                  backgroundColor: '#fff', border: 'none', borderRadius: 20,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 12,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {chat.avatarUrl ? (
                      <img src={chat.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6' }}>{chat.displayName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {chat.unreadCount > 0 && (
                    <div style={{ position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', border: '2px solid #fff' }}>
                      {chat.unreadCount}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.displayName}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', flexShrink: 0 }}>{formatTime(chat.lastMessageAt)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, fontWeight: 500 }}>
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
